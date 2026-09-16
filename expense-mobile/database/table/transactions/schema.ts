import { getDatabase } from '@/database/database';

export async function createTransactionsTable() {
  const db = await getDatabase();

  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      wallet_id INTEGER NOT NULL,
      category_id INTEGER,
      type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
      amount REAL NOT NULL CHECK (amount > 0),
      note TEXT,
      bill_id INTEGER,
      transaction_date TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,

      FOREIGN KEY (wallet_id)
        REFERENCES wallets(id)
        ON DELETE RESTRICT,

      FOREIGN KEY (category_id)
        REFERENCES categories(id)
        ON DELETE SET NULL

      FOREIGN KEY (bill_id)
        REFERENCES bills(id)
        ON DELETE SET NULL
    );
  `);
}