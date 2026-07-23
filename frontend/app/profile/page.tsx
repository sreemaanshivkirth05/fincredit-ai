"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut, ShieldCheck, UserCircle } from "lucide-react";

import { AppShell } from "@/components/app-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AuthUser, getCurrentUser, logoutUser } from "@/lib/api";

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);

  useEffect(() => {
    getCurrentUser().then(setUser).catch(() => setUser(null));
  }, []);

  async function handleLogout() {
    await logoutUser();
    router.replace("/login");
  }

  return (
    <AppShell>
      <div className="space-y-6">
        <div>
          <Badge className="mb-3 bg-blue-500/15 text-blue-200">Profile</Badge>
          <h1 className="text-3xl font-semibold tracking-tight text-white">
            Account Profile
          </h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-400">
            Your portfolio, watchlist, transaction history, and AI evidence
            trail are unique to this account.
          </p>
        </div>

        <Card className="border-white/10 bg-white/[0.04] text-white">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserCircle className="h-5 w-5 text-blue-300" />
              Current User
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <ProfileRow label="Name" value={user?.fullName || "Not provided"} />
            <ProfileRow label="Email" value={user?.email || "Loading..."} />
            <ProfileRow label="Role" value={user?.role || "Loading..."} />

            <div className="rounded-2xl border border-emerald-400/20 bg-emerald-500/10 p-4">
              <div className="flex items-start gap-3">
                <ShieldCheck className="mt-0.5 h-5 w-5 text-emerald-300" />
                <p className="text-sm leading-6 text-emerald-100">
                  Account isolation is active for portfolio holdings,
                  transactions, watchlist rows, and AI history.
                </p>
              </div>
            </div>

            <Button
              type="button"
              onClick={handleLogout}
              data-testid="profile-logout"
              className="bg-red-500 text-white hover:bg-red-600"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </Button>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}

function ProfileRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="mt-1 break-words text-sm font-medium text-white">
        {value}
      </p>
    </div>
  );
}
