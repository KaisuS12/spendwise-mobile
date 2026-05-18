import { useState, useRef } from 'react';
import { View, Text, TouchableOpacity, Dimensions, ScrollView } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';

const { width } = Dimensions.get('window');

const SLIDES = [
  {
    emoji: '💰',
    title: 'Welcome to SpendWise',
    subtitle: 'Your all-in-one personal finance companion. Track income, expenses, and build smarter money habits.',
    accent: '#6C63FF',
    features: [],
  },
  {
    emoji: '📊',
    title: 'Track Every Peso',
    subtitle: 'Log transactions in seconds. See where your money goes with beautiful charts and real-time insights.',
    accent: '#22C55E',
    features: ['🍔 Categorize expenses', '📅 Date-based history', '🔍 Search & filter'],
  },
  {
    emoji: '🎯',
    title: 'Reach Your Goals',
    subtitle: 'Set budgets, track savings, manage debts — everything you need to take control of your finances.',
    accent: '#F59E0B',
    features: ['🏦 Multiple wallets', '🔔 Budget alerts', '🤝 Debt tracker'],
  },
];

export default function OnboardingScreen() {
  const [current, setCurrent] = useState(0);
  const scrollRef = useRef<ScrollView>(null);
  const slide = SLIDES[current];

  async function finish() {
    await AsyncStorage.setItem('onboarded', 'true');
    router.replace('/(auth)/login');
  }

  function next() {
    if (current < SLIDES.length - 1) {
      const n = current + 1;
      scrollRef.current?.scrollTo({ x: n * width, animated: true });
      setCurrent(n);
    } else {
      finish();
    }
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#0F0F13' }}>
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        scrollEnabled={false}
        style={{ flex: 1 }}
      >
        {SLIDES.map((s, i) => (
          <View key={i} style={{ width, flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 36 }}>
            {/* Icon */}
            <View style={{
              width: 140, height: 140, borderRadius: 44,
              backgroundColor: s.accent,
              alignItems: 'center', justifyContent: 'center',
              marginBottom: 40,
              shadowColor: s.accent, shadowOpacity: 0.5, shadowRadius: 32, elevation: 16,
            }}>
              <Text style={{ fontSize: 64 }}>{s.emoji}</Text>
            </View>

            {/* Slide counter */}
            <Text style={{ color: s.accent, fontSize: 12, fontWeight: '700', letterSpacing: 3, marginBottom: 14 }}>
              {i + 1} OF {SLIDES.length}
            </Text>

            <Text style={{ fontSize: 28, fontWeight: '800', color: '#FFFFFF', textAlign: 'center', marginBottom: 16, lineHeight: 36 }}>
              {s.title}
            </Text>
            <Text style={{ fontSize: 15, color: '#9CA3AF', textAlign: 'center', lineHeight: 24, marginBottom: 32 }}>
              {s.subtitle}
            </Text>

            {s.features.length > 0 && (
              <View style={{ backgroundColor: '#1C1C24', borderRadius: 16, padding: 16, width: '100%', gap: 10 }}>
                {s.features.map(f => (
                  <View key={f} style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                    <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: s.accent }} />
                    <Text style={{ color: '#D1D5DB', fontSize: 14 }}>{f}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        ))}
      </ScrollView>

      {/* Dots */}
      <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8, marginBottom: 28 }}>
        {SLIDES.map((s, i) => (
          <View
            key={i}
            style={{
              height: 8, borderRadius: 4,
              width: i === current ? 28 : 8,
              backgroundColor: i === current ? slide.accent : '#374151',
            }}
          />
        ))}
      </View>

      {/* Buttons */}
      <View style={{ paddingHorizontal: 24, paddingBottom: 52, flexDirection: 'row', gap: 12 }}>
        {current < SLIDES.length - 1 ? (
          <>
            <TouchableOpacity
              onPress={finish}
              style={{ flex: 1, borderWidth: 1, borderColor: '#374151', borderRadius: 14, paddingVertical: 16, alignItems: 'center' }}
            >
              <Text style={{ color: '#6B7280', fontWeight: '600' }}>Skip</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={next}
              style={{ flex: 2, backgroundColor: slide.accent, borderRadius: 14, paddingVertical: 16, alignItems: 'center', shadowColor: slide.accent, shadowOpacity: 0.4, shadowRadius: 16, elevation: 8 }}
            >
              <Text style={{ color: '#FFFFFF', fontWeight: '700', fontSize: 16 }}>Next →</Text>
            </TouchableOpacity>
          </>
        ) : (
          <TouchableOpacity
            onPress={finish}
            style={{ flex: 1, backgroundColor: slide.accent, borderRadius: 14, paddingVertical: 16, alignItems: 'center', shadowColor: slide.accent, shadowOpacity: 0.4, shadowRadius: 16, elevation: 8 }}
          >
            <Text style={{ color: '#FFFFFF', fontWeight: '700', fontSize: 16 }}>Get Started 🚀</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}
