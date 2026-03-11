"use client";

import { useMutation } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { FiEye, FiEyeOff, FiMail } from "react-icons/fi";
import { useRouter } from "next/navigation";
import { useAuth } from "../features/auth/AuthContext";
import { login } from "../features/auth/authApi";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";

export function LoginPage() {
  const { isAuthenticated, setSession, user } = useAuth();
  const router = useRouter();
  const [form, setForm] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const mutation = useMutation({
    mutationFn: login,
    onSuccess: (data) => {
      setSession(data);
    }
  });

  useEffect(() => {
    if (isAuthenticated) {
      const redirectTo = user?.role === "admin" ? "/admin" : "/";
      router.replace(redirectTo);
    }
  }, [isAuthenticated, router, user?.role]);

  if (isAuthenticated) return null;

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl grid md:grid-cols-[1.1fr_0.9fr] gap-0 rounded-2xl overflow-hidden bg-white shadow-[0_20px_60px_-30px_rgba(15,23,42,0.45)]">
        <div className="hidden md:block relative">
          <img
            src="https://readymadeui.com/login-image.webp"
            className="absolute inset-0 h-full w-full object-cover"
            alt="login"
          />
          <div className="absolute inset-0 bg-gradient-to-br from-slate-900/10 via-slate-900/10 to-blue-900/30" />
          <div className="relative z-10 h-full p-10 flex flex-col justify-end text-white">
            <p className="text-xs uppercase tracking-[0.2em] text-white/80">Sistem Rekrutmen</p>
            <h1 className="text-3xl font-semibold mt-3">Pantau Lowongan Kerja</h1>
            <p className="text-sm text-white/80 mt-3">
              Semua workflow rekrutmen terpusat, mulai dari posting hingga analitik.
            </p>
          </div>
        </div>

        <form
          className="p-8 md:p-10 flex flex-col justify-center"
          onSubmit={(event) => {
            event.preventDefault();
            mutation.mutate(form);
          }}
        >
          <div className="mb-8">
            <h2 className="text-2xl font-semibold text-slate-900">Sign in</h2>
            <p className="text-sm text-slate-500 mt-2">
              Masukkan email dan password untuk melanjutkan.
            </p>
          </div>

          <div className="space-y-5">
            <label className="text-sm font-medium text-slate-700">
              Email
              <div className="relative mt-2">
                <Input
                  name="email"
                  type="email"
                  required
                  className="h-12 rounded-xl border-slate-200 bg-slate-50 pl-4 pr-10 text-sm focus-visible:ring-2 focus-visible:ring-blue-600/20"
                  placeholder="admin@example.com"
                  value={form.email}
                  onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
                />
                <FiMail className="w-5 h-5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
              </div>
            </label>

            <label className="text-sm font-medium text-slate-700">
              Password
              <div className="relative mt-2">
                <Input
                  name="password"
                  type={showPassword ? "text" : "password"}
                  required
                  className="h-12 rounded-xl border-slate-200 bg-slate-50 pl-4 pr-12 text-sm focus-visible:ring-2 focus-visible:ring-blue-600/20"
                  placeholder="Enter password"
                  value={form.password}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, password: event.target.value }))
                  }
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-2 top-1/2 -translate-y-1/2"
                  onClick={() => setShowPassword((prev) => !prev)}
                  aria-label={showPassword ? "Sembunyikan password" : "Tampilkan password"}
                >
                  {showPassword ? <FiEyeOff className="text-slate-400" /> : <FiEye className="text-slate-400" />}
                </Button>
              </div>
            </label>
          </div>

          <div className="flex items-center justify-between mt-6 text-sm">
            <label className="flex items-center gap-2 text-slate-600">
              <input
                id="remember-me"
                name="remember-me"
                type="checkbox"
                className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              Remember me
            </label>
            <a href="#" className="text-blue-600 hover:underline">
              Forgot Password?
            </a>
          </div>

          <Button
            type="submit"
            className="mt-7 h-12 rounded-xl bg-blue-600 text-white hover:bg-blue-700"
            disabled={mutation.isPending}
          >
            {mutation.isPending ? "Signing in..." : "Sign in"}
          </Button>

          {mutation.isError && (
            <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
              {mutation.error?.response?.data?.message || "Login gagal. Periksa kembali akun Anda."}
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
