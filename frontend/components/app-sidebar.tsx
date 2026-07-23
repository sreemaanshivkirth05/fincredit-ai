"use client";

import type { ComponentType } from "react";
import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Activity,
  BriefcaseBusiness,
  FileText,
  Globe2,
  Home,
  LineChart,
  MessageSquareText,
  Search,
  Settings,
  ShieldCheck,
  Shield,
  UserCircle,
} from "lucide-react";
import { AuthUser, getStoredUser } from "@/lib/api";

type NavItem = {
  label: string;
  href: string;
  icon: ComponentType<{ className?: string }>;
  adminOnly?: boolean;
};

const navGroups: Array<{ label: string; items: NavItem[] }> = [
  {
    label: "Main",
    items: [
      { label: "Dashboard", href: "/dashboard", icon: Home },
      { label: "Stock Research", href: "/stock/AMZN", icon: Search },
      { label: "Portfolio", href: "/portfolio", icon: BriefcaseBusiness },
      { label: "Watchlist", href: "/watchlist", icon: Activity },
      { label: "Ask AI", href: "/ask", icon: MessageSquareText },
    ],
  },
  {
    label: "Intelligence",
    items: [
      { label: "Reports", href: "/reports", icon: FileText },
      { label: "Governance", href: "/governance", icon: ShieldCheck },
    ],
  },
  {
    label: "Admin",
    items: [
      { label: "Admin Console", href: "/admin", icon: Shield, adminOnly: true },
    ],
  },
  {
    label: "Account",
    items: [
      { label: "Profile", href: "/profile", icon: UserCircle },
      { label: "Settings", href: "/settings", icon: Settings },
      { label: "Public Homepage", href: "/", icon: Globe2 },
    ],
  },
];

const mobileItems = [
  navGroups[0].items[0],
  navGroups[0].items[2],
  navGroups[0].items[3],
  navGroups[0].items[4],
  navGroups[3].items[0],
];

export function AppSidebar() {
  const pathname = usePathname();
  const [user, setUser] = useState<AuthUser | null>(null);

  useEffect(() => {
    setUser(getStoredUser());
  }, []);

  return (
    <>
      <aside className="hidden w-72 shrink-0 border-r border-white/10 bg-[#090f1c]/95 p-5 shadow-2xl shadow-black/20 lg:block">
        <Link href="/" className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-blue-400/30 bg-blue-500/15 shadow-lg shadow-blue-950/20">
            <LineChart className="h-5 w-5 text-blue-200" />
          </div>
          <div>
            <p className="font-semibold text-white">FinCredit AI</p>
            <p className="text-xs text-slate-500">Analyst Workspace</p>
          </div>
        </Link>

        <nav className="mt-8 space-y-6">
          {navGroups.map((group) => {
            const visibleItems = group.items.filter(
              (item) => !item.adminOnly || user?.role === "admin"
            );

            if (visibleItems.length === 0) return null;

            return (
              <div key={group.label}>
                <p className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                  {group.label}
                </p>

                <div className="space-y-1.5">
                  {visibleItems.map((item) => (
                    <NavLink key={item.href} item={item} pathname={pathname} />
                  ))}
                </div>
              </div>
            );
          })}
        </nav>

        <div className="mt-8 rounded-2xl border border-emerald-400/15 bg-emerald-400/[0.06] p-4">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-emerald-300" />
            <p className="text-sm font-medium text-white">Protected Demo</p>
          </div>
          <p className="mt-2 text-xs leading-5 text-slate-400">
            Portfolio, watchlist, transactions, and AI history are scoped to the
            signed-in user.
          </p>
        </div>
      </aside>

      <nav className="fixed inset-x-3 bottom-3 z-40 rounded-2xl border border-white/10 bg-[#0a1020]/95 p-2 shadow-2xl shadow-black/40 backdrop-blur lg:hidden">
        <div className="grid grid-cols-5 gap-1">
          {mobileItems.map((item) => (
            <MobileNavLink key={item.href} item={item} pathname={pathname} />
          ))}
        </div>
      </nav>
    </>
  );
}

function isActiveRoute(item: NavItem, pathname: string) {
  if (item.href === "/stock/AMZN") return pathname.startsWith("/stock");
  if (item.href === "/") return pathname === "/";
  return pathname === item.href;
}

function NavLink({ item, pathname }: { item: NavItem; pathname: string }) {
  const Icon = item.icon;
  const active = isActiveRoute(item, pathname);

  return (
    <Link
      href={item.href}
      className={`group relative flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-all duration-200 ${
        active
          ? "border border-blue-400/20 bg-blue-500/15 text-blue-100 shadow-sm shadow-blue-950/20"
          : "border border-transparent text-slate-400 hover:border-white/10 hover:bg-white/[0.06] hover:text-white"
      }`}
    >
      {active && (
        <span className="absolute left-0 top-1/2 h-7 w-1 -translate-y-1/2 rounded-r-full bg-blue-300" />
      )}
      <span
        className={`flex h-9 w-9 items-center justify-center rounded-xl border transition-colors duration-200 ${
          active
            ? "border-blue-300/30 bg-blue-400/15 text-blue-100"
            : "border-white/10 bg-white/[0.03] text-slate-400 group-hover:text-white"
        }`}
      >
        <Icon className="h-[18px] w-[18px]" />
      </span>
      <span className="truncate font-medium">{item.label}</span>
    </Link>
  );
}

function MobileNavLink({ item, pathname }: { item: NavItem; pathname: string }) {
  const Icon = item.icon;
  const active = isActiveRoute(item, pathname);

  return (
    <Link
      href={item.href}
      className={`flex min-w-0 flex-col items-center gap-1 rounded-xl px-2 py-2 text-[11px] transition-colors duration-200 ${
        active
          ? "bg-blue-500/20 text-blue-100"
          : "text-slate-400 hover:bg-white/5 hover:text-white"
      }`}
    >
      <Icon className="h-[19px] w-[19px]" />
      <span className="max-w-full truncate">{item.label.split(" ")[0]}</span>
    </Link>
  );
}
