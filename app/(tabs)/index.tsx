import { View, Text, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useTransactions } from '@/hooks/useTransactions';
import { formatAmount } from '@/constants/currencies';
import { getCategoryInfo } from '@/constants/categories';

export default function DashboardScreen() {
  const { profile } = useAuth();
  const { transactions, loading, totalIncome, totalExpense, balance } = useTransactions();
  const [refreshing, setRefreshing] = useState(false);

  const currency = profile?.currency ?? '₱';
  const recent = transactions.slice(0, 5);

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 18) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50 dark:bg-gray-950">
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => setRefreshing(false)} />}
      >
        {/* Header */}
        <View className="bg-primary px-6 pt-4 pb-10">
          <Text className="text-white/70 text-sm">{greeting()},</Text>
          <Text className="text-white text-xl font-bold">{profile?.name ?? 'User'} 👋</Text>

          {/* Balance Card */}
          <View className="bg-white/20 rounded-2xl p-5 mt-4">
            <Text className="text-white/70 text-sm">Total Balance</Text>
            <Text className="text-white text-4xl font-bold mt-1">{formatAmount(balance, currency)}</Text>
            <View className="flex-row mt-4 gap-4">
              <View className="flex-1 bg-white/10 rounded-xl p-3">
                <Text className="text-white/70 text-xs">Income</Text>
                <Text className="text-green-300 font-bold text-base mt-1">+{formatAmount(totalIncome, currency)}</Text>
              </View>
              <View className="flex-1 bg-white/10 rounded-xl p-3">
                <Text className="text-white/70 text-xs">Expenses</Text>
                <Text className="text-red-300 font-bold text-base mt-1">-{formatAmount(totalExpense, currency)}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Quick Actions */}
        <View className="px-6 -mt-5">
          <View className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-4">
            <View className="flex-row gap-3">
              {[
                { label: 'Add', emoji: '➕', route: '/transaction/add', color: 'bg-primary' },
                { label: 'Wallets', emoji: '👛', route: '/wallets', color: 'bg-blue-500' },
                { label: 'Savings', emoji: '🐖', route: '/savings', color: 'bg-green-500' },
                { label: 'Debts', emoji: '🤝', route: '/debts', color: 'bg-orange-500' },
              ].map(({ label, emoji, route, color }) => (
                <TouchableOpacity
                  key={label}
                  className="flex-1 items-center"
                  onPress={() => router.push(route as any)}
                >
                  <View className={`${color} w-12 h-12 rounded-full items-center justify-center mb-1`}>
                    <Text className="text-xl">{emoji}</Text>
                  </View>
                  <Text className="text-xs text-gray-600 dark:text-gray-300">{label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        {/* Recent Transactions */}
        <View className="px-6 mt-6 mb-8">
          <View className="flex-row justify-between items-center mb-3">
            <Text className="text-lg font-bold text-gray-800 dark:text-white">Recent Transactions</Text>
            <TouchableOpacity onPress={() => router.push('/(tabs)/history')}>
              <Text className="text-primary text-sm font-medium">See all</Text>
            </TouchableOpacity>
          </View>

          {loading ? (
            <Text className="text-gray-400 text-center py-8">Loading...</Text>
          ) : recent.length === 0 ? (
            <View className="bg-white dark:bg-gray-800 rounded-2xl p-8 items-center">
              <Text className="text-4xl mb-2">💸</Text>
              <Text className="text-gray-500 dark:text-gray-400 text-center">No transactions yet.</Text>
              <TouchableOpacity
                className="mt-4 bg-primary px-6 py-2 rounded-full"
                onPress={() => router.push('/transaction/add')}
              >
                <Text className="text-white font-medium">Add your first one</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View className="bg-white dark:bg-gray-800 rounded-2xl overflow-hidden">
              {recent.map((t, i) => {
                const cat = getCategoryInfo(t.category);
                return (
                  <TouchableOpacity
                    key={t.id}
                    onPress={() => router.push(`/transaction/${t.id}` as any)}
                    className={`flex-row items-center px-4 py-3 ${i < recent.length - 1 ? 'border-b border-gray-100 dark:border-gray-700' : ''}`}
                  >
                    <View className="w-10 h-10 rounded-full items-center justify-center mr-3" style={{ backgroundColor: cat.color + '20' }}>
                      <Text className="text-lg">{cat.icon}</Text>
                    </View>
                    <View className="flex-1">
                      <Text className="font-medium text-gray-800 dark:text-white">{cat.label}</Text>
                      <Text className="text-xs text-gray-400">{t.note || t.date.slice(0, 10)}</Text>
                    </View>
                    <Text className={`font-bold ${t.type === 'income' ? 'text-green-500' : 'text-red-500'}`}>
                      {t.type === 'income' ? '+' : '-'}{formatAmount(t.amount, currency)}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </View>
      </ScrollView>

      {/* FAB */}
      <TouchableOpacity
        className="absolute bottom-8 right-6 bg-primary w-14 h-14 rounded-full items-center justify-center shadow-lg"
        onPress={() => router.push('/transaction/add')}
      >
        <Text className="text-white text-3xl leading-none">+</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}
