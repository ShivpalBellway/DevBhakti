import admin from 'firebase-admin';
import path from 'path';
import fs from 'fs';
import { prisma } from '../lib/prisma';

// Initialize Firebase Admin only once
if (!admin.apps.length) {
  // Check multiple possible locations for the service account file
  const possiblePaths = [
    path.join(process.cwd(), '../devbhakti-c7132-firebase-adminsdk-fbsvc-01c8d38efd.json'), // Root level
    path.join(process.cwd(), 'devbhakti-c7132-firebase-adminsdk-fbsvc-01c8d38efd.json'),
    path.join(__dirname, 'firebase-service-account.json'),
    'C:\\Users\\LENOVO\\OneDrive\\Desktop\\DevBhakti\\devbhakti-c7132-firebase-adminsdk-fbsvc-01c8d38efd.json' // Absolute path
  ];
  
  let initialized = false;
  for (const serviceAccountPath of possiblePaths) {
    if (fs.existsSync(serviceAccountPath)) {
      try {
        const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
        admin.initializeApp({
          credential: admin.credential.cert(serviceAccount),
        });
        console.log(`✅ Firebase Admin SDK initialized using: ${path.basename(serviceAccountPath)}`);
        initialized = true;
        break;
      } catch (err: any) {
        console.error(`❌ Error parsing Firebase service account at ${serviceAccountPath}:`, err.message);
      }
    }
  }

  if (!initialized) {
    console.warn('⚠️ Firebase service account file not found in any expected location, FCM disabled');
    console.log('Tested paths:', possiblePaths);
  }
}

export interface NotificationPayload {
  title: string;
  body: string;
  data?: Record<string, any>;
  imageUrl?: string;
}

/**
 * Save notification to DB and send to all active tokens of a user
 */
export const notifyUser = async (
  userId: string,
  userType: 'devotee' | 'admin' | 'temple_admin' | 'seller',
  payload: NotificationPayload
): Promise<void> => {
  try {
    // 1. Save to Database for Bell Icon
    await prisma.notification.create({
      data: {
        userId,
        userType,
        title: payload.title,
        body: payload.body,
        data: payload.data || {},
      },
    });

    // 2. Find all active FCM tokens for this user
    console.log(`🔍 Finding tokens for ${userType} ID: ${userId}`);
    const tokens = await prisma.fCMToken.findMany({
      where: { userId, userType },
      select: { token: true },
    });

    console.log(`📡 Found ${tokens.length} tokens for ${userType} ${userId}`);

    if (tokens.length === 0) {
      console.log(`ℹ️ No FCM tokens found for ${userType} ${userId}, saved to DB only.`);
      return;
    }

    // 3. Send FCM Push
    const fcmTokens = tokens.map((t) => t.token);
    await sendNotificationToMultiple(fcmTokens, {
        ...payload,
        data: Object.fromEntries(
            Object.entries(payload.data || {}).map(([k, v]) => [k, String(v)])
        ) as Record<string, string>
    });

  } catch (error: any) {
    console.error('❌ notifyUser Error:', error.message);
  }
};

/**
 * Send notification to a single FCM token (device/browser)
 */
export const sendNotificationToToken = async (
// ... (rest of file)
  fcmToken: string,
  payload: NotificationPayload
): Promise<void> => {
  if (!admin.apps.length) return;

  try {
    await admin.messaging().send({
      token: fcmToken,
      notification: {
        title: payload.title,
        body: payload.body,
        imageUrl: payload.imageUrl,
      },
      data: payload.data || {},
      webpush: {
        notification: {
          title: payload.title,
          body: payload.body,
          icon: '/logo.png',
          badge: '/logo.png',
        },
        fcmOptions: {
          link: payload.data?.link || '/',
        },
      },
    });
    console.log(`✅ Notification sent to token: ${fcmToken.substring(0, 20)}...`);
  } catch (error: any) {
    console.error('❌ FCM send error:', error.message);
  }
};

/**
 * Send notification to multiple FCM tokens
 */
export const sendNotificationToMultiple = async (
  fcmTokens: string[],
  payload: NotificationPayload
): Promise<void> => {
  if (!admin.apps.length || fcmTokens.length === 0) {
    console.log(`⚠️ Skip FCM: Admin Init: ${admin.apps.length > 0}, Tokens: ${fcmTokens.length}`);
    return;
  }

  console.log(`📡 Sending FCM to ${fcmTokens.length} tokens...`);

  const messages = fcmTokens.map((token) => ({
    token,
    notification: {
      title: payload.title,
      body: payload.body,
      imageUrl: payload.imageUrl,
    },
    data: payload.data || {},
    webpush: {
      notification: {
        title: payload.title,
        body: payload.body,
        icon: '/logo.png',
        badge: '/logo.png',
      },
      fcmOptions: {
        link: payload.data?.link || '/',
      },
    },
  }));

  try {
    const response = await admin.messaging().sendEach(messages);
    console.log(`✅ FCM: ${response.successCount} sent, ${response.failureCount} failed`);
    
    if (response.failureCount > 0) {
      const tokensToDelete: string[] = [];
      
      response.responses.forEach((res, idx) => {
        if (!res.success) {
          const errorCode = res.error?.code;
          console.error(`❌ FCM Failure [${idx}] for token ${messages[idx].token.substring(0, 10)}...:`, res.error);
          
          // Specific error codes that mean the token is no longer valid
          if (
            errorCode === 'messaging/registration-token-not-registered' || 
            errorCode === 'messaging/invalid-registration-token' ||
            errorCode === 'messaging/third-party-auth-error' // Mismatched or stale browser subscription
          ) {
             console.warn(`🗑️ Deleting stale/invalid token from DB: ${messages[idx].token.substring(0, 15)}...`);
             tokensToDelete.push(messages[idx].token);
          }
        }
      });

      // DB se invalidate tokens saaf karo
      if (tokensToDelete.length > 0) {
        await prisma.fCMToken.deleteMany({
          where: { token: { in: tokensToDelete } }
        }).catch(err => console.error("Error deleting tokens:", err));
      }
    }
  } catch (error: any) {
    console.error('❌ FCM bulk send error:', error.message);
  }
};

/**
 * Send notification to a topic (e.g., 'all-users', 'temple-123', 'admins')
 */
export const sendNotificationToTopic = async (
  topic: string,
  payload: NotificationPayload
): Promise<void> => {
  if (!admin.apps.length) return;

  try {
    await admin.messaging().send({
      topic,
      notification: {
        title: payload.title,
        body: payload.body,
        imageUrl: payload.imageUrl,
      },
      data: payload.data || {},
      webpush: {
        notification: {
          title: payload.title,
          body: payload.body,
          icon: '/logo.png',
          badge: '/logo.png',
        },
        fcmOptions: {
          link: payload.data?.link || '/',
        },
      },
    });
    console.log(`✅ Notification sent to topic: ${topic}`);
  } catch (error: any) {
    console.error('❌ FCM topic send error:', error.message);
  }
};

/**
 * Notify all system admins
 */
export const notifyAdmins = async (payload: NotificationPayload): Promise<void> => {
  try {
    // 1. Find all users with admin role
    const admins = await prisma.user.findMany({
      where: { role: 'ADMIN' },
      select: { id: true }
    });

    if (admins.length === 0) return;

    // 2. Loop and notify each (notifying each ensures DB record for each admin's bell icon)
    for (const adminUser of admins) {
      await notifyUser(adminUser.id, 'admin', payload);
    }
  } catch (error: any) {
    console.error('❌ notifyAdmins Error:', error.message);
  }
};

export default admin;
