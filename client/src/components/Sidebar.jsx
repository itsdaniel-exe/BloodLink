import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

const NAV_ITEMS = [
  { to: "/dashboard", icon: "🩸", title: "Command Hub", subtitle: "System & Analytics Overview" },
  { to: "/requests", icon: "🏥", title: "Hospital Requests", subtitle: "Emergency Blood Requests" },
  { to: "/inventory", icon: "📦", title: "Hospital Inventory", subtitle: "Manage Blood Stock" },
  { to: "/ml-insights", icon: "🧠", title: "AI Predictor", subtitle: "ML Donor Scoring" },
  { to: "/assistant", icon: "💬", title: "GenAI Intercom", subtitle: "Data Assistant (RAG)" },
];

const STACK = ["Node.js + Express", "Local JSON store", "Firebase Authentication", "Firebase Cloud Messaging"];

export default function Sidebar() {
  const { user, logout, firebaseConfigured } = useAuth();
  const navigate = useNavigate();

  async function onLogout() {
    await logout();
    navigate("/");
  }

  return (
    <aside className="flex h-full w-72 shrink-0 flex-col border-r border-white/5 bg-ink-950/80 px-4 py-6">
      <NavLink to="/" className="mb-8 flex items-center gap-2 px-2">
        <span className="text-2xl">🩸</span>
        <div>
          <div className="text-lg font-extrabold tracking-tight text-white">BloodLink</div>
          <div className="text-[11px] font-medium uppercase tracking-wider text-blood-400">
            Emergency Alert System
          </div>
        </div>
      </NavLink>

      <nav className="flex flex-1 flex-col gap-1">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `group flex items-center gap-3 rounded-xl px-3 py-2.5 transition ${
                isActive
                  ? "bg-blood-500/15 text-white shadow-[inset_0_0_0_1px_rgba(232,38,76,0.35)]"
                  : "text-slate-400 hover:bg-white/5 hover:text-slate-200"
              }`
            }
          >
            <span className="text-xl">{item.icon}</span>
            <div className="min-w-0">
              <div className="truncate text-sm font-semibold">{item.title}</div>
              <div className="truncate text-[11px] text-slate-500 group-hover:text-slate-400">{item.subtitle}</div>
            </div>
          </NavLink>
        ))}
      </nav>

      {firebaseConfigured && user && (
        <div className="mb-3 flex items-center justify-between gap-2 rounded-xl border border-white/5 bg-white/[0.02] px-3 py-2">
          <div className="min-w-0">
            <div className="text-[10px] uppercase tracking-wide text-slate-500">Signed in</div>
            <div className="truncate text-xs font-semibold text-slate-300">{user.email}</div>
          </div>
          <button onClick={onLogout} className="shrink-0 text-xs font-semibold text-slate-500 hover:text-blood-400">
            Log out
          </button>
        </div>
      )}
      {!firebaseConfigured && (
        <div className="mb-3 rounded-xl border border-amber-500/20 bg-amber-500/5 px-3 py-2 text-[11px] text-amber-400">
          ⚠ Firebase not configured — console is unprotected
        </div>
      )}

      <div className="rounded-xl border border-white/5 bg-white/[0.02] p-3">
        <div className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
          ☁️ Free & Open Stack
        </div>
        <div className="flex flex-col gap-1.5">
          {STACK.map((s) => (
            <div key={s} className="flex items-center gap-2 text-xs text-slate-400">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              {s}
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
}
