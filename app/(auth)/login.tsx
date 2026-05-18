import { useState, useRef, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  KeyboardAvoidingView, Platform, ActivityIndicator, Alert, Animated, Easing,
} from 'react-native';
import { Link, router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '@/hooks/useAuth';

export default function LoginScreen() {
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem('onboarded').then(v => {
      if (!v) router.replace('/onboarding');
    });
  }, []);

  const logoAnim = useRef(new Animated.Value(0)).current;
  const logoSlide = useRef(new Animated.Value(-30)).current;
  const formAnim = useRef(new Animated.Value(0)).current;
  const formSlide = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(logoAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.spring(logoSlide, { toValue: 0, tension: 60, friction: 8, useNativeDriver: true }),
    ]).start();
    Animated.parallel([
      Animated.timing(formAnim, { toValue: 1, duration: 600, delay: 200, useNativeDriver: true }),
      Animated.timing(formSlide, { toValue: 0, duration: 500, delay: 200, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
    ]).start();
  }, []);

  async function handleLogin() {
    if (!email || !password) { Alert.alert('Error', 'Please fill in all fields.'); return; }
    try {
      setLoading(true);
      await signIn(email.trim(), password);
      router.replace('/(tabs)');
    } catch {
      Alert.alert('Login Failed', 'Invalid email or password.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1, backgroundColor: '#0F0F13' }}
    >
      <View style={{ flex: 1, justifyContent: 'center', paddingHorizontal: 24 }}>

        {/* Logo */}
        <Animated.View style={{ opacity: logoAnim, transform: [{ translateY: logoSlide }], alignItems: 'center', marginBottom: 48 }}>
          <View style={{ width: 80, height: 80, borderRadius: 24, backgroundColor: '#6C63FF', alignItems: 'center', justifyContent: 'center', marginBottom: 16, shadowColor: '#6C63FF', shadowOpacity: 0.4, shadowRadius: 20, elevation: 10 }}>
            <Text style={{ fontSize: 36 }}>💰</Text>
          </View>
          <Text style={{ fontSize: 28, fontWeight: '800', color: '#FFFFFF', letterSpacing: -0.5 }}>SpendWise</Text>
          <Text style={{ color: '#6B7280', marginTop: 4, fontSize: 14 }}>Take control of your money</Text>
        </Animated.View>

        {/* Form */}
        <Animated.View style={{ opacity: formAnim, transform: [{ translateY: formSlide }] }}>
          <Text style={{ fontSize: 22, fontWeight: '700', color: '#FFFFFF', marginBottom: 24 }}>Welcome back 👋</Text>

          {/* Email */}
          <Text style={{ color: '#9CA3AF', fontSize: 13, fontWeight: '600', marginBottom: 8 }}>EMAIL</Text>
          <View style={{ backgroundColor: '#1C1C24', borderRadius: 14, borderWidth: 1, borderColor: '#2D2D3A', marginBottom: 16, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16 }}>
            <Text style={{ fontSize: 16, marginRight: 10 }}>✉️</Text>
            <TextInput
              style={{ flex: 1, color: '#FFFFFF', paddingVertical: 14, fontSize: 15 }}
              placeholder="you@email.com"
              placeholderTextColor="#4B5563"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
            />
          </View>

          {/* Password */}
          <Text style={{ color: '#9CA3AF', fontSize: 13, fontWeight: '600', marginBottom: 8 }}>PASSWORD</Text>
          <View style={{ backgroundColor: '#1C1C24', borderRadius: 14, borderWidth: 1, borderColor: '#2D2D3A', marginBottom: 28, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16 }}>
            <Text style={{ fontSize: 16, marginRight: 10 }}>🔑</Text>
            <TextInput
              style={{ flex: 1, color: '#FFFFFF', paddingVertical: 14, fontSize: 15 }}
              placeholder="••••••••"
              placeholderTextColor="#4B5563"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPass}
            />
            <TouchableOpacity onPress={() => setShowPass(!showPass)}>
              <Text style={{ color: '#6B7280', fontSize: 13 }}>{showPass ? 'Hide' : 'Show'}</Text>
            </TouchableOpacity>
          </View>

          {/* Button */}
          <TouchableOpacity
            onPress={handleLogin}
            disabled={loading}
            style={{ backgroundColor: '#6C63FF', borderRadius: 14, paddingVertical: 16, alignItems: 'center', shadowColor: '#6C63FF', shadowOpacity: 0.35, shadowRadius: 12, elevation: 8 }}
          >
            {loading
              ? <ActivityIndicator color="white" />
              : <Text style={{ color: '#FFFFFF', fontWeight: '700', fontSize: 16 }}>Sign In</Text>
            }
          </TouchableOpacity>

          {/* Sign up link */}
          <View style={{ flexDirection: 'row', justifyContent: 'center', marginTop: 24 }}>
            <Text style={{ color: '#6B7280' }}>Don't have an account? </Text>
            <Link href="/(auth)/register">
              <Text style={{ color: '#6C63FF', fontWeight: '700' }}>Sign Up</Text>
            </Link>
          </View>
        </Animated.View>
      </View>
    </KeyboardAvoidingView>
  );
}
