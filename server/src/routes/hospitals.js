import { Router } from "express";
import { db } from "../db.js";

export const hospitalsRouter = Router();

hospitalsRouter.get("/", (req, res) => {
  res.json(db.get().hospitals);
});
