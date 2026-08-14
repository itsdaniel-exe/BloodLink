import "dotenv/config";
import express from "express";
import cors from "cors";
import morgan from "morgan";

import { donorsRouter } from "./routes/donors.js";
import { requestsRouter } from "./routes/requests.js";
import { inventoryRouter } from "./routes/inventory.js";
import { assistRouter } from "./routes/assist.js";
import { scoreRouter } from "./routes/score.js";
import { dashboardRouter } from "./routes/dashboard.js";
import { hospitalsRouter } from "./routes/hospitals.js";
import { db } from "./db.js";
import { asyncHandler } from "./asyncHandler.js";

const app = express();
const PORT = process.env.PORT || 4000;

// Set CORS_ORIGIN to the hosted frontend's exact origin in production to lock this down;
// defaults to open so local development and quick deploys work with zero extra config.
app.use(cors({ origin: process.env.CORS_ORIGIN || true }));
app.use(express.json());
app.use(morgan("dev"));

app.get("/api/health", (req, res) => res.json({ status: "ok", service: "bloodlink-api" }));

app.use("/api/donors", donorsRouter);
app.use("/api/requests", requestsRouter);
app.use("/api/inventory", inventoryRouter);
app.use("/api/assist", assistRouter);
app.use("/api/score", scoreRouter);
app.use("/api/dashboard", dashboardRouter);
app.use("/api/hospitals", hospitalsRouter);

app.post(
  "/api/reset",
  asyncHandler(async (req, res) => {
    await db.reset();
    res.json({ ok: true });
  })
);

app.use((req, res) => res.status(404).json({ error: "Not found" }));

// Catches errors passed to next() by asyncHandler-wrapped routes instead of crashing.
app.use((err, req, res, next) => {
  console.error("[api] Unhandled error:", err);
  res.status(500).json({ error: "Internal server error" });
});

async function main() {
  await db.init();
  app.listen(PORT, () => {
    console.log(`bloodlink-api listening on http://localhost:${PORT}`);
  });
}

main().catch((err) => {
  console.error("Failed to start bloodlink-api:", err);
  process.exit(1);
});
