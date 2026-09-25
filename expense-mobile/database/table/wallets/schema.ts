import { getDatabase } from '@/database/database';

export async function createWalletsTable() {
  const db = await getDatabase();

  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS wallets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      currency_code TEXT NOT NULL,
      initial_balance REAL NOT NULL DEFAULT 0,
      is_active INTEGER NOT NULL DEFAULT 1,
      hide_amount INTEGER NOT NULL DEFAULT 0,
      icon TEXT NOT NULL DEFAULT 'wallet-outline',
      color TEXT NOT NULL DEFAULT '#2563EB',
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,

      FOREIGN KEY (currency_code)
        REFERENCES currencies(code)
        ON UPDATE CASCADE
        ON DELETE RESTRICT
    );
  `);
}