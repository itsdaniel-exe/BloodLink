import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

export default function StaffLogin() {
  const { login, firebaseConfigured } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const redirectTo = location.state?.from || "/dashboard";

  async function onSubmit(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await login(email, password);
      navigate(redirectTo, { replace: true });
    } catch (err) {
      setError(mapAuthError(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-ink-950 px-6 py-12">
      <div className="card w-full max-w-sm p-8">
        <Link to="/" className="mb-6 inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-300">
          ← Back to home
        </Link>
        <div className="mb-1 flex items-center gap-2">
          <span className="text-2xl">🩸</span>
          <h1 className="text-xl font-bold text-white">Hospital Staff Login</h1>
        </div>
        <p className="mb-6 text-sm text-slate-500">
          Sign in to create emergency requests, send alerts, and manage inventory.
        </p>

        {!firebaseConfigured && (
          <div className="mb-6 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-300">
            Firebase Authentication isn't configured yet. See <strong>README.md → Firebase setup</strong> to enable
            staff login — it's a free, ~10 minute one-time setup.
          </div>
        )}

        <form onSubmit={onSubmit}>
          <div className="mb-4">
            <label className="label">Email</label>
            <input
              required
              type="email"
              className="input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="staff@hospital.org"
              disabled={!firebaseConfigured}
            />
          </div>
          <div className="mb-6">
            <label className="label">Password</label>
            <input
              required
              type="password"
              className="input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              disabled={!firebaseConfigured}
            />
          </div>

          {error && <p className="mb-4 text-sm text-red-400">{error}</p>}

          <button type="submit" disabled={busy || !firebaseConfigured} className="btn-primary w-full justify-center">
            {busy ? "Signing in…" : "Sign In"}
          </button>
        </form>
      </div>
    </div>
  );
}

function mapAuthError(err) {
  const code = err?.code || "";
  if (code.includes("invalid-credential") || code.includes("wrong-password") || code.includes("user-not-found")) {
    return "Incorrect email or password.";
  }
  if (code.includes("too-many-requests")) return "Too many attempts - try again shortly.";
  return err.message || "Sign-in failed.";
}
