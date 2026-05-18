# SpendWise — Study Guide
### React Native + Expo + Firebase Personal Finance App

---

## Table of Contents
1. [What is SpendWise?](#1-what-is-spendwise)
2. [Tech Stack](#2-tech-stack)
3. [Project Structure](#3-project-structure)
4. [How Authentication Works](#4-how-authentication-works)
5. [How the Database Works](#5-how-the-database-works)
6. [How Navigation Works](#6-how-navigation-works)
7. [How Each Feature Works](#7-how-each-feature-works)
8. [Device Features Used](#8-device-features-used)
9. [How the APK is Built](#9-how-the-apk-is-built)
10. [Common Interview/Defense Questions](#10-common-interviewdefense-questions)

---

## 1. What is SpendWise?

SpendWise is a **personal finance mobile app** that helps users track their money. It was built as a final project using React Native and Expo with Firebase as the backend.

**Core Purpose:**
- Track income and expenses
- Set and monitor budget goals
- Manage savings, debts, wallets, and bills
- View spending analytics through charts

---

## 2. Tech Stack

| Layer | Technology | Purpose |
|---|---|---|
| Framework | React Native + Expo SDK 54 | Build the mobile app |
| Language | TypeScript | Type-safe JavaScript |
| Navigation | Expo Router v3 | Screen routing and navigation |
| Styling | NativeWind v4 (Tailwind CSS) | UI styling with utility classes |
| Charts | react-native-gifted-charts | Pie chart and bar chart |
| Backend | Firebase Firestore | Cloud database (stores all data) |
| Auth | Firebase Authentication | User login and registration |
| Notifications | expo-notifications | Push and scheduled notifications |
| Biometrics | expo-local-authentication | Fingerprint / Face ID app lock |
| Storage | AsyncStorage | Saves onboarding flag locally |
| Build | EAS Build (Expo) | Produces the Android APK |

---

## 3. Project Structure

```
spendwise-mobile/
├── app/                        ← All screens (Expo Router)
│   ├── _layout.tsx             ← Root layout, auth guard
│   ├── onboarding.tsx          ← First-launch onboarding slides
│   ├── (auth)/
│   │   ├── login.tsx           ← Login screen
│   │   └── register.tsx        ← Register screen
│   ├── (tabs)/
│   │   ├── index.tsx           ← Dashboard (Home)
│   │   ├── history.tsx         ← Transaction history
│   │   ├── analytics.tsx       ← Charts and reports
│   │   ├── budget.tsx          ← Budget goals
│   │   └── profile.tsx         ← User profile and settings
│   ├── transaction/
│   │   ├── add.tsx             ← Add new transaction
│   │   └── [id].tsx            ← Edit/delete transaction
│   ├── wallets/index.tsx       ← Wallet management
│   ├── savings/index.tsx       ← Savings goals
│   ├── debts/index.tsx         ← Debt tracker
│   ├── bills/index.tsx         ← Recurring bills
│   └── tools/
│       ├── splitter.tsx        ← Bill splitter calculator
│       ├── health.tsx          ← Financial health score
│       ├── lock.tsx            ← App lock (PIN/biometrics)
│       └── daily-limit.tsx     ← Daily spending limit
├── hooks/
│   ├── useAuth.tsx             ← Authentication context and hook
│   └── useTransactions.tsx     ← Fetch and manage transactions
├── lib/
│   └── firebase.ts             ← Firebase initialization
├── constants/
│   └── currencies.ts           ← Currency list and formatAmount()
├── types/
│   └── index.ts                ← TypeScript type definitions
└── global.css                  ← NativeWind global styles
```

---

## 4. How Authentication Works

### Registration
1. User fills in name, email, password on the register screen
2. App calls `createUserWithEmailAndPassword(auth, email, password)` from Firebase Auth
3. Firebase creates the user account and returns a user object
4. App saves the user's name to Firestore under `users/{userId}`
5. User is redirected to the Dashboard

### Login
1. User enters email and password
2. App calls `signInWithEmailAndPassword(auth, email, password)`
3. Firebase verifies credentials and returns a session
4. Session is **automatically persisted** — user stays logged in after closing the app

### Auth Guard (`_layout.tsx`)
```
App opens → Check if user is logged in
  ├── Not logged in → Redirect to /login
  └── Logged in → Redirect to /(tabs) dashboard
```

### Logout
- Calls `signOut(auth)` from Firebase
- Clears the session
- User is redirected back to login

---

## 5. How the Database Works

### Firebase Firestore Structure
```
users/
  {userId}/
    profile         ← name, currency, darkMode
    transactions/
      {transactionId}   ← type, amount, category, date, note
    budgets/
      {category}        ← limit, month
    wallets/
      {walletId}        ← name, type, balance, color
    savings/
      {goalId}          ← title, targetAmount, savedAmount
    debts/
      {debtId}          ← personName, amount, direction, isPaid
    bills/
      {billId}          ← name, amount, dueDay, isPaid, category
```

### CRUD Operations
- **Create:** `addDoc(collection(db, 'users', uid, 'transactions'), data)`
- **Read:** `onSnapshot(query(...))` — listens for real-time updates
- **Update:** `updateDoc(doc(db, 'users', uid, 'transactions', id), data)`
- **Delete:** `deleteDoc(doc(db, 'users', uid, 'transactions', id))`

### Real-Time Updates
The app uses `onSnapshot` which means:
- When data changes in Firestore → UI updates **instantly**
- No need to manually refresh the screen
- Works even if another device changes the same data

---

## 6. How Navigation Works

Expo Router uses **file-based routing** — the file path = the URL/route.

| File | Route | Screen |
|---|---|---|
| `app/(auth)/login.tsx` | `/login` | Login screen |
| `app/(tabs)/index.tsx` | `/` | Dashboard |
| `app/(tabs)/history.tsx` | `/history` | History |
| `app/transaction/add.tsx` | `/transaction/add` | Add transaction |
| `app/transaction/[id].tsx` | `/transaction/123` | Edit transaction |
| `app/wallets/index.tsx` | `/wallets` | Wallets |

### Tab Navigation
The `(tabs)` folder creates the bottom tab bar automatically with 5 tabs:
- Home, History, Analytics, Budget, Profile

### Navigating Between Screens
```tsx
router.push('/wallets')        // Go to wallets
router.replace('/(tabs)')      // Replace current screen
router.back()                  // Go back
```

---

## 7. How Each Feature Works

### Transactions
- Stored in Firestore under `users/{uid}/transactions`
- Each has: `type` (income/expense), `amount`, `category`, `date`, `note`
- Dashboard calculates balance by summing all transactions
- History screen filters them by type, category, or search term

### Budget Goals
- Stored under `users/{uid}/budgets/{category}`
- App reads all expense transactions for the current month
- Groups them by category and compares to the budget limit
- Progress = `(amountSpent / limit) * 100`

### Analytics Charts
- **Pie chart:** Groups this month's expenses by category, shows percentage
- **Bar chart:** Groups last 6 months by month, shows income vs expense pairs
- Share button generates a text summary using React Native's `Share` API

### Savings Goals
- User sets a `targetAmount` when creating the goal
- Each contribution increases `savedAmount` in Firestore
- Progress = `(savedAmount / targetAmount) * 100`

### Debt Tracker
- `direction: 'they_owe'` = someone owes you
- `direction: 'i_owe'` = you owe someone
- Net balance = total they owe you − total you owe
- Marking paid sets `isPaid: true` in Firestore

### Recurring Bills
- Each bill has a `dueDay` (1–31) = day of the month it's due
- Marking paid creates an expense transaction automatically
- Bills reset to `isPaid: false` at the start of each month

### Financial Health Score
- Calculates a score 0–100 based on:
  - Budget adherence (are you staying under budget?)
  - Savings rate (income vs expenses ratio)
  - Number of active savings goals
- Grade: A (80–100), B (60–79), C (40–59), D (below 40)

---

## 8. Device Features Used

| Feature | Package | Where Used |
|---|---|---|
| Push Notifications | expo-notifications | Budget alerts, bill reminders, daily 9pm reminder |
| Biometrics / PIN | expo-local-authentication | App Lock screen |
| Local Storage | AsyncStorage | Saves onboarding completion flag |
| Share / Export | React Native Share API | Share monthly report in Analytics |
| Dark Mode Detection | NativeWind + useColorScheme | Auto-detect system theme |
| Animations | React Native Animated API | Card entrances, progress bars, header slides |

---

## 9. How the APK is Built

1. Code is written and tested locally with `npx expo start`
2. Code is pushed to GitHub
3. Run `eas build --platform android --profile preview`
4. EAS (Expo Application Services) compiles the app on Expo's cloud servers
5. Produces a `.apk` file hosted on expo.dev
6. APK is downloaded and installed on Android devices directly

### Why EAS and not local build?
- Local Android builds require Android Studio + Java SDK (complex setup)
- EAS handles everything on the cloud — just run one command
- Free tier allows unlimited builds

---

## 10. Common Interview/Defense Questions

**Q: What is React Native?**
A: A JavaScript framework by Meta that lets you build mobile apps for Android and iOS using React. It converts JavaScript code into native mobile components.

**Q: What is Expo?**
A: A platform built on top of React Native that simplifies development. It provides pre-built tools like camera, notifications, and biometrics without writing native code.

**Q: Why Firebase?**
A: Firebase is a Backend-as-a-Service (BaaS) by Google. It provides authentication, real-time database, and cloud storage without building a custom server. The free tier is enough for small apps.

**Q: What is Firestore?**
A: A NoSQL cloud database from Firebase. Data is stored as collections and documents (like folders and files). It supports real-time listeners so the UI updates instantly when data changes.

**Q: What is the difference between SQL and NoSQL?**
A: SQL stores data in tables with rows and columns (structured). NoSQL like Firestore stores data as flexible documents (JSON-like). NoSQL is better for mobile apps because the structure can change easily.

**Q: How does the app stay logged in?**
A: Firebase Auth automatically persists the session using secure local storage. When the app opens, it checks if a valid session exists and skips the login screen.

**Q: How do real-time updates work?**
A: The app uses `onSnapshot()` from Firestore which creates a live listener. When any data changes in the database, Firestore pushes the update to all connected devices instantly.

**Q: What is TypeScript?**
A: A superset of JavaScript that adds type safety. It catches errors during development instead of at runtime, making the code more reliable and easier to maintain.

**Q: What is NativeWind?**
A: A library that brings Tailwind CSS utility classes to React Native. Instead of writing StyleSheet objects, you write className strings like `className="text-white font-bold"`.

**Q: How is the APK different from a Play Store app?**
A: An APK is a raw installation file that can be installed directly on Android (sideloading). A Play Store app goes through Google's review process and supports automatic updates. For testing and school projects, APK is sufficient.

**Q: Can multiple users use the app at the same time?**
A: Yes. Each user's data is stored under their own unique user ID in Firestore. Users never access each other's data. Firebase can handle thousands of simultaneous users on the free plan.

**Q: What happens if the user has no internet?**
A: Firestore has offline support built-in. It caches data locally so the user can still view their data. Changes made offline sync automatically when internet is restored.

**Q: What is Expo Router?**
A: A file-based navigation system for Expo apps. The file structure inside the `app/` folder automatically becomes the navigation routes — similar to how Next.js works for web.

---

*SpendWise — Built with React Native, Expo, and Firebase*
