import { useEffect, useState } from "react";
import { api } from "../api.js";
import Panel from "../components/Panel.jsx";

const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

export default function Inventory() {
  const [hospitals, setHospitals] = useState([]);
  const [minLevel, setMinLevel] = useState(8);
  const [hospitalId, setHospitalId] = useState("");
  const [levels, setLevels] = useState(null);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState("");

  useEffect(() => {
    api.getInventory().then((data) => {
      setHospitals(data.hospitals);
      setMinLevel(data.minInventoryLevel);
    });
  }, []);

  useEffect(() => {
    if (!hospitalId) return setLevels(null);
    api.getHospitalInventory(hospitalId).then((data) => setLevels(data.levels));
  }, [hospitalId]);

  function bump(bg, delta) {
    setLevels((l) => ({ ...l, [bg]: Math.max(0, (l[bg] || 0) + delta) }));
  }

  async function save() {
    setSaving(true);
    try {
      await api.saveHospitalInventory(hospitalId, levels);
      setToast("✅ Inventory saved.");
    } catch (e) {
      setToast(`Failed to save: ${e.message}`);
    } finally {
      setSaving(false);
      setTimeout(() => setToast(""), 3000);
    }
  }

  return (
    <div className="mx-auto max-w-5xl px-6 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold text-white">📦 Hospital Inventory</h1>
        <p className="mt-1 text-sm text-slate-500">Manage internal blood stock and monitor minimum levels.</p>
      </div>

      <Panel>
        <label className="label">Select Hospital</label>
        <select className="input mb-6 max-w-sm" value={hospitalId} onChange={(e) => setHospitalId(e.target.value)}>
          <option value="">Select a Hospital...</option>
          {hospitals.map((h) => (
            <option key={h.id} value={h.id}>
              {h.name} ({h.city})
            </option>
          ))}
        </select>

        {!hospitalId && (
          <p className="text-sm text-slate-500">Please select a hospital from the dropdown above to view and manage inventory.</p>
        )}

        {hospitalId && levels && (
          <>
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-300">Current Stock Levels (Units)</h3>
              <div className="flex items-center gap-3">
                {toast && <span className="text-xs text-emerald-400">{toast}</span>}
                <button className="btn-primary" disabled={saving} onClick={save}>
                  {saving ? "Saving…" : "Save Inventory"}
                </button>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {BLOOD_GROUPS.map((bg) => {
                const count = levels[bg] ?? 0;
                const low = count < minLevel;
                return (
                  <div key={bg} className="rounded-xl border border-white/5 bg-white/[0.02] p-4 text-center">
                    <span className={`badge mb-2 ${low ? "bg-red-500/15 text-red-400" : "bg-emerald-500/15 text-emerald-400"}`}>
                      {low ? "LOW" : "OK"}
                    </span>
                    <div className="mb-2 text-lg font-extrabold text-white">{bg}</div>
                    <div className="mb-3 text-2xl font-black text-slate-100">{count}</div>
                    <div className="flex items-center justify-center gap-2">
                      <button className="btn-secondary h-8 w-8 justify-center p-0 text-base" onClick={() => bump(bg, -1)}>
                        −
                      </button>
                      <button className="btn-secondary h-8 w-8 justify-center p-0 text-base" onClick={() => bump(bg, 1)}>
                        +
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </Panel>
    </div>
  );
}
