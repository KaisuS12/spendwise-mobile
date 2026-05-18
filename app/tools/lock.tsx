import { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as LocalAuthentication from 'expo-local-authentication';
import AsyncStorage from '@react-native-async-storage/async-storage';

const PIN_KEY = 'spendwise_pin';

export default function AppLockScreen() {
  const [storedPin, setStoredPin] = useState<string | null>(null);
  const [input, setInput] = useState('');
  const [mode, setMode] = useState<'set' | 'confirm' | 'locked'>('set');
  const [tempPin, setTempPin] = useState('');
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [isUnlocked, setIsUnlocked] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(PIN_KEY).then(pin => {
      setStoredPin(pin);
      setMode(pin ? 'locked' : 'set');
    });
    LocalAuthentication.hasHardwareAsync().then(has => {
      if (has) LocalAuthentication.isEnrolledAsync().then(setBiometricAvailable);
    });
  }, []);

  function handlePress(digit: string) {
    if (input.length >= 4) return;
    const newInput = input + digit;
    setInput(newInput);

    if (newInput.length === 4) {
      setTimeout(() => {
        if (mode === 'set') {
          setTempPin(newInput);
          setMode('confirm');
          setInput('');
        } else if (mode === 'confirm') {
          if (newInput === tempPin) {
            AsyncStorage.setItem(PIN_KEY, newInput);
            setStoredPin(newInput);
            setIsUnlocked(true);
            Alert.alert('✅ PIN Set', 'Your app lock PIN has been saved.');
          } else {
            Alert.alert('❌ PIN Mismatch', 'PINs do not match. Try again.');
            setMode('set');
            setTempPin('');
          }
          setInput('');
        } else if (mode === 'locked') {
          if (newInput === storedPin) {
            setIsUnlocked(true);
          } else {
            Alert.alert('❌ Wrong PIN', 'Incorrect PIN. Try again.');
          }
          setInput('');
        }
      }, 100);
    }
  }

  function handleDelete() {
    setInput(prev => prev.slice(0, -1));
  }

  async function handleBiometric() {
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: 'Authenticate to unlock SpendWise',
      fallbackLabel: 'Use PIN',
    });
    if (result.success) setIsUnlocked(true);
  }

  async function removePin() {
    Alert.alert('Remove PIN', 'Are you sure you want to remove app lock?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove', style: 'destructive', onPress: async () => {
          await AsyncStorage.removeItem(PIN_KEY);
          setStoredPin(null);
          setMode('set');
          setIsUnlocked(false);
          setInput('');
        }
      },
    ]);
  }

  if (isUnlocked && storedPin) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50 dark:bg-gray-950 px-6">
        <View className="flex-1 items-center justify-center">
          <Text className="text-6xl mb-4">🔓</Text>
          <Text className="text-2xl font-bold text-gray-800 dark:text-white mb-2">App is Unlocked</Text>
          <Text className="text-gray-400 text-center mb-8">Your PIN is active. SpendWise is protected.</Text>
          <TouchableOpacity onPress={removePin} className="border border-red-300 rounded-2xl px-8 py-3">
            <Text className="text-red-500 font-medium">Remove PIN Lock</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-gray-950">
      <View className="flex-1 items-center justify-center px-6">
        <Text className="text-5xl mb-4">{mode === 'locked' ? '🔒' : '🔑'}</Text>
        <Text className="text-2xl font-bold text-gray-800 dark:text-white mb-2">
          {mode === 'set' ? 'Set a PIN' : mode === 'confirm' ? 'Confirm PIN' : 'Enter PIN'}
        </Text>
        <Text className="text-gray-400 text-center mb-8">
          {mode === 'set' ? 'Choose a 4-digit PIN to lock SpendWise' :
            mode === 'confirm' ? 'Enter your PIN again to confirm' :
              'Enter your PIN to unlock the app'}
        </Text>

        {/* PIN Dots */}
        <View className="flex-row gap-4 mb-10">
          {[0, 1, 2, 3].map(i => (
            <View key={i} className={`w-4 h-4 rounded-full ${i < input.length ? 'bg-primary' : 'bg-gray-200 dark:bg-gray-700'}`} />
          ))}
        </View>

        {/* Numpad */}
        <View className="w-full max-w-xs">
          {[['1', '2', '3'], ['4', '5', '6'], ['7', '8', '9'], ['', '0', '⌫']].map((row, ri) => (
            <View key={ri} className="flex-row justify-between mb-3">
              {row.map((digit, di) => (
                <TouchableOpacity
                  key={di}
                  onPress={() => digit === '⌫' ? handleDelete() : digit ? handlePress(digit) : null}
                  className={`w-20 h-16 rounded-2xl items-center justify-center ${digit ? 'bg-gray-100 dark:bg-gray-800' : ''}`}
                >
                  <Text className="text-2xl font-bold text-gray-800 dark:text-white">{digit}</Text>
                </TouchableOpacity>
              ))}
            </View>
          ))}
        </View>

        {biometricAvailable && mode === 'locked' && (
          <TouchableOpacity onPress={handleBiometric} className="mt-4 flex-row items-center gap-2">
            <Text className="text-3xl">👆</Text>
            <Text className="text-primary font-medium">Use Biometrics</Text>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
}
