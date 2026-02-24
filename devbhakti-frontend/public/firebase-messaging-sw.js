// Service Worker for Firebase Cloud Messaging
// Ye file PUBLIC folder me honi chahiye - browser directly access karta hai ise
// Background notifications (jab tab band ho) ye file handle kargi

importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyD6r2nCCpACMxmaIC6u1GEz7ICtz-LYt4M",
  authDomain: "devbhakti-c7132.firebaseapp.com",
  projectId: "devbhakti-c7132",
  storageBucket: "devbhakti-c7132.firebasestorage.app",
  messagingSenderId: "232153149807",
  appId: "1:232153149807:web:80d0fd70a96f83e8fd389a",
  measurementId: "G-2SY4DDRS3T"
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
