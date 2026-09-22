import { useCallback, useState } from 'react';
import { FlatList, Text, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';

import { useSettings } from '@/contexts/SettingsContext';
import { FAB } from '@/components/common/FAB';
import { MonthYearPicker } from '@/components/common/MonthYearPicker';
import { BudgetCard } from '@/components/budgets/BudgetCard';
import { budgetStyles } from '@/styles/budgets';

import {
  getBudgetsWithSpent,
  setBudgetShow,
} from '@/database/table/budgets/queries';
import type { BudgetWithSpent } from '@/types/budget';

export default function BudgetsScreen() {
  const { t } = useSettings();
  const router = useRouter();

  const [selectedMonth, setSelectedMonth] = useState(
    new Date().getMonth() + 1
  );
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  const [budgets, setBudgets] = useState<BudgetWithSpent[]>([]);

  // หน้านี้โชว์ทุกรายการเสมอ ไม่สนใจ is_show — ปุ่ม toggle ที่การ์ดมีผลแค่กับหน้า overview เท่านั้น
  const load = useCallback(async () => {
    try {
      const data = await getBudgetsWithSpent(
        selectedYear,
        selectedMonth,
        true
      );
      setBudgets(data);
    } catch (error) {
      console.error('Failed to load budgets:', error);
    }
  }, [selectedMonth, selectedYear]);

  const handleToggleShow = useCallback(
    async (id: number, isShow: boolean) => {
      try {
        await setBudgetShow(id, isShow);
        await load();
      } catch (error) {
        console.error('Failed to toggle budget visibility:', error);
      }
    },
    [load]
  );

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  return (
    <View style={{ flex: 1, backgroundColor: '#F5F7FA' }}>
      <FlatList
        data={budgets}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={{
          padding: 20,
          paddingTop: 60,
          paddingBottom: 100,
        }}
        ListHeaderComponent={
          <View style={{ marginBottom: 8 }}>
            <Text
              style={{
                fontSize: 26,
                fontWeight: '700',
                color: '#111827',
                marginBottom: 20,
              }}
            >
              {t.budget.title}
            </Text>

            <MonthYearPicker
              month={selectedMonth}
              year={selectedYear}
              onChange={(month, year) => {
                setSelectedMonth(month);
                setSelectedYear(year);
              }}
            />

            <View style={{ height: 16 }} />
          </View>
        }
        ListEmptyComponent={
          <View style={budgetStyles.emptyCard}>
            <Text style={budgetStyles.emptyTitle}>{t.budget.empty}</Text>
            <Text style={budgetStyles.emptySubtitle}>
              {t.budget.emptySubtitle}
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <BudgetCard
            budget={item}
            onPress={() =>
              router.push({
                pathname: '/budget-form',
                params: { id: String(item.id) },
              })
            }
            onToggleShow={(isShow) => handleToggleShow(item.id, isShow)}
          />
        )}
      />

      <FAB onPress={() => router.push('/budget-form')} />
    </View>
  );
}
