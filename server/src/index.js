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

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
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

app.post("/api/reset", (req, res) => {
  db.reset();
  res.json({ ok: true });
});

app.use((req, res) => res.status(404).json({ error: "Not found" }));

app.listen(PORT, () => {
  console.log(`bloodlink-api listening on http://localhost:${PORT}`);
});
