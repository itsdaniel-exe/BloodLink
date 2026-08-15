// Firebase Cloud Messaging via the HTTP v1 API.
//
// firebase-admin's `messaging().send()` isn't available on Workers, so this does what the SDK
// does internally: mint a service-account JWT, sign it with Web Crypto (RS256), exchange it
// for a short-lived OAuth2 access token, then POST to the FCM v1 send endpoint.
//
// The access token is memoised per isolate, so broadcasting to 25 donors mints one token
// rather than 25.

let cachedToken = null; // { token, expiresAt } - per-isolate, survives across requests

function getServiceAccount(env) {
  if (!env.FIREBASE_SERVICE_ACCOUNT_JSON) return null;
  try {
    return JSON.parse(env.FIREBASE_SERVICE_ACCOUNT_JSON);
  } catch {
    console.warn("[push] FIREBASE_SERVICE_ACCOUNT_JSON is set but is not valid JSON - ignoring.");
    return null;
  }
}

export function isPushConfigured(env) {
  return getServiceAccount(env) !== null;
}

function base64UrlFromBytes(bytes) {
  let binary = "";
  const view = new Uint8Array(bytes);
  for (let i = 0; i < view.length; i++) binary += String.fromCharCode(view[i]);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function base64UrlFromString(str) {
  return base64UrlFromBytes(new TextEncoder().encode(str));
}

// The service account's private_key is PEM-wrapped PKCS#8; Web Crypto wants raw DER bytes.
function pemToPkcs8Bytes(pem) {
  const b64 = pem
    .replace("-----BEGIN PRIVATE KEY-----", "")
    .replace("-----END PRIVATE KEY-----", "")
    .replace(/\s/g, "");
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

async function mintAccessToken(sa) {
  const now = Math.floor(Date.now() / 1000);
  const header = { alg: "RS256", typ: "JWT" };
  const claims = {
    iss: sa.client_email,
    scope: "https://www.googleapis.com/auth/firebase.messaging",
    aud: "https://oauth2.googleapis.com/token",
    iat: now,
    exp: now + 3600,
  };

  const unsigned = `${base64UrlFromString(JSON.stringify(header))}.${base64UrlFromString(JSON.stringify(claims))}`;

  const key = await crypto.subtle.importKey(
    "pkcs8",
    pemToPkcs8Bytes(sa.private_key),
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign("RSASSA-PKCS1-v1_5", key, new TextEncoder().encode(unsigned));
  const assertion = `${unsigned}.${base64UrlFromBytes(signature)}`;

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion,
    }),
  });

  if (!res.ok) {
    throw new Error(`OAuth token exchange failed (${res.status}): ${await res.text()}`);
  }
  const data = await res.json();
  // Expire a minute early so an in-flight broadcast can't use a token that dies mid-loop.
  return { token: data.access_token, expiresAt: Date.now() + (data.expires_in - 60) * 1000 };
}

async function getAccessToken(sa) {
  if (cachedToken && cachedToken.expiresAt > Date.now()) return cachedToken.token;
  cachedToken = await mintAccessToken(sa);
  return cachedToken.token;
}

// Sends a real push if the donor has a registered device token and Firebase is configured;
// otherwise a no-op so the caller still writes its alert-log fallback record.
export async function sendPush(env, donor, { title, body, link = "/" }) {
  const sa = getServiceAccount(env);
  if (!sa || !donor?.fcmToken) return { sent: false };

  try {
    const accessToken = await getAccessToken(sa);
    const res = await fetch(`https://fcm.googleapis.com/v1/projects/${sa.project_id}/messages:send`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message: {
          token: donor.fcmToken,
          notification: { title, body },
          webpush: {
            fcm_options: { link },
            notification: { icon: "/favicon.svg" },
          },
        },
      }),
    });

    if (!res.ok) {
      const detail = await res.text();
      // A stale/unregistered device token is expected over time - log it, don't blow up.
      console.warn(`[push] FCM rejected send for donor ${donor.id} (${res.status}): ${detail}`);
      return { sent: false, error: detail };
    }
    return { sent: true };
  } catch (err) {
    console.warn(`[push] Failed to notify donor ${donor.id}: ${err.message}`);
    return { sent: false, error: err.message };
  }
}
