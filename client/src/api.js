import { auth, firebaseConfigured } from "./firebase.js";

const BASE = "/api";

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
  registerDonor: (donor) => request("/donors", { method: "POST", body: JSON.stringify(donor) }),
  saveDonorFcmToken: (donorId, token) =>
    request(`/donors/${donorId}/fcm-token`, { method: "POST", body: JSON.stringify({ token }) }),

  getRequests: () => request("/requests"),
  createRequest: (payload) =>
    request("/requests", { method: "POST", body: JSON.stringify(payload) }, { auth: true }),
  updateRequestStatus: (id, status) =>
    request(`/requests/${id}`, { method: "PATCH", body: JSON.stringify({ status }) }, { auth: true }),
  pingRequest: (id) => request(`/requests/${id}/ping`, { method: "POST" }, { auth: true }),

  getInventory: () => request("/inventory"),
  getHospitalInventory: (hospitalId) => request(`/inventory/${hospitalId}`),
  saveHospitalInventory: (hospitalId, levels) =>
    request(`/inventory/${hospitalId}`, { method: "PUT", body: JSON.stringify({ levels }) }, { auth: true }),

  getModelSnapshot: () => request("/score/model"),
  getScoringDirectory: () => request("/score/directory"),

  ask: (query) => request("/assist", { method: "POST", body: JSON.stringify({ query }) }),
};
