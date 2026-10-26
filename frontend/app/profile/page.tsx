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
          <Badge className="mb-3 bg-[#e8eee8] text-[#285b4b]">Profile</Badge>
          <h1 className="text-3xl font-semibold tracking-tight text-[#202c29]">
            Account Profile
          </h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
            Your portfolio, watchlist, transaction history, and AI evidence
            trail are unique to this account.
          </p>
        </div>

        <Card className="border-[#dedfd6] bg-white text-[#202c29]">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserCircle className="h-5 w-5 text-[#285b4b]" />
              Current User
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <ProfileRow label="Name" value={user?.fullName || "Not provided"} />
            <ProfileRow label="Email" value={user?.email || "Loading..."} />
            <ProfileRow label="Role" value={user?.role || "Loading..."} />

            <div className="rounded-xl border border-emerald-400/20 bg-emerald-500/10 p-4">
              <div className="flex items-start gap-3">
                <ShieldCheck className="mt-0.5 h-5 w-5 text-emerald-800" />
                <p className="text-sm leading-6 text-emerald-800">
                  Account isolation is active for portfolio holdings,
                  transactions, watchlist rows, and AI history.
                </p>
              </div>
            </div>

            <Button
              type="button"
              onClick={handleLogout}
              data-testid="profile-logout"
              className="bg-red-500 text-[#202c29] hover:bg-red-600"
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
    <div className="rounded-xl border border-[#dedfd6] bg-[#f4f5f0] p-4">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="mt-1 break-words text-sm font-medium text-[#202c29]">
        {value}
      </p>
    </div>
  );
}
