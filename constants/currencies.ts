export const CURRENCIES = [
  { label: 'Philippine Peso', symbol: '₱', code: 'PHP' },
  { label: 'US Dollar', symbol: '$', code: 'USD' },
  { label: 'Euro', symbol: '€', code: 'EUR' },
  { label: 'Japanese Yen', symbol: '¥', code: 'JPY' },
  { label: 'British Pound', symbol: '£', code: 'GBP' },
];

export function formatAmount(amount: number, currency = '₱'): string {
  return `${currency}${amount.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
