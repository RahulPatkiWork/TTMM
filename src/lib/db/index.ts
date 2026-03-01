import Database from 'better-sqlite3';
import path from 'path';

const dbPath = path.resolve(process.cwd(), 'ttmm.db');
export const db = new Database(dbPath);

// Initialize Schema
// CONSTRAINT CHECK: All money columns MUST be of type INTEGER.
// Absolutely no REAL, FLOAT, or DECIMAL types.
// All integer values represent paise/cents (e.g., ₹10.50 is stored as 1050).
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    created_at INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS groups (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    created_at INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS group_members (
    group_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    PRIMARY KEY (group_id, user_id),
    FOREIGN KEY (group_id) REFERENCES groups(id),
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS expenses (
    id TEXT PRIMARY KEY,
    group_id TEXT NOT NULL,
    payer_id TEXT NOT NULL,
    description TEXT NOT NULL,
    amount_cents INTEGER NOT NULL, -- Stored in cents/paise
    location_lat REAL,
    location_lng REAL,
    location_name TEXT,
    receipt_url TEXT,
    created_at INTEGER NOT NULL,
    FOREIGN KEY (group_id) REFERENCES groups(id),
    FOREIGN KEY (payer_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS expense_splits (
    id TEXT PRIMARY KEY,
    expense_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    amount_cents INTEGER NOT NULL, -- Stored in cents/paise
    FOREIGN KEY (expense_id) REFERENCES expenses(id),
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS debts (
    debtor_id TEXT NOT NULL,
    creditor_id TEXT NOT NULL,
    group_id TEXT NOT NULL,
    amount_cents INTEGER NOT NULL, -- Stored in cents/paise
    PRIMARY KEY (debtor_id, creditor_id, group_id),
    FOREIGN KEY (debtor_id) REFERENCES users(id),
    FOREIGN KEY (creditor_id) REFERENCES users(id),
    FOREIGN KEY (group_id) REFERENCES groups(id)
  );
`);
