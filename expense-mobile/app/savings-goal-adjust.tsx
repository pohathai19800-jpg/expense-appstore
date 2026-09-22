import { useEffect, useState } from 'react';
import {
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { formStyles } from '@/styles/forms';
import { savingsGoalStyles } from '@/styles/savingsGoals';
import { useSettings } from '@/contexts/SettingsContext';
import { formatAmount } from '@/utils/currency';
import { DismissKeyboardWrapper } from '@/components/common/DismissKeyboardWrapper';

import {
  adjustSavingsGoalAmount,
  getSavingsGoalById,
} from '@/database/table/savingsGoals/queries';
import type { SavingsGoal } from '@/types/savingsGoal';

export default function SavingsGoalAdjustScreen() {
  const { t, language } = useSettings();
  const router = useRouter();
  const params = useLocalSearchParams<{
    id: string;
    mode: 'deposit' | 'withdraw';
  }>();

  const goalId = Number(params.id);
  const mode = params.mode === 'withdraw' ? 'withdraw' : 'deposit';
  const isDeposit = mode === 'deposit';

  const [goal, setGoal] = useState<SavingsGoal | null>(null);
  const [amountText, setAmountText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const existing = await getSavingsGoalById(goalId);
        setGoal(existing);
      } catch (err) {
        console.error('Failed to load savings goal:', err);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [goalId]);

  const handleSave = async () => {
    Keyboard.dismiss();

    const amount = parseFloat(amountText.replace(',', '.'));

    if (!amount || amount <= 0 || Number.isNaN(amount)) {
      setError(t.savingsGoal.amountRequired);
      return;
    }

    if (!isDeposit && goal && amount > goal.current_amount) {
      setError(t.savingsGoal.insufficientAmount);
      return;
    }

    setError(null);
    setSaving(true);

    try {
      await adjustSavingsGoalAmount(goalId, isDeposit ? amount : -amount);
      router.back();
    } catch (err) {
      console.error('Failed to adjust savings goal:', err);
      setError(t.common.error);
    } finally {
      setSaving(false);
    }
  };

  if (loading || !goal) {
    return <View style={formStyles.screen} />;
  }

  return (
    <KeyboardAvoidingView
      style={formStyles.screen}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <DismissKeyboardWrapper>
        <ScrollView
          contentContainerStyle={formStyles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={formStyles.headerRow}>
            <Pressable onPress={() => router.back()}>
              <Text style={formStyles.headerButtonMuted}>
                {t.common.cancel}
              </Text>
            </Pressable>

            <Text style={formStyles.headerTitle}>
              {isDeposit
                ? t.savingsGoal.depositTitle
                : t.savingsGoal.withdrawTitle}
            </Text>

            <Pressable onPress={handleSave} disabled={saving}>
              <Text style={formStyles.headerButton}>{t.common.save}</Text>
            </Pressable>
          </View>

          <View style={savingsGoalStyles.summaryCard}>
            <Text style={savingsGoalStyles.summaryLabel}>{goal.name}</Text>
            <Text style={savingsGoalStyles.summaryValue}>
              {formatAmount(goal.current_amount, 'THB', language)}
            </Text>
          </View>

          {error ? <Text style={formStyles.errorText}>{error}</Text> : null}

          <View style={formStyles.field}>
            <Text style={formStyles.label}>{t.savingsGoal.amount}</Text>

            <TextInput
              value={amountText}
              onChangeText={(text) =>
                setAmountText(text.replace(/[^0-9.]/g, ''))
              }
              placeholder="0.00"
              placeholderTextColor="#9CA3AF"
              keyboardType="decimal-pad"
              autoFocus
              style={formStyles.textInput}
            />
          </View>

          <Pressable
            onPress={handleSave}
            disabled={saving}
            style={[
              formStyles.primaryButton,
              !isDeposit && formStyles.primaryButtonExpense,
              saving && formStyles.primaryButtonDisabled,
            ]}
          >
            <Text style={formStyles.primaryButtonText}>
              {isDeposit ? t.savingsGoal.deposit : t.savingsGoal.withdraw}
            </Text>
          </Pressable>
        </ScrollView>
      </DismissKeyboardWrapper>
    </KeyboardAvoidingView>
  );
}
