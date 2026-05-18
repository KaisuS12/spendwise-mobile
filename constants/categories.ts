import { Category } from '@/types';

export const EXPENSE_CATEGORIES: { label: string; value: Category; icon: string; color: string }[] = [
  { label: 'Food', value: 'food', icon: '🍔', color: '#F97316' },
  { label: 'Transport', value: 'transport', icon: '🚌', color: '#3B82F6' },
  { label: 'Bills', value: 'bills', icon: '📄', color: '#EF4444' },
  { label: 'Shopping', value: 'shopping', icon: '🛍️', color: '#EC4899' },
  { label: 'Health', value: 'health', icon: '💊', color: '#10B981' },
  { label: 'Entertainment', value: 'entertainment', icon: '🎮', color: '#8B5CF6' },
  { label: 'Education', value: 'education', icon: '📚', color: '#06B6D4' },
  { label: 'Other', value: 'other', icon: '📦', color: '#6B7280' },
];

export const INCOME_CATEGORIES: { label: string; value: Category; icon: string; color: string }[] = [
  { label: 'Salary', value: 'salary', icon: '💼', color: '#22C55E' },
  { label: 'Freelance', value: 'freelance', icon: '💻', color: '#6C63FF' },
  { label: 'Allowance', value: 'allowance', icon: '🎁', color: '#F59E0B' },
  { label: 'Other', value: 'other', icon: '📦', color: '#6B7280' },
];

export const ALL_CATEGORIES = [...EXPENSE_CATEGORIES, ...INCOME_CATEGORIES];

export function getCategoryInfo(value: Category) {
  return ALL_CATEGORIES.find(c => c.value === value) ?? {
    label: 'Other', value: 'other', icon: '📦', color: '#6B7280',
  };
}
