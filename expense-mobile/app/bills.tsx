import { useCallback, useState } from 'react';
import { FlatList, Text, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';

import { useSettings } from '@/contexts/SettingsContext';
import { showAlert } from '@/utils/alert';
import { FAB } from '@/components/common/FAB';
import { BillCard } from '@/components/bills/BillCard';
import { billStyles } from '@/styles/bills';

import {
  getBillsWithDetails,
  markBillPaid,
  toggleBillAutoCharge,
} from '@/database/table/bills/queries';
import type { BillWithDetails } from '@/types/bill';

export default function BillsScreen() {
  const { t } = useSettings();
  const router = useRouter();

  const [bills, setBills] = useState<BillWithDetails[]>([]);

  const load = useCallback(async () => {
    try {
      const data = await getBillsWithDetails();
      setBills(data);
    } catch (error) {
      console.error('Failed to load bills:', error);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const handleToggleAutoCharge = async (billId: number, value: boolean) => {
    try {
      await toggleBillAutoCharge(billId, value);
      load();
    } catch (error) {
      console.error('Failed to toggle auto-charge:', error);
    }
  };

  const handleMarkPaid = (billId: number) => {
    showAlert(t.bill.markPaid, t.bill.markPaidConfirm, [
      { text: t.common.cancel, style: 'cancel' },
      {
        text: t.common.confirm,
        onPress: async () => {
          try {
            await markBillPaid(billId);
            load();
          } catch (error) {
            console.error('Failed to mark bill as paid:', error);
          }
        },
      },
    ]);
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#F5F7FA' }}>
      <FlatList
        data={bills}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={{
          padding: 20,
          paddingTop: 60,
          paddingBottom: 100,
        }}
        ListHeaderComponent={
          <Text
            style={{
              fontSize: 26,
              fontWeight: '700',
              color: '#111827',
              marginBottom: 20,
            }}
          >
            {t.bill.title}
          </Text>
        }
        ListEmptyComponent={
          <View style={billStyles.emptyCard}>
            <Text style={billStyles.emptyTitle}>{t.bill.empty}</Text>
            <Text style={billStyles.emptySubtitle}>
              {t.bill.emptySubtitle}
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <BillCard
            bill={item}
            onPress={() =>
              router.push({
                pathname: '/bill-form',
                params: { id: String(item.id) },
              })
            }
            onToggleAutoCharge={(value) =>
              handleToggleAutoCharge(item.id, value)
            }
            onMarkPaid={() => handleMarkPaid(item.id)}
          />
        )}
      />

      <FAB onPress={() => router.push('/bill-form')} />
    </View>
  );
}
