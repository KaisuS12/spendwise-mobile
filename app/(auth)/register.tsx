import { useState, useRef, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  KeyboardAvoidingView, Platform, ActivityIndicator, Alert, ScrollView, Animated, Easing,
} from 'react-native';
import { Link, router } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';

export default function RegisterScreen() {
  const { signUp } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

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

  async function handleRegister() {
    if (!name || !email || !password || !confirm) {
      Alert.alert('Error', 'Please fill in all fields.');
      return;
    }
    if (password !== confirm) {
      Alert.alert('Error', 'Passwords do not match.');
      return;
    }
    if (password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters.');
      return;
    }
    try {
      setLoading(true);
      await signUp(email.trim(), password, name.trim());
      router.replace('/(tabs)');
    } catch (e: any) {
      Alert.alert('Registration Failed', e.message ?? 'Please try again.');
    } finally {
      setLoading(false);
    }
  }

  const fields = [
    { label: 'FULL NAME', value: name, onChange: setName, placeholder: 'Juan dela Cruz', emoji: '👤', secure: false, keyboard: 'default' as const, cap: 'words' as const },
    { label: 'EMAIL', value: email, onChange: setEmail, placeholder: 'you@email.com', emoji: '✉️', secure: false, keyboard: 'email-address' as const, cap: 'none' as const },
  ];

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1, backgroundColor: '#0F0F13' }}
    >
      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={{ flex: 1, justifyContent: 'center', paddingHorizontal: 24, paddingVertical: 40 }}>

          {/* Logo */}
          <Animated.View style={{ opacity: logoAnim, transform: [{ translateY: logoSlide }], alignItems: 'center', marginBottom: 36 }}>
            <View style={{ width: 80, height: 80, borderRadius: 24, backgroundColor: '#6C63FF', alignItems: 'center', justifyContent: 'center', marginBottom: 16, shadowColor: '#6C63FF', shadowOpacity: 0.4, shadowRadius: 20, elevation: 10 }}>
              <Text style={{ fontSize: 36 }}>💰</Text>
            </View>
            <Text style={{ fontSize: 28, fontWeight: '800', color: '#FFFFFF', letterSpacing: -0.5 }}>SpendWise</Text>
            <Text style={{ color: '#6B7280', marginTop: 4, fontSize: 14 }}>Take control of your money</Text>
          </Animated.View>

          {/* Form */}
          <Animated.View style={{ opacity: formAnim, transform: [{ translateY: formSlide }] }}>
            <Text style={{ fontSize: 22, fontWeight: '700', color: '#FFFFFF', marginBottom: 24 }}>Create account 🚀</Text>

            {/* Name & Email fields */}
            {fields.map(({ label, value, onChange, placeholder, emoji, secure, keyboard, cap }) => (
              <View key={label}>
                <Text style={{ color: '#9CA3AF', fontSize: 13, fontWeight: '600', marginBottom: 8 }}>{label}</Text>
                <View style={{ backgroundColor: '#1C1C24', borderRadius: 14, borderWidth: 1, borderColor: '#2D2D3A', marginBottom: 16, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16 }}>
                  <Text style={{ fontSize: 16, marginRight: 10 }}>{emoji}</Text>
                  <TextInput
                    style={{ flex: 1, color: '#FFFFFF', paddingVertical: 14, fontSize: 15 }}
                    placeholder={placeholder}
                    placeholderTextColor="#4B5563"
                    value={value}
                    onChangeText={onChange}
                    secureTextEntry={secure}
                    keyboardType={keyboard}
                    autoCapitalize={cap}
                  />
                </View>
              </View>
            ))}

            {/* Password */}
            <Text style={{ color: '#9CA3AF', fontSize: 13, fontWeight: '600', marginBottom: 8 }}>PASSWORD</Text>
            <View style={{ backgroundColor: '#1C1C24', borderRadius: 14, borderWidth: 1, borderColor: '#2D2D3A', marginBottom: 16, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16 }}>
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

            {/* Confirm Password */}
            <Text style={{ color: '#9CA3AF', fontSize: 13, fontWeight: '600', marginBottom: 8 }}>CONFIRM PASSWORD</Text>
            <View style={{ backgroundColor: '#1C1C24', borderRadius: 14, borderWidth: 1, borderColor: '#2D2D3A', marginBottom: 28, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16 }}>
              <Text style={{ fontSize: 16, marginRight: 10 }}>🔒</Text>
              <TextInput
                style={{ flex: 1, color: '#FFFFFF', paddingVertical: 14, fontSize: 15 }}
                placeholder="••••••••"
                placeholderTextColor="#4B5563"
                value={confirm}
                onChangeText={setConfirm}
                secureTextEntry={!showConfirm}
              />
              <TouchableOpacity onPress={() => setShowConfirm(!showConfirm)}>
                <Text style={{ color: '#6B7280', fontSize: 13 }}>{showConfirm ? 'Hide' : 'Show'}</Text>
              </TouchableOpacity>
            </View>

            {/* Button */}
            <TouchableOpacity
              onPress={handleRegister}
              disabled={loading}
              style={{ backgroundColor: '#6C63FF', borderRadius: 14, paddingVertical: 16, alignItems: 'center', shadowColor: '#6C63FF', shadowOpacity: 0.35, shadowRadius: 12, elevation: 8 }}
            >
              {loading
                ? <ActivityIndicator color="white" />
                : <Text style={{ color: '#FFFFFF', fontWeight: '700', fontSize: 16 }}>Create Account</Text>
              }
            </TouchableOpacity>

            {/* Sign in link */}
            <View style={{ flexDirection: 'row', justifyContent: 'center', marginTop: 24 }}>
              <Text style={{ color: '#6B7280' }}>Already have an account? </Text>
              <Link href="/(auth)/login">
                <Text style={{ color: '#6C63FF', fontWeight: '700' }}>Sign In</Text>
              </Link>
            </View>
          </Animated.View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
