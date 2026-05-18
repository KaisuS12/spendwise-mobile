# SpendWise — Personal Finance & Spending Tracker

A full-featured personal finance mobile app built with **React Native + Expo** and **Firebase**.

---

## Team Members

- Karl Kaisser Sipe
- Jaztin Glenn Sandig
- Kurt Vincent Tronco
- Kimberly Recaplaza
- April Sumagaysay

---

## Features

| # | Feature | Description |
|---|---------|-------------|
| 1 | **Authentication** | Email/password login & register with persistent session |
| 2 | **Dashboard** | Balance overview, income/expense summary, recent transactions |
| 3 | **Add/Edit/Delete Transactions** | Log income or expenses with category, date, and notes |
| 4 | **Transaction History** | Full list with search and filter by type |
| 5 | **Budget Goals** | Monthly spending limits per category with progress bars |
| 6 | **Analytics Charts** | Pie chart (spending by category) + bar chart (6-month trend) |
| 7 | **Recurring Bills** | Track due dates, pay now logs as expense automatically |
| 8 | **Savings Goals** | Create goals, log contributions, track progress |
| 9 | **Multiple Wallets** | Track GCash, Maya, bank, cash balances separately |
| 10 | **Debt Tracker** | Log money you owe and money owed to you |
| 11 | **Bill Splitter** | Split any bill by percentage among multiple people |
| 12 | **Financial Health Score** | Score 0–100 with grade A–D and improvement tips |
| 13 | **Daily Spending Limit** | Set a daily cap with live progress and alerts |
| 14 | **App Lock (PIN + Biometrics)** | 4-digit PIN and fingerprint/face ID via expo-local-authentication |
| 15 | **Push Notifications** | Budget alerts, bill reminders, daily log reminder at 9pm |
| 16 | **Dark Mode** | Full dark theme with NativeWind, persisted in Firestore |
| 17 | **Currency Selector** | PHP, USD, EUR, JPY, GBP — stored in user profile |

---

## Tech Stack

| Layer | Tool |
|-------|------|
| Framework | Expo SDK 54 + Expo Router v3 |
| Language | TypeScript |
| Styling | NativeWind v4 (Tailwind CSS for React Native) |
| Charts | react-native-gifted-charts |
| Backend | Firebase Auth + Firestore |
| Notifications | expo-notifications |
| Biometrics | expo-local-authentication |
| APK | EAS Build |

---

## Setup Instructions

### Prerequisites
- Node.js 18+
- Expo Go app on your phone (for development)

### 1. Clone the repository
```bash
git clone https://github.com/KaisuS12/spendwise-mobile.git
cd spendwise-mobile
```

### 2. Install dependencies
```bash
npm install
```

### 3. Create environment file
Create a `.env` file in the project root with your Firebase credentials:
```
EXPO_PUBLIC_FIREBASE_API_KEY=your_api_key
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.firebasestorage.app
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
EXPO_PUBLIC_FIREBASE_APP_ID=your_app_id
```

### 4. Run the app
```bash
npx expo start
```
Scan the QR code with Expo Go on your Android device.

---

## APK Download

> **[Download APK](https://expo.dev/accounts/kaisu12/projects/spendwise/builds/0e7c4387-c1ae-4d4f-bdff-a9fc6144c664)**

Scan the QR code on that page or open the link directly on an Android device to install.

---

## Firebase Setup

1. Create a Firebase project at [console.firebase.google.com](https://console.firebase.google.com)
2. Enable **Authentication** → Email/Password
3. Enable **Firestore Database** in production mode
4. Add your credentials to `.env`

### Firestore Security Rules
```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId}/{document=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```
