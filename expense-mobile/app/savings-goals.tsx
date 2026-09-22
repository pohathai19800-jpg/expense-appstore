import { useCallback, useState } from 'react';
import { FlatList, Text, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';

import { useSettings } from '@/contexts/SettingsContext';
import { FAB } from '@/components/common/FAB';
import { SavingsGoalCard } from '@/components/savingsGoals/SavingsGoalCard';
import { savingsGoalStyles } from '@/styles/savingsGoals';

import { getSavingsGoals } from '@/database/table/savingsGoals/queries';
import type { SavingsGoal } from '@/types/savingsGoal';

export default function SavingsGoalsScreen() {
  const { t } = useSettings();
  const router = useRouter();

  const [goals, setGoals] = useState<SavingsGoal[]>([]);

  const load = useCallback(async () => {
    try {
      const data = await getSavingsGoals();
      setGoals(data);
    } catch (error) {
      console.error('Failed to load savings goals:', error);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

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
          />
        )}
      />

      <FAB onPress={() => router.push('/savings-goal-form')} />
    </View>
  );
}
