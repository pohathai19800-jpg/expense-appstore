import { useEffect, useState } from 'react';
import {
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { formStyles } from '@/styles/forms';
import { useSettings } from '@/contexts/SettingsContext';
import { showAlert } from '@/utils/alert';

import { SelectField } from '@/components/common/SelectField';
import { DismissKeyboardWrapper } from '@/components/common/DismissKeyboardWrapper';

import { getActiveWallets } from '@/database/table/wallets/queries';
import { getCategoriesByType } from '@/database/table/categories/queries';
import {
  createBill,
  closeBill,
  deleteBill,
  getBillById,
  updateBill,
} from '@/database/table/bills/queries';

import type { WalletWithBalance } from '@/database/table/wallets/queries';
import type { Category } from '@/types/category';
import { getCategoryLabel, resolveCategoryIcon } from '@/constants/categories';

export default function BillFormScreen() {
  const { t } = useSettings();
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string }>();

  const editingId = params.id ? Number(params.id) : null;
  const isEditing = editingId !== null;

  const [name, setName] = useState('');
  const [amountText, setAmountText] = useState('');
  const [dayOfMonthText, setDayOfMonthText] = useState('1');
  const [walletId, setWalletId] = useState<string | null>(null);
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [autoCharge, setAutoCharge] = useState(true);

  const [wallets, setWallets] = useState<WalletWithBalance[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);

  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [walletList, categoryList] = await Promise.all([
          getActiveWallets(),
          getCategoriesByType('expense'),
        ]);

        setWallets(walletList);
        setCategories(categoryList);

        if (editingId) {
          const existing = await getBillById(editingId);

          if (existing) {
            setName(existing.name);
            setAmountText(String(existing.amount));
            setDayOfMonthText(String(existing.day_of_month));
            setWalletId(String(existing.wallet_id));
            setCategoryId(
              existing.category_id ? String(existing.category_id) : null
            );
            setAutoCharge(Boolean(existing.auto_charge));
          }
        } else if (walletList.length > 0) {
          setWalletId(String(walletList[0].id));
        }
      } catch (err) {
        console.error('Failed to load bill form data:', err);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [editingId]);

  const walletOptions = wallets.map((w) => ({
    id: String(w.id),
    label: w.name,
    subtitle: w.currency_code,
    icon: (w.icon ?? 'wallet-outline') as any,
    color: w.color ?? '#2563EB',
  }));

  const categoryOptions = categories.map((c) => ({
    id: String(c.id),
    label: getCategoryLabel(c.name_key, t, t.transactions.uncategorized),
    icon: resolveCategoryIcon(c.icon, 'expense'),
    color: c.color,
  }));

  const handleSave = async () => {
    Keyboard.dismiss();

    if (!name.trim()) {
      setError(t.bill.nameRequired);
      return;
    }

    const amount = parseFloat(amountText.replace(',', '.'));

    if (!amount || amount <= 0 || Number.isNaN(amount)) {
      setError(t.bill.amountRequired);
      return;
    }

    if (!walletId) {
      setError(t.transactions.walletRequired);
      return;
    }

    const dayOfMonth = Math.min(
      31,
      Math.max(1, parseInt(dayOfMonthText, 10) || 1)
    );

    setError(null);
    setSaving(true);

    try {
      const payload = {
        name: name.trim(),
        amount,
        day_of_month: dayOfMonth,
        wallet_id: Number(walletId),
        category_id: categoryId ? Number(categoryId) : null,
        auto_charge: autoCharge,
      };

      if (isEditing && editingId) {
        await updateBill(editingId, payload);
      } else {
        await createBill(payload);
      }

      router.back();
    } catch (err) {
      console.error('Failed to save bill:', err);
      setError(t.common.error);
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    if (!editingId) return;

    showAlert(t.bill.closeBill, t.bill.closeBillConfirm, [
      { text: t.common.cancel, style: 'cancel' },
      {
        text: t.bill.closeBill,
        style: 'destructive',
        onPress: async () => {
          try {
            await closeBill(editingId);
            router.back();
          } catch (err) {
            console.error('Failed to close bill:', err);
          }
        },
      },
    ]);
  };

  const handleDelete = () => {
    if (!editingId) return;

    showAlert(t.common.deleteConfirmTitle, t.bill.deleteConfirm, [
      { text: t.common.cancel, style: 'cancel' },
      {
        text: t.common.delete,
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteBill(editingId);
            router.back();
          } catch (err) {
            console.error('Failed to delete bill:', err);
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
              {isEditing ? t.bill.editBill : t.bill.addBill}
            </Text>

            <Pressable onPress={handleSave} disabled={saving}>
              <Text style={formStyles.headerButton}>{t.common.save}</Text>
            </Pressable>
          </View>

          {error ? <Text style={formStyles.errorText}>{error}</Text> : null}

          <View style={formStyles.field}>
            <Text style={formStyles.label}>{t.bill.name}</Text>

            <TextInput
              value={name}
              onChangeText={setName}
              placeholder={t.bill.namePlaceholder}
              placeholderTextColor="#9CA3AF"
              style={formStyles.textInput}
            />
          </View>

          <View style={formStyles.field}>
            <Text style={formStyles.label}>{t.bill.amount}</Text>

            <TextInput
              value={amountText}
              onChangeText={(text) =>
                setAmountText(text.replace(/[^0-9.]/g, ''))
              }
              placeholder="0.00"
              placeholderTextColor="#9CA3AF"
              keyboardType="decimal-pad"
              style={formStyles.textInput}
            />
          </View>

          <View style={formStyles.field}>
            <Text style={formStyles.label}>{t.bill.dayOfMonth}</Text>

            <TextInput
              value={dayOfMonthText}
              onChangeText={(text) =>
                setDayOfMonthText(text.replace(/[^0-9]/g, '').slice(0, 2))
              }
              placeholder="1"
              placeholderTextColor="#9CA3AF"
              keyboardType="number-pad"
              style={formStyles.textInput}
            />

            <Text style={formStyles.helperText}>{t.bill.dayOfMonthHelper}</Text>
          </View>

          <SelectField
            label={t.bill.wallet}
            placeholder={t.transactions.selectWallet}
            options={walletOptions}
            selectedId={walletId}
            onSelect={setWalletId}
            sheetTitle={t.bill.wallet}
          />

          <SelectField
            label={t.bill.category}
            placeholder={t.transactions.selectCategory}
            options={categoryOptions}
            selectedId={categoryId}
            onSelect={setCategoryId}
            sheetTitle={t.bill.category}
          />

          <View
            style={[
              formStyles.field,
              {
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                backgroundColor: '#FFFFFF',
                borderRadius: 14,
                paddingHorizontal: 16,
                paddingVertical: 14,
              },
            ]}
          >
            <View style={{ flex: 1, marginRight: 12 }}>
              <Text style={formStyles.label}>{t.bill.autoCharge}</Text>
              <Text style={formStyles.helperText}>
                {autoCharge ? t.bill.autoChargeSubtitle : t.bill.manualSubtitle}
              </Text>
            </View>

            <Switch value={autoCharge} onValueChange={setAutoCharge} />
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
            <>
              <Pressable onPress={handleClose} style={formStyles.dangerButton}>
                <Text style={formStyles.dangerButtonText}>
                  {t.bill.closeBill}
                </Text>
              </Pressable>

              <Pressable
                onPress={handleDelete}
                style={{ marginTop: 12, alignItems: 'center' }}
              >
                <Text
                  style={{ color: '#9CA3AF', fontSize: 13, fontWeight: '600' }}
                >
                  {t.common.delete}
                </Text>
              </Pressable>
            </>
          ) : null}
        </ScrollView>
      </DismissKeyboardWrapper>
    </KeyboardAvoidingView>
  );
}