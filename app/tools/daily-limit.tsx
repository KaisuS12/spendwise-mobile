import { useState, useMemo } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/hooks/useAuth';
import { useTransactions } from '@/hooks/useTransactions';
import { formatAmount } from '@/constants/currencies';
import { sendDailyLimitAlert } from '@/lib/notifications';

export default function DailyLimitScreen() {
  const { user, profile, refreshProfile } = useAuth();
  const { transactions } = useTransactions();
  const currency = profile?.currency ?? '₱';
  const [limitInput, setLimitInput] = useState(profile?.dailyLimit?.toString() ?? '');
  const [saving, setSaving] = useState(false);

  const today = new Date().toISOString().slice(0, 10);

  const todaySpent = useMemo(() =>
    transactions
      .filter(t => t.type === 'expense' && t.date === today)
      .reduce((s, t) => s + t.amount, 0),
    [transactions, today]
  );

  const dailyLimit = profile?.dailyLimit ?? 0;
  const remaining = dailyLimit - todaySpent;
  const percent = dailyLimit > 0 ? Math.min((todaySpent / dailyLimit) * 100, 100) : 0;
  const isOver = todaySpent > dailyLimit && dailyLimit > 0;
  const isWarning = percent >= 80 && !isOver;

  async function saveLimit() {
    const val = parseFloat(limitInput);
    if (isNaN(val) || val <= 0) { Alert.alert('Enter a valid amount'); return; }
    try {
      setSaving(true);
      await updateDoc(doc(db, 'users', user!.uid), { dailyLimit: val });
      await refreshProfile();
      Alert.alert('✅ Saved', `Daily limit set to ${formatAmount(val, currency)}`);
      if (todaySpent > val * 0.8) {
        await sendDailyLimitAlert(val - todaySpent, currency);
      }
    } catch {
      Alert.alert('Error', 'Failed to save limit.');
    } finally {
      setSaving(false);
    }
  }

  async function removeLimit() {
    await updateDoc(doc(db, 'users', user!.uid), { dailyLimit: 0 });
    await refreshProfile();
    setLimitInput('');
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50 dark:bg-gray-950">
      <View className="px-6 py-4">
        {/* Today Status */}
        {dailyLimit > 0 && (
          <View className={`rounded-2xl p-5 mb-6 ${isOver ? 'bg-red-500' : isWarning ? 'bg-yellow-500' : 'bg-primary'}`}>
            <Text className="text-white/80 text-sm">Today's Spending</Text>
            <Text className="text-white text-4xl font-bold mt-1">{formatAmount(todaySpent, currency)}</Text>
            <View className="bg-white/20 rounded-full h-2 mt-3 mb-2">
              <View className="bg-white h-full rounded-full" style={{ width: `${percent}%` }} />
            </View>
            <View className="flex-row justify-between">
              <Text className="text-white/80 text-xs">
                {isOver ? '⚠️ Over limit!' : isWarning ? '⚡ Almost at limit' : '✅ On track'}
              </Text>
              <Text className="text-white/80 text-xs">
                {isOver ? `${formatAmount(Math.abs(remaining), currency)} over` : `${formatAmount(remaining, currency)} left`}
              </Text>
            </View>
          </View>
        )}

        {/* Set Limit */}
        <View className="bg-white dark:bg-gray-800 rounded-2xl p-5 mb-4">
          <Text className="font-bold text-gray-800 dark:text-white text-base mb-1">Daily Spending Limit</Text>
          <Text className="text-gray-400 text-sm mb-4">
            Get notified when you're close to or over your daily limit.
          </Text>
          <View className="flex-row items-center border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 mb-4 bg-gray-50 dark:bg-gray-900">
            <Text className="text-gray-400 font-bold mr-2 text-lg">{currency}</Text>
            <TextInput
              className="flex-1 text-gray-800 dark:text-white text-lg font-bold"
              placeholder="e.g. 500"
              placeholderTextColor="#9ca3af"
              value={limitInput}
              onChangeText={v => setLimitInput(v.replace(/[^0-9.]/g, ''))}
              keyboardType="numeric"
            />
          </View>
          <TouchableOpacity
            onPress={saveLimit}
            disabled={saving}
            className="bg-primary rounded-xl py-3 items-center mb-3"
          >
            <Text className="text-white font-bold">{saving ? 'Saving...' : 'Set Daily Limit'}</Text>
          </TouchableOpacity>
          {dailyLimit > 0 && (
            <TouchableOpacity onPress={removeLimit} className="items-center py-2">
              <Text className="text-red-400 text-sm">Remove Limit</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Today's breakdown */}
        <View className="bg-white dark:bg-gray-800 rounded-2xl p-4">
          <Text className="font-bold text-gray-800 dark:text-white mb-3">Today's Expenses</Text>
          {transactions.filter(t => t.type === 'expense' && t.date === today).length === 0 ? (
            <Text className="text-gray-400 text-center py-4">No expenses today</Text>
          ) : (
            transactions
              .filter(t => t.type === 'expense' && t.date === today)
              .map(t => (
                <View key={t.id} className="flex-row justify-between py-2 border-b border-gray-100 dark:border-gray-700">
                  <Text className="text-gray-600 dark:text-gray-300 capitalize">{t.category}</Text>
                  <Text className="text-red-500 font-medium">{formatAmount(t.amount, currency)}</Text>
                </View>
              ))
          )}
          {dailyLimit > 0 && (
            <View className="flex-row justify-between pt-3">
              <Text className="font-bold text-gray-800 dark:text-white">Limit</Text>
              <Text className="font-bold text-primary">{formatAmount(dailyLimit, currency)}</Text>
            </View>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}
