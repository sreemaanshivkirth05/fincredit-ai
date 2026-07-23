"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";

import {
  Activity,
  AlertTriangle,
  BarChart3,
  Building2,
  CheckCircle2,
  Database,
  ExternalLink,
  Loader2,
  Newspaper,
  RefreshCcw,
  Sparkles,
  Star,
  TrendingDown,
  TrendingUp,
  Wallet,
} from "lucide-react";

import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { AppShell } from "@/components/app-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import {
  addStockToWatchlist,
  buyStockForPortfolio,
  getMarketData,
  getMarketHistory,
  getPortfolioHoldingStatus,
  getSecCompanyFacts,
  getSecFundamentalsHistory,
  getStockIntelligence,
  getStockNews,
  getWatchlistStatus,
  removeStockFromWatchlist,
  type IntelligenceScore,
  type StockIntelligenceResponse,
} from "@/lib/api";

type TimeRange =
  | "1D"
  | "5D"
  | "1M"
  | "3M"
  | "6M"
  | "YTD"
  | "1Y"
  | "5Y"
  | "Max";

type ChartPoint = {
  date: string;
  close: number;
};

type NewsItem = {
  title: string;
  publisher?: string | null;
  link?: string | null;
  summary?: string | null;
  publishedAt?: string | null;
  thumbnail?: string | null;
  type?: string | null;
  relevanceScore?: number | null;
  relevanceReason?: string | null;
};

type MetricCardProps = {
  label: string;
  value: string;
  helper?: string;
};

const TIME_RANGES: TimeRange[] = [
  "1D",
  "5D",
  "1M",
  "3M",
  "6M",
  "YTD",
  "1Y",
  "5Y",
  "Max",
];

function readValue(source: any, keys: string[]) {
  if (!source) return null;

  for (const key of keys) {
    const value = source[key];

    if (value !== undefined && value !== null && value !== "") {
      return value;
    }
  }

  return null;
}

function toNumber(value: any): number | null {
  if (value === undefined || value === null || value === "") return null;

  if (typeof value === "number") {
    return Number.isFinite(value) ? value : null;
  }

  if (typeof value === "string") {
    const cleaned = value.replace(/[$,%\s,]/g, "");
    const parsed = Number(cleaned);
    return Number.isFinite(parsed) ? parsed : null;
  }

  if (typeof value === "object") {
    if (typeof value.raw === "number") return value.raw;
    if (typeof value.value === "number") return value.value;
    if (typeof value.fmt === "string") return toNumber(value.fmt);
  }

  return null;
}

function formatCurrency(value: any, currency = "USD") {
  const number = toNumber(value);

  if (number === null) return "—";

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(number);
}

function formatNumber(value: any) {
  const number = toNumber(value);

  if (number === null) return "—";

  return new Intl.NumberFormat("en-US").format(number);
}

function formatCompactNumber(value: any) {
  const number = toNumber(value);

  if (number === null) return "—";

  return new Intl.NumberFormat("en-US", {
    notation: "compact",
    maximumFractionDigits: 2,
  }).format(number);
}

function formatPercent(value: any) {
  const number = toNumber(value);

  if (number === null) return "—";

  return `${number > 0 ? "+" : ""}${number.toFixed(2)}%`;
}

function formatRatioPercent(value: any) {
  const number = toNumber(value);

  if (number === null) return "—";

  return `${(number * 100).toFixed(2)}%`;
}

function formatDate(value: any) {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function formatDateTime(value: any) {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatChartXAxisTick(value: any, range: TimeRange) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  if (range === "1D") {
    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
    });
  }

  if (range === "5D") {
    return date.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
  }

  if (range === "1M" || range === "3M") {
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  }

  if (range === "6M" || range === "YTD" || range === "1Y") {
    return date.toLocaleDateString("en-US", {
      month: "short",
      year: "numeric",
    });
  }

  if (range === "5Y") {
    const month = date.toLocaleString("en-US", {
      month: "short",
    });

    const year = String(date.getFullYear()).slice(-2);

    return `${month} '${year}`;
  }

  return String(date.getFullYear());
}

function formatChartTooltipLabel(value: any, range: TimeRange) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  const dateLabel = date.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  if (range === "1D" || range === "5D") {
    const timeLabel = date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
    });

    return `${dateLabel}, ${timeLabel}`;
  }

  return dateLabel;
}

function buildXAxisTicks(data: ChartPoint[], range: TimeRange) {
  if (data.length === 0) return [];

  const maxTicksByRange: Record<TimeRange, number> = {
    "1D": 6,
    "5D": 6,
    "1M": 6,
    "3M": 6,
    "6M": 7,
    YTD: 7,
    "1Y": 7,
    "5Y": 8,
    Max: 9,
  };

  const maxTicks = Math.min(maxTicksByRange[range], data.length);

  if (maxTicks <= 1) {
    return [data[0].date];
  }

  const ticks: string[] = [];

  for (let index = 0; index < maxTicks; index += 1) {
    const pointIndex = Math.round((index * (data.length - 1)) / (maxTicks - 1));
    const tick = data[pointIndex]?.date;

    if (tick && !ticks.includes(tick)) {
      ticks.push(tick);
    }
  }

  return ticks;
}

function normalizeArray(value: any): any[] {
  if (Array.isArray(value)) return value;

  if (Array.isArray(value?.points)) return value.points;
  if (Array.isArray(value?.snapshots)) return value.snapshots;
  if (Array.isArray(value?.data)) return value.data;
  if (Array.isArray(value?.history)) return value.history;
  if (Array.isArray(value?.prices)) return value.prices;
  if (Array.isArray(value?.chart)) return value.chart;
  if (Array.isArray(value?.chartData)) return value.chartData;
  if (Array.isArray(value?.chart_data)) return value.chart_data;
  if (Array.isArray(value?.results)) return value.results;
  if (Array.isArray(value?.items)) return value.items;
  if (Array.isArray(value?.rows)) return value.rows;
  if (Array.isArray(value?.records)) return value.records;
  if (Array.isArray(value?.fundamentals)) return value.fundamentals;

  if (Array.isArray(value?.fundamentals_history)) {
    return value.fundamentals_history;
  }

  if (Array.isArray(value?.fundamentalsHistory)) {
    return value.fundamentalsHistory;
  }

  return [];
}

function normalizeMarketHistory(value: any): ChartPoint[] {
  return normalizeArray(value)
    .map((item) => {
      const date =
        readValue(item, [
          "date",
          "Date",
          "datetime",
          "timestamp",
          "time",
          "period",
          "fetchedAt",
          "fetched_at",
        ]) ?? null;

      const close = toNumber(
        readValue(item, [
          "close",
          "Close",
          "adjClose",
          "adj_close",
          "adjustedClose",
          "adjusted_close",
          "currentPrice",
          "current_price",
          "price",
          "value",
        ])
      );

      if (!date || close === null) return null;

      return {
        date: String(date),
        close,
      };
    })
    .filter((point): point is ChartPoint => point !== null)
    .sort((a, b) => {
      return new Date(a.date).getTime() - new Date(b.date).getTime();
    });
}

function getLatestSecFact(companyFacts: any, conceptNames: string[]) {
  const facts = companyFacts?.facts;
  const usGaap = facts?.["us-gaap"] ?? facts?.us_gaap ?? facts?.usGaap;

  if (!usGaap) return null;

  for (const conceptName of conceptNames) {
    const concept = usGaap[conceptName];
    const units = concept?.units;

    if (!units) continue;

    const unitValues =
      units.USD ??
      units.shares ??
      units.pure ??
      Object.values(units).find(Array.isArray);

    if (!Array.isArray(unitValues) || unitValues.length === 0) continue;

    const sorted = [...unitValues].sort((a, b) => {
      const aDate = new Date(a.filed ?? a.end ?? a.frame ?? 0).getTime();
      const bDate = new Date(b.filed ?? b.end ?? b.frame ?? 0).getTime();

      return bDate - aDate;
    });

    const latest = sorted[0];

    return {
      value: latest?.val,
      fiscalYear: latest?.fy,
      form: latest?.form,
      filed: latest?.filed,
    };
  }

  return null;
}

function getLatestFundamentalsRow(fundamentalsHistory: any) {
  if (
    fundamentalsHistory &&
    typeof fundamentalsHistory === "object" &&
    !Array.isArray(fundamentalsHistory) &&
    readValue(fundamentalsHistory, ["revenue", "netIncome", "assets"])
  ) {
    return fundamentalsHistory;
  }

  const rows = normalizeArray(fundamentalsHistory);

  if (rows.length === 0) return null;

  return [...rows].sort((a, b) => {
    const aDate = new Date(
      readValue(a, [
        "fetchedAt",
        "fetched_at",
        "filing_date",
        "filed",
        "date",
      ]) ?? 0
    ).getTime();

    const bDate = new Date(
      readValue(b, [
        "fetchedAt",
        "fetched_at",
        "filing_date",
        "filed",
        "date",
      ]) ?? 0
    ).getTime();

    return bDate - aDate;
  })[0];
}

function normalizeNews(value: any): NewsItem[] {
  if (Array.isArray(value)) return value;
  if (Array.isArray(value?.news)) return value.news;
  if (Array.isArray(value?.items)) return value.items;
  if (Array.isArray(value?.results)) return value.results;
  return [];
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message;
  return String(error);
}

function MetricCard({ label, value, helper }: MetricCardProps) {
  return (
    <Card className="border-white/10 bg-[#0d1424]/80 text-white shadow-lg shadow-black/10 transition-all duration-200 hover:-translate-y-0.5 hover:border-emerald-300/25">
      <CardContent className="p-5">
        <p className="text-sm text-slate-400">{label}</p>
        <p className="mt-2 text-2xl font-semibold">{value}</p>
        {helper ? (
          <p className="mt-1 text-xs leading-5 text-slate-500">{helper}</p>
        ) : null}
      </CardContent>
    </Card>
  );
}

function scoreTone(status?: string) {
  const normalized = (status ?? "").toLowerCase();

  if (normalized.includes("strong")) {
    return {
      badge: "bg-emerald-500/15 text-emerald-200",
      bar: "bg-emerald-400",
      border: "hover:border-emerald-300/30",
    };
  }

  if (normalized.includes("weak") || normalized.includes("elevated")) {
    return {
      badge: "bg-red-500/15 text-red-200",
      bar: "bg-red-400",
      border: "hover:border-red-300/30",
    };
  }

  if (normalized.includes("unknown")) {
    return {
      badge: "bg-slate-500/20 text-slate-200",
      bar: "bg-slate-400",
      border: "hover:border-slate-300/30",
    };
  }

  return {
    badge: "bg-amber-500/15 text-amber-200",
    bar: "bg-amber-300",
    border: "hover:border-amber-300/30",
  };
}

function ScoreBar({ score, status }: { score: number; status?: string }) {
  const tone = scoreTone(status);
  const safeScore = Math.max(0, Math.min(100, Number(score) || 0));

  return (
    <div className="mt-3">
      <div className="mb-2 flex items-center justify-between text-xs text-slate-400">
        <span>Score</span>
        <span>{safeScore}/100</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-white/10">
        <div
          className={`h-full rounded-full ${tone.bar}`}
          style={{ width: `${safeScore}%` }}
        />
      </div>
    </div>
  );
}

function TextList({
  items,
  empty,
  tone = "slate",
}: {
  items?: string[];
  empty: string;
  tone?: "slate" | "emerald" | "amber" | "red" | "blue";
}) {
  const colors = {
    slate: "border-white/10 bg-white/[0.04] text-slate-300",
    emerald: "border-emerald-400/20 bg-emerald-500/10 text-emerald-100",
    amber: "border-amber-400/20 bg-amber-500/10 text-amber-100",
    red: "border-red-400/20 bg-red-500/10 text-red-100",
    blue: "border-blue-400/20 bg-blue-500/10 text-blue-100",
  };

  if (!items || items.length === 0) {
    return <p className="text-sm text-slate-500">{empty}</p>;
  }

  return (
    <div className="flex flex-wrap gap-2">
      {items.map((item) => (
        <span
          key={item}
          className={`rounded-full border px-3 py-1 text-xs ${colors[tone]}`}
        >
          {item}
        </span>
      ))}
    </div>
  );
}

function IntelligenceScoreCard({ score }: { score: IntelligenceScore }) {
  const tone = scoreTone(score.status);

  return (
    <div
      className={`rounded-2xl border border-white/10 bg-black/20 p-4 transition-colors ${tone.border}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-medium text-white">{score.label}</p>
          <p className="mt-2 text-sm leading-6 text-slate-400">
            {score.explanation}
          </p>
        </div>
        <Badge className={tone.badge}>{score.status}</Badge>
      </div>

      <ScoreBar score={score.score} status={score.status} />

      {score.drivers.length > 0 ? (
        <div className="mt-4">
          <p className="mb-2 text-xs font-medium text-slate-500">Drivers</p>
          <TextList items={score.drivers.slice(0, 3)} empty="" tone="blue" />
        </div>
      ) : null}

      {score.missingData.length > 0 ? (
        <div className="mt-4">
          <p className="mb-2 text-xs font-medium text-slate-500">
            Missing Data
          </p>
          <TextList items={score.missingData.slice(0, 3)} empty="" tone="amber" />
        </div>
      ) : null}
    </div>
  );
}

function MiniMetric({
  label,
  value,
  helper,
}: {
  label: string;
  value: string;
  helper?: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="mt-2 text-lg font-semibold text-white">{value}</p>
      {helper ? <p className="mt-1 text-xs text-slate-500">{helper}</p> : null}
    </div>
  );
}

export default function StockDetailPage() {
  const params = useParams<{ ticker: string }>();
  const ticker = String(params?.ticker ?? "").toUpperCase();

  const [marketData, setMarketData] = useState<any>(null);
  const [marketHistory, setMarketHistory] = useState<any>(null);
  const [companyFacts, setCompanyFacts] = useState<any>(null);
  const [fundamentalsHistory, setFundamentalsHistory] = useState<any>(null);
  const [newsData, setNewsData] = useState<any>(null);
  const [stockIntelligence, setStockIntelligence] =
    useState<StockIntelligenceResponse | null>(null);

  const [selectedRange, setSelectedRange] = useState<TimeRange>("1M");
  const [isLoading, setIsLoading] = useState(true);
  const [isChartLoading, setIsChartLoading] = useState(false);
  const [isNewsLoading, setIsNewsLoading] = useState(false);
  const [isIntelligenceLoading, setIsIntelligenceLoading] = useState(false);
  const [intelligenceError, setIntelligenceError] = useState("");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [secWarnings, setSecWarnings] = useState<string[]>([]);

  const [isWatchlisted, setIsWatchlisted] = useState(false);
  const [isWatchlistLoading, setIsWatchlistLoading] = useState(false);

  const [isInPortfolio, setIsInPortfolio] = useState(false);
  const [portfolioHolding, setPortfolioHolding] = useState<any>(null);
  const [showPortfolioForm, setShowPortfolioForm] = useState(false);
  const [portfolioShares, setPortfolioShares] = useState("1");
  const [isPortfolioLoading, setIsPortfolioLoading] = useState(false);
  const [portfolioSuccessMessage, setPortfolioSuccessMessage] = useState("");

  const loadCoreStockData = useCallback(async () => {
    if (!ticker) return;

    const nextErrors: string[] = [];
    const nextSecWarnings: string[] = [];

    try {
      const [marketResult, factsResult, fundamentalsResult] =
        await Promise.allSettled([
          getMarketData(ticker),
          getSecCompanyFacts(ticker),
          getSecFundamentalsHistory(ticker),
        ]);

      if (marketResult.status === "fulfilled") {
        setMarketData(marketResult.value);
      } else {
        nextErrors.push(
          `Market data failed: ${getErrorMessage(marketResult.reason)}`
        );
      }

      if (factsResult.status === "fulfilled") {
        setCompanyFacts(factsResult.value);
      } else {
        setCompanyFacts(null);
        nextSecWarnings.push(
          "SEC fundamentals are unavailable for this ticker right now."
        );
      }

      if (fundamentalsResult.status === "fulfilled") {
        setFundamentalsHistory(fundamentalsResult.value);
      } else {
        setFundamentalsHistory(null);
        nextSecWarnings.push(
          "SEC fundamentals are unavailable for this ticker right now."
        );
      }

      setSecWarnings([...new Set(nextSecWarnings)]);
      setErrors((currentErrors) => [
        ...currentErrors.filter(
          (item) =>
            item.startsWith("Chart data failed") ||
            item.startsWith("News data failed")
        ),
        ...nextErrors,
      ]);
    } catch (error) {
      setErrors([`Stock page failed: ${getErrorMessage(error)}`]);
      setSecWarnings([]);
    }
  }, [ticker]);

  const loadChartData = useCallback(async () => {
    if (!ticker) return;

    try {
      setIsChartLoading(true);

      const chartResponse = await getMarketHistory(ticker, selectedRange);
      setMarketHistory(chartResponse);

      setErrors((currentErrors) =>
        currentErrors.filter((item) => !item.startsWith("Chart data failed"))
      );
    } catch (error) {
      setErrors((currentErrors) => [
        ...currentErrors.filter((item) => !item.startsWith("Chart data failed")),
        `Chart data failed: ${getErrorMessage(error)}`,
      ]);
    } finally {
      setIsChartLoading(false);
    }
  }, [ticker, selectedRange]);

  const loadNewsData = useCallback(async () => {
    if (!ticker) return;

    try {
      setIsNewsLoading(true);

      const response = await getStockNews(ticker, 8);
      setNewsData(response);

      setErrors((currentErrors) =>
        currentErrors.filter((item) => !item.startsWith("News data failed"))
      );
    } catch (error) {
      setErrors((currentErrors) => [
        ...currentErrors.filter((item) => !item.startsWith("News data failed")),
        `News data failed: ${getErrorMessage(error)}`,
      ]);
    } finally {
      setIsNewsLoading(false);
    }
  }, [ticker]);

  const loadStockIntelligence = useCallback(async () => {
    if (!ticker) return;

    try {
      setIsIntelligenceLoading(true);
      const response = await getStockIntelligence(ticker);
      setStockIntelligence(response);
      setIntelligenceError("");
    } catch (error) {
      setStockIntelligence(null);
      setIntelligenceError(getErrorMessage(error));
    } finally {
      setIsIntelligenceLoading(false);
    }
  }, [ticker]);

  const loadWatchlistStatus = useCallback(async () => {
    if (!ticker) return;

    try {
      setIsWatchlistLoading(true);
      const response = await getWatchlistStatus(ticker);
      setIsWatchlisted(Boolean(response.isWatchlisted));
    } catch (error) {
      console.error(error);
    } finally {
      setIsWatchlistLoading(false);
    }
  }, [ticker]);

  const loadPortfolioStatus = useCallback(async () => {
    if (!ticker) return;

    try {
      const response = await getPortfolioHoldingStatus(ticker);
      setIsInPortfolio(Boolean(response.isInPortfolio));
      setPortfolioHolding(response.holding ?? null);
    } catch (error) {
      console.error(error);
    }
  }, [ticker]);

  useEffect(() => {
    async function initialLoad() {
      setIsLoading(true);
      await Promise.all([loadCoreStockData(), loadPortfolioStatus()]);
      setIsLoading(false);
    }

    initialLoad();
  }, [loadCoreStockData, loadPortfolioStatus]);

  useEffect(() => {
    loadChartData();
  }, [loadChartData]);

  useEffect(() => {
    loadNewsData();
  }, [loadNewsData]);

  useEffect(() => {
    loadStockIntelligence();
  }, [loadStockIntelligence]);

  useEffect(() => {
    loadWatchlistStatus();
  }, [loadWatchlistStatus]);

  async function handleRefresh() {
    setIsRefreshing(true);
    await Promise.all([
      loadCoreStockData(),
      loadChartData(),
      loadNewsData(),
      loadStockIntelligence(),
      loadWatchlistStatus(),
      loadPortfolioStatus(),
    ]);
    setIsRefreshing(false);
  }

  const companyName =
    readValue(marketData, [
      "company_name",
      "companyName",
      "long_name",
      "longName",
      "short_name",
      "shortName",
      "name",
    ]) ?? ticker;

  const sector = readValue(marketData, ["sector", "industry"]);

  const currency =
    readValue(marketData, ["currency", "financial_currency"]) ?? "USD";

  const currentPrice = readValue(marketData, [
    "currentPrice",
    "current_price",
    "regular_market_price",
    "regularMarketPrice",
    "price",
    "close",
    "last_price",
  ]);

  const previousClose = readValue(marketData, [
    "previousClose",
    "previous_close",
    "regular_market_previous_close",
    "regularMarketPreviousClose",
  ]);

  const rawDailyChange = readValue(marketData, [
    "dailyChange",
    "daily_change",
    "regular_market_change",
    "regularMarketChange",
    "change",
    "price_change",
  ]);

  const computedDailyChange =
    toNumber(rawDailyChange) ??
    (() => {
      const price = toNumber(currentPrice);
      const previous = toNumber(previousClose);

      if (price === null || previous === null) return null;

      return price - previous;
    })();

  const rawDailyChangePercent = readValue(marketData, [
    "dailyChangePercent",
    "daily_change_percent",
    "regular_market_change_percent",
    "regularMarketChangePercent",
    "change_percent",
    "percent_change",
  ]);

  const computedDailyChangePercent =
    toNumber(rawDailyChangePercent) ??
    (() => {
      const previous = toNumber(previousClose);

      if (computedDailyChange === null || previous === null || previous === 0) {
        return null;
      }

      return (computedDailyChange / previous) * 100;
    })();

  const marketCap = readValue(marketData, [
    "marketCap",
    "market_cap",
    "market_capitalization",
  ]);

  const volume = readValue(marketData, [
    "volume",
    "regular_market_volume",
    "regularMarketVolume",
  ]);

  const dayHigh = readValue(marketData, [
    "dayHigh",
    "day_high",
    "regular_market_day_high",
    "regularMarketDayHigh",
    "high",
  ]);

  const dayLow = readValue(marketData, [
    "dayLow",
    "day_low",
    "regular_market_day_low",
    "regularMarketDayLow",
    "low",
  ]);

  const exchange = readValue(marketData, [
    "exchange",
    "full_exchange_name",
    "fullExchangeName",
  ]);

  const fetchedAt = readValue(marketData, ["fetchedAt", "fetched_at"]);

  const chartData = useMemo(() => {
    return normalizeMarketHistory(marketHistory);
  }, [marketHistory]);

  const newsItems = useMemo(() => {
    return normalizeNews(newsData);
  }, [newsData]);

  const xAxisTicks = useMemo(() => {
    return buildXAxisTicks(chartData, selectedRange);
  }, [chartData, selectedRange]);

  const latestFundamentalsRow = useMemo(() => {
    const rowFromHistory = getLatestFundamentalsRow(fundamentalsHistory);

    if (rowFromHistory) return rowFromHistory;

    if (
      companyFacts &&
      typeof companyFacts === "object" &&
      !Array.isArray(companyFacts)
    ) {
      return companyFacts;
    }

    return null;
  }, [fundamentalsHistory, companyFacts]);

  const latestRevenueFact = getLatestSecFact(companyFacts, [
    "Revenues",
    "RevenueFromContractWithCustomerExcludingAssessedTax",
    "SalesRevenueNet",
  ]);

  const revenue =
    readValue(latestFundamentalsRow, [
      "revenue",
      "revenues",
      "total_revenue",
      "totalRevenue",
      "Revenue",
      "Revenues",
    ]) ?? latestRevenueFact?.value;

  const netIncome =
    readValue(latestFundamentalsRow, [
      "netIncome",
      "net_income",
      "net_income_loss",
      "netIncomeLoss",
      "NetIncomeLoss",
      "income",
    ]) ?? getLatestSecFact(companyFacts, ["NetIncomeLoss"])?.value;

  const assets =
    readValue(latestFundamentalsRow, [
      "assets",
      "total_assets",
      "totalAssets",
      "Assets",
    ]) ?? getLatestSecFact(companyFacts, ["Assets"])?.value;

  const liabilities =
    readValue(latestFundamentalsRow, [
      "liabilities",
      "total_liabilities",
      "totalLiabilities",
      "Liabilities",
    ]) ?? getLatestSecFact(companyFacts, ["Liabilities"])?.value;

  const equity =
    readValue(latestFundamentalsRow, [
      "equity",
      "stockholders_equity",
      "stockholdersEquity",
      "shareholders_equity",
      "shareholdersEquity",
      "StockholdersEquity",
    ]) ??
    getLatestSecFact(companyFacts, [
      "StockholdersEquity",
      "StockholdersEquityIncludingPortionAttributableToNoncontrollingInterest",
    ])?.value;

  const fiscalYear =
    readValue(latestFundamentalsRow, ["fiscalYear", "fiscal_year", "fy"]) ??
    latestRevenueFact?.fiscalYear;

  const form =
    readValue(latestFundamentalsRow, ["form", "filing_form"]) ??
    latestRevenueFact?.form;

  const filingDate =
    readValue(latestFundamentalsRow, [
      "filed",
      "filing_date",
      "filed_date",
      "date",
    ]) ?? latestRevenueFact?.filed;

  const secSource =
    readValue(latestFundamentalsRow, ["source"]) ?? "SEC Company Facts API";

  const secFetchedAt = readValue(latestFundamentalsRow, [
    "fetchedAt",
    "fetched_at",
  ]);

  const askAiQuestion = encodeURIComponent(
    `Analyze ${ticker}. Use holdings, cost basis, unrealized P/L, transaction history, watchlist, refreshed prices, market data, SEC fundamentals, recent news, major risks, and whether it would make sense for a beginner paper-trading portfolio.`
  );

  const askAiHref = `/ask?question=${askAiQuestion}`;
  const intelligenceAskQuestion = encodeURIComponent(
    `Explain the investment case, risks, valuation, and portfolio fit for ${ticker}.`
  );
  const intelligenceAskHref = `/ask?ticker=${encodeURIComponent(
    ticker
  )}&question=${intelligenceAskQuestion}`;
  const intelligence = stockIntelligence;
  const valuation = intelligence?.valuationCheck;
  const financialHealth = intelligence?.financialHealthCheck;
  const bullBearBase = intelligence?.bullBearBaseCase;
  const portfolioFit = intelligence?.portfolioFitCheck;
  const decisionReadiness = intelligence?.decisionReadiness;
  const evidenceStrength = intelligence?.evidenceStrength;

  const changeClass =
    computedDailyChange === null
      ? "text-slate-400"
      : computedDailyChange >= 0
        ? "text-emerald-300"
        : "text-red-300";

  const changeIcon =
    computedDailyChange === null ? null : computedDailyChange >= 0 ? (
      <TrendingUp className="h-4 w-4" />
    ) : (
      <TrendingDown className="h-4 w-4" />
    );

  const currentPriceNumber = toNumber(currentPrice);
  const sharesNumber = toNumber(portfolioShares);

  const estimatedCost =
    currentPriceNumber !== null && sharesNumber !== null
      ? currentPriceNumber * sharesNumber
      : null;

  async function handleToggleWatchlist() {
    try {
      setIsWatchlistLoading(true);

      if (isWatchlisted) {
        await removeStockFromWatchlist(ticker);
        setIsWatchlisted(false);
        return;
      }

      await addStockToWatchlist({
        ticker,
        company: companyName ? String(companyName) : ticker,
        sector: sector ? String(sector) : "Unknown",
        currentPrice: toNumber(currentPrice),
        previousClose: toNumber(previousClose),
        marketCap: toNumber(marketCap),
        volume: toNumber(volume),
        currency: currency ? String(currency) : "USD",
        exchange: exchange ? String(exchange) : null,
      });

      setIsWatchlisted(true);
    } catch (error) {
      setErrors((currentErrors) => [
        ...currentErrors.filter(
          (item) => !item.startsWith("Watchlist action failed")
        ),
        `Watchlist action failed: ${getErrorMessage(error)}`,
      ]);
    } finally {
      setIsWatchlistLoading(false);
    }
  }

  async function handleSimulatedBuy() {
    try {
      setIsPortfolioLoading(true);
      setPortfolioSuccessMessage("");

      const shares = toNumber(portfolioShares);
      const price = toNumber(currentPrice);

      if (shares === null || shares <= 0) {
        throw new Error("Enter a share quantity greater than 0.");
      }

      if (price === null || price <= 0) {
        throw new Error("Current stock price is unavailable.");
      }

      await buyStockForPortfolio({
        ticker,
        company: companyName ? String(companyName) : ticker,
        sector: sector ? String(sector) : "Unknown",
        shares,
        price,
        currency: currency ? String(currency) : "USD",
        exchange: exchange ? String(exchange) : null,
      });

      setPortfolioSuccessMessage(
        `Added ${shares} simulated share${shares === 1 ? "" : "s"} of ${ticker} to your portfolio.`
      );

      await loadPortfolioStatus();

      setErrors((currentErrors) =>
        currentErrors.filter(
          (item) => !item.startsWith("Portfolio action failed")
        )
      );
    } catch (error) {
      setErrors((currentErrors) => [
        ...currentErrors.filter(
          (item) => !item.startsWith("Portfolio action failed")
        ),
        `Portfolio action failed: ${getErrorMessage(error)}`,
      ]);
    } finally {
      setIsPortfolioLoading(false);
    }
  }

  if (isLoading) {
    return (
      <AppShell>
        <div className="flex min-h-[70vh] items-center justify-center">
          <div className="text-center">
            <Loader2 className="mx-auto h-8 w-8 animate-spin text-blue-300" />
            <p className="mt-4 text-lg font-semibold text-white">
              Loading {ticker}...
            </p>
            <p className="mt-2 text-sm text-slate-400">
              Fetching price, chart, SEC fundamentals, watchlist, portfolio, and news.
            </p>
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
          <div>
            <Badge className="mb-3 bg-blue-500/15 text-blue-200">
              Stock Research
            </Badge>

            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-4xl font-semibold tracking-tight text-white">
                {ticker}
              </h1>

              <Badge className="bg-white/10 text-slate-300">
                {exchange ? String(exchange) : "Exchange unavailable"}
              </Badge>

              <Badge className="bg-white/10 text-slate-300">
                {String(currency)}
              </Badge>

              {sector ? (
                <Badge className="bg-emerald-500/15 text-emerald-200">
                  {String(sector)}
                </Badge>
              ) : null}

              {isWatchlisted ? (
                <Badge className="bg-yellow-500/15 text-yellow-200">
                  Watchlisted
                </Badge>
              ) : null}

              {isInPortfolio ? (
                <Badge className="bg-blue-500/15 text-blue-200">
                  In Portfolio
                </Badge>
              ) : null}
            </div>

            <p className="mt-2 text-lg text-slate-400">{companyName}</p>

            {fetchedAt ? (
              <p className="mt-2 text-xs text-slate-500">
                Market data refreshed: {formatDateTime(fetchedAt)}
              </p>
            ) : null}
          </div>

          <div className="flex flex-wrap gap-3">
            <Button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="bg-blue-500 text-white hover:bg-blue-600"
            >
              {isRefreshing ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <RefreshCcw className="mr-2 h-4 w-4" />
              )}
              {isRefreshing ? "Refreshing..." : "Refresh Data"}
            </Button>

            <Link href={askAiHref}>
              <Button
                data-testid="stock-ask-ai"
                className="bg-violet-500 text-white hover:bg-violet-600"
              >
                <Sparkles className="mr-2 h-4 w-4" />
                Ask AI
              </Button>
            </Link>
          </div>
        </div>

        {errors.length > 0 ? (
          <Card className="border-red-500/30 bg-red-500/10 text-red-100">
            <CardContent className="p-5">
              <p className="font-medium">
                Some stock data could not be loaded.
              </p>

              <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-red-200">
                {errors.map((error) => (
                  <li key={error}>{error}</li>
                ))}
              </ul>
            </CardContent>
          </Card>
        ) : null}

        {portfolioSuccessMessage ? (
          <Card className="border-emerald-500/30 bg-emerald-500/10 text-emerald-100">
            <CardContent className="flex flex-col gap-3 p-5 md:flex-row md:items-center md:justify-between">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="mt-0.5 h-5 w-5 text-emerald-300" />
                <div>
                  <p className="font-medium">{portfolioSuccessMessage}</p>
                  <p className="mt-1 text-sm text-emerald-200/80">
                    This is a paper-trading transaction. No real money was used.
                  </p>
                </div>
              </div>

              <Link href="/portfolio">
                <Button className="bg-emerald-500 text-white hover:bg-emerald-600">
                  Open Portfolio
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : null}

        <Card className="border-white/10 bg-white/[0.04] text-white">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-emerald-300" />
              How to Use This Page
            </CardTitle>
          </CardHeader>

          <CardContent>
            <div className="grid gap-3 md:grid-cols-5">
              {[
                "Check price/chart",
                "Review SEC fundamentals",
                "Read news",
                "Add to watchlist or simulate a buy",
                "Ask AI for portfolio fit",
              ].map((step, index) => (
                <div
                  key={step}
                  className="rounded-2xl border border-white/10 bg-black/20 p-4 transition-colors duration-200 hover:border-blue-300/25"
                >
                  <p className="text-xs font-semibold text-blue-200">
                    {index + 1}
                  </p>
                  <p className="mt-2 text-sm leading-5 text-slate-300">
                    {step}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <section
          data-testid="stock-intelligence-section"
          className="space-y-5 rounded-3xl border border-cyan-300/20 bg-cyan-500/[0.04] p-5 shadow-2xl shadow-cyan-950/20"
        >
          <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
            <div>
              <Badge className="mb-3 bg-cyan-500/15 text-cyan-100">
                FinCredit Intelligence Layer
              </Badge>
              <h2 className="text-3xl font-semibold tracking-tight text-white">
                Stock Intelligence
              </h2>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-400">
                A deterministic research layer that turns market, SEC, news,
                valuation, and portfolio context into decision-readiness
                signals for paper-trading education.
              </p>
            </div>

            <Link href={intelligenceAskHref}>
              <Button className="bg-cyan-500 text-white hover:bg-cyan-600">
                <Sparkles className="mr-2 h-4 w-4" />
                Ask AI About This Intelligence
              </Button>
            </Link>
          </div>

          {isIntelligenceLoading ? (
            <Card className="border-white/10 bg-black/20 text-white">
              <CardContent className="flex min-h-[180px] items-center justify-center p-6">
                <div className="text-center">
                  <Loader2 className="mx-auto h-7 w-7 animate-spin text-cyan-300" />
                  <p className="mt-3 text-sm text-slate-400">
                    Building stock intelligence signals...
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : intelligenceError ? (
            <Card className="border-amber-400/20 bg-amber-500/10 text-amber-100">
              <CardContent className="p-5">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-300" />
                  <div>
                    <p className="font-medium">
                      Stock intelligence is temporarily unavailable.
                    </p>
                    <p className="mt-1 text-sm leading-6 text-amber-100/80">
                      The rest of the page remains available. Missing data
                      should be researched further before any simulated
                      decision.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : intelligence ? (
            <>
              <Card className="border-white/10 bg-[#0d1424]/90 text-white">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-2xl">
                    <Sparkles className="h-5 w-5 text-cyan-300" />
                    Beginner Summary
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm leading-7 text-slate-300">
                    {intelligence.beginnerSummary}
                  </p>
                  <p className="mt-4 rounded-2xl border border-amber-400/20 bg-amber-500/10 p-4 text-sm leading-6 text-amber-100">
                    {intelligence.disclaimer}
                  </p>
                </CardContent>
              </Card>

              <div
                data-testid="intelligence-scorecard"
                className="space-y-4"
              >
                <div>
                  <h3 className="text-xl font-semibold text-white">
                    Investment Case Scorecard
                  </h3>
                  <p className="mt-1 text-sm text-slate-400">
                    Scores are screening signals for research readiness, not a
                    recommendation.
                  </p>
                </div>
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {intelligence.investmentCaseScorecard.map((score) => (
                    <IntelligenceScoreCard key={score.label} score={score} />
                  ))}
                </div>
              </div>

              {financialHealth ? (
                <Card
                  data-testid="financial-health-scanner"
                  className="border-white/10 bg-white/[0.04] text-white"
                >
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-2xl">
                      <Activity className="h-5 w-5 text-emerald-300" />
                      Financial Health Scanner
                    </CardTitle>
                    <p className="text-sm text-slate-400">
                      Approximate ratios from latest available SEC fundamentals.
                    </p>
                  </CardHeader>
                  <CardContent className="space-y-5">
                    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                      <MiniMetric
                        label="Revenue"
                        value={formatCompactNumber(financialHealth.revenue)}
                      />
                      <MiniMetric
                        label="Net Income"
                        value={formatCompactNumber(financialHealth.netIncome)}
                      />
                      <MiniMetric
                        label="Approx Profit Margin"
                        value={formatRatioPercent(
                          financialHealth.profitMarginApprox
                        )}
                      />
                      <MiniMetric
                        label="Assets"
                        value={formatCompactNumber(financialHealth.assets)}
                      />
                      <MiniMetric
                        label="Liabilities"
                        value={formatCompactNumber(financialHealth.liabilities)}
                      />
                      <MiniMetric
                        label="Approx Debt/Assets"
                        value={formatRatioPercent(
                          financialHealth.debtToAssetsApprox
                        )}
                      />
                      <MiniMetric
                        label="Approx ROA"
                        value={formatRatioPercent(
                          financialHealth.returnOnAssetsApprox
                        )}
                      />
                      <MiniMetric
                        label="Status"
                        value={financialHealth.status}
                        helper="Screening status"
                      />
                    </div>

                    <p className="text-sm leading-6 text-slate-400">
                      {financialHealth.explanation}
                    </p>

                    <div className="grid gap-4 lg:grid-cols-2">
                      <div>
                        <p className="mb-2 text-sm font-medium text-white">
                          Strengths
                        </p>
                        <TextList
                          items={financialHealth.strengths}
                          empty="No deterministic strengths found yet."
                          tone="emerald"
                        />
                      </div>
                      <div>
                        <p className="mb-2 text-sm font-medium text-white">
                          Red Flags
                        </p>
                        <TextList
                          items={financialHealth.redFlags}
                          empty="No financial red flags found from available data."
                          tone="red"
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ) : null}

              {valuation ? (
                <Card
                  data-testid="valuation-reality-check"
                  className="border-white/10 bg-white/[0.04] text-white"
                >
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-2xl">
                      <BarChart3 className="h-5 w-5 text-blue-300" />
                      Valuation Reality Check
                    </CardTitle>
                    <p className="text-sm text-slate-400">
                      Available yfinance valuation metrics converted into a
                      plain-language risk screen.
                    </p>
                  </CardHeader>
                  <CardContent className="space-y-5">
                    {valuation.missingData.length > 0 ? (
                      <div className="rounded-2xl border border-amber-400/20 bg-amber-500/10 p-4 text-sm text-amber-100">
                        Some valuation metrics are missing. Evidence is limited,
                        so valuation should be researched further.
                      </div>
                    ) : null}

                    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                      <MiniMetric label="P/E" value={formatNumber(valuation.peRatio)} />
                      <MiniMetric
                        label="Forward P/E"
                        value={formatNumber(valuation.forwardPe)}
                      />
                      <MiniMetric
                        label="Price/Sales"
                        value={formatNumber(valuation.priceToSales)}
                      />
                      <MiniMetric
                        label="Price/Book"
                        value={formatNumber(valuation.priceToBook)}
                      />
                      <MiniMetric
                        label="Enterprise/Revenue"
                        value={formatNumber(valuation.enterpriseToRevenue)}
                      />
                      <MiniMetric
                        label="Enterprise/EBITDA"
                        value={formatNumber(valuation.enterpriseToEbitda)}
                      />
                      <MiniMetric
                        label="Market Cap"
                        value={formatCompactNumber(valuation.marketCap)}
                      />
                      <MiniMetric label="Beta" value={formatNumber(valuation.beta)} />
                      <MiniMetric
                        label="52-Week High"
                        value={formatCurrency(valuation.fiftyTwoWeekHigh)}
                      />
                      <MiniMetric
                        label="52-Week Low"
                        value={formatCurrency(valuation.fiftyTwoWeekLow)}
                      />
                      <MiniMetric
                        label="Valuation Risk"
                        value={valuation.valuationRisk}
                        helper="Demanding metrics raise risk"
                      />
                    </div>

                    <p className="text-sm leading-6 text-slate-400">
                      {valuation.explanation}
                    </p>
                  </CardContent>
                </Card>
              ) : null}

              {bullBearBase ? (
                <Card
                  data-testid="bull-bear-base-case"
                  className="border-white/10 bg-white/[0.04] text-white"
                >
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-2xl">
                      <TrendingUp className="h-5 w-5 text-cyan-300" />
                      Bull / Bear / Base Case
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-5">
                    <div className="grid gap-4 lg:grid-cols-3">
                      <div className="rounded-2xl border border-emerald-400/20 bg-emerald-500/10 p-4">
                        <p className="font-medium text-emerald-100">
                          Bull Case
                        </p>
                        <p className="mt-2 text-sm leading-6 text-emerald-100/80">
                          {bullBearBase.bullCase}
                        </p>
                      </div>
                      <div className="rounded-2xl border border-red-400/20 bg-red-500/10 p-4">
                        <p className="font-medium text-red-100">Bear Case</p>
                        <p className="mt-2 text-sm leading-6 text-red-100/80">
                          {bullBearBase.bearCase}
                        </p>
                      </div>
                      <div className="rounded-2xl border border-blue-400/20 bg-blue-500/10 p-4">
                        <p className="font-medium text-blue-100">Base Case</p>
                        <p className="mt-2 text-sm leading-6 text-blue-100/80">
                          {bullBearBase.baseCase}
                        </p>
                      </div>
                    </div>

                    <div className="grid gap-4 lg:grid-cols-3">
                      <div>
                        <p className="mb-2 text-sm font-medium text-white">
                          What Could Go Right
                        </p>
                        <TextList
                          items={bullBearBase.whatCouldGoRight}
                          empty="No upside drivers available."
                          tone="emerald"
                        />
                      </div>
                      <div>
                        <p className="mb-2 text-sm font-medium text-white">
                          What Could Go Wrong
                        </p>
                        <TextList
                          items={bullBearBase.whatCouldGoWrong}
                          empty="No downside drivers available."
                          tone="red"
                        />
                      </div>
                      <div>
                        <p className="mb-2 text-sm font-medium text-white">
                          What To Monitor
                        </p>
                        <TextList
                          items={bullBearBase.whatToMonitor}
                          empty="No monitor list available."
                          tone="blue"
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ) : null}

              {portfolioFit ? (
                <Card className="border-white/10 bg-white/[0.04] text-white">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-2xl">
                      <Wallet className="h-5 w-5 text-violet-300" />
                      Portfolio Fit
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-5">
                    {portfolioFit.missingData.length > 0 ? (
                      <div className="rounded-2xl border border-amber-400/20 bg-amber-500/10 p-4 text-sm text-amber-100">
                        Login and build a paper portfolio to see personalized
                        portfolio fit.
                      </div>
                    ) : null}

                    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                      <MiniMetric
                        label="Current Simulated Holding"
                        value={portfolioFit.isInPortfolio ? "Yes" : "No"}
                      />
                      <MiniMetric
                        label="Current Weight"
                        value={formatPercent(portfolioFit.currentWeight)}
                      />
                      <MiniMetric
                        label="Sector"
                        value={portfolioFit.sector ?? "Unavailable"}
                      />
                      <MiniMetric
                        label="Fit Status"
                        value={
                          portfolioFit.isInPortfolio
                            ? "Portfolio-aware"
                            : "Research-only"
                        }
                      />
                    </div>

                    <div className="grid gap-4 lg:grid-cols-2">
                      <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                        <p className="text-sm font-medium text-white">
                          Concentration
                        </p>
                        <p className="mt-2 text-sm leading-6 text-slate-400">
                          {portfolioFit.concentrationMessage}
                        </p>
                      </div>
                      <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                        <p className="text-sm font-medium text-white">
                          Diversification Impact
                        </p>
                        <p className="mt-2 text-sm leading-6 text-slate-400">
                          {portfolioFit.diversificationImpact}
                        </p>
                      </div>
                    </div>

                    <div>
                      <p className="mb-2 text-sm font-medium text-white">
                        Portfolio Risk Drivers
                      </p>
                      <TextList
                        items={portfolioFit.riskDrivers}
                        empty="No portfolio-specific risk drivers found."
                        tone="amber"
                      />
                    </div>
                  </CardContent>
                </Card>
              ) : null}

              <div className="grid gap-5 lg:grid-cols-2">
                {decisionReadiness ? (
                  <Card
                    data-testid="decision-readiness-score"
                    className="border-white/10 bg-white/[0.04] text-white"
                  >
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-2xl">
                        <CheckCircle2 className="h-5 w-5 text-emerald-300" />
                        Decision Readiness Score
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Badge className={scoreTone(decisionReadiness.status).badge}>
                        {decisionReadiness.status}
                      </Badge>
                      <ScoreBar
                        score={decisionReadiness.score}
                        status={decisionReadiness.status}
                      />
                      <p className="mt-4 text-sm leading-6 text-slate-400">
                        {decisionReadiness.explanation}
                      </p>

                      <div className="mt-5 grid gap-4 md:grid-cols-2">
                        <div>
                          <p className="mb-2 text-sm font-medium text-white">
                            Completed Checks
                          </p>
                          <TextList
                            items={decisionReadiness.completedChecks}
                            empty="No checks completed yet."
                            tone="emerald"
                          />
                        </div>
                        <div>
                          <p className="mb-2 text-sm font-medium text-white">
                            Missing Checks
                          </p>
                          <TextList
                            items={decisionReadiness.missingChecks}
                            empty="No missing checks."
                            tone="amber"
                          />
                        </div>
                      </div>

                      <div className="mt-5">
                        <p className="mb-2 text-sm font-medium text-white">
                          Warnings
                        </p>
                        <TextList
                          items={decisionReadiness.warnings}
                          empty="No readiness warnings from available data."
                          tone="red"
                        />
                      </div>
                    </CardContent>
                  </Card>
                ) : null}

                {evidenceStrength ? (
                  <Card
                    data-testid="evidence-strength-meter"
                    className="border-white/10 bg-white/[0.04] text-white"
                  >
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-2xl">
                        <Database className="h-5 w-5 text-cyan-300" />
                        Evidence Strength Meter
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Badge className={scoreTone(evidenceStrength.status).badge}>
                        {evidenceStrength.status}
                      </Badge>
                      <ScoreBar
                        score={evidenceStrength.score}
                        status={evidenceStrength.status}
                      />
                      <p className="mt-4 text-sm leading-6 text-slate-400">
                        {evidenceStrength.explanation}
                      </p>

                      <div className="mt-5 grid gap-4 md:grid-cols-2">
                        <div>
                          <p className="mb-2 text-sm font-medium text-white">
                            Sources Available
                          </p>
                          <TextList
                            items={evidenceStrength.sourcesAvailable}
                            empty="No sources available."
                            tone="emerald"
                          />
                        </div>
                        <div>
                          <p className="mb-2 text-sm font-medium text-white">
                            Sources Missing
                          </p>
                          <TextList
                            items={evidenceStrength.sourcesMissing}
                            empty="No source gaps detected."
                            tone="amber"
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ) : null}
              </div>

              {intelligence.redFlags.length > 0 ? (
                <Card className="border-red-400/20 bg-red-500/10 text-red-100">
                  <CardContent className="p-5">
                    <p className="font-medium">Research Red Flags</p>
                    <div className="mt-3">
                      <TextList
                        items={intelligence.redFlags}
                        empty="No red flags found from available data."
                        tone="red"
                      />
                    </div>
                  </CardContent>
                </Card>
              ) : null}
            </>
          ) : null}
        </section>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <Card className="border-white/10 bg-[#0d1424]/80 text-white shadow-lg shadow-black/10 md:col-span-2">
            <CardContent className="p-5">
              <p className="text-sm text-slate-400">Current Price</p>

              <div className="mt-3 flex flex-wrap items-end gap-4">
                <p className="text-4xl font-semibold">
                  {formatCurrency(currentPrice, String(currency))}
                </p>

                <p
                  className={`flex items-center gap-2 pb-1 text-lg font-semibold ${changeClass}`}
                >
                  {changeIcon}
                  <span>
                    {computedDailyChange !== null && computedDailyChange > 0
                      ? "+"
                      : ""}
                    {formatCurrency(computedDailyChange, String(currency))}{" "}
                    <span>({formatPercent(computedDailyChangePercent)})</span>
                  </span>
                </p>
              </div>
            </CardContent>
          </Card>

          <MetricCard label="Market Cap" value={formatCompactNumber(marketCap)} />
          <MetricCard label="Volume" value={formatNumber(volume)} />
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            label="Day High"
            value={formatCurrency(dayHigh, String(currency))}
          />

          <MetricCard
            label="Day Low"
            value={formatCurrency(dayLow, String(currency))}
          />

          <MetricCard
            label="Previous Close"
            value={formatCurrency(previousClose, String(currency))}
          />

          <MetricCard
            label="Currency"
            value={String(currency)}
            helper={exchange ? `Exchange: ${exchange}` : undefined}
          />
        </div>

        <Card className="border-white/10 bg-white/[0.04] text-white">
          <CardHeader>
            <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
              <div>
                <CardTitle className="flex items-center gap-2 text-2xl">
                  <BarChart3 className="h-5 w-5 text-emerald-300" />
                  Price Chart
                </CardTitle>

                <p className="mt-2 text-sm text-slate-400">
                  Real historical price chart from yfinance.
                  {isChartLoading ? " Loading chart..." : ""}
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                {TIME_RANGES.map((range) => (
                  <Button
                    key={range}
                    type="button"
                    size="sm"
                    onClick={() => setSelectedRange(range)}
                    className={
                      selectedRange === range
                        ? "bg-blue-500 text-white hover:bg-blue-600"
                        : "bg-white/10 text-white hover:bg-white/20"
                    }
                  >
                    {range}
                  </Button>
                ))}
              </div>
            </div>
          </CardHeader>

          <CardContent>
            <div className="h-[380px] w-full">
              {isChartLoading ? (
                <div className="flex h-full items-center justify-center rounded-2xl border border-white/10 bg-black/20">
                  <div className="text-center">
                    <Loader2 className="mx-auto h-6 w-6 animate-spin text-blue-300" />
                    <p className="mt-3 text-sm text-slate-400">
                      Loading {selectedRange} chart...
                    </p>
                  </div>
                </div>
              ) : chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={chartData}
                    margin={{ top: 8, right: 16, left: 10, bottom: 8 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />

                    <XAxis
                      dataKey="date"
                      stroke="#94a3b8"
                      ticks={xAxisTicks}
                      interval={0}
                      tickMargin={10}
                      minTickGap={18}
                      tick={{ fontSize: 12 }}
                      tickFormatter={(value) =>
                        formatChartXAxisTick(value, selectedRange)
                      }
                    />

                    <YAxis
                      domain={["auto", "auto"]}
                      stroke="#94a3b8"
                      tick={{ fontSize: 12 }}
                      tickFormatter={(value) => `$${Number(value).toFixed(2)}`}
                    />

                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#0f172a",
                        border: "1px solid rgba(255,255,255,0.1)",
                        borderRadius: "12px",
                        color: "white",
                      }}
                      formatter={(value) => [
                        formatCurrency(value, String(currency)),
                        "Close",
                      ]}
                      labelFormatter={(label) =>
                        formatChartTooltipLabel(label, selectedRange)
                      }
                    />

                    <Line
                      type="monotone"
                      dataKey="close"
                      stroke="#60a5fa"
                      strokeWidth={2}
                      dot={false}
                      activeDot={{ r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full items-center justify-center rounded-2xl border border-dashed border-white/10 bg-black/20">
                  <div className="text-center">
                    <p className="font-medium text-white">
                      No chart data available for {selectedRange}.
                    </p>
                    <p className="mt-1 text-sm text-slate-400">
                      Try another range or check the backend chart endpoint.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-6 lg:grid-cols-[1.4fr_0.6fr]">
          <Card className="border-white/10 bg-white/[0.04] text-white">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-2xl">
                <Database className="h-5 w-5 text-emerald-300" />
                SEC Fundamentals
              </CardTitle>

              <p className="text-sm text-slate-400">
                Latest available fundamentals from SEC Company Facts.
              </p>
            </CardHeader>

            <CardContent>
              {secWarnings.length > 0 ? (
                <div className="mb-4 rounded-2xl border border-amber-400/20 bg-amber-500/10 p-4 text-sm text-amber-100">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-300" />
                    <div>
                      <p className="font-medium text-amber-100">
                        SEC fundamentals are unavailable for this ticker right now.
                      </p>
                      <p className="mt-1 text-amber-100/80">
                        SEC Company Facts are mainly available for SEC-reporting
                        public companies. Market data may still be available.
                      </p>
                      <p className="mt-1 text-amber-100/80">
                        The rest of the stock page stays available, including
                        price, chart, news, watchlist, portfolio actions, and Ask
                        AI.
                      </p>
                    </div>
                  </div>
                </div>
              ) : null}

              <div className="grid gap-4 md:grid-cols-2">
                <MetricCard
                  label="Revenue"
                  value={formatCompactNumber(revenue)}
                  helper="Latest reported revenue"
                />

                <MetricCard
                  label="Net Income"
                  value={formatCompactNumber(netIncome)}
                  helper="Latest reported net income"
                />

                <MetricCard
                  label="Assets"
                  value={formatCompactNumber(assets)}
                  helper="Latest reported assets"
                />

                <MetricCard
                  label="Liabilities"
                  value={formatCompactNumber(liabilities)}
                  helper="Latest reported liabilities"
                />

                <MetricCard
                  label="Equity"
                  value={formatCompactNumber(equity)}
                  helper="Latest reported shareholders' equity"
                />

                <MetricCard
                  label="Fiscal Year"
                  value={fiscalYear ? String(fiscalYear) : "—"}
                  helper={form ? `Form: ${form}` : undefined}
                />
              </div>

              <div className="mt-4 rounded-2xl border border-white/10 bg-black/20 p-4 text-sm text-slate-400">
                <p>
                  <span className="font-medium text-white">Filing Date:</span>{" "}
                  {formatDate(filingDate)}
                </p>

                <p className="mt-2">
                  <span className="font-medium text-white">Source:</span>{" "}
                  {String(secSource)}
                </p>

                {secFetchedAt ? (
                  <p className="mt-2">
                    <span className="font-medium text-white">Fetched:</span>{" "}
                    {formatDateTime(secFetchedAt)}
                  </p>
                ) : null}
              </div>
            </CardContent>
          </Card>

          <Card className="border-white/10 bg-white/[0.04] text-white">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-2xl">
                <Activity className="h-5 w-5 text-violet-300" />
                Actions
              </CardTitle>
            </CardHeader>

            <CardContent>
              <p className="text-sm leading-6 text-slate-400">
                Save this stock, simulate a buy, or ask AI how it fits a beginner paper-trading portfolio.
              </p>

              {isInPortfolio && portfolioHolding ? (
                <div className="mt-4 rounded-2xl border border-blue-400/20 bg-blue-500/10 p-4 text-sm text-blue-100">
                  <p className="font-medium">Already in portfolio</p>
                  <p className="mt-1 text-blue-100/80">
                    You currently hold {portfolioHolding.shares} simulated share
                    {portfolioHolding.shares === 1 ? "" : "s"} of {ticker}.
                  </p>
                </div>
              ) : null}

              <div className="mt-5 flex flex-col gap-3">
                <Button
                  onClick={() => setShowPortfolioForm((current) => !current)}
                  data-testid="stock-add-portfolio"
                  className="justify-start bg-blue-500 text-white hover:bg-blue-600"
                >
                  <Wallet className="mr-2 h-4 w-4" />
                  {showPortfolioForm
                    ? "Close Portfolio Form"
                    : isInPortfolio
                      ? "Add More Shares"
                      : "Add to Portfolio"}
                </Button>

                {showPortfolioForm ? (
                  <div className="rounded-2xl border border-white/10 bg-black/20 p-4 transition-colors duration-200 hover:border-blue-300/25">
                    <p className="text-sm font-medium text-white">
                      Simulate Buying {ticker}
                    </p>

                    <p className="mt-2 text-xs leading-5 text-slate-400">
                      This creates a virtual paper-trading position. It does not place a real trade.
                    </p>

                    <div className="mt-4 space-y-3">
                      <div>
                        <label className="text-xs text-slate-400">Shares</label>
                        <input
                          type="number"
                          min="0"
                          step="0.0001"
                          value={portfolioShares}
                          onChange={(event) =>
                            setPortfolioShares(event.target.value)
                          }
                          className="mt-1 w-full rounded-xl border border-white/10 bg-slate-950 px-3 py-2 text-sm text-white outline-none focus:border-blue-400"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div className="rounded-xl border border-white/10 bg-white/[0.04] p-3">
                          <p className="text-xs text-slate-500">Buy Price</p>
                          <p className="mt-1 font-semibold text-white">
                            {formatCurrency(currentPrice, String(currency))}
                          </p>
                        </div>

                        <div className="rounded-xl border border-white/10 bg-white/[0.04] p-3">
                          <p className="text-xs text-slate-500">
                            Estimated Cost
                          </p>
                          <p className="mt-1 font-semibold text-white">
                            {formatCurrency(estimatedCost, String(currency))}
                          </p>
                        </div>
                      </div>

                      <Button
                        onClick={handleSimulatedBuy}
                        disabled={isPortfolioLoading}
                        className="w-full bg-emerald-500 text-white hover:bg-emerald-600"
                      >
                        {isPortfolioLoading ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <Wallet className="mr-2 h-4 w-4" />
                        )}
                        {isPortfolioLoading ? "Saving..." : "Simulate Buy"}
                      </Button>

                      <Link href="/portfolio">
                        <Button className="w-full bg-white/10 text-white hover:bg-white/20">
                          Open Portfolio
                        </Button>
                      </Link>
                    </div>
                  </div>
                ) : null}

                <Button
                  onClick={handleToggleWatchlist}
                  disabled={isWatchlistLoading}
                  className={
                    isWatchlisted
                      ? "justify-start bg-red-500/80 text-white hover:bg-red-600"
                      : "justify-start bg-emerald-500 text-white hover:bg-emerald-600"
                  }
                >
                  {isWatchlistLoading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Star className="mr-2 h-4 w-4" />
                  )}

                  {isWatchlistLoading
                    ? "Updating Watchlist..."
                    : isWatchlisted
                      ? "Remove from Watchlist"
                      : "Add to Watchlist"}
                </Button>

                <Link href={askAiHref}>
                  <Button
                    data-testid="stock-ask-ai"
                    className="w-full justify-start bg-violet-500 text-white hover:bg-violet-600"
                  >
                    <Sparkles className="mr-2 h-4 w-4" />
                    Ask AI About {ticker}
                  </Button>
                </Link>

                <Link href="/watchlist">
                  <Button className="w-full justify-start bg-white/10 text-white hover:bg-white/20">
                    <Star className="mr-2 h-4 w-4" />
                    Open Watchlist
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="border-white/10 bg-white/[0.04] text-white">
          <CardHeader>
            <div className="flex flex-col justify-between gap-3 md:flex-row md:items-center">
              <div>
                <CardTitle className="flex items-center gap-2 text-2xl">
                  <Newspaper className="h-5 w-5 text-blue-300" />
                  Recent News
                </CardTitle>

                <p className="mt-2 text-sm text-slate-400">
                  Latest market news for {ticker} from yfinance.
                  {isNewsLoading ? " Loading news..." : ""}
                </p>
              </div>

              <Button
                onClick={loadNewsData}
                disabled={isNewsLoading}
                className="bg-white/10 text-white hover:bg-white/20"
              >
                {isNewsLoading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCcw className="mr-2 h-4 w-4" />
                )}
                Refresh News
              </Button>
            </div>
          </CardHeader>

          <CardContent>
            {isNewsLoading ? (
              <div className="flex min-h-[220px] items-center justify-center rounded-2xl border border-white/10 bg-black/20">
                <div className="text-center">
                  <Loader2 className="mx-auto h-7 w-7 animate-spin text-blue-300" />
                  <p className="mt-3 text-sm text-slate-400">
                    Loading recent news...
                  </p>
                </div>
              </div>
            ) : newsItems.length > 0 ? (
              <div className="grid gap-4 md:grid-cols-2">
                {newsItems.map((item, index) => (
                  <div
                    key={`${item.title}-${index}`}
                    className="rounded-2xl border border-white/10 bg-black/20 p-4"
                  >
                    <div className="flex gap-4">
                      {item.thumbnail ? (
                        <img
                          src={item.thumbnail}
                          alt=""
                          className="h-20 w-20 rounded-xl object-cover"
                        />
                      ) : (
                        <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-xl bg-white/10">
                          <Newspaper className="h-6 w-6 text-slate-500" />
                        </div>
                      )}

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          {item.publisher ? (
                            <Badge className="bg-blue-500/15 text-blue-200">
                              {item.publisher}
                            </Badge>
                          ) : null}

                          {item.type ? (
                            <Badge className="bg-white/10 text-slate-300">
                              {item.type}
                            </Badge>
                          ) : null}

                          {item.relevanceScore ? (
                            <Badge className="bg-emerald-500/15 text-emerald-200">
                              Relevance {item.relevanceScore}
                            </Badge>
                          ) : null}
                        </div>

                        <h3 className="mt-2 line-clamp-2 font-semibold leading-6 text-white">
                          {item.title}
                        </h3>

                        <p className="mt-1 text-xs text-slate-500">
                          {formatDateTime(item.publishedAt)}
                        </p>

                        {item.relevanceReason ? (
                          <p className="mt-1 text-xs text-emerald-300">
                            {item.relevanceReason}
                          </p>
                        ) : null}
                      </div>
                    </div>

                    {item.summary ? (
                      <p className="mt-3 line-clamp-3 text-sm leading-6 text-slate-400">
                        {item.summary}
                      </p>
                    ) : null}

                    {item.link ? (
                      <a
                        href={item.link}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-4 inline-flex items-center text-sm font-medium text-blue-300 hover:text-blue-200"
                      >
                        Read article
                        <ExternalLink className="ml-2 h-3.5 w-3.5" />
                      </a>
                    ) : null}
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-white/10 bg-black/20 p-8 text-center">
                <Newspaper className="mx-auto h-8 w-8 text-slate-500" />

                <h2 className="mt-4 text-lg font-semibold text-white">
                  No recent news found
                </h2>

                <p className="mt-2 text-sm text-slate-400">
                  yfinance did not return news for {ticker}. Try refreshing or search another stock.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-white/10 bg-white/[0.04] text-white">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-2xl">
              <Building2 className="h-5 w-5 text-violet-300" />
              Beginner Research Flow
            </CardTitle>
          </CardHeader>

          <CardContent>
            <div className="grid gap-4 md:grid-cols-4">
              <div className="rounded-2xl border border-white/10 bg-black/20 p-4 transition-colors duration-200 hover:border-blue-300/25">
                <p className="font-medium text-white">1. Research</p>
                <p className="mt-2 text-sm leading-6 text-slate-400">
                  Review price, chart, market stats, and SEC fundamentals.
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-black/20 p-4 transition-colors duration-200 hover:border-blue-300/25">
                <p className="font-medium text-white">2. Read News</p>
                <p className="mt-2 text-sm leading-6 text-slate-400">
                  Understand recent events that may explain price movement.
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-black/20 p-4 transition-colors duration-200 hover:border-emerald-300/25">
                <p className="font-medium text-white">3. Save or Simulate</p>
                <p className="mt-2 text-sm leading-6 text-slate-400">
                  Add the stock to your watchlist or simulate a paper-trading buy.
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-black/20 p-4 transition-colors duration-200 hover:border-emerald-300/25">
                <p className="font-medium text-white">4. Track</p>
                <p className="mt-2 text-sm leading-6 text-slate-400">
                  Open your portfolio to track cost basis, value, and P/L.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
