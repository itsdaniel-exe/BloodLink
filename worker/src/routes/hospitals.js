import { Hono } from "hono";
import { listHospitals } from "../db.js";

export const hospitalsRouter = new Hono();

hospitalsRouter.get("/", async (c) => c.json(await listHospitals(c.env.DB)));
