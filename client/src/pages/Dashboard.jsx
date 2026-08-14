import { useEffect, useState } from "react";
import {
  Bar,
  BarChart,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { api } from "../api.js";
import Panel from "../components/Panel.jsx";
import StatCard from "../components/StatCard.jsx";
import { LoyaltyBadge, BloodGroupChip } from "../components/Badges.jsx";

const PIE_COLORS = ["#e8264c", "#ff5470", "#f97316", "#f59e0b", "#22c55e", "#06b6d4", "#6366f1", "#a855f7"];
const URGENCY_COLORS = { CRITICAL: "#ef4444", HIGH: "#f97316", MEDIUM: "#f59e0b", LOW: "#38bdf8" };
const TREND_COLOR = (t) => (t > 0 ? "text-emerald-400" : t < 0 ? "text-red-400" : "text-slate-400");

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .getDashboard()
      .then(setData)
      .catch((e) => setError(e.message));
  }, []);

  if (error) return <ErrorState message={error} />;
  if (!data) return <LoadingState />;

  const { stats, bloodGroupDistribution, urgencyBreakdown, infrastructure, leaderboard, demandForecast } = data;

  return (
    <div className="mx-auto max-w-7xl px-6 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold text-white">🩸 Command Hub</h1>
        <p className="mt-1 text-sm text-slate-500">
          Emergency Blood Request Analytics • Stack: <span className="font-semibold text-blood-400">Node + Firebase</span>
        </p>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        <StatCard icon="👥" label="Registered Donors" value={stats.registeredDonors} />
        <StatCard icon="✅" label="Currently Eligible" value={stats.currentlyEligible} accent="text-emerald-400" />
        <StatCard icon="🏥" label="Total Requests" value={stats.totalRequests} />
        <StatCard icon="🚨" label="Active Emergencies" value={stats.activeEmergencies} accent="text-red-400" />
        <StatCard icon="📩" label="Alerts Sent" value={stats.alertsSent} />
        <StatCard icon="🎯" label="Donor Response Rate" value={`${stats.donorResponseRate}%`} accent="text-blood-400" />
      </div>

      <div className="mb-6 grid grid-cols-1 gap-5 lg:grid-cols-2">
        <Panel title="Blood Group Distribution" subtitle="Registered donors by blood group">
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie
                data={bloodGroupDistribution}
                dataKey="donors"
                nameKey="bloodGroup"
                innerRadius={60}
                outerRadius={95}
                paddingAngle={2}
              >
                {bloodGroupDistribution.map((entry, i) => (
                  <Cell key={entry.bloodGroup} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{ background: "#0d1425", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12 }}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="mt-2 flex flex-wrap justify-center gap-3">
            {bloodGroupDistribution.map((e, i) => (
              <div key={e.bloodGroup} className="flex items-center gap-1.5 text-xs text-slate-400">
                <span className="h-2.5 w-2.5 rounded-full" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                {e.bloodGroup} ({e.donors})
              </div>
            ))}
          </div>
        </Panel>

        <Panel title="Request Urgency Breakdown" subtitle="Active + historical requests by urgency">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={urgencyBreakdown}>
              <XAxis dataKey="urgency" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
              <Tooltip
                cursor={{ fill: "rgba(255,255,255,0.04)" }}
                contentStyle={{ background: "#0d1425", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12 }}
              />
              <Bar dataKey="count" radius={[8, 8, 0, 0]}>
                {urgencyBreakdown.map((e) => (
                  <Cell key={e.urgency} fill={URGENCY_COLORS[e.urgency]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Panel>
      </div>

      <Panel title="☁️ Infrastructure Status" subtitle="What this deployment is running on" className="mb-6">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {infrastructure.map((i) => (
            <div key={i.category} className="rounded-xl border border-white/5 bg-white/[0.02] p-3">
              <div className="text-[10px] font-bold uppercase tracking-wider text-blood-400">{i.category}</div>
              <div className="mt-1 flex items-center gap-1.5 text-sm text-slate-200">
                <span className="h-2 w-2 rounded-full bg-emerald-400" /> {i.service}
              </div>
            </div>
          ))}
        </div>
      </Panel>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <Panel title="🏆 Gamification & Loyalty" subtitle="Top Donors">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="text-xs uppercase tracking-wide text-slate-500">
                <th className="pb-2 font-medium">Donor</th>
                <th className="pb-2 font-medium">Badge</th>
                <th className="pb-2 font-medium text-right">Points</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {leaderboard.map((d) => (
                <tr key={d.name}>
                  <td className="py-2.5">
                    <div className="font-semibold text-white">{d.name}</div>
                    <BloodGroupChip value={d.bloodGroup} />
                  </td>
                  <td className="py-2.5">
                    <LoyaltyBadge value={d.badge} />
                  </td>
                  <td className="py-2.5 text-right font-mono text-slate-300">{d.points}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>

        <Panel title="📈 Demand Forecasting" subtitle="Predictive Analytics">
          <div className="grid grid-cols-2 gap-3">
            {demandForecast.map((f) => (
              <div key={f.bloodGroup} className="rounded-xl border border-white/5 bg-white/[0.02] p-3">
                <div className="mb-1 flex items-center justify-between">
                  <BloodGroupChip value={f.bloodGroup} />
                  <span className={`text-xs font-bold ${TREND_COLOR(f.trend)}`}>
                    {f.trend > 0 ? "+" : ""}
                    {f.trend}%
                  </span>
                </div>
                <div className="text-[11px] uppercase tracking-wide text-slate-500">Proj. Need</div>
                <div className="text-lg font-extrabold text-white">{f.projectedUnits} units</div>
                <span
                  className={`badge mt-1 ${
                    f.priority === "CRITICAL"
                      ? "bg-red-500/15 text-red-400"
                      : f.priority === "HIGH"
                      ? "bg-orange-500/15 text-orange-400"
                      : f.priority === "MEDIUM"
                      ? "bg-amber-500/15 text-amber-400"
                      : "bg-sky-500/15 text-sky-400"
                  }`}
                >
                  {f.priority}
                </span>
              </div>
            ))}
          </div>
        </Panel>
      </div>
    </div>
  );
}

function LoadingState() {
  return <div className="flex h-full items-center justify-center text-slate-500">Loading command hub…</div>;
}

function ErrorState({ message }) {
  return (
    <div className="flex h-full items-center justify-center text-red-400">
      Failed to load dashboard: {message}
    </div>
  );
}
