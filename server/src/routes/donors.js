import { Router } from "express";
import { nanoid } from "nanoid";
import { db } from "../db.js";
import { isEligible } from "../utils.js";
import { asyncHandler } from "../asyncHandler.js";

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

// Powers the public donor portal (/my/:donorId) - a donor's own alert history, newest first,
// joined with the request + hospital context and whether they've already responded.
donorsRouter.get("/:id/alerts", (req, res) => {
  const state = db.get();
  const donor = state.donors.find((d) => d.id === req.params.id);
  if (!donor) return res.status(404).json({ error: "Donor not found" });

  const enriched = state.alerts
    .filter((a) => a.donorId === req.params.id)
    .map((alert) => {
      const request = state.requests.find((r) => r.id === alert.requestId);
      const hospital = request ? state.hospitals.find((h) => h.id === request.hospitalId) : null;
      const response = state.responses.find(
        (r) => r.requestId === alert.requestId && r.donorId === req.params.id
      );
      return {
        ...alert,
        request: request
          ? {
              id: request.id,
              bloodGroup: request.bloodGroup,
              urgency: request.urgency,
              status: request.status,
              hospitalName: hospital?.name ?? "Unknown Hospital",
              hospitalCity: hospital?.city,
            }
          : null,
        responded: Boolean(response),
        responseStatus: response?.status ?? null,
      };
    })
    .sort((a, b) => new Date(b.sentAt) - new Date(a.sentAt));

  res.json(enriched);
});

// register_donor equivalent
donorsRouter.post(
  "/",
  asyncHandler(async (req, res) => {
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
    await db.save();
    res.status(201).json({ ...donor, eligible: isEligible(donor) });
  })
);

// Saves a donor's Firebase Cloud Messaging device token so emergency alerts can be delivered
// as real push notifications instead of just logged. Called by the client after the donor
// grants browser notification permission - no staff login required, this is self-service.
donorsRouter.post(
  "/:id/fcm-token",
  asyncHandler(async (req, res) => {
    const donor = db.get().donors.find((d) => d.id === req.params.id);
    if (!donor) return res.status(404).json({ error: "Donor not found" });
    const { token } = req.body || {};
    if (!token) return res.status(400).json({ error: "token is required" });
    donor.fcmToken = token;
    await db.save();
    res.json({ ok: true });
  })
);

donorsRouter.patch(
  "/:id",
  asyncHandler(async (req, res) => {
    const state = db.get();
    const donor = state.donors.find((d) => d.id === req.params.id);
    if (!donor) return res.status(404).json({ error: "Donor not found" });
    const { isAvailable, totalDonations, lastDonationDate } = req.body || {};
    if (isAvailable !== undefined) donor.isAvailable = isAvailable;
    if (totalDonations !== undefined) donor.totalDonations = totalDonations;
    if (lastDonationDate !== undefined) donor.lastDonationDate = lastDonationDate;
    await db.save();
    res.json({ ...donor, eligible: isEligible(donor) });
  })
);
