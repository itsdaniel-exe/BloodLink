// Optional Firebase Admin integration. The app runs fine without it (routes just log a
// warning and stay unprotected) so you can develop locally before finishing Firebase setup.
// See README.md -> "Firebase setup" for how to generate the service account key.
import fs from "node:fs";
import admin from "firebase-admin";

let app = null;

function loadServiceAccount() {
  const inlineJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (inlineJson) {
    try {
      return JSON.parse(inlineJson);
    } catch {
      console.warn("[firebase] FIREBASE_SERVICE_ACCOUNT_JSON is set but is not valid JSON - ignoring.");
    }
  }

  const path = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;
  if (path && fs.existsSync(path)) {
    return JSON.parse(fs.readFileSync(path, "utf-8"));
  }

  return null;
}

const serviceAccount = loadServiceAccount();

if (serviceAccount) {
  app = admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
  console.log("[firebase] Admin SDK initialized - auth verification and push notifications are live.");
} else {
  console.warn(
    "[firebase] No service account configured (FIREBASE_SERVICE_ACCOUNT_PATH / FIREBASE_SERVICE_ACCOUNT_JSON). " +
      "Auth-protected routes will run UNPROTECTED and push notifications will be skipped until you finish Firebase setup - see README.md."
  );
}

export const firebaseEnabled = Boolean(app);
export const adminAuth = app ? admin.auth(app) : null;
export const adminMessaging = app ? admin.messaging(app) : null;
