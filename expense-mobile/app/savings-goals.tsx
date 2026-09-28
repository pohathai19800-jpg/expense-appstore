import { useCallback, useState } from 'react';
import { FlatList, Text, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';

import { useSettings } from '@/contexts/SettingsContext';
import { usePurchases } from '@/contexts/PurchasesContext';
import { FAB } from '@/components/common/FAB';
import { SavingsGoalCard } from '@/components/savingsGoals/SavingsGoalCard';
import { savingsGoalStyles } from '@/styles/savingsGoals';
import { showAlert } from '@/utils/alert';

import {
  getSavingsGoals,
  setSavingsGoalShow,
} from '@/database/table/savingsGoals/queries';
import type { SavingsGoal } from '@/types/savingsGoal';

// จำนวนเป้าหมายการออมสูงสุดที่ผู้ใช้ฟรี (ยังไม่สมัคร Pro) สร้างได้
const FREE_SAVINGS_GOAL_LIMIT = 1;

export default function SavingsGoalsScreen() {
  const { t } = useSettings();
  const { isPro } = usePurchases();
  const router = useRouter();

  const [goals, setGoals] = useState<SavingsGoal[]>([]);

  // หน้านี้โชว์ทุกรายการเสมอ ไม่สนใจ is_show — ปุ่ม toggle ที่การ์ดมีผลแค่กับหน้า overview เท่านั้น
  const load = useCallback(async () => {
    try {
      const data = await getSavingsGoals(true);
      setGoals(data);
    } catch (error) {
      console.error('Failed to load savings goals:', error);
    }
  }, []);

  const handleToggleShow = useCallback(
    async (id: number, isShow: boolean) => {
      try {
        await setSavingsGoalShow(id, isShow);
        await load();
      } catch (error) {
        console.error('Failed to toggle savings goal visibility:', error);
      }
    },
    [load]
  );

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  // ผู้ใช้ฟรีสร้างเป้าหมายการออมได้ไม่เกิน FREE_SAVINGS_GOAL_LIMIT รายการ
  // ของเดิมที่มีอยู่แล้วดู/แก้ไข/ฝาก-ถอนได้ปกติ
  const handleAddGoal = () => {
    if (!isPro && goals.length >= FREE_SAVINGS_GOAL_LIMIT) {
      showAlert(
        t.subscription.itemLimitTitle,
        t.subscription.itemLimitMessage.replace(
          '{limit}',
          String(FREE_SAVINGS_GOAL_LIMIT)
        ),
        [
          { text: t.common.cancel, style: 'cancel' },
          {
            text: t.subscription.upgrade,
            onPress: () => router.push('/paywall'),
          },
        ]
      );
      return;
    }

    router.push('/savings-goal-form');
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#F5F7FA' }}>
      <FlatList
        data={goals}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={{
          padding: 20,
          paddingTop: 60,
          paddingBottom: 100,
        }}
        ListHeaderComponent={
          <Text
            style={{
              fontSize: 26,
              fontWeight: '700',
              color: '#111827',
              marginBottom: 20,
            }}
          >
            {t.savingsGoal.title}
          </Text>
        }
        ListEmptyComponent={
          <View style={savingsGoalStyles.emptyCard}>
            <Text style={savingsGoalStyles.emptyTitle}>
              {t.savingsGoal.empty}
            </Text>
            <Text style={savingsGoalStyles.emptySubtitle}>
              {t.savingsGoal.emptySubtitle}
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <SavingsGoalCard
            goal={item}
            onPress={() =>
              router.push({
                pathname: '/savings-goal-form',
                params: { id: String(item.id) },
              })
            }
            onDeposit={() =>
              router.push({
                pathname: '/savings-goal-adjust',
                params: { id: String(item.id), mode: 'deposit' },
              })
            }
            onWithdraw={() =>
              router.push({
                pathname: '/savings-goal-adjust',
                params: { id: String(item.id), mode: 'withdraw' },
              })
            }
            onToggleShow={(isShow) => handleToggleShow(item.id, isShow)}
          />
        )}
      />

      <FAB onPress={handleAddGoal} />
    </View>
  );
}
