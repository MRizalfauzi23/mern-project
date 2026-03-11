import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../features/auth/AuthContext";
import { login } from "../features/auth/authApi";

export function LoginPage() {
  const { isAuthenticated, setSession, user } = useAuth();
  const [form, setForm] = useState({ email: "", password: "" });
  const mutation = useMutation({
    mutationFn: login,
    onSuccess: (data) => {
      setSession(data);
    }
  });

  if (isAuthenticated) {
    const redirectTo = user?.role === "admin" ? "/admin" : "/";
    return <Navigate to={redirectTo} replace />;
  }

  return (
    <div className="auth-page">
      <section className="login-shell">
        <aside className="login-hero">
          <p className="login-kicker">SISTEM REKRUTMEN</p>
          <h1>Pantau Lowongan Kerja</h1>
          <p>
            Kelola proses rekrutmen dengan mudah, mulai dari posting lowongan hingga penjadwalan wawancara, semuanya dalam satu platform yang terintegrasi.
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
            <h2>Login</h2>
           
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
