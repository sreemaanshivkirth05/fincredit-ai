"use client";

import type { ReactNode } from "react";
import Link from "next/link";

import {
  Activity,
  BarChart3,
  Bot,
  Building2,
  CheckCircle2,
  Database,
  FileText,
  Gauge,
  ShieldCheck,
  Sparkles,
  TrendingDown,
  TrendingUp,
  Users,
} from "lucide-react";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { AppShell } from "@/components/app-shell";
import { StockSearch } from "@/components/stock-search";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type DashboardMetric = {
  label: string;
  value: string;
  detail: string;
};

type DashboardReport = {
  id: string;
  ticker: string;
  company: string;
  status: string;
  grounding: number;
  created: string;
};

type DashboardAgentRun = {
  id: number;
  question: string;
  ticker: string | null;
  groundingScore: number;
  unsupportedClaims: number;
  createdAt: string;
};

type DashboardMarketSnapshot = {
  ticker: string;
  companyName: string;
  currentPrice: number | null;
  previousClose: number | null;
  marketCap: number | null;
  fetchedAt: string;
};

type DashboardSecFundamental = {
  ticker: string;
  companyName: string;
  revenue: number | null;
  netIncome: number | null;
  assets: number | null;
  liabilities: number | null;
  fiscalYear: number | null;
  filed: string | null;
  fetchedAt: string;
};

type DashboardData = {
  portfolioValue: number;
  portfolioCount: number;
  averageRiskScore: number;
  totalReports: number;
  approvedReports: number;
  needsReviewReports: number;
  rejectedReports: number;
  avgGrounding: number;
  unsupportedClaims: number;
  metrics: DashboardMetric[];
  latestReports: DashboardReport[];
  latestAgentRuns: DashboardAgentRun[];
  latestMarketSnapshots: DashboardMarketSnapshot[];
  latestSecFundamentals: DashboardSecFundamental[];
  message: string;
};

const dashboard: DashboardData = {
  portfolioValue: 0,
  portfolioCount: 0,
  averageRiskScore: 0,
  totalReports: 0,
  approvedReports: 0,
  needsReviewReports: 0,
  rejectedReports: 0,
  avgGrounding: 0,
  unsupportedClaims: 0,
  metrics: [
    {
      label: "Portfolio Value",
      value: "$0",
      detail: "Paper-trading portfolio setup is coming in the next phase",
    },
    {
      label: "Watchlist",
      value: "Phase 40B",
      detail: "Add/remove watchlist actions will be connected next",
    },
    {
      label: "Stock Research",
      value: "Live",
      detail: "Search tickers and open the new stock detail page",
    },
    {
      label: "AI Assistant",
      value: "Ready",
      detail: "Ask stock and portfolio questions from the AI page",
    },
  ],
  latestReports: [],
  latestAgentRuns: [],
  latestMarketSnapshots: [],
  latestSecFundamentals: [],
  message: "Phase 40A static dashboard loaded",
};

export default function DashboardPage() {
  const reportStatusChart = [
    {
      status: "Approved",
      count: dashboard.approvedReports,
    },
    {
      status: "Needs Review",
      count: dashboard.needsReviewReports,
    },
    {
      status: "Rejected",
      count: dashboard.rejectedReports,
    },
  ];

  const approvedRate =
    dashboard.totalReports > 0
      ? Math.round((dashboard.approvedReports / dashboard.totalReports) * 100)
      : 0;

  const needsReviewRate =
    dashboard.totalReports > 0
      ? Math.round(
          (dashboard.needsReviewReports / dashboard.totalReports) * 100
        )
      : 0;

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <Badge className="mb-3 bg-blue-500/15 text-blue-200">
              Stock Research Dashboard
            </Badge>

            <h1 className="text-3xl font-semibold tracking-tight">
              FinCredit AI Investing Sandbox
            </h1>

            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-400">
              Research stocks, understand fundamentals, ask AI questions, and
              build confidence before adding paper-trading and portfolio
              intelligence features.
            </p>

            <p className="mt-2 text-xs text-emerald-300">
              Dashboard ready: {dashboard.message}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Link href="/ask">
              <Button className="bg-violet-500 text-white hover:bg-violet-600">
                <Sparkles className="mr-2 h-4 w-4" />
                Ask FinCredit
              </Button>
            </Link>

            <Link href="/reports">
              <Button className="bg-blue-500 text-white hover:bg-blue-600">
                <FileText className="mr-2 h-4 w-4" />
                View Reports
              </Button>
            </Link>
          </div>
        </div>

        <Card className="border-white/10 bg-white/[0.04] text-white">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <TrendingUp className="h-5 w-5 text-emerald-300" />
              Explore Stocks
            </CardTitle>
          </CardHeader>

          <CardContent>
            <p className="mb-3 text-sm text-slate-400">
              Search a ticker such as AAPL, MSFT, NVDA, or TSLA to open the new
              beginner-friendly stock research page with price, chart, market
              stats, SEC fundamentals, and AI actions.
            </p>

            <StockSearch />
          </CardContent>
        </Card>

        <div className="grid gap-4 md:grid-cols-4">
          {dashboard.metrics.map((metric, index) => (
            <MetricCard
              key={metric.label}
              title={metric.label}
              value={metric.value}
              detail={metric.detail}
              icon={getMetricIcon(index)}
            />
          ))}
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          <MiniSummaryCard
            title="Approved Reports"
            value={String(dashboard.approvedReports)}
            detail={`${approvedRate}% of total reports`}
            icon={<CheckCircle2 className="h-5 w-5 text-emerald-300" />}
          />

          <MiniSummaryCard
            title="Needs Review"
            value={String(dashboard.needsReviewReports)}
            detail={`${needsReviewRate}% waiting for analyst review`}
            icon={<Gauge className="h-5 w-5 text-amber-300" />}
          />

          <MiniSummaryCard
            title="Rejected Reports"
            value={String(dashboard.rejectedReports)}
            detail="Reports rejected during review"
            icon={<ShieldCheck className="h-5 w-5 text-red-300" />}
          />

          <MiniSummaryCard
            title="Paper Trading"
            value="Next"
            detail="Portfolio buy/sell simulation comes after watchlist"
            icon={<Users className="h-5 w-5 text-violet-300" />}
          />
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <Card className="border-white/10 bg-white/[0.04] text-white">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-blue-300" />
                Latest AI Reports
              </CardTitle>
            </CardHeader>

            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow className="border-white/10">
                    <TableHead className="text-slate-400">Report</TableHead>
                    <TableHead className="text-slate-400">Ticker</TableHead>
                    <TableHead className="text-slate-400">Status</TableHead>
                    <TableHead className="text-slate-400">
                      Grounding
                    </TableHead>
                    <TableHead className="text-slate-400">Action</TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {dashboard.latestReports.map((report) => (
                    <TableRow key={report.id} className="border-white/10">
                      <TableCell>
                        <div>
                          <p className="font-medium text-white">{report.id}</p>
                          <p className="mt-1 max-w-[260px] truncate text-xs text-slate-400">
                            {report.company}
                          </p>
                        </div>
                      </TableCell>

                      <TableCell>
                        <Badge className="bg-blue-500/15 text-blue-200">
                          {report.ticker}
                        </Badge>
                      </TableCell>

                      <TableCell>
                        <StatusBadge status={report.status} />
                      </TableCell>

                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Progress value={report.grounding} className="w-20" />
                          <span className="text-sm text-slate-300">
                            {report.grounding}%
                          </span>
                        </div>
                      </TableCell>

                      <TableCell>
                        <Link href={`/reports/${report.id}`}>
                          <Button
                            size="sm"
                            className="bg-white/10 text-white hover:bg-white/20"
                          >
                            Open
                          </Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {dashboard.latestReports.length === 0 && (
                <p className="mt-4 text-sm text-slate-400">
                  Reports are still available as an advanced feature. Phase 40A
                  does not expand report/governance functionality.
                </p>
              )}
            </CardContent>
          </Card>

          <Card className="border-white/10 bg-white/[0.04] text-white">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-emerald-300" />
                Report Approval Status
              </CardTitle>
            </CardHeader>

            <CardContent>
              <div className="h-[300px] min-h-[300px] w-full min-w-0">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={reportStatusChart}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey="status" stroke="#94a3b8" />
                    <YAxis stroke="#94a3b8" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#0f172a",
                        border: "1px solid rgba(255,255,255,0.1)",
                        borderRadius: "12px",
                        color: "white",
                      }}
                    />
                    <Bar dataKey="count" fill="#60a5fa" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
          <Card className="border-white/10 bg-white/[0.04] text-white">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bot className="h-5 w-5 text-violet-300" />
                Latest LangGraph Agent Runs
              </CardTitle>
            </CardHeader>

            <CardContent className="space-y-3">
              {dashboard.latestAgentRuns.map((run) => (
                <div
                  key={run.id}
                  className="rounded-2xl border border-white/10 bg-black/20 p-4"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <Badge className="bg-violet-500/15 text-violet-200">
                        Run #{run.id}
                      </Badge>

                      <Badge className="bg-blue-500/15 text-blue-200">
                        {run.ticker ?? "Portfolio"}
                      </Badge>
                    </div>

                    <p className="text-xs text-slate-500">
                      {new Date(run.createdAt).toLocaleString()}
                    </p>
                  </div>

                  <p className="mt-3 text-sm leading-6 text-slate-300">
                    {run.question}
                  </p>

                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    <MiniMetric
                      label="Grounding"
                      value={`${run.groundingScore}%`}
                    />

                    <MiniMetric
                      label="Unsupported Claims"
                      value={String(run.unsupportedClaims)}
                    />
                  </div>
                </div>
              ))}

              {dashboard.latestAgentRuns.length === 0 && (
                <p className="text-sm text-slate-400">
                  No agent runs yet. Ask a stock question in Ask FinCredit.
                </p>
              )}
            </CardContent>
          </Card>

          <Card className="border-white/10 bg-white/[0.04] text-white">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-blue-300" />
                Latest Market Snapshots
              </CardTitle>
            </CardHeader>

            <CardContent className="space-y-3">
              {dashboard.latestMarketSnapshots.map((snapshot, index) => {
                const priceMove =
                  snapshot.currentPrice !== null &&
                  snapshot.previousClose !== null
                    ? snapshot.currentPrice - snapshot.previousClose
                    : null;

                return (
                  <div
                    key={`${snapshot.ticker}-${snapshot.fetchedAt}-${index}`}
                    className="rounded-2xl border border-white/10 bg-black/20 p-4"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <Badge className="bg-blue-500/15 text-blue-200">
                            {snapshot.ticker}
                          </Badge>

                          <p className="text-sm font-medium text-white">
                            {snapshot.companyName}
                          </p>
                        </div>

                        <p className="mt-2 text-xs text-slate-500">
                          {new Date(snapshot.fetchedAt).toLocaleString()}
                        </p>
                      </div>

                      <PriceMoveBadge value={priceMove} />
                    </div>

                    <div className="mt-4 grid gap-3 sm:grid-cols-3">
                      <MiniMetric
                        label="Current Price"
                        value={formatMoney(snapshot.currentPrice)}
                      />

                      <MiniMetric
                        label="Previous Close"
                        value={formatMoney(snapshot.previousClose)}
                      />

                      <MiniMetric
                        label="Market Cap"
                        value={formatLargeMoney(snapshot.marketCap)}
                      />
                    </div>
                  </div>
                );
              })}

              {dashboard.latestMarketSnapshots.length === 0 && (
                <p className="text-sm text-slate-400">
                  Market snapshots will appear here after later phases connect
                  dashboard storage again. For now, use stock search above.
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
          <Card className="border-white/10 bg-white/[0.04] text-white">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5 text-emerald-300" />
                Latest SEC Fundamentals
              </CardTitle>
            </CardHeader>

            <CardContent className="space-y-3">
              {dashboard.latestSecFundamentals.map((sec, index) => (
                <div
                  key={`${sec.ticker}-${sec.fetchedAt}-${index}`}
                  className="rounded-2xl border border-white/10 bg-black/20 p-4"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <Badge className="bg-emerald-500/15 text-emerald-200">
                        {sec.ticker}
                      </Badge>

                      <p className="text-sm font-medium text-white">
                        {sec.companyName}
                      </p>
                    </div>

                    <Badge className="bg-white/10 text-slate-300">
                      FY {sec.fiscalYear ?? "N/A"}
                    </Badge>
                  </div>

                  <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    <MiniMetric
                      label="Revenue"
                      value={formatLargeMoney(sec.revenue)}
                    />

                    <MiniMetric
                      label="Net Income"
                      value={formatLargeMoney(sec.netIncome)}
                    />

                    <MiniMetric
                      label="Assets"
                      value={formatLargeMoney(sec.assets)}
                    />

                    <MiniMetric
                      label="Liabilities"
                      value={formatLargeMoney(sec.liabilities)}
                    />
                  </div>

                  <p className="mt-3 text-xs text-slate-500">
                    Filed: {sec.filed ?? "N/A"} · Fetched:{" "}
                    {new Date(sec.fetchedAt).toLocaleString()}
                  </p>
                </div>
              ))}

              {dashboard.latestSecFundamentals.length === 0 && (
                <p className="text-sm text-slate-400">
                  SEC fundamentals are now shown on the new stock detail page.
                  Open a ticker from the search box to view them.
                </p>
              )}
            </CardContent>
          </Card>

          <Card className="border-white/10 bg-white/[0.04] text-white">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5 text-violet-300" />
                Product Roadmap
              </CardTitle>
            </CardHeader>

            <CardContent className="space-y-3">
              <RoadmapItem
                title="Phase 40A: Stock Research"
                detail="Create /stock/[ticker], show price, chart, market stats, SEC fundamentals, news placeholder, and AI action links."
                status="Current"
              />

              <RoadmapItem
                title="Phase 40B: Watchlist"
                detail="Connect add/remove watchlist actions from stock detail pages and create persistent watchlist state."
                status="Next"
              />

              <RoadmapItem
                title="Phase 40C: Paper Portfolio"
                detail="Add simulated buy/sell transactions, holdings, cost basis, current value, and profit/loss."
                status="Planned"
              />

              <RoadmapItem
                title="Phase 40D: Portfolio-Aware AI"
                detail="Use holdings, watchlist, market data, fundamentals, and risk signals to answer beginner investing questions."
                status="Planned"
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}

function getMetricIcon(index: number) {
  const icons = [
    <Activity key="portfolio" className="h-5 w-5 text-blue-300" />,
    <Gauge key="risk" className="h-5 w-5 text-amber-300" />,
    <TrendingUp key="stock" className="h-5 w-5 text-emerald-300" />,
    <ShieldCheck key="ai" className="h-5 w-5 text-violet-300" />,
  ];

  return icons[index] ?? icons[0];
}

function MetricCard({
  title,
  value,
  detail,
  icon,
}: {
  title: string;
  value: string;
  detail: string;
  icon: ReactNode;
}) {
  return (
    <Card className="border-white/10 bg-white/[0.04] text-white">
      <CardContent className="p-5">
        <div className="flex items-center justify-between">
          {icon}
          <Badge className="bg-white/10 text-slate-300">MVP</Badge>
        </div>

        <p className="mt-5 text-sm text-slate-400">{title}</p>
        <p className="mt-1 text-2xl font-semibold">{value}</p>
        <p className="mt-2 text-xs leading-5 text-slate-500">{detail}</p>
      </CardContent>
    </Card>
  );
}

function MiniSummaryCard({
  title,
  value,
  detail,
  icon,
}: {
  title: string;
  value: string;
  detail: string;
  icon: ReactNode;
}) {
  return (
    <Card className="border-white/10 bg-white/[0.04] text-white">
      <CardContent className="p-5">
        <div className="flex items-center justify-between">
          {icon}
          <Badge className="bg-white/10 text-slate-300">Summary</Badge>
        </div>

        <p className="mt-5 text-sm text-slate-400">{title}</p>
        <p className="mt-1 text-2xl font-semibold">{value}</p>
        <p className="mt-2 text-xs leading-5 text-slate-500">{detail}</p>
      </CardContent>
    </Card>
  );
}

function MiniMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="mt-1 break-words text-sm font-medium text-white">{value}</p>
    </div>
  );
}

function RoadmapItem({
  title,
  detail,
  status,
}: {
  title: string;
  detail: string;
  status: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
      <div className="flex items-center justify-between gap-3">
        <p className="font-medium text-white">{title}</p>
        <Badge className="bg-violet-500/15 text-violet-200">{status}</Badge>
      </div>

      <p className="mt-2 text-sm leading-6 text-slate-400">{detail}</p>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles =
    status === "Approved"
      ? "bg-emerald-500/15 text-emerald-200"
      : status === "Rejected"
        ? "bg-red-500/15 text-red-200"
        : "bg-amber-500/15 text-amber-200";

  return <Badge className={styles}>{status}</Badge>;
}

function PriceMoveBadge({ value }: { value: number | null }) {
  if (value === null) {
    return <Badge className="bg-white/10 text-slate-300">No price move</Badge>;
  }

  const isPositive = value >= 0;

  return (
    <Badge
      className={
        isPositive
          ? "bg-emerald-500/15 text-emerald-200"
          : "bg-red-500/15 text-red-200"
      }
    >
      {isPositive ? (
        <TrendingUp className="mr-1 h-3 w-3" />
      ) : (
        <TrendingDown className="mr-1 h-3 w-3" />
      )}
      {isPositive ? "+" : ""}
      {value.toFixed(2)}
    </Badge>
  );
}

function formatMoney(value: number | null) {
  if (value === null || value === undefined) {
    return "$0.00";
  }

  return `$${value.toFixed(2)}`;
}

function formatLargeMoney(value: number | null) {
  if (value === null || value === undefined) {
    return "$0";
  }

  if (value >= 1_000_000_000_000) {
    return `$${(value / 1_000_000_000_000).toFixed(2)}T`;
  }

  if (value >= 1_000_000_000) {
    return `$${(value / 1_000_000_000).toFixed(2)}B`;
  }

  if (value >= 1_000_000) {
    return `$${(value / 1_000_000).toFixed(2)}M`;
  }

  return `$${value.toLocaleString()}`;
}