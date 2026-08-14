export const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

// Donor blood group -> set of recipient blood groups it can safely donate to.
export const DONOR_COMPATIBILITY = {
  "O-": ["O-", "O+", "A-", "A+", "B-", "B+", "AB-", "AB+"],
  "O+": ["O+", "A+", "B+", "AB+"],
  "A-": ["A-", "A+", "AB-", "AB+"],
  "A+": ["A+", "AB+"],
  "B-": ["B-", "B+", "AB-", "AB+"],
  "B+": ["B+", "AB+"],
  "AB-": ["AB-", "AB+"],
  "AB+": ["AB+"],
};

// Relative scarcity of each blood group, used as an ML feature (rarer = higher priority).
export const BLOOD_GROUP_RARITY = {
  "AB-": 1.0,
  "O-": 0.9,
  "B-": 0.8,
  "AB+": 0.7,
  "A-": 0.6,
  "B+": 0.5,
  "O+": 0.4,
  "A+": 0.3,
};

const EARTH_RADIUS_KM = 6371;

export function haversineKm(lat1, lng1, lat2, lng2) {
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return EARTH_RADIUS_KM * c;
}

export function daysSince(dateStr) {
  if (!dateStr) return null;
  const then = new Date(dateStr).getTime();
  const now = Date.now();
  return Math.max(0, Math.floor((now - then) / (1000 * 60 * 60 * 24)));
}

export function clamp01(x) {
  return Math.min(1, Math.max(0, x));
}

export function isEligible(donor) {
  if (donor.isAvailable === false) return false;
  const sinceLast = daysSince(donor.lastDonationDate);
  if (sinceLast === null) return true; // never donated -> eligible
  return sinceLast >= 90; // standard whole-blood donation gap
}
