"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  Search,
  BriefcaseBusiness,
  Bookmark,
  MessageSquareText,
  Users,
  FileText,
  ShieldCheck,
  Settings,
  UserCircle,
  Shield,
  Menu,
  X,
  ArrowUpRight,
} from "lucide-react";
import { getStoredUser } from "@/lib/api";
const groups = [
  {
    label: "WORKSPACE",
    items: [
      { label: "Overview", href: "/dashboard", icon: Home },
      { label: "Stock research", href: "/stock/AMZN", icon: Search },
      { label: "Portfolio", href: "/portfolio", icon: BriefcaseBusiness },
      { label: "Watchlist", href: "/watchlist", icon: Bookmark },
    ],
  },
  {
    label: "RESEARCH TOOLS",
    items: [
      { label: "Investment committee", href: "/committee", icon: Users },
      { label: "Ask FinCredit", href: "/ask", icon: MessageSquareText },
      { label: "Reports", href: "/reports", icon: FileText },
      { label: "Governance", href: "/governance", icon: ShieldCheck },
    ],
  },
  {
    label: "PERSONAL",
    items: [
      { label: "Profile", href: "/profile", icon: UserCircle },
      { label: "Settings", href: "/settings", icon: Settings },
    ],
  },
];
export function AppSidebar() {
  const path = usePathname();
  const [open, setOpen] = useState(false);
  const [admin, setAdmin] = useState(false);
  useEffect(() => {
    setAdmin(getStoredUser()?.role === "admin");
  }, []);
  useEffect(() => {
    function close(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", close);
    return () => window.removeEventListener("keydown", close);
  }, []);
  const contents = (
    <>
      <Link href="/" className="fc-brand">
        <span className="fc-monogram">f.</span>
        <span>
          fincredit<span className="fc-brand-ai">AI</span>
        </span>
      </Link>
      <div className="fc-workspace-label">
        <span className="fc-workspace-dot" /> Personal workspace<span>01</span>
      </div>
      <nav aria-label="Workspace navigation">
        {groups.map((g) => (
          <div className="fc-nav-group" key={g.label}>
            <p>{g.label}</p>
            {g.items.map((i) => {
              const selected = i.href.startsWith("/stock")
                ? path.startsWith("/stock")
                : path === i.href || path.startsWith(i.href + "/");
              return (
                <Link
                  key={i.href}
                  href={i.href}
                  aria-current={selected ? "page" : undefined}
                  className={selected ? "fc-nav-link active" : "fc-nav-link"}
                  onClick={() => setOpen(false)}
                >
                  <i.icon size={17} strokeWidth={1.5} />
                  <span>{i.label}</span>
                  {selected && <span className="fc-active-dot" />}
                </Link>
              );
            })}
          </div>
        ))}
        {admin && (
          <Link
            href="/admin"
            className="fc-nav-link"
            onClick={() => setOpen(false)}
          >
            <Shield size={17} />
            Administration
          </Link>
        )}
      </nav>
      <div className="fc-sidebar-note">
        <p>Research with perspective.</p>
        <span>A paper portfolio. A real learning curve.</span>
        <Link href="/committee" onClick={() => setOpen(false)}>
          Open the committee <ArrowUpRight size={14} />
        </Link>
      </div>
      <div className="fc-sidebar-footer">FINCREDIT / RESEARCH EDITION</div>
    </>
  );
  return (
    <>
      <aside className="fc-sidebar">{contents}</aside>
      <button
        className="fc-menu-toggle"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        aria-controls="fc-mobile-nav"
        aria-label={open ? "Close navigation" : "Open navigation"}
      >
        {open ? <X size={20} /> : <Menu size={20} />}
      </button>
      {open && (
        <>
          <button
            className="fc-nav-scrim"
            aria-label="Close navigation"
            onClick={() => setOpen(false)}
          />
          <aside id="fc-mobile-nav" className="fc-mobile-sidebar">
            {contents}
          </aside>
        </>
      )}
    </>
  );
}
