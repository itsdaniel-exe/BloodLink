import { Hono } from "hono";
import { getInventory, getMinInventoryLevel, listHospitals, loadState, saveInventory } from "../db.js";
import { BLOOD_GROUPS } from "../utils.js";
import { requireAuth } from "../auth.js";

export const inventoryRouter = new Hono();

inventoryRouter.get("/", async (c) => {
  const state = await loadState(c.env.DB);
  return c.json({
    minInventoryLevel: state.minInventoryLevel,
    hospitals: state.hospitals.map((h) => ({
      id: h.id,
      name: h.name,
      city: h.city,
      levels: state.inventory[h.id] || {},
    })),
  });
});

inventoryRouter.get("/:hospitalId", async (c) => {
  const hospitalId = c.req.param("hospitalId");
  const [levels, minInventoryLevel] = await Promise.all([
    getInventory(c.env.DB, hospitalId),
    getMinInventoryLevel(c.env.DB),
  ]);
  if (!levels) return c.json({ error: "No inventory record for this hospital" }, 404);
  return c.json({ hospitalId, levels, minInventoryLevel });
});

inventoryRouter.put("/:hospitalId", requireAuth, async (c) => {
  const hospitalId = c.req.param("hospitalId");
  const hospitals = await listHospitals(c.env.DB);
  if (!hospitals.find((h) => h.id === hospitalId)) {
    return c.json({ error: "Unknown hospital" }, 404);
  }

  const { levels } = await c.req.json().catch(() => ({}));
  if (!levels || typeof levels !== "object") {
    return c.json({ error: "levels object is required" }, 400);
  }

  // Merge over existing values so a partial payload can't zero out untouched blood groups.
  const existing = (await getInventory(c.env.DB, hospitalId)) || {};
  const sanitized = {};
  for (const bg of BLOOD_GROUPS) {
    sanitized[bg] = Math.max(0, Number(levels[bg] ?? existing[bg] ?? 0));
  }

  await saveInventory(c.env.DB, hospitalId, sanitized);
  return c.json({ hospitalId, levels: sanitized });
});
