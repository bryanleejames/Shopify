import { Router, Request, Response } from 'express';
import { getDb } from '../db/database';
import { authenticateToken } from '../middleware/auth';
import { UserPublic } from '../types';

const router = Router();
const searchRouter = Router();

// GET / — get current user's profile (mounted at /profile and /user)
router.get('/', authenticateToken, (req: Request, res: Response) => {
  try {
    const db = getDb();
    const user = db.prepare(
      `SELECT id, email, COALESCE(display_name, full_name) as display_name,
              phone_number, avatar_url, created_at
       FROM users WHERE id = ?`
    ).get(req.user!.userId) as UserPublic | undefined;

    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    res.json(user);
  } catch (error) {
    console.error('[Profile] Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT / — update profile (display_name, avatar_url)
router.put('/', authenticateToken, (req: Request, res: Response) => {
  try {
    const { display_name, avatar_url } = req.body as {
      display_name?: string; avatar_url?: string;
    };

    const db = getDb();
    const userId = req.user!.userId;
    const now = new Date().toISOString();

    if (display_name) {
      db.prepare('UPDATE users SET display_name = ?, full_name = ?, updated_at = ? WHERE id = ?')
        .run(display_name, display_name, now, userId);
    }

    if (avatar_url !== undefined) {
      db.prepare('UPDATE users SET avatar_url = ?, updated_at = ? WHERE id = ?')
        .run(avatar_url, now, userId);
    }

    if (!display_name && avatar_url === undefined) {
      res.status(400).json({ error: 'Nothing to update. Provide display_name or avatar_url.' });
      return;
    }

    const user = db.prepare(
      `SELECT id, email, COALESCE(display_name, full_name) as display_name,
              phone_number, avatar_url, created_at
       FROM users WHERE id = ?`
    ).get(userId) as UserPublic | undefined;

    res.json(user);
  } catch (error) {
    console.error('[Profile] Update error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /search — search users by email, phone, or name
searchRouter.get('/', (_req: Request, res: Response) => {
  try {
    const q = (_req.query.q as string || '').trim();
    if (!q || q.length < 2) {
      res.json({ data: [] });
      return;
    }

    const db = getDb();
    const pattern = `%${q}%`;
    const users = db.prepare(`
      SELECT id, email, phone_number, COALESCE(display_name, full_name) as display_name, avatar_url
      FROM users
      WHERE email LIKE ? OR phone_number LIKE ? OR full_name LIKE ? OR display_name LIKE ?
      LIMIT 20
    `).all(pattern, pattern, pattern, pattern) as UserPublic[];

    res.json({ data: users });
  } catch (error) {
    console.error('[User] Search error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export { searchRouter };
export default router;