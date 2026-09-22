import { getDatabase } from '@/database/database';

// เก็บ "แผนจัดสรรงบ" ของแต่ละเดือน — 1 เดือน มีได้แค่ 1 แผน (target_income รวม)
export async function createBudgetPlansTable() {
  const db = await getDatabase();

  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS budget_plans (
      id INTEGER PRIMARY KEY AUTOINCREMENT,

      year INTEGER NOT NULL,
      month INTEGER NOT NULL,

      target_income REAL NOT NULL DEFAULT 0,

      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,

      UNIQUE (year, month)
    );
  `);
}

// เก็บ % ที่จัดสรรให้แต่ละหมวดหมู่รายจ่าย ภายใต้แผนของเดือนนั้นๆ
export async function createBudgetPlanItemsTable() {
  const db = await getDatabase();

  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS budget_plan_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,

      plan_id INTEGER NOT NULL,
      category_id INTEGER NOT NULL,

      percentage REAL NOT NULL CHECK (percentage >= 0 AND percentage <= 100),

      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,

      FOREIGN KEY (plan_id)
        REFERENCES budget_plans(id)
        ON DELETE CASCADE,

      FOREIGN KEY (category_id)
        REFERENCES categories(id)
        ON DELETE CASCADE,

      UNIQUE (plan_id, category_id)
    );
  `);
}
