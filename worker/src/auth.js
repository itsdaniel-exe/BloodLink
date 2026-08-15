// Staff authentication.
//
// The Express version used firebase-admin, which can't run on Workers (it depends on Node
// APIs and gRPC that nodejs_compat doesn't cover). This uses
// `firebase-auth-cloudflare-workers` instead - a zero-dependency implementation built on the
// Web Crypto API that verifies the exact same Firebase ID tokens, with Google's public JWKs
// cached in KV between requests.
import { Auth, WorkersKVStoreSingle } from "firebase-auth-cloudflare-workers";

export function isAuthConfigured(env) {
  return Boolean(env.FIREBASE_PROJECT_ID && env.JWK_CACHE);
}

function getAuth(env) {
  return Auth.getOrInitialize(
    env.FIREBASE_PROJECT_ID,
    WorkersKVStoreSingle.getOrInitialize("firebase-public-jwk", env.JWK_CACHE)
  );
}

// Hono middleware. Mirrors the Express `requireAuth`: if Firebase isn't configured the route
// is left open with a warning (so a fresh clone is still usable), otherwise a valid
// `Authorization: Bearer <idToken>` is required.
export async function requireAuth(c, next) {
  const env = c.env;

  if (!isAuthConfigured(env)) {
    console.warn(`[auth] ${c.req.method} ${c.req.path} allowed WITHOUT verification - Firebase not configured.`);
    return next();
  }

  const header = c.req.header("Authorization") || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) {
    return c.json({ error: "Missing Authorization: Bearer <idToken> header" }, 401);
  }

  try {
    c.set("staffUser", await getAuth(env).verifyIdToken(token));
    return next();
  } catch {
    return c.json({ error: "Invalid or expired session - please sign in again." }, 401);
  }
}
