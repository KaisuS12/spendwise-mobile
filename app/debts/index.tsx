import { useState, useEffect, useRef } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, Modal, Alert, Animated, Easing, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { collection, addDoc, updateDoc, deleteDoc, doc, onSnapshot, query } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/hooks/useAuth';
import { formatAmount } from '@/constants/currencies';
import { Debt } from '@/types';

function Avatar({ name, color }: { name: string; color: string }) {
  return (
    <View className="w-12 h-12 rounded-full items-center justify-center mr-4" style={{ backgroundColor: color + '20' }}>
      <Text className="font-bold text-lg" style={{ color }}>{name?.[0]?.toUpperCase() ?? '?'}</Text>
    </View>
  );
}

function AnimatedCard({ children, delay }: { children: React.ReactNode; delay: number }) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(20)).current;
  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 400, delay, useNativeDriver: true }),
      Animated.timing(translateY, { toValue: 0, duration: 400, delay, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
    ]).start();
  }, []);
  return (
    <Animated.View style={{ opacity, transform: [{ translateY }] }}>
      {children}
    </Animated.View>
  );
}

export default function DebtsScreen() {
  const { user, profile } = useAuth();
  const currency = profile?.currency ?? '₱';
  const [debts, setDebts] = useState<Debt[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [direction, setDirection] = useState<'i_owe' | 'they_owe'>('they_owe');
  const [personName, setPersonName] = useState('');
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');

  const headerOpacity = useRef(new Animated.Value(0)).current;
  const headerSlide = useRef(new Animated.Value(-24)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(headerOpacity, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.spring(headerSlide, { toValue: 0, tension: 60, friction: 8, useNativeDriver: true }),
    ]).start();
  }, []);

  useEffect(() => {
    if (!user) return;
    return onSnapshot(query(collection(db, 'users', user.uid, 'debts')), snap => {
      setDebts(snap.docs.map(d => ({ id: d.id, ...d.data() } as Debt)));
    });
  }, [user]);

  function openModal() {
    setPersonName('');
    setAmount('');
    setNote('');
    setDirection('they_owe');
    setModalVisible(true);
  }

  async function addDebt() {
    if (!personName || !amount) { Alert.alert('Fill in all fields'); return; }
    await addDoc(collection(db, 'users', user!.uid, 'debts'), {
      personName, amount: parseFloat(amount), direction, note, isPaid: false, createdAt: new Date().toISOString(),
    });
    setPersonName(''); setAmount(''); setNote(''); setModalVisible(false);
  }

  async function markPaid(debt: Debt) {
    if (Platform.OS === 'web') {
      if (!window.confirm(`Mark debt with ${debt.personName} as settled?`)) return;
      await updateDoc(doc(db, 'users', user!.uid, 'debts', debt.id), { isPaid: true });
      return;
    }
    Alert.alert('Mark as Paid', `Mark debt with ${debt.personName} as settled?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Mark Paid', onPress: async () => {
          await updateDoc(doc(db, 'users', user!.uid, 'debts', debt.id), { isPaid: true });
          Alert.alert('✅ Settled!', `Debt with ${debt.personName} has been marked as paid.`);
        }
      },
    ]);
  }

  const unpaid = debts.filter(d => !d.isPaid);
  const paid = debts.filter(d => d.isPaid);
  const totalOwedToMe = unpaid.filter(d => d.direction === 'they_owe').reduce((s, d) => s + d.amount, 0);
  const totalIOwe = unpaid.filter(d => d.direction === 'i_owe').reduce((s, d) => s + d.amount, 0);
  const net = totalOwedToMe - totalIOwe;

  return (
    <SafeAreaView className="flex-1 bg-gray-50 dark:bg-gray-950">
      <ScrollView showsVerticalScrollIndicator={false}>

        {/* Animated Header */}
        <Animated.View style={{ opacity: headerOpacity, transform: [{ translateY: headerSlide }] }}>
          <View className="mx-6 mt-4 mb-4">
            <View className="rounded-3xl p-6" style={{ backgroundColor: net >= 0 ? '#6C63FF' : '#EF4444' }}>
              <Text className="text-white/70 text-sm font-medium">Net Balance</Text>
              <Text className="text-white text-4xl font-bold mt-1">
                {net >= 0 ? '+' : ''}{formatAmount(net, currency)}
              </Text>
              <Text className="text-white/60 text-xs mt-2">
                {net >= 0 ? 'You are owed more than you owe' : 'You owe more than you are owed'}
              </Text>
            </View>
          </View>
        </Animated.View>

        {/* Summary Cards */}
        <AnimatedCard delay={150}>
          <View className="flex-row gap-3 px-6 mb-5">
            <View className="flex-1 rounded-2xl p-4" style={{ backgroundColor: '#F0FDF4' }}>
              <Text className="text-2xl mb-2">💰</Text>
              <Text className="text-green-600 text-xs font-semibold uppercase">They Owe Me</Text>
              <Text className="text-green-700 font-bold text-xl mt-1">{formatAmount(totalOwedToMe, currency)}</Text>
              <Text className="text-green-500 text-xs mt-0.5">{unpaid.filter(d => d.direction === 'they_owe').length} people</Text>
            </View>
            <View className="flex-1 rounded-2xl p-4" style={{ backgroundColor: '#FEF2F2' }}>
              <Text className="text-2xl mb-2">😅</Text>
              <Text className="text-red-500 text-xs font-semibold uppercase">I Owe</Text>
              <Text className="text-red-600 font-bold text-xl mt-1">{formatAmount(totalIOwe, currency)}</Text>
              <Text className="text-red-400 text-xs mt-0.5">{unpaid.filter(d => d.direction === 'i_owe').length} people</Text>
            </View>
          </View>
        </AnimatedCard>

        {/* Section Header */}
        <AnimatedCard delay={200}>
          <View className="flex-row justify-between items-center px-6 mb-3">
            <Text className="text-gray-700 dark:text-gray-300 font-bold text-base">
              {unpaid.length > 0 ? `Active (${unpaid.length})` : 'All Settled'}
            </Text>
            <TouchableOpacity onPress={openModal} className="bg-primary px-4 py-2 rounded-full">
              <Text className="text-white font-bold text-sm">+ Add Debt</Text>
            </TouchableOpacity>
          </View>
        </AnimatedCard>

        {unpaid.length === 0 && paid.length === 0 ? (
          <AnimatedCard delay={300}>
            <View className="items-center py-20 px-10">
              <Text className="text-7xl mb-4">🤝</Text>
              <Text className="text-gray-700 dark:text-white text-lg font-bold mb-1">No debts recorded</Text>
              <Text className="text-gray-400 text-center text-sm">Track money you lend or borrow so nothing gets forgotten.</Text>
              <TouchableOpacity onPress={openModal} className="mt-6 bg-primary px-6 py-3 rounded-2xl">
                <Text className="text-white font-bold">Record a Debt</Text>
              </TouchableOpacity>
            </View>
          </AnimatedCard>
        ) : (
          <View className="px-6">
            {unpaid.map((d, i) => (
              <AnimatedCard key={d.id} delay={200 + i * 100}>
                <View className="bg-white dark:bg-gray-800 rounded-2xl mb-3 overflow-hidden">
                  <View style={{ height: 4, backgroundColor: d.direction === 'they_owe' ? '#22C55E' : '#EF4444' }} />
                  <View className="p-4">
                    <View className="flex-row items-center">
                      <Avatar name={d.personName} color={d.direction === 'they_owe' ? '#22C55E' : '#EF4444'} />
                      <View className="flex-1">
                        <Text className="font-bold text-gray-800 dark:text-white text-base">{d.personName}</Text>
                        <View className="mt-0.5">
                          <View className="rounded-full px-2 py-0.5 self-start" style={{ backgroundColor: d.direction === 'they_owe' ? '#F0FDF4' : '#FEF2F2' }}>
                            <Text className="text-xs font-medium" style={{ color: d.direction === 'they_owe' ? '#22C55E' : '#EF4444' }}>
                              {d.direction === 'they_owe' ? 'Owes you' : 'You owe'}
                            </Text>
                          </View>
                        </View>
                        {!!d.note && <Text className="text-xs text-gray-400 mt-1">{d.note}</Text>}
                      </View>
                      <Text className="font-bold text-xl" style={{ color: d.direction === 'they_owe' ? '#22C55E' : '#EF4444' }}>
                        {formatAmount(d.amount, currency)}
                      </Text>
                    </View>
                    <View className="flex-row justify-between mt-4 pt-3 border-t border-gray-100 dark:border-gray-700">
                      <TouchableOpacity onPress={() => deleteDoc(doc(db, 'users', user!.uid, 'debts', d.id))}>
                        <Text className="text-gray-400 text-sm">Remove</Text>
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => markPaid(d)}
                        className="px-4 py-2 rounded-xl"
                        style={{ backgroundColor: d.direction === 'they_owe' ? '#F0FDF4' : '#FEF2F2' }}>
                        <Text className="font-medium text-sm" style={{ color: d.direction === 'they_owe' ? '#22C55E' : '#EF4444' }}>
                          ✓ Mark Paid
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              </AnimatedCard>
            ))}

            {paid.length > 0 && (
              <>
                <AnimatedCard delay={300}>
                  <Text className="text-gray-400 text-sm font-semibold uppercase tracking-widest mb-3 mt-2">Settled</Text>
                </AnimatedCard>
                {paid.map((d, i) => (
                  <AnimatedCard key={d.id} delay={350 + i * 80}>
                    <View className="bg-white dark:bg-gray-800 rounded-2xl p-4 mb-2 flex-row items-center opacity-50">
                      <Avatar name={d.personName} color="#9CA3AF" />
                      <View className="flex-1">
                        <Text className="text-gray-500 dark:text-gray-400 font-medium">{d.personName}</Text>
                        <Text className="text-gray-400 text-xs">{d.direction === 'they_owe' ? 'Owed you' : 'You owed'}</Text>
                      </View>
                      <Text className="text-gray-400 font-medium">{formatAmount(d.amount, currency)} ✓</Text>
                    </View>
                  </AnimatedCard>
                ))}
              </>
            )}
          </View>
        )}
        <View className="h-10" />
      </ScrollView>

      <Modal visible={modalVisible} transparent animationType="slide">
        <View className="flex-1 justify-end bg-black/50">
          <View className="bg-white dark:bg-gray-900 rounded-t-3xl p-6">
            <View className="w-10 h-1 bg-gray-200 dark:bg-gray-700 rounded-full self-center mb-5" />
            <Text className="text-xl font-bold text-gray-800 dark:text-white mb-5">Record a Debt</Text>
            <View className="flex-row bg-gray-100 dark:bg-gray-800 rounded-2xl p-1 mb-5">
              {(['they_owe', 'i_owe'] as const).map(d => (
                <TouchableOpacity key={d} onPress={() => setDirection(d)}
                  className={`flex-1 py-3 rounded-xl items-center ${direction === d ? 'bg-white dark:bg-gray-600' : ''}`}>
                  <Text className={`text-sm font-bold ${direction === d ? 'text-primary' : 'text-gray-500'}`}>
                    {d === 'they_owe' ? '💰 They Owe Me' : '😅 I Owe'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <TextInput
              className="border border-gray-200 dark:border-gray-700 rounded-2xl px-4 py-3.5 text-gray-800 dark:text-white bg-gray-50 dark:bg-gray-800 mb-3"
              placeholder="Person's name" placeholderTextColor="#9ca3af" value={personName} onChangeText={setPersonName} />
            <View className="flex-row items-center border border-gray-200 dark:border-gray-700 rounded-2xl px-4 bg-gray-50 dark:bg-gray-800 mb-3">
              <Text className="text-gray-400 font-bold mr-2 text-lg">{currency}</Text>
              <TextInput className="flex-1 text-gray-800 dark:text-white py-3.5" placeholder="Amount"
                placeholderTextColor="#9ca3af" value={amount} onChangeText={v => setAmount(v.replace(/[^0-9.]/g, ''))} keyboardType="numeric" />
            </View>
            <TextInput
              className="border border-gray-200 dark:border-gray-700 rounded-2xl px-4 py-3.5 text-gray-800 dark:text-white bg-gray-50 dark:bg-gray-800 mb-6"
              placeholder="Note (optional)" placeholderTextColor="#9ca3af" value={note} onChangeText={setNote} />
            <View className="flex-row gap-3">
              <TouchableOpacity onPress={() => setModalVisible(false)} className="flex-1 border border-gray-200 dark:border-gray-700 rounded-2xl py-3.5 items-center">
                <Text className="text-gray-600 dark:text-gray-300 font-medium">Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={addDebt} className="flex-1 bg-primary rounded-2xl py-3.5 items-center">
                <Text className="text-white font-bold">Add</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
