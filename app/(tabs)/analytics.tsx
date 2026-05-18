import { View, Text, ScrollView, Dimensions, TouchableOpacity, Share, Platform, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PieChart, BarChart } from 'react-native-gifted-charts';
import { useTransactions } from '@/hooks/useTransactions';
import { useAuth } from '@/hooks/useAuth';
import { formatAmount } from '@/constants/currencies';
import { getCategoryInfo } from '@/constants/categories';
import { useMemo } from 'react';

const WIDTH = Dimensions.get('window').width - 48;

export default function AnalyticsScreen() {
  const { transactions, totalIncome, totalExpense } = useTransactions();
  const { profile } = useAuth();
  const currency = profile?.currency ?? '₱';

  const now = new Date();
  const thisMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const monthName = now.toLocaleDateString('en', { month: 'long', year: 'numeric' });

  const monthlyExpenses = useMemo(() =>
    transactions.filter(t => t.type === 'expense' && t.date.startsWith(thisMonth)),
    [transactions, thisMonth]);

  const monthlyIncome = useMemo(() =>
    transactions.filter(t => t.type === 'income' && t.date.startsWith(thisMonth)),
    [transactions, thisMonth]);

  const pieData = useMemo(() => {
    const totals: Record<string, number> = {};
    for (const t of monthlyExpenses) {
      totals[t.category] = (totals[t.category] ?? 0) + t.amount;
    }
    return Object.entries(totals).map(([cat, value]) => {
      const info = getCategoryInfo(cat as any);
      return { value, color: info.color, label: info.label, text: info.icon };
    }).sort((a, b) => b.value - a.value);
  }, [monthlyExpenses]);

  const barData = useMemo(() => {
    const result = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const income = transactions.filter(t => t.type === 'income' && t.date.startsWith(key)).reduce((s, t) => s + t.amount, 0);
      const expense = transactions.filter(t => t.type === 'expense' && t.date.startsWith(key)).reduce((s, t) => s + t.amount, 0);
      result.push({
        stacks: [
          { value: income, color: '#22C55E', marginBottom: 2 },
          { value: expense, color: '#EF4444' },
        ],
        label: d.toLocaleDateString('en', { month: 'short' }),
      });
    }
    return result;
  }, [transactions]);

  const totalMonthExpense = monthlyExpenses.reduce((s, t) => s + t.amount, 0);
  const totalMonthIncome = monthlyIncome.reduce((s, t) => s + t.amount, 0);
  const savingsRate = totalMonthIncome > 0 ? (((totalMonthIncome - totalMonthExpense) / totalMonthIncome) * 100).toFixed(0) : '0';
  const topCategory = pieData[0];

  async function handleShare() {
    const lines = [
      `📊 SpendWise Report — ${monthName}`,
      ``,
      `💰 Income:    ${formatAmount(totalMonthIncome, currency)}`,
      `💸 Expenses:  ${formatAmount(totalMonthExpense, currency)}`,
      `💹 Savings Rate: ${savingsRate}%`,
      ``,
      topCategory ? `🏆 Top Spend: ${topCategory.text} ${topCategory.label} — ${formatAmount(topCategory.value, currency)}` : '',
      ``,
      `Breakdown:`,
      ...pieData.map(p => `  ${p.text} ${p.label}: ${formatAmount(p.value, currency)}`),
      ``,
      `— Sent from SpendWise 💰`,
    ].filter(Boolean);
    const text = lines.join('\n');
    if (Platform.OS === 'web') {
      try {
        await navigator.clipboard.writeText(text);
        window.alert('Report copied to clipboard!');
      } catch {
        window.alert(text);
      }
      return;
    }
    await Share.share({ message: text });
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50 dark:bg-gray-950">
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={{ backgroundColor: '#6C63FF', paddingHorizontal: 24, paddingTop: 16, paddingBottom: 32 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <View>
              <Text style={{ color: 'white', fontSize: 24, fontWeight: '800' }}>Analytics</Text>
              <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13, marginTop: 2 }}>{monthName}</Text>
            </View>
            <TouchableOpacity
              onPress={handleShare}
              style={{ backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 20, paddingHorizontal: 16, paddingVertical: 8, flexDirection: 'row', alignItems: 'center', gap: 6 }}
            >
              <Text style={{ fontSize: 14 }}>📤</Text>
              <Text style={{ color: 'white', fontWeight: '700', fontSize: 13 }}>Share</Text>
            </TouchableOpacity>
          </View>

          {/* Header summary */}
          <View style={{ flexDirection: 'row', gap: 10, marginTop: 20 }}>
            <View style={{ flex: 1, backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 14, padding: 14 }}>
              <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 11 }}>INCOME</Text>
              <Text style={{ color: '#86efac', fontWeight: '800', fontSize: 18, marginTop: 4 }}>{formatAmount(totalMonthIncome, currency)}</Text>
            </View>
            <View style={{ flex: 1, backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 14, padding: 14 }}>
              <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 11 }}>EXPENSES</Text>
              <Text style={{ color: '#fca5a5', fontWeight: '800', fontSize: 18, marginTop: 4 }}>{formatAmount(totalMonthExpense, currency)}</Text>
            </View>
            <View style={{ flex: 1, backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 14, padding: 14 }}>
              <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 11 }}>SAVINGS</Text>
              <Text style={{ color: 'white', fontWeight: '800', fontSize: 18, marginTop: 4 }}>{savingsRate}%</Text>
            </View>
          </View>
        </View>

        <View style={{ paddingHorizontal: 16, marginTop: -16 }}>
          {/* Top category highlight */}
          {topCategory && (
            <View style={{ backgroundColor: 'white', borderRadius: 20, padding: 16, marginBottom: 12, flexDirection: 'row', alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 8, elevation: 2 }}>
              <View style={{ width: 48, height: 48, borderRadius: 16, backgroundColor: topCategory.color + '20', alignItems: 'center', justifyContent: 'center', marginRight: 14 }}>
                <Text style={{ fontSize: 24 }}>{topCategory.text}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ color: '#9CA3AF', fontSize: 11, fontWeight: '600' }}>TOP SPENDING CATEGORY</Text>
                <Text style={{ color: '#1F2937', fontWeight: '800', fontSize: 16, marginTop: 2 }}>{topCategory.label}</Text>
              </View>
              <Text style={{ color: topCategory.color, fontWeight: '800', fontSize: 16 }}>{formatAmount(topCategory.value, currency)}</Text>
            </View>
          )}

          {/* Pie Chart */}
          <View style={{ backgroundColor: 'white', borderRadius: 20, padding: 20, marginBottom: 12, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 8, elevation: 2 }}>
            <Text style={{ fontWeight: '800', color: '#1F2937', fontSize: 16, marginBottom: 4 }}>Spending by Category</Text>
            <Text style={{ color: '#9CA3AF', fontSize: 12, marginBottom: 16 }}>This month's expense breakdown</Text>
            {pieData.length === 0 ? (
              <View style={{ alignItems: 'center', paddingVertical: 40 }}>
                <Text style={{ fontSize: 48, marginBottom: 12 }}>📊</Text>
                <Text style={{ color: '#6B7280', fontWeight: '700' }}>No expenses this month</Text>
                <Text style={{ color: '#9CA3AF', fontSize: 13, marginTop: 4 }}>Add transactions to see your breakdown</Text>
              </View>
            ) : (
              <View style={{ alignItems: 'center' }}>
                <PieChart
                  data={pieData}
                  donut
                  radius={110}
                  innerRadius={72}
                  centerLabelComponent={() => (
                    <View style={{ alignItems: 'center' }}>
                      <Text style={{ color: '#9CA3AF', fontSize: 10 }}>Total</Text>
                      <Text style={{ color: '#1F2937', fontWeight: '800', fontSize: 15 }}>{formatAmount(totalMonthExpense, currency)}</Text>
                    </View>
                  )}
                />
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 10, marginTop: 16 }}>
                  {pieData.map(item => (
                    <View key={item.label} style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <View style={{ width: 10, height: 10, borderRadius: 3, backgroundColor: item.color }} />
                      <Text style={{ fontSize: 12, color: '#6B7280' }}>{item.text} {item.label}</Text>
                      <Text style={{ fontSize: 11, color: '#9CA3AF' }}>
                        {totalMonthExpense > 0 ? ((item.value / totalMonthExpense) * 100).toFixed(0) : 0}%
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            )}
          </View>

          {/* Bar Chart */}
          <View style={{ backgroundColor: 'white', borderRadius: 20, padding: 20, marginBottom: 24, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 8, elevation: 2 }}>
            <Text style={{ fontWeight: '800', color: '#1F2937', fontSize: 16, marginBottom: 4 }}>6-Month Overview</Text>
            <Text style={{ color: '#9CA3AF', fontSize: 12, marginBottom: 12 }}>Income vs expenses trend</Text>
            <View style={{ flexDirection: 'row', gap: 16, marginBottom: 16 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <View style={{ width: 12, height: 12, borderRadius: 3, backgroundColor: '#22C55E' }} />
                <Text style={{ fontSize: 12, color: '#6B7280' }}>Income</Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <View style={{ width: 12, height: 12, borderRadius: 3, backgroundColor: '#EF4444' }} />
                <Text style={{ fontSize: 12, color: '#6B7280' }}>Expense</Text>
              </View>
            </View>
            <BarChart
              stackData={barData}
              barWidth={32}
              spacing={16}
              hideRules
              xAxisLabelTextStyle={{ color: '#9ca3af', fontSize: 10 }}
              yAxisTextStyle={{ color: '#9ca3af', fontSize: 10 }}
              noOfSections={4}
              width={WIDTH - 40}
              roundedTop
            />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
