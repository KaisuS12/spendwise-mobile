import { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Alert, ActivityIndicator, Image, Platform } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useTransactions } from '@/hooks/useTransactions';
import { useAuth } from '@/hooks/useAuth';
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES, getCategoryInfo } from '@/constants/categories';
import { Category, TransactionType } from '@/types';

export default function EditTransactionScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { transactions, updateTransaction, deleteTransaction } = useTransactions();
  const { profile } = useAuth();
  const currency = profile?.currency ?? '₱';

  const tx = transactions.find(t => t.id === id);

  const [type, setType] = useState<TransactionType>(tx?.type ?? 'expense');
  const [amount, setAmount] = useState(tx?.amount.toString() ?? '');
  const [category, setCategory] = useState<Category>(tx?.category ?? 'food');
  const [note, setNote] = useState(tx?.note ?? '');
  const [date, setDate] = useState(tx?.date ?? new Date().toISOString().slice(0, 10));
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (tx) { setType(tx.type); setAmount(tx.amount.toString()); setCategory(tx.category); setNote(tx.note); setDate(tx.date); }
  }, [tx]);

  if (!tx) return <View className="flex-1 items-center justify-center"><Text className="text-gray-400">Transaction not found.</Text></View>;

  const categories = type === 'expense' ? EXPENSE_CATEGORIES : INCOME_CATEGORIES;

  async function handleUpdate() {
    if (!amount || parseFloat(amount) <= 0) { Alert.alert('Error', 'Enter a valid amount.'); return; }
    try {
      setLoading(true);
      await updateTransaction(id, { type, amount: parseFloat(amount), category, note, date });
      router.back();
    } catch { Alert.alert('Error', 'Failed to update.'); }
    finally { setLoading(false); }
  }

  async function handleDelete() {
    if (Platform.OS === 'web') {
      if (!window.confirm('Delete this transaction?')) return;
      await deleteTransaction(id);
      router.back();
      return;
    }
    Alert.alert('Delete Transaction', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => { await deleteTransaction(id); router.back(); } },
    ]);
  }

  return (
    <ScrollView className="flex-1 bg-white dark:bg-gray-950" keyboardShouldPersistTaps="handled">
      <View className="px-6 py-4">
        <View className="flex-row bg-gray-100 dark:bg-gray-800 rounded-2xl p-1 mb-6">
          {(['expense', 'income'] as TransactionType[]).map(t => (
            <TouchableOpacity key={t} onPress={() => setType(t)} className={`flex-1 py-3 rounded-xl items-center ${type === t ? (t === 'income' ? 'bg-green-500' : 'bg-red-500') : ''}`}>
              <Text className={`font-bold capitalize ${type === t ? 'text-white' : 'text-gray-500 dark:text-gray-400'}`}>{t}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View className="items-center mb-8">
          <Text className="text-gray-400 mb-2">Amount</Text>
          <View className="flex-row items-center">
            <Text className="text-4xl font-bold text-gray-400 mr-1">{currency}</Text>
            <TextInput className="text-5xl font-bold text-gray-800 dark:text-white min-w-[100px]" placeholder="0.00" placeholderTextColor="#9ca3af" value={amount} onChangeText={v => setAmount(v.replace(/[^0-9.]/g, ''))} keyboardType="numeric" />
          </View>
        </View>

        <Text className="text-gray-600 dark:text-gray-400 font-medium mb-3">Category</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-6">
          <View className="flex-row gap-2">
            {categories.map(c => (
              <TouchableOpacity key={c.value} onPress={() => setCategory(c.value)} className={`px-3 py-2 rounded-full flex-row items-center gap-1 border ${category === c.value ? 'border-transparent' : 'border-gray-200 dark:border-gray-700'}`} style={category === c.value ? { backgroundColor: c.color } : {}}>
                <Text>{c.icon}</Text>
                <Text className={`text-sm font-medium ${category === c.value ? 'text-white' : 'text-gray-700 dark:text-gray-300'}`}>{c.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>

        <Text className="text-gray-600 dark:text-gray-400 font-medium mb-2">Note</Text>
        <TextInput className="border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-gray-800 dark:text-white bg-gray-50 dark:bg-gray-800 mb-4" placeholder="Add a note..." placeholderTextColor="#9ca3af" value={note} onChangeText={setNote} multiline />

        <Text className="text-gray-600 dark:text-gray-400 font-medium mb-2">Date</Text>
        <TextInput className="border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-gray-800 dark:text-white bg-gray-50 dark:bg-gray-800 mb-6" value={date} onChangeText={setDate} placeholder="YYYY-MM-DD" placeholderTextColor="#9ca3af" />

        {tx.receiptUrl && <Image source={{ uri: tx.receiptUrl }} className="w-full h-40 rounded-xl mb-4" resizeMode="cover" />}

        <TouchableOpacity onPress={handleUpdate} disabled={loading} className={`rounded-2xl py-4 items-center mb-3 ${type === 'income' ? 'bg-green-500' : 'bg-red-500'}`}>
          {loading ? <ActivityIndicator color="white" /> : <Text className="text-white font-bold text-base">Update Transaction</Text>}
        </TouchableOpacity>

        <TouchableOpacity onPress={handleDelete} className="rounded-2xl py-4 items-center border border-red-200 dark:border-red-900">
          <Text className="text-red-500 font-bold">Delete Transaction</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}
