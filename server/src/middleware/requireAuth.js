import { adminAuth, firebaseEnabled } from "../firebaseAdmin.js";

// Verifies a Firebase ID token on `Authorization: Bearer <token>`. If Firebase Admin isn't
// configured yet (no service account), the route is left open with a console warning so the
// app stays usable during local setup - see README.md -> Firebase setup.
export async function requireAuth(req, res, next) {
  if (!firebaseEnabled) {
    console.warn(`[auth] ${req.method} ${req.originalUrl} allowed WITHOUT verification - Firebase Admin not configured.`);
    return next();
  }

  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) {
    return res.status(401).json({ error: "Missing Authorization: Bearer <idToken> header" });
  }

  try {
    req.staffUser = await adminAuth.verifyIdToken(token);
    next();
  } catch (err) {
    res.status(401).json({ error: "Invalid or expired session - please sign in again." });
  }
}
