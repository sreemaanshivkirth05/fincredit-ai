"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";

import {
  Activity,
  BarChart3,
  Building2,
  Database,
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
  getMarketData,
  getMarketHistory,
  getSecCompanyFacts,
  getSecFundamentalsHistory,
  getWatchlistStatus,
  removeStockFromWatchlist,
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

function getErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message;
  return String(error);
}

function MetricCard({ label, value, helper }: MetricCardProps) {
  return (
    <Card className="border-white/10 bg-white/[0.04] text-white">
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

export default function StockDetailPage() {
  const params = useParams<{ ticker: string }>();
  const ticker = String(params?.ticker ?? "").toUpperCase();

  const [marketData, setMarketData] = useState<any>(null);
  const [marketHistory, setMarketHistory] = useState<any>(null);
  const [companyFacts, setCompanyFacts] = useState<any>(null);
  const [fundamentalsHistory, setFundamentalsHistory] = useState<any>(null);

  const [selectedRange, setSelectedRange] = useState<TimeRange>("1M");
  const [isLoading, setIsLoading] = useState(true);
  const [isChartLoading, setIsChartLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);

  const [isWatchlisted, setIsWatchlisted] = useState(false);
  const [isWatchlistLoading, setIsWatchlistLoading] = useState(false);

  const loadCoreStockData = useCallback(async () => {
    if (!ticker) return;

    const nextErrors: string[] = [];

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
        nextErrors.push(
          `SEC company facts failed: ${getErrorMessage(factsResult.reason)}`
        );
      }

      if (fundamentalsResult.status === "fulfilled") {
        setFundamentalsHistory(fundamentalsResult.value);
      } else {
        nextErrors.push(
          `SEC fundamentals history failed: ${getErrorMessage(
            fundamentalsResult.reason
          )}`
        );
      }

      setErrors((currentErrors) => [
        ...currentErrors.filter((item) => item.startsWith("Chart data failed")),
        ...nextErrors,
      ]);
    } catch (error) {
      setErrors([`Stock page failed: ${getErrorMessage(error)}`]);
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

  useEffect(() => {
    async function initialLoad() {
      setIsLoading(true);
      await loadCoreStockData();
      setIsLoading(false);
    }

    initialLoad();
  }, [loadCoreStockData]);

  useEffect(() => {
    loadChartData();
  }, [loadChartData]);

  useEffect(() => {
    loadWatchlistStatus();
  }, [loadWatchlistStatus]);

  async function handleRefresh() {
    setIsRefreshing(true);
    await Promise.all([loadCoreStockData(), loadChartData(), loadWatchlistStatus()]);
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
    `Analyze ${ticker}. Explain the business, current stock performance, SEC fundamentals, major risks, and whether it would make sense for a beginner paper-trading portfolio.`
  );

  const askAiHref = `/ask?question=${askAiQuestion}`;

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
              Fetching price, chart, SEC fundamentals, and watchlist status.
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
              <Button className="bg-violet-500 text-white hover:bg-violet-600">
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

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <Card className="border-white/10 bg-white/[0.04] text-white md:col-span-2">
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
                Add this stock to your watchlist now. Portfolio simulation comes
                in the next phase.
              </p>

              <div className="mt-5 flex flex-col gap-3">
                <Button disabled className="justify-start bg-white/10 text-white">
                  <Wallet className="mr-2 h-4 w-4" />
                  Add to Portfolio
                </Button>

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
                  <Button className="w-full justify-start bg-violet-500 text-white hover:bg-violet-600">
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
            <CardTitle className="flex items-center gap-2 text-2xl">
              <Newspaper className="h-5 w-5 text-blue-300" />
              News
            </CardTitle>

            <p className="text-sm text-slate-400">
              News integration will come in a later phase.
            </p>
          </CardHeader>

          <CardContent>
            <div className="rounded-2xl border border-dashed border-white/10 bg-black/20 p-6 text-center text-sm text-slate-400">
              Stock-related news placeholder for {ticker}.
            </div>
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
            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <p className="font-medium text-white">1. Research</p>
                <p className="mt-2 text-sm leading-6 text-slate-400">
                  Review price, chart, market stats, and SEC fundamentals.
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <p className="font-medium text-white">2. Save</p>
                <p className="mt-2 text-sm leading-6 text-slate-400">
                  Add the stock to your watchlist when you want to keep tracking
                  it.
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <p className="font-medium text-white">3. Simulate</p>
                <p className="mt-2 text-sm leading-6 text-slate-400">
                  Add to a simulated portfolio in the next phase.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}