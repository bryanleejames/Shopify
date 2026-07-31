import { Router, Request, Response } from 'express';
import { getDb } from '../db/database';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// GET /wallet — get current user's wallet with real spending data
router.get('/', authenticateToken, (req: Request, res: Response) => {
  try {
    const db = getDb();
    const userId = req.user!.userId;

    const wallet = db.prepare(`
      SELECT w.id, w.balance, w.currency, w.linked_bank, w.stripe_account_id, w.weekly_limit, w.available_balance
      FROM wallets w
      WHERE w.user_id = ?
    `).get(userId) as {
      id: string; balance: number; currency: string;
      linked_bank: string | null; stripe_account_id: string | null;
      weekly_limit: number; available_balance: number;
    } | undefined;

    if (!wallet) {
      res.status(404).json({ error: 'Wallet not found' });
      return;
    }

    // Calculate real weekly spent
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

    const weeklySpent = db.prepare(`
      SELECT COALESCE(SUM(t.amount), 0) as total
      FROM transactions t
      JOIN wallets w ON w.id = t.sender_wallet_id
      WHERE w.user_id = ?
        AND t.type IN ('send', 'transfer', 'instant_transfer', 'standard_transfer')
        AND t.status = 'completed'
        AND t.created_at >= ?
    `).get(userId, sevenDaysAgo) as { total: number };

    // Calculate pending outgoing
    const pendingOutgoing = db.prepare(`
      SELECT COALESCE(SUM(t.amount), 0) as total
      FROM transactions t
      JOIN wallets w ON w.id = t.sender_wallet_id
      WHERE w.user_id = ?
        AND t.status = 'pending'
        AND t.type = 'request'
    `).get(userId) as { total: number };

    const realAvailableBalance = Math.max(0, wallet.balance - pendingOutgoing.total);

    // Get linked bank accounts summary
    const bankAccounts = db.prepare(`
      SELECT id, bank_name, last_four, is_default, status
      FROM bank_accounts WHERE user_id = ?
      ORDER BY is_default DESC
      LIMIT 5
    `).all(userId) as Array<{
      id: string; bank_name: string; last_four: string; is_default: number; status: string;
    }>;

    // Get subscription info
    const sub = db.prepare(`
      SELECT tier, early_direct_deposit, transfer_limit, active
      FROM subscriptions WHERE user_id = ?
    `).get(userId) as {
      tier: string; early_direct_deposit: number; transfer_limit: number; active: number;
    } | undefined;

    res.json({
      id: wallet.id,
      balance: wallet.balance,
      currency: wallet.currency,
      linked_bank: wallet.linked_bank,
      stripe_account_id: wallet.stripe_account_id,
      weekly_limit: sub && sub.active ? sub.transfer_limit : wallet.weekly_limit,
      available_balance: realAvailableBalance,
      weekly_spent: weeklySpent.total,
      subscription_tier: sub?.tier || 'free',
      early_direct_deposit: sub ? sub.early_direct_deposit === 1 : false,
      transfer_limit: sub && sub.active ? sub.transfer_limit : wallet.weekly_limit,
      bank_accounts: bankAccounts.map(b => ({
        id: b.id,
        bank_name: b.bank_name,
        last_four: b.last_four,
        is_default: b.is_default === 1,
        status: b.status,
      })),
    });
  } catch (error) {
    console.error('[Wallet] Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /wallet/balance — alias, keep for backwards compat
router.get('/balance', authenticateToken, (req: Request, res: Response) => {
  try {
    const db = getDb();
    const wallet = db.prepare(
      'SELECT id, balance, currency FROM wallets WHERE user_id = ?'
    ).get(req.user!.userId) as { id: string; balance: number; currency: string } | undefined;

    if (!wallet) {
      res.status(404).json({ error: 'Wallet not found' });
      return;
    }

    res.json(wallet);
  } catch (error) {
    console.error('[Wallet] Balance error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;