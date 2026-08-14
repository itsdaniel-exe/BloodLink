import { useEffect, useState } from "react";
import {
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
} from "recharts";
import { api } from "../api.js";
import Panel from "../components/Panel.jsx";
import { BloodGroupChip, LabelBadge } from "../components/Badges.jsx";

export default function MlInsights() {
  const [model, setModel] = useState(null);
  const [directory, setDirectory] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([api.getModelSnapshot(), api.getScoringDirectory()])
      .then(([m, d]) => {
        setModel(m);
        setDirectory(d);
      })
      .catch((e) => setError(e.message));
  }, []);

  if (error) return <div className="flex h-full items-center justify-center text-red-400">{error}</div>;
  if (!model) return <div className="flex h-full items-center justify-center text-slate-500">Loading model…</div>;

  const radarData = model.featureImportance.map((f) => ({ feature: f.feature, weight: f.weight }));
  const avgScorePct = (model.avgScore * 100).toFixed(1);

  return (
    <div className="mx-auto max-w-7xl px-6 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold text-white">🧠 AI Predictor</h1>
        <p className="mt-1 text-sm text-slate-500">
          Embedded Logistic Regression • Donor Response Probability •{" "}
          <span className="font-semibold text-blood-400">Algorithm: SGD Classifier</span>
        </p>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-5 lg:grid-cols-2">
        <Panel title="Feature Importance (Radar)" subtitle="Relative weight of each feature in probability prediction.">
          <ResponsiveContainer width="100%" height={280}>
            <RadarChart data={radarData} outerRadius={100}>
              <PolarGrid stroke="rgba(255,255,255,0.1)" />
              <PolarAngleAxis dataKey="feature" tick={{ fill: "#94a3b8", fontSize: 11 }} />
              <PolarRadiusAxis tick={{ fill: "#475569", fontSize: 10 }} axisLine={false} />
              <Radar dataKey="weight" stroke="#e8264c" fill="#e8264c" fillOpacity={0.35} />
            </RadarChart>
          </ResponsiveContainer>
        </Panel>

        <Panel title="Model Metadata" subtitle="P(response) = σ(w₀ + Σ wᵢ·xᵢ)   •   σ(z) = 1 / (1 + e⁻ᶻ)">
          <div className="grid grid-cols-2 gap-3">
            <MetaCard label="Loss" value={model.finalLoss.toFixed(3)} />
            <MetaCard label="Epochs" value={model.epochs} />
            <MetaCard label="Avg Score" value={`${avgScorePct}%`} />
            <MetaCard label="Samples Used" value={model.samples} />
          </div>
          <div className="mt-4 rounded-xl border border-white/5 bg-white/[0.02] p-3 text-xs text-slate-500">
            {model.algorithm} • learning rate {model.learningRate} • {model.regularization} • {model.lossFunction}
          </div>
        </Panel>
      </div>

      <Panel title="Live Donor Scoring Directory" subtitle="Ranked by predicted response probability">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead>
              <tr className="text-xs uppercase tracking-wide text-slate-500">
                <th className="pb-3 font-medium">Donor</th>
                <th className="pb-3 font-medium">Blood Group</th>
                <th className="pb-3 font-medium">Predictive Label</th>
                <th className="pb-3 font-medium">P(respond=1)</th>
                <th className="pb-3 font-medium">History (Loyalty)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {directory.map((row) => (
                <tr key={row.donor.id}>
                  <td className="py-3">
                    <div className="font-semibold text-white">{row.donor.name}</div>
                    <div className="text-xs text-slate-500">{row.donor.city}</div>
                  </td>
                  <td className="py-3">
                    <BloodGroupChip value={row.donor.bloodGroup} />
                  </td>
                  <td className="py-3">
                    <LabelBadge value={row.label} />
                  </td>
                  <td className="py-3">
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 w-24 overflow-hidden rounded-full bg-white/10">
                        <div
                          className="h-full rounded-full bg-blood-500"
                          style={{ width: `${row.probability * 100}%` }}
                        />
                      </div>
                      <span className="font-mono text-slate-300">{(row.probability * 100).toFixed(1)}%</span>
                    </div>
                  </td>
                  <td className="py-3 text-slate-400">{row.donor.totalDonations} donations</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  );
}

function MetaCard({ label, value }) {
  return (
    <div className="rounded-xl border border-white/5 bg-white/[0.02] p-4 text-center">
      <div className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">{label}</div>
      <div className="mt-1 text-xl font-extrabold text-white">{value}</div>
    </div>
  );
}
