import { useEffect, useMemo, useState } from "react";
import { api } from "../api.js";
import Panel from "../components/Panel.jsx";
import { BloodGroupChip, StatusBadge, UrgencyBadge } from "../components/Badges.jsx";

const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];
const URGENCIES = ["CRITICAL", "HIGH", "MEDIUM", "LOW"];

export default function Requests() {
  const [requests, setRequests] = useState([]);
  const [hospitals, setHospitals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("ALL");
  const [showModal, setShowModal] = useState(false);
  const [toast, setToast] = useState("");
  const [pinging, setPinging] = useState(false);

  async function refresh() {
    const [reqs, hosps] = await Promise.all([api.getRequests(), api.getHospitals()]);
    setRequests(reqs);
    setHospitals(hosps);
  }

  useEffect(() => {
    refresh()
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(
    () => (filter === "ALL" ? requests : requests.filter((r) => r.bloodGroup === filter)),
    [requests, filter]
  );

  function flashToast(msg) {
    setToast(msg);
    setTimeout(() => setToast(""), 3500);
  }

  async function pingAllActive() {
    setPinging(true);
    try {
      const active = requests.filter((r) => r.status === "ACTIVE");
      let total = 0;
      for (const r of active) {
        const res = await api.pingRequest(r.id);
        total += res.pinged;
      }
      flashToast(`📩 Live alert ping sent to ${total} donor alert${total === 1 ? "" : "s"} across ${active.length} active request(s).`);
      await refresh();
    } catch (e) {
      flashToast(`Failed to ping: ${e.message}`);
    } finally {
      setPinging(false);
    }
  }

  async function markFulfilled(id) {
    await api.updateRequestStatus(id, "FULFILLED");
    await refresh();
  }

  if (loading) return <div className="flex h-full items-center justify-center text-slate-500">Fetching requests…</div>;
  if (error) return <div className="flex h-full items-center justify-center text-red-400">{error}</div>;

  return (
    <div className="mx-auto max-w-7xl px-6 py-8">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white">🏥 Hospital Requests</h1>
          <p className="mt-1 text-sm text-slate-500">Manage emergency operations & active broadcasts.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button className="btn-secondary" disabled={pinging} onClick={pingAllActive}>
            {pinging ? "Pinging…" : "📡 Live Alert Ping"}
          </button>
          <button className="btn-primary" onClick={() => setShowModal(true)}>
            + New Request
          </button>
        </div>
      </div>

      {toast && (
        <div className="mb-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-2.5 text-sm text-emerald-300">
          {toast}
        </div>
      )}

      <Panel
        right={
          <select className="input w-48" value={filter} onChange={(e) => setFilter(e.target.value)}>
            <option value="ALL">All Blood Groups</option>
            {BLOOD_GROUPS.map((bg) => (
              <option key={bg} value={bg}>
                {bg}
              </option>
            ))}
          </select>
        }
      >
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead>
              <tr className="text-xs uppercase tracking-wide text-slate-500">
                <th className="pb-3 font-medium">Hospital</th>
                <th className="pb-3 font-medium">Blood Group</th>
                <th className="pb-3 font-medium">Urgency</th>
                <th className="pb-3 font-medium">Status</th>
                <th className="pb-3 font-medium">Donors Alerted</th>
                <th className="pb-3 font-medium">Created At</th>
                <th className="pb-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filtered.map((r) => (
                <tr key={r.id}>
                  <td className="py-3">
                    <div className="font-semibold text-white">{r.hospitalName}</div>
                    <div className="text-xs text-slate-500">{r.hospitalCity}</div>
                  </td>
                  <td className="py-3">
                    <BloodGroupChip value={r.bloodGroup} />
                  </td>
                  <td className="py-3">
                    <UrgencyBadge value={r.urgency} />
                  </td>
                  <td className="py-3">
                    <StatusBadge value={r.status} />
                  </td>
                  <td className="py-3 text-slate-300">
                    {r.donorsFound} / {r.donorsAlerted} found
                  </td>
                  <td className="py-3 text-xs text-slate-500">{new Date(r.createdAt).toLocaleString()}</td>
                  <td className="py-3 text-right">
                    {r.status === "ACTIVE" && (
                      <button className="text-xs font-semibold text-emerald-400 hover:text-emerald-300" onClick={() => markFulfilled(r.id)}>
                        Mark Fulfilled
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-500">
                    No requests match this filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Panel>

      {showModal && (
        <NewRequestModal
          hospitals={hospitals}
          onClose={() => setShowModal(false)}
          onCreated={async (matched) => {
            setShowModal(false);
            flashToast(`✅ Request logged — matched & alerted ${matched} donor(s).`);
            await refresh();
          }}
        />
      )}
    </div>
  );
}

function NewRequestModal({ hospitals, onClose, onCreated }) {
  const [form, setForm] = useState({
    hospitalId: hospitals[0]?.id || "",
    bloodGroup: "O+",
    unitsNeeded: 1,
    urgency: "MEDIUM",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function onSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const res = await api.createRequest(form);
      onCreated(res.matchedDonors);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4" onClick={onClose}>
      <form
        className="card w-full max-w-md p-6"
        onClick={(e) => e.stopPropagation()}
        onSubmit={onSubmit}
      >
        <h2 className="mb-4 text-lg font-bold text-white">+ New Emergency Request</h2>

        <div className="mb-4">
          <label className="label">Hospital</label>
          <select
            className="input"
            value={form.hospitalId}
            onChange={(e) => setForm((f) => ({ ...f, hospitalId: e.target.value }))}
          >
            {hospitals.map((h) => (
              <option key={h.id} value={h.id}>
                {h.name} ({h.city})
              </option>
            ))}
          </select>
        </div>

        <div className="mb-4 grid grid-cols-2 gap-4">
          <div>
            <label className="label">Blood Group</label>
            <select
              className="input"
              value={form.bloodGroup}
              onChange={(e) => setForm((f) => ({ ...f, bloodGroup: e.target.value }))}
            >
              {BLOOD_GROUPS.map((bg) => (
                <option key={bg} value={bg}>
                  {bg}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Units Needed</label>
            <input
              type="number"
              min={1}
              className="input"
              value={form.unitsNeeded}
              onChange={(e) => setForm((f) => ({ ...f, unitsNeeded: e.target.value }))}
            />
          </div>
        </div>

        <div className="mb-6">
          <label className="label">Urgency</label>
          <select
            className="input"
            value={form.urgency}
            onChange={(e) => setForm((f) => ({ ...f, urgency: e.target.value }))}
          >
            {URGENCIES.map((u) => (
              <option key={u} value={u}>
                {u}
              </option>
            ))}
          </select>
        </div>

        {error && <p className="mb-4 text-sm text-red-400">{error}</p>}

        <div className="flex justify-end gap-3">
          <button type="button" className="btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" disabled={saving} className="btn-primary">
            {saving ? "Matching donors…" : "Log Request"}
          </button>
        </div>
      </form>
    </div>
  );
}
