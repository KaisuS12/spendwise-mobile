import { useState, useMemo, useRef, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, Modal, Alert, Animated, Easing, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { collection, doc, setDoc, deleteDoc, onSnapshot, query } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/hooks/useAuth';
import { useTransactions } from '@/hooks/useTransactions';
import { formatAmount } from '@/constants/currencies';
import { getCategoryInfo, EXPENSE_CATEGORIES } from '@/constants/categories';
import { Budget, Category } from '@/types';
import { sendBudgetAlert } from '@/lib/notifications';
import { BarChart } from 'react-native-gifted-charts';

const WIDTH = Dimensions.get('window').width - 48;

function AnimatedBar({ percent, color }: { percent: number; color: string }) {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(anim, { toValue: percent, duration: 700, easing: Easing.out(Easing.cubic), useNativeDriver: false }).start();
  }, [percent]);
  return (
    <View style={{ height: 10, backgroundColor: '#F3F4F6', borderRadius: 6, overflow: 'hidden' }}>
      <Animated.View style={{
        height: '100%', borderRadius: 6, backgroundColor: color,
        width: anim.interpolate({ inputRange: [0, 100], outputRange: ['0%', '100%'] }),
      }} />
    </View>
  );
}

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

export default function BudgetScreen() {
  const { user, profile } = useAuth();
  const { transactions } = useTransactions();
  const currency = profile?.currency ?? '₱';
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const alertedRef = useRef<Set<string>>(new Set());
  const [selectedCat, setSelectedCat] = useState<Category>('food');
  const [limitInput, setLimitInput] = useState('');

  const now = new Date();
  const thisMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const monthName = now.toLocaleDateString('en', { month: 'long', year: 'numeric' });

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, 'users', user.uid, 'budgets'));
    return onSnapshot(q, snap => {
      setBudgets(snap.docs.map(d => d.data() as Budget).filter(b => b.month === thisMonth));
    });
  }, [user]);

  const spending = useMemo(() => {
    const map: Record<string, number> = {};
    for (const t of transactions) {
      if (t.type === 'expense' && t.date.startsWith(thisMonth)) {
        map[t.category] = (map[t.category] ?? 0) + t.amount;
      }
    }
    return map;
  }, [transactions, thisMonth]);

  useEffect(() => {
    for (const b of budgets) {
      const spent = spending[b.category] ?? 0;
      const percent = b.limit > 0 ? (spent / b.limit) * 100 : 0;
      const key = `${thisMonth}_${b.category}`;
      if (percent >= 80 && !alertedRef.current.has(key)) {
        alertedRef.current.add(key);
        sendBudgetAlert(getCategoryInfo(b.category).label, percent);
      }
    }
  }, [spending, budgets]);

  async function saveBudget() {
    if (!user || !limitInput) return;
    const limit = parseFloat(limitInput);
    if (isNaN(limit) || limit <= 0) { Alert.alert('Invalid amount'); return; }
    await setDoc(doc(db, 'users', user.uid, 'budgets', `${thisMonth}_${selectedCat}`), {
      category: selectedCat, limit, month: thisMonth,
    });
    setModalVisible(false);
    setLimitInput('');
  }

  async function removeBudget(cat: Category) {
    if (!user) return;
    await deleteDoc(doc(db, 'users', user.uid, 'budgets', `${thisMonth}_${cat}`));
  }

  const totalBudget = budgets.reduce((s, b) => s + b.limit, 0);
  const totalSpent = budgets.reduce((s, b) => s + (spending[b.category] ?? 0), 0);
  const overallPercent = totalBudget > 0 ? Math.min((totalSpent / totalBudget) * 100, 100) : 0;
  const remaining = totalBudget - totalSpent;

  const chartData = budgets.flatMap((b, i) => {
    const cat = getCategoryInfo(b.category);
    const spent = spending[b.category] ?? 0;
    return [
      { value: b.limit, frontColor: cat.color + '55', label: '', spacing: 3 },
      {
        value: spent,
        frontColor: spent > b.limit ? '#EF4444' : cat.color,
        label: cat.icon,
        spacing: i < budgets.length - 1 ? 18 : 0,
      },
    ];
  });

  return (
    <SafeAreaView className="flex-1 bg-gray-50 dark:bg-gray-950">
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={{ backgroundColor: '#6C63FF', paddingHorizontal: 24, paddingTop: 16, paddingBottom: 32 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <View>
              <Text style={{ color: 'white', fontSize: 24, fontWeight: '800' }}>Budget Goals</Text>
              <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13, marginTop: 2 }}>{monthName}</Text>
            </View>
            <TouchableOpacity
              onPress={() => setModalVisible(true)}
              style={{ backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 20, paddingHorizontal: 16, paddingVertical: 8 }}
            >
              <Text style={{ color: 'white', fontWeight: '700', fontSize: 13 }}>+ Set Budget</Text>
            </TouchableOpacity>
          </View>

          {budgets.length > 0 && (
            <View style={{ backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 16, padding: 16 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 }}>
                <View>
                  <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 11 }}>TOTAL SPENT</Text>
                  <Text style={{ color: 'white', fontWeight: '800', fontSize: 20, marginTop: 2 }}>{formatAmount(totalSpent, currency)}</Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 11 }}>REMAINING</Text>
                  <Text style={{ color: remaining >= 0 ? '#86efac' : '#fca5a5', fontWeight: '800', fontSize: 20, marginTop: 2 }}>
                    {remaining >= 0 ? formatAmount(remaining, currency) : '-' + formatAmount(Math.abs(remaining), currency)}
                  </Text>
                </View>
              </View>
              <View style={{ backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 6, height: 8, overflow: 'hidden' }}>
                <View style={{ width: `${overallPercent}%`, height: '100%', borderRadius: 6, backgroundColor: overallPercent >= 100 ? '#fca5a5' : overallPercent >= 80 ? '#fde68a' : '#86efac' }} />
              </View>
              <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 11, marginTop: 6 }}>
                {overallPercent.toFixed(0)}% of {formatAmount(totalBudget, currency)} used
              </Text>
            </View>
          )}
        </View>

        <View style={{ marginTop: -16, paddingHorizontal: 16 }}>
          {budgets.length === 0 ? (
            <AnimatedCard delay={100}>
              <View style={{ backgroundColor: 'white', borderRadius: 20, padding: 40, alignItems: 'center', marginTop: 16 }}>
                <Text style={{ fontSize: 64, marginBottom: 16 }}>🎯</Text>
                <Text style={{ color: '#1F2937', fontSize: 18, fontWeight: '800', marginBottom: 8 }}>No budgets set</Text>
                <Text style={{ color: '#9CA3AF', fontSize: 13, textAlign: 'center', marginBottom: 24 }}>
                  Set monthly spending limits for each category to stay on track
                </Text>
                <TouchableOpacity
                  onPress={() => setModalVisible(true)}
                  style={{ backgroundColor: '#6C63FF', borderRadius: 14, paddingHorizontal: 24, paddingVertical: 14 }}
                >
                  <Text style={{ color: 'white', fontWeight: '700' }}>Set Your First Budget</Text>
                </TouchableOpacity>
              </View>
            </AnimatedCard>
          ) : (
            <>
              {budgets.map((b, i) => {
                const spent = spending[b.category] ?? 0;
                const percent = Math.min(b.limit > 0 ? (spent / b.limit) * 100 : 0, 100);
                const cat = getCategoryInfo(b.category);
                const isOver = spent > b.limit;
                const isWarning = percent >= 80 && !isOver;
                const barColor = isOver ? '#EF4444' : isWarning ? '#F59E0B' : '#22C55E';

                return (
                  <AnimatedCard key={b.category} delay={i * 80}>
                    <View style={{ backgroundColor: 'white', borderRadius: 20, padding: 16, marginBottom: 12, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 8, elevation: 2 }}>
                      {/* Color strip */}
                      <View style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 4, borderRadius: 20, backgroundColor: cat.color }} />

                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, paddingLeft: 8 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                          <View style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: cat.color + '20', alignItems: 'center', justifyContent: 'center' }}>
                            <Text style={{ fontSize: 22 }}>{cat.icon}</Text>
                          </View>
                          <View>
                            <Text style={{ fontWeight: '700', color: '#1F2937', fontSize: 15 }}>{cat.label}</Text>
                            <Text style={{ fontSize: 12, color: '#9CA3AF', marginTop: 1 }}>
                              {formatAmount(spent, currency)} / {formatAmount(b.limit, currency)}
                            </Text>
                          </View>
                        </View>
                        <TouchableOpacity onPress={() => removeBudget(b.category)} style={{ padding: 4 }}>
                          <Text style={{ color: '#D1D5DB', fontSize: 16 }}>✕</Text>
                        </TouchableOpacity>
                      </View>

                      <View style={{ paddingLeft: 8 }}>
                        <AnimatedBar percent={percent} color={barColor} />
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 }}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                            <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: barColor }} />
                            <Text style={{ fontSize: 11, fontWeight: '600', color: barColor }}>
                              {isOver ? 'Over budget!' : isWarning ? 'Almost there' : 'On track'}
                            </Text>
                          </View>
                          <Text style={{ fontSize: 11, color: '#9CA3AF', fontWeight: '600' }}>{percent.toFixed(0)}%</Text>
                        </View>
                      </View>
                    </View>
                  </AnimatedCard>
                );
              })}

              {/* Bar Chart Comparison */}
              {budgets.length >= 2 && (
                <AnimatedCard delay={budgets.length * 80 + 100}>
                  <View style={{ backgroundColor: 'white', borderRadius: 20, padding: 20, marginBottom: 12 }}>
                    <Text style={{ fontWeight: '800', color: '#1F2937', fontSize: 15, marginBottom: 4 }}>Budget vs Spent</Text>
                    <View style={{ flexDirection: 'row', gap: 16, marginBottom: 16 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <View style={{ width: 10, height: 10, borderRadius: 2, backgroundColor: '#D1D5DB' }} />
                        <Text style={{ fontSize: 11, color: '#9CA3AF' }}>Budget</Text>
                      </View>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <View style={{ width: 10, height: 10, borderRadius: 2, backgroundColor: '#6C63FF' }} />
                        <Text style={{ fontSize: 11, color: '#9CA3AF' }}>Spent</Text>
                      </View>
                    </View>
                    <BarChart
                      data={chartData}
                      barWidth={20}
                      spacing={0}
                      hideRules
                      xAxisLabelTextStyle={{ color: '#9ca3af', fontSize: 12 }}
                      yAxisTextStyle={{ color: '#9ca3af', fontSize: 10 }}
                      noOfSections={4}
                      width={WIDTH - 40}
                      roundedTop
                    />
                  </View>
                </AnimatedCard>
              )}
            </>
          )}
        </View>
        <View style={{ height: 32 }} />
      </ScrollView>

      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.4)' }}>
          <View className="bg-white dark:bg-gray-900 rounded-t-3xl p-6">
            <View className="w-10 h-1 bg-gray-200 dark:bg-gray-700 rounded-full self-center mb-5" />
            <Text className="text-xl font-bold text-gray-800 dark:text-white mb-4">Set Budget Limit</Text>

            <Text className="text-gray-500 dark:text-gray-400 text-sm font-semibold mb-2">Category</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-4">
              <View className="flex-row gap-2">
                {EXPENSE_CATEGORIES.map(c => (
                  <TouchableOpacity
                    key={c.value}
                    onPress={() => setSelectedCat(c.value)}
                    style={{
                      paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20,
                      flexDirection: 'row', alignItems: 'center', gap: 6,
                      backgroundColor: selectedCat === c.value ? c.color : '#F3F4F6',
                    }}
                  >
                    <Text style={{ fontSize: 14 }}>{c.icon}</Text>
                    <Text style={{ fontSize: 13, fontWeight: '600', color: selectedCat === c.value ? 'white' : '#6B7280' }}>{c.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>

            <Text className="text-gray-500 dark:text-gray-400 text-sm font-semibold mb-2">Monthly Limit ({currency})</Text>
            <TextInput
              className="border border-gray-200 dark:border-gray-700 rounded-2xl px-4 py-3.5 text-gray-800 dark:text-white bg-gray-50 dark:bg-gray-800 mb-5"
              placeholder="e.g. 3000"
              placeholderTextColor="#9ca3af"
              value={limitInput}
              onChangeText={v => setLimitInput(v.replace(/[^0-9.]/g, ''))}
              keyboardType="numeric"
            />

            <View className="flex-row gap-3">
              <TouchableOpacity onPress={() => setModalVisible(false)} className="flex-1 border border-gray-200 dark:border-gray-700 rounded-2xl py-3.5 items-center">
                <Text className="text-gray-600 dark:text-gray-300 font-medium">Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={saveBudget} className="flex-1 bg-primary rounded-2xl py-3.5 items-center">
                <Text className="text-white font-bold">Save Budget</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
