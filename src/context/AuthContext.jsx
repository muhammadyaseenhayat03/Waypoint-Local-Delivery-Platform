import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import * as api from "../services/api";
import { seedUsers } from "../data/users";

const AuthContext = createContext(null);
const SESSION_KEY = "waypoint.session";

function loadSession(users) {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const { id } = JSON.parse(raw);
    return users.find((u) => u.id === id) || null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }) {
  const [users, setUsers] = useState([]);
  const [user, setUser] = useState(null);

  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    api
      .getUsers()
      .then((stored) => {

        const storedIds = new Set(stored.map((u) => u.id));
        const missingSeeds = seedUsers.filter((u) => !storedIds.has(u.id));
        const merged = missingSeeds.length ? [...stored, ...missingSeeds] : stored;
        if (cancelled) return;
        setUsers(merged);
        setUser(loadSession(merged));
        if (missingSeeds.length) api.saveUsers(merged).catch(() => {});
      })
      .catch(() => {
        if (cancelled) return;
        setUsers(seedUsers);
        setUser(loadSession(seedUsers));
      })
      .finally(() => {
        if (!cancelled) setAuthLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (authLoading) return;
    if (user) {
      localStorage.setItem(SESSION_KEY, JSON.stringify({ id: user.id }));
    } else {
      localStorage.removeItem(SESSION_KEY);
    }
  }, [user, authLoading]);

  const login = useCallback(async (email, password) => {
    try {
      const match = await api.login(email, password);
      setUser(match);
      return { ok: true, user: match };
    } catch (err) {
      return { ok: false, error: err.message || "Email or password is incorrect." };
    }
  }, []);

  const register = useCallback(
    async ({ name, email, password, role }) => {
      const exists = users.some((u) => u.email.toLowerCase() === email.trim().toLowerCase());
      if (exists) return { ok: false, error: "An account with this email already exists." };
      const newUser = {
        id: `${role}-${Date.now()}`,
        name: name.trim(),
        email: email.trim(),
        password,
        role,
      };
      const next = [...users, newUser];
      try {
        await api.saveUsers(next);
        setUsers(next);
        setUser(newUser);
        return { ok: true, user: newUser };
      } catch (err) {
        return { ok: false, error: err.message || "Could not create the account. Please try again." };
      }
    },
    [users]
  );

  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const logout = useCallback(async ({ delayMs = 250, forceFail = false } = {}) => {
    setIsLoggingOut(true);
    try {
      const activeDelay = window.__simulateSlowLogout ? 1500 : delayMs;
      if (activeDelay > 0) {
        await new Promise((resolve) => setTimeout(resolve, activeDelay));
      }
      if (forceFail || window.__simulateFailLogout) {
        throw new Error("Logout operation encountered an unexpected error.");
      }
      localStorage.removeItem(SESSION_KEY);
      setUser(null);
      return { ok: true };
    } catch (err) {
      console.error("Logout error:", err);
      try {
        localStorage.removeItem(SESSION_KEY);
      } catch {

      }
      setUser(null);
      return { ok: false, error: err?.message || "Failed to log out cleanly." };
    } finally {
      setIsLoggingOut(false);
    }
  }, []);

  const value = useMemo(
    () => ({ user, users, authLoading, login, register, logout, isLoggingOut }),
    [user, users, authLoading, login, register, logout, isLoggingOut]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}
