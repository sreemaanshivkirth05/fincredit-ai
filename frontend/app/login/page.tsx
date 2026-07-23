"use client";

import { FormEvent, Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, LogIn, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { loginUser } from "@/lib/api";

const DEMO_EMAIL = "demo@fincredit.ai";
const DEMO_PASSWORD = "DemoPass123!";

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginPageFallback />}>
      <LoginPageContent />
    </Suspense>
  );
}

function LoginPageFallback() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f7faf7] px-5 text-slate-950">
      <div className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white px-5 py-4 text-sm text-slate-600 shadow-sm">
        <Loader2 className="h-4 w-4 animate-spin text-emerald-600" />
        Loading login...
      </div>
    </main>
  );
}

function LoginPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = searchParams.get("next") || "/dashboard";

  const [email, setEmail] = useState(DEMO_EMAIL);
  const [password, setPassword] = useState(DEMO_PASSWORD);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    try {
      setLoading(true);
      setError("");
      await loginUser({ email, password });
      router.replace(nextPath);
    } catch (loginError) {
      console.error(loginError);
      setError("Login failed. Check your email, password, and backend server.");
    } finally {
      setLoading(false);
    }
  }

  function fillDemoCredentials() {
    setEmail(DEMO_EMAIL);
    setPassword(DEMO_PASSWORD);
  }

  return (
    <main className="min-h-screen bg-[#f7faf7] px-5 py-8 text-slate-950">
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-6xl items-center justify-center">
        <div className="grid w-full overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl lg:grid-cols-[0.95fr_1.05fr]">
          <section className="bg-slate-950 p-8 text-white md:p-10">
            <Link href="/" className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white text-slate-950">
                <Sparkles className="h-4 w-4" />
              </div>
              <span className="font-semibold">FinCredit AI</span>
            </Link>

            <h1 className="mt-14 text-4xl font-semibold tracking-tight">
              Sign in to your paper-trading workspace.
            </h1>
            <p className="mt-4 text-sm leading-7 text-slate-400">
              Each account has a separate simulated portfolio, watchlist,
              transaction history, and AI evidence trail.
            </p>
            <div className="mt-8 rounded-lg border border-white/10 bg-white/[0.04] p-4 text-sm text-slate-300">
              <p className="font-medium text-white">Local demo account</p>
              <p className="mt-2 break-all">demo@fincredit.ai / DemoPass123!</p>
              <p className="mt-2 text-xs leading-5 text-slate-500">
                These credentials are for the local MVP demo only.
              </p>
            </div>
          </section>

          <section className="p-8 md:p-10">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-emerald-700">
              Login
            </p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight">
              Welcome back
            </h2>

            <form onSubmit={handleLogin} className="mt-8 space-y-4">
              <div>
                <label className="text-sm font-medium text-slate-700">
                  Email
                </label>
                <input
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  data-testid="login-email"
                  type="email"
                  className="mt-2 h-11 w-full rounded-lg border border-slate-300 px-3 text-sm outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700">
                  Password
                </label>
                <input
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  data-testid="login-password"
                  type="password"
                  className="mt-2 h-11 w-full rounded-lg border border-slate-300 px-3 text-sm outline-none focus:border-emerald-500"
                />
              </div>

              {error && <p className="text-sm text-red-600">{error}</p>}

              <Button
                type="submit"
                disabled={loading}
                data-testid="login-submit"
                className="w-full bg-slate-950 text-white hover:bg-slate-800"
              >
                {loading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <LogIn className="mr-2 h-4 w-4" />
                )}
                Login
              </Button>

              <Button
                type="button"
                onClick={fillDemoCredentials}
                variant="outline"
                className="w-full border-slate-300"
              >
                Use demo credentials
              </Button>
            </form>

            <p className="mt-6 text-sm text-slate-600">
              New to FinCredit AI?{" "}
              <Link href="/register" className="font-semibold text-emerald-700">
                Create an account
              </Link>
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}
