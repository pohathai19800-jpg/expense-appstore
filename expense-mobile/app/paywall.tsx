import { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import type { PurchasesPackage } from 'react-native-purchases';

import { useSettings } from '@/contexts/SettingsContext';
import { usePurchases } from '@/contexts/PurchasesContext';
import { showAlert } from '@/utils/alert';
import { formStyles } from '@/styles/forms';

export default function PaywallScreen() {
  const { t } = useSettings();
  const router = useRouter();
  const { offering, isPro, loading, purchasePackage, restorePurchases } =
    usePurchases();

  const [processing, setProcessing] = useState(false);

  const handlePurchase = async (pkg: PurchasesPackage) => {
    setProcessing(true);

    try {
      await purchasePackage(pkg);
      showAlert(t.subscription.purchaseSuccess);
      router.back();
    } catch (error: any) {
      if (!error?.userCancelled) {
        console.error('Purchase failed:', error);
        showAlert(t.common.error, t.subscription.purchaseFailed);
      }
    } finally {
      setProcessing(false);
    }
  };

  const handleRestore = async () => {
    setProcessing(true);

    try {
      await restorePurchases();
      showAlert(t.subscription.restoreSuccess);
    } catch (error) {
      console.error('Restore failed:', error);
      showAlert(t.common.error, t.subscription.restoreFailed);
    } finally {
      setProcessing(false);
    }
  };

  const features = [
    t.subscription.featureWallet,
    t.subscription.featureBudget,
    t.subscription.featureSavings,
  ];

  return (
    <View style={formStyles.screen}>
      <ScrollView contentContainerStyle={{ padding: 24, paddingTop: 60 }}>
        <View style={formStyles.headerRow}>
          <Pressable onPress={() => router.back()}>
            <Text style={formStyles.headerButtonMuted}>{t.common.close}</Text>
          </Pressable>

          <Text style={formStyles.headerTitle}>
            {t.subscription.paywallTitle}
          </Text>

          <View style={{ width: 40 }} />
        </View>

        <Text
          style={{
            fontSize: 15,
            color: '#6B7280',
            marginBottom: 24,
            textAlign: 'center',
          }}
        >
          {t.subscription.paywallSubtitle}
        </Text>

        <View style={{ marginBottom: 24, gap: 12 }}>
          {features.map((feature) => (
            <View
              key={feature}
              style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}
            >
              <Ionicons name="checkmark-circle" size={20} color="#16A34A" />
              <Text style={{ fontSize: 15, color: '#111827' }}>{feature}</Text>
            </View>
          ))}
        </View>

        {isPro ? (
          <View
            style={{
              alignItems: 'center',
              paddingVertical: 16,
              backgroundColor: '#F0FDF4',
              borderRadius: 14,
              marginBottom: 16,
            }}
          >
            <Ionicons name="checkmark-circle" size={28} color="#16A34A" />
            <Text style={{ color: '#16A34A', fontWeight: '700', marginTop: 8 }}>
              {t.subscription.alreadyPro}
            </Text>
          </View>
        ) : loading ? (
          <ActivityIndicator size="large" color="#2563EB" />
        ) : offering && offering.availablePackages.length > 0 ? (
          offering.availablePackages.map((pkg) => (
            <Pressable
              key={pkg.identifier}
              onPress={() => handlePurchase(pkg)}
              disabled={processing}
              style={[
                formStyles.primaryButton,
                { marginBottom: 12 },
                processing && formStyles.primaryButtonDisabled,
              ]}
            >
              <Text style={formStyles.primaryButtonText}>
                {pkg.product.title} · {pkg.product.priceString}
              </Text>
            </Pressable>
          ))
        ) : (
          <Text
            style={{ textAlign: 'center', color: '#9CA3AF', marginBottom: 12 }}
          >
            {t.subscription.noPackagesAvailable}
          </Text>
        )}

        {!isPro ? (
          <Pressable
            onPress={handleRestore}
            disabled={processing}
            style={{ marginTop: 12, alignItems: 'center' }}
          >
            <Text style={{ color: '#2563EB', fontSize: 14 }}>
              {t.subscription.restorePurchases}
            </Text>
          </Pressable>
        ) : null}
      </ScrollView>
    </View>
  );
}
