export type TransactionType = 'income' | 'expense';

export type Category =
  | 'food' | 'transport' | 'bills' | 'shopping'
  | 'health' | 'entertainment' | 'education'
  | 'salary' | 'freelance' | 'allowance' | 'other';

export type WalletType = 'cash' | 'gcash' | 'maya' | 'bank' | 'credit';

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  category: Category;
  note: string;
  date: string;
  receiptUrl?: string;
  walletId: string;
  createdAt: string;
}

export interface Budget {
  category: Category;
  limit: number;
  month: string;
}

export interface SavingsGoal {
  id: string;
  title: string;
  targetAmount: number;
  savedAmount: number;
  deadline?: string;
  createdAt: string;
}

export interface Wallet {
  id: string;
  name: string;
  type: WalletType;
  balance: number;
  color: string;
}

export interface Debt {
  id: string;
  personName: string;
  amount: number;
  direction: 'i_owe' | 'they_owe';
  note: string;
  dueDate?: string;
  isPaid: boolean;
  createdAt: string;
}

export interface RecurringBill {
  id: string;
  name: string;
  amount: number;
  dueDay: number;
  category: Category;
  walletId: string;
  isPaid: boolean;
}

export interface UserProfile {
  uid: string;
  name: string;
  email: string;
  avatarUrl?: string;
  currency: string;
  darkMode: boolean;
  dailyLimit?: number;
}
