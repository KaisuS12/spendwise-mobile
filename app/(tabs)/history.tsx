import { useState, useMemo, useRef, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, Animated, Easing } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useTransactions } from '@/hooks/useTransactions';
import { useAuth } from '@/hooks/useAuth';
import { formatAmount } from '@/constants/currencies';
import { getCategoryInfo, EXPENSE_CATEGORIES, INCOME_CATEGORIES } from '@/constants/categories';
import { TransactionType } from '@/types';

type Filter = 'all' | TransactionType;

function AnimatedCard({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(16)).current;
  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 350, delay, useNativeDriver: true }),
      Animated.timing(translateY, { toValue: 0, duration: 350, delay, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
    ]).start();
  }, []);
  return <Animated.View style={{ opacity, transform: [{ translateY }] }}>{children}</Animated.View>;
}

export default function HistoryScreen() {
  const { transactions, loading } = useTransactions();
  const { profile } = useAuth();
  const currency = profile?.currency ?? '₱';
  const [filter, setFilter] = useState<Filter>('all');
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');

  const ALL_CATS = useMemo(() => {
    const seen = new Set<string>();
    const result: typeof EXPENSE_CATEGORIES = [];
    for (const t of transactions) {
      if (!seen.has(t.category)) {
        seen.add(t.category);
        result.push(getCategoryInfo(t.category as any) as any);
      }
    }
    return result;
  }, [transactions]);

  const filtered = useMemo(() => {
    return transactions.filter(t => {
      const matchType = filter === 'all' || t.type === filter;
      const matchCat = categoryFilter === 'all' || t.category === categoryFilter;
      const matchSearch = !search ||
        t.note?.toLowerCase().includes(search.toLowerCase()) ||
        getCategoryInfo(t.category).label.toLowerCase().includes(search.toLowerCase());
      return matchType && matchCat && matchSearch;
    });
  }, [transactions, filter, search, categoryFilter]);

  const grouped = useMemo(() => {
    const groups: Record<string, typeof filtered> = {};
    for (const t of filtered) {
      const date = t.date.slice(0, 10);
      if (!groups[date]) groups[date] = [];
      groups[date].push(t);
    }
    return groups;
  }, [filtered]);

  const netFiltered = filtered.reduce((s, t) => t.type === 'income' ? s + t.amount : s - t.amount, 0);

  function clearFilters() {
    setSearch('');
    setFilter('all');
    setCategoryFilter('all');
  }

  const hasActiveFilter = search || filter !== 'all' || categoryFilter !== 'all';

  return (
    <SafeAreaView className="flex-1 bg-gray-50 dark:bg-gray-950">
      {/* Gradient Header */}
      <View style={{ backgroundColor: '#6C63FF', paddingHorizontal: 24, paddingTop: 16, paddingBottom: 24 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
          <View>
            <Text style={{ color: 'white', fontSize: 24, fontWeight: '800' }}>Transactions</Text>
            <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13, marginTop: 2 }}>
              {filtered.length} records · Net{' '}
              <Text style={{ fontWeight: '700', color: netFiltered >= 0 ? '#86efac' : '#fca5a5' }}>
                {netFiltered >= 0 ? '+' : ''}{formatAmount(netFiltered, currency)}
              </Text>
            </Text>
          </View>
          {hasActiveFilter && (
            <TouchableOpacity
              onPress={clearFilters}
              style={{ backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6 }}
            >
              <Text style={{ color: 'white', fontSize: 12, fontWeight: '600' }}>Clear ✕</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Search bar */}
        <View style={{ backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 14, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14 }}>
          <Text style={{ marginRight: 8, fontSize: 16 }}>🔍</Text>
          <TextInput
            style={{ flex: 1, color: 'white', paddingVertical: 12, fontSize: 14 }}
            placeholder="Search by category or note..."
            placeholderTextColor="rgba(255,255,255,0.5)"
            value={search}
            onChangeText={setSearch}
          />
          {!!search && (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 18, lineHeight: 20 }}>✕</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Filter bar */}
      <View className="bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800">
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="px-4 py-2.5">
          <View className="flex-row items-center gap-2">
            {/* Type filters */}
            {([
              { key: 'all', label: '✦ All' },
              { key: 'income', label: '↑ Income' },
              { key: 'expense', label: '↓ Expense' },
            ] as { key: Filter; label: string }[]).map(f => (
              <TouchableOpacity
                key={f.key}
                onPress={() => setFilter(f.key)}
                style={{
                  paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20,
                  backgroundColor: filter === f.key
                    ? (f.key === 'income' ? '#22C55E' : f.key === 'expense' ? '#EF4444' : '#6C63FF')
                    : 'transparent',
                  borderWidth: 1,
                  borderColor: filter === f.key
                    ? 'transparent'
                    : '#E5E7EB',
                }}
              >
                <Text style={{
                  fontSize: 12, fontWeight: '600',
                  color: filter === f.key ? 'white' : '#6B7280',
                }}>{f.label}</Text>
              </TouchableOpacity>
            ))}

            {/* Divider */}
            <View style={{ width: 1, height: 20, backgroundColor: '#E5E7EB', marginHorizontal: 4 }} />

            {/* Category filters */}
            {ALL_CATS.map(c => (
              <TouchableOpacity
                key={c.value}
                onPress={() => setCategoryFilter(categoryFilter === c.value ? 'all' : c.value)}
                style={{
                  paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20,
                  flexDirection: 'row', alignItems: 'center', gap: 4,
                  backgroundColor: categoryFilter === c.value ? c.color : 'transparent',
                  borderWidth: 1,
                  borderColor: categoryFilter === c.value ? 'transparent' : '#E5E7EB',
                }}
              >
                <Text style={{ fontSize: 12 }}>{c.icon}</Text>
                <Text style={{
                  fontSize: 11, fontWeight: '600',
                  color: categoryFilter === c.value ? 'white' : '#6B7280',
                }}>{c.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} className="px-4 pt-3">
        {loading ? (
          <Text className="text-gray-400 text-center py-16">Loading...</Text>
        ) : Object.keys(grouped).length === 0 ? (
          <AnimatedCard>
            <View className="items-center py-24 px-8">
              <Text className="text-6xl mb-4">🔍</Text>
              <Text className="text-gray-800 dark:text-white text-lg font-bold mb-2">No transactions found</Text>
              <Text className="text-gray-400 text-center text-sm mb-6">Try adjusting your search or filters</Text>
              {hasActiveFilter && (
                <TouchableOpacity onPress={clearFilters} className="bg-primary px-6 py-3 rounded-2xl">
                  <Text className="text-white font-bold">Clear filters</Text>
                </TouchableOpacity>
              )}
            </View>
          </AnimatedCard>
        ) : (
          Object.entries(grouped).map(([date, txs], gi) => {
            const dayNet = txs.reduce((s, t) => t.type === 'income' ? s + t.amount : s - t.amount, 0);
            return (
              <AnimatedCard key={date} delay={gi * 60}>
                <View className="mb-4">
                  {/* Date header */}
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                    <View style={{ backgroundColor: '#EEF2FF', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 4 }}>
                      <Text style={{ color: '#6C63FF', fontSize: 11, fontWeight: '700' }}>
                        {new Date(date + 'T12:00:00').toLocaleDateString('en-PH', { weekday: 'short', month: 'short', day: 'numeric' })}
                      </Text>
                    </View>
                    <View style={{ flex: 1, height: 1, backgroundColor: '#F3F4F6', marginLeft: 8 }} />
                    <Text style={{ color: dayNet >= 0 ? '#22C55E' : '#EF4444', fontSize: 11, fontWeight: '700', marginLeft: 8 }}>
                      {dayNet >= 0 ? '+' : ''}{formatAmount(dayNet, currency)}
                    </Text>
                  </View>

                  <View className="bg-white dark:bg-gray-800 rounded-2xl overflow-hidden" style={{ shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 8, elevation: 2 }}>
                    {txs.map((t, i) => {
                      const cat = getCategoryInfo(t.category);
                      return (
                        <TouchableOpacity
                          key={t.id}
                          onPress={() => router.push(`/transaction/${t.id}` as any)}
                          className={`flex-row items-center px-4 py-3.5 ${i < txs.length - 1 ? 'border-b border-gray-100 dark:border-gray-700/50' : ''}`}
                        >
                          <View
                            style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: cat.color + '20', alignItems: 'center', justifyContent: 'center', marginRight: 12 }}
                          >
                            <Text style={{ fontSize: 20 }}>{cat.icon}</Text>
                          </View>
                          <View style={{ flex: 1 }}>
                            <Text className="font-semibold text-gray-800 dark:text-white text-sm">{cat.label}</Text>
                            {!!t.note && (
                              <Text className="text-xs text-gray-400 mt-0.5" numberOfLines={1}>{t.note}</Text>
                            )}
                          </View>
                          <View style={{ alignItems: 'flex-end' }}>
                            <Text style={{ fontWeight: '700', fontSize: 14, color: t.type === 'income' ? '#22C55E' : '#EF4444' }}>
                              {t.type === 'income' ? '+' : '-'}{formatAmount(t.amount, currency)}
                            </Text>
                            <View style={{
                              marginTop: 3, paddingHorizontal: 7, paddingVertical: 2, borderRadius: 20,
                              backgroundColor: t.type === 'income' ? '#F0FDF4' : '#FEF2F2',
                            }}>
                              <Text style={{ fontSize: 9, fontWeight: '700', color: t.type === 'income' ? '#22C55E' : '#EF4444', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                                {t.type}
                              </Text>
                            </View>
                          </View>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
              </AnimatedCard>
            );
          })
        )}
        <View className="h-24" />
      </ScrollView>
    </SafeAreaView>
  );
}
