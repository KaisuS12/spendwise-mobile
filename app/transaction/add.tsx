import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';
import { useTransactions } from '@/hooks/useTransactions';
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES } from '@/constants/categories';
import { Category, TransactionType } from '@/types';

export default function AddTransactionScreen() {
  const { profile } = useAuth();
  const { addTransaction } = useTransactions();
  const currency = profile?.currency ?? '₱';

  const [type, setType] = useState<TransactionType>('expense');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState<Category>('food');
  const [note, setNote] = useState('');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [loading, setLoading] = useState(false);

  const categories = type === 'expense' ? EXPENSE_CATEGORIES : INCOME_CATEGORIES;

  async function handleSave() {
    if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
      Alert.alert('Error', 'Please enter a valid amount.');
      return;
    }
    try {
      setLoading(true);
      await addTransaction({
        type, amount: parseFloat(amount), category, note, date, walletId: 'default',
      });
      router.back();
    } catch {
      Alert.alert('Error', 'Failed to save transaction.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <ScrollView className="flex-1 bg-white dark:bg-gray-950" keyboardShouldPersistTaps="handled">
      <View className="px-6 py-4">
        {/* Type Toggle */}
        <View className="flex-row bg-gray-100 dark:bg-gray-800 rounded-2xl p-1 mb-6">
          {(['expense', 'income'] as TransactionType[]).map(t => (
            <TouchableOpacity
              key={t}
              onPress={() => { setType(t); setCategory(t === 'expense' ? 'food' : 'salary'); }}
              className={`flex-1 py-3 rounded-xl items-center ${type === t ? (t === 'income' ? 'bg-green-500' : 'bg-red-500') : ''}`}
            >
              <Text className={`font-bold capitalize ${type === t ? 'text-white' : 'text-gray-500 dark:text-gray-400'}`}>{t}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Amount */}
        <View className="items-center mb-8">
          <Text className="text-gray-400 mb-2">Amount</Text>
          <View className="flex-row items-center">
            <Text className="text-4xl font-bold text-gray-400 mr-1">{currency}</Text>
            <TextInput
              className="text-5xl font-bold text-gray-800 dark:text-white min-w-[100px]"
              placeholder="0.00"
              placeholderTextColor="#9ca3af"
              value={amount}
              onChangeText={v => setAmount(v.replace(/[^0-9.]/g, ''))}
              keyboardType="numeric"
            />
          </View>
        </View>

        {/* Category */}
        <Text className="text-gray-600 dark:text-gray-400 font-medium mb-3">Category</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-6">
          <View className="flex-row gap-2">
            {categories.map(c => (
              <TouchableOpacity
                key={c.value}
                onPress={() => setCategory(c.value)}
                className={`px-3 py-2 rounded-full flex-row items-center gap-1 border ${category === c.value ? 'border-transparent' : 'border-gray-200 dark:border-gray-700'}`}
                style={category === c.value ? { backgroundColor: c.color } : {}}
              >
                <Text>{c.icon}</Text>
                <Text className={`text-sm font-medium ${category === c.value ? 'text-white' : 'text-gray-700 dark:text-gray-300'}`}>{c.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>

        {/* Note */}
        <Text className="text-gray-600 dark:text-gray-400 font-medium mb-2">Note (optional)</Text>
        <TextInput
          className="border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-gray-800 dark:text-white bg-gray-50 dark:bg-gray-800 mb-4"
          placeholder="Add a note..."
          placeholderTextColor="#9ca3af"
          value={note}
          onChangeText={setNote}
          multiline
        />

        {/* Date */}
        <Text className="text-gray-600 dark:text-gray-400 font-medium mb-2">Date</Text>
        <TextInput
          className="border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-gray-800 dark:text-white bg-gray-50 dark:bg-gray-800 mb-6"
          value={date}
          onChangeText={setDate}
          placeholder="YYYY-MM-DD"
          placeholderTextColor="#9ca3af"
        />

        {/* Save */}
        <TouchableOpacity
          onPress={handleSave}
          disabled={loading}
          className={`rounded-2xl py-4 items-center ${type === 'income' ? 'bg-green-500' : 'bg-red-500'}`}
        >
          {loading ? <ActivityIndicator color="white" /> : <Text className="text-white font-bold text-base">Save Transaction</Text>}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}
