// D1 data layer.
//
// The Express version kept the whole dataset in memory in a long-lived process. Workers is
// stateless per request, so instead `loadState()` pulls the dataset in one batched round trip
// and returns the exact same shape the old `db.get()` did - which is why ml.js / assistant.js
// / the dashboard aggregation could be ported with only signature changes.
//
// Reads that only need a slice (one donor, one donor's alerts) use targeted queries instead,
// so the common donor-facing paths don't pay for a full load.
import { BLOOD_GROUPS } from "./utils.js";
import { seedData } from "./seed-data.js";

// SQLite has no boolean type - isAvailable round-trips as INTEGER 0/1. This matters:
// isEligible() checks `donor.isAvailable === false`, which a raw 0 would silently fail.
function hydrateDonor(row) {
  if (!row) return null;
  return { ...row, isAvailable: row.isAvailable !== 0 };
}

export async function loadState(db) {
  const [donorsR, hospitalsR, requestsR, alertsR, responsesR, inventoryR, configR] = await db.batch([
    db.prepare("SELECT * FROM donors"),
    db.prepare("SELECT * FROM hospitals"),
    db.prepare("SELECT * FROM requests"),
    db.prepare("SELECT * FROM alerts"),
    db.prepare("SELECT * FROM responses"),
    db.prepare("SELECT * FROM inventory"),
    db.prepare("SELECT * FROM config"),
  ]);

  const inventory = {};
  for (const row of inventoryR.results) {
    if (!inventory[row.hospitalId]) inventory[row.hospitalId] = {};
    inventory[row.hospitalId][row.bloodGroup] = row.units;
  }

  const config = Object.fromEntries(configR.results.map((r) => [r.key, r.value]));

  return {
    donors: donorsR.results.map(hydrateDonor),
    hospitals: hospitalsR.results,
    requests: requestsR.results,
    alerts: alertsR.results,
    responses: responsesR.results,
    inventory,
    minInventoryLevel: Number(config.minInventoryLevel ?? 8),
  };
}

/* ---------------------------------- donors ---------------------------------- */

export async function getDonor(db, id) {
  const row = await db.prepare("SELECT * FROM donors WHERE id = ?").bind(id).first();
  return hydrateDonor(row);
}

// Matches on the last 10 digits so any formatting (+91-98220-11001, spaces, etc.) resolves.
export async function findDonorByPhone(db, phone) {
  const digits = String(phone || "").replace(/\D/g, "").slice(-10);
  if (digits.length !== 10) return null;
  const row = await db
    .prepare("SELECT * FROM donors WHERE REPLACE(REPLACE(REPLACE(phone,'-',''),' ',''),'+','') LIKE ?")
    .bind(`%${digits}`)
    .first();
  return hydrateDonor(row);
}

export async function insertDonor(db, donor) {
  await db
    .prepare(
      `INSERT INTO donors
        (id,name,bloodGroup,city,lat,lng,phone,email,totalDonations,lastDonationDate,registeredAt,isAvailable,alertsReceived,alertsResponded,fcmToken)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`
    )
    .bind(
      donor.id,
      donor.name,
      donor.bloodGroup,
      donor.city,
      donor.lat,
      donor.lng,
      donor.phone,
      donor.email ?? "",
      donor.totalDonations ?? 0,
      donor.lastDonationDate ?? null,
      donor.registeredAt,
      donor.isAvailable === false ? 0 : 1,
      donor.alertsReceived ?? 0,
      donor.alertsResponded ?? 0,
      donor.fcmToken ?? null
    )
    .run();
  return donor;
}

const DONOR_PATCHABLE = {
  isAvailable: (v) => (v === false ? 0 : 1),
  totalDonations: (v) => Number(v),
  lastDonationDate: (v) => v,
  fcmToken: (v) => v,
};

export async function updateDonor(db, id, patch) {
  const sets = [];
  const values = [];
  for (const [key, coerce] of Object.entries(DONOR_PATCHABLE)) {
    if (patch[key] !== undefined) {
      sets.push(`${key} = ?`);
      values.push(coerce(patch[key]));
    }
  }
  if (sets.length) {
    await db.prepare(`UPDATE donors SET ${sets.join(", ")} WHERE id = ?`).bind(...values, id).run();
  }
  return getDonor(db, id);
}

export function incrementDonorAlertsStmt(db, donorId) {
  return db.prepare("UPDATE donors SET alertsReceived = alertsReceived + 1 WHERE id = ?").bind(donorId);
}

export async function incrementDonorResponded(db, donorId) {
  await db.prepare("UPDATE donors SET alertsResponded = alertsResponded + 1 WHERE id = ?").bind(donorId).run();
}

/* --------------------------------- requests --------------------------------- */

export async function getRequest(db, id) {
  return db.prepare("SELECT * FROM requests WHERE id = ?").bind(id).first();
}

export async function listRequests(db) {
  const { results } = await db.prepare("SELECT * FROM requests ORDER BY createdAt DESC").all();
  return results;
}

export async function listHospitals(db) {
  const { results } = await db.prepare("SELECT * FROM hospitals").all();
  return results;
}

export async function insertRequest(db, request) {
  await db
    .prepare(
      `INSERT INTO requests (id,hospitalId,bloodGroup,unitsNeeded,urgency,status,donorsAlerted,donorsFound,createdAt)
       VALUES (?,?,?,?,?,?,?,?,?)`
    )
    .bind(
      request.id,
      request.hospitalId,
      request.bloodGroup,
      request.unitsNeeded,
      request.urgency,
      request.status,
      request.donorsAlerted ?? 0,
      request.donorsFound ?? 0,
      request.createdAt
    )
    .run();
  return request;
}

export async function updateRequestCounts(db, id, { donorsAlerted, donorsFound }) {
  await db
    .prepare("UPDATE requests SET donorsAlerted = ?, donorsFound = ? WHERE id = ?")
    .bind(donorsAlerted, donorsFound, id)
    .run();
}

export async function updateRequestStatus(db, id, status) {
  await db.prepare("UPDATE requests SET status = ? WHERE id = ?").bind(status, id).run();
  return getRequest(db, id);
}

/* ---------------------------------- alerts ---------------------------------- */

// Writes all alert rows and bumps each donor's alertsReceived in a single batch, so a
// partially-sent broadcast can't leave counters out of sync with the alert log.
export async function insertAlertsBatch(db, alerts) {
  if (!alerts.length) return;
  const statements = [];
  for (const a of alerts) {
    statements.push(
      db
        .prepare("INSERT INTO alerts (id,requestId,donorId,channel,message,sentAt,status) VALUES (?,?,?,?,?,?,?)")
        .bind(a.id, a.requestId, a.donorId, a.channel, a.message, a.sentAt, a.status)
    );
    statements.push(incrementDonorAlertsStmt(db, a.donorId));
  }
  await db.batch(statements);
}

// A donor's own alert feed, newest first, joined with request + hospital context and whether
// they already responded. One query instead of loading the whole dataset.
export async function listDonorAlerts(db, donorId) {
  const { results } = await db
    .prepare(
      `SELECT
         a.id, a.requestId, a.donorId, a.channel, a.message, a.sentAt, a.status,
         r.bloodGroup AS req_bloodGroup, r.urgency AS req_urgency, r.status AS req_status,
         h.name AS req_hospitalName, h.city AS req_hospitalCity,
         resp.status AS responseStatus
       FROM alerts a
       LEFT JOIN requests  r    ON r.id = a.requestId
       LEFT JOIN hospitals h    ON h.id = r.hospitalId
       LEFT JOIN responses resp ON resp.requestId = a.requestId AND resp.donorId = a.donorId
       WHERE a.donorId = ?
       ORDER BY a.sentAt DESC`
    )
    .bind(donorId)
    .all();

  return results.map((row) => ({
    id: row.id,
    requestId: row.requestId,
    donorId: row.donorId,
    channel: row.channel,
    message: row.message,
    sentAt: row.sentAt,
    status: row.status,
    request: row.req_bloodGroup
      ? {
          id: row.requestId,
          bloodGroup: row.req_bloodGroup,
          urgency: row.req_urgency,
          status: row.req_status,
          hospitalName: row.req_hospitalName ?? "Unknown Hospital",
          hospitalCity: row.req_hospitalCity,
        }
      : null,
    responded: row.responseStatus !== null,
    responseStatus: row.responseStatus,
  }));
}

/* -------------------------------- responses --------------------------------- */

export async function insertResponse(db, response) {
  await db
    .prepare("INSERT INTO responses (id,requestId,donorId,status,respondedAt) VALUES (?,?,?,?,?)")
    .bind(response.id, response.requestId, response.donorId, response.status, response.respondedAt)
    .run();
}

/* -------------------------------- inventory --------------------------------- */

export async function getInventory(db, hospitalId) {
  const { results } = await db
    .prepare("SELECT bloodGroup, units FROM inventory WHERE hospitalId = ?")
    .bind(hospitalId)
    .all();
  if (!results.length) return null;
  return Object.fromEntries(results.map((r) => [r.bloodGroup, r.units]));
}

export async function getMinInventoryLevel(db) {
  const row = await db.prepare("SELECT value FROM config WHERE key = 'minInventoryLevel'").first();
  return Number(row?.value ?? 8);
}

export async function saveInventory(db, hospitalId, levels) {
  await db.batch(
    BLOOD_GROUPS.map((bg) =>
      db
        .prepare(
          `INSERT INTO inventory (hospitalId,bloodGroup,units) VALUES (?,?,?)
           ON CONFLICT(hospitalId,bloodGroup) DO UPDATE SET units = excluded.units`
        )
        .bind(hospitalId, bg, Math.max(0, Number(levels[bg] ?? 0)))
    )
  );
}

/* ----------------------------------- reset ----------------------------------- */

// Restores the demo dataset (POST /api/reset). Runs as one batch so a partial failure
// can't leave the database half-wiped.
export async function resetToSeed(db) {
  const statements = [
    db.prepare("DELETE FROM donors"),
    db.prepare("DELETE FROM hospitals"),
    db.prepare("DELETE FROM requests"),
    db.prepare("DELETE FROM alerts"),
    db.prepare("DELETE FROM responses"),
    db.prepare("DELETE FROM inventory"),
    db.prepare("DELETE FROM config"),
  ];

  for (const h of seedData.hospitals) {
    statements.push(
      db
        .prepare("INSERT INTO hospitals (id,name,city,lat,lng,contact) VALUES (?,?,?,?,?,?)")
        .bind(h.id, h.name, h.city, h.lat, h.lng, h.contact ?? null)
    );
  }

  for (const d of seedData.donors) {
    statements.push(
      db
        .prepare(
          `INSERT INTO donors
            (id,name,bloodGroup,city,lat,lng,phone,email,totalDonations,lastDonationDate,registeredAt,isAvailable,alertsReceived,alertsResponded,fcmToken)
           VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`
        )
        .bind(
          d.id,
          d.name,
          d.bloodGroup,
          d.city,
          d.lat,
          d.lng,
          d.phone,
          d.email ?? "",
          d.totalDonations ?? 0,
          d.lastDonationDate ?? null,
          d.registeredAt,
          d.isAvailable === false ? 0 : 1,
          d.alertsReceived ?? 0,
          d.alertsResponded ?? 0,
          d.fcmToken ?? null
        )
    );
  }

  for (const r of seedData.requests) {
    statements.push(
      db
        .prepare(
          `INSERT INTO requests (id,hospitalId,bloodGroup,unitsNeeded,urgency,status,donorsAlerted,donorsFound,createdAt)
           VALUES (?,?,?,?,?,?,?,?,?)`
        )
        .bind(
          r.id,
          r.hospitalId,
          r.bloodGroup,
          r.unitsNeeded,
          r.urgency,
          r.status,
          r.donorsAlerted ?? 0,
          r.donorsFound ?? 0,
          r.createdAt
        )
    );
  }

  for (const [hospitalId, levels] of Object.entries(seedData.inventory)) {
    for (const [bloodGroup, units] of Object.entries(levels)) {
      statements.push(
        db.prepare("INSERT INTO inventory (hospitalId,bloodGroup,units) VALUES (?,?,?)").bind(hospitalId, bloodGroup, units)
      );
    }
  }

  statements.push(
    db.prepare("INSERT INTO config (key,value) VALUES (?,?)").bind("minInventoryLevel", String(seedData.minInventoryLevel))
  );

  await db.batch(statements);
}
