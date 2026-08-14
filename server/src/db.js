// Data layer. When Firebase is configured, this persists to Firestore (survives restarts and
// redeploys - required for real hosting). When it isn't, it falls back to a local JSON file so
// the app still runs for anyone cloning the repo without Firebase set up yet.
//
// Design: the whole dataset is loaded into an in-memory `state` object once at startup (see
// init(), which index.js awaits before the server starts listening). Routes read/mutate `state`
// directly and synchronously (via db.get()), then call db.save() to persist - so route code
// doesn't need to change based on which backend is active. save() rewrites the full dataset each
// time, which is simple and correct at this app's scale (tens of records, not millions).
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { adminDb, firebaseEnabled } from "./firebaseAdmin.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SEED_PATH = path.join(__dirname, "data", "seed.json");
const DB_PATH = path.join(__dirname, "data", "db.json");

const RECORD_COLLECTIONS = ["donors", "hospitals", "requests", "alerts", "responses"];

function readSeed() {
  return JSON.parse(fs.readFileSync(SEED_PATH, "utf-8"));
}

let state = null;

// ---------- Local JSON backend (fallback when Firebase isn't configured) ----------

function loadLocal() {
  if (!fs.existsSync(DB_PATH)) {
    fs.writeFileSync(DB_PATH, fs.readFileSync(SEED_PATH, "utf-8"));
  }
  return JSON.parse(fs.readFileSync(DB_PATH, "utf-8"));
}

function persistLocal() {
  fs.writeFileSync(DB_PATH, JSON.stringify(state, null, 2));
}

function resetLocal() {
  state = readSeed();
  persistLocal();
}

// ---------- Firestore backend ----------

async function seedFirestore(seed) {
  const batch = adminDb.batch();
  for (const col of ["donors", "hospitals", "requests"]) {
    for (const item of seed[col]) batch.set(adminDb.collection(col).doc(item.id), item);
  }
  for (const [hospitalId, levels] of Object.entries(seed.inventory)) {
    batch.set(adminDb.collection("inventory").doc(hospitalId), levels);
  }
  batch.set(adminDb.collection("config").doc("settings"), { minInventoryLevel: seed.minInventoryLevel });
  await batch.commit();
}

async function loadFirestore() {
  const result = {};
  for (const col of RECORD_COLLECTIONS) {
    const snap = await adminDb.collection(col).get();
    result[col] = snap.docs.map((d) => d.data());
  }

  const invSnap = await adminDb.collection("inventory").get();
  result.inventory = {};
  invSnap.forEach((d) => {
    result.inventory[d.id] = d.data();
  });

  const settingsSnap = await adminDb.collection("config").doc("settings").get();
  const seed = readSeed();
  result.minInventoryLevel = settingsSnap.exists ? settingsSnap.data().minInventoryLevel : seed.minInventoryLevel;

  const isEmpty = result.donors.length === 0 && result.hospitals.length === 0;
  if (isEmpty) {
    console.log("[db] Firestore is empty - seeding from server/src/data/seed.json");
    await seedFirestore(seed);
    return { ...seed, alerts: [], responses: [] };
  }
  return result;
}

async function persistFirestore() {
  const batch = adminDb.batch();
  for (const col of RECORD_COLLECTIONS) {
    for (const item of state[col]) batch.set(adminDb.collection(col).doc(item.id), item);
  }
  for (const [hospitalId, levels] of Object.entries(state.inventory)) {
    batch.set(adminDb.collection("inventory").doc(hospitalId), levels);
  }
  batch.set(adminDb.collection("config").doc("settings"), { minInventoryLevel: state.minInventoryLevel });
  await batch.commit();
}

async function deleteAllDocs(collectionName) {
  const snap = await adminDb.collection(collectionName).get();
  if (snap.empty) return;
  const batch = adminDb.batch();
  snap.forEach((d) => batch.delete(d.ref));
  await batch.commit();
}

async function resetFirestore() {
  for (const col of [...RECORD_COLLECTIONS, "inventory"]) {
    await deleteAllDocs(col);
  }
  const seed = readSeed();
  await seedFirestore(seed);
  state = { ...seed, alerts: [], responses: [] };
}

// ---------- Public API ----------

export const db = {
  async init() {
    state = firebaseEnabled ? await loadFirestore() : loadLocal();
    console.log(`[db] Data layer ready (${firebaseEnabled ? "Firestore" : "local JSON file"}).`);
  },
  get() {
    if (!state) throw new Error("db.init() must be awaited before the server starts handling requests.");
    return state;
  },
  async save() {
    if (firebaseEnabled) await persistFirestore();
    else persistLocal();
  },
  async reset() {
    if (firebaseEnabled) await resetFirestore();
    else resetLocal();
    return state;
  },
};
