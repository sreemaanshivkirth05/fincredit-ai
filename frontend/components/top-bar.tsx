"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Search, LogOut, ChevronRight } from "lucide-react";
import { AuthUser, getStoredUser, logoutUser } from "@/lib/api";
const names: Record<string, string> = {
  dashboard: "Overview",
  stock: "Stock research",
  portfolio: "Portfolio",
  watchlist: "Watchlist",
  committee: "Investment committee",
  ask: "Ask FinCredit",
  reports: "Reports",
  governance: "Governance",
  profile: "Profile",
  settings: "Settings",
  admin: "Administration",
  company: "Company",
};
export function TopBar() {
  const router = useRouter();
  const path = usePathname();
  const [query, setQuery] = useState("");
  const [user, setUser] = useState<AuthUser | null>(null);
  const [error, setError] = useState("");
  useEffect(() => setUser(getStoredUser()), []);
  return (
    <header className="fc-topbar">
      <div className="fc-breadcrumb">
        Workspace <ChevronRight size={13} />
        <strong>{names[path.split("/")[1]] ?? "Research"}</strong>
      </div>
      <form
        className="fc-search"
        onSubmit={(e) => {
          e.preventDefault();
          const t = query.trim().toUpperCase();
          if (/^[A-Z0-9.^=-]{1,20}$/.test(t)) {
            setError("");
            router.push(`/stock/${encodeURIComponent(t)}`);
          } else setError("Enter a valid stock ticker.");
        }}
      >
        <Search size={16} />
        <input
          aria-label="Search stock ticker"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search a ticker…"
          maxLength={20}
        />
        <button type="submit" aria-label="Search">
          ↵
        </button>
        {error && (
          <span role="alert" className="fc-search-error">
            {error}
          </span>
        )}
      </form>
      <Link href="/profile" className="fc-avatar" aria-label="Open profile">
        {(user?.fullName || user?.email || "U").charAt(0).toUpperCase()}
      </Link>
      <button
        className="fc-signout"
        aria-label="Sign out"
        onClick={async () => {
          await logoutUser();
          router.replace("/login");
        }}
      >
        <LogOut size={17} />
      </button>
    </header>
  );
}
