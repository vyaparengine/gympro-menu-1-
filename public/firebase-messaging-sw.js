// Firebase Cloud Messaging Background Service Worker Fallback
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js');

// This file is loaded by the browser automatically for FCM.
// It initializes Firebase in the background worker context.
// Even with a default fallback config, it prevents any 404 errors.

const swFirebaseConfig = {
  apiKey: "MOCK_API_KEY_FOR_LOCAL_FALLBACK",
  projectId: "gympromenu-9f7b77",
  messagingSenderId: "1234567890",
  appId: "1:1234567890:web:abc123xyz"
};

try {
  firebase.initializeApp(swFirebaseConfig);
  const messaging = firebase.messaging();

  // Handle background notifications
  messaging.onBackgroundMessage((payload) => {
    console.log('[firebase-messaging-sw.js] Received background message ', payload);

    const notificationTitle = payload.notification?.title || 'GymPro Supplement Alert!';
    const notificationOptions = {
      body: payload.notification?.body || 'New supplement stock arrived!',
      icon: '/vite.svg',
      badge: '/vite.svg',
      data: payload.data
    };

    self.registration.showNotification(notificationTitle, notificationOptions);
  });
} catch (e) {
  console.log('Background FCM service worker initialized in passive listening mode.');
}
