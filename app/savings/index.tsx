import { useState, useEffect, useRef } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, Modal, Alert, Animated, Easing, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { collection, addDoc, updateDoc, deleteDoc, doc, onSnapshot, query } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/hooks/useAuth';
import { formatAmount } from '@/constants/currencies';
import { SavingsGoal } from '@/types';

function AnimatedCard({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(20)).current;
  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 400, delay, useNativeDriver: true }),
      Animated.timing(translateY, { toValue: 0, duration: 400, delay, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
    ]).start();
  }, []);
  return <Animated.View style={{ opacity, transform: [{ translateY }] }}>{children}</Animated.View>;
}

function getGoalEmoji(title: string): string {
  const t = title.toLowerCase();
  if (t.includes('house') || t.includes('home') || t.includes('rent')) return '🏠';
  if (t.includes('phone') || t.includes('iphone') || t.includes('samsung')) return '📱';
  if (t.includes('travel') || t.includes('trip') || t.includes('flight')) return '✈️';
  if (t.includes('school') || t.includes('tuition') || t.includes('study')) return '🎓';
  if (t.includes('car') || t.includes('vehicle') || t.includes('motor')) return '🚗';
  if (t.includes('laptop') || t.includes('computer') || t.includes('pc')) return '💻';
  if (t.includes('game') || t.includes('console') || t.includes('ps5')) return '🎮';
  return '🐖';
}

function AnimatedBar({ percent, color }: { percent: number; color: string }) {
  const width = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(width, {
      toValue: Math.min(percent, 100),
      duration: 1000,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [percent]);
  return (
    <View style={{ backgroundColor: '#E5E7EB', borderRadius: 999, height: 10, overflow: 'hidden' }}>
      <Animated.View style={{
        height: '100%', borderRadius: 999, backgroundColor: color,
        width: width.interpolate({ inputRange: [0, 100], outputRange: ['0%', '100%'] }),
      }} />
    </View>
  );
}

function HeaderBar({ percent }: { percent: number }) {
  const width = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(width, {
      toValue: Math.min(percent, 100),
      duration: 1200,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [percent]);
  return (
    <View style={{ backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 999, height: 8, marginTop: 12, overflow: 'hidden' }}>
      <Animated.View style={{
        height: '100%', borderRadius: 999, backgroundColor: 'white',
        width: width.interpolate({ inputRange: [0, 100], outputRange: ['0%', '100%'] }),
      }} />
    </View>
  );
}

export default function SavingsScreen() {
  const { user, profile } = useAuth();
  const currency = profile?.currency ?? '₱';
  const [goals, setGoals] = useState<SavingsGoal[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [contributeModal, setContributeModal] = useState<SavingsGoal | null>(null);
  const [title, setTitle] = useState('');
  const [target, setTarget] = useState('');
  const [contribution, setContribution] = useState('');

  const headerAnim = useRef(new Animated.Value(0)).current;
  const headerSlide = useRef(new Animated.Value(-20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(headerAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.spring(headerSlide, { toValue: 0, tension: 60, friction: 8, useNativeDriver: true }),
    ]).start();
  }, []);

  useEffect(() => {
    if (!user) return;
    return onSnapshot(query(collection(db, 'users', user.uid, 'savings')), snap => {
      setGoals(snap.docs.map(d => ({ id: d.id, ...d.data() } as SavingsGoal)));
    });
  }, [user]);

  function openModal() {
    setTitle('');
    setTarget('');
    setModalVisible(true);
  }

  function openContribute(goal: SavingsGoal) {
    setContribution('');
    setContributeModal(goal);
  }

  async function addGoal() {
    if (!title || !target) { Alert.alert('Error', 'Fill in all fields.'); return; }
    if (!user) return;
    await addDoc(collection(db, 'users', user.uid, 'savings'), {
      title, targetAmount: parseFloat(target), savedAmount: 0, createdAt: new Date().toISOString(),
    });
    setTitle(''); setTarget(''); setModalVisible(false);
  }

  async function addContribution() {
    if (!contributeModal || !contribution) return;
    const amount = parseFloat(contribution);
    if (isNaN(amount) || amount <= 0) { Alert.alert('Invalid amount'); return; }
    await updateDoc(doc(db, 'users', user!.uid, 'savings', contributeModal.id), {
      savedAmount: contributeModal.savedAmount + amount,
    });
    setContributeModal(null); setContribution('');
  }

  async function deleteGoal(id: string) {
    if (Platform.OS === 'web') {
      if (!window.confirm('Delete this savings goal?')) return;
      await deleteDoc(doc(db, 'users', user!.uid, 'savings', id));
      return;
    }
    Alert.alert('Delete Goal', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deleteDoc(doc(db, 'users', user!.uid, 'savings', id)) },
    ]);
  }

  const totalSaved = goals.reduce((s, g) => s + g.savedAmount, 0);
  const totalTarget = goals.reduce((s, g) => s + g.targetAmount, 0);
  const overallPct = totalTarget > 0 ? (totalSaved / totalTarget) * 100 : 0;
  const completedGoals = goals.filter(g => g.savedAmount >= g.targetAmount).length;

  return (
    <SafeAreaView className="flex-1 bg-gray-50 dark:bg-gray-950">
      <ScrollView showsVerticalScrollIndicator={false}>

        {/* Animated Header */}
        <Animated.View style={{ opacity: headerAnim, transform: [{ translateY: headerSlide }] }}>
          <View className="mx-6 mt-4 rounded-3xl p-6 mb-5" style={{ backgroundColor: '#22C55E' }}>
            <Text className="text-white/70 text-sm font-medium mb-1">Total Amount Saved</Text>
            <Text className="text-white text-4xl font-bold">{formatAmount(totalSaved, currency)}</Text>
            <HeaderBar percent={overallPct} />
            <View className="flex-row justify-between mt-2">
              <Text className="text-white/70 text-xs">of {formatAmount(totalTarget, currency)} target</Text>
              <Text className="text-white/70 text-xs">{completedGoals}/{goals.length} goals done</Text>
            </View>
          </View>
        </Animated.View>

        {/* Section Header */}
        <AnimatedCard delay={200}>
          <View className="flex-row justify-between items-center px-6 mb-3">
            <Text className="text-gray-700 dark:text-gray-300 font-bold text-base">My Goals</Text>
            <TouchableOpacity onPress={openModal} className="bg-green-500 px-4 py-2 rounded-full">
              <Text className="text-white font-bold text-sm">+ New Goal</Text>
            </TouchableOpacity>
          </View>
        </AnimatedCard>

        {goals.length === 0 ? (
          <AnimatedCard delay={300}>
            <View className="items-center py-20 px-10">
              <Text className="text-7xl mb-4">🐖</Text>
              <Text className="text-gray-700 dark:text-white text-lg font-bold mb-1">No savings goals yet</Text>
              <Text className="text-gray-400 text-center text-sm">Set a goal and start saving — a new phone, travel, or anything you dream of.</Text>
              <TouchableOpacity onPress={openModal} className="mt-6 bg-green-500 px-6 py-3 rounded-2xl">
                <Text className="text-white font-bold">Create Your First Goal</Text>
              </TouchableOpacity>
            </View>
          </AnimatedCard>
        ) : (
          <View className="px-6">
            {goals.map((g, i) => {
              const pct = Math.min((g.savedAmount / g.targetAmount) * 100, 100);
              const done = pct >= 100;
              const remaining = g.targetAmount - g.savedAmount;
              const emoji = getGoalEmoji(g.title);
              const barColor = done ? '#22C55E' : pct >= 75 ? '#3B82F6' : '#6C63FF';

              return (
                <AnimatedCard key={g.id} delay={200 + i * 120}>
                  <View className="bg-white dark:bg-gray-800 rounded-3xl mb-4 overflow-hidden">
                    <View style={{ height: 4, backgroundColor: barColor }} />
                    <View className="p-5">
                      <View className="flex-row items-start mb-4">
                        <View className="w-14 h-14 rounded-2xl bg-green-50 items-center justify-center mr-4">
                          <Text className="text-3xl">{emoji}</Text>
                        </View>
                        <View className="flex-1">
                          <Text className="font-bold text-gray-800 dark:text-white text-base">{g.title}</Text>
                          <View className="flex-row items-center mt-1 gap-2">
                            <Text className="font-bold" style={{ color: barColor }}>{formatAmount(g.savedAmount, currency)}</Text>
                            <Text className="text-gray-400 text-xs">of {formatAmount(g.targetAmount, currency)}</Text>
                          </View>
                        </View>
                        <TouchableOpacity onPress={() => deleteGoal(g.id)} className="p-1">
                          <Text className="text-gray-300 dark:text-gray-600 text-lg">✕</Text>
                        </TouchableOpacity>
                      </View>

                      <AnimatedBar percent={pct} color={barColor} />

                      <View className="flex-row justify-between items-center mt-3">
                        {done ? (
                          <Text className="text-green-500 font-bold text-sm">🎉 Goal Reached!</Text>
                        ) : (
                          <Text className="text-gray-400 text-sm">
                            <Text className="font-bold text-gray-700 dark:text-gray-300">{pct.toFixed(0)}%</Text>
                            {'  ·  '}{formatAmount(remaining, currency)} to go
                          </Text>
                        )}
                        {!done && (
                          <TouchableOpacity onPress={() => openContribute(g)} className="bg-green-500 px-4 py-2 rounded-xl">
                            <Text className="text-white text-sm font-bold">+ Add</Text>
                          </TouchableOpacity>
                        )}
                      </View>
                    </View>
                  </View>
                </AnimatedCard>
              );
            })}
          </View>
        )}
        <View className="h-10" />
      </ScrollView>

      {/* New Goal Modal */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <View className="flex-1 justify-end bg-black/50">
          <View className="bg-white dark:bg-gray-900 rounded-t-3xl p-6">
            <View className="w-10 h-1 bg-gray-200 dark:bg-gray-700 rounded-full self-center mb-5" />
            <Text className="text-xl font-bold text-gray-800 dark:text-white mb-5">New Savings Goal</Text>
            <Text className="text-gray-500 text-sm mb-2 font-medium">Goal Title</Text>
            <TextInput className="border border-gray-200 dark:border-gray-700 rounded-2xl px-4 py-3.5 text-gray-800 dark:text-white bg-gray-50 dark:bg-gray-800 mb-4"
              placeholder="e.g. New Phone, Vacation, Laptop" placeholderTextColor="#9ca3af" value={title} onChangeText={setTitle} />
            <Text className="text-gray-500 text-sm mb-2 font-medium">Target Amount</Text>
            <View className="flex-row items-center border border-gray-200 dark:border-gray-700 rounded-2xl px-4 bg-gray-50 dark:bg-gray-800 mb-6">
              <Text className="text-gray-400 font-bold mr-2 text-lg">{currency}</Text>
              <TextInput className="flex-1 text-gray-800 dark:text-white py-3.5" placeholder="0.00"
                placeholderTextColor="#9ca3af" value={target} onChangeText={v => setTarget(v.replace(/[^0-9.]/g, ''))} keyboardType="numeric" />
            </View>
            <View className="flex-row gap-3">
              <TouchableOpacity onPress={() => setModalVisible(false)} className="flex-1 border border-gray-200 dark:border-gray-700 rounded-2xl py-3.5 items-center">
                <Text className="text-gray-600 dark:text-gray-300 font-medium">Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={addGoal} className="flex-1 bg-green-500 rounded-2xl py-3.5 items-center">
                <Text className="text-white font-bold">Create Goal</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Contribute Modal */}
      <Modal visible={!!contributeModal} transparent animationType="slide">
        <View className="flex-1 justify-end bg-black/50">
          <View className="bg-white dark:bg-gray-900 rounded-t-3xl p-6">
            <View className="w-10 h-1 bg-gray-200 dark:bg-gray-700 rounded-full self-center mb-5" />
            <View className="flex-row items-center gap-3 mb-4">
              <Text className="text-3xl">{contributeModal ? getGoalEmoji(contributeModal.title) : '🐖'}</Text>
              <View>
                <Text className="text-xl font-bold text-gray-800 dark:text-white">{contributeModal?.title}</Text>
                <Text className="text-gray-400 text-sm">{formatAmount(contributeModal?.savedAmount ?? 0, currency)} saved</Text>
              </View>
            </View>
            <Text className="text-gray-500 text-sm mb-2 font-medium">Amount to Add</Text>
            <View className="flex-row items-center border border-gray-200 dark:border-gray-700 rounded-2xl px-4 bg-gray-50 dark:bg-gray-800 mb-6">
              <Text className="text-gray-400 font-bold mr-2 text-lg">{currency}</Text>
              <TextInput className="flex-1 text-gray-800 dark:text-white py-3.5 text-lg font-bold" placeholder="0.00"
                placeholderTextColor="#9ca3af" value={contribution} onChangeText={v => setContribution(v.replace(/[^0-9.]/g, ''))} keyboardType="numeric" autoFocus />
            </View>
            <View className="flex-row gap-3">
              <TouchableOpacity onPress={() => { setContributeModal(null); setContribution(''); }}
                className="flex-1 border border-gray-200 dark:border-gray-700 rounded-2xl py-3.5 items-center">
                <Text className="text-gray-600 dark:text-gray-300 font-medium">Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={addContribution} className="flex-1 bg-green-500 rounded-2xl py-3.5 items-center">
                <Text className="text-white font-bold">Add Savings</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
