import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import { useAsyncAction } from "../../hooks/useAsyncAction";
import { DEMO_ACCOUNTS, ROLE_LABELS, ROLE_HOME } from "../../data/users";
import Spinner from "../../components/Spinner";

export default function Login() {
  const { login } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [signingIn, runSignIn] = useAsyncAction();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  function handleSubmit(e) {
    e.preventDefault();
    runSignIn(async () => {
      const result = await login(email, password);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setError("");
      showToast(`Welcome back, ${result.user.name}.`);
      const from = location.state?.from;
      const isAllowedDest =
        from &&
        (from.startsWith("/track") ||
          (result.user.role === "business" && from.startsWith("/business")) ||
          (result.user.role === "rider" && from.startsWith("/rider")) ||
          (result.user.role === "customer" && from.startsWith("/customer")));
      const dest = isAllowedDest ? from : ROLE_HOME[result.user.role] || "/";
      navigate(dest, { replace: true });
    });
  }

  function fillDemo(account) {
    setEmail(account.email);
    setPassword(account.password);
    setError("");
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <p className="eyebrow">Sign in</p>
        <h1 className="page-title" style={{ marginBottom: 6 }}>
          Welcome back
        </h1>
        <p className="page-sub" style={{ marginBottom: 26 }}>
          Log in to manage orders, deliveries, or track your package.
        </p>

        <form onSubmit={handleSubmit} className="form">
          <label className="field">
            <span className="field-label">Email</span>
            <input
              type="email"
              className="field-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              disabled={signingIn}
              required
            />
          </label>

          <label className="field">
            <span className="field-label">Password</span>
            <input
              type="password"
              className="field-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              disabled={signingIn}
              required
            />
          </label>

          {error && <p className="form-error">{error}</p>}

          <button type="submit" className="btn btn-amber" style={{ width: "100%", justifyContent: "center" }} disabled={signingIn}>
            {signingIn ? (
              <>
                <Spinner size={14} />
                Signing in…
              </>
            ) : (
              "Log in"
            )}
          </button>
        </form>

        <div className="auth-demo">
          <p className="field-label" style={{ marginBottom: 8 }}>
            Quick demo login
          </p>
          <div className="demo-chips">
            {DEMO_ACCOUNTS.map((account) => (
              <button key={account.role} type="button" className="demo-chip" onClick={() => fillDemo(account)} disabled={signingIn}>
                {ROLE_LABELS[account.role]}
              </button>
            ))}
          </div>
        </div>

        <p className="auth-switch">
          New here? <Link to="/register">Create an account</Link>
        </p>
      </div>
    </div>
  );
}
