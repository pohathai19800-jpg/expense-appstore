import { Pressable, Switch, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { useSettings } from '@/contexts/SettingsContext';
import { formatAmount } from '@/utils/currency';
import { resolveCategoryIcon } from '@/constants/categories';
import { isBillPaidThisMonth } from '@/database/table/bills/queries';
import { billStyles } from '@/styles/bills';
import type { BillWithDetails } from '@/types/bill';

type BillCardProps = {
  bill: BillWithDetails;
  onPress?: () => void;
  onToggleAutoCharge?: (value: boolean) => void;
  onMarkPaid?: () => void;
};

export function BillCard({
  bill,
  onPress,
  onToggleAutoCharge,
  onMarkPaid,
}: BillCardProps) {
  const { t, language } = useSettings();

  const paid = isBillPaidThisMonth(bill);
  const color = bill.category_color ?? '#6B7280';

  return (
    <Pressable onPress={onPress} style={billStyles.card}>
      <View style={billStyles.topRow}>
        <View style={[billStyles.iconBadge, { backgroundColor: color + '18' }]}>
          <Ionicons
            name={resolveCategoryIcon(bill.category_icon, 'expense')}
            size={18}
            color={color}
          />
        </View>

        <View style={{ flex: 1 }}>
          <Text style={billStyles.name}>{bill.name}</Text>
          <Text style={billStyles.subtitle}>
            {t.bill.dayOfMonthShort.replace('{day}', String(bill.day_of_month))}
            {'  ·  '}
            {bill.wallet_name}
          </Text>
        </View>

        <Text style={billStyles.amount}>
          {formatAmount(bill.amount, bill.wallet_currency_code, language)}
        </Text>
      </View>

      <View style={billStyles.divider} />

      <View style={billStyles.bottomRow}>
        <Text style={billStyles.autoChargeLabel}>{t.bill.autoCharge}</Text>

        <Switch
          value={Boolean(bill.auto_charge)}
          onValueChange={(value) => onToggleAutoCharge?.(value)}
        />
      </View>

      <View style={billStyles.statusRow}>
        {paid ? (
          <View style={billStyles.statusPaid}>
            <Ionicons name="checkmark-circle" size={16} color="#16A34A" />
            <Text style={billStyles.statusPaidText}>
              {t.bill.paidThisMonth}
            </Text>
          </View>
        ) : (
          <Text style={billStyles.statusUnpaidText}>
            {t.bill.notPaidThisMonth}
          </Text>
        )}

        {!paid ? (
          <Pressable style={billStyles.markPaidButton} onPress={onMarkPaid}>
            <Text style={billStyles.markPaidButtonText}>
              {t.bill.markPaid}
            </Text>
          </Pressable>
        ) : null}
      </View>
    </Pressable>
  );
}