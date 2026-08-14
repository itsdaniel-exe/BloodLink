// One-off script: creates a test staff user via the Firebase Admin SDK so Claude (or you) can
// sign in and test the protected console without touching the Firebase Console UI by hand.
// Run: node scripts/create-test-user.mjs
import "dotenv/config";
import { adminAuth, firebaseEnabled } from "../src/firebaseAdmin.js";

if (!firebaseEnabled) {
  console.error("Firebase Admin isn't configured (check server/.env). Aborting.");
  process.exit(1);
}

const email = "test-admin@bloodlink.dev";
const password = "BloodLinkTest123!";

try {
  const existing = await adminAuth.getUserByEmail(email).catch(() => null);
  if (existing) {
    await adminAuth.updateUser(existing.uid, { password });
    console.log(`Updated existing test user: ${email}`);
  } else {
    await adminAuth.createUser({ email, password, emailVerified: true });
    console.log(`Created test user: ${email}`);
  }
  console.log(`Password: ${password}`);
} catch (err) {
  console.error("Failed to create test user:", err.message);
  process.exit(1);
}
