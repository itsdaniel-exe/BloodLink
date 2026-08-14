import { Router } from "express";
import { answerQuery } from "../assistant.js";

export const assistRouter = Router();

assistRouter.post("/", (req, res) => {
  const { query } = req.body || {};
  if (!query || typeof query !== "string") {
    return res.status(400).json({ error: "query string is required" });
  }
  const { intent, answer } = answerQuery(query);
  res.json({ answer, intentClassified: intent });
});
