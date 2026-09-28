import { Pressable, Switch, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { useSettings } from '@/contexts/SettingsContext';
import { formatAmount } from '@/utils/currency';
import type { SavingsGoal } from '@/types/savingsGoal';
import { savingsGoalStyles as styles } from '@/styles/savingsGoals';

type SavingsGoalCardProps = {
  goal: SavingsGoal;
  onPress?: () => void;
  onDeposit?: () => void;
  onWithdraw?: () => void;
  onToggleShow?: (isShow: boolean) => void;
};

export function SavingsGoalCard({
  goal,
  onPress,
  onDeposit,
  onWithdraw,
  onToggleShow,
}: SavingsGoalCardProps) {
  const { t, language } = useSettings();

  const progress = Math.min(goal.current_amount / goal.target_amount, 1);
  const percent = progress * 100;
  const isReached = goal.current_amount >= goal.target_amount;
  const isShow = goal.is_show !== 0;

  return (
    <Pressable onPress={onPress} style={styles.card}>
      <View style={styles.headerRow}>
        <View style={{ flex: 1 }}>
          <Text style={styles.name}>{goal.name}</Text>

          {isReached ? (
            <View style={styles.reachedBadge}>
              <Ionicons name="checkmark-circle" size={12} color="#16A34A" />
              <Text style={styles.reachedBadgeText}>
                {t.savingsGoal.goalReached}
              </Text>
            </View>
          ) : (
            <Text style={styles.percentText}>{percent.toFixed(0)}%</Text>
          )}
        </View>

        <Text style={styles.amountText}>
          {formatAmount(goal.current_amount, 'THB', language)}
          <Text style={styles.amountOfText}>
            {' '}
            / {formatAmount(goal.target_amount, 'THB', language)}
          </Text>
        </Text>
      </View>

      <View style={styles.track}>
        <View style={[styles.fill, { width: `${percent}%` }]} />
      </View>

      {onDeposit || onWithdraw ? (
        <View style={styles.actionRow}>
          <Pressable
            onPress={onDeposit}
            style={[styles.actionButton, styles.depositButton]}
          >
            <Ionicons name="arrow-down" size={14} color="#16A34A" />
            <Text style={styles.depositButtonText}>
              {t.savingsGoal.deposit}
            </Text>
          </Pressable>

          <Pressable
            onPress={onWithdraw}
            style={[styles.actionButton, styles.withdrawButton]}
          >
            <Ionicons name="arrow-up" size={14} color="#DC2626" />
            <Text style={styles.withdrawButtonText}>
              {t.savingsGoal.withdraw}
            </Text>
          </Pressable>
        </View>
      ) : null}

            {onToggleShow ? (
              <Pressable
                onPress={(e) => e.stopPropagation()}
                style={styles.showToggleRow}
              >
                <Text style={styles.showToggleLabel}>
                  {t.savingsGoal.showOnList}
                </Text>
                <Switch value={isShow} onValueChange={onToggleShow} />
              </Pressable>
            ) : null}
    </Pressable>
  );
}
