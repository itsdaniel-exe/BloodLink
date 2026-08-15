import { Hono } from "hono";
import { cors } from "hono/cors";

import { donorsRouter } from "./routes/donors.js";
import { requestsRouter } from "./routes/requests.js";
import { inventoryRouter } from "./routes/inventory.js";
import { assistRouter } from "./routes/assist.js";
import { scoreRouter } from "./routes/score.js";
import { dashboardRouter } from "./routes/dashboard.js";
import { hospitalsRouter } from "./routes/hospitals.js";
import { resetToSeed } from "./db.js";

const app = new Hono();

// CORS_ORIGIN is a comma-separated allowlist (Firebase Hosting serves the frontend on both
// .web.app and .firebaseapp.com, so there's more than one legitimate origin). Unset means
// open, so a fresh clone and local dev work with zero extra config.
app.use("*", (c, next) => {
  const configured = (c.env.CORS_ORIGIN || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const origin = configured.length ? configured : "*";
  return cors({ origin })(c, next);
});

app.get("/api/health", (c) => c.json({ status: "ok", service: "bloodlink-api" }));

app.route("/api/donors", donorsRouter);
app.route("/api/requests", requestsRouter);
app.route("/api/inventory", inventoryRouter);
app.route("/api/assist", assistRouter);
app.route("/api/score", scoreRouter);
app.route("/api/dashboard", dashboardRouter);
app.route("/api/hospitals", hospitalsRouter);

app.post("/api/reset", async (c) => {
  await resetToSeed(c.env.DB);
  return c.json({ ok: true });
});

app.notFound((c) => c.json({ error: "Not found" }, 404));

app.onError((err, c) => {
  console.error("[api] Unhandled error:", err);
  return c.json({ error: "Internal server error" }, 500);
});

export default app;
