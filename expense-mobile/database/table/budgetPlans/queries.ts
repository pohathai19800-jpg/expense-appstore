import { getDatabase } from '@/database/database';
import type { BudgetPlan, BudgetPlanItem } from '@/types/budgetPlan';

/**
 * ดึงแผนจัดสรรงบของเดือน/ปีที่ระบุ — คืนเฉพาะหมวดหมู่ที่ผู้ใช้ "เพิ่มเข้าแผนเอง" เท่านั้น
 * (ไม่ได้ดึงหมวดหมู่รายจ่ายทั้งหมดมาแสดง) พร้อมยอดที่ใช้จริงไปแล้วของเดือนนั้นในแต่ละหมวด
 * ไว้เทียบกับแผน — ถ้ายังไม่เคยตั้งแผนของเดือนนี้ จะได้ target_income = 0 และ items = []
 */
export async function getBudgetPlan(
  year: number,
  month: number
): Promise<BudgetPlan> {
  const db = await getDatabase();

  const prefix = `${year}-${String(month).padStart(2, '0')}`;

  const plan = await db.getFirstAsync<{ id: number; target_income: number }>(
    `SELECT id, target_income FROM budget_plans WHERE year = ? AND month = ?`,
    year,
    month
  );

  if (!plan) {
    return { target_income: 0, items: [] };
  }

  const items = await db.getAllAsync<BudgetPlanItem>(
    `
      SELECT
        c.id AS category_id,
        c.name_key,
        c.icon,
        c.color,
        pi.percentage AS percentage,
        COALESCE(
          (
            SELECT SUM(t.amount)
            FROM transactions t
            WHERE t.type = 'expense'
              AND t.category_id = c.id
              AND t.transaction_date LIKE ?
          ),
          0
        ) AS spent
      FROM budget_plan_items pi
      INNER JOIN categories c ON c.id = pi.category_id
      WHERE pi.plan_id = ?
      ORDER BY pi.id ASC
    `,
    `${prefix}%`,
    plan.id
  );

  return {
    target_income: plan.target_income,
    items,
  };
}

/**
 * บันทึกแผนจัดสรรงบของเดือน/ปีที่ระบุแบบเขียนทับทั้งหมด (ยอดรายรับรวม + % ของทุกหมวดหมู่)
 */
export async function saveBudgetPlan(
  year: number,
  month: number,
  targetIncome: number,
  items: { category_id: number; percentage: number }[]
): Promise<void> {
  const db = await getDatabase();

  await db.withTransactionAsync(async () => {
    const existing = await db.getFirstAsync<{ id: number }>(
      `SELECT id FROM budget_plans WHERE year = ? AND month = ?`,
      year,
      month
    );

    let planId: number;

    if (existing) {
      planId = existing.id;

      await db.runAsync(
        `
          UPDATE budget_plans
          SET target_income = ?, updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `,
        targetIncome,
        planId
      );
    } else {
      const result = await db.runAsync(
        `INSERT INTO budget_plans (year, month, target_income) VALUES (?, ?, ?)`,
        year,
        month,
        targetIncome
      );

      planId = result.lastInsertRowId;
    }

    // เขียนทับ % ของทุกหมวดหมู่ใหม่ทั้งหมด (ตัดหมวดที่ไม่ได้จัดสรร % ออกไปเลย)
    await db.runAsync(`DELETE FROM budget_plan_items WHERE plan_id = ?`, planId);

    for (const item of items) {
      if (item.percentage <= 0) continue;

      await db.runAsync(
        `
          INSERT INTO budget_plan_items (plan_id, category_id, percentage)
          VALUES (?, ?, ?)
        `,
        planId,
        item.category_id,
        item.percentage
      );
    }
  });
}
