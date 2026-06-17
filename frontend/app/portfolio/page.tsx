"use client";

import type React from "react";
import Link from "next/link";
import { useEffect, useState } from "react";

import {
  AlertTriangle,
  ArrowUpRight,
  BarChart3,
  BriefcaseBusiness,
  DollarSign,
  Gauge,
  PieChart,
  Plus,
  ShieldCheck,
} from "lucide-react";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart as RechartsPieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { AppShell } from "@/components/app-shell";
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
import { getPortfolioData } from "@/lib/api";

type Holding = {
  ticker: string;
  company: string;
  shares: number;
  avgPrice: number;
  value: number;
  weight: number;
  sector: string;
  risk: string;
  score: number;
  sentiment: string;
};

type PortfolioApiData = {
  totalValue: number;
  overallRisk: number;
  highRiskExposure: number;
  holdingsCount: number;
  holdings: Holding[];
  message: string;
};

const holdings: Holding[] = [
  {
    ticker: "MSFT",
    company: "Microsoft Corp.",
    shares: 5,
    avgPrice: 410,
    value: 2245,
    weight: 34,
    sector: "Technology",
    risk: "Low",
    score: 28,
    sentiment: "Positive",
  },
  {
    ticker: "NVDA",
    company: "NVIDIA Corp.",
    shares: 3,
    avgPrice: 125,
    value: 2130,
    weight: 31,
    sector: "Semiconductors",
    risk: "Medium",
    score: 54,
    sentiment: "Positive",
  },
  {
    ticker: "TSLA",
    company: "Tesla Inc.",
    shares: 2,
    avgPrice: 220,
    value: 1430,
    weight: 21,
    sector: "Automotive",
    risk: "High",
    score: 78,
    sentiment: "Mixed",
  },
  {
    ticker: "JPM",
    company: "JPMorgan Chase",
    shares: 4,
    avgPrice: 190,
    value: 960,
    weight: 14,
    sector: "Financials",
    risk: "Low",
    score: 33,
    sentiment: "Neutral",
  },
];

const sectorAllocation = [
  { name: "Technology", value: 34 },
  { name: "Semiconductors", value: 31 },
  { name: "Automotive", value: 21 },
  { name: "Financials", value: 14 },
];

const riskByHolding = [
  { ticker: "MSFT", score: 28 },
  { ticker: "NVDA", score: 54 },
  { ticker: "TSLA", score: 78 },
  { ticker: "JPM", score: 33 },
];

const alerts = [
  {
    title: "Concentration Risk",
    description:
      "65% of portfolio value is concentrated in technology and semiconductor exposure.",
    severity: "Medium",
  },
  {
    title: "High-Risk Holding",
    description:
      "TSLA has the highest credit risk score in your portfolio at 78/100.",
    severity: "High",
  },
  {
    title: "News Sentiment Watch",
    description:
      "Negative sentiment increased for TSLA over the last 30 days.",
    severity: "Medium",
  },
];

export default function PortfolioPage() {
  const [portfolioData, setPortfolioData] = useState<PortfolioApiData | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState("");

  useEffect(() => {
    async function loadPortfolioData() {
      try {
        const data = await getPortfolioData();
        setPortfolioData(data);
      } catch (error) {
        console.error(error);
        setApiError("Backend portfolio API is not connected.");
      } finally {
        setLoading(false);
      }
    }

    loadPortfolioData();
  }, []);

  const activeHoldings = portfolioData?.holdings ?? holdings;

  const totalValue =
    portfolioData?.totalValue ??
    activeHoldings.reduce((sum, h) => sum + h.value, 0);

  const overallRisk = portfolioData?.overallRisk ?? 57;
  const highRiskExposure = portfolioData?.highRiskExposure ?? 21;
  const holdingsCount = portfolioData?.holdingsCount ?? activeHoldings.length;

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <Badge className="mb-3 bg-blue-500/15 text-blue-200">
              Portfolio Workspace
            </Badge>
            <h1 className="text-3xl font-semibold tracking-tight">
              My Portfolio
            </h1>
            <p className="mt-2 text-sm text-slate-400">
              Track holdings, sector exposure, concentration risk, credit risk,
              and AI-generated portfolio alerts.
            </p>

            {loading && (
              <p className="mt-2 text-xs text-blue-300">
                Loading backend portfolio data...
              </p>
            )}

            {!loading && portfolioData && (
              <p className="mt-2 text-xs text-emerald-300">
                Backend connected: {portfolioData.message}
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
              Run Portfolio Scan
            </Button>
            <Button className="bg-blue-500 hover:bg-blue-600">
              <Plus className="mr-2 h-4 w-4" />
              Add Holding
            </Button>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          <MetricCard
            title="Portfolio Value"
            value={`$${totalValue.toLocaleString()}`}
            change="+4.8% month"
            icon={<DollarSign className="h-5 w-5 text-emerald-300" />}
          />
          <MetricCard
            title="Overall Risk"
            value={`${overallRisk} / 100`}
            change="Moderate"
            icon={<Gauge className="h-5 w-5 text-amber-300" />}
          />
          <MetricCard
            title="Holdings"
            value={String(holdingsCount)}
            change="Active"
            icon={<BriefcaseBusiness className="h-5 w-5 text-blue-300" />}
          />
          <MetricCard
            title="High-Risk Exposure"
            value={`${highRiskExposure}%`}
            change="TSLA"
            icon={<AlertTriangle className="h-5 w-5 text-red-300" />}
          />
        </div>

        <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <Card className="border-white/10 bg-white/[0.04] text-white">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PieChart className="h-5 w-5 text-blue-300" />
                Sector Allocation
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[320px]">
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsPieChart>
                    <Pie
                      data={sectorAllocation}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={70}
                      outerRadius={110}
                      paddingAngle={4}
                    >
                      {sectorAllocation.map((_, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={
                            ["#60a5fa", "#34d399", "#f59e0b", "#a78bfa"][
                              index
                            ]
                          }
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#0f172a",
                        border: "1px solid rgba(255,255,255,0.1)",
                        borderRadius: "12px",
                        color: "white",
                      }}
                    />
                  </RechartsPieChart>
                </ResponsiveContainer>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                {sectorAllocation.map((s) => (
                  <div
                    key={s.name}
                    className="rounded-xl border border-white/10 bg-black/20 p-3"
                  >
                    <p className="text-sm text-slate-400">{s.name}</p>
                    <p className="mt-1 text-lg font-semibold">{s.value}%</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="border-white/10 bg-white/[0.04] text-white">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-emerald-300" />
                Risk by Holding
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[320px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={riskByHolding}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey="ticker" stroke="#94a3b8" />
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
                      dataKey="score"
                      fill="#60a5fa"
                      radius={[8, 8, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="rounded-2xl border border-amber-400/20 bg-amber-500/10 p-4">
                <p className="text-sm font-medium text-amber-100">
                  AI Portfolio Insight
                </p>
                <p className="mt-2 text-sm leading-6 text-slate-300">
                  Your highest risk comes from TSLA, while your largest
                  concentration is in MSFT and NVDA. The system recommends
                  monitoring technology exposure and running a downside scenario.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="border-white/10 bg-white/[0.04] text-white">
          <CardHeader>
            <CardTitle>Holdings</CardTitle>
          </CardHeader>

          <CardContent>
            <Table>
              <TableHeader>
                <TableRow className="border-white/10">
                  <TableHead className="text-slate-400">Ticker</TableHead>
                  <TableHead className="text-slate-400">Company</TableHead>
                  <TableHead className="text-slate-400">Sector</TableHead>
                  <TableHead className="text-slate-400">Value</TableHead>
                  <TableHead className="text-slate-400">Weight</TableHead>
                  <TableHead className="text-slate-400">Risk</TableHead>
                  <TableHead className="text-slate-400">Sentiment</TableHead>
                  <TableHead className="text-slate-400">Action</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {activeHoldings.map((h) => (
                  <TableRow key={h.ticker} className="border-white/10">
                    <TableCell className="font-medium text-white">
                      {h.ticker}
                    </TableCell>
                    <TableCell className="text-slate-300">
                      {h.company}
                    </TableCell>
                    <TableCell className="text-slate-300">
                      {h.sector}
                    </TableCell>
                    <TableCell className="text-slate-300">
                      ${h.value.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-slate-300">
                      {h.weight}%
                    </TableCell>
                    <TableCell>
                      <RiskBadge risk={h.risk} />
                    </TableCell>
                    <TableCell className="text-slate-300">
                      {h.sentiment}
                    </TableCell>
                    <TableCell>
                      <Link href={`/company/${h.ticker}`}>
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-white/10 bg-white/5 text-white hover:bg-white/10"
                        >
                          Analyze
                          <ArrowUpRight className="ml-2 h-3.5 w-3.5" />
                        </Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
          <Card className="border-white/10 bg-white/[0.04] text-white">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-red-300" />
                Portfolio Alerts
              </CardTitle>
            </CardHeader>

            <CardContent className="space-y-3">
              {alerts.map((alert) => (
                <div
                  key={alert.title}
                  className="rounded-2xl border border-white/10 bg-black/20 p-4"
                >
                  <div className="flex items-center justify-between">
                    <p className="font-medium">{alert.title}</p>
                    <RiskBadge risk={alert.severity} />
                  </div>
                  <p className="mt-2 text-sm leading-6 text-slate-400">
                    {alert.description}
                  </p>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="border-white/10 bg-white/[0.04] text-white">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-emerald-300" />
                Portfolio Risk Quality
              </CardTitle>
            </CardHeader>

            <CardContent className="space-y-5">
              <QualityMetric label="Citation coverage" value={91} />
              <QualityMetric label="Data freshness" value={88} />
              <QualityMetric label="Model agreement" value={83} />
              <QualityMetric label="Report confidence" value={94} />
            </CardContent>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}

function QualityMetric({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between text-sm">
        <span className="text-slate-300">{label}</span>
        <span className="text-slate-400">{value}%</span>
      </div>
      <Progress value={value} />
    </div>
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