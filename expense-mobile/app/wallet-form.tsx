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
import { Ionicons } from '@expo/vector-icons';

import { formStyles } from '@/styles/forms';
import { useSettings } from '@/contexts/SettingsContext';
import { showAlert } from '@/utils/alert';

import { SelectField } from '@/components/common/SelectField';
import { DismissKeyboardWrapper } from '@/components/common/DismissKeyboardWrapper';

import { getActiveCurrencies } from '@/database/table/currencies/queries';
import {
  createWallet,
  deleteWallet,
  getWalletById,
  getWalletDependencyCounts,
  updateWallet,
} from '@/database/table/wallets/queries';

import type { Currency } from '@/types/currency';
import { CATEGORY_COLORS, WALLET_ICONS } from '@/constants/categories';

export default function WalletFormScreen() {
  const { t } = useSettings();
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string }>();

  const editingId = params.id ? Number(params.id) : null;
  const isEditing = editingId !== null;

  const [name, setName] = useState('');
  const [currencyCode, setCurrencyCode] = useState<string | null>('THB');
  const [initialBalanceText, setInitialBalanceText] = useState('0');
  const [icon, setIcon] = useState<string>('wallet-outline');
  const [color, setColor] = useState<string>('#2563EB');
  const [currencies, setCurrencies] = useState<Currency[]>([]);

  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const currencyList = await getActiveCurrencies();
        setCurrencies(currencyList);

        if (editingId) {
          const existing = await getWalletById(editingId);

          if (existing) {
            setName(existing.name);
            setCurrencyCode(existing.currency_code);
            setInitialBalanceText(String(existing.initial_balance));
            setIcon(existing.icon || 'wallet-outline');
            setColor(existing.color || '#2563EB');
          }
        } else if (currencyList.length > 0) {
          setCurrencyCode(currencyList[0].code);
        }
      } catch (err) {
        console.error('Failed to load wallet form data:', err);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [editingId]);

  const currencyOptions = currencies.map((c) => {
    const currencyKey = c.name_key.startsWith('currency.')
      ? c.name_key.slice('currency.'.length)
      : null;

    const label =
      (currencyKey && (t.currency as Record<string, string>)[currencyKey]) ||
      c.code;

    return {
      id: c.code,
      label: `${c.symbol} · ${label}`,
      subtitle: c.code,
    };
  });

  const handleSave = async () => {
    Keyboard.dismiss();

    if (!name.trim()) {
      setError(t.wallet.nameRequired);
      return;
    }

    if (!currencyCode) {
      setError(t.wallet.selectCurrency);
      return;
    }

    const initialBalance = parseFloat(
      initialBalanceText.replace(',', '.') || '0'
    );

    setError(null);
    setSaving(true);

    try {
      if (isEditing && editingId) {
        await updateWallet(editingId, {
          name: name.trim(),
          currency_code: currencyCode,
          initial_balance: Number.isNaN(initialBalance) ? 0 : initialBalance,
          icon,
          color,
        });
      } else {
        await createWallet({
          name: name.trim(),
          currency_code: currencyCode,
          initial_balance: Number.isNaN(initialBalance) ? 0 : initialBalance,
          icon,
          color,
        });
      }

      router.back();
    } catch (err) {
      console.error('Failed to save wallet:', err);
      setError(t.common.error);
    } finally {
      setSaving(false);
    }
  };

  const performDelete = async () => {
    if (!editingId) return;

    try {
      await deleteWallet(editingId);
      router.back();
    } catch (err) {
      console.error('Failed to delete wallet:', err);
      showAlert(t.common.error, t.wallet.deleteHasTransactions);
    }
  };

  const handleDelete = async () => {
    if (!editingId) return;

    // เช็คก่อนว่ามี bills/budgets ผูกอยู่ไหม เพราะสองตารางนี้ตั้ง
    // ON DELETE CASCADE ไว้ ลบ wallet แล้วจะถูกลบตามไปแบบเงียบๆ โดยไม่มี
    // error ให้ catch เหมือนกรณี transactions (ที่เป็น RESTRICT)
    let dependents: { bills: number; budgets: number } = {
      bills: 0,
      budgets: 0,
    };

    try {
      dependents = await getWalletDependencyCounts(editingId);
    } catch (err) {
      console.error('Failed to check wallet dependencies:', err);
    }

    const linkedCount = dependents.bills + dependents.budgets;

    if (linkedCount > 0) {
      showAlert(
        t.wallet.deleteHasBillsOrBudgetsTitle,
        t.wallet.deleteHasBillsOrBudgetsMessage.replace(
          '{count}',
          String(linkedCount)
        ),
        [
          { text: t.common.cancel, style: 'cancel' },
          {
            text: t.common.delete,
            style: 'destructive',
            onPress: performDelete,
          },
        ]
      );
      return;
    }

    showAlert(t.common.deleteConfirmTitle, t.wallet.deleteConfirm, [
      { text: t.common.cancel, style: 'cancel' },
      {
        text: t.common.delete,
        style: 'destructive',
        onPress: performDelete,
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
              {isEditing ? t.wallet.editWallet : t.wallet.addWallet}
            </Text>

            <Pressable onPress={handleSave} disabled={saving}>
              <Text style={formStyles.headerButton}>{t.common.save}</Text>
            </Pressable>
          </View>

          {error ? <Text style={formStyles.errorText}>{error}</Text> : null}

          {/* พรีวิวไอคอน+สีที่เลือกอยู่ตอนนี้ */}
          <View style={{ alignItems: 'center', marginBottom: 20 }}>
            <View
              style={{
                width: 64,
                height: 64,
                borderRadius: 20,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: color + '18',
              }}
            >
              <Ionicons name={icon as any} size={28} color={color} />
            </View>
          </View>

          <View style={formStyles.field}>
            <Text style={formStyles.label}>{t.wallet.name}</Text>

            <TextInput
              value={name}
              onChangeText={setName}
              placeholder={t.wallet.namePlaceholder}
              placeholderTextColor="#9CA3AF"
              style={formStyles.textInput}
            />
          </View>

          <SelectField
            label={t.wallet.currency}
            placeholder={t.wallet.selectCurrency}
            options={currencyOptions}
            selectedId={currencyCode}
            onSelect={setCurrencyCode}
            sheetTitle={t.wallet.selectCurrency}
            disabled={isEditing}
          />

          <View style={formStyles.field}>
            <Text style={formStyles.label}>{t.wallet.initialBalance}</Text>

            <TextInput
              value={initialBalanceText}
              onChangeText={(text) =>
                setInitialBalanceText(text.replace(/[^0-9.]/g, ''))
              }
              placeholder="0.00"
              placeholderTextColor="#9CA3AF"
              keyboardType="decimal-pad"
              style={formStyles.textInput}
            />
          </View>

          <View style={formStyles.field}>
            <Text style={formStyles.label}>{t.categories.color}</Text>

            <View style={formStyles.colorGrid}>
              {CATEGORY_COLORS.map((c) => (
                <Pressable
                  key={c}
                  onPress={() => setColor(c)}
                  style={[
                    formStyles.colorSwatch,
                    { backgroundColor: c },
                    c === color && formStyles.colorSwatchSelected,
                  ]}
                />
              ))}
            </View>
          </View>

          <View style={formStyles.field}>
            <Text style={formStyles.label}>{t.categories.icon}</Text>

            <View style={formStyles.iconGrid}>
              {WALLET_ICONS.map((iconName) => {
                const isSelected = iconName === icon;

                return (
                  <Pressable
                    key={iconName}
                    onPress={() => setIcon(iconName)}
                    style={[
                      formStyles.iconSwatch,
                      isSelected && {
                        backgroundColor: color + '18',
                        borderColor: color,
                      },
                    ]}
                  >
                    <Ionicons name={iconName} size={20} color={color} />
                  </Pressable>
                );
              })}
            </View>
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