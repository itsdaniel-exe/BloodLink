import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../api.js";

export default function FindProfile() {
  const [phone, setPhone] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();

  async function onSubmit(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const { id } = await api.findDonorByPhone(phone);
      navigate(`/my/${id}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-ink-950 px-6 py-12">
      <form onSubmit={onSubmit} className="card w-full max-w-sm p-8">
        <Link to="/" className="mb-6 inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-300">
          ← Back to home
        </Link>
        <div className="mb-1 flex items-center gap-2">
          <span className="text-2xl">🔍</span>
          <h1 className="text-xl font-bold text-white">Find My Profile</h1>
        </div>
        <p className="mb-6 text-sm text-slate-500">
          Lost your link? Enter the phone number you registered with and we'll take you back to
          your status page.
        </p>

        <div className="mb-6">
          <label className="label">Phone Number</label>
          <input
            required
            className="input"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+91-98xxxxxxx"
          />
        </div>

        {error && (
          <p className="mb-4 text-sm text-red-400">
            {error} Not registered yet?{" "}
            <Link to="/register" className="underline">
              Sign up here
            </Link>
            .
          </p>
        )}

        <button type="submit" disabled={busy} className="btn-primary w-full justify-center">
          {busy ? "Looking…" : "Find My Profile"}
        </button>
      </form>
    </div>
  );
}
