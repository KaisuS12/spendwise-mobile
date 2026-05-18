import { useState, useEffect, useCallback } from 'react';
import {
  collection, addDoc, updateDoc, deleteDoc,
  doc, query, orderBy, onSnapshot, Timestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/hooks/useAuth';
import { Transaction } from '@/types';

export function useTransactions() {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const q = query(
      collection(db, 'users', user.uid, 'transactions'),
      orderBy('date', 'desc'),
    );
    const unsub = onSnapshot(q, (snap) => {
      setTransactions(snap.docs.map(d => ({ id: d.id, ...d.data() } as Transaction)));
      setLoading(false);
    });
    return unsub;
  }, [user]);

  const addTransaction = useCallback(async (data: Omit<Transaction, 'id' | 'createdAt'>) => {
    if (!user) return;
    await addDoc(collection(db, 'users', user.uid, 'transactions'), {
      ...data,
      createdAt: new Date().toISOString(),
    });
  }, [user]);

  const updateTransaction = useCallback(async (id: string, data: Partial<Transaction>) => {
    if (!user) return;
    await updateDoc(doc(db, 'users', user.uid, 'transactions', id), data);
  }, [user]);

  const deleteTransaction = useCallback(async (id: string) => {
    if (!user) return;
    await deleteDoc(doc(db, 'users', user.uid, 'transactions', id));
  }, [user]);

  const totalIncome = transactions
    .filter(t => t.type === 'income')
    .reduce((s, t) => s + t.amount, 0);

  const totalExpense = transactions
    .filter(t => t.type === 'expense')
    .reduce((s, t) => s + t.amount, 0);

  const balance = totalIncome - totalExpense;

  return { transactions, loading, addTransaction, updateTransaction, deleteTransaction, totalIncome, totalExpense, balance };
}
