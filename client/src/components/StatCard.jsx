export default function StatCard({ icon, label, value, accent = "text-white" }) {
  return (
    <div className="card flex items-center gap-3 p-4">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/5 text-xl">
        {icon}
      </div>
      <div className="min-w-0">
        <div className={`text-xl font-extrabold leading-tight ${accent}`}>{value}</div>
        <div className="truncate text-xs text-slate-500">{label}</div>
      </div>
    </div>
  );
}
