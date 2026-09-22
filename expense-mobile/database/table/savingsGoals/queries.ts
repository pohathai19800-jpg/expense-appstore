import { getDatabase } from '@/database/database';
import type { SavingsGoal } from '@/types/savingsGoal';

export async function getSavingsGoals(
  includeHidden: boolean = false
): Promise<SavingsGoal[]> {
  const db = await getDatabase();

  return db.getAllAsync<SavingsGoal>(
    `SELECT id, name, target_amount, current_amount, is_show, created_at, updated_at
     FROM savings_goals
     WHERE (? = 1 OR is_show = 1)
     ORDER BY is_show DESC, id DESC`,
    includeHidden ? 1 : 0
  );
}

export async function getSavingsGoalById(
  id: number
): Promise<SavingsGoal | null> {
  const db = await getDatabase();

  const goal = await db.getFirstAsync<SavingsGoal>(
    `SELECT id, name, target_amount, current_amount, is_show, created_at, updated_at
     FROM savings_goals
     WHERE id = ?`,
    id
  );

  return goal ?? null;
}

// ควบคุมว่ารายการนี้จะแสดงในหน้า list หรือไม่ (ไม่กระทบยอดเงินหรือการทำงานอื่นของเป้าหมาย)
export async function setSavingsGoalShow(
  id: number,
  isShow: boolean
): Promise<void> {
  const db = await getDatabase();

  await db.runAsync(
    `UPDATE savings_goals
     SET is_show = ?, updated_at = CURRENT_TIMESTAMP
     WHERE id = ?`,
    isShow ? 1 : 0,
    id
  );
}

export async function createSavingsGoal(payload: {
  name: string;
  target_amount: number;
}): Promise<number> {
  const db = await getDatabase();

  const result = await db.runAsync(
    `INSERT INTO savings_goals (name, target_amount, current_amount)
     VALUES (?, ?, 0)`,
    payload.name,
    payload.target_amount
  );

  return result.lastInsertRowId;
}

export async function updateSavingsGoal(
  id: number,
  payload: { name: string; target_amount: number }
): Promise<void> {
  const db = await getDatabase();

  await db.runAsync(
    `UPDATE savings_goals
     SET name = ?, target_amount = ?, updated_at = CURRENT_TIMESTAMP
     WHERE id = ?`,
    payload.name,
    payload.target_amount,
    id
  );
}

export async function deleteSavingsGoal(id: number): Promise<void> {
  const db = await getDatabase();

  await db.runAsync(`DELETE FROM savings_goals WHERE id = ?`, id);
}

// delta เป็นบวก = ฝากเพิ่ม, ลบ = ถอนออก ยอดจะไม่มีวันติดลบ (clamp ที่ 0)
export async function adjustSavingsGoalAmount(
  id: number,
  delta: number
): Promise<void> {
  const db = await getDatabase();

  await db.runAsync(
    `UPDATE savings_goals
     SET current_amount = MAX(current_amount + ?, 0),
         updated_at = CURRENT_TIMESTAMP
     WHERE id = ?`,
    delta,
    id
  );
}
