import { adminMessaging, firebaseEnabled } from "./firebaseAdmin.js";

// Sends a real Firebase Cloud Messaging push notification if a donor has registered a device
// token and Firebase Admin is configured; otherwise this is a no-op and the caller should keep
// its existing simulated alert log entry as the fallback record.
export async function sendPush(donor, { title, body, link = "/" }) {
  if (!firebaseEnabled || !donor?.fcmToken) return { sent: false };

  try {
    await adminMessaging.send({
      token: donor.fcmToken,
      notification: { title, body },
      webpush: {
        fcmOptions: { link },
        notification: { icon: "/favicon.svg" },
      },
    });
    return { sent: true };
  } catch (err) {
    console.warn(`[push] Failed to notify donor ${donor.id}: ${err.message}`);
    return { sent: false, error: err.message };
  }
}
