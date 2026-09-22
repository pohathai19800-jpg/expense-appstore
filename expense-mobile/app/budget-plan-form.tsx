import { useEffect, useRef, useState } from 'react';
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

import { SelectField, type SelectOption } from '@/components/common/SelectField';

import { getCategoriesByType } from '@/database/table/categories/queries';
import {
  getBudgetPlan,
  saveBudgetPlan,
} from '@/database/table/budgetPlans/queries';

import { getCategoryLabel, resolveCategoryIcon } from '@/constants/categories';

type PlanRow = {
  key: string;
  categoryId: string | null;
  percentageText: string;
};

export default function BudgetPlanFormScreen() {
  const { t } = useSettings();
  const router = useRouter();
  const params = useLocalSearchParams<{ year: string; month: string }>();

  const year = Number(params.year);
  const month = Number(params.month);

  const [targetIncomeText, setTargetIncomeText] = useState('0');
  const [rows, setRows] = useState<PlanRow[]>([]);
  const [categories, setCategories] = useState<
    { id: number; name_key: string | null; icon: string | null; color: string | null }[]
  >([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const rowIdCounter = useRef(0);
  const nextRowKey = () => {
    rowIdCounter.current += 1;
    return `row-${rowIdCounter.current}`;
  };

  useEffect(() => {
    async function load() {
      try {
        const [categoryList, plan] = await Promise.all([
          getCategoriesByType('expense'),
          getBudgetPlan(year, month),
        ]);

        setCategories(categoryList);
        setTargetIncomeText(String(plan.target_income));

        if (plan.items.length > 0) {
          setRows(
            plan.items.map((item) => ({
              key: nextRowKey(),
              categoryId: String(item.category_id),
              percentageText: String(item.percentage),
            }))
          );
        } else {
          setRows([{ key: nextRowKey(), categoryId: null, percentageText: '' }]);
        }
      } catch (err) {
        console.error('Failed to load budget plan form data:', err);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [year, month]);

  const categoryOptions: SelectOption[] = categories.map((c) => ({
    id: String(c.id),
    label: getCategoryLabel(c.name_key, t, t.transactions.uncategorized),
    icon: resolveCategoryIcon(c.icon, 'expense'),
    color: c.color,
  }));

  const usedCategoryIds = new Set(
    rows.map((row) => row.categoryId).filter((id): id is string => id !== null)
  );

  const canAddRow = usedCategoryIds.size < categories.length;

  const totalPercent = rows.reduce((sum, row) => {
    const value = parseFloat(row.percentageText.replace(',', '.'));
    return sum + (Number.isNaN(value) ? 0 : value);
  }, 0);

  const handleAddRow = () => {
    if (!canAddRow) return;
    setRows((prev) => [
      ...prev,
      { key: nextRowKey(), categoryId: null, percentageText: '' },
    ]);
  };

  const handleRemoveRow = (key: string) => {
    setRows((prev) => prev.filter((row) => row.key !== key));
  };

  const handleRowCategoryChange = (key: string, categoryId: string) => {
    setRows((prev) =>
      prev.map((row) => (row.key === key ? { ...row, categoryId } : row))
    );
  };

  const handleRowPercentChange = (key: string, text: string) => {
    const cleaned = text.replace(/[^0-9.]/g, '');
    setRows((prev) =>
      prev.map((row) =>
        row.key === key ? { ...row, percentageText: cleaned } : row
      )
    );
  };

  const handleSave = async () => {
    Keyboard.dismiss();

    const validRows = rows.filter((row) => row.categoryId !== null);
    const hasIncompleteRow = rows.some(
      (row) =>
        row.categoryId !== null &&
        (row.percentageText.trim() === '' ||
          Number.isNaN(parseFloat(row.percentageText)))
    );

    if (hasIncompleteRow) {
      showAlert(t.common.error, t.budgetPlan.itemPercentRequired);
      return;
    }

    setSaving(true);

    try {
      const targetIncome = parseFloat(targetIncomeText.replace(',', '.'));

      const items = validRows.map((row) => ({
        category_id: Number(row.categoryId),
        percentage: parseFloat(row.percentageText),
      }));

      await saveBudgetPlan(
        year,
        month,
        Number.isNaN(targetIncome) ? 0 : targetIncome,
        items
      );

      showAlert(t.budgetPlan.saved, '');
      router.back();
    } catch (err) {
      console.error('Failed to save budget plan:', err);
      showAlert(t.common.error, '');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <View style={formStyles.screen} />;
  }

  return (
    <KeyboardAvoidingView
      style={formStyles.screen}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={formStyles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={formStyles.headerRow}>
          <Pressable onPress={() => router.back()}>
            <Text style={formStyles.headerButtonMuted}>{t.common.cancel}</Text>
          </Pressable>

          <Text style={formStyles.headerTitle}>{t.budgetPlan.title}</Text>

          <Pressable onPress={handleSave} disabled={saving}>
            <Text style={formStyles.headerButton}>{t.common.save}</Text>
          </Pressable>
        </View>

        <View style={formStyles.field}>
          <Text style={formStyles.label}>{t.budgetPlan.targetIncomeLabel}</Text>

          <TextInput
            value={targetIncomeText}
            onChangeText={(text) =>
              setTargetIncomeText(text.replace(/[^0-9.]/g, ''))
            }
            placeholder={t.budgetPlan.targetIncomePlaceholder}
            placeholderTextColor="#9CA3AF"
            keyboardType="decimal-pad"
            style={formStyles.textInput}
          />
        </View>

        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 8,
          }}
        >
          <Text style={formStyles.label}>{t.budgetPlan.title}</Text>

          <Text
            style={{
              fontSize: 12,
              fontWeight: '600',
              color: totalPercent > 100 ? '#DC2626' : '#6B7280',
            }}
          >
            {t.budgetPlan.totalAllocated} {totalPercent.toFixed(1)}%
          </Text>
        </View>

        {rows.map((row) => {
          const rowOptions = categoryOptions.filter(
            (option) =>
              option.id === row.categoryId || !usedCategoryIds.has(option.id)
          );

          return (
            <View
              key={row.key}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 8,
                marginBottom: 12,
              }}
            >
              <View style={{ flex: 1 }}>
                <SelectField
                  label=""
                  placeholder={t.budgetPlan.selectCategory}
                  options={rowOptions}
                  selectedId={row.categoryId}
                  onSelect={(id) => handleRowCategoryChange(row.key, id)}
                  sheetTitle={t.budgetPlan.selectCategory}
                  renderTrigger={({ open, selected }) => (
                    <Pressable
                      onPress={open}
                      style={formStyles.selectInput}
                    >
                      {selected?.icon ? (
                        <View
                          style={[
                            formStyles.selectIconBadge,
                            {
                              width: 24,
                              height: 24,
                              backgroundColor:
                                (selected.color ?? '#9CA3AF') + '22',
                            },
                          ]}
                        >
                          <Ionicons
                            name={selected.icon}
                            size={14}
                            color={selected.color ?? '#6B7280'}
                          />
                        </View>
                      ) : null}

                      <Text
                        style={[
                          formStyles.selectInputText,
                          !selected && formStyles.selectPlaceholder,
                        ]}
                        numberOfLines={1}
                      >
                        {selected
                          ? selected.label
                          : t.budgetPlan.selectCategory}
                      </Text>

                      <Ionicons
                        name="chevron-down"
                        size={16}
                        color="#9CA3AF"
                      />
                    </Pressable>
                  )}
                />
              </View>

              <TextInput
                value={row.percentageText}
                onChangeText={(text) => handleRowPercentChange(row.key, text)}
                placeholder={t.budgetPlan.percentPlaceholder}
                placeholderTextColor="#9CA3AF"
                keyboardType="decimal-pad"
                style={[
                  formStyles.textInput,
                  { width: 64, textAlign: 'center' },
                ]}
              />

              <Pressable onPress={() => handleRemoveRow(row.key)} hitSlop={8}>
                <Ionicons name="trash-outline" size={20} color="#DC2626" />
              </Pressable>
            </View>
          );
        })}

        <Pressable
          onPress={handleAddRow}
          disabled={!canAddRow}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
            backgroundColor: canAddRow ? '#EFF6FF' : '#F3F4F6',
            borderRadius: 10,
            paddingVertical: 12,
            marginBottom: 20,
          }}
        >
          <Ionicons
            name="add"
            size={16}
            color={canAddRow ? '#2563EB' : '#9CA3AF'}
          />
          <Text
            style={{
              fontSize: 13,
              fontWeight: '600',
              color: canAddRow ? '#2563EB' : '#9CA3AF',
            }}
          >
            {canAddRow ? t.budgetPlan.addItem : t.budgetPlan.noCategoriesLeft}
          </Text>
        </Pressable>

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
      </ScrollView>
    </KeyboardAvoidingView>
  );
}