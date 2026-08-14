import { Router } from "express";
import { nanoid } from "nanoid";
import { db } from "../db.js";
import { isEligible } from "../utils.js";

export const donorsRouter = Router();

donorsRouter.get("/", (req, res) => {
  const { donors } = db.get();
  res.json(donors.map((d) => ({ ...d, eligible: isEligible(d) })));
});

donorsRouter.get("/:id", (req, res) => {
  const donor = db.get().donors.find((d) => d.id === req.params.id);
  if (!donor) return res.status(404).json({ error: "Donor not found" });
  res.json({ ...donor, eligible: isEligible(donor) });
});

// register_donor equivalent
donorsRouter.post("/", (req, res) => {
  const { name, bloodGroup, city, lat, lng, phone, email } = req.body || {};
  if (!name || !bloodGroup || !city || lat === undefined || lng === undefined || !phone) {
    return res.status(400).json({ error: "name, bloodGroup, city, lat, lng and phone are required" });
  }
  const state = db.get();
  const donor = {
    id: `donor-${nanoid(8)}`,
    name,
    bloodGroup,
    city,
    lat: Number(lat),
    lng: Number(lng),
    phone,
    email: email || "",
    totalDonations: 0,
    lastDonationDate: null,
    registeredAt: new Date().toISOString().slice(0, 10),
    isAvailable: true,
    alertsReceived: 0,
    alertsResponded: 0,
    fcmToken: null,
  };
  state.donors.push(donor);
  db.save();
  res.status(201).json({ ...donor, eligible: isEligible(donor) });
});

// Saves a donor's Firebase Cloud Messaging device token so emergency alerts can be delivered
// as real push notifications instead of just logged. Called by the client after the donor
// grants browser notification permission - no staff login required, this is self-service.
donorsRouter.post("/:id/fcm-token", (req, res) => {
  const donor = db.get().donors.find((d) => d.id === req.params.id);
  if (!donor) return res.status(404).json({ error: "Donor not found" });
  const { token } = req.body || {};
  if (!token) return res.status(400).json({ error: "token is required" });
  donor.fcmToken = token;
  db.save();
  res.json({ ok: true });
});

donorsRouter.patch("/:id", (req, res) => {
  const state = db.get();
  const donor = state.donors.find((d) => d.id === req.params.id);
  if (!donor) return res.status(404).json({ error: "Donor not found" });
  const { isAvailable, totalDonations, lastDonationDate } = req.body || {};
  if (isAvailable !== undefined) donor.isAvailable = isAvailable;
  if (totalDonations !== undefined) donor.totalDonations = totalDonations;
  if (lastDonationDate !== undefined) donor.lastDonationDate = lastDonationDate;
  db.save();
  res.json({ ...donor, eligible: isEligible(donor) });
});
