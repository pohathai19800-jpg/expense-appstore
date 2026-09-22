import { useCallback, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { useSettings } from '@/contexts/SettingsContext';
import { MonthYearPicker } from '@/components/common/MonthYearPicker';
import { DonutChart } from '@/components/common/DonutChart';
import { PieChart } from '@/components/common/PieChart';
import { TrendBarChart } from '@/components/common/TrendBarChart';
import { formatAmount, formatCompactAmount } from '@/utils/currency';
import { getMonthNames } from '@/utils/date';
import { getBudgetColor, getBudgetProgress } from '@/utils/budget';
import { reportsStyles as styles } from '@/styles/reports';
import {
  CATEGORY_COLORS,
  getCategoryLabel,
  resolveCategoryIcon,
} from '@/constants/categories';

import {
  getCategoryBreakdown,
  getMonthlySummary,
  getMonthlyTrend,
  type CategoryBreakdownItem,
  type MonthlySummary,
  type MonthlyTrendItem,
} from '@/database/table/transactions/queries';
import { getBudgetPlan } from '@/database/table/budgetPlans/queries';
import type { BudgetPlan } from '@/types/budgetPlan';
import type { TransactionType } from '@/types/transaction';

const FALLBACK_COLORS = CATEGORY_COLORS;

type PageMode = 'report' | 'allocation';

const EMPTY_PLAN: BudgetPlan = { target_income: 0, items: [] };

export default function ReportsScreen() {
  const { t, language } = useSettings();
  const router = useRouter();

  const [pageMode, setPageMode] = useState<PageMode>('report');

  const [selectedMonth, setSelectedMonth] = useState(
    new Date().getMonth() + 1
  );
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [viewType, setViewType] = useState<TransactionType>('expense');

  const [monthly, setMonthly] = useState<MonthlySummary[]>([]);
  const [breakdown, setBreakdown] = useState<CategoryBreakdownItem[]>([]);
  const [trend, setTrend] = useState<MonthlyTrendItem[]>([]);
  const [plan, setPlan] = useState<BudgetPlan>(EMPTY_PLAN);

  const load = useCallback(async () => {
    try {
      const [monthlyData, breakdownData, trendData, planData] =
        await Promise.all([
          getMonthlySummary(selectedYear, selectedMonth),
          getCategoryBreakdown(selectedYear, selectedMonth, viewType),
          getMonthlyTrend(selectedYear, selectedMonth, 6),
          getBudgetPlan(selectedYear, selectedMonth),
        ]);

      setMonthly(monthlyData);
      setBreakdown(breakdownData);
      setTrend(trendData);
      setPlan(planData);
    } catch (error) {
      console.error('Failed to load report data:', error);
    }
  }, [selectedMonth, selectedYear, viewType]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const current = monthly[0] ?? {
    currency_code: 'THB',
    income: 0,
    expense: 0,
  };

  const balance = current.income - current.expense;
  const breakdownTotal = breakdown.reduce((sum, item) => sum + item.total, 0);
  const planTotalPercent = plan.items.reduce(
    (sum, item) => sum + item.percentage,
    0
  );

  const openPlanForm = () => {
    router.push({
      pathname: '/budget-plan-form',
      params: { year: String(selectedYear), month: String(selectedMonth) },
    });
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ padding: 20, paddingTop: 60, paddingBottom: 60 }}
    >
      <Text style={styles.title}>{t.reports.title}</Text>

      <MonthYearPicker
        month={selectedMonth}
        year={selectedYear}
        onChange={(month, year) => {
          setSelectedMonth(month);
          setSelectedYear(year);
        }}
      />

      <View style={styles.pageModeRow}>
        <Pressable
          onPress={() => setPageMode('report')}
          style={[
            styles.pageModeTab,
            pageMode === 'report' && styles.pageModeTabActive,
          ]}
        >
          <Text
            style={[
              styles.pageModeText,
              pageMode === 'report' && styles.pageModeTextActive,
            ]}
          >
            {t.reports.modeReport}
          </Text>
        </Pressable>

        <Pressable
          onPress={() => setPageMode('allocation')}
          style={[
            styles.pageModeTab,
            pageMode === 'allocation' && styles.pageModeTabActive,
          ]}
        >
          <Text
            style={[
              styles.pageModeText,
              pageMode === 'allocation' && styles.pageModeTextActive,
            ]}
          >
            {t.reports.viewAllocation}
          </Text>
        </Pressable>
      </View>

      {pageMode === 'report' ? (
        <>
          <View style={styles.card}>
            <Text style={styles.label}>{t.reports.balance}</Text>
            <Text style={styles.balance}>
              {formatAmount(balance, current.currency_code, language)}
            </Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.label}>{t.reports.income}</Text>
            <Text style={styles.income}>
              +{formatAmount(current.income, current.currency_code, language)}
            </Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.label}>{t.reports.expense}</Text>
            <Text style={styles.expense}>
              -{formatAmount(current.expense, current.currency_code, language)}
            </Text>
          </View>

          <View style={styles.tabRow}>
            <Pressable
              onPress={() => setViewType('expense')}
              style={[styles.tab, viewType === 'expense' && styles.tabActive]}
            >
              <Text
                style={[
                  styles.tabText,
                  viewType === 'expense' && styles.tabTextActive,
                ]}
              >
                {t.reports.viewExpense}
              </Text>
            </Pressable>

            <Pressable
              onPress={() => setViewType('income')}
              style={[styles.tab, viewType === 'income' && styles.tabActive]}
            >
              <Text
                style={[
                  styles.tabText,
                  viewType === 'income' && styles.tabTextActive,
                ]}
              >
                {t.reports.viewIncome}
              </Text>
            </Pressable>
          </View>

          <Text style={styles.sectionTitle}>
            {viewType === 'expense'
              ? t.reports.expenseByCategory
              : t.reports.incomeByCategory}
          </Text>

          {breakdown.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyText}>{t.reports.noData}</Text>
            </View>
          ) : (
            <View style={styles.breakdownCard}>
              <DonutChart
                data={breakdown.map((item, index) => ({
                  key: String(item.category_id ?? `uncategorized-${index}`),
                  value: item.total,
                  color:
                    item.color ??
                    FALLBACK_COLORS[index % FALLBACK_COLORS.length],
                }))}
                centerValue={formatAmount(
                  breakdownTotal,
                  current.currency_code,
                  language
                )}
                centerLabel={
                  viewType === 'expense'
                    ? t.reports.viewExpense
                    : t.reports.viewIncome
                }
              />

              <View style={styles.legend}>
                {breakdown.map((item, index) => {
                  const percentage =
                    breakdownTotal > 0
                      ? (item.total / breakdownTotal) * 100
                      : 0;
                  const color =
                    item.color ??
                    FALLBACK_COLORS[index % FALLBACK_COLORS.length];

                  return (
                    <View
                      key={item.category_id ?? `uncategorized-${index}`}
                      style={styles.legendRow}
                    >
                      <View
                        style={[styles.legendDot, { backgroundColor: color }]}
                      />

                      <View style={styles.legendIconBadge}>
                        <Ionicons
                          name={resolveCategoryIcon(item.icon, viewType)}
                          size={14}
                          color={color}
                        />
                      </View>

                      <Text style={styles.legendLabel} numberOfLines={1}>
                        {getCategoryLabel(
                          item.name_key,
                          t,
                          t.transactions.uncategorized
                        )}
                      </Text>

                      <Text style={styles.legendPercent}>
                        {percentage.toFixed(1)}%
                      </Text>

                      <Text style={styles.legendAmount}>
                        {formatAmount(
                          item.total,
                          current.currency_code,
                          language
                        )}
                      </Text>
                    </View>
                  );
                })}
              </View>
            </View>
          )}

          <Text style={[styles.sectionTitle, { marginTop: 24 }]}>
            {t.reports.trend}
          </Text>

          <Text style={styles.label}>{t.reports.viewExpense}</Text>
          <View style={styles.breakdownCard}>
            <TrendBarChart
              data={trend.map((item) => ({
                label: getMonthNames(language)[item.month - 1],
                value: item.expense,
                highlighted:
                  item.year === selectedYear && item.month === selectedMonth,
              }))}
              color="#FCA5A5"
              highlightColor="#DC2626"
              valueFormatter={formatCompactAmount}
            />
          </View>

          <Text style={[styles.label, { marginTop: 16 }]}>
            {t.reports.viewIncome}
          </Text>
          <View style={styles.breakdownCard}>
            <TrendBarChart
              data={trend.map((item) => ({
                label: getMonthNames(language)[item.month - 1],
                value: item.income,
                highlighted:
                  item.year === selectedYear && item.month === selectedMonth,
              }))}
              color="#76d398"
              highlightColor="#16A34A"
              valueFormatter={formatCompactAmount}
            />
          </View>
        </>
      ) : (
        <>

          <View style={styles.allocationTargetCard}>
            <View style={styles.allocationTargetHeaderRow}>
              <Text style={styles.label}>{t.budgetPlan.targetIncomeLabel}</Text>

              <Pressable onPress={openPlanForm} style={styles.editPlanButton}>
                <Ionicons
                  name={plan.items.length === 0 ? 'add' : 'pencil'}
                  size={14}
                  color="#2563EB"
                />
                <Text style={styles.editPlanButtonText}>
                  {plan.items.length === 0
                    ? t.budgetPlan.createPlan
                    : t.budgetPlan.editPlan}
                </Text>
              </Pressable>
            </View>

            <Text style={styles.allocationTargetValue}>
              {formatAmount(plan.target_income, current.currency_code, language)}
            </Text>

            {plan.items.length > 0 ? (
              <Text style={styles.allocationSummaryText}>
                {t.budgetPlan.totalAllocated} {planTotalPercent.toFixed(1)}%
              </Text>
            ) : null}
          </View>

          {plan.items.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyText}>{t.budgetPlan.empty}</Text>
              <Text style={[styles.emptyText, { marginTop: 4, fontSize: 12 }]}>
                {t.budgetPlan.emptySubtitle}
              </Text>

              <Pressable
                onPress={openPlanForm}
                style={[
                  styles.saveButton,
                  { alignSelf: 'stretch', marginTop: 16 },
                ]}
              >
                <Text style={styles.saveButtonText}>
                  {t.budgetPlan.createPlan}
                </Text>
              </Pressable>
            </View>
          ) : (
            <View style={styles.breakdownCard}>
              <PieChart
                size={190}
                data={plan.items.map((item, index) => ({
                  key: String(item.category_id),
                  value: item.percentage,
                  color:
                    item.color ??
                    FALLBACK_COLORS[index % FALLBACK_COLORS.length],
                  icon: resolveCategoryIcon(item.icon, 'expense'),
                }))}
              />

              <View style={styles.legend}>
                {plan.items.map((item, index) => {
                  const plannedAmount =
                    (plan.target_income * item.percentage) / 100;
                  const color =
                    item.color ??
                    FALLBACK_COLORS[index % FALLBACK_COLORS.length];
                  const progress = getBudgetProgress(
                    item.spent,
                    plannedAmount
                  );
                  const progressColor = getBudgetColor(
                    item.spent,
                    plannedAmount
                  );

                  return (
                    <View key={item.category_id} style={styles.allocationItemBlock}>
                      <View style={styles.allocationItemTopRow}>
                        <View
                          style={[styles.legendDot, { backgroundColor: color }]}
                        />

                        <View style={styles.allocationIconBadge}>
                          <Ionicons
                            name={resolveCategoryIcon(item.icon, 'expense')}
                            size={14}
                            color={color}
                          />
                        </View>

                        <Text
                          style={styles.allocationItemLabel}
                          numberOfLines={1}
                        >
                          {getCategoryLabel(
                            item.name_key,
                            t,
                            t.transactions.uncategorized
                          )}
                        </Text>

                        <Text style={styles.allocationItemPercent}>
                          {item.percentage.toFixed(1)}%
                        </Text>

                        <Text style={styles.allocationItemAmount}>
                          {formatAmount(
                            plannedAmount,
                            current.currency_code,
                            language
                          )}
                        </Text>
                      </View>

                      <View style={styles.allocationTrack}>
                        <View
                          style={[
                            styles.allocationFill,
                            {
                              width: `${progress * 100}%`,
                              backgroundColor: progressColor,
                            },
                          ]}
                        />
                      </View>

                      <Text style={styles.allocationSpentText}>
                        {t.budgetPlan.spentSoFar}{' '}
                        {formatAmount(
                          item.spent,
                          current.currency_code,
                          language
                        )}{' '}
                        / {formatAmount(
                          plannedAmount,
                          current.currency_code,
                          language
                        )}
                      </Text>
                    </View>
                  );
                })}
              </View>
            </View>
          )}
        </>
      )}
    </ScrollView>
  );
}