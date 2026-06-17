"use client";

import type React from "react";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

import {
  AlertTriangle,
  BarChart3,
  Building2,
  FileSearch,
  Gauge,
  Newspaper,
  ShieldCheck,
  TrendingUp,
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
import { getCompanyData } from "@/lib/api";

type RiskTrendPoint = {
  month: string;
  risk: number;
};

type RedFlag = {
  title: string;
  severity: string;
  detail: string;
};

type FilingSignal = {
  section: string;
  signal: string;
  change: string;
};

type PeerBenchmark = {
  company: string;
  risk: number;
  profitability: number;
};

type EvidenceItem = {
  source: string;
  claim: string;
  confidence: number;
};

type CompanyApiData = {
  ticker: string;
  company: string;
  sector: string;
  risk: string;
  riskScore: number;
  sentiment: string;
  summary: string;
  marketCap: string;
  revenue: string;
  debtToEquity: string;
  profitMargin: string;
  groundingScore: number;
  unsupportedClaims: number;
  riskTrend: RiskTrendPoint[];
  redFlags: RedFlag[];
  filingSignals: FilingSignal[];
  peerBenchmark: PeerBenchmark[];
  evidence: EvidenceItem[];
  message: string;
};

const fallbackCompany: CompanyApiData = {
  ticker: "MSFT",
  company: "Microsoft Corp.",
  sector: "Technology",
  risk: "Low",
  riskScore: 28,
  sentiment: "Positive",
  summary:
    "Microsoft shows strong cloud and AI-driven revenue momentum, stable profitability, and low credit risk. Regulatory language has increased slightly, but financial strength remains high.",
  marketCap: "$3.2T",
  revenue: "$245B",
  debtToEquity: "0.32",
  profitMargin: "36.4%",
  groundingScore: 94,
  unsupportedClaims: 0,
  riskTrend: [
    { month: "Jan", risk: 24 },
    { month: "Feb", risk: 25 },
    { month: "Mar", risk: 27 },
    { month: "Apr", risk: 29 },
    { month: "May", risk: 27 },
    { month: "Jun", risk: 28 },
  ],
  redFlags: [
    {
      title: "Regulatory language expanded",
      severity: "Medium",
      detail:
        "Latest filing includes expanded discussion around AI regulation and cloud competition.",
    },
    {
      title: "Cloud growth dependence",
      severity: "Low",
      detail:
        "Revenue outlook remains partially dependent on Azure and enterprise AI demand.",
    },
  ],
  filingSignals: [
    {
      section: "Risk Factors",
      signal: "AI and cloud regulatory exposure mentioned more frequently.",
      change: "Expanded",
    },
    {
      section: "Management Discussion",
      signal: "Cloud and productivity segment strength remains consistent.",
      change: "Stable",
    },
  ],
  peerBenchmark: [
    { company: "MSFT", risk: 28, profitability: 92 },
    { company: "AAPL", risk: 49, profitability: 87 },
    { company: "GOOGL", risk: 37, profitability: 84 },
  ],
  evidence: [
    {
      source: "SEC 10-K",
      claim: "Microsoft maintains strong profitability and low leverage.",
      confidence: 96,
    },
    {
      source: "Company Facts",
      claim: "Revenue and operating income remain stable.",
      confidence: 94,
    },
  ],
  message: "Fallback company data loaded",
};

export default function CompanyPage() {
  const params = useParams();
  const ticker = String(params.ticker || "MSFT").toUpperCase();

  const [companyData, setCompanyData] = useState<CompanyApiData | null>(null);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState("");

  useEffect(() => {
    async function loadCompanyData() {
      try {
        const data = await getCompanyData(ticker);
        setCompanyData(data);
      } catch (error) {
        console.error(error);
        setApiError("Backend company API is not connected.");
      } finally {
        setLoading(false);
      }
    }

    loadCompanyData();
  }, [ticker]);

  const company = companyData ?? {
    ...fallbackCompany,
    ticker,
  };

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <Badge className="mb-3 bg-blue-500/15 text-blue-200">
              Company Intelligence
            </Badge>
            <h1 className="text-3xl font-semibold tracking-tight">
              {company.company}
            </h1>
            <p className="mt-2 text-sm text-slate-400">
              {company.ticker} · {company.sector} · {company.sentiment} sentiment
            </p>

            {loading && (
              <p className="mt-2 text-xs text-blue-300">
                Loading backend company data...
              </p>
            )}

            {!loading && companyData && (
              <p className="mt-2 text-xs text-emerald-300">
                Backend connected: {companyData.message}
              </p>
            )}

            {apiError && (
              <p className="mt-2 text-xs text-red-300">{apiError}</p>
            )}
          </div>

          <div className="flex gap-3">
            <RiskBadge risk={company.risk} />
            <Badge className="bg-white/10 text-slate-300">
              Grounding {company.groundingScore}%
            </Badge>
          </div>
        </div>

        <Card className="border-white/10 bg-white/[0.04] text-white">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="rounded-2xl bg-blue-500/15 p-3">
                <Building2 className="h-6 w-6 text-blue-300" />
              </div>

              <div>
                <p className="text-sm text-slate-400">AI Analyst Summary</p>
                <p className="mt-2 max-w-5xl text-sm leading-7 text-slate-200">
                  {company.summary}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-4 md:grid-cols-4">
          <MetricCard
            title="Risk Score"
            value={`${company.riskScore} / 100`}
            change={company.risk}
            icon={<Gauge className="h-5 w-5 text-amber-300" />}
          />
          <MetricCard
            title="Market Cap"
            value={company.marketCap}
            change="Latest"
            icon={<BarChart3 className="h-5 w-5 text-blue-300" />}
          />
          <MetricCard
            title="Revenue"
            value={company.revenue}
            change="Annual"
            icon={<TrendingUp className="h-5 w-5 text-emerald-300" />}
          />
          <MetricCard
            title="Unsupported Claims"
            value={String(company.unsupportedClaims)}
            change="Review queue"
            icon={<ShieldCheck className="h-5 w-5 text-violet-300" />}
          />
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
          <Card className="border-white/10 bg-white/[0.04] text-white">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-blue-300" />
                Risk Trend
              </CardTitle>
            </CardHeader>

            <CardContent>
              <div className="h-[310px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={company.riskTrend}>
                    <defs>
                      <linearGradient
                        id="companyRisk"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="5%"
                          stopColor="#60a5fa"
                          stopOpacity={0.45}
                        />
                        <stop
                          offset="95%"
                          stopColor="#60a5fa"
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
                      fill="url(#companyRisk)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card className="border-white/10 bg-white/[0.04] text-white">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-red-300" />
                Red Flags
              </CardTitle>
            </CardHeader>

            <CardContent className="space-y-3">
              {company.redFlags.map((flag) => (
                <div
                  key={flag.title}
                  className="rounded-2xl border border-white/10 bg-black/20 p-4"
                >
                  <div className="flex items-center justify-between">
                    <p className="font-medium">{flag.title}</p>
                    <RiskBadge risk={flag.severity} />
                  </div>
                  <p className="mt-2 text-sm leading-6 text-slate-400">
                    {flag.detail}
                  </p>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
          <Card className="border-white/10 bg-white/[0.04] text-white">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileSearch className="h-5 w-5 text-violet-300" />
                Filing Signals
              </CardTitle>
            </CardHeader>

            <CardContent className="space-y-3">
              {company.filingSignals.map((signal) => (
                <div
                  key={`${signal.section}-${signal.change}`}
                  className="rounded-2xl border border-white/10 bg-black/20 p-4"
                >
                  <div className="flex items-center justify-between">
                    <p className="font-medium">{signal.section}</p>
                    <Badge className="bg-blue-500/15 text-blue-200">
                      {signal.change}
                    </Badge>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-slate-400">
                    {signal.signal}
                  </p>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="border-white/10 bg-white/[0.04] text-white">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Newspaper className="h-5 w-5 text-emerald-300" />
                Financial Snapshot
              </CardTitle>
            </CardHeader>

            <CardContent className="grid gap-4 sm:grid-cols-2">
              <SnapshotCard title="Debt / Equity" value={company.debtToEquity} />
              <SnapshotCard title="Profit Margin" value={company.profitMargin} />
              <SnapshotCard title="Sentiment" value={company.sentiment} />
              <SnapshotCard title="Sector" value={company.sector} />
            </CardContent>
          </Card>
        </div>

        <Card className="border-white/10 bg-white/[0.04] text-white">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-blue-300" />
              Peer Benchmark
            </CardTitle>
          </CardHeader>

          <CardContent>
            <div className="h-[320px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={company.peerBenchmark}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="company" stroke="#94a3b8" />
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
                    dataKey="risk"
                    fill="#f87171"
                    radius={[8, 8, 0, 0]}
                  />
                  <Bar
                    dataKey="profitability"
                    fill="#34d399"
                    radius={[8, 8, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="border-white/10 bg-white/[0.04] text-white">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-emerald-300" />
              Evidence Panel
            </CardTitle>
          </CardHeader>

          <CardContent>
            <Table>
              <TableHeader>
                <TableRow className="border-white/10">
                  <TableHead className="text-slate-400">Source</TableHead>
                  <TableHead className="text-slate-400">Claim</TableHead>
                  <TableHead className="text-slate-400">Confidence</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {company.evidence.map((item) => (
                  <TableRow key={item.claim} className="border-white/10">
                    <TableCell className="font-medium text-white">
                      {item.source}
                    </TableCell>
                    <TableCell className="text-slate-300">
                      {item.claim}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Progress value={item.confidence} className="w-24" />
                        <span className="text-sm text-slate-300">
                          {item.confidence}%
                        </span>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
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

function SnapshotCard({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
      <p className="text-sm text-slate-400">{title}</p>
      <p className="mt-2 text-lg font-semibold text-white">{value}</p>
    </div>
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