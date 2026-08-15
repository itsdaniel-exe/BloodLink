import { Hono } from "hono";
import { loadState } from "../db.js";
import { answerQuery } from "../assistant.js";

export const assistRouter = new Hono();

assistRouter.post("/", async (c) => {
  const { query } = await c.req.json().catch(() => ({}));
  if (!query || typeof query !== "string") {
    return c.json({ error: "query string is required" }, 400);
  }
  const state = await loadState(c.env.DB);
  const { intent, answer } = answerQuery(query, state);
  return c.json({ answer, intentClassified: intent });
});
