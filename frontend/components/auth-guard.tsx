"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2, ShieldAlert } from "lucide-react";

import { getCurrentUser, getStoredToken } from "@/lib/api";
import { Button } from "@/components/ui/button";

export function AuthGuard({
  children,
  requiredRole,
}: {
  children: React.ReactNode;
  requiredRole?: string;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const [accessDenied, setAccessDenied] = useState(false);

  useEffect(() => {
    async function verifySession() {
      const token = getStoredToken();

      if (!token) {
        router.replace(`/login?next=${encodeURIComponent(pathname)}`);
        return;
      }

      try {
        const user = await getCurrentUser();

        if (requiredRole && user.role !== requiredRole) {
          setAccessDenied(true);
          setChecking(false);
          return;
        }

        setAccessDenied(false);
        setChecking(false);
      } catch {
        router.replace(`/login?next=${encodeURIComponent(pathname)}`);
      }
    }

    verifySession();
  }, [pathname, router]);

  if (checking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#070B14] text-white">
        <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.04] px-5 py-4 text-sm text-slate-300">
          <Loader2 className="h-4 w-4 animate-spin text-blue-300" />
          Checking your FinCredit session...
        </div>
      </div>
    );
  }

  if (accessDenied) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#070B14] px-6 text-white">
        <div
          data-testid="admin-access-denied"
          className="max-w-lg rounded-2xl border border-amber-400/20 bg-amber-500/10 p-6"
        >
          <ShieldAlert className="h-8 w-8 text-amber-300" />
          <h1 className="mt-4 text-2xl font-semibold">Access denied</h1>
          <p className="mt-2 text-sm leading-6 text-amber-100/80">
            This page requires an admin account. Normal user data remains
            isolated and unavailable from the admin console.
          </p>
          <Link href="/dashboard">
            <Button className="mt-5 bg-amber-500 text-white hover:bg-amber-600">
              Back to Dashboard
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
