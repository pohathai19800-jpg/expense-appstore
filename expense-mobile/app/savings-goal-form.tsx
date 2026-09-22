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
import { useSettings } from '@/contexts/SettingsContext';
import { showAlert } from '@/utils/alert';
import { DismissKeyboardWrapper } from '@/components/common/DismissKeyboardWrapper';

import {
  createSavingsGoal,
  deleteSavingsGoal,
  getSavingsGoalById,
  updateSavingsGoal,
} from '@/database/table/savingsGoals/queries';

export default function SavingsGoalFormScreen() {
  const { t } = useSettings();
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string }>();

  const editingId = params.id ? Number(params.id) : null;
  const isEditing = editingId !== null;

  const [name, setName] = useState('');
  const [targetAmountText, setTargetAmountText] = useState('');

  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        if (editingId) {
          const existing = await getSavingsGoalById(editingId);

          if (existing) {
            setName(existing.name);
            setTargetAmountText(String(existing.target_amount));
          }
        }
      } catch (err) {
        console.error('Failed to load savings goal form data:', err);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [editingId]);

  const handleSave = async () => {
    Keyboard.dismiss();

    if (!name.trim()) {
      setError(t.savingsGoal.nameRequired);
      return;
    }

    const targetAmount = parseFloat(targetAmountText.replace(',', '.'));

    if (!targetAmount || targetAmount <= 0 || Number.isNaN(targetAmount)) {
      setError(t.savingsGoal.targetAmountRequired);
      return;
    }

    setError(null);
    setSaving(true);

    try {
      const payload = {
        name: name.trim(),
        target_amount: targetAmount,
      };

      if (isEditing && editingId) {
        await updateSavingsGoal(editingId, payload);
      } else {
        await createSavingsGoal(payload);
      }

      router.back();
    } catch (err) {
      console.error('Failed to save savings goal:', err);
      setError(t.common.error);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = () => {
    if (!editingId) return;

    showAlert(t.common.deleteConfirmTitle, t.savingsGoal.deleteConfirm, [
      { text: t.common.cancel, style: 'cancel' },
      {
        text: t.common.delete,
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteSavingsGoal(editingId);
            router.back();
          } catch (err) {
            console.error('Failed to delete savings goal:', err);
          }
        },
      },
    ]);
  };

  if (loading) {
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
              {isEditing ? t.savingsGoal.editGoal : t.savingsGoal.addGoal}
            </Text>

            <Pressable onPress={handleSave} disabled={saving}>
              <Text style={formStyles.headerButton}>{t.common.save}</Text>
            </Pressable>
          </View>

          {error ? <Text style={formStyles.errorText}>{error}</Text> : null}

          <View style={formStyles.field}>
            <Text style={formStyles.label}>{t.savingsGoal.name}</Text>

            <TextInput
              value={name}
              onChangeText={setName}
              placeholder={t.savingsGoal.namePlaceholder}
              placeholderTextColor="#9CA3AF"
              style={formStyles.textInput}
            />
          </View>

          <View style={formStyles.field}>
            <Text style={formStyles.label}>{t.savingsGoal.targetAmount}</Text>

            <TextInput
              value={targetAmountText}
              onChangeText={(text) =>
                setTargetAmountText(text.replace(/[^0-9.]/g, ''))
              }
              placeholder="0.00"
              placeholderTextColor="#9CA3AF"
              keyboardType="decimal-pad"
              style={formStyles.textInput}
            />
          </View>

          <Pressable
            onPress={handleSave}
            disabled={saving}
            style={[
              formStyles.primaryButton,
              saving && formStyles.primaryButtonDisabled,
            ]}
          >
            <Text style={formStyles.primaryButtonText}>{t.common.save}</Text>
          </Pressable>

          {isEditing ? (
            <Pressable onPress={handleDelete} style={formStyles.dangerButton}>
              <Text style={formStyles.dangerButtonText}>
                {t.common.delete}
              </Text>
            </Pressable>
          ) : null}
        </ScrollView>
      </DismissKeyboardWrapper>
    </KeyboardAvoidingView>
  );
}
