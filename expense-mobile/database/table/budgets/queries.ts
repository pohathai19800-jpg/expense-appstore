import { getDatabase } from '@/database/database';
import type { Budget, BudgetWithSpent } from '@/types/budget';

export async function getBudgets(): Promise<Budget[]> {
  const db = await getDatabase();

  return db.getAllAsync<Budget>(`
    SELECT *
    FROM budgets
    ORDER BY created_at ASC
  `);
}

export async function getBudgetById(id: number): Promise<Budget | null> {
  const db = await getDatabase();

  return db.getFirstAsync<Budget>(
    `
      SELECT *
      FROM budgets
      WHERE id = ?
    `,
    id
  );
}

export async function createBudget(data: {
  name: string;
  wallet_id?: number | null;
  category_id?: number | null;
  amount: number;
}): Promise<number> {
  const db = await getDatabase();

  if (data.amount <= 0) {
    throw new Error('Budget amount must be greater than 0');
  }

  const result = await db.runAsync(
    `
      INSERT INTO budgets (name, wallet_id, category_id, amount)
      VALUES (?, ?, ?, ?)
    `,
    data.name,
    data.wallet_id ?? null,
    data.category_id ?? null,
    data.amount
  );

  return result.lastInsertRowId;
}

export async function updateBudget(
  id: number,
  data: {
    name: string;
    wallet_id?: number | null;
    category_id?: number | null;
    amount: number;
  }
): Promise<void> {
  const db = await getDatabase();

  if (data.amount <= 0) {
    throw new Error('Budget amount must be greater than 0');
  }

  await db.runAsync(
    `
      UPDATE budgets
      SET
        name = ?,
        wallet_id = ?,
        category_id = ?,
        amount = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `,
    data.name,
    data.wallet_id ?? null,
    data.category_id ?? null,
    data.amount,
    id
  );
}

export async function deleteBudget(id: number): Promise<void> {
  const db = await getDatabase();

  await db.runAsync(
    `
      DELETE FROM budgets
      WHERE id = ?
    `,
    id
  );
}

/**
 * ดึงงบประมาณทั้งหมด พร้อมคำนวณยอดที่ใช้ไปแล้วของเดือน/ปีที่ระบุ
 * งบที่ไม่ผูก wallet/category (ค่า NULL) จะนับรวมทุก wallet/category โดยอัตโนมัติ
 */
export async function getBudgetsWithSpent(
  year: number,
  month: number,
  includeHidden: boolean = false
): Promise<BudgetWithSpent[]> {
  const db = await getDatabase();

  const prefix = `${year}-${String(month).padStart(2, '0')}`;

  return db.getAllAsync<BudgetWithSpent>(
    `
      SELECT
        b.id,
        b.name,
        b.wallet_id,
        b.category_id,
        b.amount,
        b.is_show,
        b.created_at,
        b.updated_at,

        w.name AS wallet_name,
        w.currency_code AS wallet_currency_code,

        c.name_key AS category_name_key,
        c.icon AS category_icon,
        c.color AS category_color,

        COALESCE(
          (
            SELECT SUM(t.amount)
            FROM transactions t
            WHERE t.type = 'expense'
              AND t.transaction_date LIKE ?
              AND (b.wallet_id IS NULL OR t.wallet_id = b.wallet_id)
              AND (b.category_id IS NULL OR t.category_id = b.category_id)
          ),
          0
        ) AS spent

      FROM budgets b
      LEFT JOIN wallets w ON w.id = b.wallet_id
      LEFT JOIN categories c ON c.id = b.category_id
      WHERE (? = 1 OR b.is_show = 1)
      ORDER BY b.is_show DESC, b.created_at ASC
    `,
    `${prefix}%`,
    includeHidden ? 1 : 0
  );
}

// ควบคุมว่ารายการนี้จะแสดงในหน้า list หรือไม่ (ไม่กระทบการคำนวณ/การทำงานอื่นของงบประมาณ)
export async function setBudgetShow(
  id: number,
  isShow: boolean
): Promise<void> {
  const db = await getDatabase();

  await db.runAsync(
    `
      UPDATE budgets
      SET is_show = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `,
    isShow ? 1 : 0,
    id
  );
}
