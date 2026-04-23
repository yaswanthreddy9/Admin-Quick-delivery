importScripts('https://www.gstatic.com/firebasejs/9.23.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.23.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyD7fBeJ4cV82_7OaWltZ8DDvEr-Y9B_mZA",
  authDomain: "chicken-delivery-app-9e4f6.firebaseapp.com",
  projectId: "chicken-delivery-app-9e4f6",
  messagingSenderId: "471866860980",
  appId: "1:471866860980:web:5ad0bd8cea53f9637ffee1"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage(function(payload) {
  self.registration.showNotification("New Order 🍗", {
    body: payload.notification?.body || "New order received!",
    icon: "https://cdn-icons-png.flaticon.com/512/1046/1046784.png"
  });
});
