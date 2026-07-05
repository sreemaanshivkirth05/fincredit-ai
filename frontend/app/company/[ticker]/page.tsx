"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";

import {
  Activity,
  AlertTriangle,
  ArrowLeft,
  BarChart3,
  Building2,
  Database,
  DollarSign,
  ExternalLink,
  FileSearch,
  FileText,
  Gauge,
  Landmark,
  LineChart,
  Loader2,
  RefreshCcw,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  TrendingDown,
  TrendingUp,
} from "lucide-react";

import {
  Area,
  AreaChart,
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
import { Progress } from "@/components/ui/progress";
import {
  generateLatestReportForTicker,
  generateReportFromAgentRun,
  getAgentRunsByTicker,
  getCompanyData,
  getMarketData,
  getMarketHistory,
  getReportsByTicker,
  getSecCompanyFacts,
  getSecFundamentalsHistory,
} from "@/lib/api";

type CompanyData = {
  ticker: string;
  companyName: string;
  sector?: string;
  portfolioWeight?: number;
  riskScore?: number;
  sentiment?: string;
  summary?: string;
  keyMetrics?: {
    label: string;
    value: string;
  }[];
  riskDrivers?: {
    title: string;
    detail: string;
    severity: string;
  }[];
  evidence?: {
    source: string;
    claim: string;
    confidence: number;
  }[];
  message?: string;
};

type MarketData = {
  ticker: string;
  companyName: string;
  sector: string | null;
  currentPrice: number | null;
  previousClose: number | null;
  dayHigh: number | null;
  dayLow: number | null;
  volume: number | null;
  marketCap: number | null;
  currency: string | null;
  exchange: string | null;
  fetchedAt: string;
  message: string;
};

type MarketHistoryItem = {
  ticker: string;
  companyName: string;
  currentPrice: number | null;
  previousClose: number | null;
  dayHigh: number | null;
  dayLow: number | null;
  volume: number | null;
  marketCap: number | null;
  fetchedAt: string;
};

type MarketHistory = {
  ticker: string;
  snapshotsCount: number;
  snapshots: MarketHistoryItem[];
  message: string;
};

type SecFacts = {
  ticker: string;
  cik: string;
  companyName: string;
  revenue: number | null;
  netIncome: number | null;
  assets: number | null;
  liabilities: number | null;
  equity: number | null;
  fiscalYear: number | null;
  form: string | null;
  filed: string | null;
  source: string;
  message: string;
};

type SecHistoryItem = {
  ticker: string;
  cik: string;
  companyName: string;
  revenue: number | null;
  netIncome: number | null;
  assets: number | null;
  liabilities: number | null;
  equity: number | null;
  fiscalYear: number | null;
  form: string | null;
  filed: string | null;
  source: string;
  fetchedAt: string;
};

type SecHistory = {
  ticker: string;
  snapshotsCount: number;
  snapshots: SecHistoryItem[];
  message: string;
};

type ReportItem = {
  id: string;
  company: string;
  ticker: string;
  type: string;
  status: string;
  grounding: number;
  unsupported: number;
  model: string;
  created: string;
};

type ReportsByTicker = {
  ticker: string;
  totalReports: number;
  reports: ReportItem[];
  message: string;
};

type AgentRunItem = {
  id: number;
  question: string;
  ticker: string | null;
  answer: string;
  workflow: string;
  agentsUsed: string[];
  groundingScore: number;
  unsupportedClaims: number;
  status: string;
  riskDrivers: {
    ticker: string;
    driver: string;
    impact: string;
  }[];
  evidence: {
    source: string;
    claim: string;
    confidence: number;
  }[];
  suggestedActions: string[];
  createdAt: string;
};

type AgentRunsByTicker = {
  ticker: string;
  totalRuns: number;
  runs: AgentRunItem[];
  message: string;
};

const fallbackCompany: CompanyData = {
  ticker: "MSFT",
  companyName: "Microsoft Corporation",
  sector: "Technology",
  portfolioWeight: 32,
  riskScore: 72,
  sentiment: "Stable",
  summary:
    "Company intelligence fallback data is shown when the backend is unavailable.",
  keyMetrics: [
    { label: "Portfolio Weight", value: "32%" },
    { label: "Risk Score", value: "72" },
    { label: "Sentiment", value: "Stable" },
    { label: "Sector", value: "Technology" },
  ],
  riskDrivers: [
    {
      title: "Concentration Risk",
      detail: "Portfolio allocation is above the internal review threshold.",
      severity: "Medium",
    },
    {
      title: "Market Sensitivity",
      detail:
        "Large-cap technology exposure may be sensitive to rates and AI spend.",
      severity: "Medium",
    },
  ],
  evidence: [
    {
      source: "Portfolio DB",
      claim: "Company is part of the current tracked portfolio.",
      confidence: 90,
    },
  ],
  message: "Fallback company data loaded",
};

export default function CompanyPage() {
  const router = useRouter();
  const params = useParams();
  const ticker = String(params.ticker ?? "MSFT").toUpperCase();

  const askQuestion = `What is the risk outlook for ${ticker}? Use market data, SEC fundamentals, portfolio exposure, risk drivers, and evidence.`;
  const encodedAskQuestion = encodeURIComponent(askQuestion);

  const [companyData, setCompanyData] = useState<CompanyData | null>(null);
  const [marketData, setMarketData] = useState<MarketData | null>(null);
  const [marketHistory, setMarketHistory] = useState<MarketHistory | null>(
    null
  );
  const [secFacts, setSecFacts] = useState<SecFacts | null>(null);
  const [secHistory, setSecHistory] = useState<SecHistory | null>(null);
  const [reportsByTicker, setReportsByTicker] =
    useState<ReportsByTicker | null>(null);
  const [agentRunsByTicker, setAgentRunsByTicker] =
    useState<AgentRunsByTicker | null>(null);

  const [loadingCompany, setLoadingCompany] = useState(true);
  const [loadingMarket, setLoadingMarket] = useState(true);
  const [loadingSec, setLoadingSec] = useState(true);
  const [loadingReports, setLoadingReports] = useState(true);
  const [loadingAgentRuns, setLoadingAgentRuns] = useState(true);
  const [generatingReport, setGeneratingReport] = useState(false);
  const [generatingRunReportId, setGeneratingRunReportId] = useState<
    number | null
  >(null);

  const [apiError, setApiError] = useState("");
  const [reportMessage, setReportMessage] = useState("");

  useEffect(() => {
    async function loadCompanyPage() {
      try {
        setApiError("");
        setLoadingCompany(true);
        setLoadingMarket(true);
        setLoadingSec(true);
        setLoadingReports(true);
        setLoadingAgentRuns(true);

        const [
          companyResponse,
          marketResponse,
          marketHistoryResponse,
          secResponse,
          secHistoryResponse,
          reportsResponse,
          agentRunsResponse,
        ] = await Promise.allSettled([
          getCompanyData(ticker),
          getMarketData(ticker),
          getMarketHistory(ticker),
          getSecCompanyFacts(ticker),
          getSecFundamentalsHistory(ticker),
          getReportsByTicker(ticker),
          getAgentRunsByTicker(ticker),
        ]);

        if (companyResponse.status === "fulfilled") {
          setCompanyData(companyResponse.value);
        }

        if (marketResponse.status === "fulfilled") {
          setMarketData(marketResponse.value);
        }

        if (marketHistoryResponse.status === "fulfilled") {
          setMarketHistory(marketHistoryResponse.value);
        }

        if (secResponse.status === "fulfilled") {
          setSecFacts(secResponse.value);
        }

        if (secHistoryResponse.status === "fulfilled") {
          setSecHistory(secHistoryResponse.value);
        }

        if (reportsResponse.status === "fulfilled") {
          setReportsByTicker(reportsResponse.value);
        }

        if (agentRunsResponse.status === "fulfilled") {
          setAgentRunsByTicker(agentRunsResponse.value);
        }

        const failedRequests = [
          companyResponse,
          marketResponse,
          marketHistoryResponse,
          secResponse,
          secHistoryResponse,
          reportsResponse,
          agentRunsResponse,
        ].filter((response) => response.status === "rejected");

        if (failedRequests.length > 0) {
          setApiError(
            "Some company intelligence data could not be loaded. Check backend logs if market, SEC, report, or AI run data is missing."
          );
        }
      } catch (error) {
        console.error(error);
        setApiError("Could not load company intelligence data.");
      } finally {
        setLoadingCompany(false);
        setLoadingMarket(false);
        setLoadingSec(false);
        setLoadingReports(false);
        setLoadingAgentRuns(false);
      }
    }

    loadCompanyPage();
  }, [ticker]);

  async function handleGenerateLatestReport() {
    try {
      setGeneratingReport(true);
      setReportMessage("");
      setApiError("");

      const response = await generateLatestReportForTicker(ticker);

      setReportMessage(response.message);
      router.push(`/reports/${response.reportId}`);
    } catch (error) {
      console.error(error);
      setApiError(
        `Could not generate a report for ${ticker}. Ask FinCredit AI about ${ticker} first, then try again.`
      );
    } finally {
      setGeneratingReport(false);
    }
  }

  async function handleGenerateReportFromRun(agentRunId: number) {
    try {
      setGeneratingRunReportId(agentRunId);
      setReportMessage("");
      setApiError("");

      const response = await generateReportFromAgentRun(agentRunId);

      setReportMessage(response.message);
      router.push(`/reports/${response.reportId}`);
    } catch (error) {
      console.error(error);
      setApiError("Could not generate a report from this AI agent run.");
    } finally {
      setGeneratingRunReportId(null);
    }
  }

  const company: CompanyData = {
    ...fallbackCompany,
    ...(companyData ?? {}),
    ticker,
    companyName:
      companyData?.companyName ??
      fallbackCompany.companyName ??
      `${ticker} Company Intelligence`,
    sector: companyData?.sector ?? fallbackCompany.sector ?? "Unknown",
    portfolioWeight:
      companyData?.portfolioWeight ?? fallbackCompany.portfolioWeight ?? 0,
    riskScore: companyData?.riskScore ?? fallbackCompany.riskScore ?? 0,
    sentiment: companyData?.sentiment ?? fallbackCompany.sentiment ?? "Stable",
    summary:
      companyData?.summary ??
      fallbackCompany.summary ??
      "Company intelligence loaded.",
    riskDrivers: companyData?.riskDrivers ?? fallbackCompany.riskDrivers ?? [],
    evidence: companyData?.evidence ?? fallbackCompany.evidence ?? [],
    keyMetrics: companyData?.keyMetrics ?? fallbackCompany.keyMetrics ?? [],
  };

  const riskDrivers = company.riskDrivers ?? [];
  const evidenceItems = company.evidence ?? [];

  const priceChange =
    marketData?.currentPrice != null && marketData?.previousClose != null
      ? marketData.currentPrice - marketData.previousClose
      : null;

  const priceChangePercent =
    priceChange != null && marketData?.previousClose
      ? (priceChange / marketData.previousClose) * 100
      : null;

  const liabilitiesToAssets =
    secFacts?.liabilities != null && secFacts?.assets
      ? (secFacts.liabilities / secFacts.assets) * 100
      : null;

  const netMargin =
    secFacts?.netIncome != null && secFacts?.revenue
      ? (secFacts.netIncome / secFacts.revenue) * 100
      : null;

  const marketChartData =
    marketHistory?.snapshots
      ?.slice()
      .reverse()
      .map((snapshot) => ({
        date: new Date(snapshot.fetchedAt).toLocaleDateString(),
        price: snapshot.currentPrice ?? 0,
      })) ?? [];

  const secChartData =
    secHistory?.snapshots
      ?.slice()
      .reverse()
      .map((snapshot) => ({
        date: new Date(snapshot.fetchedAt).toLocaleDateString(),
        revenue: snapshot.revenue
          ? Math.round(snapshot.revenue / 1_000_000_000)
          : 0,
        netIncome: snapshot.netIncome
          ? Math.round(snapshot.netIncome / 1_000_000_000)
          : 0,
      })) ?? [];

  return (
    <AppShell>
      <div className="space-y-6">
        <div>
          <Link href="/portfolio">
            <Button
              type="button"
              variant="outline"
              className="mb-4 border-white/10 bg-white/[0.03] text-slate-300 hover:bg-white/10 hover:text-white"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Portfolio
            </Button>
          </Link>

          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
            <div>
              <Badge className="mb-3 bg-blue-500/15 text-blue-200">
                Company Intelligence
              </Badge>

              <h1 className="text-3xl font-semibold tracking-tight">
                {company.companyName}
              </h1>

              <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-400">
                {company.summary}
              </p>

              <div className="mt-3 flex flex-wrap items-center gap-2">
                <Badge className="bg-white/10 text-slate-300">
                  {company.ticker}
                </Badge>
                <Badge className="bg-violet-500/15 text-violet-200">
                  {company.sector}
                </Badge>
                <SentimentBadge sentiment={company.sentiment ?? "Stable"} />
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-3">
                <Link href={`/ask?question=${encodedAskQuestion}`}>
                  <Button className="bg-violet-500 text-white hover:bg-violet-600">
                    <Sparkles className="mr-2 h-4 w-4" />
                    Ask AI About {ticker}
                  </Button>
                </Link>

                <Button
                  type="button"
                  className="bg-emerald-500 text-white hover:bg-emerald-600"
                  disabled={generatingReport}
                  onClick={handleGenerateLatestReport}
                >
                  {generatingReport ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Generating
                    </>
                  ) : (
                    <>
                      <FileText className="mr-2 h-4 w-4" />
                      Generate Latest {ticker} Report
                    </>
                  )}
                </Button>

                <Link href="/reports">
                  <Button className="bg-blue-500 text-white hover:bg-blue-600">
                    <FileText className="mr-2 h-4 w-4" />
                    View Reports
                  </Button>
                </Link>

                <Link href="/governance">
                  <Button
                    variant="outline"
                    className="border-white/10 bg-white/[0.03] text-slate-300 hover:bg-white/10 hover:text-white"
                  >
                    <FileSearch className="mr-2 h-4 w-4" />
                    Generate Report from Agent Run
                  </Button>
                </Link>
              </div>

              {(loadingCompany ||
                loadingMarket ||
                loadingSec ||
                loadingReports ||
                loadingAgentRuns) && (
                <p className="mt-3 flex items-center gap-2 text-xs text-blue-300">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  Loading company, market, SEC, report, and AI run intelligence...
                </p>
              )}

              {reportMessage && (
                <p className="mt-3 text-xs text-emerald-300">
                  {reportMessage}
                </p>
              )}

              {apiError && (
                <p className="mt-3 text-xs text-red-300">{apiError}</p>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <a
                href={`https://www.sec.gov/edgar/search/#/q=${ticker}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button
                  type="button"
                  variant="outline"
                  className="border-white/10 bg-white/[0.03] text-slate-300 hover:bg-white/10 hover:text-white"
                >
                  <ExternalLink className="mr-2 h-4 w-4" />
                  SEC Search
                </Button>
              </a>

              <Button
                type="button"
                variant="outline"
                className="border-white/10 bg-white/[0.03] text-slate-300 hover:bg-white/10 hover:text-white"
                onClick={() => window.location.reload()}
              >
                <RefreshCcw className="mr-2 h-4 w-4" />
                Refresh
              </Button>
            </div>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          <MetricCard
            title="Risk Score"
            value={String(company.riskScore ?? 0)}
            change="Internal"
            icon={<ShieldAlert className="h-5 w-5 text-amber-300" />}
          />

          <MetricCard
            title="Portfolio Weight"
            value={`${company.portfolioWeight ?? 0}%`}
            change="Exposure"
            icon={<Gauge className="h-5 w-5 text-blue-300" />}
          />

          <MetricCard
            title="Current Price"
            value={formatCurrency(marketData?.currentPrice)}
            change={marketData?.currency ?? "Market"}
            icon={<DollarSign className="h-5 w-5 text-emerald-300" />}
          />

          <MetricCard
            title="Market Cap"
            value={formatLargeNumber(marketData?.marketCap)}
            change={marketData?.exchange ?? "Exchange"}
            icon={<Building2 className="h-5 w-5 text-violet-300" />}
          />
        </div>

        <Card className="border-white/10 bg-white/[0.04] text-white">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-violet-300" />
              Latest {ticker} AI Agent Runs
            </CardTitle>
          </CardHeader>

          <CardContent className="space-y-3">
            {loadingAgentRuns && (
              <p className="flex items-center gap-2 text-sm text-blue-300">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading latest AI agent runs...
              </p>
            )}

            {!loadingAgentRuns &&
              agentRunsByTicker &&
              agentRunsByTicker.runs.length > 0 &&
              agentRunsByTicker.runs.map((run) => (
                <div
                  key={run.id}
                  className="grid gap-4 rounded-2xl border border-white/10 bg-black/20 p-4 lg:grid-cols-[1fr_auto]"
                >
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge className="bg-violet-500/15 text-violet-200">
                        Run #{run.id}
                      </Badge>

                      <Badge className="bg-emerald-500/15 text-emerald-200">
                        Grounding {run.groundingScore}%
                      </Badge>

                      <Badge className="bg-amber-500/15 text-amber-200">
                        Unsupported {run.unsupportedClaims}
                      </Badge>
                    </div>

                    <p className="mt-3 text-sm font-medium leading-6 text-white">
                      {run.question}
                    </p>

                    <p className="mt-1 text-xs text-slate-500">
                      Created {new Date(run.createdAt).toLocaleString()} ·{" "}
                      {run.workflow}
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <Button
                      type="button"
                      className="bg-emerald-500 text-white hover:bg-emerald-600"
                      disabled={generatingRunReportId === run.id}
                      onClick={() => handleGenerateReportFromRun(run.id)}
                    >
                      {generatingRunReportId === run.id ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Generating
                        </>
                      ) : (
                        <>
                          <FileText className="mr-2 h-4 w-4" />
                          Generate Report
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              ))}

            {!loadingAgentRuns &&
              (!agentRunsByTicker || agentRunsByTicker.runs.length === 0) && (
                <div className="rounded-2xl border border-white/10 bg-black/20 p-5">
                  <p className="text-sm leading-6 text-slate-400">
                    No AI agent runs found for {ticker} yet. Click Ask AI About{" "}
                    {ticker}, run the question, then return to this page.
                  </p>
                </div>
              )}
          </CardContent>
        </Card>

        <Card className="border-white/10 bg-white/[0.04] text-white">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-blue-300" />
              Latest {ticker} Reports
            </CardTitle>
          </CardHeader>

          <CardContent className="space-y-3">
            {loadingReports && (
              <p className="flex items-center gap-2 text-sm text-blue-300">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading latest reports...
              </p>
            )}

            {!loadingReports &&
              reportsByTicker &&
              reportsByTicker.reports.length > 0 &&
              reportsByTicker.reports.map((report) => (
                <div
                  key={report.id}
                  className="grid gap-4 rounded-2xl border border-white/10 bg-black/20 p-4 lg:grid-cols-[1fr_auto]"
                >
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge className="bg-blue-500/15 text-blue-200">
                        {report.id}
                      </Badge>
                      <StatusBadge status={report.status} />
                      <Badge className="bg-violet-500/15 text-violet-200">
                        {report.type}
                      </Badge>
                    </div>

                    <p className="mt-3 font-medium text-white">
                      {report.company}
                    </p>

                    <p className="mt-1 text-sm text-slate-400">
                      Created {report.created} · Grounding {report.grounding}% ·{" "}
                      Unsupported claims {report.unsupported}
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <Link href={`/reports/${report.id}`}>
                      <Button
                        type="button"
                        className="bg-blue-500 text-white hover:bg-blue-600"
                      >
                        Open Report
                      </Button>
                    </Link>
                  </div>
                </div>
              ))}

            {!loadingReports &&
              (!reportsByTicker || reportsByTicker.reports.length === 0) && (
                <div className="rounded-2xl border border-white/10 bg-black/20 p-5">
                  <p className="text-sm leading-6 text-slate-400">
                    No reports found for {ticker} yet. Ask FinCredit AI about{" "}
                    {ticker}, then generate a report from the answer.
                  </p>
                </div>
              )}
          </CardContent>
        </Card>

        <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
          <Card className="border-white/10 bg-white/[0.04] text-white">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-emerald-300" />
                Live Market Snapshot
              </CardTitle>
            </CardHeader>

            <CardContent className="space-y-4">
              {marketData ? (
                <>
                  <div className="grid gap-4 md:grid-cols-2">
                    <MiniMetric
                      label="Current Price"
                      value={formatCurrency(marketData.currentPrice)}
                    />
                    <MiniMetric
                      label="Previous Close"
                      value={formatCurrency(marketData.previousClose)}
                    />
                    <MiniMetric
                      label="Day High"
                      value={formatCurrency(marketData.dayHigh)}
                    />
                    <MiniMetric
                      label="Day Low"
                      value={formatCurrency(marketData.dayLow)}
                    />
                    <MiniMetric
                      label="Volume"
                      value={formatLargeNumber(marketData.volume, false)}
                    />
                    <MiniMetric
                      label="Market Cap"
                      value={formatLargeNumber(marketData.marketCap)}
                    />
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-slate-400">Daily Move</p>
                      {priceChange != null && priceChange >= 0 ? (
                        <TrendingUp className="h-5 w-5 text-emerald-300" />
                      ) : (
                        <TrendingDown className="h-5 w-5 text-red-300" />
                      )}
                    </div>

                    <p className="mt-2 text-2xl font-semibold text-white">
                      {priceChange != null
                        ? `${priceChange >= 0 ? "+" : ""}${priceChange.toFixed(
                            2
                          )}`
                        : "N/A"}
                    </p>

                    <p className="mt-1 text-sm text-slate-400">
                      {priceChangePercent != null
                        ? `${
                            priceChangePercent >= 0 ? "+" : ""
                          }${priceChangePercent.toFixed(
                            2
                          )}% from previous close`
                        : "Price movement unavailable"}
                    </p>
                  </div>

                  <p className="text-xs text-slate-500">
                    Fetched at:{" "}
                    {marketData.fetchedAt
                      ? new Date(marketData.fetchedAt).toLocaleString()
                      : "N/A"}
                  </p>
                </>
              ) : (
                <EmptyState text="Market data is not available yet. Refresh the page or check the backend market API." />
              )}
            </CardContent>
          </Card>

          <Card className="border-white/10 bg-white/[0.04] text-white">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Landmark className="h-5 w-5 text-blue-300" />
                SEC Fundamentals
              </CardTitle>
            </CardHeader>

            <CardContent className="space-y-4">
              {secFacts ? (
                <>
                  <div className="grid gap-4 md:grid-cols-2">
                    <MiniMetric
                      label="Revenue"
                      value={formatLargeNumber(secFacts.revenue)}
                    />
                    <MiniMetric
                      label="Net Income"
                      value={formatLargeNumber(secFacts.netIncome)}
                    />
                    <MiniMetric
                      label="Assets"
                      value={formatLargeNumber(secFacts.assets)}
                    />
                    <MiniMetric
                      label="Liabilities"
                      value={formatLargeNumber(secFacts.liabilities)}
                    />
                    <MiniMetric
                      label="Equity"
                      value={formatLargeNumber(secFacts.equity)}
                    />
                    <MiniMetric
                      label="Fiscal Year"
                      value={secFacts.fiscalYear?.toString() ?? "N/A"}
                    />
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <RatioCard
                      label="Liabilities / Assets"
                      value={
                        liabilitiesToAssets != null
                          ? `${liabilitiesToAssets.toFixed(1)}%`
                          : "N/A"
                      }
                      progress={liabilitiesToAssets ?? 0}
                    />

                    <RatioCard
                      label="Net Margin"
                      value={
                        netMargin != null ? `${netMargin.toFixed(1)}%` : "N/A"
                      }
                      progress={netMargin ?? 0}
                    />
                  </div>

                  <p className="text-xs text-slate-500">
                    Source: {secFacts.source} · Form: {secFacts.form ?? "N/A"} ·
                    Filed: {secFacts.filed ?? "N/A"}
                  </p>
                </>
              ) : (
                <EmptyState text="SEC fundamentals are not available yet. Try refreshing or check the SEC endpoint." />
              )}
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
          <Card className="min-w-0 border-white/10 bg-white/[0.04] text-white">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <LineChart className="h-5 w-5 text-emerald-300" />
                Market Snapshot History
              </CardTitle>
            </CardHeader>

            <CardContent>
              {marketChartData.length > 0 ? (
                <div className="h-[300px] min-h-[300px] min-w-0 w-full overflow-hidden">
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={marketChartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                      <XAxis dataKey="date" stroke="#94a3b8" />
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
                        dataKey="price"
                        stroke="#34d399"
                        fill="#34d399"
                        fillOpacity={0.15}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <EmptyState text="Market history will appear after snapshots are stored." />
              )}
            </CardContent>
          </Card>

          <Card className="min-w-0 border-white/10 bg-white/[0.04] text-white">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-violet-300" />
                SEC Fundamentals History
              </CardTitle>
            </CardHeader>

            <CardContent>
              {secChartData.length > 0 ? (
                <div className="h-[300px] min-h-[300px] min-w-0 w-full overflow-hidden">
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={secChartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                      <XAxis dataKey="date" stroke="#94a3b8" />
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
                        dataKey="revenue"
                        stroke="#818cf8"
                        fill="#818cf8"
                        fillOpacity={0.15}
                      />
                      <Area
                        type="monotone"
                        dataKey="netIncome"
                        stroke="#34d399"
                        fill="#34d399"
                        fillOpacity={0.08}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <EmptyState text="SEC history will appear after fundamentals snapshots are stored." />
              )}
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
          <Card className="border-white/10 bg-white/[0.04] text-white">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-amber-300" />
                Risk Drivers
              </CardTitle>
            </CardHeader>

            <CardContent className="space-y-3">
              {riskDrivers.length > 0 ? (
                riskDrivers.map((risk, index) => (
                  <div
                    key={`${risk.title}-${index}`}
                    className="rounded-2xl border border-white/10 bg-black/20 p-4"
                  >
                    <div className="flex items-center justify-between gap-4">
                      <p className="font-medium text-white">{risk.title}</p>
                      <SeverityBadge severity={risk.severity} />
                    </div>

                    <p className="mt-2 text-sm leading-6 text-slate-400">
                      {risk.detail}
                    </p>
                  </div>
                ))
              ) : (
                <EmptyState text="No risk drivers are available for this company yet." />
              )}
            </CardContent>
          </Card>

          <Card className="border-white/10 bg-white/[0.04] text-white">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5 text-emerald-300" />
                Evidence
              </CardTitle>
            </CardHeader>

            <CardContent className="space-y-3">
              {evidenceItems.length > 0 ? (
                evidenceItems.map((item, index) => (
                  <div
                    key={`${item.source}-${index}`}
                    className="rounded-2xl border border-white/10 bg-black/20 p-4"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <Badge className="bg-emerald-500/15 text-emerald-200">
                        {item.source}
                      </Badge>

                      <div className="flex items-center gap-3">
                        <Progress value={item.confidence} className="w-24" />
                        <span className="text-sm text-slate-300">
                          {item.confidence}%
                        </span>
                      </div>
                    </div>

                    <p className="mt-3 text-sm leading-6 text-slate-300">
                      {item.claim}
                    </p>
                  </div>
                ))
              ) : (
                <EmptyState text="No evidence items are available for this company yet." />
              )}
            </CardContent>
          </Card>
        </div>

        <Card className="border-white/10 bg-white/[0.04] text-white">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-blue-300" />
              AI Workflow Connection
            </CardTitle>
          </CardHeader>

          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <WorkflowCard
                title="Ask AI About This Company"
                detail="Prefills a company-specific risk question and runs the LangGraph workflow."
              />

              <WorkflowCard
                title="Save Agent Run"
                detail="The AI answer is stored in PostgreSQL as an auditable agent run."
              />

              <WorkflowCard
                title="Generate Report"
                detail="Generate the latest company report directly from this page or from any saved AI agent run."
              />
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

function MiniMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
      <p className="text-sm text-slate-400">{label}</p>
      <p className="mt-2 break-words text-sm font-medium leading-6 text-white">
        {value}
      </p>
    </div>
  );
}

function RatioCard({
  label,
  value,
  progress,
}: {
  label: string;
  value: string;
  progress: number;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
      <p className="text-sm text-slate-400">{label}</p>
      <p className="mt-2 text-xl font-semibold text-white">{value}</p>
      <Progress value={Math.min(Math.max(progress, 0), 100)} className="mt-3" />
    </div>
  );
}

function WorkflowCard({ title, detail }: { title: string; detail: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
      <p className="font-medium text-white">{title}</p>
      <p className="mt-2 text-sm leading-6 text-slate-400">{detail}</p>
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/20 p-5">
      <p className="text-sm leading-6 text-slate-400">{text}</p>
    </div>
  );
}

function SeverityBadge({ severity }: { severity: string }) {
  const styles =
    severity === "High"
      ? "bg-red-500/15 text-red-200"
      : severity === "Medium"
        ? "bg-amber-500/15 text-amber-200"
        : "bg-emerald-500/15 text-emerald-200";

  return <Badge className={styles}>{severity}</Badge>;
}

function SentimentBadge({ sentiment }: { sentiment: string }) {
  const styles =
    sentiment === "Positive"
      ? "bg-emerald-500/15 text-emerald-200"
      : sentiment === "Negative"
        ? "bg-red-500/15 text-red-200"
        : "bg-amber-500/15 text-amber-200";

  return <Badge className={styles}>{sentiment}</Badge>;
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

function formatCurrency(value: number | null | undefined) {
  if (value == null) return "N/A";

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(value);
}

function formatLargeNumber(
  value: number | null | undefined,
  includeDollar = true
) {
  if (value == null) return "N/A";

  const prefix = includeDollar ? "$" : "";

  if (Math.abs(value) >= 1_000_000_000_000) {
    return `${prefix}${(value / 1_000_000_000_000).toFixed(2)}T`;
  }

  if (Math.abs(value) >= 1_000_000_000) {
    return `${prefix}${(value / 1_000_000_000).toFixed(2)}B`;
  }

  if (Math.abs(value) >= 1_000_000) {
    return `${prefix}${(value / 1_000_000).toFixed(2)}M`;
  }

  return `${prefix}${value.toLocaleString()}`;
}