import { auth, firebaseConfigured } from "./firebase.js";

// In local dev this stays "/api" and Vite's dev-server proxy (vite.config.js) forwards it to
// localhost:4000. In production there's no such proxy, so VITE_API_BASE_URL must point at the
// deployed backend's full origin (e.g. https://bloodlink-api.onrender.com/api).
const BASE = import.meta.env.VITE_API_BASE_URL || "/api";

async function authHeader() {
  if (!firebaseConfigured || !auth?.currentUser) return {};
  const token = await auth.currentUser.getIdToken();
  return { Authorization: `Bearer ${token}` };
}

async function request(path, options = {}, { auth: needsAuth = false } = {}) {
  const headers = { "Content-Type": "application/json", ...(needsAuth ? await authHeader() : {}) };
  const res = await fetch(`${BASE}${path}`, { headers, ...options });
  const contentType = res.headers.get("content-type") || "";
  const body = contentType.includes("application/json") ? await res.json() : null;
  if (!res.ok) {
    throw new Error(body?.error || `Request failed: ${res.status}`);
  }
  return body;
}

export const api = {
  health: () => request("/health"),

  getDashboard: () => request("/dashboard"),

  getHospitals: () => request("/hospitals"),

  getDonors: () => request("/donors"),
  getDonor: (id) => request(`/donors/${id}`),
  getDonorAlerts: (id) => request(`/donors/${id}/alerts`),
  registerDonor: (donor) => request("/donors", { method: "POST", body: JSON.stringify(donor) }),
  updateDonor: (id, patch) => request(`/donors/${id}`, { method: "PATCH", body: JSON.stringify(patch) }),
  saveDonorFcmToken: (donorId, token) =>
    request(`/donors/${donorId}/fcm-token`, { method: "POST", body: JSON.stringify({ token }) }),

  getRequests: () => request("/requests"),
  createRequest: (payload) =>
    request("/requests", { method: "POST", body: JSON.stringify(payload) }, { auth: true }),
  updateRequestStatus: (id, status) =>
    request(`/requests/${id}`, { method: "PATCH", body: JSON.stringify({ status }) }, { auth: true }),
  pingRequest: (id) => request(`/requests/${id}/ping`, { method: "POST" }, { auth: true }),
  respondToRequest: (requestId, donorId, status) =>
    request(`/requests/${requestId}/respond`, { method: "POST", body: JSON.stringify({ donorId, status }) }),

  getInventory: () => request("/inventory"),
  getHospitalInventory: (hospitalId) => request(`/inventory/${hospitalId}`),
  saveHospitalInventory: (hospitalId, levels) =>
    request(`/inventory/${hospitalId}`, { method: "PUT", body: JSON.stringify({ levels }) }, { auth: true }),

  getModelSnapshot: () => request("/score/model"),
  getScoringDirectory: () => request("/score/directory"),

  ask: (query) => request("/assist", { method: "POST", body: JSON.stringify({ query }) }),
};
