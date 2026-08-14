import { Router } from "express";
import { batchScore, modelSnapshot, rankDonors, scoreDonor, scoringDirectory } from "../ml.js";

export const scoreRouter = Router();

scoreRouter.get("/model", (req, res) => {
  res.json(modelSnapshot());
});

scoreRouter.get("/directory", (req, res) => {
  const dir = scoringDirectory().map(({ donor, probability, rankScore, label, features }) => ({
    donor,
    probability,
    rankScore,
    label,
    distanceKm: features.distanceKm,
  }));
  res.json(dir);
});

// donor-response-predictor equivalent: score_donor | rank_donors | batch_score
scoreRouter.post("/", (req, res) => {
  const { action, donorId, hospitalId, bloodGroup } = req.body || {};
  switch (action) {
    case "score_donor": {
      if (!donorId) return res.status(400).json({ error: "donorId is required" });
      const result = scoreDonor(donorId, hospitalId);
      if (!result) return res.status(404).json({ error: "Donor not found" });
      return res.json(result);
    }
    case "rank_donors": {
      if (!bloodGroup || !hospitalId) {
        return res.status(400).json({ error: "bloodGroup and hospitalId are required" });
      }
      return res.json(rankDonors({ bloodGroup, hospitalId }));
    }
    case "batch_score": {
      return res.json(batchScore({ bloodGroup }));
    }
    default:
      return res.status(400).json({ error: "action must be one of score_donor | rank_donors | batch_score" });
  }
});
