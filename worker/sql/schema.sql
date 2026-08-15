-- BloodLink D1 schema.
-- SQLite has no boolean type, so isAvailable is stored as INTEGER 0/1 and hydrated
-- back to a real boolean in loadState().
DROP TABLE IF EXISTS donors;
DROP TABLE IF EXISTS hospitals;
DROP TABLE IF EXISTS requests;
DROP TABLE IF EXISTS alerts;
DROP TABLE IF EXISTS responses;
DROP TABLE IF EXISTS inventory;
DROP TABLE IF EXISTS config;

CREATE TABLE donors (
  id               TEXT PRIMARY KEY,
  name             TEXT NOT NULL,
  bloodGroup       TEXT NOT NULL,
  city             TEXT NOT NULL,
  lat              REAL NOT NULL,
  lng              REAL NOT NULL,
  phone            TEXT NOT NULL,
  email            TEXT DEFAULT '',
  totalDonations   INTEGER NOT NULL DEFAULT 0,
  lastDonationDate TEXT,
  registeredAt     TEXT NOT NULL,
  isAvailable      INTEGER NOT NULL DEFAULT 1,
  alertsReceived   INTEGER NOT NULL DEFAULT 0,
  alertsResponded  INTEGER NOT NULL DEFAULT 0,
  fcmToken         TEXT
);

CREATE TABLE hospitals (
  id      TEXT PRIMARY KEY,
  name    TEXT NOT NULL,
  city    TEXT NOT NULL,
  lat     REAL NOT NULL,
  lng     REAL NOT NULL,
  contact TEXT
);

CREATE TABLE requests (
  id            TEXT PRIMARY KEY,
  hospitalId    TEXT NOT NULL,
  bloodGroup    TEXT NOT NULL,
  unitsNeeded   INTEGER NOT NULL,
  urgency       TEXT NOT NULL,
  status        TEXT NOT NULL,
  donorsAlerted INTEGER NOT NULL DEFAULT 0,
  donorsFound   INTEGER NOT NULL DEFAULT 0,
  createdAt     TEXT NOT NULL
);

CREATE TABLE alerts (
  id        TEXT PRIMARY KEY,
  requestId TEXT NOT NULL,
  donorId   TEXT NOT NULL,
  channel   TEXT,
  message   TEXT,
  sentAt    TEXT,
  status    TEXT
);

CREATE TABLE responses (
  id          TEXT PRIMARY KEY,
  requestId   TEXT NOT NULL,
  donorId     TEXT NOT NULL,
  status      TEXT,
  respondedAt TEXT
);

CREATE TABLE inventory (
  hospitalId TEXT NOT NULL,
  bloodGroup TEXT NOT NULL,
  units      INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (hospitalId, bloodGroup)
);

CREATE TABLE config (
  key   TEXT PRIMARY KEY,
  value TEXT
);

-- Indexes for the hot read paths: a donor's own alert feed, and per-request lookups.
CREATE INDEX idx_alerts_donor   ON alerts (donorId);
CREATE INDEX idx_alerts_request ON alerts (requestId);
CREATE INDEX idx_responses_pair ON responses (requestId, donorId);
CREATE INDEX idx_donors_phone   ON donors (phone);
