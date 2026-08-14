import { Router } from "express";
import { nanoid } from "nanoid";
import { db } from "../db.js";
import { rankDonors } from "../ml.js";
import { requireAuth } from "../middleware/requireAuth.js";
import { sendPush } from "../push.js";

export const requestsRouter = Router();

function withHospital(request) {
  const hospital = db.get().hospitals.find((h) => h.id === request.hospitalId);
  return { ...request, hospitalName: hospital?.name ?? "Unknown Hospital", hospitalCity: hospital?.city };
}

// match_donors + send_alerts equivalent: ranks compatible/eligible donors by the ML rank
// score, sends a real Firebase Cloud Messaging push to any donor with a registered device
// token, and always logs an alert record (so the alert history is complete even for donors
// who haven't enabled push notifications yet).
async function matchAndAlert(request, limit = 25) {
  const state = db.get();
  const ranked = rankDonors({ bloodGroup: request.bloodGroup, hospitalId: request.hospitalId }).slice(0, limit);
  const hospital = state.hospitals.find((h) => h.id === request.hospitalId);
  const now = new Date().toISOString();

  for (const { donor } of ranked) {
    const message =
      request.urgency === "CRITICAL"
        ? `URGENT BLOOD REQUEST: ${request.bloodGroup} needed at ${hospital?.name}, ${hospital?.city}. Please respond immediately if available to donate.`
        : `${hospital?.name} needs ${request.bloodGroup} blood. Tap to confirm availability.`;

    const push = await sendPush(donor, { title: "🩸 BloodLink Emergency Alert", body: message });

    state.alerts.push({
      id: `alert-${nanoid(8)}`,
      requestId: request.id,
      donorId: donor.id,
      channel: request.urgency === "CRITICAL" ? "BROADCAST" : "TARGETED",
      message,
      sentAt: now,
      status: push.sent ? "PUSHED" : "LOGGED",
    });
    donor.alertsReceived = (donor.alertsReceived || 0) + 1;
  }

  request.donorsAlerted = ranked.length;
  await db.save();
  return ranked;
}

requestsRouter.get("/", (req, res) => {
  const { requests } = db.get();
  const sorted = [...requests].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  res.json(sorted.map(withHospital));
});

// create_blood_request equivalent - also triggers match_donors + send_alerts synchronously.
// Requires staff sign-in (see requireAuth).
requestsRouter.post("/", requireAuth, async (req, res) => {
  try {
    const { hospitalId, bloodGroup, unitsNeeded, urgency } = req.body || {};
    if (!hospitalId || !bloodGroup || !unitsNeeded || !urgency) {
      return res.status(400).json({ error: "hospitalId, bloodGroup, unitsNeeded and urgency are required" });
    }
    const state = db.get();
    if (!state.hospitals.find((h) => h.id === hospitalId)) {
      return res.status(400).json({ error: "Unknown hospitalId" });
    }
    const request = {
      id: `req-${nanoid(8)}`,
      hospitalId,
      bloodGroup,
      unitsNeeded: Number(unitsNeeded),
      urgency,
      status: "ACTIVE",
      donorsAlerted: 0,
      donorsFound: 0,
      createdAt: new Date().toISOString(),
    };
    state.requests.push(request);
    await db.save();

    const ranked = await matchAndAlert(request);
    request.donorsFound = ranked.length;
    await db.save();

    res.status(201).json({ request: withHospital(request), matchedDonors: ranked.length });
  } catch (err) {
    console.error("[requests] create failed:", err);
    res.status(500).json({ error: "Failed to create request" });
  }
});

requestsRouter.patch("/:id", requireAuth, async (req, res) => {
  try {
    const state = db.get();
    const request = state.requests.find((r) => r.id === req.params.id);
    if (!request) return res.status(404).json({ error: "Request not found" });
    const { status } = req.body || {};
    if (status) request.status = status;
    await db.save();
    res.json(withHospital(request));
  } catch (err) {
    console.error("[requests] update failed:", err);
    res.status(500).json({ error: "Failed to update request" });
  }
});

// "Live Alert Ping" - re-broadcast alerts to the currently ranked donor pool for a request
requestsRouter.post("/:id/ping", requireAuth, async (req, res) => {
  try {
    const state = db.get();
    const request = state.requests.find((r) => r.id === req.params.id);
    if (!request) return res.status(404).json({ error: "Request not found" });
    const ranked = await matchAndAlert(request);
    request.donorsFound = ranked.length;
    await db.save();
    res.json({ request: withHospital(request), pinged: ranked.length });
  } catch (err) {
    console.error("[requests] ping failed:", err);
    res.status(500).json({ error: "Failed to ping donors" });
  }
});

// update_donor_response equivalent - a donor confirming from their own alert, no staff login
requestsRouter.post("/:id/respond", async (req, res) => {
  try {
    const state = db.get();
    const request = state.requests.find((r) => r.id === req.params.id);
    if (!request) return res.status(404).json({ error: "Request not found" });
    const { donorId, status } = req.body || {};
    const donor = state.donors.find((d) => d.id === donorId);
    if (!donor) return res.status(404).json({ error: "Donor not found" });

    state.responses.push({
      id: `resp-${nanoid(8)}`,
      requestId: request.id,
      donorId,
      status: status || "CONFIRMED",
      respondedAt: new Date().toISOString(),
    });
    if (status === "CONFIRMED" || !status) {
      donor.alertsResponded = (donor.alertsResponded || 0) + 1;
    }
    await db.save();
    res.status(201).json({ ok: true });
  } catch (err) {
    console.error("[requests] respond failed:", err);
    res.status(500).json({ error: "Failed to record response" });
  }
});
