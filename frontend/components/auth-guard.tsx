"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

import { getCurrentUser, getStoredToken } from "@/lib/api";

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    async function verifySession() {
      const token = getStoredToken();

      if (!token) {
        router.replace(`/login?next=${encodeURIComponent(pathname)}`);
        return;
      }

      try {
        await getCurrentUser();
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

  return <>{children}</>;
}
