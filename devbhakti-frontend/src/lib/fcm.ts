import { getToken, onMessage, Messaging } from 'firebase/messaging';
import { getFirebaseMessaging } from './firebase';
import axios from 'axios';

const VAPID_KEY = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;

/**
 * Request notification permission and get FCM token
 */
export const requestNotificationPermission = async (): Promise<string | null> => {
  try {
    console.log('🔔 Requesting notification permission...');
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      console.warn('❌ Notification permission denied');
      return null;
    }

    const messaging = await getFirebaseMessaging();
    if (!messaging) {
      console.error('❌ FCM Messaging not supported or failed to init');
      return null;
    }

    if (!VAPID_KEY) {
      console.error('❌ NEXT_PUBLIC_FIREBASE_VAPID_KEY is missing in .env');
      return null;
    }

    console.log('📡 Requesting FCM token...');
    
    const token = await getToken(messaging, {
      vapidKey: VAPID_KEY,
    });

    if (token) {
      console.log('✅ FCM Token generated:', token.substring(0, 15) + '...');
      return token;
    } else {
      console.warn('⚠️ No FCM token returned');
      return null;
    }
  } catch (error) {
    console.error('❌ FCM token error details:', error);
    // Log the config being used (be careful with sensitive data, but these are public client bits)
    console.log('Current Config Senders ID:', process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID);
    return null;
  }
};

/**
 * Register FCM token with our backend
 */
export const registerFCMToken = async (
  token: string,
  userId: string,
  userType: 'admin' | 'temple_admin' | 'seller' | 'devotee'
): Promise<void> => {
  try {
    await axios.post('/api/notifications/register-token', {
      token,
      userId,
      userType,
    });
    console.log('✅ FCM token registered with backend');
  } catch (error) {
    console.error('Failed to register FCM token:', error);
  }
};

/**
 * Remove FCM token from backend (on logout)
 */
export const removeFCMToken = async (token: string): Promise<void> => {
  try {
    await axios.delete('/api/notifications/remove-token', {
      data: { token },
    });
    console.log('✅ FCM token removed from backend');
  } catch (error) {
    console.error('Failed to remove FCM token:', error);
  }
};

/**
 * Listen to foreground messages
 * Call onReceive callback when a message arrives
 */
export const listenToForegroundMessages = async (
  onReceive: (payload: { title: string; body: string; data?: any }) => void
): Promise<(() => void) | null> => {
  const messaging = await getFirebaseMessaging();
  if (!messaging) return null;

  const unsubscribe = onMessage(messaging as Messaging, (payload) => {
    const title = payload.notification?.title || 'DevBhakti';
    const body = payload.notification?.body || '';
    const data = payload.data;
    onReceive({ title, body, data });
  });

  return unsubscribe;
};
