import { Hono } from "hono";
import {
  getDonor,
  getRequest,
  insertAlertsBatch,
  insertRequest,
  insertResponse,
  incrementDonorResponded,
  listHospitals,
  listRequests,
  loadState,
  updateRequestCounts,
  updateRequestStatus,
} from "../db.js";
import { rankDonors } from "../ml.js";
import { requireAuth } from "../auth.js";
import { sendPush } from "../push.js";
import { shortId } from "../ids.js";

export const requestsRouter = new Hono();

function withHospital(request, hospitals) {
  const hospital = hospitals.find((h) => h.id === request.hospitalId);
  return { ...request, hospitalName: hospital?.name ?? "Unknown Hospital", hospitalCity: hospital?.city };
}

// match_donors + send_alerts equivalent: ranks compatible/eligible donors by the ML rank
// score, sends a real FCM push to any donor with a registered device token, and always
// writes an alert record (so the history is complete even for donors without push enabled).
async function matchAndAlert(env, state, request, limit = 25) {
  const ranked = rankDonors(state, { bloodGroup: request.bloodGroup, hospitalId: request.hospitalId }).slice(0, limit);
  const hospital = state.hospitals.find((h) => h.id === request.hospitalId);
  const now = new Date().toISOString();
  const alerts = [];

  for (const { donor } of ranked) {
    const message =
      request.urgency === "CRITICAL"
        ? `URGENT BLOOD REQUEST: ${request.bloodGroup} needed at ${hospital?.name}, ${hospital?.city}. Please respond immediately if available to donate.`
        : `${hospital?.name} needs ${request.bloodGroup} blood. Tap to confirm availability.`;

    const push = await sendPush(env, donor, {
      title: "🩸 BloodLink Emergency Alert",
      body: message,
      link: `/my/${donor.id}`,
    });

    alerts.push({
      id: `alert-${shortId()}`,
      requestId: request.id,
      donorId: donor.id,
      channel: request.urgency === "CRITICAL" ? "BROADCAST" : "TARGETED",
      message,
      sentAt: now,
      status: push.sent ? "PUSHED" : "LOGGED",
    });
  }

  await insertAlertsBatch(env.DB, alerts);
  return ranked;
}

requestsRouter.get("/", async (c) => {
  const [requests, hospitals] = await Promise.all([listRequests(c.env.DB), listHospitals(c.env.DB)]);
  return c.json(requests.map((r) => withHospital(r, hospitals)));
});

// create_blood_request equivalent - also triggers matching + alerting. Staff only.
requestsRouter.post("/", requireAuth, async (c) => {
  const body = await c.req.json().catch(() => ({}));
  const { hospitalId, bloodGroup, unitsNeeded, urgency } = body;
  if (!hospitalId || !bloodGroup || !unitsNeeded || !urgency) {
    return c.json({ error: "hospitalId, bloodGroup, unitsNeeded and urgency are required" }, 400);
  }

  const state = await loadState(c.env.DB);
  if (!state.hospitals.find((h) => h.id === hospitalId)) {
    return c.json({ error: "Unknown hospitalId" }, 400);
  }

  const request = {
    id: `req-${shortId()}`,
    hospitalId,
    bloodGroup,
    unitsNeeded: Number(unitsNeeded),
    urgency,
    status: "ACTIVE",
    donorsAlerted: 0,
    donorsFound: 0,
    createdAt: new Date().toISOString(),
  };
  await insertRequest(c.env.DB, request);

  const ranked = await matchAndAlert(c.env, state, request);
  request.donorsAlerted = ranked.length;
  request.donorsFound = ranked.length;
  await updateRequestCounts(c.env.DB, request.id, { donorsAlerted: ranked.length, donorsFound: ranked.length });

  return c.json({ request: withHospital(request, state.hospitals), matchedDonors: ranked.length }, 201);
});

requestsRouter.patch("/:id", requireAuth, async (c) => {
  const id = c.req.param("id");
  const existing = await getRequest(c.env.DB, id);
  if (!existing) return c.json({ error: "Request not found" }, 404);

  const { status } = await c.req.json().catch(() => ({}));
  const updated = status ? await updateRequestStatus(c.env.DB, id, status) : existing;
  const hospitals = await listHospitals(c.env.DB);
  return c.json(withHospital(updated, hospitals));
});

// "Live Alert Ping" - re-broadcast to the currently ranked donor pool for a request.
requestsRouter.post("/:id/ping", requireAuth, async (c) => {
  const id = c.req.param("id");
  const state = await loadState(c.env.DB);
  const request = state.requests.find((r) => r.id === id);
  if (!request) return c.json({ error: "Request not found" }, 404);

  const ranked = await matchAndAlert(c.env, state, request);
  request.donorsAlerted = ranked.length;
  request.donorsFound = ranked.length;
  await updateRequestCounts(c.env.DB, id, { donorsAlerted: ranked.length, donorsFound: ranked.length });

  return c.json({ request: withHospital(request, state.hospitals), pinged: ranked.length });
});

// update_donor_response equivalent - a donor confirming from their own alert, no staff login.
requestsRouter.post("/:id/respond", async (c) => {
  const requestId = c.req.param("id");
  const request = await getRequest(c.env.DB, requestId);
  if (!request) return c.json({ error: "Request not found" }, 404);

  const { donorId, status } = await c.req.json().catch(() => ({}));
  const donor = await getDonor(c.env.DB, donorId);
  if (!donor) return c.json({ error: "Donor not found" }, 404);

  const finalStatus = status || "CONFIRMED";
  await insertResponse(c.env.DB, {
    id: `resp-${shortId()}`,
    requestId,
    donorId,
    status: finalStatus,
    respondedAt: new Date().toISOString(),
  });
  if (finalStatus === "CONFIRMED") {
    await incrementDonorResponded(c.env.DB, donorId);
  }

  return c.json({ ok: true }, 201);
});
