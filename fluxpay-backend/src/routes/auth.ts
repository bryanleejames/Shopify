import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { getDb } from '../db/database';
import { generateToken } from '../middleware/auth';
import { SignupRequest, LoginRequest, AuthResponse } from '../types';

const router = Router();

// POST /auth/signup — email/password signup
router.post('/signup', (req: Request, res: Response) => {
  try {
    const { email, password, full_name } = req.body as SignupRequest;

    if (!email || !password || !full_name) {
      res.status(400).json({ error: 'Email, password, and full_name are required' });
      return;
    }

    if (typeof email !== 'string' || !email.includes('@')) {
      res.status(400).json({ error: 'Invalid email format' });
      return;
    }

    if (password.length < 6) {
      res.status(400).json({ error: 'Password must be at least 6 characters' });
      return;
    }

    const db = getDb();

    const existingUser = db.prepare('SELECT id FROM users WHERE email = ?').get(email.toLowerCase());
    if (existingUser) {
      res.status(409).json({ error: 'An account with this email already exists' });
      return;
    }

    const salt = bcrypt.genSaltSync(10);
    const password_hash = bcrypt.hashSync(password, salt);

    const userId = uuidv4();
    const walletId = uuidv4();
    const now = new Date().toISOString();

    const insertUser = db.prepare(`
      INSERT INTO users (id, email, full_name, display_name, password_hash, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    const insertWallet = db.prepare(`
      INSERT INTO wallets (id, user_id, balance, currency, available_balance, weekly_limit, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const transaction = db.transaction(() => {
      insertUser.run(userId, email.toLowerCase(), full_name, full_name, password_hash, now, now);
      insertWallet.run(walletId, userId, 0.00, 'USD', 0.00, 5000.00, now, now);
    });

    transaction();

    const token = generateToken({ userId, email: email.toLowerCase() });

    const response: AuthResponse = {
      token,
      user: { id: userId, email: email.toLowerCase(), full_name, display_name: full_name },
    };

    res.status(201).json(response);
  } catch (error) {
    console.error('[Auth] Signup error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /auth/login — email/password login
router.post('/login', (req: Request, res: Response) => {
  try {
    const { email, password } = req.body as LoginRequest;

    if (!email || !password) {
      res.status(400).json({ error: 'Email and password are required' });
      return;
    }

    const db = getDb();

    const user = db.prepare(
      'SELECT id, email, full_name, display_name, phone_number, password_hash FROM users WHERE email = ?'
    ).get(email.toLowerCase()) as {
      id: string; email: string; full_name: string; display_name: string;
      phone_number: string | null; password_hash: string;
    } | undefined;

    if (!user) {
      res.status(401).json({ error: 'Invalid email or password' });
      return;
    }

    const validPassword = bcrypt.compareSync(password, user.password_hash);
    if (!validPassword) {
      res.status(401).json({ error: 'Invalid email or password' });
      return;
    }

    const token = generateToken({ userId: user.id, email: user.email });

    const response: AuthResponse = {
      token,
      user: {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        display_name: user.display_name,
        phone_number: user.phone_number || undefined,
      },
    };

    res.json(response);
  } catch (error) {
    console.error('[Auth] Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /auth/request-code — request a 6-digit verification code (phone auth)
router.post('/request-code', (req: Request, res: Response) => {
  try {
    const { phone_number } = req.body as { phone_number: string };

    if (!phone_number) {
      res.status(400).json({ error: 'Phone number is required' });
      return;
    }

    // Generate a 6-digit code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const codeId = uuidv4();
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 10 * 60 * 1000); // 10 min expiry

    const db = getDb();

    // Invalidate any previous unused codes for this phone number
    db.prepare('UPDATE verification_codes SET used = 1 WHERE phone_number = ? AND used = 0')
      .run(phone_number);

    // Insert new code
    db.prepare(`
      INSERT INTO verification_codes (id, phone_number, code, expires_at, used, created_at)
      VALUES (?, ?, ?, ?, 0, ?)
    `).run(codeId, phone_number, code, expiresAt.toISOString(), now.toISOString());

    console.log(`[Auth] Verification code for ${phone_number}: ${code}`);

    res.json({
      message: 'Verification code sent',
      // In dev, return the code so the iOS team can test
      ...(process.env.NODE_ENV !== 'production' ? { code } : {}),
    });
  } catch (error) {
    console.error('[Auth] Request code error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /auth/verify-code — verify the 6-digit code and return JWT
router.post('/verify-code', (req: Request, res: Response) => {
  try {
    const { phone_number, code } = req.body as { phone_number: string; code: string };

    if (!phone_number || !code) {
      res.status(400).json({ error: 'Phone number and code are required' });
      return;
    }

    const db = getDb();

    const now = new Date().toISOString();

    const verification = db.prepare(`
      SELECT id, phone_number, code, expires_at, used
      FROM verification_codes
      WHERE phone_number = ? AND used = 0
      ORDER BY created_at DESC
      LIMIT 1
    `).get(phone_number) as {
      id: string; phone_number: string; code: string;
      expires_at: string; used: number;
    } | undefined;

    if (!verification) {
      res.status(400).json({ error: 'No verification code found. Request a new one.' });
      return;
    }

    if (verification.used === 1) {
      res.status(400).json({ error: 'Code already used. Request a new one.' });
      return;
    }

    if (new Date(verification.expires_at) < new Date()) {
      res.status(400).json({ error: 'Code has expired. Request a new one.' });
      return;
    }

    if (verification.code !== code) {
      res.status(400).json({ error: 'Invalid code.' });
      return;
    }

    // Mark code as used
    db.prepare('UPDATE verification_codes SET used = 1 WHERE id = ?').run(verification.id);

    // Find or create user by phone number
    let user = db.prepare(
      'SELECT id, email, full_name, display_name, phone_number FROM users WHERE phone_number = ?'
    ).get(phone_number) as {
      id: string; email: string; full_name: string;
      display_name: string; phone_number: string;
    } | undefined;

    if (!user) {
      // Auto-create user with phone number
      const userId = uuidv4();
      const walletId = uuidv4();
      const displayName = `User ${phone_number.slice(-4)}`;

      const insertUser = db.prepare(`
        INSERT INTO users (id, email, full_name, display_name, phone_number, password_hash, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `);

      const insertWallet = db.prepare(`
        INSERT INTO wallets (id, user_id, balance, currency, available_balance, weekly_limit, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `);

      const trx = db.transaction(() => {
        insertUser.run(
          userId,
          `phone_${phone_number.replace(/\D/g, '')}@fluxpay.app`,
          displayName,
          displayName,
          phone_number,
          '', // no password for phone-only users
          now,
          now
        );
        insertWallet.run(walletId, userId, 0.00, 'USD', 0.00, 5000.00, now, now);
      });

      trx();
      user = { id: userId, email: `phone_${phone_number.replace(/\D/g, '')}@fluxpay.app`, full_name: displayName, display_name: displayName, phone_number };
    }

    const token = generateToken({ userId: user.id, email: user.email });

    const response: AuthResponse = {
      token,
      user: {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        display_name: user.display_name,
        phone_number: user.phone_number,
      },
    };

    res.json(response);
  } catch (error) {
    console.error('[Auth] Verify code error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;