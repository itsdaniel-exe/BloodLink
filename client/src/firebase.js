// Optional Firebase client integration (Authentication + Cloud Messaging). The app still
// renders without it configured - staff login and push notifications just show a clear
// "not configured yet" state instead of crashing. See README.md -> Firebase setup.
import { initializeApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getMessaging, isSupported } from "firebase/messaging";

const config = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

export const vapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY || "";

export const firebaseConfigured = Boolean(config.apiKey && config.projectId && config.appId);

const app = firebaseConfigured ? (getApps()[0] ?? initializeApp(config)) : null;

export const auth = app ? getAuth(app) : null;

export async function getMessagingIfSupported() {
  if (!app) return null;
  try {
    if (!(await isSupported())) return null;
    return getMessaging(app);
  } catch {
    return null;
  }
}

export { config as firebaseConfig };
