// Generates two artifacts from the canonical seed.json, so the demo dataset lives in exactly
// one place:
//   sql/seed.sql       - for one-off `wrangler d1 execute` seeding of a fresh database
//   src/seed-data.js   - bundled into the Worker so POST /api/reset can re-seed at runtime
//                        (Workers has no filesystem, so the data has to be a module)
// Run: npm run gen:seed
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SEED_JSON = path.join(__dirname, "..", "seed.json");
const OUT = path.join(__dirname, "..", "sql", "seed.sql");
const OUT_MODULE = path.join(__dirname, "..", "src", "seed-data.js");

const seed = JSON.parse(fs.readFileSync(SEED_JSON, "utf-8"));

const q = (v) => {
  if (v === null || v === undefined) return "NULL";
  if (typeof v === "number") return String(v);
  if (typeof v === "boolean") return v ? "1" : "0";
  return `'${String(v).replace(/'/g, "''")}'`;
};

const lines = [
  "-- GENERATED FILE - do not edit by hand.",
  "-- Regenerate with: npm run gen:seed   (source: worker/seed.json)",
  "",
  "DELETE FROM donors;",
  "DELETE FROM hospitals;",
  "DELETE FROM requests;",
  "DELETE FROM alerts;",
  "DELETE FROM responses;",
  "DELETE FROM inventory;",
  "DELETE FROM config;",
  "",
];

for (const h of seed.hospitals) {
  lines.push(
    `INSERT INTO hospitals (id,name,city,lat,lng,contact) VALUES (${q(h.id)},${q(h.name)},${q(h.city)},${q(h.lat)},${q(h.lng)},${q(h.contact)});`
  );
}
lines.push("");

for (const d of seed.donors) {
  lines.push(
    `INSERT INTO donors (id,name,bloodGroup,city,lat,lng,phone,email,totalDonations,lastDonationDate,registeredAt,isAvailable,alertsReceived,alertsResponded,fcmToken) VALUES (` +
      [
        q(d.id),
        q(d.name),
        q(d.bloodGroup),
        q(d.city),
        q(d.lat),
        q(d.lng),
        q(d.phone),
        q(d.email ?? ""),
        q(d.totalDonations ?? 0),
        q(d.lastDonationDate ?? null),
        q(d.registeredAt),
        q(d.isAvailable !== false),
        q(d.alertsReceived ?? 0),
        q(d.alertsResponded ?? 0),
        q(d.fcmToken ?? null),
      ].join(",") +
      ");"
  );
}
lines.push("");

for (const r of seed.requests) {
  lines.push(
    `INSERT INTO requests (id,hospitalId,bloodGroup,unitsNeeded,urgency,status,donorsAlerted,donorsFound,createdAt) VALUES (` +
      [
        q(r.id),
        q(r.hospitalId),
        q(r.bloodGroup),
        q(r.unitsNeeded),
        q(r.urgency),
        q(r.status),
        q(r.donorsAlerted ?? 0),
        q(r.donorsFound ?? 0),
        q(r.createdAt),
      ].join(",") +
      ");"
  );
}
lines.push("");

for (const [hospitalId, levels] of Object.entries(seed.inventory)) {
  for (const [bloodGroup, units] of Object.entries(levels)) {
    lines.push(
      `INSERT INTO inventory (hospitalId,bloodGroup,units) VALUES (${q(hospitalId)},${q(bloodGroup)},${q(units)});`
    );
  }
}
lines.push("");
lines.push(`INSERT INTO config (key,value) VALUES ('minInventoryLevel',${q(String(seed.minInventoryLevel))});`);
lines.push("");

fs.writeFileSync(OUT, lines.join("\n"));

fs.writeFileSync(
  OUT_MODULE,
  [
    "// GENERATED FILE - do not edit by hand.",
    "// Regenerate with: npm run gen:seed   (source: worker/seed.json)",
    "// Bundled into the Worker so POST /api/reset can restore the demo dataset at runtime.",
    `export const seedData = ${JSON.stringify(seed, null, 2)};`,
    "",
  ].join("\n")
);

console.log(
  `Wrote ${OUT}\n      ${OUT_MODULE}\n  ${seed.hospitals.length} hospitals, ${seed.donors.length} donors, ${seed.requests.length} requests, ${Object.keys(seed.inventory).length} inventory sets`
);
