import { getDatabase } from '@/database/database';
import { seedDatabase } from '@/database/seed';

import { createCurrenciesTable } from '@/database/table/currencies/schema';
import { createWalletsTable } from '@/database/table/wallets/schema';
import { createCategoriesTable } from '@/database/table/categories/schema';
import { createTransactionsTable } from '@/database/table/transactions/schema';
import { createTransfersTable } from '@/database/table/transfers/schema';
import { createSettingsTable } from '@/database/table/settings/schema';
import { createBudgetsTable } from '@/database/table/budgets/schema';
import { createBillsTable } from '@/database/table/bills/schema';
import {
  createBudgetPlansTable,
  createBudgetPlanItemsTable,
} from '@/database/table/budgetPlans/schema';

const DATABASE_VERSION = 1;

// ป้องกันกรณีมีไฟล์ฐานข้อมูลเก่าค้างอยู่ในเครื่อง (เช่น เคยรันแอปเวอร์ชันก่อนหน้า
// ผ่าน Expo Go มาก่อน) ที่สร้างตารางไว้แล้วแต่ยังไม่มีคอลัมน์ล่าสุด เนื่องจาก
// CREATE TABLE IF NOT EXISTS จะไม่เพิ่มคอลัมน์ให้ตารางที่มีอยู่แล้ว
async function ensureColumn(
  table: string,
  column: string,
  definition: string
) {
  const db = await getDatabase();

  const columns = await db.getAllAsync<{ name: string }>(
    `PRAGMA table_info(${table})`
  );

  const exists = columns.some((c) => c.name === column);

  if (!exists) {
    console.log(`🛠️ Adding missing column ${table}.${column}`);
    await db.execAsync(
      `ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`
    );
  }
}

async function ensureSchemaIntegrity() {
  await ensureColumn(
    'wallets',
    'currency_code',
    "TEXT NOT NULL DEFAULT 'THB'"
  );
  await ensureColumn(
    'wallets',
    'initial_balance',
    'REAL NOT NULL DEFAULT 0'
  );
  await ensureColumn('wallets', 'is_active', 'INTEGER NOT NULL DEFAULT 1');
  await ensureColumn(
    'wallets',
    'icon',
    "TEXT NOT NULL DEFAULT 'wallet-outline'"
  );
  await ensureColumn(
    'wallets',
    'color',
    "TEXT NOT NULL DEFAULT '#2563EB'"
  );

  // ตารางใหม่ที่เพิ่มเข้ามาทีหลัง ใช้ CREATE TABLE IF NOT EXISTS จึงเรียกซ้ำได้ทุกครั้งอย่างปลอดภัย
  // (ครอบคลุมทั้งเครื่องที่ติดตั้งแอปใหม่ และเครื่องที่เคยมีฐานข้อมูลเวอร์ชันก่อนหน้าอยู่แล้ว)
  await createBudgetsTable();
  await createBudgetPlansTable();
  await createBudgetPlanItemsTable();
  await createBillsTable();

  await ensureColumn(
    'transactions',
    'bill_id',
    'INTEGER REFERENCES bills(id) ON DELETE SET NULL'
  );
}

export async function migrateDatabase(
  options: { includeDemoWallets?: boolean } = {}
) {
  const db = await getDatabase();

  const result = await db.getFirstAsync<{ user_version: number }>(
    'PRAGMA user_version'
  );

  const currentVersion = result?.user_version ?? 0;

  await db.execAsync('PRAGMA foreign_keys = ON;');

  if (currentVersion < DATABASE_VERSION) {
    await db.withTransactionAsync(async () => {
      if (currentVersion < 1) {
        await createCurrenciesTable();
        await createWalletsTable();
        await createCategoriesTable();
        await createTransactionsTable();
        await createTransfersTable();
        await createSettingsTable();
      }

      await db.execAsync(
        `PRAGMA user_version = ${DATABASE_VERSION};`
      );
    });
  }

  await ensureSchemaIntegrity();
  await seedDatabase(options);
}