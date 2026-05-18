import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export async function registerForPushNotifications(): Promise<boolean> {
  if (Platform.OS === 'web') return false;
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'SpendWise',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
    });
  }
  const { status: existing } = await Notifications.getPermissionsAsync();
  let finalStatus = existing;
  if (existing !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  return finalStatus === 'granted';
}

export async function sendBudgetAlert(category: string, percent: number) {
  if (Platform.OS === 'web') return;
  await Notifications.scheduleNotificationAsync({
    content: {
      title: '⚠️ Budget Alert!',
      body: `You've used ${percent.toFixed(0)}% of your ${category} budget this month.`,
      sound: true,
    },
    trigger: null,
  });
}

export async function sendBillReminder(billName: string, amount: number, currency: string) {
  if (Platform.OS === 'web') return;
  await Notifications.scheduleNotificationAsync({
    content: {
      title: '📅 Bill Due Tomorrow',
      body: `${billName} — ${currency}${amount.toLocaleString()} is due tomorrow. Don't forget!`,
      sound: true,
    },
    trigger: null,
  });
}

export async function sendDailyLimitAlert(remaining: number, currency: string) {
  if (Platform.OS === 'web') return;
  await Notifications.scheduleNotificationAsync({
    content: {
      title: '🚨 Daily Limit Reached!',
      body: `You've hit your daily spending limit. Remaining: ${currency}${remaining.toLocaleString()}`,
      sound: true,
    },
    trigger: null,
  });
}

export async function scheduleDailyReminder() {
  if (Platform.OS === 'web') return;
  await Notifications.cancelAllScheduledNotificationsAsync();
  await Notifications.scheduleNotificationAsync({
    content: {
      title: '💰 SpendWise Daily Reminder',
      body: "Don't forget to log your expenses today!",
      sound: true,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour: 21,
      minute: 0,
    },
  });
}
