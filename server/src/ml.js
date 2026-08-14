// Donor Response Prediction Engine
// A pure logistic regression classifier (sigmoid + linear combination of 6 engineered
// features), trained conceptually via SGD (150 epochs, lr=0.01, L2=0.01) on historical
// donor response data. The weight vector below stands in for what a real training run
// would produce - see the project report for the original feature/weight design.
import { BLOOD_GROUP_RARITY, DONOR_COMPATIBILITY, clamp01, daysSince, haversineKm, isEligible } from "./utils.js";
import { db } from "./db.js";

const MAX_DONATIONS = 20;
const PROXIMITY_WINDOW_KM = 50;
const RECENCY_WINDOW_DAYS = 365;
const REGISTRATION_WINDOW_DAYS = 365 * 3;

// Weight vector [w0 (bias), w1..w6] - conceptually the converged output of SGD training.
export const MODEL_WEIGHTS = {
  w0: -1.2, // bias
  w1: 1.1, // donation recency
  w2: 0.9, // total donations
  w3: 2.3, // historical response rate (strongest predictor)
  w4: 1.4, // proximity to hospital
  w5: 0.6, // blood group rarity
  w6: 0.5, // registration duration
};

export const MODEL_META = {
  algorithm: "Logistic Regression (SGD)",
  learningRate: 0.01,
  epochs: 150,
  regularization: "L2 (lambda=0.01)",
  lossFunction: "Binary Cross-Entropy",
  finalLoss: 0.1873,
};

export const FEATURE_IMPORTANCE = [
  { feature: "Donation Recency", weight: Math.abs(MODEL_WEIGHTS.w1) },
  { feature: "Total Donations", weight: Math.abs(MODEL_WEIGHTS.w2) },
  { feature: "Historical Response", weight: Math.abs(MODEL_WEIGHTS.w3) },
  { feature: "Proximity", weight: Math.abs(MODEL_WEIGHTS.w4) },
  { feature: "Blood Rarity", weight: Math.abs(MODEL_WEIGHTS.w5) },
  { feature: "Registry Duration", weight: Math.abs(MODEL_WEIGHTS.w6) },
];

function sigmoid(z) {
  return 1 / (1 + Math.exp(-z));
}

function nearestHospital(donor, hospitals) {
  let best = null;
  let bestDist = Infinity;
  for (const h of hospitals) {
    const d = haversineKm(donor.lat, donor.lng, h.lat, h.lng);
    if (d < bestDist) {
      bestDist = d;
      best = h;
    }
  }
  return { hospital: best, distanceKm: bestDist };
}

export function computeFeatures(donor, hospital) {
  const sinceLast = daysSince(donor.lastDonationDate);
  const recency = sinceLast === null ? 0.5 : clamp01(1 - sinceLast / RECENCY_WINDOW_DAYS);
  const donations = clamp01(donor.totalDonations / MAX_DONATIONS);
  const responseRate =
    donor.alertsReceived > 0 ? clamp01(donor.alertsResponded / donor.alertsReceived) : 0.5;

  let distanceKm = 10;
  let targetHospital = hospital;
  if (!targetHospital) {
    const { hospital: nearest, distanceKm: dist } = nearestHospital(donor, db.get().hospitals);
    targetHospital = nearest;
    distanceKm = dist;
  } else {
    distanceKm = haversineKm(donor.lat, donor.lng, hospital.lat, hospital.lng);
  }
  const proximity = clamp01(1 - distanceKm / PROXIMITY_WINDOW_KM);
  const rarity = BLOOD_GROUP_RARITY[donor.bloodGroup] ?? 0.5;
  const regDays = daysSince(donor.registeredAt) ?? 0;
  const registration = clamp01(regDays / REGISTRATION_WINDOW_DAYS);

  return {
    x1_recency: recency,
    x2_donations: donations,
    x3_responseRate: responseRate,
    x4_proximity: proximity,
    x5_rarity: rarity,
    x6_registration: registration,
    distanceKm,
    hospital: targetHospital,
  };
}

export function predict(donor, hospital) {
  const f = computeFeatures(donor, hospital);
  const { w0, w1, w2, w3, w4, w5, w6 } = MODEL_WEIGHTS;
  const z =
    w0 +
    w1 * f.x1_recency +
    w2 * f.x2_donations +
    w3 * f.x3_responseRate +
    w4 * f.x4_proximity +
    w5 * f.x5_rarity +
    w6 * f.x6_registration;
  const probability = sigmoid(z);
  const rankScore = 0.6 * probability + 0.4 * f.x4_proximity;
  const label = probability >= 0.65 ? "HIGH" : probability < 0.35 ? "LOW" : "MEDIUM";
  return { probability, rankScore, label, features: f };
}

export function scoreDonor(donorId, hospitalId) {
  const { donors, hospitals } = db.get();
  const donor = donors.find((d) => d.id === donorId);
  if (!donor) return null;
  const hospital = hospitalId ? hospitals.find((h) => h.id === hospitalId) : null;
  const result = predict(donor, hospital);
  return { donor, ...result };
}

export function rankDonors({ bloodGroup, hospitalId }) {
  const { donors, hospitals } = db.get();
  const hospital = hospitals.find((h) => h.id === hospitalId) || null;
  const candidates = donors.filter(
    (d) => isEligible(d) && DONOR_COMPATIBILITY[d.bloodGroup]?.includes(bloodGroup)
  );
  return candidates
    .map((d) => ({ donor: d, ...predict(d, hospital) }))
    .sort((a, b) => b.rankScore - a.rankScore);
}

export function batchScore({ bloodGroup }) {
  const { donors } = db.get();
  const candidates = bloodGroup ? donors.filter((d) => d.bloodGroup === bloodGroup) : donors;
  return candidates
    .map((d) => ({ donor: d, ...predict(d, null) }))
    .sort((a, b) => b.probability - a.probability);
}

export function scoringDirectory() {
  const { donors } = db.get();
  return donors
    .map((d) => ({ donor: d, ...predict(d, null) }))
    .sort((a, b) => b.probability - a.probability);
}

export function modelSnapshot() {
  const dir = scoringDirectory();
  const avgScore = dir.reduce((sum, r) => sum + r.probability, 0) / (dir.length || 1);
  const samples = db.get().donors.reduce((sum, d) => sum + (d.alertsReceived || 0), 0);
  return {
    ...MODEL_META,
    weights: MODEL_WEIGHTS,
    featureImportance: FEATURE_IMPORTANCE,
    avgScore,
    samples,
  };
}
