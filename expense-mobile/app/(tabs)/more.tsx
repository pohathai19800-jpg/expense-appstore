import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { useSettings } from '@/contexts/SettingsContext';

export default function MoreScreen() {
  const { t } = useSettings();
  const router = useRouter();

  const menu: {
    icon: React.ComponentProps<typeof Ionicons>['name'];
    label: string;
    route: '/settings' | '/categories' | '/budgets' | '/bills' | '/about';
  }[] = [
    { icon: 'pie-chart-outline', label: t.budget.title, route: '/budgets' },
    { icon: 'receipt-outline', label: t.bill.title, route: '/bills' },
    { icon: 'settings-outline', label: t.more.settings, route: '/settings' },
    { icon: 'pricetags-outline', label: t.more.categories, route: '/categories' },
    { icon: 'information-circle-outline', label: t.more.about, route: '/about' },
  ];

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{t.more.title}</Text>

      {menu.map((item) => (
        <Pressable
          key={item.route}
          style={styles.menu}
          onPress={() => router.push(item.route)}
        >
          <View style={styles.menuLeft}>
            <Ionicons name={item.icon} size={20} color="#2563EB" />
            <Text style={styles.menuText}>{item.label}</Text>
          </View>

          <Ionicons name="chevron-forward" size={18} color="#C4C7CC" />
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    padding: 20,
    paddingTop: 60,
  },
  title: {
    fontSize: 30,
    fontWeight: '700',
    marginBottom: 24,
    color: '#111827',
  },
  menu: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 18,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  menuLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  menuText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#111827',
  },
});