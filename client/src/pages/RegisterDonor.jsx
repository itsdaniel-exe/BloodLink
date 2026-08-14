import { useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api.js";
import { requestPushToken } from "../push.js";
import { firebaseConfigured, vapidKey } from "../firebase.js";

const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

const CITIES = {
  Pune: { lat: 18.5204, lng: 73.8567 },
  Mumbai: { lat: 19.076, lng: 72.8777 },
  Bengaluru: { lat: 12.9716, lng: 77.5946 },
  Delhi: { lat: 28.7041, lng: 77.1025 },
  Chennai: { lat: 13.0827, lng: 80.2707 },
};

export default function RegisterDonor() {
  const [form, setForm] = useState({ name: "", bloodGroup: "O+", city: "Pune", phone: "", email: "" });
  const [status, setStatus] = useState("idle"); // idle | saving | done | error
  const [error, setError] = useState("");

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function onSubmit(e) {
    e.preventDefault();
    setStatus("saving");
    setError("");
    try {
      const { lat, lng } = CITIES[form.city];
      const donor = await api.registerDonor({ ...form, lat, lng });
      setStatus("done");

      // Best-effort: ask for push permission so this donor can receive real emergency
      // alerts. Never blocks registration if it's unsupported, denied, or not configured.
      requestPushToken()
        .then((token) => token && api.saveDonorFcmToken(donor.id, token))
        .catch(() => {});
    } catch (err) {
      setError(err.message);
      setStatus("error");
    }
  }

  if (status === "done") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-ink-950 px-6 text-center">
        <div className="card max-w-md p-8">
          <div className="mb-3 text-4xl">✅</div>
          <h1 className="mb-2 text-xl font-bold text-white">You're registered!</h1>
          <p className="mb-3 text-sm text-slate-400">
            Thank you, {form.name}. Every donation can save up to three lives.
          </p>
          <p className="mb-6 text-xs text-slate-500">
            {firebaseConfigured && vapidKey
              ? "If you allowed notifications, you'll get a push alert when a nearby hospital needs your blood group."
              : "Push alerts aren't set up on this deployment yet, so you won't get a notification automatically — check the Hospital Requests board instead."}
          </p>
          <Link to="/" className="btn-primary">
            Back to Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-ink-950 px-6 py-12">
      <form onSubmit={onSubmit} className="card w-full max-w-lg p-8">
        <Link to="/" className="mb-6 inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-300">
          ← Back to home
        </Link>
        <div className="mb-1 flex items-center gap-2">
          <span className="text-2xl">🩸</span>
          <h1 className="text-xl font-bold text-white">Register as a Blood Donor</h1>
        </div>
        <p className="mb-6 text-sm text-slate-500">
          Join the BloodLink donor network. Your response probability improves the more you donate.
        </p>

        <div className="mb-4">
          <label className="label">Full Name</label>
          <input
            required
            className="input"
            value={form.name}
            onChange={(e) => update("name", e.target.value)}
            placeholder="e.g. Priya Sharma"
          />
        </div>

        <div className="mb-4 grid grid-cols-2 gap-4">
          <div>
            <label className="label">Blood Group</label>
            <select className="input" value={form.bloodGroup} onChange={(e) => update("bloodGroup", e.target.value)}>
              {BLOOD_GROUPS.map((bg) => (
                <option key={bg} value={bg}>
                  {bg}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">City</label>
            <select className="input" value={form.city} onChange={(e) => update("city", e.target.value)}>
              {Object.keys(CITIES).map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mb-4">
          <label className="label">Phone Number</label>
          <input
            required
            className="input"
            value={form.phone}
            onChange={(e) => update("phone", e.target.value)}
            placeholder="+91-98xxxxxxx"
          />
        </div>

        <div className="mb-6">
          <label className="label">Email (optional)</label>
          <input
            type="email"
            className="input"
            value={form.email}
            onChange={(e) => update("email", e.target.value)}
            placeholder="you@example.com"
          />
        </div>

        {error && <p className="mb-4 text-sm text-red-400">{error}</p>}

        <button type="submit" disabled={status === "saving"} className="btn-primary w-full justify-center text-base">
          {status === "saving" ? "Registering…" : "🩸 Register Now"}
        </button>
      </form>
    </div>
  );
}
