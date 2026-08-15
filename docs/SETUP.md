# Setup & internals

Internal notes — architecture, local development, Firebase configuration, and deploy steps.

## Architecture

| Layer | What runs it |
|---|---|
| Frontend | React + Vite, hosted on Firebase Hosting |
| API | Cloudflare Workers + Hono |
| Database | Cloudflare D1 (SQLite at the edge) |
| Staff auth | Firebase Authentication, verified in the Worker via `firebase-auth-cloudflare-workers` |
| Push notifications | Firebase Cloud Messaging HTTP v1 API |
| ML scoring | Pure JS logistic regression, runs inside the Worker |

Live URLs:
- Frontend — https://bloodlink-18246.web.app
- API — https://bloodlink-api.daniwork300.workers.dev

### Why Workers rather than a container host

The API originally ran as an Express app on Render's free tier, which spins containers down
after ~15 minutes idle. Measured cold start was **21 seconds** for the first visitor. On
Workers the same endpoints respond in **~0.1s** with no spin-down, because V8 isolates don't
have a container to boot.

That migration is why the backend isn't plain Node: `firebase-admin` can't run on Workers (it
depends on Node APIs and gRPC that `nodejs_compat` doesn't cover), so the two Firebase
integrations are reimplemented on Web Standard APIs:

- **Auth** — `src/auth.js` verifies the same Firebase ID tokens using
  `firebase-auth-cloudflare-workers`, with Google's public JWKs cached in a KV namespace.
- **Push** — `src/push.js` does what the Admin SDK does internally: signs a service-account
  JWT with Web Crypto (RS256), exchanges it for an OAuth2 access token, and POSTs to the FCM
  HTTP v1 endpoint. The access token is memoised per isolate so a 25-donor broadcast mints
  one token, not 25.

The data layer also changed shape. The Express version held the whole dataset in memory in a
long-lived process; Workers is stateless per request, so `loadState()` pulls it in one batched
D1 round trip and returns the same object shape the old in-memory store did — which is why
`ml.js` and `assistant.js` needed only signature changes, not rewrites.

## Local development

```bash
npm run install:all     # installs worker/ and client/ dependencies
npm run seed:local      # creates + seeds the local D1 database
npm run dev             # Worker on :8787, frontend on :5173
```

Open **http://localhost:5173**.

For local pushes and auth against the real Firebase project, create `worker/.dev.vars`:

```
FIREBASE_SERVICE_ACCOUNT_JSON={"type":"service_account",...}
```

(Everything still runs without it — auth-protected routes just stay open with a warning, and
pushes are logged rather than sent.)

To reset the demo dataset:

```bash
curl -X POST http://127.0.0.1:8787/api/reset          # local
curl -X POST https://bloodlink-api.daniwork300.workers.dev/api/reset   # production
```

## Deploying

```bash
npm run deploy:api      # wrangler deploy
npm run deploy:web      # vite build + firebase hosting deploy
```

Both are non-interactive given existing credentials (`wrangler login` / a Firebase service
account). Unlike the old Render setup, there's no dashboard button to press — `deploy:api`
publishes immediately.

## Firebase setup

Only needed if recreating the project from scratch. Free "Spark" plan, no credit card.

1. **Create the project** — [console.firebase.google.com](https://console.firebase.google.com) → Add project.
2. **Authentication** → Get started → enable **Email/Password**. Add staff users under the
   **Users** tab (there's no public staff sign-up by design).
3. **Cloud Messaging** → Project settings → Cloud Messaging → **Web Push certificates** →
   Generate key pair. That value is `VITE_FIREBASE_VAPID_KEY`.
4. **Register a Web App** → Project settings → General → Add app → Web. Copy the
   `firebaseConfig` values into `client/.env` (see `client/.env.example`). These are public
   client identifiers, not secrets.
5. **Service account** → Project settings → Service accounts → Generate new private key.
   Store it as the Worker secret:
   ```bash
   cd worker && wrangler secret put FIREBASE_SERVICE_ACCOUNT_JSON < path/to/key.json
   ```
6. Set `FIREBASE_PROJECT_ID` in `worker/wrangler.jsonc` `vars`.

### Creating a test staff account

Staff accounts are created in the Firebase console, or via the Admin SDK. There's a test
account used during development:

```
test-admin@bloodlink.dev / BloodLinkTest123!
```

## Cloudflare resources

Created once, already referenced in `worker/wrangler.jsonc`:

```bash
wrangler d1 create bloodlink-db          # database_id -> wrangler.jsonc
wrangler kv namespace create JWK_CACHE   # id -> wrangler.jsonc
```

## Project structure

```
worker/
  wrangler.jsonc          # Worker config: D1 + KV bindings, vars
  seed.json               # canonical demo dataset (single source of truth)
  scripts/
    generate-seed-sql.mjs # seed.json -> sql/seed.sql + src/seed-data.js
  sql/
    schema.sql            # D1 tables + indexes
    seed.sql              # GENERATED - for wrangler d1 execute
  src/
    index.js              # Hono app, CORS, route mounting, error handling
    db.js                 # loadState() + targeted D1 queries
    ml.js                 # logistic regression scoring engine
    assistant.js          # intent classifier + CoT response templates
    auth.js               # Firebase ID token verification (Workers-native)
    push.js               # FCM HTTP v1 + Web Crypto JWT signing
    utils.js              # haversine, blood compatibility, rarity, eligibility
    ids.js                # Web Crypto id generation (replaces nanoid)
    seed-data.js          # GENERATED - bundled seed for POST /api/reset
    routes/               # donors, requests, inventory, assist, score, dashboard, hospitals
client/
  src/
    pages/                # Landing, RegisterDonor, DonorPortal, FindProfile, StaffLogin,
                          # Dashboard, Requests, Inventory, MlInsights, Assistant
    components/           # Sidebar, Panel, StatCard, Badges, ProtectedRoute
    context/AuthContext.jsx
    firebase.js           # Firebase client init (auth + messaging)
    push.js               # notification permission + FCM token registration
    api.js                # fetch wrapper, attaches staff auth token when needed
  public/firebase-messaging-sw.js
```

## What's protected vs. open

| Action | Staff login required? |
|---|---|
| View dashboard / requests / inventory / ML insights / assistant | Yes |
| Create a request, ping alerts, mark fulfilled, edit inventory | Yes |
| Register as a donor | No |
| View your own donor portal, confirm availability | No |

If Firebase isn't configured, all of the above stays open with a visible warning banner, so a
fresh clone is testable before setup.

## Things worth knowing

- **Seed data** was reconstructed from the original project's live frontend plus reasonable
  filler where exact values weren't visible (blood groups on 4 of 7 seeded requests, donor GPS
  coordinates). Close to, but not byte-exact with, the original demo dataset.
- **Push, not SMS.** Real SMS costs money on every provider. FCM push is the free equivalent
  but requires the donor to have opened the site once and granted notification permission.
- **Demand Forecasting** on the dashboard is an illustrative static table (labelled as such in
  `worker/src/routes/dashboard.js`) — there isn't enough historical data for a real model.
- **Donor portal links** (`/my/:donorId`) are unguessable but not authenticated — anyone with
  the link can view that donor's alerts. Same tradeoff as a shared document link; chosen over
  donor passwords to keep registration frictionless.
