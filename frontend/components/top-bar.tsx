"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Bell, LogOut, Search, UserCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AuthUser, getStoredUser, logoutUser } from "@/lib/api";

export function TopBar() {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);

  useEffect(() => {
    setUser(getStoredUser());
  }, []);

  async function handleLogout() {
    await logoutUser();
    router.replace("/login");
  }

  const displayName = user?.fullName || user?.email || "User";
  const initial = displayName.charAt(0).toUpperCase();

  return (
    <header className="sticky top-0 z-20 border-b border-white/10 bg-[#070B14]/80 backdrop-blur">
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-4 sm:px-6">
        <div className="relative hidden min-w-0 max-w-md flex-1 md:block">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
          <Input
            placeholder="Search ticker, report, thesis..."
            className="border-white/10 bg-white/[0.04] pl-9 text-white placeholder:text-slate-500"
          />
        </div>

        <div className="flex min-w-0 flex-1 items-center justify-end gap-2 sm:gap-3 md:ml-4">
          <Button
            size="icon"
            variant="outline"
            className="hidden border-white/10 bg-white/[0.04] text-white hover:bg-white/10 sm:inline-flex"
          >
            <Bell className="h-4 w-4" />
          </Button>

          <Link href="/profile">
            <Button
              variant="outline"
              className="max-w-40 border-white/10 bg-white/[0.04] text-white hover:bg-white/10 sm:max-w-48"
            >
              <UserCircle className="mr-2 h-4 w-4" />
              <span className="truncate">{displayName}</span>
            </Button>
          </Link>

          <Button
            type="button"
            onClick={handleLogout}
            variant="outline"
            className="border-white/10 bg-white/[0.04] text-white hover:bg-white/10"
          >
            <LogOut className="mr-2 h-4 w-4" />
            <span className="hidden sm:inline">Logout</span>
          </Button>

          <div className="hidden h-9 w-9 items-center justify-center rounded-full bg-blue-500/20 text-sm font-semibold text-blue-100 sm:flex">
            {initial}
          </div>
        </div>
      </div>
    </header>
  );
}
