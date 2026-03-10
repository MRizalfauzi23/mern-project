import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../features/auth/AuthContext";
import { login } from "../features/auth/authApi";

export function LoginPage() {
  const { isAuthenticated, setSession } = useAuth();
  const [form, setForm] = useState({ email: "", password: "" });
  const mutation = useMutation({
    mutationFn: login,
    onSuccess: (data) => {
      setSession(data);
    }
  });

  if (isAuthenticated) return <Navigate to="/" replace />;

  return (
    <div className="auth-page">
      <section className="login-shell">
        <aside className="login-hero">
          <p className="login-kicker">MERN Skill Portfolio</p>
          <h1>Build, test, and present like production.</h1>
          <p>
            Sign in to manage jobs, validate auth flow, and demonstrate clean API + UI architecture.
          </p>
        </aside>
        <form
          className="login-card"
          onSubmit={(event) => {
            event.preventDefault();
            mutation.mutate(form);
          }}
        >
          <div>
            <h2>Welcome back</h2>
            <p className="muted">Use your recruiter or admin account to continue.</p>
          </div>
          <label className="field">
            <span>Email</span>
            <input
              className="input"
              placeholder="you@example.com"
              type="email"
              value={form.email}
              onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
            />
          </label>
          <label className="field">
            <span>Password</span>
            <input
              className="input"
              placeholder="Enter your password"
              type="password"
              value={form.password}
              onChange={(event) => setForm((prev) => ({ ...prev, password: event.target.value }))}
            />
          </label>
          <button className="login-btn" disabled={mutation.isPending} type="submit">
            {mutation.isPending ? "Signing in..." : "Sign in"}
          </button>
          {mutation.isError && (
            <p className="error">{mutation.error?.response?.data?.message || "Login failed"}</p>
          )}
        </form>
      </section>
    </div>
  );
}
