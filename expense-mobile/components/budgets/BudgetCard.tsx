import { Pressable, Switch, Text, View } from 'react-native';

import { useSettings } from '@/contexts/SettingsContext';
import { formatAmount } from '@/utils/currency';
import {
  getBudgetColor,
  getBudgetProgress,
  getBudgetScopeLabel,
} from '@/utils/budget';
import type { BudgetWithSpent } from '@/types/budget';
import { budgetStyles } from '@/styles/budgets';

type BudgetCardProps = {
  budget: BudgetWithSpent;
  onPress?: () => void;
  onToggleShow?: (isShow: boolean) => void;
};

export function BudgetCard({ budget, onPress, onToggleShow }: BudgetCardProps) {
  const { t, language } = useSettings();

  const currencyCode = budget.wallet_currency_code ?? 'THB';
  const progress = getBudgetProgress(budget.spent, budget.amount);
  const color = getBudgetColor(budget.spent, budget.amount);
  const isOver = budget.spent > budget.amount;
  const remaining = budget.amount - budget.spent;
  const isShow = budget.is_show !== 0;

  return (
    <Pressable onPress={onPress} style={budgetStyles.card}>
      <View style={budgetStyles.headerRow}>
        <View style={{ flex: 1 }}>
          <Text style={budgetStyles.name}>{budget.name}</Text>
          <Text style={budgetStyles.scope}>
            {getBudgetScopeLabel(budget, t)}
          </Text>
        </View>

        <Text
          style={[
            budgetStyles.amountText,
            isOver && { color: '#DC2626' },
          ]}
        >
          {formatAmount(budget.spent, currencyCode, language)}
          <Text style={budgetStyles.amountOfText}>
            {' '}
            / {formatAmount(budget.amount, currencyCode, language)}
          </Text>
        </Text>
      </View>

      <View style={budgetStyles.track}>
        <View
          style={[
            budgetStyles.fill,
            { width: `${progress * 100}%`, backgroundColor: color },
          ]}
        />
      </View>

      <Text style={[budgetStyles.footerText, isOver && { color: '#DC2626' }]}>
        {isOver
          ? t.budget.overBudget
          : `${t.budget.remaining} ${formatAmount(
              remaining,
              currencyCode,
              language
            )}`}
      </Text>

      {onToggleShow ? (
        <View style={budgetStyles.showToggleRow}>
          <Text style={budgetStyles.showToggleLabel}>
            {t.budget.showOnList}
          </Text>
          <Switch value={isShow} onValueChange={onToggleShow} />
        </View>
      ) : null}
    </Pressable>
  );
}
