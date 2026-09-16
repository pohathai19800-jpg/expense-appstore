import { getDatabase } from '@/database/database';

export async function createBillsTable() {
  const db = await getDatabase();

  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS bills (
      id INTEGER PRIMARY KEY AUTOINCREMENT,

      name TEXT NOT NULL,
      amount REAL NOT NULL CHECK (amount > 0),
      day_of_month INTEGER NOT NULL CHECK (day_of_month BETWEEN 1 AND 31),

      wallet_id INTEGER NOT NULL,
      category_id INTEGER,

      auto_charge INTEGER NOT NULL DEFAULT 1,
      is_active INTEGER NOT NULL DEFAULT 1,

      -- เก็บ 'YYYY-MM' ของรอบล่าสุดที่ถูกตัด/บันทึกจ่ายไปแล้ว กันตัดซ้ำในเดือนเดียวกัน
      last_charged_period TEXT,

      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,

      FOREIGN KEY (wallet_id)
        REFERENCES wallets(id)
        ON DELETE CASCADE,

      FOREIGN KEY (category_id)
        REFERENCES categories(id)
        ON DELETE SET NULL
    );
  `);
}
