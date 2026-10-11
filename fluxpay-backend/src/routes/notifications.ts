import { Router, Request, Response } from 'express';
import { getDb } from '../db/database';
import { authenticateToken } from '../middleware/auth';
import {
  registerDeviceToken,
  unregisterDeviceToken,
  markNotificationRead,
  markAllNotificationsRead,
} from '../services/notifications';

const router = Router();

// All notification endpoints require auth
router.use(authenticateToken);

/**
 * POST /notifications/register
 * Body: { token: string, platform?: 'ios' | 'android' }
 * Registers (or re-binds) a device push token for the authenticated user.
 */
router.post('/register', (req: Request, res: Response) => {
  const { token, platform } = req.body || {};

  if (!token || typeof token !== 'string' || token.trim().length === 0) {
    res.status(400).json({ error: 'A valid device token is required' });
    return;
  }

  const normalizedPlatform = platform === 'android' ? 'android' : 'ios';
  const isNew = registerDeviceToken(req.user!.userId, token.trim(), normalizedPlatform);

  res.status(isNew ? 201 : 200).json({
    status: 'ok',
    registered: true,
    platform: normalizedPlatform,
  });
});

/**
 * POST /notifications/unregister
 * Body: { token: string }
 * Removes a device token (logout / opt-out of push).
 */
router.post('/unregister', (req: Request, res: Response) => {
  const { token } = req.body || {};

  if (!token || typeof token !== 'string' || token.trim().length === 0) {
    res.status(400).json({ error: 'A valid device token is required' });
    return;
  }

  const removed = unregisterDeviceToken(req.user!.userId, token.trim());

  res.json({
    status: 'ok',
    unregistered: removed,
  });
});

/**
 * GET /notifications — list the authenticated user's notifications (paginated).
 */
router.get('/', (req: Request, res: Response) => {
  const limit = Math.min(Math.max(parseInt(req.query.limit as string) || 20, 1), 100);
  const offset = Math.max(parseInt(req.query.offset as string) || 0, 0);

  const db = getDb();
  const userId = req.user!.userId;

  const count = db.prepare(
    'SELECT COUNT(*) as total FROM notifications WHERE user_id = ?'
  ).get(userId) as { total: number };

  const rows = db.prepare(
    `SELECT id, title, body, type, data, read, created_at
     FROM notifications
     WHERE user_id = ?
     ORDER BY created_at DESC, rowid DESC
     LIMIT ? OFFSET ?`
  ).all(userId, limit, offset) as Array<{
    id: string;
    title: string;
    body: string;
    type: string;
    data: string | null;
    read: number;
    created_at: string;
  }>;

  res.json({
    data: rows.map((r) => ({
      id: r.id,
      title: r.title,
      body: r.body,
      type: r.type,
      data: r.data ? JSON.parse(r.data) : null,
      read: r.read === 1,
      created_at: r.created_at,
    })),
    total: count.total,
    limit,
    offset,
    has_more: offset + rows.length < count.total,
  });
});

/**
 * POST /notifications/:id/read — mark a single notification as read.
 */
router.post('/:id/read', (req: Request, res: Response) => {
  const rawId = req.params.id;
  const notificationId = Array.isArray(rawId) ? rawId[0] : rawId;
  const updated = markNotificationRead(req.user!.userId, notificationId);

  if (!updated) {
    res.status(404).json({ error: 'Notification not found' });
    return;
  }

  res.json({ status: 'ok', read: true });
});

/**
 * POST /notifications/read-all — mark all notifications as read.
 */
router.post('/read-all', (req: Request, res: Response) => {
  const count = markAllNotificationsRead(req.user!.userId);
  res.json({ status: 'ok', updated: count });
});

export default router;
