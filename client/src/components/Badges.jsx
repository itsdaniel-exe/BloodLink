const URGENCY_STYLES = {
  CRITICAL: "bg-red-500/15 text-red-400 ring-1 ring-red-500/30",
  HIGH: "bg-orange-500/15 text-orange-400 ring-1 ring-orange-500/30",
  MEDIUM: "bg-amber-500/15 text-amber-400 ring-1 ring-amber-500/30",
  LOW: "bg-sky-500/15 text-sky-400 ring-1 ring-sky-500/30",
};

const STATUS_STYLES = {
  ACTIVE: "bg-emerald-500/15 text-emerald-400 ring-1 ring-emerald-500/30",
  FULFILLED: "bg-slate-500/15 text-slate-400 ring-1 ring-slate-500/30",
};

const LABEL_STYLES = {
  HIGH: "bg-emerald-500/15 text-emerald-400 ring-1 ring-emerald-500/30",
  MEDIUM: "bg-amber-500/15 text-amber-400 ring-1 ring-amber-500/30",
  LOW: "bg-slate-500/15 text-slate-400 ring-1 ring-slate-500/30",
};

const BADGE_STYLES = {
  Platinum: "bg-cyan-500/15 text-cyan-300 ring-1 ring-cyan-500/30",
  Gold: "bg-yellow-500/15 text-yellow-300 ring-1 ring-yellow-500/30",
  Silver: "bg-slate-400/15 text-slate-300 ring-1 ring-slate-400/30",
  Bronze: "bg-orange-700/15 text-orange-400 ring-1 ring-orange-700/30",
};

export function UrgencyBadge({ value }) {
  return <span className={`badge ${URGENCY_STYLES[value] || "bg-white/10 text-slate-300"}`}>{value}</span>;
}

export function StatusBadge({ value }) {
  return <span className={`badge ${STATUS_STYLES[value] || "bg-white/10 text-slate-300"}`}>{value}</span>;
}

export function LabelBadge({ value }) {
  return <span className={`badge ${LABEL_STYLES[value] || "bg-white/10 text-slate-300"}`}>{value}</span>;
}

export function LoyaltyBadge({ value }) {
  return <span className={`badge ${BADGE_STYLES[value] || "bg-white/10 text-slate-300"}`}>🏅 {value}</span>;
}

export function BloodGroupChip({ value }) {
  return (
    <span className="badge bg-blood-500/15 text-blood-400 ring-1 ring-blood-500/30">🩸 {value}</span>
  );
}
