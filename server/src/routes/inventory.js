import { Router } from "express";
import { db } from "../db.js";
import { BLOOD_GROUPS } from "../utils.js";
import { requireAuth } from "../middleware/requireAuth.js";

export const inventoryRouter = Router();

inventoryRouter.get("/", (req, res) => {
  const { hospitals, inventory, minInventoryLevel } = db.get();
  res.json({
    minInventoryLevel,
    hospitals: hospitals.map((h) => ({ id: h.id, name: h.name, city: h.city, levels: inventory[h.id] || {} })),
  });
});

inventoryRouter.get("/:hospitalId", (req, res) => {
  const { inventory, minInventoryLevel } = db.get();
  const levels = inventory[req.params.hospitalId];
  if (!levels) return res.status(404).json({ error: "No inventory record for this hospital" });
  res.json({ hospitalId: req.params.hospitalId, levels, minInventoryLevel });
});

inventoryRouter.put("/:hospitalId", requireAuth, (req, res) => {
  const state = db.get();
  if (!state.hospitals.find((h) => h.id === req.params.hospitalId)) {
    return res.status(404).json({ error: "Unknown hospital" });
  }
  const { levels } = req.body || {};
  if (!levels || typeof levels !== "object") {
    return res.status(400).json({ error: "levels object is required" });
  }
  const sanitized = {};
  for (const bg of BLOOD_GROUPS) {
    sanitized[bg] = Math.max(0, Number(levels[bg] ?? state.inventory[req.params.hospitalId]?.[bg] ?? 0));
  }
  state.inventory[req.params.hospitalId] = sanitized;
  db.save();
  res.json({ hospitalId: req.params.hospitalId, levels: sanitized });
});
