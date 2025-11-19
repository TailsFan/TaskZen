// This file should be in the 'public' directory of your Next.js project.

// Check if Firebase is already initialized
if (typeof self.firebase === 'undefined' || !self.firebase.apps.length) {
    // Firebase App is not yet initialized, import the scripts
    self.importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js');
    self.importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-messaging-compat.js');
    
    // IMPORTANT: Replace this with your project's Firebase config
    const firebaseConfig = {
      "projectId": "studio-6063305470-7b4b8",
      "appId": "1:826068432435:web:fcf9169ce0dcedf3fd9546",
      "apiKey": "AIzaSyCUqXrstdjrVFpK2ZqQYii9t-lROHpEQBQ",
      "authDomain": "studio-6063305470-7b4b8.firebaseapp.com",
      "measurementId": "",
      "messagingSenderId": "826068432435",
      "storageBucket": "studio-6063305470-7b4b8.appspot.com"
    };

    self.firebase.initializeApp(firebaseConfig);
}

const messaging = self.firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);

  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: payload.notification.icon || '/icon-192x192.png' // default icon
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
