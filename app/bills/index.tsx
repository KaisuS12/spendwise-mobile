import { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, Modal, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { collection, addDoc, updateDoc, deleteDoc, doc, onSnapshot, query } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/hooks/useAuth';
import { useTransactions } from '@/hooks/useTransactions';
import { formatAmount } from '@/constants/currencies';
import { getCategoryInfo, EXPENSE_CATEGORIES } from '@/constants/categories';
import { RecurringBill, Category } from '@/types';

export default function BillsScreen() {
  const { user, profile } = useAuth();
  const { addTransaction } = useTransactions();
  const currency = profile?.currency ?? '₱';
  const [bills, setBills] = useState<RecurringBill[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [dueDay, setDueDay] = useState('');
  const [category, setCategory] = useState<Category>('bills');

  useEffect(() => {
    if (!user) return;
    return onSnapshot(query(collection(db, 'users', user.uid, 'bills')), snap => {
      setBills(snap.docs.map(d => ({ id: d.id, ...d.data() } as RecurringBill)));
    });
  }, [user]);

  async function addBill() {
    if (!name || !amount || !dueDay) { Alert.alert('Fill in all fields'); return; }
    await addDoc(collection(db, 'users', user!.uid, 'bills'), {
      name, amount: parseFloat(amount), dueDay: parseInt(dueDay), category, walletId: 'default', isPaid: false,
    });
    setName(''); setAmount(''); setDueDay(''); setModalVisible(false);
  }

  async function payBill(bill: RecurringBill) {
    await addTransaction({ type: 'expense', amount: bill.amount, category: bill.category, note: `Bill: ${bill.name}`, date: new Date().toISOString().slice(0, 10), walletId: bill.walletId });
    await updateDoc(doc(db, 'users', user!.uid, 'bills', bill.id), { isPaid: true });
    Alert.alert('✅ Paid', `${bill.name} logged as expense.`);
  }

  const today = new Date().getDate();
  const sorted = [...bills].sort((a, b) => {
    const daysA = a.dueDay >= today ? a.dueDay - today : 31 - today + a.dueDay;
    const daysB = b.dueDay >= today ? b.dueDay - today : 31 - today + b.dueDay;
    return daysA - daysB;
  });

  return (
    <SafeAreaView className="flex-1 bg-gray-50 dark:bg-gray-950">
      <ScrollView className="px-6">
        <View className="flex-row justify-between items-center mt-4 mb-4">
          <Text className="text-xl font-bold text-gray-800 dark:text-white">Recurring Bills</Text>
          <TouchableOpacity onPress={() => setModalVisible(true)} className="bg-primary px-4 py-2 rounded-full">
            <Text className="text-white font-medium text-sm">+ Add Bill</Text>
          </TouchableOpacity>
        </View>

        {sorted.length === 0 ? (
          <View className="items-center py-16"><Text className="text-5xl mb-3">📅</Text><Text className="text-gray-400">No recurring bills</Text></View>
        ) : sorted.map(b => {
          const cat = getCategoryInfo(b.category);
          const daysUntil = b.dueDay >= today ? b.dueDay - today : 31 - today + b.dueDay;
          const isUrgent = daysUntil <= 3;
          return (
            <View key={b.id} className={`rounded-2xl p-4 mb-3 ${b.isPaid ? 'bg-gray-100 dark:bg-gray-700 opacity-60' : 'bg-white dark:bg-gray-800'}`}>
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center gap-3 flex-1">
                  <Text className="text-2xl">{cat.icon}</Text>
                  <View className="flex-1">
                    <Text className="font-bold text-gray-800 dark:text-white">{b.name}</Text>
                    <Text className="text-xs text-gray-400">Due on day {b.dueDay} • {isUrgent && !b.isPaid ? '⚠️ ' : ''}{b.isPaid ? 'Paid ✓' : `${daysUntil} days left`}</Text>
                  </View>
                </View>
                <Text className="font-bold text-gray-800 dark:text-white">{formatAmount(b.amount, currency)}</Text>
              </View>
              {!b.isPaid && (
                <View className="flex-row justify-between mt-3">
                  <TouchableOpacity onPress={() => deleteDoc(doc(db, 'users', user!.uid, 'bills', b.id))}><Text className="text-gray-400 text-sm">Remove</Text></TouchableOpacity>
                  <TouchableOpacity onPress={() => payBill(b)} className="bg-primary px-4 py-1 rounded-full"><Text className="text-white text-sm font-medium">Pay Now</Text></TouchableOpacity>
                </View>
              )}
            </View>
          );
        })}
        <View className="h-10" />
      </ScrollView>

      <Modal visible={modalVisible} transparent animationType="slide">
        <View className="flex-1 justify-end bg-black/40">
          <View className="bg-white dark:bg-gray-900 rounded-t-3xl p-6">
            <Text className="text-xl font-bold text-gray-800 dark:text-white mb-4">Add Recurring Bill</Text>
            <TextInput className="border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-gray-800 dark:text-white bg-gray-50 dark:bg-gray-800 mb-3" placeholder="Bill name (e.g. Netflix)" placeholderTextColor="#9ca3af" value={name} onChangeText={setName} />
            <TextInput className="border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-gray-800 dark:text-white bg-gray-50 dark:bg-gray-800 mb-3" placeholder="Amount" placeholderTextColor="#9ca3af" value={amount} onChangeText={v => setAmount(v.replace(/[^0-9.]/g, ''))} keyboardType="numeric" />
            <TextInput className="border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-gray-800 dark:text-white bg-gray-50 dark:bg-gray-800 mb-3" placeholder="Due day (1-31)" placeholderTextColor="#9ca3af" value={dueDay} onChangeText={v => setDueDay(v.replace(/[^0-9]/g, ''))} keyboardType="numeric" />
            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-4">
              <View className="flex-row gap-2">
                {EXPENSE_CATEGORIES.map(c => (
                  <TouchableOpacity key={c.value} onPress={() => setCategory(c.value)} className={`px-3 py-2 rounded-full flex-row items-center gap-1 ${category === c.value ? 'bg-primary' : 'bg-gray-100 dark:bg-gray-800'}`}>
                    <Text>{c.icon}</Text>
                    <Text className={`text-sm ${category === c.value ? 'text-white' : 'text-gray-700 dark:text-gray-300'}`}>{c.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
            <View className="flex-row gap-3">
              <TouchableOpacity onPress={() => setModalVisible(false)} className="flex-1 border border-gray-200 rounded-xl py-3 items-center"><Text className="text-gray-600">Cancel</Text></TouchableOpacity>
              <TouchableOpacity onPress={addBill} className="flex-1 bg-primary rounded-xl py-3 items-center"><Text className="text-white font-bold">Add</Text></TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
