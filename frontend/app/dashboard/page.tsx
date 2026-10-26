"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowUpRight,
  ArrowRight,
  RefreshCw,
  Search,
  Users,
  BriefcaseBusiness,
  MessageSquareText,
} from "lucide-react";
import { AppShell } from "@/components/app-shell";
import {
  getDashboardData,
  getCommitteeRuns,
  getStoredUser,
  resetDemoData,
  CommitteeRun,
} from "@/lib/api";
type Dashboard = {
  portfolioCount: number;
  totalReports: number;
  needsReviewReports: number;
  latestAgentRuns: {
    id: number;
    question: string;
    ticker: string | null;
    createdAt: string;
  }[];
  latestMarketSnapshots: {
    ticker: string;
    companyName: string;
    currentPrice: number | null;
    fetchedAt: string;
  }[];
  latestReports: {
    id: string;
    ticker: string;
    company: string;
    status: string;
    created: string;
  }[];
};
export default function DashboardPage() {
  const [data, setData] = useState<Dashboard | null>(null);
  const [runs, setRuns] = useState<CommitteeRun[]>([]);
  const [error, setError] = useState("");
  const [researchError, setResearchError] = useState("");
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [resetting, setResetting] = useState(false);
  const [resetMessage, setResetMessage] = useState("");
  async function load() {
    setLoading(true);
    setError("");
    setResearchError("");
    const results = await Promise.allSettled([
      getDashboardData(),
      getCommitteeRuns(),
    ]);
    if (results[0].status === "fulfilled") setData(results[0].value);
    else
      setError(
        "Your overview couldn't load. Check your connection and try again.",
      );
    if (results[1].status === "fulfilled") setRuns(results[1].value);
    else setResearchError("Saved committee reviews are unavailable right now.");
    setLoading(false);
  }
  useEffect(() => {
    setName(getStoredUser()?.fullName?.split(" ")[0] || "");
    void load();
  }, []);
  async function reset() {
    if (
      !window.confirm(
        "Reset your development demo holdings, transactions and watchlist?",
      )
    )
      return;
    setResetting(true);
    try {
      const r = await resetDemoData();
      setResetMessage(r.message);
      await load();
    } catch {
      setResetMessage(
        "Reset unavailable. Demo resets are disabled outside development.",
      );
    } finally {
      setResetting(false);
    }
  }
  return (
    <AppShell>
      <div className="fc-overview">
        <header className="fc-page-heading">
          <div>
            <p className="fc-kicker">YOUR RESEARCH DESK</p>
            <h1>A clearer view{name ? `, ${name}` : ""}.</h1>
            <p>Pick up a thesis. Explore a company. See the bigger picture.</p>
          </div>
          <button
            className="fc-outline-button"
            onClick={load}
            disabled={loading}
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
            Refresh
          </button>
        </header>
        {error && (
          <div role="alert" className="fc-error">
            {error}
          </div>
        )}
        <div className="fc-overview-top">
          <section className="fc-feature-panel">
            <p className="fc-kicker">THE INVESTMENT COMMITTEE</p>
            <h2>
              Good research invites
              <br />
              <em>a counterargument.</em>
            </h2>
            <p>
              Bring a question to the table. Compare perspectives, inspect the
              evidence, and keep your own judgment.
            </p>
            <Link href="/committee" className="fc-solid-button">
              Start a committee review <ArrowUpRight size={16} />
            </Link>
            <div className="fc-feature-rule">
              <span>01 &nbsp; Evidence</span>
              <span>02 &nbsp; Debate</span>
              <span>03 &nbsp; Review</span>
            </div>
          </section>
          <section className="fc-panel fc-at-glance">
            <div className="fc-panel-heading">
              <h2>At a glance</h2>
              <span className="fc-kicker">SAVED RECORDS</span>
            </div>
            {[
              {
                label: "Your portfolio positions",
                value: data?.portfolioCount,
                href: "/portfolio",
              },
              {
                label: "Recent committee reviews",
                value: researchError ? undefined : runs.length,
                href: "/committee",
              },
              {
                label: "Workspace reports",
                value: data?.totalReports,
                href: "/reports",
              },
              {
                label: "Reports awaiting review",
                value: data?.needsReviewReports,
                href: "/governance",
              },
            ].map((x) => (
              <Link key={x.label} href={x.href} className="fc-stat-row">
                <span>{x.label}</span>
                <strong>
                  {loading ? (
                    <span className="fc-skeleton" />
                  ) : (
                    (x.value ?? "—")
                  )}
                </strong>
                <ArrowUpRight size={15} />
              </Link>
            ))}
            <p className="fc-small-note">
              Committee count covers your latest 50 reviews. Legacy reports
              belong to the shared workspace.
            </p>
          </section>
        </div>
        <div className="fc-quick-actions">
          {[
            {
              title: "Research a company",
              sub: "Open market context",
              href: "/stock/AAPL",
              icon: Search,
            },
            {
              title: "Inspect your portfolio",
              sub: "Holdings & scenarios",
              href: "/portfolio",
              icon: BriefcaseBusiness,
            },
            {
              title: "Ask a focused question",
              sub: "Portfolio-aware answers",
              href: "/ask",
              icon: MessageSquareText,
            },
          ].map((x) => (
            <Link href={x.href} key={x.href}>
              <x.icon size={20} strokeWidth={1.5} />
              <div>
                <strong>{x.title}</strong>
                <span>{x.sub}</span>
              </div>
              <ArrowUpRight size={17} />
            </Link>
          ))}
        </div>
        <div className="fc-overview-bottom">
          <section className="fc-panel">
            <div className="fc-panel-heading">
              <div>
                <p className="fc-kicker">CONTINUE EXPLORING</p>
                <h2>Your research notebook</h2>
              </div>
              <Link href="/committee" className="fc-text-link">
                View all <ArrowRight size={14} />
              </Link>
            </div>
            {researchError ? (
              <p role="status" className="fc-small-note">
                {researchError}
              </p>
            ) : loading ? (
              <div className="fc-loading-rows" aria-label="Loading research">
                <span />
                <span />
                <span />
              </div>
            ) : runs.length ? (
              runs.slice(0, 5).map((r) => (
                <Link
                  href={`/committee?run=${r.id}`}
                  className="fc-research-row"
                  key={r.id}
                >
                  <span className="fc-record-symbol">
                    <Users size={17} />
                  </span>
                  <div>
                    <strong>{r.question}</strong>
                    <span>
                      {r.ticker || "Portfolio"} ·{" "}
                      {new Date(r.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <span className={`fc-status-pill ${r.status}`}>
                    {r.status}
                  </span>
                  <ArrowUpRight size={15} />
                </Link>
              ))
            ) : (
              <div className="fc-empty-state">
                <span className="fc-empty-index">01</span>
                <h3>Your first question belongs here.</h3>
                <p>
                  Saved reviews keep the evidence, assumptions and opposing
                  perspectives together.
                </p>
                <Link href="/committee" className="fc-text-link">
                  Begin a review <ArrowRight size={15} />
                </Link>
              </div>
            )}
          </section>
          <section className="fc-panel">
            <div className="fc-panel-heading">
              <div>
                <p className="fc-kicker">SHARED LIBRARY</p>
                <h2>Latest reports</h2>
              </div>
              <Link href="/reports" aria-label="View reports">
                <ArrowUpRight size={18} />
              </Link>
            </div>
            {loading ? (
              <div className="fc-loading-rows">
                <span />
                <span />
              </div>
            ) : data?.latestReports.length ? (
              data.latestReports.slice(0, 4).map((r) => (
                <Link
                  href={`/reports/${encodeURIComponent(r.id)}`}
                  key={r.id}
                  className="fc-library-row"
                >
                  <span className="fc-ticker">{r.ticker}</span>
                  <div>
                    <strong>{r.company}</strong>
                    <span>{r.status}</span>
                  </div>
                  <ArrowUpRight size={15} />
                </Link>
              ))
            ) : (
              <div className="fc-empty-state">
                <h3>A place for deeper reading.</h3>
                <p>
                  Available company reports will appear here. Start with stock
                  research to explore the underlying records.
                </p>
                <Link href="/stock/AAPL" className="fc-text-link">
                  Explore a company ↗
                </Link>
              </div>
            )}
          </section>
        </div>
        <details className="fc-dev-tools">
          <summary>Development demo tools</summary>
          <p>
            Resetting replaces your demo portfolio, transactions and watchlist.
            Available in development only.
          </p>
          <button
            className="fc-outline-button"
            data-testid="dashboard-reset-demo"
            disabled={resetting}
            onClick={reset}
          >
            {resetting ? "Resetting…" : "Reset demo data"}
          </button>
          {resetMessage && (
            <p role="status" data-testid="dashboard-reset-status">
              {resetMessage}
            </p>
          )}
        </details>
      </div>
    </AppShell>
  );
}
