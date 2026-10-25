import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import { useAsyncAction } from "../../hooks/useAsyncAction";
import { ROLES, ROLE_LABELS, ROLE_HOME } from "../../data/users";
import Spinner from "../../components/Spinner";

const ROLE_OPTIONS = [ROLES.CUSTOMER, ROLES.BUSINESS, ROLES.RIDER];
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function Register() {
  const { register } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [submitting, runSubmit] = useAsyncAction();

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: ROLES.CUSTOMER,
  });
  const [error, setError] = useState("");

  function update(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (!form.name.trim()) {
      setError("Please enter your name.");
      return;
    }
    if (!EMAIL_PATTERN.test(form.email.trim())) {
      setError("Please enter a valid email address.");
      return;
    }
    if (form.password.length < 6) {
      setError("Password should be at least 6 characters.");
      return;
    }
    runSubmit(async () => {
      const result = await register(form);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setError("");
      showToast(`Account created — welcome, ${result.user.name}.`);
      navigate(ROLE_HOME[result.user.role] || "/", { replace: true });
    });
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <p className="eyebrow">Create account</p>
        <h1 className="page-title" style={{ marginBottom: 6 }}>
          Join Waypoint
        </h1>
        <p className="page-sub" style={{ marginBottom: 26 }}>
          Pick the role that matches how you'll use the platform.
        </p>

        <form onSubmit={handleSubmit} className="form">
          <div className="role-select">
            {ROLE_OPTIONS.map((role) => (
              <button
                key={role}
                type="button"
                className={"role-option" + (form.role === role ? " active" : "")}
                onClick={() => update("role", role)}
                disabled={submitting}
              >
                {ROLE_LABELS[role]}
              </button>
            ))}
          </div>

          <label className="field">
            <span className="field-label">Full name</span>
            <input
              className="field-input"
              value={form.name}
              onChange={(e) => update("name", e.target.value)}
              placeholder="Your name"
              disabled={submitting}
              required
            />
          </label>

          <label className="field">
            <span className="field-label">Email</span>
            <input
              type="email"
              className="field-input"
              value={form.email}
              onChange={(e) => update("email", e.target.value)}
              placeholder="you@example.com"
              disabled={submitting}
              required
            />
          </label>

          <label className="field">
            <span className="field-label">Password</span>
            <input
              type="password"
              className="field-input"
              value={form.password}
              onChange={(e) => update("password", e.target.value)}
              placeholder="At least 6 characters"
              disabled={submitting}
              required
            />
          </label>

          {error && <p className="form-error">{error}</p>}

          <button type="submit" className="btn btn-amber" style={{ width: "100%", justifyContent: "center" }} disabled={submitting}>
            {submitting ? (
              <>
                <Spinner size={14} />
                Creating account…
              </>
            ) : (
              "Create account"
            )}
          </button>
        </form>

        <p className="auth-switch">
          Already have an account? <Link to="/login">Log in</Link>
        </p>
      </div>
    </div>
  );
}
