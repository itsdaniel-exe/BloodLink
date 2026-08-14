import { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged, signInWithEmailAndPassword, signOut } from "firebase/auth";
import { auth, firebaseConfigured } from "../firebase.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(firebaseConfigured);

  useEffect(() => {
    if (!firebaseConfigured) return;
    return onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
  }, []);

  async function login(email, password) {
    if (!firebaseConfigured) throw new Error("Firebase isn't configured yet - see README.md -> Firebase setup.");
    await signInWithEmailAndPassword(auth, email, password);
  }

  async function logout() {
    if (firebaseConfigured) await signOut(auth);
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, firebaseConfigured }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
