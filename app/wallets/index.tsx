import { useState, useEffect, useRef } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, Modal, Alert, Animated, Easing, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { collection, addDoc, deleteDoc, doc, onSnapshot, query } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/hooks/useAuth';
import { formatAmount } from '@/constants/currencies';
import { Wallet, WalletType } from '@/types';

const WALLET_TYPES: { label: string; value: WalletType; emoji: string; color: string; bg: string }[] = [
  { label: 'Cash',   value: 'cash',   emoji: '💵', color: '#22C55E', bg: '#F0FDF4' },
  { label: 'GCash',  value: 'gcash',  emoji: '💙', color: '#3B82F6', bg: '#EFF6FF' },
  { label: 'Maya',   value: 'maya',   emoji: '💚', color: '#10B981', bg: '#ECFDF5' },
  { label: 'Bank',   value: 'bank',   emoji: '🏦', color: '#6C63FF', bg: '#F5F3FF' },
  { label: 'Credit', value: 'credit', emoji: '💳', color: '#EF4444', bg: '#FEF2F2' },
];

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

function AnimatedBar({ percent, color }: { percent: number; color: string }) {
  const width = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(width, {
      toValue: Math.min(percent, 100),
      duration: 900,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [percent]);
  return (
    <View style={{ backgroundColor: '#E5E7EB', borderRadius: 999, height: 6, marginTop: 12, overflow: 'hidden' }}>
      <Animated.View style={{
        height: '100%', borderRadius: 999, backgroundColor: color,
        width: width.interpolate({ inputRange: [0, 100], outputRange: ['0%', '100%'] }),
      }} />
    </View>
  );
}

export default function WalletsScreen() {
  const { user, profile } = useAuth();
  const currency = profile?.currency ?? '₱';
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [name, setName] = useState('');
  const [balance, setBalance] = useState('');
  const [selectedType, setSelectedType] = useState<WalletType>('cash');

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
    return onSnapshot(query(collection(db, 'users', user.uid, 'wallets')), snap => {
      setWallets(snap.docs.map(d => ({ id: d.id, ...d.data() } as Wallet)));
    });
  }, [user]);

  function openModal() {
    setName('');
    setBalance('');
    setSelectedType('cash');
    setModalVisible(true);
  }

  async function addWallet() {
    if (!name) { Alert.alert('Enter a wallet name'); return; }
    const typeInfo = WALLET_TYPES.find(t => t.value === selectedType)!;
    await addDoc(collection(db, 'users', user!.uid, 'wallets'), {
      name, type: selectedType, balance: parseFloat(balance) || 0, color: typeInfo.color,
    });
    setName(''); setBalance(''); setModalVisible(false);
  }

  async function confirmDelete(id: string, walletName: string) {
    if (Platform.OS === 'web') {
      if (!window.confirm(`Remove "${walletName}"?`)) return;
      await deleteDoc(doc(db, 'users', user!.uid, 'wallets', id));
      return;
    }
    Alert.alert('Remove Wallet', `Remove "${walletName}"?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: () => deleteDoc(doc(db, 'users', user!.uid, 'wallets', id)) },
    ]);
  }

  const totalBalance = wallets.reduce((s, w) => s + w.balance, 0);

  return (
    <SafeAreaView className="flex-1 bg-gray-50 dark:bg-gray-950">
      <ScrollView showsVerticalScrollIndicator={false}>

        <Animated.View style={{ opacity: headerOpacity, transform: [{ translateY: headerSlide }] }}>
          <View className="mx-6 mt-4 rounded-3xl p-6 mb-5" style={{ backgroundColor: '#6C63FF' }}>
            <Text className="text-white/70 text-sm font-medium mb-1">Total Balance</Text>
            <Text className="text-white text-4xl font-bold">{formatAmount(totalBalance, currency)}</Text>
            <View className="bg-white/20 rounded-full px-3 py-1 self-start mt-3">
              <Text className="text-white text-xs font-medium">{wallets.length} wallet{wallets.length !== 1 ? 's' : ''}</Text>
            </View>
          </View>
        </Animated.View>

        {wallets.length > 0 && (
          <AnimatedCard delay={150}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-5 pl-6">
              <View className="flex-row gap-3 pr-6">
                {WALLET_TYPES.filter(t => wallets.some(w => w.type === t.value)).map(t => {
                  const total = wallets.filter(w => w.type === t.value).reduce((s, w) => s + w.balance, 0);
                  return (
                    <View key={t.value} className="rounded-2xl p-4 min-w-[110px]" style={{ backgroundColor: t.bg }}>
                      <Text className="text-2xl mb-1">{t.emoji}</Text>
                      <Text className="font-bold text-sm" style={{ color: t.color }}>{formatAmount(total, currency)}</Text>
                      <Text className="text-xs text-gray-400 mt-0.5">{t.label}</Text>
                    </View>
                  );
                })}
              </View>
            </ScrollView>
          </AnimatedCard>
        )}

        <AnimatedCard delay={200}>
          <View className="flex-row justify-between items-center px-6 mb-3">
            <Text className="text-gray-700 dark:text-gray-300 font-bold text-base">My Wallets</Text>
            <TouchableOpacity onPress={openModal} className="bg-primary px-4 py-2 rounded-full">
              <Text className="text-white font-bold text-sm">+ Add Wallet</Text>
            </TouchableOpacity>
          </View>
        </AnimatedCard>

        {wallets.length === 0 ? (
          <AnimatedCard delay={250}>
            <View className="items-center py-20 px-10">
              <Text className="text-7xl mb-4">👛</Text>
              <Text className="text-gray-700 dark:text-white text-lg font-bold mb-1">No wallets yet</Text>
              <Text className="text-gray-400 text-center text-sm">Add your GCash, bank, or cash wallet to track all your balances.</Text>
              <TouchableOpacity onPress={openModal} className="mt-6 bg-primary px-6 py-3 rounded-2xl">
                <Text className="text-white font-bold">Add Your First Wallet</Text>
              </TouchableOpacity>
            </View>
          </AnimatedCard>
        ) : (
          <View className="px-6">
            {wallets.map((w, i) => {
              const info = WALLET_TYPES.find(t => t.value === w.type)!;
              const pct = totalBalance > 0 ? (w.balance / totalBalance) * 100 : 0;
              return (
                <AnimatedCard key={w.id} delay={200 + i * 100}>
                  <View className="bg-white dark:bg-gray-800 rounded-2xl mb-3 overflow-hidden">
                    <View style={{ height: 4, backgroundColor: info.color }} />
                    <View className="p-4">
                      <View className="flex-row items-center">
                        <View className="w-12 h-12 rounded-2xl items-center justify-center mr-4" style={{ backgroundColor: info.bg }}>
                          <Text className="text-2xl">{info.emoji}</Text>
                        </View>
                        <View className="flex-1">
                          <Text className="font-bold text-gray-800 dark:text-white text-base">{w.name}</Text>
                          <Text className="text-xs font-medium mt-0.5" style={{ color: info.color }}>{info.label}</Text>
                        </View>
                        <View className="items-end">
                          <Text className="font-bold text-gray-800 dark:text-white text-lg">{formatAmount(w.balance, currency)}</Text>
                          <Text className="text-xs text-gray-400">{pct.toFixed(0)}% of total</Text>
                        </View>
                      </View>
                      <AnimatedBar percent={pct} color={info.color} />
                      <TouchableOpacity onPress={() => confirmDelete(w.id, w.name)} className="mt-3 self-end">
                        <Text className="text-red-400 text-xs">Remove</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </AnimatedCard>
              );
            })}
          </View>
        )}
        <View className="h-10" />
      </ScrollView>

      <Modal visible={modalVisible} transparent animationType="slide">
        <View className="flex-1 justify-end bg-black/50">
          <View className="bg-white dark:bg-gray-900 rounded-t-3xl p-6">
            <View className="w-10 h-1 bg-gray-200 dark:bg-gray-700 rounded-full self-center mb-5" />
            <Text className="text-xl font-bold text-gray-800 dark:text-white mb-5">Add New Wallet</Text>
            <Text className="text-gray-500 text-sm mb-2 font-medium">Wallet Type</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-5">
              <View className="flex-row gap-2">
                {WALLET_TYPES.map(t => (
                  <TouchableOpacity key={t.value} onPress={() => setSelectedType(t.value)}
                    className="px-4 py-3 rounded-2xl items-center" style={{ backgroundColor: selectedType === t.value ? t.color : '#F3F4F6', minWidth: 72 }}>
                    <Text className="text-xl mb-1">{t.emoji}</Text>
                    <Text className="text-xs font-medium" style={{ color: selectedType === t.value ? '#fff' : '#6B7280' }}>{t.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
            <Text className="text-gray-500 text-sm mb-2 font-medium">Wallet Name</Text>
            <TextInput className="border border-gray-200 dark:border-gray-700 rounded-2xl px-4 py-3.5 text-gray-800 dark:text-white bg-gray-50 dark:bg-gray-800 mb-4"
              placeholder="e.g. BDO Savings, BPI Account" placeholderTextColor="#9ca3af" value={name} onChangeText={setName} />
            <Text className="text-gray-500 text-sm mb-2 font-medium">Current Balance (optional)</Text>
            <View className="flex-row items-center border border-gray-200 dark:border-gray-700 rounded-2xl px-4 bg-gray-50 dark:bg-gray-800 mb-6">
              <Text className="text-gray-400 font-bold mr-2 text-lg">{currency}</Text>
              <TextInput className="flex-1 text-gray-800 dark:text-white py-3.5" placeholder="0.00"
                placeholderTextColor="#9ca3af" value={balance} onChangeText={v => setBalance(v.replace(/[^0-9.]/g, ''))} keyboardType="numeric" />
            </View>
            <View className="flex-row gap-3">
              <TouchableOpacity onPress={() => setModalVisible(false)} className="flex-1 border border-gray-200 dark:border-gray-700 rounded-2xl py-3.5 items-center">
                <Text className="text-gray-600 dark:text-gray-300 font-medium">Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={addWallet} className="flex-1 bg-primary rounded-2xl py-3.5 items-center">
                <Text className="text-white font-bold">Add Wallet</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
