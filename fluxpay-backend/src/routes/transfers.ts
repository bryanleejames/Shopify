import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { getDb } from '../db/database';
import { authenticateToken } from '../middleware/auth';
import {
  createConnectAccount,
  linkBankAccount,
  createInstantTransfer,
  isMockMode,
} from '../services/stripe';

const router = Router();

// POST /wallet/link-bank — link a bank account (creates Stripe Connect account if needed)
router.post('/link-bank', authenticateToken, async (req: Request, res: Response) => {
  try {
    const db = getDb();
    const userId = req.user!.userId;

    const { account_holder_name, routing_number, account_number } = req.body as {
      account_holder_name?: string; routing_number?: string; account_number?: string;
    };

    // Get user and wallet
    const user = db.prepare('SELECT email, COALESCE(display_name, full_name) as name FROM users WHERE id = ?')
      .get(userId) as { email: string; name: string } | undefined;

    const wallet = db.prepare('SELECT id, stripe_account_id FROM wallets WHERE user_id = ?')
      .get(userId) as { id: string; stripe_account_id: string | null } | undefined;

    if (!user || !wallet) {
      res.status(404).json({ error: 'User or wallet not found' });
      return;
    }

    // Create Stripe Connect account if user doesn't have one
    let stripeAccountId = wallet.stripe_account_id;
    if (!stripeAccountId) {
      const { accountId } = await createConnectAccount(user.email, user.name);
      stripeAccountId = accountId;

      // Save to user and wallet
      db.prepare('UPDATE users SET stripe_account_id = ? WHERE id = ?')
        .run(stripeAccountId, userId);
      db.prepare('UPDATE wallets SET stripe_account_id = ? WHERE id = ?')
        .run(stripeAccountId, wallet.id);
    }

    // Link bank account
    const bankAccount = await linkBankAccount(
      stripeAccountId,
      account_holder_name || user.name,
      routing_number,
      account_number
    );

    // Save bank account to our database
    const bankId = uuidv4();
    db.prepare(`
      INSERT INTO bank_accounts (id, user_id, stripe_bank_account_id, bank_name, last_four, routing_number, account_holder_name, account_type, is_default, status, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      bankId, userId, bankAccount.id, bankAccount.bank_name,
      bankAccount.last_four, bankAccount.routing_number,
      bankAccount.account_holder_name, bankAccount.account_type,
      1, // is_default
      bankAccount.status,
      new Date().toISOString(), new Date().toISOString()
    );

    // Update wallet's linked_bank field
    db.prepare('UPDATE wallets SET linked_bank = ?, updated_at = ? WHERE id = ?')
      .run(`${bankAccount.bank_name} (${bankAccount.last_four})`, new Date().toISOString(), wallet.id);

    res.status(201).json({
      id: bankId,
      bank_name: bankAccount.bank_name,
      last_four: bankAccount.last_four,
      routing_number: bankAccount.routing_number,
      account_holder_name: bankAccount.account_holder_name,
      account_type: bankAccount.account_type,
      is_default: true,
      status: bankAccount.status,
    });
  } catch (error: any) {
    console.error('[Wallet] Link bank error:', error);
    res.status(500).json({ error: error.message || 'Failed to link bank account' });
  }
});

// GET /wallet/bank-accounts — list linked bank accounts
router.get('/bank-accounts', authenticateToken, (req: Request, res: Response) => {
  try {
    const db = getDb();
    const accounts = db.prepare(`
      SELECT id, stripe_bank_account_id, bank_name, last_four, routing_number,
             account_holder_name, account_type, is_default, status, created_at
      FROM bank_accounts WHERE user_id = ?
      ORDER BY is_default DESC, created_at DESC
    `).all(req.user!.userId) as Array<{
      id: string; stripe_bank_account_id: string | null; bank_name: string;
      last_four: string; routing_number: string | null; account_holder_name: string;
      account_type: string; is_default: number; status: string; created_at: string;
    }>;

    res.json({
      data: accounts.map(a => ({
        ...a,
        is_default: a.is_default === 1,
      })),
    });
  } catch (error) {
    console.error('[Wallet] Bank accounts error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /wallet/instant-transfer — transfer to bank with 1.5% fee
router.post('/instant-transfer', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { amount, bank_account_id } = req.body as {
      amount: number; bank_account_id: string;
    };

    if (!amount || amount <= 0) {
      res.status(400).json({ error: 'Amount must be greater than 0' });
      return;
    }

    if (!bank_account_id) {
      res.status(400).json({ error: 'Bank account ID is required' });
      return;
    }

    const db = getDb();
    const userId = req.user!.userId;

    // Get wallet
    const wallet = db.prepare('SELECT id, balance, stripe_account_id FROM wallets WHERE user_id = ?')
      .get(userId) as { id: string; balance: number; stripe_account_id: string | null } | undefined;

    if (!wallet) {
      res.status(404).json({ error: 'Wallet not found' });
      return;
    }

    // Get bank account
    const bankAccount = db.prepare(`
      SELECT id, stripe_bank_account_id, bank_name, last_four, account_holder_name
      FROM bank_accounts WHERE id = ? AND user_id = ?
    `).get(bank_account_id, userId) as {
      id: string; stripe_bank_account_id: string | null;
      bank_name: string; last_four: string; account_holder_name: string;
    } | undefined;

    if (!bankAccount) {
      res.status(404).json({ error: 'Bank account not found' });
      return;
    }

    // Calculate fee (1.5%)
    const fee = Math.round(amount * 0.015 * 100) / 100;
    const totalDeduction = amount + fee;

    if (wallet.balance < totalDeduction) {
      res.status(400).json({
        error: `Insufficient balance. Need $${totalDeduction} ($${amount} + $${fee} fee), but have $${wallet.balance}`,
      });
      return;
    }

    if (!wallet.stripe_account_id) {
      res.status(400).json({ error: 'No Stripe account linked. Please link a bank account first.' });
      return;
    }

    // Process transfer via Stripe (or mock)
    const transfer = await createInstantTransfer(
      wallet.stripe_account_id,
      bankAccount.stripe_bank_account_id || bank_account_id,
      amount,
      'usd'
    );

    const now = new Date().toISOString();
    const transferTxId = uuidv4();
    const feeTxId = uuidv4();

    // Record transactions
    const executeTransferTx = db.transaction(() => {
      // Deduct from wallet (amount + fee)
      db.prepare('UPDATE wallets SET balance = balance - ?, updated_at = ? WHERE id = ?')
        .run(totalDeduction, now, wallet.id);

      // Record the transfer transaction
      db.prepare(`
        INSERT INTO transactions (id, sender_wallet_id, amount, currency, type, status, counterparty_name, description, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        transferTxId, wallet.id, amount, 'USD',
        'instant_transfer', 'completed',
        `${bankAccount.bank_name} (${bankAccount.last_four})`,
        `Instant transfer of USD ${amount} to ${bankAccount.account_holder_name}`,
        now
      );

      // Record the fee transaction
      db.prepare(`
        INSERT INTO transactions (id, sender_wallet_id, amount, currency, type, status, counterparty_name, description, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        feeTxId, wallet.id, fee, 'USD',
        'fee', 'completed',
        'FluxPay',
        `Instant transfer fee (1.5%) — USD ${fee}`,
        now
      );
    });

    executeTransferTx();

    res.status(201).json({
      transfer_id: transfer.id,
      amount,
      fee,
      net_amount: amount - fee,
      total_deducted: totalDeduction,
      status: transfer.status,
      estimated_arrival: transfer.estimated_arrival,
      bank_account: {
        bank_name: bankAccount.bank_name,
        last_four: bankAccount.last_four,
      },
      timestamp: now,
    });
  } catch (error: any) {
    console.error('[Wallet] Instant transfer error:', error);
    res.status(500).json({ error: error.message || 'Transfer failed' });
  }
});

// POST /wallet/standard-transfer — free transfer (placeholder, 1-3 business days)
router.post('/standard-transfer', authenticateToken, (req: Request, res: Response) => {
  try {
    const { amount, bank_account_id } = req.body as {
      amount: number; bank_account_id: string;
    };

    if (!amount || amount <= 0) {
      res.status(400).json({ error: 'Amount must be greater than 0' });
      return;
    }

    if (!bank_account_id) {
      res.status(400).json({ error: 'Bank account ID is required' });
      return;
    }

    const db = getDb();
    const userId = req.user!.userId;

    const wallet = db.prepare('SELECT id, balance FROM wallets WHERE user_id = ?')
      .get(userId) as { id: string; balance: number } | undefined;

    if (!wallet) {
      res.status(404).json({ error: 'Wallet not found' });
      return;
    }

    if (wallet.balance < amount) {
      res.status(400).json({ error: `Insufficient balance. Need $${amount}, have $${wallet.balance}` });
      return;
    }

    const bankAccount = db.prepare(`
      SELECT id, bank_name, last_four, account_holder_name
      FROM bank_accounts WHERE id = ? AND user_id = ?
    `).get(bank_account_id, userId) as {
      id: string; bank_name: string; last_four: string; account_holder_name: string;
    } | undefined;

    if (!bankAccount) {
      res.status(404).json({ error: 'Bank account not found' });
      return;
    }

    const now = new Date().toISOString();
    const txId = uuidv4();

    db.prepare('UPDATE wallets SET balance = balance - ?, updated_at = ? WHERE id = ?')
      .run(amount, now, wallet.id);

    db.prepare(`
      INSERT INTO transactions (id, sender_wallet_id, amount, currency, type, status, counterparty_name, description, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      txId, wallet.id, amount, 'USD',
      'standard_transfer', 'completed',
      `${bankAccount.bank_name} (${bankAccount.last_four})`,
      `Standard transfer of USD ${amount} to ${bankAccount.account_holder_name} (1-3 business days)`,
      now
    );

    res.status(201).json({
      id: txId,
      amount,
      fee: 0,
      net_amount: amount,
      status: 'pending',
      estimated_arrival: '1-3 business days',
      bank_account: {
        bank_name: bankAccount.bank_name,
        last_four: bankAccount.last_four,
      },
      timestamp: now,
    });
  } catch (error) {
    console.error('[Wallet] Standard transfer error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;