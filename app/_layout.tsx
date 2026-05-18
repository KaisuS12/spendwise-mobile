import '../global.css';
import { useEffect } from 'react';
import { Stack, router, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider, useAuth } from '@/hooks/useAuth';
import { View, ActivityIndicator } from 'react-native';
import { registerForPushNotifications, scheduleDailyReminder } from '@/lib/notifications';
import { useColorScheme } from 'nativewind';

function RootNavigator() {
  const { user, loading, profile } = useAuth();
  const segments = useSegments();
  const { setColorScheme } = useColorScheme();
  const darkMode = profile?.darkMode;

  useEffect(() => {
    setColorScheme(darkMode ? 'dark' : 'light');
  }, [darkMode]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (loading) return;
    const inAuth = segments[0] === '(auth)';
    const inOnboarding = segments[0] === 'onboarding';
    if (inOnboarding) return;
    if (!user && !inAuth) router.replace('/(auth)/login');
    else if (user && inAuth) router.replace('/(tabs)');
  }, [user, loading, segments]);

  useEffect(() => {
    if (user) {
      registerForPushNotifications().then(granted => {
        if (granted) scheduleDailyReminder();
      });
    }
  }, [user]);

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#0F0F13' }}>
        <ActivityIndicator size="large" color="#6C63FF" />
      </View>
    );
  }

  return (
    <>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="onboarding" />
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="transaction/add" options={{ presentation: 'modal', headerShown: true, title: 'Add Transaction' }} />
        <Stack.Screen name="transaction/[id]" options={{ presentation: 'modal', headerShown: true, title: 'Edit Transaction' }} />
        <Stack.Screen name="savings" options={{ headerShown: true, title: 'Savings Goals' }} />
        <Stack.Screen name="wallets" options={{ headerShown: true, title: 'My Wallets' }} />
        <Stack.Screen name="debts" options={{ headerShown: true, title: 'Debt Tracker' }} />
        <Stack.Screen name="bills" options={{ headerShown: true, title: 'Recurring Bills' }} />
        <Stack.Screen name="tools/splitter" options={{ headerShown: true, title: 'Bill Splitter' }} />
        <Stack.Screen name="tools/health" options={{ headerShown: true, title: 'Financial Health' }} />
        <Stack.Screen name="tools/lock" options={{ headerShown: true, title: 'App Lock' }} />
        <Stack.Screen name="tools/daily-limit" options={{ headerShown: true, title: 'Daily Spending Limit' }} />
      </Stack>
      <StatusBar style="auto" />
    </>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <RootNavigator />
    </AuthProvider>
  );
}
