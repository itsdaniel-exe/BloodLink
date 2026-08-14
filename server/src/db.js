import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SEED_PATH = path.join(__dirname, "data", "seed.json");
const DB_PATH = path.join(__dirname, "data", "db.json");

function loadInitial() {
  if (!fs.existsSync(DB_PATH)) {
    const seed = fs.readFileSync(SEED_PATH, "utf-8");
    fs.writeFileSync(DB_PATH, seed);
  }
  return JSON.parse(fs.readFileSync(DB_PATH, "utf-8"));
}

let state = loadInitial();

function persist() {
  fs.writeFileSync(DB_PATH, JSON.stringify(state, null, 2));
}

export const db = {
  get() {
    return state;
  },
  save() {
    persist();
  },
  reset() {
    const seed = fs.readFileSync(SEED_PATH, "utf-8");
    state = JSON.parse(seed);
    persist();
    return state;
  },
};
