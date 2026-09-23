import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { getDb } from '../db/database';
import { authenticateToken } from '../middleware/auth';
import { sendPushNotification } from '../services/notifications';
import { Transaction, TransactionRecord } from '../types';

const router = Router();

// Fire-and-forget notification dispatch (never blocks the HTTP response)
function notify(userId: string, payload: { title: string; body: string; type?: string; data?: Record<string, string> }): void {
  sendPushNotification(userId, payload).catch((err) => {
    console.error('[Transactions] Notification dispatch failed:', err);
  });
}

// Helper: format a transaction row into a response object
function formatTransaction(row: TransactionRecord, currentWalletId: string): Transaction {
  const isSender = row.sender_wallet_id === currentWalletId;
  return {
    id: row.id,
    amount: row.amount,
    currency: row.currency,
    type: row.type === 'request'
      ? (isSender ? 'request' as const : 'receive' as const)
      : (isSender ? 'send' as const : 'receive' as const),
    status: row.status as Transaction['status'],
    counterparty_name: row.counterparty_name || 'Unknown',
    description: row.description || '',
    note: row.note || undefined,
    created_at: row.created_at,
  };
}

// GET /transactions — list transactions with pagination
router.get('/', authenticateToken, (req: Request, res: Response) => {
  try {
    const limit = Math.min(Math.max(parseInt(req.query.limit as string) || 20, 1), 100);
    const offset = Math.max(parseInt(req.query.offset as string) || 0, 0);

    const db = getDb();

    const wallet = db.prepare('SELECT id FROM wallets WHERE user_id = ?')
      .get(req.user!.userId) as { id: string } | undefined;

    if (!wallet) {
      res.status(404).json({ error: 'Wallet not found' });
      return;
    }

    const countResult = db.prepare(`
      SELECT COUNT(*) as total FROM transactions
      WHERE sender_wallet_id = ? OR receiver_wallet_id = ?
    `).get(wallet.id, wallet.id) as { total: number };

    const rows = db.prepare(`
      SELECT t.id, t.amount, t.currency, t.type, t.status,
             t.counterparty_name, t.description, t.note, t.created_at,
             t.sender_wallet_id, t.receiver_wallet_id
      FROM transactions t
      WHERE t.sender_wallet_id = ? OR t.receiver_wallet_id = ?
      ORDER BY t.created_at DESC
      LIMIT ? OFFSET ?
    `).all(wallet.id, wallet.id, limit, offset) as TransactionRecord[];

    const transactions: Transaction[] = rows.map((row) => formatTransaction(row, wallet.id));

    res.json({
      data: transactions,
      total: countResult.total,
      limit,
      offset,
      has_more: offset + limit < countResult.total,
    });
  } catch (error) {
    console.error('[Transactions] List error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /transactions/pending — get pending requests sent TO the current user
router.get('/pending', authenticateToken, (req: Request, res: Response) => {
  try {
    const db = getDb();

    const wallet = db.prepare('SELECT id FROM wallets WHERE user_id = ?')
      .get(req.user!.userId) as { id: string } | undefined;

    if (!wallet) {
      res.status(404).json({ error: 'Wallet not found' });
      return;
    }

    const rows = db.prepare(`
      SELECT t.id, t.amount, t.currency, t.type, t.status,
             t.counterparty_name, t.description, t.note, t.created_at,
             t.sender_wallet_id, t.receiver_wallet_id
      FROM transactions t
      WHERE t.sender_wallet_id = ?
        AND t.type = 'request'
        AND t.status = 'pending'
      ORDER BY t.created_at DESC
    `).all(wallet.id) as TransactionRecord[];

    const transactions: Transaction[] = rows.map((row) => ({
      id: row.id,
      amount: row.amount,
      currency: row.currency,
      type: 'request' as const,
      status: 'pending' as const,
      counterparty_name: row.counterparty_name || 'Unknown',
      description: row.description || '',
      note: row.note || undefined,
      created_at: row.created_at,
    }));

    res.json({ data: transactions, total: transactions.length });
  } catch (error) {
    console.error('[Transactions] Pending error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /transactions/:id — get single transaction detail
router.get('/:id', authenticateToken, (req: Request, res: Response) => {
  try {
    const db = getDb();
    const wallet = db.prepare('SELECT id FROM wallets WHERE user_id = ?')
      .get(req.user!.userId) as { id: string } | undefined;

    if (!wallet) {
      res.status(404).json({ error: 'Wallet not found' });
      return;
    }

    const row = db.prepare(`
      SELECT t.id, t.amount, t.currency, t.type, t.status,
             t.counterparty_name, t.description, t.note, t.created_at,
             t.sender_wallet_id, t.receiver_wallet_id
      FROM transactions t
      WHERE t.id = ? AND (t.sender_wallet_id = ? OR t.receiver_wallet_id = ?)
    `).get(req.params.id, wallet.id, wallet.id) as TransactionRecord | undefined;

    if (!row) {
      res.status(404).json({ error: 'Transaction not found' });
      return;
    }

    res.json(formatTransaction(row, wallet.id));
  } catch (error) {
    console.error('[Transactions] Detail error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /transactions/send — send money to another user
router.post('/send', authenticateToken, (req: Request, res: Response) => {
  try {
    const { amount, currency, recipient_id, note } = req.body as {
      amount: number; currency?: string; recipient_id: string; note?: string;
    };

    if (!amount || amount <= 0) {
      res.status(400).json({ error: 'Amount must be greater than 0' });
      return;
    }

    if (!recipient_id) {
      res.status(400).json({ error: 'Recipient ID is required' });
      return;
    }

    const db = getDb();

    const senderWallet = db.prepare(
      'SELECT id, balance, user_id FROM wallets WHERE user_id = ?'
    ).get(req.user!.userId) as { id: string; balance: number; user_id: string } | undefined;

    if (!senderWallet) {
      res.status(404).json({ error: 'Sender wallet not found' });
      return;
    }

    if (senderWallet.balance < amount) {
      res.status(400).json({ error: 'Insufficient balance' });
      return;
    }

    // --- Weekly Limit Enforcement ---
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const weeklySpent = db.prepare(`
      SELECT COALESCE(SUM(t.amount), 0) as total
      FROM transactions t
      WHERE t.sender_wallet_id = ?
        AND t.type IN ('send', 'instant_transfer', 'standard_transfer')
        AND t.status = 'completed'
        AND t.created_at >= ?
    `).get(senderWallet.id, sevenDaysAgo) as { total: number };

    // Get weekly limit from subscription or wallet default
    const sub = db.prepare(
      'SELECT transfer_limit, active FROM subscriptions WHERE user_id = ?'
    ).get(req.user!.userId) as { transfer_limit: number; active: number } | undefined;
    const weeklyLimit = sub && sub.active ? sub.transfer_limit : 5000;

    if (weeklySpent.total + amount > weeklyLimit) {
      const remaining = Math.max(0, weeklyLimit - weeklySpent.total);
      res.status(400).json({
        error: `Weekly limit exceeded. You've spent ${weeklySpent.total} this week (limit: ${weeklyLimit}). Remaining: ${remaining}`,
      });
      return;
    }

    const recipientWallet = db.prepare(
      'SELECT id, balance, user_id FROM wallets WHERE user_id = ?'
    ).get(recipient_id) as { id: string; balance: number; user_id: string } | undefined;

    if (!recipientWallet) {
      res.status(404).json({ error: 'Recipient wallet not found' });
      return;
    }

    if (senderWallet.id === recipientWallet.id) {
      res.status(400).json({ error: 'Cannot send money to yourself' });
      return;
    }

    const recipientUser = db.prepare(
      'SELECT COALESCE(display_name, full_name) as name FROM users WHERE id = ?'
    ).get(recipient_id) as { name: string } | undefined;

    const senderUser = db.prepare(
      'SELECT COALESCE(display_name, full_name) as name FROM users WHERE id = ?'
    ).get(req.user!.userId) as { name: string } | undefined;

    const now = new Date().toISOString();
    const trxId = uuidv4();
    const sendCurrency = (currency || 'USD').toUpperCase();

    const executeTransfer = db.transaction(() => {
      db.prepare('UPDATE wallets SET balance = balance - ?, updated_at = ? WHERE id = ?')
        .run(amount, now, senderWallet.id);
      db.prepare('UPDATE wallets SET balance = balance + ?, updated_at = ? WHERE id = ?')
        .run(amount, now, recipientWallet.id);

      db.prepare(`
        INSERT INTO transactions (id, sender_wallet_id, receiver_wallet_id, amount, currency, type, status, counterparty_name, description, note, created_at)
        VALUES (?, ?, ?, ?, ?, 'send', 'completed', ?, ?, ?, ?)
      `).run(trxId, senderWallet.id, recipientWallet.id, amount, sendCurrency,
        recipientUser?.name || 'Unknown', `Sent ${sendCurrency} ${amount}`, note || null, now);

      db.prepare(`
        INSERT INTO transactions (id, sender_wallet_id, receiver_wallet_id, amount, currency, type, status, counterparty_name, description, note, created_at)
        VALUES (?, ?, ?, ?, ?, 'receive', 'completed', ?, ?, ?, ?)
      `).run(uuidv4(), senderWallet.id, recipientWallet.id, amount, sendCurrency,
        senderUser?.name || 'Unknown', `Received ${sendCurrency} ${amount}`, note || null, now);
    });

    executeTransfer();

    // Notify recipient of incoming payment
    notify(recipientWallet.user_id, {
      title: 'Money received',
      body: `${senderUser?.name || 'Someone'} sent you ${sendCurrency} ${amount}`,
      type: 'transaction_received',
      data: { transaction_id: trxId, amount: String(amount), currency: sendCurrency },
    });

    res.status(201).json({
      id: trxId, amount, currency: sendCurrency, type: 'send', status: 'completed',
      counterparty_name: recipientUser?.name || 'Unknown',
      description: `Sent ${sendCurrency} ${amount}`,
      note: note || undefined, created_at: now,
    });
  } catch (error) {
    console.error('[Transactions] Send error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /transactions/request — request money from another user
router.post('/request', authenticateToken, (req: Request, res: Response) => {
  try {
    const { amount, currency, from_user_id, note } = req.body as {
      amount: number; currency?: string; from_user_id: string; note?: string;
    };

    if (!amount || amount <= 0) {
      res.status(400).json({ error: 'Amount must be greater than 0' });
      return;
    }

    if (!from_user_id) {
      res.status(400).json({ error: 'From user ID is required' });
      return;
    }

    const db = getDb();

    const requesterWallet = db.prepare(
      'SELECT id, user_id FROM wallets WHERE user_id = ?'
    ).get(req.user!.userId) as { id: string; user_id: string } | undefined;

    if (!requesterWallet) {
      res.status(404).json({ error: 'Wallet not found' });
      return;
    }

    const fromWallet = db.prepare(
      'SELECT id, user_id FROM wallets WHERE user_id = ?'
    ).get(from_user_id) as { id: string; user_id: string } | undefined;

    if (!fromWallet) {
      res.status(404).json({ error: 'Target user wallet not found' });
      return;
    }

    if (requesterWallet.id === fromWallet.id) {
      res.status(400).json({ error: 'Cannot request money from yourself' });
      return;
    }

    const fromUser = db.prepare(
      'SELECT COALESCE(display_name, full_name) as name FROM users WHERE id = ?'
    ).get(from_user_id) as { name: string } | undefined;

    const now = new Date().toISOString();
    const trxId = uuidv4();
    const reqCurrency = (currency || 'USD').toUpperCase();

    db.prepare(`
      INSERT INTO transactions (id, sender_wallet_id, receiver_wallet_id, amount, currency, type, status, counterparty_name, description, note, created_at)
      VALUES (?, ?, ?, ?, ?, 'request', 'pending', ?, ?, ?, ?)
    `).run(trxId, fromWallet.id, requesterWallet.id, amount, reqCurrency,
      fromUser?.name || 'Unknown', `Requested ${reqCurrency} ${amount}`, note || null, now);

    // Notify the person being requested from
    const requesterName = db.prepare(
      'SELECT COALESCE(display_name, full_name) as name FROM users WHERE id = ?'
    ).get(req.user!.userId) as { name: string } | undefined;
    notify(fromWallet.user_id, {
      title: 'Payment request',
      body: `${requesterName?.name || 'Someone'} requested ${reqCurrency} ${amount}`,
      type: 'request_received',
      data: { transaction_id: trxId, amount: String(amount), currency: reqCurrency },
    });

    res.status(201).json({
      id: trxId, amount, currency: reqCurrency, type: 'request', status: 'pending',
      counterparty_name: fromUser?.name || 'Unknown',
      description: `Requested ${reqCurrency} ${amount}`,
      note: note || undefined, created_at: now,
    });
  } catch (error) {
    console.error('[Transactions] Request error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /transactions/:id/accept — accept a pending money request
router.post('/:id/accept', authenticateToken, (req: Request, res: Response) => {
  try {
    const db = getDb();
    const userId = req.user!.userId;
    const txId = req.params.id;

    // Get the transaction record
    const tx = db.prepare(`
      SELECT t.*, w.id as my_wallet_id
      FROM transactions t
      JOIN wallets w ON w.user_id = ?
      WHERE t.id = ? AND t.status = 'pending' AND t.type = 'request'
    `).get(userId, txId) as (TransactionRecord & { my_wallet_id: string }) | undefined;

    if (!tx) {
      res.status(404).json({ error: 'Pending request not found or already processed' });
      return;
    }

    // The user accepting must be the sender (the one being requested FROM)
    if (tx.sender_wallet_id !== tx.my_wallet_id) {
      res.status(403).json({ error: 'Only the requested user can accept this request' });
      return;
    }

    // Check balance
    const wallet = db.prepare('SELECT balance FROM wallets WHERE id = ?')
      .get(tx.sender_wallet_id) as { balance: number } | undefined;

    if (!wallet || wallet.balance < tx.amount) {
      res.status(400).json({ error: 'Insufficient balance to accept this request' });
      return;
    }

    // Get names
    const requesterName = db.prepare(`
      SELECT COALESCE(display_name, full_name) as name FROM users WHERE id = (
        SELECT user_id FROM wallets WHERE id = ?
      )
    `).get(tx.receiver_wallet_id) as { name: string } | undefined;

    const senderName = db.prepare(`
      SELECT COALESCE(display_name, full_name) as name FROM users WHERE id = ?
    `).get(userId) as { name: string } | undefined;

    const now = new Date().toISOString();
    const sendId = uuidv4();

    // Atomically: debit sender, credit receiver, update request, create records
    const acceptTransfer = db.transaction(() => {
      // Debit sender (the user accepting the request)
      db.prepare('UPDATE wallets SET balance = balance - ?, updated_at = ? WHERE id = ?')
        .run(tx.amount, now, tx.sender_wallet_id);

      // Credit receiver (the user who requested)
      db.prepare('UPDATE wallets SET balance = balance + ?, updated_at = ? WHERE id = ?')
        .run(tx.amount, now, tx.receiver_wallet_id);

      // Update original request to completed
      db.prepare('UPDATE transactions SET status = ?, description = ?, created_at = ? WHERE id = ?')
        .run('completed', `Accepted request — sent ${tx.currency} ${tx.amount}`, now, tx.id);

      // Create a send record for the sender
      db.prepare(`
        INSERT INTO transactions (id, sender_wallet_id, receiver_wallet_id, amount, currency, type, status, counterparty_name, description, note, created_at)
        VALUES (?, ?, ?, ?, ?, 'send', 'completed', ?, ?, ?, ?)
      `).run(sendId, tx.sender_wallet_id, tx.receiver_wallet_id, tx.amount, tx.currency,
        requesterName?.name || 'Unknown', `Sent ${tx.currency} ${tx.amount}`, tx.note, now);

      // Create a receive record for the requester
      db.prepare(`
        INSERT INTO transactions (id, sender_wallet_id, receiver_wallet_id, amount, currency, type, status, counterparty_name, description, note, created_at)
        VALUES (?, ?, ?, ?, ?, 'receive', 'completed', ?, ?, ?, ?)
      `).run(uuidv4(), tx.sender_wallet_id, tx.receiver_wallet_id, tx.amount, tx.currency,
        senderName?.name || 'Unknown', `Received ${tx.currency} ${tx.amount}`, tx.note, now);
    });

    acceptTransfer();

    // Notify the requester that their request was fulfilled
    const requesterUserId = db.prepare(
      'SELECT user_id FROM wallets WHERE id = ?'
    ).get(tx.receiver_wallet_id) as { user_id: string } | undefined;
    if (requesterUserId) {
      notify(requesterUserId.user_id, {
        title: 'Request accepted',
        body: `${senderName?.name || 'Someone'} paid your ${tx.currency} ${tx.amount} request`,
        type: 'request_accepted',
        data: { transaction_id: sendId, amount: String(tx.amount), currency: tx.currency },
      });
    }

    res.json({
      id: sendId,
      amount: tx.amount,
      currency: tx.currency,
      type: 'send',
      status: 'completed',
      counterparty_name: requesterName?.name || 'Unknown',
      description: `Sent ${tx.currency} ${tx.amount}`,
      note: tx.note || undefined,
      created_at: now,
    });
  } catch (error) {
    console.error('[Transactions] Accept error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /transactions/:id/decline — decline a pending money request
router.post('/:id/decline', authenticateToken, (req: Request, res: Response) => {
  try {
    const db = getDb();
    const userId = req.user!.userId;
    const txId = req.params.id;

    const tx = db.prepare(`
      SELECT t.*, w.id as my_wallet_id
      FROM transactions t
      JOIN wallets w ON w.user_id = ?
      WHERE t.id = ? AND t.status = 'pending' AND t.type = 'request'
    `).get(userId, txId) as (TransactionRecord & { my_wallet_id: string }) | undefined;

    if (!tx) {
      res.status(404).json({ error: 'Pending request not found or already processed' });
      return;
    }

    if (tx.sender_wallet_id !== tx.my_wallet_id) {
      res.status(403).json({ error: 'Only the requested user can decline this request' });
      return;
    }

    const now = new Date().toISOString();
    db.prepare('UPDATE transactions SET status = ?, description = ?, created_at = ? WHERE id = ?')
      .run('cancelled', `Declined request — ${tx.currency} ${tx.amount}`, now, tx.id);

    // Notify the requester that their request was declined
    const declinerName = db.prepare(
      'SELECT COALESCE(display_name, full_name) as name FROM users WHERE id = ?'
    ).get(userId) as { name: string } | undefined;
    const requesterUserId = db.prepare(
      'SELECT user_id FROM wallets WHERE id = ?'
    ).get(tx.receiver_wallet_id) as { user_id: string } | undefined;
    if (requesterUserId) {
      notify(requesterUserId.user_id, {
        title: 'Request declined',
        body: `${declinerName?.name || 'Someone'} declined your ${tx.currency} ${tx.amount} request`,
        type: 'request_declined',
        data: { transaction_id: tx.id, amount: String(tx.amount), currency: tx.currency },
      });
    }

    res.json({
      id: tx.id,
      amount: tx.amount,
      currency: tx.currency,
      type: 'request',
      status: 'cancelled',
      counterparty_name: tx.counterparty_name,
      description: `Declined request — ${tx.currency} ${tx.amount}`,
      note: tx.note || undefined,
      created_at: now,
    });
  } catch (error) {
    console.error('[Transactions] Decline error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;