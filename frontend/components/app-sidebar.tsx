"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Activity,
  BriefcaseBusiness,
  FileText,
  Home,
  LineChart,
  MessageSquareText,
  Settings,
  ShieldCheck,
} from "lucide-react";

const items = [
  { label: "Dashboard", href: "/dashboard", icon: Home },
  { label: "Portfolio", href: "/portfolio", icon: BriefcaseBusiness },
  { label: "Watchlist", href: "/watchlist", icon: Activity },
  { label: "Ask FinCredit", href: "/ask", icon: MessageSquareText },
  { label: "Reports", href: "/reports", icon: FileText },
  { label: "Governance", href: "/governance", icon: ShieldCheck },
  { label: "Settings", href: "/settings", icon: Settings },
];

export function AppSidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden w-72 border-r border-white/10 bg-black/20 p-5 lg:block">
      <Link href="/" className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/20 ring-1 ring-blue-400/30">
          <LineChart className="h-5 w-5 text-blue-300" />
        </div>
        <div>
          <p className="font-semibold text-white">FinCredit AI</p>
          <p className="text-xs text-slate-500">Analyst Workspace</p>
        </div>
      </Link>

      <nav className="mt-8 space-y-2">
        {items.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition ${
                active
                  ? "bg-blue-500/15 text-blue-100"
                  : "text-slate-400 hover:bg-white/5 hover:text-white"
              }`}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-8 rounded-2xl border border-white/10 bg-white/[0.04] p-4">
        <p className="text-sm font-medium text-white">Dual-LLM Routing</p>
        <p className="mt-2 text-xs leading-5 text-slate-400">
          ChatGPT API handles final reasoning. Ollama handles local sentiment,
          red flags, and extraction.
        </p>
      </div>
    </aside>
  );
}