"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2, Sparkles, UserPlus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { registerUser } from "@/lib/api";

export default function RegisterPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleRegister(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    try {
      setLoading(true);
      setError("");
      await registerUser({ email, password, fullName });
      router.replace("/dashboard");
    } catch (registerError) {
      console.error(registerError);
      setError("Could not create account. Try another email.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#f7faf7] px-5 py-8 text-slate-950">
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-xl items-center">
        <section className="w-full rounded-2xl border border-slate-200 bg-white p-8 shadow-xl md:p-10">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-950 text-white">
              <Sparkles className="h-4 w-4" />
            </div>
            <span className="font-semibold">FinCredit AI</span>
          </Link>

          <h1 className="mt-10 text-3xl font-semibold tracking-tight">
            Create your FinCredit account
          </h1>
          <p className="mt-3 text-sm leading-7 text-slate-600">
            Your simulated portfolio, watchlist, transaction history, and AI
            evidence trail stay separate from other users.
          </p>

          <form onSubmit={handleRegister} className="mt-8 space-y-4">
            <input
              value={fullName}
              onChange={(event) => setFullName(event.target.value)}
              data-testid="register-full-name"
              placeholder="Full name"
              className="h-11 w-full rounded-lg border border-slate-300 px-3 text-sm outline-none focus:border-emerald-500"
            />
            <input
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              data-testid="register-email"
              type="email"
              placeholder="Email"
              className="h-11 w-full rounded-lg border border-slate-300 px-3 text-sm outline-none focus:border-emerald-500"
            />
            <input
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              data-testid="register-password"
              type="password"
              placeholder="Password"
              className="h-11 w-full rounded-lg border border-slate-300 px-3 text-sm outline-none focus:border-emerald-500"
            />
            <input
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              data-testid="register-confirm-password"
              type="password"
              placeholder="Confirm password"
              className="h-11 w-full rounded-lg border border-slate-300 px-3 text-sm outline-none focus:border-emerald-500"
            />

            {error && <p className="text-sm text-red-600">{error}</p>}

            <Button
              type="submit"
              disabled={loading}
              data-testid="register-submit"
              className="w-full bg-slate-950 text-white hover:bg-slate-800"
            >
              {loading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <UserPlus className="mr-2 h-4 w-4" />
              )}
              Create Account
            </Button>
          </form>

          <p className="mt-6 text-sm text-slate-600">
            Already have an account?{" "}
            <Link href="/login" className="font-semibold text-emerald-700">
              Login
            </Link>
          </p>
        </section>
      </div>
    </main>
  );
}
