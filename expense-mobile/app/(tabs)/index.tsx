import { Pressable, Text, View } from 'react-native';
import { useCallback, useState } from 'react';
import { useFocusEffect, useRouter } from 'expo-router';

import { showAlert } from '@/utils/alert';

import { BalanceCard } from '@/components/transactions/BalanceCard';
import { TransactionSummary } from '@/components/transactions/TransactionSummary';
import { TransactionList } from '@/components/transactions/TransactionList';
import { MonthYearPicker } from '@/components/common/MonthYearPicker';
import { BudgetCard } from '@/components/budgets/BudgetCard';
import { SavingsGoalCard } from '@/components/savingsGoals/SavingsGoalCard';
import { FAB } from '@/components/common/FAB';

import { useTransactions } from '@/hooks/useTransactions';
import { useSettings } from '@/contexts/SettingsContext';
import { deleteTransaction } from '@/database/table/transactions/queries';
import { deleteTransfer } from '@/database/table/transfers/queries';
import { getSavingsGoals } from '@/database/table/savingsGoals/queries';

import { transactionStyles } from '@/styles/transactions';
import { budgetStyles } from '@/styles/budgets';
import { savingsGoalStyles } from '@/styles/savingsGoals';
import type { Transaction } from '@/types/transaction';
import type { SavingsGoal } from '@/types/savingsGoal';

export default function HomeScreen() {
  const { t } = useSettings();
  const router = useRouter();

  const [selectedMonth, setSelectedMonth] = useState(
    new Date().getMonth() + 1
  );
  const [selectedYear, setSelectedYear] = useState(
    new Date().getFullYear()
  );

  const { feed, summary, monthlySummary, budgets, refreshing, refresh } =
    useTransactions(selectedMonth, selectedYear);

  // ดึงเฉพาะเป้าหมายการออมที่เปิดแสดง (is_show = 1) มาโชว์แบบย่อในหน้า overview
  const [savingsGoals, setSavingsGoals] = useState<SavingsGoal[]>([]);

  useFocusEffect(
    useCallback(() => {
      let isActive = true;

      (async () => {
        try {
          const data = await getSavingsGoals();
          if (isActive) {
            setSavingsGoals(data);
          }
        } catch (error) {
          console.error('Failed to load savings goals:', error);
        }
      })();

      return () => {
        isActive = false;
      };
    }, [])
  );

  const currentBalance = summary[0] ?? {
    currency_code: 'THB',
    balance: 0,
  };

  const currentMonthly = monthlySummary[0] ?? {
    currency_code: 'THB',
    income: 0,
    expense: 0,
  };

  const handleItemPress = (transaction: Transaction) => {
    router.push({
      pathname: '/transaction-form',
      params: { id: String(transaction.id) },
    });
  };

  const handleItemLongPress = (transaction: Transaction) => {
    showAlert(
      transaction.note || t.transactions.uncategorized,
      undefined,
      [
        { text: t.common.cancel, style: 'cancel' },
        {
          text: t.common.edit,
          onPress: () => handleItemPress(transaction),
        },
        {
          text: t.common.delete,
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteTransaction(transaction.id);
              refresh();
            } catch (error) {
              console.error('Failed to delete transaction:', error);
            }
          },
        },
      ]
    );
  };

  const handleTransferLongPress = (transferId: number) => {
    showAlert(t.wallet.transferTitle, undefined, [
      { text: t.common.cancel, style: 'cancel' },
      {
        text: t.common.delete,
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteTransfer(transferId);
            refresh();
          } catch (error) {
            console.error('Failed to delete transfer:', error);
          }
        },
      },
    ]);
  };

  // ปัดรายการไปทางซ้ายแล้วแตะปุ่มลบที่โผล่มา -> เด้งยืนยันอีกชั้นก่อนลบจริง
  const handleItemSwipeDelete = (transaction: Transaction) => {
    showAlert(t.common.deleteConfirmTitle, t.transactions.deleteConfirm, [
      { text: t.common.cancel, style: 'cancel' },
      {
        text: t.common.delete,
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteTransaction(transaction.id);
            refresh();
          } catch (error) {
            console.error('Failed to delete transaction:', error);
          }
        },
      },
    ]);
  };

  const handleTransferSwipeDelete = (transferId: number) => {
    showAlert(t.common.deleteConfirmTitle, t.wallet.transferTitle, [
      { text: t.common.cancel, style: 'cancel' },
      {
        text: t.common.delete,
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteTransfer(transferId);
            refresh();
          } catch (error) {
            console.error('Failed to delete transfer:', error);
          }
        },
      },
    ]);
  };

  return (
    <View style={transactionStyles.container}>
      <TransactionList
        feed={feed}
        refreshing={refreshing}
        onRefresh={refresh}
        onItemPress={handleItemPress}
        onItemLongPress={handleItemLongPress}
        onItemDelete={handleItemSwipeDelete}
        onTransferLongPress={handleTransferLongPress}
        onTransferDelete={handleTransferSwipeDelete}
        filtered
        ListHeaderComponent={
          <View style={transactionStyles.header}>
            <Text style={transactionStyles.title}>
              {t.transactions.overview}
            </Text>

            <MonthYearPicker
              month={selectedMonth}
              year={selectedYear}
              onChange={(month, year) => {
                setSelectedMonth(month);
                setSelectedYear(year);
              }}
            />

            <TransactionSummary
              income={currentMonthly.income}
              expense={currentMonthly.expense}
              currencyCode={currentMonthly.currency_code}
            />

            {savingsGoals.length > 0 ? (
              <View style={{ marginTop: 8 }}>

                {savingsGoals.map((goal) => (
                  <SavingsGoalCard
                    key={goal.id}
                    goal={goal}
                    onPress={() =>
                      router.push({
                        pathname: '/savings-goal-form',
                        params: { id: String(goal.id) },
                      })
                    }
                  />
                ))}
              </View>
            ) : null}

            {budgets.length > 0 ? (
              <View style={{ marginTop: 8, marginBottom: 20 }}>
                {budgets.map((budget) => (
                  <BudgetCard
                    key={budget.id}
                    budget={budget}
                    onPress={() =>
                      router.push({
                        pathname: '/budget-form',
                        params: { id: String(budget.id) },
                      })
                    }
                  />
                ))}
              </View>
            ) : null}

            <Text style={transactionStyles.sectionTitle}>
              {t.transactions.recent}
            </Text>
          </View>
        }
        contentContainerStyle={transactionStyles.listContent}
      />

      <FAB onPress={() => router.push('/transaction-form')} />
    </View>
  );
}