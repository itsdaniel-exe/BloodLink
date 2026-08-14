import { Link } from "react-router-dom";

const FEATURES = [
  {
    icon: "🤖",
    title: "AI-Powered Matching",
    desc: "A logistic regression model scores every donor's probability of responding, ranking them by response likelihood and proximity.",
  },
  {
    icon: "☁️",
    title: "Free & Self-Hosted",
    desc: "Built on Node.js, Express and Firebase's free tier — no paid cloud infrastructure required to run.",
  },
  {
    icon: "📩",
    title: "Smart Notifications",
    desc: "Targeted push alerts reach only the highest-probability donors first, cutting notification fatigue.",
  },
];

const STEPS = [
  { n: "01", title: "Emergency Request", desc: "A hospital submits its blood requirement in seconds." },
  { n: "02", title: "AI Processing", desc: "The matching + scoring engine runs instantly across all donors." },
  { n: "03", title: "Donor Alert", desc: "Notifications are dispatched to the best-matched donors." },
  { n: "04", title: "Connection Made", desc: "Donors respond and connect directly with the hospital." },
];

export default function Landing() {
  return (
    <div className="min-h-screen bg-ink-950 text-slate-100">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🩸</span>
          <span className="text-lg font-extrabold tracking-tight">BloodLink</span>
        </div>
        <nav className="flex items-center gap-3">
          <Link to="/register" className="btn-secondary">
            Register as Donor
          </Link>
          <Link to="/dashboard" className="btn-primary">
            Hospital Ops Console →
          </Link>
        </nav>
      </header>

      <section className="mx-auto max-w-4xl px-6 pb-16 pt-10 text-center">
        <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-xs font-medium text-slate-300">
          Real-time matching • Cloud-based • Smart alerts
        </div>
        <h1 className="text-4xl font-extrabold leading-tight tracking-tight text-white sm:text-5xl">
          A serverless, ML-powered emergency
          <span className="text-blood-500"> blood donation </span>
          system
        </h1>
        <p className="mx-auto mt-5 max-w-2xl text-slate-400">
          BloodLink predicts donor response probability using donation history, distance and
          past behavior, then routes emergency alerts to the donors most likely to respond —
          cutting response time and eliminating alert fatigue.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link to="/register" className="btn-primary text-base">
            🩸 Become a Donor
          </Link>
          <Link to="/requests" className="btn-secondary text-base">
            🏥 Log Emergency Request
          </Link>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl grid-cols-1 gap-5 px-6 pb-16 sm:grid-cols-3">
        {FEATURES.map((f) => (
          <div key={f.title} className="card p-6">
            <div className="mb-3 text-3xl">{f.icon}</div>
            <h3 className="mb-2 text-lg font-bold text-white">{f.title}</h3>
            <p className="text-sm text-slate-400">{f.desc}</p>
          </div>
        ))}
      </section>

      <section className="mx-auto max-w-6xl px-6 pb-20">
        <h2 className="mb-6 text-center text-2xl font-extrabold text-white">Workflow</h2>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-4">
          {STEPS.map((s) => (
            <div key={s.n} className="card p-5">
              <div className="mb-2 text-2xl font-black text-blood-500/70">{s.n}</div>
              <div className="mb-1 font-bold text-white">{s.title}</div>
              <div className="text-sm text-slate-400">{s.desc}</div>
            </div>
          ))}
        </div>
      </section>

      <footer className="border-t border-white/5 py-8 text-center text-xs text-slate-600">
        BloodLink — Serverless, Machine Learning-Enhanced Emergency Blood Donation & Donor Alert System
      </footer>
    </div>
  );
}
