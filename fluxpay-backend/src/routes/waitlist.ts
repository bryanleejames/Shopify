import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { getDb } from '../db/database';
import { sendWelcomeEmail } from '../services/email';

const router = Router();

const ADMIN_API_KEY = process.env.ADMIN_API_KEY || 'fluxpay-admin-dev-key';

function requireAdmin(req: Request, res: Response): boolean {
  const key = (req.query.key as string) || (req.headers['x-admin-key'] as string) || '';
  if (!key || key !== ADMIN_API_KEY) {
    res.status(401).json({ error: 'Unauthorized: valid admin key required' });
    return false;
  }
  return true;
}

// GET /waitlist?key=<ADMIN_API_KEY> — list all waitlist entries (admin only)
router.get('/', (req: Request, res: Response) => {
  try {
    if (!requireAdmin(req, res)) return;

    const db = getDb();
    const limit = Math.min(Math.max(parseInt(req.query.limit as string) || 50, 1), 500);
    const offset = Math.max(parseInt(req.query.offset as string) || 0, 0);

    const count = db.prepare('SELECT COUNT(*) as total FROM waitlist').get() as { total: number };
    const entries = db.prepare(
      'SELECT id, email, source, created_at FROM waitlist ORDER BY created_at DESC LIMIT ? OFFSET ?'
    ).all(limit, offset) as Array<{ id: string; email: string; source: string; created_at: string }>;

    res.json({
      data: entries,
      total: count.total,
      limit,
      offset,
      has_more: offset + limit < count.total,
    });
  } catch (error: any) {
    console.error('[Waitlist] Error listing entries:', error);
    res.status(500).json({ error: 'Failed to list waitlist entries' });
  }
});

// POST /waitlist — store email signup from marketing site
// Silently updates timestamp on duplicate emails (no error leaked)
router.post('/', (req: Request, res: Response) => {
  try {
    const { email, source } = req.body;

    if (!email || typeof email !== 'string' || !email.includes('@')) {
      res.status(400).json({ error: 'Valid email is required' });
      return;
    }

    const normalizedEmail = email.trim().toLowerCase();
    const sourceValue = (typeof source === 'string' && source) ? source : 'website';
    const db = getDb();

    // UPSERT: insert new or update timestamp on duplicate
    const existing = db.prepare('SELECT id FROM waitlist WHERE email = ?').get(normalizedEmail) as any;
    if (existing) {
      db.prepare('UPDATE waitlist SET created_at = datetime(\'now\'), source = ? WHERE email = ?')
        .run(sourceValue, normalizedEmail);
    } else {
      db.prepare('INSERT INTO waitlist (id, email, source) VALUES (?, ?, ?)')
        .run(uuidv4(), normalizedEmail, sourceValue);
      // Send welcome email to first-time signups (fire-and-forget)
      sendWelcomeEmail({ to: normalizedEmail }).catch(err =>
        console.error('[Waitlist] Welcome email failed:', err.message)
      );
    }

    res.json({ success: true });
  } catch (error: any) {
    // UNIQUE constraint violation — should not happen with above logic but safe fallback
    if (error?.code === 'SQLITE_CONSTRAINT' || error?.message?.includes('UNIQUE')) {
      res.json({ success: true });
    } else {
      console.error('[Waitlist] Error storing email:', error);
      res.status(500).json({ error: 'Failed to join waitlist' });
    }
  }
});

export default router;
