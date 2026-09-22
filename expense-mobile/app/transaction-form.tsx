import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { showAlert } from '@/utils/alert';
import { useSettings } from '@/contexts/SettingsContext';

import { SelectField } from '@/components/common/SelectField';
import { DateField } from '@/components/common/DateField';
import { NumericKeypad } from '@/components/common/NumericKeypad';

import { getActiveWallets } from '@/database/table/wallets/queries';
import { getCategoriesByType } from '@/database/table/categories/queries';
import {
  createTransaction,
  deleteTransaction,
  getMostRecentWalletId,
  getTransactionById,
  updateTransaction,
} from '@/database/table/transactions/queries';

import type { WalletWithBalance } from '@/database/table/wallets/queries';
import type { Category } from '@/types/category';
import type { TransactionType } from '@/types/transaction';

import { resolveCategoryIcon, getCategoryLabel } from '@/constants/categories';
import { formatDisplayDate, toDateKey } from '@/utils/date';

export default function TransactionFormScreen() {
  const { t, language } = useSettings();
  const router = useRouter();
  const params = useLocalSearchParams<{
    id?: string;
    type?: string;
    walletId?: string;
  }>();

  const editingId = params.id ? Number(params.id) : null;
  const isEditing = editingId !== null;

  const [type, setType] = useState<TransactionType>(
    params.type === 'income' ? 'income' : 'expense'
  );
  const [amountText, setAmountText] = useState('0');
  const [walletId, setWalletId] = useState<string | null>(
    params.walletId ?? null
  );
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [note, setNote] = useState('');
  const [date, setDate] = useState(toDateKey(new Date()));

  const [wallets, setWallets] = useState<WalletWithBalance[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  // เก็บว่า categories ที่โหลดล่าสุดตรงกับ type ไหน ใช้กันไม่ให้ effect เคลียร์
  // categoryId ทำงานกับ categories ที่ยังโหลดไม่เสร็จ/ยังเป็นของ type เก่า (race
  // condition ระหว่าง loadOptions กับ loadExisting ตอนเปิดหน้าแก้ไขรายการ)
  const categoriesTypeRef = useRef<TransactionType | null>(null);

  const loadOptions = useCallback(async () => {
    try {
      const [walletList, categoryList] = await Promise.all([
        getActiveWallets(),
        getCategoriesByType(type),
      ]);

      setWallets(walletList);
      setCategories(categoryList);
      categoriesTypeRef.current = type;

      if (!walletId && walletList.length > 0 && !isEditing) {
        const lastUsedId = await getMostRecentWalletId();
        const stillActive =
          lastUsedId !== null &&
          walletList.some((w) => w.id === lastUsedId);

        setWalletId(
          stillActive ? String(lastUsedId) : String(walletList[0].id)
        );
      }
    } catch (err) {
      console.error('Failed to load form options:', err);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [type, isEditing]);

  useEffect(() => {
    loadOptions();
  }, [loadOptions]);

  useEffect(() => {
    async function loadExisting() {
      if (!editingId) {
        setLoading(false);
        return;
      }

      try {
        const existing = await getTransactionById(editingId);

        if (existing) {
          setType(existing.type);
          setAmountText(String(existing.amount));
          setWalletId(String(existing.wallet_id));
          setCategoryId(
            existing.category_id ? String(existing.category_id) : null
          );
          setNote(existing.note ?? '');
          setDate(existing.transaction_date);
        }
      } catch (err) {
        console.error('Failed to load transaction:', err);
      } finally {
        setLoading(false);
      }
    }

    loadExisting();
  }, [editingId]);

  // ล้างหมวดหมู่ที่เลือกไว้เมื่อสลับประเภท ถ้าหมวดหมู่นั้นไม่อยู่ในลิสต์ใหม่
  // ต้องรอให้ categories เป็นของ type ปัจจุบันจริงๆ ก่อน (ดู categoriesTypeRef
  // ด้านบน) ไม่งั้นตอนเปิดหน้าแก้ไขรายการ ถ้า loadExisting เซ็ต type/categoryId
  // เสร็จก่อน loadOptions จะโหลดหมวดหมู่ของ type ใหม่เสร็จ เอฟเฟกต์นี้จะเห็น
  // categories ของ type เก่า (หรือค่าว่าง) แล้วเคลียร์ categoryId ที่ถูกต้องทิ้งไปเลย
  useEffect(() => {
    if (categoriesTypeRef.current !== type) return;

    if (categoryId && !categories.some((c) => String(c.id) === categoryId)) {
      setCategoryId(null);
    }
  }, [categories, categoryId, type]);

  const walletOptions = wallets.map((w) => ({
    id: String(w.id),
    label: w.name,
    subtitle: w.currency_code,
    icon: (w.icon ?? 'wallet-outline') as any,
    color: w.color ?? '#2563EB',
  }));

  const selectedWallet = wallets.find((w) => String(w.id) === walletId);
  const currencyCode = selectedWallet?.currency_code ?? 'THB';

  // ===== Keypad handlers =====
  const appendDigit = (digit: string) => {
    setError(null);
    setAmountText((prev) => (prev === '0' ? digit : prev + digit));
  };

  const appendDecimal = () => {
    setError(null);
    setAmountText((prev) => {
      if (prev.includes('.')) return prev;
      return prev === '' ? '0.' : `${prev}.`;
    });
  };

  const backspace = () => {
    setError(null);
    setAmountText((prev) => {
      const next = prev.slice(0, -1);
      return next === '' ? '0' : next;
    });
  };

  const handleSave = async () => {
    const amount = parseFloat(amountText.replace(',', '.'));

    if (!amount || amount <= 0 || Number.isNaN(amount)) {
      setError(t.transactions.amountRequired);
      return;
    }

    if (!walletId) {
      setError(t.transactions.walletRequired);
      return;
    }

    setError(null);
    setSaving(true);

    try {
      const payload = {
        wallet_id: Number(walletId),
        category_id: categoryId ? Number(categoryId) : null,
        type,
        amount,
        note: note.trim() || null,
        transaction_date: date,
      };

      if (isEditing && editingId) {
        await updateTransaction(editingId, payload);
      } else {
        await createTransaction(payload);
      }

      router.back();
    } catch (err) {
      console.error('Failed to save transaction:', err);
      setError(t.common.error);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = () => {
    if (!editingId) return;

    showAlert(t.common.deleteConfirmTitle, t.transactions.deleteConfirm, [
      { text: t.common.cancel, style: 'cancel' },
      {
        text: t.common.delete,
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteTransaction(editingId);
            router.back();
          } catch (err) {
            console.error('Failed to delete transaction:', err);
          }
        },
      },
    ]);
  };

  if (loading) {
    return <View style={{ flex: 1, backgroundColor: '#F5F7FA' }} />;
  }

  const isIncome = type === 'income';
  const accentColor = isIncome ? '#1568c7' : '#1568c7';
  const today = toDateKey(new Date());
  const dateLabel =
    date === today
      ? t.common.today.toUpperCase()
      : formatDisplayDate(date, language);

  return (
    <View style={{ flex: 1, backgroundColor: '#F5F7FA' }}>
      {/* ===== Header: สลับประเภท (กึ่งกลาง) / ปิด (ขวา) ===== */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingTop: 16,
          paddingHorizontal: 16,
          paddingBottom: 12,
        }}
      >
        {/* View ว่างเพื่อดันให้แท็บสลับประเภทอยู่กึ่งกลางจริงๆ (กว้างเท่าปุ่ม X ฝั่งขวา) */}
        <View style={{ width: 36 }} />

        <View
          style={{
            flexDirection: 'row',
            backgroundColor: '#FFFFFF',
            borderRadius: 20,
            padding: 4,
          }}
        >
          <Pressable
            onPress={() => setType('expense')}
            style={{
              paddingVertical: 8,
              paddingHorizontal: 18,
              borderRadius: 16,
              backgroundColor: !isIncome ? '#FEE2E2' : 'transparent',
            }}
          >
            <Text
              style={{
                fontSize: 13,
                fontWeight: '700',
                color: !isIncome ? '#DC2626' : '#9CA3AF',
              }}
            >
              {t.transactions.typeExpense}
            </Text>
          </Pressable>

          <Pressable
            onPress={() => setType('income')}
            style={{
              paddingVertical: 8,
              paddingHorizontal: 18,
              borderRadius: 16,
              backgroundColor: isIncome ? '#DCFCE7' : 'transparent',
            }}
          >
            <Text
              style={{
                fontSize: 13,
                fontWeight: '700',
                color: isIncome ? '#16A34A' : '#9CA3AF',
              }}
            >
              {t.transactions.typeIncome}
            </Text>
          </Pressable>
        </View>

        <Pressable
          onPress={() => router.back()}
          hitSlop={10}
          style={{
            width: 36,
            height: 36,
            borderRadius: 18,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#FFFFFF',
          }}
        >
          <Ionicons name="close" size={20} color="#111827" />
        </Pressable>
      </View>

      {/* ===== หมวดหมู่: กริดเลื่อนได้ ===== */}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingBottom: 20,
          flexDirection: 'row',
          flexWrap: 'wrap',
          justifyContent: 'flex-start',
        }}
        keyboardShouldPersistTaps="handled"
      >
        {categories.map((category) => {
          const isSelected = String(category.id) === categoryId;
          const color = category.color ?? '#6B7280';

          return (
            <Pressable
              key={category.id}
              onPress={() => setCategoryId(String(category.id))}
              style={{
                width: '25%',
                alignItems: 'center',
                paddingVertical: 10,
              }}
            >
              <View
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: 18,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: color + '18',
                  borderWidth: isSelected ? 2 : 0,
                  borderColor: '#2563EB',
                }}
              >
                <Ionicons
                  name={resolveCategoryIcon(category.icon, category.type)}
                  size={24}
                  color={color}
                />
              </View>

              <Text
                numberOfLines={1}
                style={{
                  fontSize: 12,
                  fontWeight: isSelected ? '700' : '500',
                  color: isSelected ? '#111827' : '#6B7280',
                  marginTop: 6,
                  maxWidth: 74,
                }}
              >
                {getCategoryLabel(
                  category.name_key,
                  t,
                  t.transactions.uncategorized
                )}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {/* ===== Panel ล่าง: Wallet / โน้ต / จำนวนเงิน / วันที่ / คีย์แพด ===== */}
      <View
        style={{
          backgroundColor: '#FFFFFF',
          borderTopLeftRadius: 24,
          borderTopRightRadius: 24,
          paddingHorizontal: 16,
          paddingTop: 16,
          paddingBottom: 47,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.05,
          shadowRadius: 8,
          elevation: 8,
        }}
      >
        {error ? (
          <Text
            style={{
              color: '#DC2626',
              fontSize: 12,
              marginBottom: 8,
              textAlign: 'center',
            }}
          >
            {error}
          </Text>
        ) : null}

        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 10,
            marginBottom: 12,
          }}
        >
          <SelectField
            label={t.transactions.wallet}
            placeholder={t.transactions.selectWallet}
            options={walletOptions}
            selectedId={walletId}
            onSelect={setWalletId}
            sheetTitle={t.transactions.selectWallet}
            renderTrigger={({ open, selected }) => (
              <Pressable
                onPress={open}
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 14,
                  backgroundColor: selected
                    ? (selected.color ?? '#2563EB') + '18'
                    : '#F3F4F6',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Ionicons
                  name={(selected?.icon ?? 'wallet-outline') as any}
                  size={20}
                  color={selected ? selected.color ?? '#374151' : '#374151'}
                />
              </Pressable>
            )}
          />

          <TextInput
            value={note}
            onChangeText={setNote}
            placeholder={t.transactions.notePlaceholder}
            placeholderTextColor="#9CA3AF"
            style={{
              flex: 1,
              fontSize: 14,
              color: '#111827',
              paddingVertical: 8,
            }}
          />

          <View style={{ alignItems: 'flex-end' }}>
            <Text style={{ fontSize: 11, color: '#9CA3AF' }}>
              {currencyCode}
            </Text>
            <Text
              style={{
                fontSize: 22,
                fontWeight: '700',
                color: accentColor,
              }}
              numberOfLines={1}
            >
              {amountText}
            </Text>
          </View>
        </View>

        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 14,
          }}
        >
          <DateField
            label={t.transactions.date}
            value={date}
            onChange={setDate}
            renderTrigger={({ open }) => (
              <Pressable
                onPress={open}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 6,
                  backgroundColor: '#F3F4F6',
                  paddingHorizontal: 14,
                  paddingVertical: 8,
                  borderRadius: 14,
                }}
              >
                <Ionicons name="calendar-outline" size={14} color="#374151" />
                <Text
                  style={{ fontSize: 12, fontWeight: '700', color: '#374151' }}
                >
                  {dateLabel}
                </Text>
              </Pressable>
            )}
          />

          <Pressable
            onPress={handleSave}
            disabled={saving}
            hitSlop={10}
            style={{
              width: 64,
              height: 36,
              borderRadius: 18,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: accentColor,
              opacity: saving ? 0.5 : 1,
            }}
          >
            <Ionicons name="checkmark" size={20} color="#FFFFFF" />
          </Pressable>
        </View>

        <NumericKeypad
          onDigit={appendDigit}
          onDecimal={appendDecimal}
          onBackspace={backspace}
        />

        {isEditing ? (
          <Pressable onPress={handleDelete} style={{ marginTop: 14 }}>
            <Text
              style={{
                textAlign: 'center',
                color: '#DC2626',
                fontSize: 13,
                fontWeight: '600',
              }}
            >
              {t.common.delete}
            </Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}
