import { getToken } from "firebase/messaging";
import { firebaseConfig, firebaseConfigured, getMessagingIfSupported, vapidKey } from "./firebase.js";

// Requests browser notification permission, registers the FCM service worker, and returns a
// device token - or null if push isn't configured/supported/permitted. Safe to call even when
// Firebase isn't set up yet; it just resolves to null instead of throwing.
export async function requestPushToken() {
  if (!firebaseConfigured || !vapidKey) return null;
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) return null;

  const messaging = await getMessagingIfSupported();
  if (!messaging) return null;

  const permission = await Notification.requestPermission();
  if (permission !== "granted") return null;

  const params = new URLSearchParams(firebaseConfig).toString();
  const registration = await navigator.serviceWorker.register(`/firebase-messaging-sw.js?${params}`);

  try {
    return await getToken(messaging, { vapidKey, serviceWorkerRegistration: registration });
  } catch (err) {
    console.warn("Push token request failed:", err.message);
    return null;
  }
}
