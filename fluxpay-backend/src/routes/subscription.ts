import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { getDb } from '../db/database';
import { authenticateToken } from '../middleware/auth';

const router = Router();

const PAYMENT_LINK = 'https://buy.stripe.com/aFa9AS3bDcc6cY07Uf8EM0h';

// GET /subscription — get current user's subscription status
router.get('/', authenticateToken, (req: Request, res: Response) => {
  try {
    const db = getDb();

    // Try to find existing subscription, or return default free tier
    const sub = db.prepare(`
      SELECT id, tier, early_direct_deposit, transfer_limit, active, created_at
      FROM subscriptions WHERE user_id = ?
    `).get(req.user!.userId) as {
      id: string; tier: string; early_direct_deposit: number;
      transfer_limit: number; active: number; created_at: string;
    } | undefined;

    if (!sub) {
      // Return default free tier
      res.json({
        tier: 'free',
        early_direct_deposit: false,
        transfer_limit: 5000,
        active: false,
        payment_link: PAYMENT_LINK,
      });
      return;
    }

    res.json({
      tier: sub.tier,
      early_direct_deposit: sub.early_direct_deposit === 1,
      transfer_limit: sub.transfer_limit,
      active: sub.active === 1,
      created_at: sub.created_at,
      payment_link: PAYMENT_LINK,
    });
  } catch (error) {
    console.error('[Subscription] Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /subscription/create — create or upgrade to premium subscription
router.post('/create', authenticateToken, (req: Request, res: Response) => {
  try {
    const db = getDb();
    const userId = req.user!.userId;
    const now = new Date().toISOString();

    // Check if user already has a subscription
    const existing = db.prepare('SELECT id, tier, active FROM subscriptions WHERE user_id = ?')
      .get(userId) as { id: string; tier: string; active: number } | undefined;

    if (existing && existing.tier === 'premium' && existing.active === 1) {
      res.status(400).json({ error: 'Already a premium subscriber' });
      return;
    }

    if (existing) {
      // Upgrade existing free subscription to premium
      db.prepare(`
        UPDATE subscriptions SET tier = 'premium', active = 1,
          early_direct_deposit = 1, transfer_limit = 10000,
          updated_at = ?
        WHERE user_id = ?
      `).run(now, userId);

      res.json({
        tier: 'premium',
        early_direct_deposit: true,
        transfer_limit: 10000,
        active: true,
        payment_link: PAYMENT_LINK,
        message: 'Subscription upgraded to Premium',
      });
      return;
    }

    // Create new premium subscription
    const subId = uuidv4();
    db.prepare(`
      INSERT INTO subscriptions (id, user_id, tier, early_direct_deposit, transfer_limit, active, created_at, updated_at)
      VALUES (?, ?, 'premium', 1, 10000, 1, ?, ?)
    `).run(subId, userId, now, now);

    res.status(201).json({
      tier: 'premium',
      early_direct_deposit: true,
      transfer_limit: 10000,
      active: true,
      payment_link: PAYMENT_LINK,
      message: 'Premium subscription created',
    });
  } catch (error) {
    console.error('[Subscription] Create error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /subscription/cancel — cancel premium subscription (downgrade to free)
router.post('/cancel', authenticateToken, (req: Request, res: Response) => {
  try {
    const db = getDb();
    const now = new Date().toISOString();

    const result = db.prepare(`
      UPDATE subscriptions SET tier = 'free', active = 0,
        early_direct_deposit = 0, transfer_limit = 5000,
        updated_at = ?
      WHERE user_id = ? AND tier = 'premium'
    `).run(now, req.user!.userId);

    if (result.changes === 0) {
      res.status(400).json({ error: 'No active premium subscription to cancel' });
      return;
    }

    res.json({
      tier: 'free',
      early_direct_deposit: false,
      transfer_limit: 5000,
      active: false,
      message: 'Subscription cancelled, reverted to Free tier',
    });
  } catch (error) {
    console.error('[Subscription] Cancel error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;