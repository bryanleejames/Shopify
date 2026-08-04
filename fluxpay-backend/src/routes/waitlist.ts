import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { getDb } from '../db/database';
import { sendWelcomeEmail } from '../services/email';

const router = Router();

// POST /waitlist — store email signup from marketing site
// Silently updates timestamp on duplicate emails (no error leaked)
router.post('/', async (req: Request, res: Response) => {
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
    const isNew = !existing;

    if (existing) {
      db.prepare('UPDATE waitlist SET created_at = datetime(\'now\'), source = ? WHERE email = ?')
        .run(sourceValue, normalizedEmail);
    } else {
      db.prepare('INSERT INTO waitlist (id, email, source) VALUES (?, ?, ?)')
        .run(uuidv4(), normalizedEmail, sourceValue);
    }

    // Send welcome email to new signups (fire-and-forget)
    if (isNew) {
      sendWelcomeEmail({ to: normalizedEmail }).catch(err =>
        console.error('[Waitlist] Welcome email failed:', err)
      );
    }

    res.json({ success: true, isNew });
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
