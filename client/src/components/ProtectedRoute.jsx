import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

export default function ProtectedRoute({ children }) {
  const { user, loading, firebaseConfigured } = useAuth();
  const location = useLocation();

  // If Firebase Auth isn't set up yet, let the ops console through unprotected so the app
  // stays usable during local development - the sidebar/login page make this state obvious.
  if (!firebaseConfigured) return children;

  if (loading) {
    return <div className="flex h-screen items-center justify-center bg-ink-950 text-slate-500">Checking session…</div>;
  }

  if (!user) {
    return <Navigate to="/staff-login" replace state={{ from: location.pathname }} />;
  }

  return children;
}
