import { getDatabase } from '@/database/database';

export async function createSavingsGoalsTable() {
  const db = await getDatabase();

  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS savings_goals (
      id INTEGER PRIMARY KEY AUTOINCREMENT,

      name TEXT NOT NULL,

      target_amount REAL NOT NULL CHECK (target_amount > 0),
      current_amount REAL NOT NULL DEFAULT 0,

      is_show INTEGER NOT NULL DEFAULT 1,

      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `);
}
