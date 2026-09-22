import { getDatabase } from '@/database/database';
import type { Wallet } from '@/types/wallet';

export type WalletWithBalance = Wallet & {
  balance: number;
};

export async function getWallets(): Promise<WalletWithBalance[]> {
  const db = await getDatabase();

  const wallets = await db.getAllAsync<Wallet>(`
    SELECT *
    FROM wallets
    ORDER BY id ASC
  `);

  return Promise.all(
    wallets.map(async (wallet) => ({
      ...wallet,
      is_active: Boolean(wallet.is_active),
      balance: await getWalletBalance(wallet.id),
    }))
  );
}

export async function getActiveWallets(): Promise<WalletWithBalance[]> {
  const db = await getDatabase();

  const wallets = await db.getAllAsync<Wallet>(`
    SELECT *
    FROM wallets
    WHERE is_active = 1
    ORDER BY id ASC
  `);

  return Promise.all(
    wallets.map(async (wallet) => ({
      ...wallet,
      is_active: Boolean(wallet.is_active),
      balance: await getWalletBalance(wallet.id),
    }))
  );
}

export async function getWalletById(
  id: number
): Promise<WalletWithBalance | null> {
  const db = await getDatabase();

  const wallet = await db.getFirstAsync<Wallet>(
    `
      SELECT *
      FROM wallets
      WHERE id = ?
    `,
    id
  );

  if (!wallet) {
    return null;
  }

  return {
    ...wallet,
    is_active: Boolean(wallet.is_active),
    balance: await getWalletBalance(wallet.id),
  };
}

export async function getWalletBalance(
  walletId: number
): Promise<number> {
  const db = await getDatabase();

  const wallet = await db.getFirstAsync<{
    initial_balance: number;
  }>(
    `
      SELECT initial_balance
      FROM wallets
      WHERE id = ?
    `,
    walletId
  );

  if (!wallet) {
    throw new Error('Wallet not found');
  }

  const transactionResult = await db.getFirstAsync<{
    income: number | null;
    expense: number | null;
  }>(
    `
      SELECT
        COALESCE(
          SUM(
            CASE
              WHEN type = 'income' THEN amount
              ELSE 0
            END
          ),
          0
        ) AS income,

        COALESCE(
          SUM(
            CASE
              WHEN type = 'expense' THEN amount
              ELSE 0
            END
          ),
          0
        ) AS expense

      FROM transactions
      WHERE wallet_id = ?
    `,
    walletId
  );

  const transferOut = await db.getFirstAsync<{
    amount: number | null;
  }>(
    `
      SELECT
        COALESCE(SUM(from_amount), 0) AS amount
      FROM transfers
      WHERE from_wallet_id = ?
    `,
    walletId
  );

  const transferIn = await db.getFirstAsync<{
    amount: number | null;
  }>(
    `
      SELECT
        COALESCE(SUM(to_amount), 0) AS amount
      FROM transfers
      WHERE to_wallet_id = ?
    `,
    walletId
  );

  const income = transactionResult?.income ?? 0;
  const expense = transactionResult?.expense ?? 0;
  const outgoing = transferOut?.amount ?? 0;
  const incoming = transferIn?.amount ?? 0;

  return (
    wallet.initial_balance +
    income -
    expense -
    outgoing +
    incoming
  );
}

export async function createWallet(data: {
  name: string;
  currency_code: string;
  initial_balance?: number;
  icon?: string;
  color?: string;
}): Promise<number> {
  const db = await getDatabase();

  const result = await db.runAsync(
    `
      INSERT INTO wallets (
        name,
        currency_code,
        initial_balance,
        icon,
        color
      )
      VALUES (?, ?, ?, ?, ?)
    `,
    data.name,
    data.currency_code,
    data.initial_balance ?? 0,
    data.icon ?? 'wallet-outline',
    data.color ?? '#2563EB'
  );

  return result.lastInsertRowId;
}

export async function updateWallet(
  id: number,
  data: {
    name: string;
    currency_code: string;
    initial_balance: number;
    icon?: string;
    color?: string;
  }
): Promise<void> {
  const db = await getDatabase();

  await db.runAsync(
    `
      UPDATE wallets
      SET
        name = ?,
        currency_code = ?,
        initial_balance = ?,
        icon = ?,
        color = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `,
    data.name,
    data.currency_code,
    data.initial_balance,
    data.icon ?? 'wallet-outline',
    data.color ?? '#2563EB',
    id
  );
}

export async function setWalletActive(
  id: number,
  isActive: boolean
): Promise<void> {
  const db = await getDatabase();

  await db.runAsync(
    `
      UPDATE wallets
      SET
        is_active = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `,
    isActive ? 1 : 0,
    id
  );
}

export type WalletDependencyCounts = {
  transactions: number;
  bills: number;
  budgets: number;
};

// เช็คว่า wallet นี้มีอะไรผูกอยู่บ้างก่อนลบ — transactions/transfers ถูกกันด้วย
// FK RESTRICT อยู่แล้ว (ลบไม่ได้ ต้อง catch error) แต่ bills/budgets ตั้ง
// ON DELETE CASCADE ไว้ ลบ wallet แล้วจะถูกลบตามไปด้วยแบบเงียบๆ โดยไม่มี error
// ให้ catch จึงต้องเช็คล่วงหน้าเพื่อเตือนผู้ใช้ก่อน
export async function getWalletDependencyCounts(
  walletId: number
): Promise<WalletDependencyCounts> {
  const db = await getDatabase();

  const transactionRow = await db.getFirstAsync<{ count: number }>(
    `SELECT COUNT(*) AS count FROM transactions WHERE wallet_id = ?`,
    walletId
  );

  const transferRow = await db.getFirstAsync<{ count: number }>(
    `
      SELECT COUNT(*) AS count
      FROM transfers
      WHERE from_wallet_id = ? OR to_wallet_id = ?
    `,
    walletId,
    walletId
  );

  const billRow = await db.getFirstAsync<{ count: number }>(
    `SELECT COUNT(*) AS count FROM bills WHERE wallet_id = ?`,
    walletId
  );

  const budgetRow = await db.getFirstAsync<{ count: number }>(
    `SELECT COUNT(*) AS count FROM budgets WHERE wallet_id = ?`,
    walletId
  );

  return {
    transactions: (transactionRow?.count ?? 0) + (transferRow?.count ?? 0),
    bills: billRow?.count ?? 0,
    budgets: budgetRow?.count ?? 0,
  };
}

export async function deleteWallet(id: number): Promise<void> {
  const db = await getDatabase();

  await db.runAsync(
    `
      DELETE FROM wallets
      WHERE id = ?
    `,
    id
  );
}