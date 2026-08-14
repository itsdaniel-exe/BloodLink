# Setup & internals

Internal notes — Firebase configuration, project structure, and what's protected. Not needed
to browse the code or run it locally with defaults; only needed to turn on real staff login and
push notifications.

## Getting started

```bash
npm run install:all   # installs server/ and client/ dependencies
npm run dev            # starts the API on :4000 and the app on :5173
```

Then open **http://localhost:5173**. The app works fully out of the box — the staff console just
runs unprotected (with a warning banner) and alerts are logged instead of pushed until Firebase
is configured below.

To reset all data back to the seeded demo dataset:

```bash
curl -X POST http://localhost:4000/api/reset
```

## Firebase setup

One-time, ~10 minutes, free "Spark" plan — no credit card required.

### 1. Create the project

1. Go to [console.firebase.google.com](https://console.firebase.google.com) and sign in.
2. **Add project**, give it a name (e.g. `bloodlink`), skip Google Analytics.

### 2. Enable Authentication

1. **Build → Authentication → Get started**.
2. Under **Sign-in method**, enable **Email/Password**.
3. Under **Users**, click **Add user** and create one login per staff member — there's no
   public staff sign-up form on purpose.

### 3. Enable Cloud Messaging (push notifications)

1. **Project settings → Cloud Messaging** tab.
2. Under **Web configuration → Web Push certificates**, click **Generate key pair**. This is
   `VITE_FIREBASE_VAPID_KEY`.

### 4. Register a Web App and get the client config

1. **Project settings → General → Your apps → Add app → Web** (`</>` icon).
2. Skip Firebase Hosting.
3. Copy the `firebaseConfig` object it shows you.

### 5. Fill in the client config

```bash
cp client/.env.example client/.env
```

Paste in `apiKey`, `authDomain`, `projectId`, `storageBucket`, `messagingSenderId`, `appId`,
plus the VAPID key. These are public client identifiers, safe to expose in the browser.

### 6. Get a service account key for the backend

1. **Project settings → Service accounts → Generate new private key** (downloads a JSON file).
2. Save it as `server/serviceAccountKey.json` (gitignored — never commit this).

```bash
cp server/.env.example server/.env
```

The default already points `FIREBASE_SERVICE_ACCOUNT_PATH` at that filename.

### 7. Restart

```bash
npm run dev
```

Server log should print `[firebase] Admin SDK initialized`; the sidebar warning disappears;
`/staff-login` works with the users from step 2; donors who allow browser notifications get
real push alerts.

## Project structure

```
server/
  src/
    index.js          # Express app + route mounting
    db.js               # JSON-file persistence (data/seed.json -> data/db.json)
    ml.js                 # Logistic regression scoring engine
    assistant.js           # RAG-style intent classifier + response templates
    firebaseAdmin.js         # Optional Firebase Admin init (auth verify + push)
    push.js                    # Sends FCM push notifications to donors
    utils.js                     # Haversine distance, blood compatibility, rarity, eligibility
    middleware/requireAuth.js      # Verifies staff Firebase ID tokens
    routes/                          # donors, requests, inventory, assist, score, dashboard, hospitals
    data/
      seed.json                          # source-of-truth demo dataset
      db.json                              # runtime state (gitignored, regenerated from seed.json)
client/
  src/
    pages/                      # Landing, RegisterDonor, StaffLogin, Dashboard, Requests, Inventory, MlInsights, Assistant
    components/                  # Sidebar, Panel, StatCard, Badges, ProtectedRoute
    context/AuthContext.jsx        # Firebase auth state for the whole app
    firebase.js                       # Firebase client init (auth + messaging)
    push.js                             # Requests notification permission + FCM token
    api.js                                # fetch wrapper, attaches staff auth token when needed
  public/firebase-messaging-sw.js         # background push service worker
```

## What's protected vs. open

| Action | Requires staff login? |
|---|---|
| View dashboard/requests/inventory/ML insights/assistant | Yes |
| Create a request, ping alerts, mark fulfilled, edit inventory | Yes |
| Register as a donor | No — open to the public |
| A donor confirming availability from their own alert | No |

If Firebase isn't configured yet, all of the above stays **open** with a visible warning
banner, so the app remains testable during setup.

## Things worth double-checking

- **Seed data** (donors, hospitals, requests) was reconstructed from the still-live legacy
  frontend's mock data plus reasonable filler where exact values weren't visible (blood groups
  on 4 of 7 seeded requests, donor GPS coordinates) — close but not byte-exact to the original.
- **Push, not SMS.** Real SMS costs money on every provider; Firebase Cloud Messaging push is
  the free equivalent, but requires the donor to have opened the site once and granted
  notification permission.
- **Demand Forecasting** numbers on the dashboard are an illustrative static table (labelled as
  such in `server/src/routes/dashboard.js`) — not enough historical data here for a real model.
