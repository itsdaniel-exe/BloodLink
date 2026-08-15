import { Hono } from "hono";
import { loadState } from "../db.js";
import { batchScore, modelSnapshot, rankDonors, scoreDonor, scoringDirectory } from "../ml.js";

export const scoreRouter = new Hono();

scoreRouter.get("/model", async (c) => {
  const state = await loadState(c.env.DB);
  return c.json(modelSnapshot(state));
});

scoreRouter.get("/directory", async (c) => {
  const state = await loadState(c.env.DB);
  const dir = scoringDirectory(state).map(({ donor, probability, rankScore, label, features }) => ({
    donor,
    probability,
    rankScore,
    label,
    distanceKm: features.distanceKm,
  }));
  return c.json(dir);
});

// donor-response-predictor equivalent: score_donor | rank_donors | batch_score
scoreRouter.post("/", async (c) => {
  const { action, donorId, hospitalId, bloodGroup } = await c.req.json().catch(() => ({}));
  const state = await loadState(c.env.DB);

  switch (action) {
    case "score_donor": {
      if (!donorId) return c.json({ error: "donorId is required" }, 400);
      const result = scoreDonor(state, donorId, hospitalId);
      if (!result) return c.json({ error: "Donor not found" }, 404);
      return c.json(result);
    }
    case "rank_donors": {
      if (!bloodGroup || !hospitalId) {
        return c.json({ error: "bloodGroup and hospitalId are required" }, 400);
      }
      return c.json(rankDonors(state, { bloodGroup, hospitalId }));
    }
    case "batch_score":
      return c.json(batchScore(state, { bloodGroup }));
    default:
      return c.json({ error: "action must be one of score_donor | rank_donors | batch_score" }, 400);
  }
});
