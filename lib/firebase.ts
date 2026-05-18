import { initializeApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: 'AIzaSyAelv1hsENsftu9IJ_7N8UlAKAvvVvIqYc',
  authDomain: 'spendwise-8548f.firebaseapp.com',
  projectId: 'spendwise-8548f',
  storageBucket: 'spendwise-8548f.firebasestorage.app',
  messagingSenderId: '28496638622',
  appId: '1:28496638622:web:1a6ad770498b55f94dc18f',
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

export const auth = getAuth(app);
export const db = getFirestore(app);
