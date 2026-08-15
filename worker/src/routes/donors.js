import { Hono } from "hono";
import { findDonorByPhone, getDonor, insertDonor, listDonorAlerts, loadState, updateDonor } from "../db.js";
import { isEligible } from "../utils.js";
import { shortId } from "../ids.js";

export const donorsRouter = new Hono();

donorsRouter.get("/", async (c) => {
  const state = await loadState(c.env.DB);
  return c.json(state.donors.map((d) => ({ ...d, eligible: isEligible(d) })));
});

// Lets a donor recover access to their portal link with just the phone number they registered
// with - no password to forget. Must be declared before "/:id" or Hono would match "lookup"
// as an id. Returns only the id, so a phone number alone can't dump a full profile.
donorsRouter.get("/lookup", async (c) => {
  const phone = c.req.query("phone");
  if (!phone) return c.json({ error: "phone query param is required" }, 400);
  const donor = await findDonorByPhone(c.env.DB, phone);
  if (!donor) return c.json({ error: "No donor found with that phone number." }, 404);
  return c.json({ id: donor.id });
});

donorsRouter.get("/:id", async (c) => {
  const donor = await getDonor(c.env.DB, c.req.param("id"));
  if (!donor) return c.json({ error: "Donor not found" }, 404);
  return c.json({ ...donor, eligible: isEligible(donor) });
});

// Powers the public donor portal (/my/:donorId).
donorsRouter.get("/:id/alerts", async (c) => {
  const id = c.req.param("id");
  const donor = await getDonor(c.env.DB, id);
  if (!donor) return c.json({ error: "Donor not found" }, 404);
  return c.json(await listDonorAlerts(c.env.DB, id));
});

// register_donor equivalent
donorsRouter.post("/", async (c) => {
  const body = await c.req.json().catch(() => ({}));
  const { name, bloodGroup, city, lat, lng, phone, email } = body;
  if (!name || !bloodGroup || !city || lat === undefined || lng === undefined || !phone) {
    return c.json({ error: "name, bloodGroup, city, lat, lng and phone are required" }, 400);
  }

  const donor = {
    id: `donor-${shortId()}`,
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

  await insertDonor(c.env.DB, donor);
  return c.json({ ...donor, eligible: isEligible(donor) }, 201);
});

// Saves a donor's FCM device token so emergency alerts arrive as real push notifications.
// Self-service - no staff login required.
donorsRouter.post("/:id/fcm-token", async (c) => {
  const id = c.req.param("id");
  const donor = await getDonor(c.env.DB, id);
  if (!donor) return c.json({ error: "Donor not found" }, 404);

  const { token } = await c.req.json().catch(() => ({}));
  if (!token) return c.json({ error: "token is required" }, 400);

  await updateDonor(c.env.DB, id, { fcmToken: token });
  return c.json({ ok: true });
});

donorsRouter.patch("/:id", async (c) => {
  const id = c.req.param("id");
  const donor = await getDonor(c.env.DB, id);
  if (!donor) return c.json({ error: "Donor not found" }, 404);

  const patch = await c.req.json().catch(() => ({}));
  const updated = await updateDonor(c.env.DB, id, patch);
  return c.json({ ...updated, eligible: isEligible(updated) });
});
