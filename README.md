# BloodLink

A machine-learning-enhanced emergency blood donation and donor alert system.

This is a from-scratch rebuild of the original BloodLink mini-project after the source files
were lost. It was reconstructed from two sources still available: the original project report
(describing a logistic-regression donor-scoring model and a keyword-based "GenAI" assistant) and
the original frontend, which was still live at its old hosting URL and was used as the reference
for page layout, navigation, and sample data.

The whole thing runs on **free, self-hostable tools** — no paid cloud account required:

- **Frontend**: React 18 + Vite + React Router + Tailwind CSS + Recharts
- **Backend**: Node.js (Express), file-based JSON persistence (`server/src/data/db.json`)
- **Auth**: Firebase Authentication (free tier) — gates the hospital staff console only; donor
  registration stays open to everyone
- **Notifications**: Firebase Cloud Messaging (free tier) — real browser/device push
  notifications to donors, with a logged fallback if a donor hasn't enabled push
- **ML**: A hand-implemented logistic regression classifier (sigmoid + 6 engineered features)
- **GenAI assistant**: A keyword-intent classifier + templated Chain-of-Thought responses over
  live data — no external LLM API calls, so no per-token cost

Firebase is **optional** — the app runs and every page works without it, just with the staff
console unprotected and alerts only logged (not pushed). Follow [Firebase setup](#firebase-setup)
below whenever you're ready to turn those on.

## Getting started

```bash
npm run install:all   # installs server/ and client/ dependencies
npm run dev            # starts the API on :4000 and the app on :5173
```

Then open **http://localhost:5173**.

- `/` — public landing page
- `/register` — donor sign-up (open to anyone, no login)
- `/staff-login` — hospital staff sign-in
- `/dashboard` — Command Hub (analytics, gamification, demand forecasting) — **staff only**
- `/requests` — Hospital Requests (create/view emergency requests, trigger matching + alerts) — **staff only**
- `/inventory` — Hospital Inventory (per-hospital blood stock levels) — **staff only**
- `/ml-insights` — AI Predictor (live donor scoring directory + model metadata) — **staff only**
- `/assistant` — GenAI Intercom (chat with the RAG assistant) — **staff only**

To reset all data back to the seeded demo dataset:

```bash
curl -X POST http://localhost:4000/api/reset
```

## Firebase setup

This is a one-time, ~10 minute setup on Firebase's free "Spark" plan. Nothing here requires
a credit card.

### 1. Create the project

1. Go to [console.firebase.google.com](https://console.firebase.google.com) and sign in with any
   Google account.
2. Click **Add project**, give it a name (e.g. `bloodlink`), and finish the wizard (you can
   disable Google Analytics — not needed).

### 2. Enable Authentication

1. In the left sidebar: **Build → Authentication → Get started**.
2. Under **Sign-in method**, enable **Email/Password**.
3. Under the **Users** tab, click **Add user** and create one login per hospital staff member
   (email + password) — this app doesn't have a public staff sign-up form on purpose.

### 3. Enable Cloud Messaging (push notifications)

1. **Build → Cloud Messaging** (it may already be enabled by default).
2. Go to **Project settings → Cloud Messaging** tab.
3. Under **Web configuration → Web Push certificates**, click **Generate key pair**. Copy this
   value — it's your `VITE_FIREBASE_VAPID_KEY`.

### 4. Register a Web App and get the client config

1. **Project settings → General → Your apps → Add app → Web** (the `</>` icon).
2. Give it any nickname, skip Firebase Hosting.
3. Copy the `firebaseConfig` object it shows you — you'll need each value below.

### 5. Fill in the client config

```bash
cp client/.env.example client/.env
```

Paste in the values from step 4 (`apiKey`, `authDomain`, `projectId`, `storageBucket`,
`messagingSenderId`, `appId`) and the VAPID key from step 3. These are all public client
identifiers, safe to expose in the browser — not secrets.

### 6. Get a service account key for the backend

1. **Project settings → Service accounts**.
2. Click **Generate new private key** — this downloads a JSON file.
3. Save it as `server/serviceAccountKey.json` (already gitignored — never commit this file).

```bash
cp server/.env.example server/.env
```

The default `.env` already points `FIREBASE_SERVICE_ACCOUNT_PATH` at that filename, so no
further edits are needed unless you saved it somewhere else.

### 7. Restart

```bash
npm run dev
```

The server log should print `[firebase] Admin SDK initialized`, the sidebar's Firebase warning
banner should disappear, and `/staff-login` will work with the users you created in step 2.
Donors who allow browser notifications on the registration page will now receive real push
alerts when a hospital logs a matching emergency request.

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
    middleware/
      requireAuth.js               # Verifies staff Firebase ID tokens
    routes/
      donors.js         # donor registration + FCM token registration
      requests.js         # create request + match donors + send alerts (staff-only writes)
      inventory.js          # per-hospital stock CRUD (staff-only writes)
      assist.js                # GenAI assistant endpoint
      score.js                   # ML scoring endpoint
      dashboard.js                  # aggregate analytics for the Command Hub
      hospitals.js                    # hospital list
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
  public/
    firebase-messaging-sw.js              # background push service worker
```

## What's protected vs. open

| Action | Requires staff login? |
|---|---|
| View dashboard/requests/inventory/ML insights/assistant | Yes |
| Create a request, ping alerts, mark fulfilled, edit inventory | Yes |
| Register as a donor | No — open to the public |
| A donor confirming availability from their own alert | No |

If Firebase isn't configured yet, all of the above stays **open** (with a clear warning banner)
so the app remains testable during setup — see [Firebase setup](#firebase-setup) to lock it down.

## Notes / things worth double-checking with the project owner

- **Seed data** (donors, hospitals, requests) was reconstructed by reading the still-live old
  frontend's mock data plus reasonable filler where exact values weren't visible (e.g. blood
  groups on 4 of the 7 seeded requests, and donor GPS coordinates). It's a close but not
  byte-exact match to the original demo dataset.
- **Push notifications, not SMS.** Real SMS to a phone number costs money on every provider
  (Twilio, etc.) — there's no free way to do that. Firebase Cloud Messaging push notifications
  are the free equivalent, but they require the donor to have opened the site once and granted
  notification permission.
- **Demand Forecasting** numbers on the dashboard are an illustrative static table (labelled as
  such in `server/src/routes/dashboard.js`) — there isn't nearly enough historical data here to
  train a real forecasting model.
