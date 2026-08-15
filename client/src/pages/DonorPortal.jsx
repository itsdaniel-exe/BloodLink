import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api } from "../api.js";
import { UrgencyBadge, BloodGroupChip } from "../components/Badges.jsx";

export default function DonorPortal() {
  const { donorId } = useParams();
  const [donor, setDonor] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [error, setError] = useState("");
  const [busyAlertId, setBusyAlertId] = useState(null);
  const [togglingAvailability, setTogglingAvailability] = useState(false);

  async function refresh() {
    const [d, a] = await Promise.all([api.getDonor(donorId), api.getDonorAlerts(donorId)]);
    setDonor(d);
    setAlerts(a);
  }

  useEffect(() => {
    refresh().catch((e) => setError(e.message));
  }, [donorId]);

  async function confirm(requestId) {
    setBusyAlertId(requestId);
    try {
      await api.respondToRequest(requestId, donorId, "CONFIRMED");
      await refresh();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusyAlertId(null);
    }
  }

  async function toggleAvailability() {
    setTogglingAvailability(true);
    try {
      await api.updateDonor(donorId, { isAvailable: !donor.isAvailable });
      await refresh();
    } catch (e) {
      setError(e.message);
    } finally {
      setTogglingAvailability(false);
    }
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-ink-950 px-6 text-center">
        <div className="card max-w-md p-8">
          <div className="mb-3 text-4xl">🔍</div>
          <h1 className="mb-2 text-xl font-bold text-white">Couldn't find that donor</h1>
          <p className="mb-6 text-sm text-slate-400">{error}</p>
          <div className="flex flex-col gap-2">
            <Link to="/find-profile" className="btn-secondary w-full justify-center">
              Find My Profile by Phone
            </Link>
            <Link to="/register" className="btn-primary w-full justify-center">
              Register as a Donor
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!donor) {
    return <div className="flex min-h-screen items-center justify-center bg-ink-950 text-slate-500">Loading…</div>;
  }

  return (
    <div className="min-h-screen bg-ink-950 px-6 py-12">
      <div className="mx-auto max-w-2xl">
        <Link to="/" className="mb-6 inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-300">
          ← Back to home
        </Link>

        <div className="card mb-6 p-6">
          <div className="mb-4 flex items-start justify-between gap-4">
            <div>
              <h1 className="text-xl font-bold text-white">{donor.name}</h1>
              <p className="text-sm text-slate-500">{donor.city}</p>
            </div>
            <BloodGroupChip value={donor.bloodGroup} />
          </div>

          <div className="mb-4 flex flex-wrap items-center gap-2 text-sm">
            <span
              className={`badge ${
                donor.eligible ? "bg-emerald-500/15 text-emerald-400" : "bg-slate-500/15 text-slate-400"
              }`}
            >
              {donor.eligible ? "✅ Eligible to donate" : "⏳ Not currently eligible"}
            </span>
            <span
              className={`badge ${
                donor.isAvailable ? "bg-emerald-500/15 text-emerald-400" : "bg-red-500/15 text-red-400"
              }`}
            >
              {donor.isAvailable ? "Available" : "Marked unavailable"}
            </span>
            <span className="text-slate-500">{donor.totalDonations} lifetime donations</span>
          </div>

          <button className="btn-secondary" disabled={togglingAvailability} onClick={toggleAvailability}>
            {togglingAvailability
              ? "Updating…"
              : donor.isAvailable
              ? "Mark myself temporarily unavailable"
              : "Mark myself available again"}
          </button>
        </div>

        <div className="card p-6">
          <h2 className="mb-1 text-base font-bold text-white">Your Alert History</h2>
          <p className="mb-4 text-xs text-slate-500">
            You'll appear here whenever a hospital's emergency request matches your blood group.
          </p>

          {alerts.length === 0 && (
            <p className="rounded-xl border border-white/5 bg-white/[0.02] p-4 text-sm text-slate-500">
              No alerts yet. Nothing to do — you'll be notified here (and via push notification, if
              enabled) the moment a nearby hospital needs your blood group.
            </p>
          )}

          <div className="flex flex-col gap-3">
            {alerts.map((alert) => (
              <div key={alert.id} className="rounded-xl border border-white/5 bg-white/[0.02] p-4">
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  {alert.request && <UrgencyBadge value={alert.request.urgency} />}
                  {alert.request && <BloodGroupChip value={alert.request.bloodGroup} />}
                  <span className="text-xs text-slate-500">{new Date(alert.sentAt).toLocaleString()}</span>
                </div>
                <p className="mb-1 text-sm font-semibold text-white">
                  {alert.request?.hospitalName ?? "Unknown hospital"}
                  {alert.request?.hospitalCity ? ` · ${alert.request.hospitalCity}` : ""}
                </p>
                <p className="mb-3 text-sm text-slate-400">{alert.message}</p>

                {alert.responded ? (
                  <span className="badge bg-emerald-500/15 text-emerald-400">✅ You confirmed</span>
                ) : alert.request?.status === "FULFILLED" ? (
                  <span className="badge bg-slate-500/15 text-slate-400">Request already fulfilled</span>
                ) : (
                  <button
                    className="btn-primary"
                    disabled={busyAlertId === alert.requestId}
                    onClick={() => confirm(alert.requestId)}
                  >
                    {busyAlertId === alert.requestId ? "Confirming…" : "✅ Confirm I Can Donate"}
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        <p className="mt-6 text-center text-xs text-slate-600">
          Bookmark this page — it's your personal link, not shared with anyone else.
        </p>
      </div>
    </div>
  );
}
