import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { getDb } from '../db/database';

const router = Router();

// POST /dev/seed — create test users, wallets, and transactions for demo/dev
router.post('/seed', (_req: Request, res: Response) => {
  try {
    const db = getDb();
    const now = new Date().toISOString();
    const salt = bcrypt.genSaltSync(10);

    // Clear existing test data
    db.exec('DELETE FROM transactions');
    db.exec('DELETE FROM wallets');
    db.exec('DELETE FROM users');
    db.exec('DELETE FROM verification_codes');

    // Create test users
    const users = [
      { id: uuidv4(), email: 'alice@fluxpay.demo', name: 'Alice Johnson', phone: '+15551111111' },
      { id: uuidv4(), email: 'bob@fluxpay.demo', name: 'Bob Smith', phone: '+15552222222' },
      { id: uuidv4(), email: 'carol@fluxpay.demo', name: 'Carol Davis', phone: '+15553333333' },
    ];

    const wallets = users.map((u) => ({
      id: uuidv4(),
      user_id: u.id,
      balance: u.name === 'Alice Johnson' ? 5000 : u.name === 'Bob Smith' ? 250 : 100,
    }));

    const daysAgo = (days: number) => new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

    // Insert users and wallets
    const insertUser = db.prepare(`
      INSERT INTO users (id, email, full_name, display_name, phone_number, password_hash, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const insertWallet = db.prepare(`
      INSERT INTO wallets (id, user_id, balance, currency, available_balance, weekly_limit, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const insertTx = db.prepare(`
      INSERT INTO transactions (id, sender_wallet_id, receiver_wallet_id, amount, currency, type, status, counterparty_name, description, note, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    for (let i = 0; i < users.length; i++) {
      insertUser.run(
        users[i].id, users[i].email, users[i].name, users[i].name, users[i].phone,
        bcrypt.hashSync('password123', salt), now, now
      );
      insertWallet.run(
        wallets[i].id, wallets[i].user_id, wallets[i].balance, 'USD',
        wallets[i].balance, 5000.00, now, now
      );
    }

    // Update wallet balances to reflect seeded amounts
    for (const w of wallets) {
      db.prepare('UPDATE wallets SET balance = ?, available_balance = ? WHERE id = ?')
        .run(w.balance, w.balance, w.id);
    }

    const aliceW = wallets[0]; // 5000
    const bobW = wallets[1];   // 250
    const carolW = wallets[2]; // 100

    // Seed transactions: Alice sent Bob $50, Bob sent Carol $25, Carol sent Alice $10, Alice requests $30 from Bob
    const txns = [
      // Alice → Bob $50 (completed)
      { id: uuidv4(), sender: aliceW.id, receiver: bobW.id, amount: 50, type: 'send', status: 'completed', cparty: 'Bob Smith', desc: 'Sent USD 50 — Dinner', time: daysAgo(1) },
      { id: uuidv4(), sender: aliceW.id, receiver: bobW.id, amount: 50, type: 'receive', status: 'completed', cparty: 'Alice Johnson', desc: 'Received USD 50 — Dinner', time: daysAgo(1) },
      // Bob → Carol $25 (completed)
      { id: uuidv4(), sender: bobW.id, receiver: carolW.id, amount: 25, type: 'send', status: 'completed', cparty: 'Carol Davis', desc: 'Sent USD 25 — Coffee', time: daysAgo(2) },
      { id: uuidv4(), sender: bobW.id, receiver: carolW.id, amount: 25, type: 'receive', status: 'completed', cparty: 'Bob Smith', desc: 'Received USD 25 — Coffee', time: daysAgo(2) },
      // Carol → Alice $10 (completed)
      { id: uuidv4(), sender: carolW.id, receiver: aliceW.id, amount: 10, type: 'send', status: 'completed', cparty: 'Alice Johnson', desc: 'Sent USD 10 — Snacks', time: daysAgo(3) },
      { id: uuidv4(), sender: carolW.id, receiver: aliceW.id, amount: 10, type: 'receive', status: 'completed', cparty: 'Carol Davis', desc: 'Received USD 10 — Snacks', time: daysAgo(3) },
      // Alice requests $30 from Bob (pending)
      { id: uuidv4(), sender: bobW.id, receiver: aliceW.id, amount: 30, type: 'request', status: 'pending', cparty: 'Bob Smith', desc: 'Requested USD 30 — Uber split', time: now },
    ];

    for (const t of txns) {
      insertTx.run(t.id, t.sender, t.receiver, t.amount, 'USD', t.type, t.status, t.cparty, t.desc, null, t.time);
    }

    // Update wallet balances to reflect completed txns
    // Alice sent 50, received 10, so 5000 - 50 + 10 = 4960
    db.prepare('UPDATE wallets SET balance = ?, available_balance = ? WHERE id = ?')
      .run(4960, 4960, aliceW.id);
    // Bob sent 25, received 50, so 250 - 25 + 50 = 275
    db.prepare('UPDATE wallets SET balance = ?, available_balance = ? WHERE id = ?')
      .run(275, 275, bobW.id);
    // Carol sent 10, received 25, so 100 - 10 + 25 = 115
    db.prepare('UPDATE wallets SET balance = ?, available_balance = ? WHERE id = ?')
      .run(115, 115, carolW.id);

    res.json({
      message: 'Seed data created successfully',
      users: users.map((u, i) => ({
        id: u.id, email: u.email, name: u.name, phone: u.phone,
        password: 'password123', balance: [4960, 275, 115][i],
      })),
      transactions_seeded: txns.length,
    });
  } catch (error) {
    console.error('[Dev] Seed error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;