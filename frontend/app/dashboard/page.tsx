"use client";

import type React from "react";
import { useEffect, useState } from "react";

import {
  AlertTriangle,
  BarChart3,
  Brain,
  BriefcaseBusiness,
  FileText,
  Gauge,
  LineChart,
  ShieldCheck,
} from "lucide-react";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { AppShell } from "@/components/app-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getDashboardData } from "@/lib/api";

type DashboardApiData = {
  portfolioRisk: number;
  groundingScore: number;
  redFlags: number;
  watchlistCount: number;
  message: string;
};

const riskTrend = [
  { month: "Jan", risk: 34 },
  { month: "Feb", risk: 38 },
  { month: "Mar", risk: 42 },
  { month: "Apr", risk: 51 },
  { month: "May", risk: 46 },
  { month: "Jun", risk: 57 },
];

const sectorData = [
  { sector: "Tech", value: 68 },
  { sector: "Financials", value: 16 },
  { sector: "Healthcare", value: 9 },
  { sector: "Consumer", value: 7 },
];

const holdings = [
  {
    ticker: "TSLA",
    company: "Tesla Inc.",
    risk: "High",
    score: 78,
    sentiment: "Mixed",
    exposure: "21%",
  },
  {
    ticker: "NVDA",
    company: "NVIDIA Corp.",
    risk: "Medium",
    score: 54,
    sentiment: "Positive",
    exposure: "31%",
  },
  {
    ticker: "MSFT",
    company: "Microsoft Corp.",
    risk: "Low",
    score: 28,
    sentiment: "Positive",
    exposure: "34%",
  },
  {
    ticker: "JPM",
    company: "JPMorgan Chase",
    risk: "Low",
    score: 33,
    sentiment: "Neutral",
    exposure: "14%",
  },
];

const redFlags = [
  {
    ticker: "TSLA",
    issue: "Negative sentiment spike and margin pressure detected",
    severity: "High",
  },
  {
    ticker: "NVDA",
    issue: "Portfolio concentration risk above target threshold",
    severity: "Medium",
  },
  {
    ticker: "MSFT",
    issue: "Regulatory language expanded in latest filing",
    severity: "Medium",
  },
];

const reports = [
  {
    company: "Microsoft",
    type: "Credit Risk + Filing Analysis",
    score: "94%",
    status: "Approved",
  },
  {
    company: "Tesla",
    type: "Red Flag Review",
    score: "87%",
    status: "Needs Review",
  },
  {
    company: "NVIDIA",
    type: "Peer Benchmark",
    score: "91%",
    status: "Draft",
  },
];

export default function DashboardPage() {
  const [dashboardData, setDashboardData] = useState<DashboardApiData | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState("");

  useEffect(() => {
    async function loadDashboardData() {
      try {
        const data = await getDashboardData();
        setDashboardData(data);
      } catch (error) {
        console.error(error);
        setApiError("Backend API is not connected.");
      } finally {
        setLoading(false);
      }
    }

    loadDashboardData();
  }, []);

  const portfolioRisk = dashboardData?.portfolioRisk ?? 57;
  const groundingScore = dashboardData?.groundingScore ?? 94;
  const redFlagCount = dashboardData?.redFlags ?? 3;
  const watchlistCount = dashboardData?.watchlistCount ?? 8;

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <Badge className="mb-3 bg-blue-500/15 text-blue-200">
              Portfolio Intelligence
            </Badge>
            <h1 className="text-3xl font-semibold tracking-tight">
              Welcome back, Sreemaan
            </h1>
            <p className="mt-2 text-sm text-slate-400">
              Your portfolio risk increased this week. FinCredit AI found{" "}
              {redFlagCount} red flags and 1 new filing change.
            </p>

            {loading && (
              <p className="mt-2 text-xs text-blue-300">
                Loading backend dashboard data...
              </p>
            )}

            {!loading && dashboardData && (
              <p className="mt-2 text-xs text-emerald-300">
                Backend connected: {dashboardData.message}
              </p>
            )}

            {apiError && (
              <p className="mt-2 text-xs text-red-300">{apiError}</p>
            )}
          </div>

          <div className="flex gap-3">
            <Button
              variant="outline"
              className="border-white/10 bg-white/5 text-white hover:bg-white/10"
            >
              Generate Digest
            </Button>
            <Button className="bg-blue-500 hover:bg-blue-600">
              Run Analysis
            </Button>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          <MetricCard
            title="Portfolio Risk"
            value={`${portfolioRisk} / 100`}
            change="+12 this week"
            icon={<Gauge className="h-5 w-5 text-amber-300" />}
          />
          <MetricCard
            title="Grounding Score"
            value={`${groundingScore}%`}
            change="Evidence-backed"
            icon={<ShieldCheck className="h-5 w-5 text-emerald-300" />}
          />
          <MetricCard
            title="Red Flags"
            value={String(redFlagCount)}
            change="1 high severity"
            icon={<AlertTriangle className="h-5 w-5 text-red-300" />}
          />
          <MetricCard
            title="Watchlist"
            value={String(watchlistCount)}
            change="2 need review"
            icon={<BriefcaseBusiness className="h-5 w-5 text-blue-300" />}
          />
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.35fr_0.65fr]">
          <Card className="border-white/10 bg-white/[0.04] text-white">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <LineChart className="h-5 w-5 text-blue-300" />
                Portfolio Risk Timeline
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={riskTrend}>
                    <defs>
                      <linearGradient id="risk" x1="0" y1="0" x2="0" y2="1">
                        <stop
                          offset="5%"
                          stopColor="#3b82f6"
                          stopOpacity={0.45}
                        />
                        <stop
                          offset="95%"
                          stopColor="#3b82f6"
                          stopOpacity={0}
                        />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey="month" stroke="#94a3b8" />
                    <YAxis stroke="#94a3b8" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#0f172a",
                        border: "1px solid rgba(255,255,255,0.1)",
                        borderRadius: "12px",
                        color: "white",
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="risk"
                      stroke="#60a5fa"
                      fillOpacity={1}
                      fill="url(#risk)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card className="border-white/10 bg-white/[0.04] text-white">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-emerald-300" />
                Sector Exposure
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={sectorData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey="sector" stroke="#94a3b8" />
                    <YAxis stroke="#94a3b8" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#0f172a",
                        border: "1px solid rgba(255,255,255,0.1)",
                        borderRadius: "12px",
                        color: "white",
                      }}
                    />
                    <Bar
                      dataKey="value"
                      fill="#34d399"
                      radius={[8, 8, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <Card className="border-white/10 bg-white/[0.04] text-white">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5 text-pink-300" />
                Ask FinCredit
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="rounded-2xl border border-blue-400/20 bg-blue-500/10 p-4">
                <p className="text-sm text-blue-100">
                  Ask a portfolio or risk question
                </p>
                <div className="mt-4 flex gap-2">
                  <Input
                    className="border-white/10 bg-black/20 text-white placeholder:text-slate-500"
                    placeholder="Why did my portfolio risk increase?"
                  />
                  <Button className="bg-blue-500 hover:bg-blue-600">
                    Ask
                  </Button>
                </div>
              </div>

              <div className="mt-4 rounded-2xl border border-white/10 bg-black/20 p-4">
                <p className="text-sm font-medium">Suggested answer preview</p>
                <p className="mt-2 text-sm leading-6 text-slate-400">
                  Your portfolio risk increased mainly because TSLA moved from
                  medium to high risk, NVDA concentration rose above target, and
                  MSFT added stronger regulatory language in its latest filing.
                </p>

                <div className="mt-4 flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-white/10 bg-white/5 text-white hover:bg-white/10"
                  >
                    View Evidence
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-white/10 bg-white/5 text-white hover:bg-white/10"
                  >
                    Run Scenario
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-white/10 bg-white/5 text-white hover:bg-white/10"
                  >
                    Generate Report
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-white/10 bg-white/[0.04] text-white">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-red-300" />
                Red Flag Detector
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {redFlags.map((flag) => (
                  <div
                    key={flag.ticker}
                    className="flex items-center justify-between rounded-2xl border border-white/10 bg-black/20 p-4"
                  >
                    <div>
                      <p className="font-medium">{flag.ticker}</p>
                      <p className="mt-1 text-sm text-slate-400">
                        {flag.issue}
                      </p>
                    </div>
                    <RiskBadge risk={flag.severity} />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <Card className="border-white/10 bg-white/[0.04] text-white">
            <CardHeader>
              <CardTitle>Portfolio Holdings</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow className="border-white/10">
                    <TableHead className="text-slate-400">Ticker</TableHead>
                    <TableHead className="text-slate-400">Company</TableHead>
                    <TableHead className="text-slate-400">Risk</TableHead>
                    <TableHead className="text-slate-400">Score</TableHead>
                    <TableHead className="text-slate-400">Exposure</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {holdings.map((h) => (
                    <TableRow key={h.ticker} className="border-white/10">
                      <TableCell className="font-medium text-white">
                        {h.ticker}
                      </TableCell>
                      <TableCell className="text-slate-300">
                        {h.company}
                      </TableCell>
                      <TableCell>
                        <RiskBadge risk={h.risk} />
                      </TableCell>
                      <TableCell className="text-slate-300">
                        {h.score}
                      </TableCell>
                      <TableCell className="text-slate-300">
                        {h.exposure}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card className="border-white/10 bg-white/[0.04] text-white">
            <CardHeader>
              <CardTitle>Recent Reports</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {reports.map((report) => (
                  <div
                    key={report.company}
                    className="rounded-2xl border border-white/10 bg-black/20 p-4"
                  >
                    <div className="flex items-center justify-between">
                      <p className="font-medium">{report.company}</p>
                      <Badge className="bg-white/10 text-slate-200">
                        {report.status}
                      </Badge>
                    </div>
                    <p className="mt-1 text-sm text-slate-400">
                      {report.type}
                    </p>
                    <div className="mt-3">
                      <div className="mb-1 flex justify-between text-xs text-slate-400">
                        <span>Grounding score</span>
                        <span>{report.score}</span>
                      </div>
                      <Progress
                        value={Number(report.score.replace("%", ""))}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="border-white/10 bg-white/[0.04] text-white">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-blue-300" />
              AI Product Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-4">
              <StatusCard title="Primary LLM" value="ChatGPT API" />
              <StatusCard title="Local LLM" value="Ollama Qwen" />
              <StatusCard title="Vector Store" value="ChromaDB" />
              <StatusCard title="Audit Mode" value="Enabled" />
            </div>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}

function MetricCard({
  title,
  value,
  change,
  icon,
}: {
  title: string;
  value: string;
  change: string;
  icon: React.ReactNode;
}) {
  return (
    <Card className="border-white/10 bg-white/[0.04] text-white">
      <CardContent className="p-5">
        <div className="flex items-center justify-between">
          {icon}
          <Badge className="bg-white/10 text-slate-300">{change}</Badge>
        </div>
        <p className="mt-5 text-sm text-slate-400">{title}</p>
        <p className="mt-1 text-2xl font-semibold">{value}</p>
      </CardContent>
    </Card>
  );
}

function RiskBadge({ risk }: { risk: string }) {
  const styles =
    risk === "High"
      ? "bg-red-500/15 text-red-200"
      : risk === "Medium"
        ? "bg-amber-500/15 text-amber-200"
        : "bg-emerald-500/15 text-emerald-200";

  return <Badge className={styles}>{risk}</Badge>;
}

function StatusCard({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
      <p className="text-sm text-slate-400">{title}</p>
      <p className="mt-2 font-semibold text-white">{value}</p>
    </div>
  );
}