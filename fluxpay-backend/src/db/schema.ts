import { getDb } from './database';

export function initializeSchema(): void {
  const db = getDb();

  // Base tables (created if not exist)
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      full_name TEXT NOT NULL,
      password_hash TEXT NOT NULL,
      phone_number TEXT UNIQUE,
      display_name TEXT,
      avatar_url TEXT,
      stripe_account_id TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS wallets (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL UNIQUE,
      balance REAL NOT NULL DEFAULT 0.00,
      currency TEXT NOT NULL DEFAULT 'USD',
      linked_bank TEXT,
      stripe_account_id TEXT,
      weekly_limit REAL NOT NULL DEFAULT 5000.00,
      available_balance REAL NOT NULL DEFAULT 0.00,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS transactions (
      id TEXT PRIMARY KEY,
      sender_wallet_id TEXT NOT NULL,
      receiver_wallet_id TEXT,
      amount REAL NOT NULL,
      currency TEXT NOT NULL DEFAULT 'USD',
      type TEXT NOT NULL CHECK(type IN ('send', 'receive', 'request', 'transfer', 'deposit', 'withdrawal', 'instant_transfer', 'standard_transfer', 'fee')),
      status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'completed', 'failed', 'cancelled')),
      counterparty_name TEXT,
      description TEXT,
      note TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (sender_wallet_id) REFERENCES wallets(id) ON DELETE CASCADE,
      FOREIGN KEY (receiver_wallet_id) REFERENCES wallets(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS verification_codes (
      id TEXT PRIMARY KEY,
      phone_number TEXT NOT NULL,
      code TEXT NOT NULL,
      expires_at TEXT NOT NULL,
      used INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS bank_accounts (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      stripe_bank_account_id TEXT,
      bank_name TEXT NOT NULL,
      last_four TEXT NOT NULL,
      routing_number TEXT,
      account_holder_name TEXT,
      account_type TEXT NOT NULL DEFAULT 'checking',
      is_default INTEGER NOT NULL DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'verified',
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS waitlist (
      id TEXT PRIMARY KEY,
      email TEXT NOT NULL UNIQUE,
      source TEXT NOT NULL DEFAULT 'website',
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS subscriptions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL UNIQUE,
      tier TEXT NOT NULL DEFAULT 'free' CHECK(tier IN ('free', 'premium')),
      stripe_subscription_id TEXT,
      stripe_customer_id TEXT,
      early_direct_deposit INTEGER NOT NULL DEFAULT 0,
      transfer_limit REAL NOT NULL DEFAULT 5000.00,
      active INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
    CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone_number);
    CREATE INDEX IF NOT EXISTS idx_wallets_user_id ON wallets(user_id);
    CREATE INDEX IF NOT EXISTS idx_transactions_sender ON transactions(sender_wallet_id);
    CREATE INDEX IF NOT EXISTS idx_transactions_receiver ON transactions(receiver_wallet_id);
    CREATE INDEX IF NOT EXISTS idx_transactions_created ON transactions(created_at);
    CREATE INDEX IF NOT EXISTS idx_verification_codes_phone ON verification_codes(phone_number);
    CREATE INDEX IF NOT EXISTS idx_bank_accounts_user ON bank_accounts(user_id);
    CREATE INDEX IF NOT EXISTS idx_subscriptions_user ON subscriptions(user_id);
    CREATE INDEX IF NOT EXISTS idx_waitlist_email ON waitlist(email);
  `);

  // Migrations for existing tables (safe to run multiple times)
  const migrations = [
    `ALTER TABLE users ADD COLUMN phone_number TEXT UNIQUE`,
    `ALTER TABLE users ADD COLUMN display_name TEXT`,
    `ALTER TABLE users ADD COLUMN avatar_url TEXT`,
    `ALTER TABLE users ADD COLUMN stripe_account_id TEXT`,
    `ALTER TABLE wallets ADD COLUMN linked_bank TEXT`,
    `ALTER TABLE wallets ADD COLUMN stripe_account_id TEXT`,
    `ALTER TABLE wallets ADD COLUMN weekly_limit REAL NOT NULL DEFAULT 5000.00`,
    `ALTER TABLE wallets ADD COLUMN available_balance REAL NOT NULL DEFAULT 0.00`,
    `ALTER TABLE transactions ADD COLUMN currency TEXT NOT NULL DEFAULT 'USD'`,
    `ALTER TABLE transactions ADD COLUMN counterparty_name TEXT`,
    `ALTER TABLE transactions ADD COLUMN description TEXT`,
    `ALTER TABLE transactions ADD COLUMN note TEXT`,
    `ALTER TABLE waitlist ADD COLUMN source TEXT NOT NULL DEFAULT 'website'`,
    `ALTER TABLE subscriptions ADD COLUMN stripe_customer_id TEXT`,
  ];

  for (const sql of migrations) {
    try {
      db.exec(sql);
    } catch {
      // Column already exists - safe to ignore
    }
  }

  console.log('[DB] Schema initialized successfully');
}