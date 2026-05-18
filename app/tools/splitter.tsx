import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/hooks/useAuth';

interface Person {
  name: string;
  percent: number;
}

export default function BillSplitterScreen() {
  const { profile } = useAuth();
  const currency = profile?.currency ?? '₱';
  const [total, setTotal] = useState('');
  const [people, setPeople] = useState<Person[]>([
    { name: 'Person 1', percent: 50 },
    { name: 'Person 2', percent: 50 },
  ]);
  const [calculated, setCalculated] = useState(false);

  function addPerson() {
    if (people.length >= 10) { Alert.alert('Maximum 10 people'); return; }
    const equal = Math.floor(100 / (people.length + 1));
    const newPeople = people.map(p => ({ ...p, percent: equal }));
    newPeople.push({ name: `Person ${people.length + 1}`, percent: equal });
    setPeople(newPeople);
    setCalculated(false);
  }

  function removePerson(index: number) {
    if (people.length <= 2) { Alert.alert('Minimum 2 people'); return; }
    const updated = people.filter((_, i) => i !== index);
    const equal = Math.floor(100 / updated.length);
    setPeople(updated.map(p => ({ ...p, percent: equal })));
    setCalculated(false);
  }

  function updateName(index: number, name: string) {
    const updated = [...people];
    updated[index].name = name;
    setPeople(updated);
  }

  function updatePercent(index: number, val: string) {
    const updated = [...people];
    updated[index].percent = parseFloat(val) || 0;
    setPeople(updated);
    setCalculated(false);
  }

  function splitEqually() {
    const equal = parseFloat((100 / people.length).toFixed(1));
    setPeople(people.map(p => ({ ...p, percent: equal })));
    setCalculated(false);
  }

  function calculate() {
    if (!total || parseFloat(total) <= 0) { Alert.alert('Enter a valid total amount'); return; }
    const sum = people.reduce((s, p) => s + p.percent, 0);
    if (Math.abs(sum - 100) > 1) { Alert.alert('Percentages must add up to 100%', `Current total: ${sum.toFixed(1)}%`); return; }
    setCalculated(true);
  }

  const totalAmount = parseFloat(total) || 0;

  return (
    <SafeAreaView className="flex-1 bg-gray-50 dark:bg-gray-950">
      <ScrollView className="px-6" keyboardShouldPersistTaps="handled">
        <View className="mt-4 mb-6">
          <Text className="text-gray-500 dark:text-gray-400 mb-1">Total Bill Amount</Text>
          <View className="flex-row items-center bg-white dark:bg-gray-800 rounded-2xl px-4 py-3 border border-gray-200 dark:border-gray-700">
            <Text className="text-2xl font-bold text-gray-400 mr-2">{currency}</Text>
            <TextInput
              className="text-3xl font-bold text-gray-800 dark:text-white flex-1"
              placeholder="0.00"
              placeholderTextColor="#9ca3af"
              value={total}
              onChangeText={t => { setTotal(t.replace(/[^0-9.]/g, '')); setCalculated(false); }}
              keyboardType="numeric"
            />
          </View>
        </View>

        <View className="flex-row justify-between items-center mb-3">
          <Text className="text-gray-700 dark:text-gray-300 font-bold text-base">People ({people.length})</Text>
          <View className="flex-row gap-2">
            <TouchableOpacity onPress={splitEqually} className="bg-gray-100 dark:bg-gray-800 px-3 py-1 rounded-full">
              <Text className="text-gray-600 dark:text-gray-300 text-xs font-medium">Split Equally</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={addPerson} className="bg-primary px-3 py-1 rounded-full">
              <Text className="text-white text-xs font-medium">+ Add</Text>
            </TouchableOpacity>
          </View>
        </View>

        {people.map((p, i) => (
          <View key={i} className="bg-white dark:bg-gray-800 rounded-2xl p-4 mb-3">
            <View className="flex-row items-center gap-3 mb-3">
              <View className="w-9 h-9 rounded-full bg-primary items-center justify-center">
                <Text className="text-white font-bold text-sm">{p.name[0]?.toUpperCase()}</Text>
              </View>
              <TextInput
                className="flex-1 text-gray-800 dark:text-white font-medium text-base"
                value={p.name}
                onChangeText={v => updateName(i, v)}
                placeholder="Name"
                placeholderTextColor="#9ca3af"
              />
              <TouchableOpacity onPress={() => removePerson(i)}>
                <Text className="text-red-400 text-lg">✕</Text>
              </TouchableOpacity>
            </View>

            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center gap-2">
                <TextInput
                  className="bg-gray-100 dark:bg-gray-700 rounded-xl px-3 py-2 text-gray-800 dark:text-white w-20 text-center font-bold"
                  value={String(p.percent)}
                  onChangeText={v => updatePercent(i, v.replace(/[^0-9.]/g, ''))}
                  keyboardType="numeric"
                />
                <Text className="text-gray-400 font-bold">%</Text>
              </View>
              {calculated && (
                <View className="items-end">
                  <Text className="text-primary font-bold text-lg">{currency}{((totalAmount * p.percent) / 100).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Text>
                  <Text className="text-gray-400 text-xs">to pay</Text>
                </View>
              )}
            </View>
          </View>
        ))}

        <Text className="text-xs text-gray-400 text-center mb-3">
          Total: {people.reduce((s, p) => s + p.percent, 0).toFixed(1)}% (must equal 100%)
        </Text>

        <TouchableOpacity onPress={calculate} className="bg-primary rounded-2xl py-4 items-center mb-4">
          <Text className="text-white font-bold text-base">Calculate Split</Text>
        </TouchableOpacity>

        {calculated && (
          <View className="bg-green-50 dark:bg-green-900/20 rounded-2xl p-4 mb-8">
            <Text className="text-green-600 font-bold text-center mb-2">✅ Split Calculated!</Text>
            {people.map((p, i) => (
              <View key={i} className="flex-row justify-between py-1">
                <Text className="text-gray-700 dark:text-gray-300">{p.name}</Text>
                <Text className="text-green-600 font-bold">{currency}{((totalAmount * p.percent) / 100).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Text>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
