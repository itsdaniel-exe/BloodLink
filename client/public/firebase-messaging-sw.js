// Firebase config isn't secret (it's a public client identifier, not a credential), so it's
// safe to pass through the registration URL's query string - service workers can't read
// import.meta.env, and this avoids hand-duplicating the config in two places.
importScripts("https://www.gstatic.com/firebasejs/10.14.1/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.14.1/firebase-messaging-compat.js");

const params = new URL(location.href).searchParams;

firebase.initializeApp({
  apiKey: params.get("apiKey"),
  authDomain: params.get("authDomain"),
  projectId: params.get("projectId"),
  storageBucket: params.get("storageBucket"),
  messagingSenderId: params.get("messagingSenderId"),
  appId: params.get("appId"),
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const { title, body } = payload.notification || {};
  self.registration.showNotification(title || "🩸 BloodLink Alert", {
    body: body || "A hospital needs your blood group.",
    icon: "/favicon.svg",
  });
});
