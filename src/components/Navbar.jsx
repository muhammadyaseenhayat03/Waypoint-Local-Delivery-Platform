import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { ROLE_LABELS } from "../data/users";
import Spinner from "./Spinner";
import NotificationBell from "./NotificationBell";

const PUBLIC_LINKS = [
  { to: "/", label: "Home", end: true },
  { to: "/track", label: "Track delivery" },
];

const ROLE_LINKS = {
  business: [
    { to: "/business/dashboard", label: "Dashboard" },
    { to: "/business/orders", label: "Orders" },
  ],
  rider: [{ to: "/rider/dashboard", label: "Deliveries" }],
  customer: [{ to: "/customer/orders", label: "My orders" }],
};

function initials(name) {
  return name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const { user, logout, isLoggingOut } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const links = [...PUBLIC_LINKS, ...(user ? ROLE_LINKS[user.role] || [] : [])];

  async function handleLogout() {
    if (isLoggingOut) return;
    try {
      const result = await logout();
      setOpen(false);
      if (result && !result.ok) {
        showToast(result.error || "Logged out with warning.", "info");
      }
      navigate("/login", { replace: true, state: null });
    } catch (err) {
      console.error("Logout failed unexpectedly:", err);
      setOpen(false);
      showToast("Logged out.", "info");
      navigate("/login", { replace: true, state: null });
    }
  }

  return (
    <header className="navbar">
      <div className="navbar-inner">
        <NavLink to="/" className="brand" onClick={() => setOpen(false)}>
          <span className="brand-mark">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
              <path d="M4 18 L10 8 L15 14 L20 6" stroke="white" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
          Waypoint
        </NavLink>

        <nav className="nav-links">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.end}
              className={({ isActive }) => "nav-link" + (isActive ? " active" : "")}
            >
              {link.label}
            </NavLink>
          ))}
        </nav>

        <div className="navbar-right">
          {user ? (
            <div className="user-menu">
              <span className="user-chip">
                <span className="user-avatar">{initials(user.name)}</span>
                <span className="user-meta">
                  <span className="user-name">{user.name}</span>
                  <span className="user-role">{ROLE_LABELS[user.role]}</span>
                </span>
              </span>
              <button
                className="btn btn-ghost btn-sm"
                onClick={handleLogout}
                disabled={isLoggingOut}
                aria-label="Log out"
                data-testid="logout-btn"
              >
                {isLoggingOut ? <Spinner size={12} /> : "Log out"}
              </button>
            </div>
          ) : (
            <div className="auth-links">
              <NavLink to="/login" className="btn btn-ghost btn-sm">
                Log in
              </NavLink>
              <NavLink to="/register" className="btn btn-amber btn-sm">
                Sign up
              </NavLink>
            </div>
          )}
        </div>

        {user && <NotificationBell role={user.role} />}

        <button className="nav-toggle" aria-label="Toggle menu" aria-expanded={open} onClick={() => setOpen((v) => !v)}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
            {open ? (
              <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            ) : (
              <path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            )}
          </svg>
        </button>
      </div>

      <div className={"nav-mobile" + (open ? " open" : "")}>
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            end={link.end}
            onClick={() => setOpen(false)}
            className={({ isActive }) => "nav-link" + (isActive ? " active" : "")}
          >
            {link.label}
          </NavLink>
        ))}
        {user ? (
          <button
            className="btn btn-ghost btn-sm nav-mobile-action"
            onClick={handleLogout}
            disabled={isLoggingOut}
            aria-label={`Log out (${user.name})`}
            data-testid="logout-btn-mobile"
          >
            {isLoggingOut ? <Spinner size={12} /> : `Log out (${user.name})`}
          </button>
        ) : (
          <div className="nav-mobile-action auth-links">
            <NavLink to="/login" className="btn btn-ghost btn-sm" onClick={() => setOpen(false)}>
              Log in
            </NavLink>
            <NavLink to="/register" className="btn btn-amber btn-sm" onClick={() => setOpen(false)}>
              Sign up
            </NavLink>
          </div>
        )}
      </div>
    </header>
  );
}
