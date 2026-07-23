"use client";

import type React from "react";
import Link from "next/link";
import { useEffect, useState } from "react";

import {
  AlertTriangle,
  ArrowUpRight,
  Building2,
  FileSearch,
  Loader2,
  Newspaper,
  Plus,
  RefreshCcw,
  Search,
  Trash2,
  TrendingUp,
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  getWatchlistData,
  refreshWatchlistPrices,
  removeStockFromWatchlist,
} from "@/lib/api";

type WatchlistCompany = {
  ticker: string;
  company: string;
  sector: string;
  risk: string;
  riskScore: number;
  sentiment: string;
  filing: string;
  status: string;
  currentPrice?: number | null;
  previousClose?: number | null;
  marketCap?: number | null;
  volume?: number | null;
  currency?: string | null;
  exchange?: string | null;
  addedAt?: string | null;
};

type SentimentData = {
  ticker: string;
  positive: number;
  negative: number;
};

type NewsRadarItem = {
  ticker: string;
  headline: string;
  category: string;
  impact: string;
};

type WatchlistApiData = {
  companiesTracked: number;
  needsReview: number;
  newFilingChanges: number;
  positiveSentiment: number;
  watchlist: WatchlistCompany[];
  sentimentData: SentimentData[];
  newsRadar: NewsRadarItem[];
  message: string;
};

const fallbackWatchlist: WatchlistCompany[] = [
  {
    ticker: "MSFT",
    company: "Microsoft Corp.",
    sector: "Technology",
    risk: "Low",
    riskScore: 28,
    sentiment: "Positive",
    filing: "10-K analyzed",
    status: "Stable",
  },
  {
    ticker: "NVDA",
    company: "NVIDIA Corp.",
    sector: "Semiconductors",
    risk: "Medium",
    riskScore: 54,
    sentiment: "Positive",
    filing: "No new filing",
    status: "Monitor",
  },
  {
    ticker: "TSLA",
    company: "Tesla Inc.",
    sector: "Automotive",
    risk: "High",
    riskScore: 78,
    sentiment: "Mixed",
    filing: "10-Q changed",
    status: "Needs Review",
  },
  {
    ticker: "JPM",
    company: "JPMorgan Chase",
    sector: "Financials",
    risk: "Low",
    riskScore: 33,
    sentiment: "Neutral",
    filing: "10-K analyzed",
    status: "Stable",
  },
  {
    ticker: "AAPL",
    company: "Apple Inc.",
    sector: "Technology",
    risk: "Medium",
    riskScore: 49,
    sentiment: "Neutral",
    filing: "No new filing",
    status: "Monitor",
  },
];

const fallbackSentimentData: SentimentData[] = [
  { ticker: "MSFT", positive: 12, negative: 2 },
  { ticker: "NVDA", positive: 15, negative: 3 },
  { ticker: "TSLA", positive: 6, negative: 9 },
  { ticker: "JPM", positive: 5, negative: 4 },
  { ticker: "AAPL", positive: 7, negative: 5 },
];

const fallbackNewsRadar: NewsRadarItem[] = [
  {
    ticker: "TSLA",
    headline:
      "Margin pressure and regulatory concerns increased in recent coverage.",
    category: "Risk News",
    impact: "High",
  },
  {
    ticker: "NVDA",
    headline:
      "AI infrastructure demand remains strong across enterprise customers.",
    category: "Growth News",
    impact: "Medium",
  },
  {
    ticker: "MSFT",
    headline:
      "Cloud and AI revenue outlook remains positive, but regulatory mentions increased.",
    category: "Mixed News",
    impact: "Medium",
  },
];

function formatCurrency(value?: number | null, currency = "USD") {
  if (value === null || value === undefined || Number.isNaN(value)) return "-";

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

function formatCompactNumber(value?: number | null) {
  if (value === null || value === undefined || Number.isNaN(value)) return "-";

  return new Intl.NumberFormat("en-US", {
    notation: "compact",
    maximumFractionDigits: 2,
  }).format(value);
}

function formatPercent(value?: number | null) {
  if (value === null || value === undefined || Number.isNaN(value)) return "-";

  return `${value > 0 ? "+" : ""}${value.toFixed(2)}%`;
}

function calculateDailyChangePercent(company: WatchlistCompany) {
  if (!company.currentPrice || !company.previousClose) return null;

  return ((company.currentPrice - company.previousClose) / company.previousClose) * 100;
}

export default function WatchlistPage() {
  const [watchlistData, setWatchlistData] =
    useState<WatchlistApiData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshingPrices, setRefreshingPrices] = useState(false);
  const [removingTicker, setRemovingTicker] = useState<string | null>(null);
  const [apiError, setApiError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  async function loadWatchlistData() {
    try {
      setLoading(true);
      setApiError("");

      const data = await getWatchlistData();
      setWatchlistData(data);
    } catch (error) {
      setApiError("Backend watchlist API is not connected.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadWatchlistData();
  }, []);

  async function handleRefreshPrices() {
    try {
      setRefreshingPrices(true);
      setApiError("");
      setSuccessMessage("");

      const response = await refreshWatchlistPrices();
      await loadWatchlistData();

      const failedTickers = response.failedTickers ?? [];
      const failedMessage =
        failedTickers.length > 0
          ? ` Could not refresh: ${failedTickers.join(", ")}.`
          : "";

      setSuccessMessage(
        `Watchlist prices refreshed. ${response.refreshedCount ?? 0} stocks updated.${failedMessage}`
      );
    } catch (error) {
      console.error(error);
      setApiError("Unable to refresh watchlist prices.");
    } finally {
      setRefreshingPrices(false);
    }
  }

  async function handleRemoveTicker(ticker: string) {
    try {
      setRemovingTicker(ticker);
      setApiError("");
      setSuccessMessage("");

      await removeStockFromWatchlist(ticker);
      await loadWatchlistData();
      setSuccessMessage(`${ticker} removed from watchlist.`);
    } catch (error) {
      console.error(error);
      setApiError(`Unable to remove ${ticker} from watchlist.`);
    } finally {
      setRemovingTicker(null);
    }
  }

  const activeWatchlist = watchlistData?.watchlist ?? fallbackWatchlist;
  const sentimentData = watchlistData?.sentimentData ?? fallbackSentimentData;
  const newsRadar = watchlistData?.newsRadar ?? fallbackNewsRadar;

  const companiesTracked =
    watchlistData?.companiesTracked ?? activeWatchlist.length;
  const needsReview = watchlistData?.needsReview ?? 1;
  const newFilingChanges = watchlistData?.newFilingChanges ?? 1;
  const positiveSentiment = watchlistData?.positiveSentiment ?? 62;

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <Badge className="mb-3 bg-blue-500/15 text-blue-200">
              Watchlist News Radar
            </Badge>
            <h1 className="text-3xl font-semibold tracking-tight">
              Company Watchlist
            </h1>
            <p className="mt-2 text-sm text-slate-400">
              Monitor saved companies, new SEC filing activity, red flags,
              sentiment changes, and AI analysis status.
            </p>

            {loading && (
              <p className="mt-2 text-xs text-blue-300">
                Loading backend watchlist data...
              </p>
            )}

            {!loading && watchlistData && (
              <p className="mt-2 text-xs text-emerald-300">
                Backend connected: {watchlistData.message}
              </p>
            )}

            {apiError && (
              <p className="mt-2 text-xs text-red-300">{apiError}</p>
            )}

            {successMessage && (
              <p className="mt-2 text-xs text-emerald-300">
                {successMessage}
              </p>
            )}
          </div>

          <div className="flex flex-wrap gap-3">
            <Button
              onClick={loadWatchlistData}
              className="bg-white/10 text-white hover:bg-white/20"
            >
              <RefreshCcw className="mr-2 h-4 w-4" />
              Refresh
            </Button>

            <Button
              onClick={handleRefreshPrices}
              disabled={refreshingPrices}
              data-testid="watchlist-refresh-prices"
              className="bg-emerald-500 text-white hover:bg-emerald-600"
            >
              {refreshingPrices ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <RefreshCcw className="mr-2 h-4 w-4" />
              )}
              Refresh Prices
            </Button>

            <Link href="/dashboard">
              <Button className="bg-blue-500 hover:bg-blue-600">
                <Plus className="mr-2 h-4 w-4" />
                Add Company
              </Button>
            </Link>
          </div>
        </div>

        <p className="max-w-3xl text-sm leading-6 text-slate-400">
          Use Refresh Prices to update watchlist prices from yfinance so you
          can monitor candidates before simulating a buy in the paper
          portfolio.
        </p>

        <Card className="border-white/10 bg-white/[0.04] text-white">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5 text-blue-300" />
              Add a Stock
            </CardTitle>
          </CardHeader>

          <CardContent>
            <p className="mb-3 text-sm text-slate-400">
              Search a ticker, open the stock research page, and use Add to
              Watchlist from there.
            </p>

            <StockSearch />
          </CardContent>
        </Card>

        <div className="grid gap-4 md:grid-cols-4">
          <MetricCard
            title="Companies Tracked"
            value={String(companiesTracked)}
            change="Watchlist"
            icon={<Building2 className="h-5 w-5 text-blue-300" />}
          />
          <MetricCard
            title="Needs Review"
            value={String(needsReview)}
            change="TSLA"
            icon={<AlertTriangle className="h-5 w-5 text-red-300" />}
          />
          <MetricCard
            title="New Filing Changes"
            value={String(newFilingChanges)}
            change="10-Q changed"
            icon={<FileSearch className="h-5 w-5 text-violet-300" />}
          />
          <MetricCard
            title="Positive Sentiment"
            value={`${positiveSentiment}%`}
            change="Watchlist avg"
            icon={<TrendingUp className="h-5 w-5 text-emerald-300" />}
          />
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
          <Card className="border-white/10 bg-white/[0.04] text-white">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Newspaper className="h-5 w-5 text-blue-300" />
                News Sentiment by Company
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[320px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={sentimentData}>
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
                      dataKey="positive"
                      fill="#34d399"
                      radius={[8, 8, 0, 0]}
                    />
                    <Bar
                      dataKey="negative"
                      fill="#f87171"
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
                <AlertTriangle className="h-5 w-5 text-amber-300" />
                News Radar Highlights
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {newsRadar.map((item) => (
                <div
                  key={`${item.ticker}-${item.category}`}
                  className="rounded-2xl border border-white/10 bg-black/20 p-4"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{item.ticker}</p>
                      <p className="mt-1 text-xs text-slate-500">
                        {item.category}
                      </p>
                    </div>
                    <RiskBadge risk={item.impact} />
                  </div>
                  <p className="mt-3 text-sm leading-6 text-slate-400">
                    {item.headline}
                  </p>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        <Card className="border-white/10 bg-white/[0.04] text-white">
          <CardHeader>
            <CardTitle>Tracked Companies</CardTitle>
          </CardHeader>
          <CardContent>
            {activeWatchlist.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow className="border-white/10">
                    <TableHead className="text-slate-400">Ticker</TableHead>
                    <TableHead className="text-slate-400">Company</TableHead>
                    <TableHead className="text-slate-400">Sector</TableHead>
                    <TableHead className="text-slate-400">Price</TableHead>
                    <TableHead className="text-slate-400">Prev Close</TableHead>
                    <TableHead className="text-slate-400">Daily Change</TableHead>
                    <TableHead className="text-slate-400">Volume</TableHead>
                    <TableHead className="text-slate-400">Risk</TableHead>
                    <TableHead className="text-slate-400">Score</TableHead>
                    <TableHead className="text-slate-400">Sentiment</TableHead>
                    <TableHead className="text-slate-400">Filing</TableHead>
                    <TableHead className="text-slate-400">Status</TableHead>
                    <TableHead className="text-slate-400">Action</TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {activeWatchlist.map((w) => {
                  const currency = w.currency ?? "USD";
                  const dailyChangePercent = calculateDailyChangePercent(w);
                  const isPositive = (dailyChangePercent ?? 0) >= 0;

                  return (
                    <TableRow key={w.ticker} className="border-white/10">
                      <TableCell className="font-medium text-white">
                        {w.ticker}
                      </TableCell>
                      <TableCell className="text-slate-300">
                        {w.company}
                      </TableCell>
                      <TableCell className="text-slate-300">
                        {w.sector}
                      </TableCell>
                      <TableCell className="text-slate-300">
                        {formatCurrency(w.currentPrice, currency)}
                      </TableCell>
                      <TableCell className="text-slate-300">
                        {formatCurrency(w.previousClose, currency)}
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={
                            isPositive
                              ? "bg-emerald-500/15 text-emerald-200"
                              : "bg-red-500/15 text-red-200"
                          }
                        >
                          {formatPercent(dailyChangePercent)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-slate-300">
                        {formatCompactNumber(w.volume)}
                      </TableCell>
                      <TableCell>
                        <RiskBadge risk={w.risk} />
                      </TableCell>
                      <TableCell className="text-slate-300">
                        {w.riskScore}
                      </TableCell>
                      <TableCell className="text-slate-300">
                        {w.sentiment}
                      </TableCell>
                      <TableCell className="text-slate-300">
                        {w.filing}
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={w.status} />
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Link href={`/stock/${w.ticker}`}>
                            <Button
                              size="sm"
                              variant="outline"
                              className="border-white/10 bg-white/5 text-white hover:bg-white/10"
                            >
                              Open
                              <ArrowUpRight className="ml-2 h-3.5 w-3.5" />
                            </Button>
                          </Link>

                          <Button
                            size="sm"
                            disabled={removingTicker === w.ticker}
                            onClick={() => handleRemoveTicker(w.ticker)}
                            className="bg-red-500/80 text-white hover:bg-red-600"
                          >
                            {removingTicker === w.ticker ? (
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                              <Trash2 className="mr-2 h-4 w-4" />
                            )}
                            Remove
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                  })}
                </TableBody>
              </Table>
            ) : (
              <div className="rounded-2xl border border-dashed border-white/10 bg-black/20 p-8 text-center">
                <Search className="mx-auto h-8 w-8 text-slate-500" />

                <h2 className="mt-4 text-lg font-semibold text-white">
                  Your watchlist is empty
                </h2>

                <p className="mt-2 text-sm text-slate-400">
                  Use the watchlist to monitor stocks before simulating a buy.
                  Search a ticker, open its research page, and add it here when
                  you want to keep tracking price, filings, and AI context.
                </p>

                <div className="mt-5 flex flex-wrap justify-center gap-3">
                  <Link href="/stock/AAPL">
                    <Button className="bg-blue-500 text-white hover:bg-blue-600">
                      Research AAPL
                    </Button>
                  </Link>

                  <Link href="/dashboard">
                    <Button className="bg-white/10 text-white hover:bg-white/20">
                      Search Stocks
                    </Button>
                  </Link>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-white/10 bg-white/[0.04] text-white">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileSearch className="h-5 w-5 text-violet-300" />
              Filing Change Monitor
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <MonitorCard
                title="Latest Change"
                value="TSLA 10-Q"
                detail="Risk language changed"
              />
              <MonitorCard
                title="Evidence Status"
                value="Validated"
                detail="Citations available"
              />
              <MonitorCard
                title="Next Action"
                value="Review"
                detail="Run company analysis"
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

function RiskBadge({ risk }: { risk: string }) {
  const styles =
    risk === "High"
      ? "bg-red-500/15 text-red-200"
      : risk === "Medium"
        ? "bg-amber-500/15 text-amber-200"
        : "bg-emerald-500/15 text-emerald-200";

  return <Badge className={styles}>{risk}</Badge>;
}

function StatusBadge({ status }: { status: string }) {
  const styles =
    status === "Needs Review"
      ? "bg-red-500/15 text-red-200"
      : status === "Monitor"
        ? "bg-amber-500/15 text-amber-200"
        : "bg-emerald-500/15 text-emerald-200";

  return <Badge className={styles}>{status}</Badge>;
}

function MonitorCard({
  title,
  value,
  detail,
}: {
  title: string;
  value: string;
  detail: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
      <p className="text-sm text-slate-400">{title}</p>
      <p className="mt-2 font-semibold text-white">{value}</p>
      <p className="mt-1 text-sm text-slate-500">{detail}</p>
    </div>
  );
}
