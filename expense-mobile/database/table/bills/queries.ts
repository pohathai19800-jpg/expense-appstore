import { getDatabase } from '@/database/database';
import { toDateKey } from '@/utils/date';
import type { Bill, BillWithDetails } from '@/types/bill';

function currentPeriod(date: Date = new Date()): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

function daysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

// SQLite เก็บ boolean เป็น INTEGER (0/1) จริงๆ ไม่ใช่ true/false แม้ type จะบอกว่าเป็น
// boolean ก็ตาม (TypeScript รู้แค่ตอน compile) ต้องแปลงให้เป็น boolean จริงตรงนี้
// ไม่งั้นค่า 0/1 ดิบๆ จะทำให้ <Switch> แสดงผล/ทำงานผิดพลาดได้ โดยเฉพาะบน Android
function normalizeBill<T extends { auto_charge: unknown; is_active: unknown }>(
  row: T
): T {
  return {
    ...row,
    auto_charge: Boolean(row.auto_charge),
    is_active: Boolean(row.is_active),
  };
}

export async function getBillsWithDetails(): Promise<BillWithDetails[]> {
  const db = await getDatabase();

  const rows = await db.getAllAsync<BillWithDetails>(`
    SELECT
      b.*,
      w.name AS wallet_name,
      w.currency_code AS wallet_currency_code,
      c.name_key AS category_name_key,
      c.icon AS category_icon,
      c.color AS category_color
    FROM bills b
    INNER JOIN wallets w ON w.id = b.wallet_id
    LEFT JOIN categories c ON c.id = b.category_id
    WHERE b.is_active = 1
    ORDER BY b.day_of_month ASC, b.created_at ASC
  `);

  return rows.map(normalizeBill);
}

export async function getBillById(id: number): Promise<Bill | null> {
  const db = await getDatabase();

  const row = await db.getFirstAsync<Bill>(
    `SELECT * FROM bills WHERE id = ?`,
    id
  );

  return row ? normalizeBill(row) : null;
}

export async function createBill(data: {
  name: string;
  amount: number;
  day_of_month: number;
  wallet_id: number;
  category_id?: number | null;
  auto_charge: boolean;
}): Promise<number> {
  const db = await getDatabase();

  const result = await db.runAsync(
    `
      INSERT INTO bills (name, amount, day_of_month, wallet_id, category_id, auto_charge)
      VALUES (?, ?, ?, ?, ?, ?)
    `,
    data.name,
    data.amount,
    data.day_of_month,
    data.wallet_id,
    data.category_id ?? null,
    data.auto_charge ? 1 : 0
  );

  return result.lastInsertRowId;
}

export async function updateBill(
  id: number,
  data: {
    name: string;
    amount: number;
    day_of_month: number;
    wallet_id: number;
    category_id?: number | null;
    auto_charge: boolean;
  }
): Promise<void> {
  const db = await getDatabase();

  await db.runAsync(
    `
      UPDATE bills
      SET
        name = ?,
        amount = ?,
        day_of_month = ?,
        wallet_id = ?,
        category_id = ?,
        auto_charge = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `,
    data.name,
    data.amount,
    data.day_of_month,
    data.wallet_id,
    data.category_id ?? null,
    data.auto_charge ? 1 : 0,
    id
  );
}

// "ปิดบิล" — หยุดวนรอบรายเดือน แต่ไม่ลบประวัติธุรกรรมที่เคยตัดไปแล้ว
export async function closeBill(id: number): Promise<void> {
  const db = await getDatabase();

  await db.runAsync(
    `UPDATE bills SET is_active = 0, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
    id
  );
}

export async function deleteBill(id: number): Promise<void> {
  const db = await getDatabase();

  await db.runAsync(`DELETE FROM bills WHERE id = ?`, id);
}

export async function toggleBillAutoCharge(
  id: number,
  autoCharge: boolean
): Promise<void> {
  const db = await getDatabase();

  await db.runAsync(
    `UPDATE bills SET auto_charge = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
    autoCharge ? 1 : 0,
    id
  );
}

// บันทึกว่าบิลนี้จ่ายแล้วสำหรับรอบปัจจุบัน (ใช้ทั้งจากปุ่ม "จ่ายแล้ว" ที่กดเอง
// และจากระบบตัดเงินอัตโนมัติ) สร้างธุรกรรมรายจ่ายจริงให้ด้วย
export async function markBillPaid(billId: number): Promise<void> {
  const db = await getDatabase();

  const bill = await db.getFirstAsync<Bill>(
    `SELECT * FROM bills WHERE id = ?`,
    billId
  );

  if (!bill) return;

  const now = new Date();
  const period = currentPeriod(now);

  // กันตัดซ้ำ — ถ้ารอบนี้ถูกบันทึกจ่ายไปแล้ว (ไม่ว่าจะกดเองหรือตัดอัตโนมัติ)
  // ไม่ต้องสร้างธุรกรรมซ้ำอีก ไม่ควรพึ่งแค่ฝั่ง UI ที่ซ่อนปุ่มไว้เท่านั้น
  if (bill.last_charged_period === period) return;

  await db.runAsync(
    `
      INSERT INTO transactions (wallet_id, category_id, bill_id, type, amount, note, transaction_date)
      VALUES (?, ?, ?, 'expense', ?, ?, ?)
    `,
    bill.wallet_id,
    bill.category_id,
    bill.id,
    bill.amount,
    bill.name,
    toDateKey(now)
  );

  await db.runAsync(
    `UPDATE bills SET last_charged_period = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
    period,
    billId
  );
}

/**
 * เรียกทุกครั้งที่เปิดแอป — เช็คบิลที่เปิด auto_charge ไว้ทุกใบ ว่าถึงกำหนดวันจ่าย
 * ของเดือนนี้แล้วหรือยัง (และยังไม่เคยตัดของเดือนนี้ไป) ถ้าถึงกำหนด จะสร้างธุรกรรม
 * รายจ่ายให้อัตโนมัติ ไม่ต้องมี background job ฝั่งเซิร์ฟเวอร์ เพราะเช็คตอนเปิดแอปแทน
 */
export async function processDueBills(): Promise<void> {
  const db = await getDatabase();
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  const day = now.getDate();
  const period = currentPeriod(now);

  const bills = await db.getAllAsync<Bill>(
    `SELECT * FROM bills WHERE is_active = 1 AND auto_charge = 1`
  );

  for (const bill of bills) {
    if (bill.last_charged_period === period) continue;

    const effectiveDay = Math.min(bill.day_of_month, daysInMonth(year, month));

    if (day >= effectiveDay) {
      const transactionDate = `${year}-${String(month).padStart(2, '0')}-${String(
        effectiveDay
      ).padStart(2, '0')}`;

      await db.runAsync(
        `
          INSERT INTO transactions (wallet_id, category_id, bill_id, type, amount, note, transaction_date)
          VALUES (?, ?, ?, 'expense', ?, ?, ?)
        `,
        bill.wallet_id,
        bill.category_id,
        bill.id,
        bill.amount,
        bill.name,
        transactionDate
      );

      await db.runAsync(
        `UPDATE bills SET last_charged_period = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
        period,
        bill.id
      );
    }
  }
}

export function isBillPaidThisMonth(bill: Bill): boolean {
  return bill.last_charged_period === currentPeriod();
}