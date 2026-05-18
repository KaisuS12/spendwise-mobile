import { View, Text, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTransactions } from '@/hooks/useTransactions';
import { useAuth } from '@/hooks/useAuth';
import { formatAmount } from '@/constants/currencies';
import { useMemo } from 'react';

interface ScoreItem {
  label: string;
  score: number;
  maxScore: number;
  tip: string;
  emoji: string;
}

export default function FinancialHealthScreen() {
  const { transactions, totalIncome, totalExpense } = useTransactions();
  const { profile } = useAuth();
  const currency = profile?.currency ?? '₱';

  const now = new Date();
  const thisMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  const scores = useMemo((): ScoreItem[] => {
    const balance = totalIncome - totalExpense;
    const savingsRate = totalIncome > 0 ? ((balance / totalIncome) * 100) : 0;
    const monthlyTx = transactions.filter(t => t.date.startsWith(thisMonth));
    const monthlyExpense = monthlyTx.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
    const monthlyIncome = monthlyTx.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
    const txCount = transactions.length;

    return [
      {
        label: 'Savings Rate',
        score: Math.min(Math.round(savingsRate / 5) * 5, 25),
        maxScore: 25,
        tip: savingsRate >= 20 ? 'Excellent! You save more than 20% of income.' : 'Try to save at least 20% of your income.',
        emoji: '💰',
      },
      {
        label: 'Expense Control',
        score: monthlyIncome > 0 ? Math.min(Math.round((1 - monthlyExpense / monthlyIncome) * 25), 25) : 10,
        maxScore: 25,
        tip: monthlyExpense <= monthlyIncome ? 'Good! Your expenses are within income.' : 'Your expenses exceed income this month.',
        emoji: '🎯',
      },
      {
        label: 'Transaction Tracking',
        score: Math.min(txCount * 2, 25),
        maxScore: 25,
        tip: txCount >= 10 ? 'Great tracking habits!' : 'Log more transactions for a better score.',
        emoji: '📊',
      },
      {
        label: 'Positive Balance',
        score: balance >= 0 ? 25 : 0,
        maxScore: 25,
        tip: balance >= 0 ? `You have a positive balance of ${formatAmount(balance, currency)}.` : 'Your total expenses exceed income. Review your spending.',
        emoji: '⚖️',
      },
    ];
  }, [transactions, totalIncome, totalExpense, thisMonth]);

  const totalScore = scores.reduce((s, i) => s + i.score, 0);

  const grade = totalScore >= 90 ? { letter: 'A', color: '#22C55E', label: 'Excellent' }
    : totalScore >= 75 ? { letter: 'B', color: '#3B82F6', label: 'Good' }
    : totalScore >= 60 ? { letter: 'C', color: '#F59E0B', label: 'Fair' }
    : { letter: 'D', color: '#EF4444', label: 'Needs Improvement' };

  return (
    <SafeAreaView className="flex-1 bg-gray-50 dark:bg-gray-950">
      <ScrollView className="px-6">
        {/* Score Card */}
        <View className="mt-4 rounded-3xl p-6 items-center mb-6" style={{ backgroundColor: grade.color }}>
          <Text className="text-white/80 text-sm font-medium mb-1">Financial Health Score</Text>
          <Text className="text-white text-7xl font-bold">{totalScore}</Text>
          <Text className="text-white/80 text-sm">/100</Text>
          <View className="bg-white/20 rounded-full px-6 py-2 mt-3">
            <Text className="text-white font-bold text-lg">Grade {grade.letter} — {grade.label}</Text>
          </View>
        </View>

        {/* Score Breakdown */}
        <Text className="text-gray-700 dark:text-gray-300 font-bold text-base mb-3">Score Breakdown</Text>
        {scores.map((item) => (
          <View key={item.label} className="bg-white dark:bg-gray-800 rounded-2xl p-4 mb-3">
            <View className="flex-row items-center justify-between mb-2">
              <View className="flex-row items-center gap-2">
                <Text className="text-xl">{item.emoji}</Text>
                <Text className="font-bold text-gray-800 dark:text-white">{item.label}</Text>
              </View>
              <Text className="font-bold text-primary">{item.score}/{item.maxScore}</Text>
            </View>
            <View className="bg-gray-100 dark:bg-gray-700 rounded-full h-2 mb-2">
              <View
                className="h-full rounded-full bg-primary"
                style={{ width: `${(item.score / item.maxScore) * 100}%` }}
              />
            </View>
            <Text className="text-gray-400 text-xs">{item.tip}</Text>
          </View>
        ))}

        {/* Tips */}
        <View className="bg-primary/10 rounded-2xl p-4 mb-8">
          <Text className="text-primary font-bold mb-2">💡 Tips to improve</Text>
          {totalScore < 100 && (
            <View className="gap-1">
              {scores.filter(s => s.score < s.maxScore).map(s => (
                <Text key={s.label} className="text-gray-600 dark:text-gray-300 text-sm">• {s.tip}</Text>
              ))}
            </View>
          )}
          {totalScore === 100 && <Text className="text-green-600 font-medium">Perfect score! Keep it up! 🎉</Text>}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
