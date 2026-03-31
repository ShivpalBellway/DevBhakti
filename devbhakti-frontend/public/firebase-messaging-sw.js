// Service Worker for Firebase Cloud Messaging
// Ye file PUBLIC folder me honi chahiye - browser directly access karta hai ise
// Background notifications (jab tab band ho) ye file handle kargi

importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyAelmoHc-MUT8VczeD9lHces31Ts_nYWrk",
  authDomain: "devbhakti-d4c7f.firebaseapp.com",
  projectId: "devbhakti-d4c7f",
  storageBucket: "devbhakti-d4c7f.firebasestorage.app",
  messagingSenderId: "647401818026",
  appId: "1:647401818026:web:01c72ddad0b478432d4dd3",
  measurementId: "G-BNXBR7MYXK"
});

const messaging = firebase.messaging();

// Background message handler - jab browser tab band ho tab bhi notification aaye
messaging.onBackgroundMessage((payload) => {
  console.log('[SW] Background message received:', payload);

  const notificationTitle = payload.notification?.title || 'DevBhakti';
  const notificationOptions = {
    body: payload.notification?.body || '',
    icon: '/logo.png',
    badge: '/logo.png',
    data: payload.data || {},
    tag: payload.data?.type || 'devbhakti-notification',
    renotify: true,
    requireInteraction: true,
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

// Notification click handler - notification pe click karne pe kaha jaana hai
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const link = event.notification.data?.link || '/';
  event.waitUntil(
    clients.openWindow(link)
  );
});
