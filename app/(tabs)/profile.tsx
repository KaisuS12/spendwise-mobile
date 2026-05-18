import { View, Text, ScrollView, TouchableOpacity, Alert, Switch, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/hooks/useAuth';
import { useTransactions } from '@/hooks/useTransactions';
import { formatAmount } from '@/constants/currencies';
import { CURRENCIES } from '@/constants/currencies';
import { useColorScheme } from 'nativewind';

export default function ProfileScreen() {
  const { user, profile, logOut, refreshProfile } = useAuth();
  const { totalIncome, totalExpense, transactions } = useTransactions();
  const { setColorScheme } = useColorScheme();

  async function toggleDarkMode(val: boolean) {
    if (!user) return;
    setColorScheme(val ? 'dark' : 'light');
    await updateDoc(doc(db, 'users', user.uid), { darkMode: val });
    await refreshProfile();
  }

  async function changeCurrency(symbol: string) {
    if (!user) return;
    await updateDoc(doc(db, 'users', user.uid), { currency: symbol });
    await refreshProfile();
  }

  async function handleLogout() {
    if (Platform.OS === 'web') {
      if (window.confirm('Are you sure you want to log out?')) await logOut();
      return;
    }
    Alert.alert('Log Out', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Log Out', style: 'destructive', onPress: async () => { await logOut(); } },
    ]);
  }

  const balance = totalIncome - totalExpense;
  const savingsRate = totalIncome > 0 ? (((totalIncome - totalExpense) / totalIncome) * 100).toFixed(0) : '0';
  const currency = profile?.currency ?? '₱';

  return (
    <SafeAreaView className="flex-1 bg-gray-50 dark:bg-gray-950">
      <ScrollView showsVerticalScrollIndicator={false} className="px-6">
        <Text className="text-2xl font-bold text-gray-800 dark:text-white mt-4 mb-6">Profile</Text>

        {/* Avatar & Name */}
        <View className="bg-white dark:bg-gray-800 rounded-2xl p-5 items-center mb-4">
          <View className="w-20 h-20 rounded-full bg-primary items-center justify-center mb-3">
            <Text className="text-white text-3xl font-bold">{profile?.name?.[0]?.toUpperCase() ?? '?'}</Text>
          </View>
          <Text className="text-xl font-bold text-gray-800 dark:text-white">{profile?.name}</Text>
          <Text className="text-gray-400 text-sm">{user?.email}</Text>
        </View>

        {/* Stats */}
        <View className="flex-row gap-3 mb-4">
          {[
            { label: 'Transactions', value: String(transactions.length), emoji: '📝' },
            { label: 'Savings Rate', value: `${savingsRate}%`, emoji: '💹' },
            { label: 'Balance', value: formatAmount(balance, currency), emoji: '💰' },
          ].map(s => (
            <View key={s.label} className="flex-1 bg-white dark:bg-gray-800 rounded-2xl p-3 items-center">
              <Text className="text-xl">{s.emoji}</Text>
              <Text className="font-bold text-gray-800 dark:text-white text-sm mt-1">{s.value}</Text>
              <Text className="text-gray-400 text-xs">{s.label}</Text>
            </View>
          ))}
        </View>

        {/* Quick Links */}
        <View className="bg-white dark:bg-gray-800 rounded-2xl mb-4 overflow-hidden">
          {[
            { label: 'My Wallets', emoji: '👛', route: '/wallets' },
            { label: 'Savings Goals', emoji: '🐖', route: '/savings' },
            { label: 'Debt Tracker', emoji: '🤝', route: '/debts' },
            { label: 'Recurring Bills', emoji: '📅', route: '/bills' },
          ].map(({ label, emoji, route }, i, arr) => (
            <TouchableOpacity
              key={label}
              onPress={() => router.push(route as any)}
              className={`flex-row items-center px-4 py-4 ${i < arr.length - 1 ? 'border-b border-gray-100 dark:border-gray-700' : ''}`}
            >
              <Text className="text-xl mr-3">{emoji}</Text>
              <Text className="flex-1 text-gray-800 dark:text-white font-medium">{label}</Text>
              <Text className="text-gray-400">›</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Tools */}
        <Text className="text-gray-500 dark:text-gray-400 text-xs font-semibold uppercase tracking-widest mb-2 mt-2">Tools</Text>
        <View className="bg-white dark:bg-gray-800 rounded-2xl mb-4 overflow-hidden">
          {[
            { label: 'Bill Splitter', emoji: '🧮', route: '/tools/splitter' },
            { label: 'Financial Health', emoji: '❤️', route: '/tools/health' },
            { label: 'Daily Limit', emoji: '⏱️', route: '/tools/daily-limit' },
            { label: 'App Lock (PIN)', emoji: '🔒', route: '/tools/lock' },
          ].map(({ label, emoji, route }, i, arr) => (
            <TouchableOpacity
              key={label}
              onPress={() => router.push(route as any)}
              className={`flex-row items-center px-4 py-4 ${i < arr.length - 1 ? 'border-b border-gray-100 dark:border-gray-700' : ''}`}
            >
              <Text className="text-xl mr-3">{emoji}</Text>
              <Text className="flex-1 text-gray-800 dark:text-white font-medium">{label}</Text>
              <Text className="text-gray-400">›</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Settings */}
        <View className="bg-white dark:bg-gray-800 rounded-2xl mb-4 overflow-hidden">
          <View className="flex-row items-center px-4 py-4 border-b border-gray-100 dark:border-gray-700">
            <Text className="text-xl mr-3">🌙</Text>
            <Text className="flex-1 text-gray-800 dark:text-white font-medium">Dark Mode</Text>
            <Switch
              value={profile?.darkMode ?? false}
              onValueChange={toggleDarkMode}
              trackColor={{ true: '#6C63FF' }}
            />
          </View>
          <View className="px-4 py-4">
            <Text className="text-gray-800 dark:text-white font-medium mb-3">💱 Currency</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View className="flex-row gap-2">
                {CURRENCIES.map(c => (
                  <TouchableOpacity
                    key={c.code}
                    onPress={() => changeCurrency(c.symbol)}
                    className={`px-3 py-2 rounded-full ${profile?.currency === c.symbol ? 'bg-primary' : 'bg-gray-100 dark:bg-gray-700'}`}
                  >
                    <Text className={`text-sm font-medium ${profile?.currency === c.symbol ? 'text-white' : 'text-gray-700 dark:text-gray-300'}`}>
                      {c.symbol} {c.code}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          </View>
        </View>

        <TouchableOpacity onPress={handleLogout} className="bg-red-50 dark:bg-red-900/20 rounded-2xl py-4 items-center mb-8">
          <Text className="text-red-500 font-bold text-base">Log Out</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}
