import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from 'expo-router/react-navigation';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { ActivityIndicator, View } from 'react-native';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { SettingsProvider, useSettings } from '@/contexts/SettingsContext';

export const unstable_settings = {
  anchor: '(tabs)',
};

function RootNavigator() {
  const { ready } = useSettings();

  if (!ready) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#F5F7FA',
        }}
      >
        <ActivityIndicator size="large" color="#2563EB" />
      </View>
    );
  }

  return (
    <Stack>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />

      <Stack.Screen
        name="transaction-form"
        options={{ presentation: 'modal', title: '' }}
      />

      <Stack.Screen
        name="wallet-form"
        options={{ presentation: 'modal', title: '' }}
      />

      <Stack.Screen
        name="transfer"
        options={{ presentation: 'modal', title: '' }}
      />

      <Stack.Screen
        name="category-form"
        options={{ presentation: 'modal', title: '' }}
      />

      <Stack.Screen
        name="budget-form"
        options={{ presentation: 'modal', title: '' }}
      />

      <Stack.Screen
        name="bill-form"
        options={{ presentation: 'modal', title: '' }}
      />

      <Stack.Screen
        name="budget-plan-form"
        options={{ presentation: 'modal', title: '' }}
      />

      <Stack.Screen
        name="savings-goal-form"
        options={{ presentation: 'modal', title: '' }}
      />

      <Stack.Screen
        name="savings-goal-adjust"
        options={{ presentation: 'modal', title: '' }}
      />

      <Stack.Screen name="savings-goals" options={{ title: '' }} />

      <Stack.Screen name="budgets" options={{ title: '' }} />

      <Stack.Screen name="bills" options={{ title: '' }} />

      <Stack.Screen name="categories" options={{ title: '' }} />

      <Stack.Screen name="settings" options={{ title: '' }} />

      <Stack.Screen name="about" options={{ title: '' }} />
    </Stack>
  );
}

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <BottomSheetModalProvider>
          <SettingsProvider>
            <RootNavigator />
          </SettingsProvider>

          <StatusBar style="auto" />
        </BottomSheetModalProvider>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}