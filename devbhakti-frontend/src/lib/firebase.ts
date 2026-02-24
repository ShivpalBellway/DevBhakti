// Firebase config ke variables .env se aate hain
// NEXT_PUBLIC_ prefix zaruri hai Next.js me client-side access ke liye

import { initializeApp, getApps, getApp } from 'firebase/app';
import { getMessaging, isSupported } from 'firebase/messaging';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

// Initialize Firebase app only once
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

// Get messaging instance singleton
let messaging: any = null;
if (typeof window !== 'undefined') {
  isSupported().then(supported => {
    if (supported) messaging = getMessaging(app);
  });
}

const getFirebaseMessaging = async () => {
    const supported = await isSupported();
    if (!supported) return null;
    return getMessaging(app);
};

export { app, messaging, getFirebaseMessaging };
