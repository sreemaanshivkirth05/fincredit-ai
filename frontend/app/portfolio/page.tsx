"use client";

import type React from "react";
import Link from "next/link";
import { Fragment, useEffect, useMemo, useState } from "react";

import {
  AlertTriangle,
  ArrowUpRight,
  BarChart3,
  BriefcaseBusiness,
  DollarSign,
  Gauge,
  History,
  Loader2,
  PieChart,
  Plus,
  ReceiptText,
  RefreshCcw,
  Search,
  ShieldCheck,
  Trash2,
  TrendingDown,
  TrendingUp,
  Wallet,
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
import {
  getPortfolioData,
  getPortfolioTransactions,
  removePortfolioHolding,
  refreshPortfolioPrices,
  sellStockFromPortfolio,
} from "@/lib/api";

type Holding = {
  ticker: string;
  company: string;

  shares: number;
  avgPrice: number;
  currentPrice?: number | null;

  totalCost?: number | null;
  value: number;
  weight: number;

  unrealizedPL?: number | null;
  unrealizedPLPercent?: number | null;

  sector: string;
  risk: string;
  score: number;
  sentiment: string;

  currency?: string | null;
  exchange?: string | null;

  createdAt?: string | null;
  updatedAt?: string | null;
};

type SectorAllocation = {
  name: string;
  value: number;
};

type PortfolioTransaction = {
  id: number;
  ticker: string;
  company: string;
  action: "BUY" | "SELL" | string;
  shares: number;
  price: number;
  totalAmount: number;
  realizedPL?: number | null;
  realizedPLPercent?: number | null;
  currency?: string | null;
  exchange?: string | null;
  createdAt?: string | null;
};

type PortfolioApiData = {
  totalValue: number;
  totalCost: number;
  unrealizedPL: number;
  unrealizedPLPercent: number;

  overallRisk: number;
  highRiskExposure: number;
  holdingsCount: number;

  holdings: Holding[];
  sectorAllocation: SectorAllocation[];
  transactions?: PortfolioTransaction[];
  message: string;
};

const chartColors = ["#60a5fa", "#34d399", "#f59e0b", "#a78bfa", "#f472b6"];

function formatCurrency(value?: number | null, currency = "USD") {
  if (value === null || value === undefined || Number.isNaN(value)) return "—";

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

function formatCompactCurrency(value?: number | null, currency = "USD") {
  if (value === null || value === undefined || Number.isNaN(value)) return "—";

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    notation: "compact",
    maximumFractionDigits: 2,
  }).format(value);
}

function formatPercent(value?: number | null) {
  if (value === null || value === undefined || Number.isNaN(value)) return "—";

  return `${value > 0 ? "+" : ""}${value.toFixed(2)}%`;
}

function formatNumber(value?: number | null) {
  if (value === null || value === undefined || Number.isNaN(value)) return "—";

  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 4,
  }).format(value);
}

function formatDate(value?: string | null) {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function PortfolioPage() {
  const [portfolioData, setPortfolioData] = useState<PortfolioApiData | null>(
    null
  );
  const [transactions, setTransactions] = useState<PortfolioTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [removingTicker, setRemovingTicker] = useState<string | null>(null);
  const [refreshingPrices, setRefreshingPrices] = useState(false);
  const [sellingTicker, setSellingTicker] = useState<string | null>(null);
  const [sellShares, setSellShares] = useState("");
  const [sellPrice, setSellPrice] = useState("");
  const [submittingSell, setSubmittingSell] = useState(false);
  const [apiError, setApiError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  async function loadPortfolioData() {
    try {
      setLoading(true);
      setApiError("");

      const data = await getPortfolioData();
      setPortfolioData(data);
      setTransactions(data.transactions ?? []);

      try {
        const transactionData = await getPortfolioTransactions();
        setTransactions(transactionData.transactions ?? data.transactions ?? []);
      } catch (transactionError) {
        console.warn("Portfolio transaction history unavailable.");
      }
    } catch (error) {
      setPortfolioData(null);
      setTransactions([]);
      setApiError(
        "Backend portfolio API is not reachable. Start or restart FastAPI on http://127.0.0.1:8000."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadPortfolioData();
  }, []);

  async function handleRemoveHolding(ticker: string) {
    try {
      setRemovingTicker(ticker);
      setApiError("");
      setSuccessMessage("");

      await removePortfolioHolding(ticker);
      await loadPortfolioData();
      setSuccessMessage(`${ticker} was deleted from active holdings.`);
    } catch (error) {
      console.error(error);
      setApiError(`Unable to remove ${ticker} from portfolio.`);
    } finally {
      setRemovingTicker(null);
    }
  }

  async function handleRefreshPrices() {
    try {
      setRefreshingPrices(true);
      setApiError("");
      setSuccessMessage("");

      const response = await refreshPortfolioPrices();
      await loadPortfolioData();

      const failedTickers = response.failedTickers ?? [];
      const failedMessage =
        failedTickers.length > 0
          ? ` Could not refresh: ${failedTickers.join(", ")}.`
          : "";

      setSuccessMessage(
        `Portfolio prices refreshed. ${response.refreshedCount ?? 0} holdings updated.${failedMessage}`
      );
    } catch (error) {
      console.error(error);
      setApiError("Unable to refresh portfolio prices.");
    } finally {
      setRefreshingPrices(false);
    }
  }

  function openSellForm(holding: Holding) {
    const nextTicker = sellingTicker === holding.ticker ? null : holding.ticker;

    setSellingTicker(nextTicker);
    setApiError("");
    setSuccessMessage("");
    setSellShares(nextTicker ? String(Math.min(1, holding.shares)) : "");
    setSellPrice(nextTicker ? String(holding.currentPrice ?? holding.avgPrice) : "");
  }

  async function handleSellHolding(holding: Holding) {
    const shares = Number(sellShares);
    const price = Number(sellPrice);

    if (!Number.isFinite(shares) || shares <= 0) {
      setApiError("Sell shares must be greater than 0.");
      return;
    }

    if (shares > holding.shares) {
      setApiError(
        `You only hold ${formatNumber(holding.shares)} shares of ${holding.ticker}.`
      );
      return;
    }

    if (!Number.isFinite(price) || price <= 0) {
      setApiError("Sell price must be greater than 0.");
      return;
    }

    try {
      setSubmittingSell(true);
      setApiError("");
      setSuccessMessage("");

      await sellStockFromPortfolio({
        ticker: holding.ticker,
        shares,
        price,
      });

      setSellingTicker(null);
      setSellShares("");
      setSellPrice("");
      await loadPortfolioData();
      setSuccessMessage(
        `Sold ${formatNumber(shares)} simulated share${
          shares === 1 ? "" : "s"
        } of ${holding.ticker}.`
      );
    } catch (error) {
      console.error(error);
      setApiError(`Unable to sell ${holding.ticker}.`);
    } finally {
      setSubmittingSell(false);
    }
  }

  const activeHoldings = portfolioData?.holdings ?? [];
  const sectorAllocation = portfolioData?.sectorAllocation ?? [];
  const transactionHistory =
    transactions.length > 0 ? transactions : portfolioData?.transactions ?? [];

  const riskByHolding = useMemo(() => {
    return activeHoldings.map((holding) => ({
      ticker: holding.ticker,
      score: holding.score,
    }));
  }, [activeHoldings]);

  const totalValue = portfolioData?.totalValue ?? 0;
  const totalCost = portfolioData?.totalCost ?? 0;
  const unrealizedPL = portfolioData?.unrealizedPL ?? 0;
  const unrealizedPLPercent = portfolioData?.unrealizedPLPercent ?? 0;
  const overallRisk = portfolioData?.overallRisk ?? 0;
  const highRiskExposure = portfolioData?.highRiskExposure ?? 0;
  const holdingsCount = portfolioData?.holdingsCount ?? activeHoldings.length;

  const isProfitPositive = unrealizedPL >= 0;

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <Badge className="mb-3 bg-blue-500/15 text-blue-200">
              Paper Portfolio
            </Badge>

            <h1 className="text-3xl font-semibold tracking-tight text-white">
              My Simulated Portfolio
            </h1>

            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-400">
              Track virtual holdings, cost basis, current value, unrealized
              profit/loss, sector exposure, and portfolio risk.
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

            {successMessage && (
              <p className="mt-2 text-xs text-emerald-300">
                {successMessage}
              </p>
            )}
          </div>

          <div className="flex flex-wrap gap-3">
            <Button
              onClick={loadPortfolioData}
              className="bg-white/10 text-white hover:bg-white/20"
            >
              <RefreshCcw className="mr-2 h-4 w-4" />
              Refresh
            </Button>

            <Button
              onClick={handleRefreshPrices}
              disabled={refreshingPrices}
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
              <Button className="bg-blue-500 text-white hover:bg-blue-600">
                <Plus className="mr-2 h-4 w-4" />
                Find Stocks
              </Button>
            </Link>
          </div>
        </div>

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
              Portfolio to simulate a buy.
            </p>

            <StockSearch />
          </CardContent>
        </Card>

        <div className="grid gap-4 md:grid-cols-4">
          <MetricCard
            title="Portfolio Value"
            value={formatCompactCurrency(totalValue)}
            change="Current value"
            icon={<DollarSign className="h-5 w-5 text-emerald-300" />}
          />

          <MetricCard
            title="Total Cost"
            value={formatCompactCurrency(totalCost)}
            change="Cost basis"
            icon={<Wallet className="h-5 w-5 text-blue-300" />}
          />

          <MetricCard
            title="Unrealized P/L"
            value={formatCompactCurrency(unrealizedPL)}
            change={formatPercent(unrealizedPLPercent)}
            icon={
              isProfitPositive ? (
                <TrendingUp className="h-5 w-5 text-emerald-300" />
              ) : (
                <TrendingDown className="h-5 w-5 text-red-300" />
              )
            }
          />

          <MetricCard
            title="Holdings"
            value={String(holdingsCount)}
            change="Active"
            icon={<BriefcaseBusiness className="h-5 w-5 text-violet-300" />}
          />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <MetricCard
            title="Overall Risk"
            value={`${overallRisk} / 100`}
            change="Learning score"
            icon={<Gauge className="h-5 w-5 text-amber-300" />}
          />

          <MetricCard
            title="High-Risk Exposure"
            value={`${highRiskExposure.toFixed(2)}%`}
            change="Portfolio weight"
            icon={<AlertTriangle className="h-5 w-5 text-red-300" />}
          />
        </div>

        {activeHoldings.length > 0 ? (
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
                            fill={chartColors[index % chartColors.length]}
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
                        formatter={(value) => [`${Number(value).toFixed(2)}%`, "Weight"]}
                      />
                    </RechartsPieChart>
                  </ResponsiveContainer>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  {sectorAllocation.map((sector) => (
                    <div
                      key={sector.name}
                      className="rounded-xl border border-white/10 bg-black/20 p-3"
                    >
                      <p className="text-sm text-slate-400">{sector.name}</p>
                      <p className="mt-1 text-lg font-semibold">
                        {sector.value.toFixed(2)}%
                      </p>
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
                    Portfolio Insight
                  </p>
                  <p className="mt-2 text-sm leading-6 text-slate-300">
                    This view helps beginners understand how each stock affects
                    portfolio risk, concentration, and simulated profit/loss.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : null}

        <Card className="border-white/10 bg-white/[0.04] text-white">
          <CardHeader>
            <CardTitle>Holdings</CardTitle>
          </CardHeader>

          <CardContent>
            {loading ? (
              <div className="flex min-h-[220px] items-center justify-center">
                <div className="text-center">
                  <Loader2 className="mx-auto h-7 w-7 animate-spin text-blue-300" />
                  <p className="mt-3 text-sm text-slate-400">
                    Loading portfolio...
                  </p>
                </div>
              </div>
            ) : activeHoldings.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow className="border-white/10">
                    <TableHead className="text-slate-400">Stock</TableHead>
                    <TableHead className="text-slate-400">Shares</TableHead>
                    <TableHead className="text-slate-400">Avg Price</TableHead>
                    <TableHead className="text-slate-400">Current</TableHead>
                    <TableHead className="text-slate-400">Cost</TableHead>
                    <TableHead className="text-slate-400">Value</TableHead>
                    <TableHead className="text-slate-400">P/L</TableHead>
                    <TableHead className="text-slate-400">Weight</TableHead>
                    <TableHead className="text-right text-slate-400">
                      Actions
                    </TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {activeHoldings.map((holding) => {
                    const currency = holding.currency ?? "USD";
                    const pl = holding.unrealizedPL ?? 0;
                    const plPercent = holding.unrealizedPLPercent ?? 0;
                    const isPositive = pl >= 0;
                    const activeSellForm = sellingTicker === holding.ticker;
                    const sellSharesNumber = Number(sellShares);
                    const sellPriceNumber = Number(sellPrice);
                    const estimatedProceeds =
                      activeSellForm &&
                      Number.isFinite(sellSharesNumber) &&
                      Number.isFinite(sellPriceNumber)
                        ? sellSharesNumber * sellPriceNumber
                        : null;
                    const estimatedRealizedPL =
                      estimatedProceeds !== null
                        ? (sellPriceNumber - holding.avgPrice) * sellSharesNumber
                        : null;
                    const estimatedRealizedPLPercent =
                      activeSellForm &&
                      Number.isFinite(sellPriceNumber) &&
                      holding.avgPrice
                        ? ((sellPriceNumber - holding.avgPrice) /
                            holding.avgPrice) *
                          100
                        : null;

                    return (
                      <Fragment key={holding.ticker}>
                        <TableRow className="border-white/10">
                        <TableCell>
                          <div>
                            <Link href={`/stock/${holding.ticker}`}>
                              <p className="font-medium text-white hover:text-blue-300">
                                {holding.ticker}
                              </p>
                            </Link>

                            <p className="mt-1 max-w-[240px] truncate text-xs text-slate-400">
                              {holding.company}
                            </p>

                            <p className="mt-1 text-xs text-slate-500">
                              {holding.sector} - Added {formatDate(holding.createdAt)}
                            </p>
                          </div>
                        </TableCell>

                        <TableCell className="text-slate-300">
                          {formatNumber(holding.shares)}
                        </TableCell>

                        <TableCell className="text-slate-300">
                          {formatCurrency(holding.avgPrice, currency)}
                        </TableCell>

                        <TableCell className="text-slate-300">
                          {formatCurrency(holding.currentPrice, currency)}
                        </TableCell>

                        <TableCell className="text-slate-300">
                          {formatCurrency(holding.totalCost, currency)}
                        </TableCell>

                        <TableCell className="text-slate-300">
                          {formatCurrency(holding.value, currency)}
                        </TableCell>

                        <TableCell>
                          <Badge
                            className={
                              isPositive
                                ? "bg-emerald-500/15 text-emerald-200"
                                : "bg-red-500/15 text-red-200"
                            }
                          >
                            {formatCurrency(pl, currency)} ({formatPercent(plPercent)})
                          </Badge>
                        </TableCell>

                        <TableCell className="text-slate-300">
                          {holding.weight.toFixed(2)}%
                        </TableCell>

                        <TableCell>
                          <div className="flex justify-end gap-2">
                            <Link href={`/stock/${holding.ticker}`}>
                              <Button
                                size="sm"
                                className="bg-blue-500 text-white hover:bg-blue-600"
                              >
                                Open
                                <ArrowUpRight className="ml-2 h-3.5 w-3.5" />
                              </Button>
                            </Link>

                            <Button
                              size="sm"
                              onClick={() => openSellForm(holding)}
                              className="bg-amber-500 text-white hover:bg-amber-600"
                            >
                              <ReceiptText className="mr-2 h-4 w-4" />
                              Sell
                            </Button>

                            <Button
                              size="sm"
                              disabled={removingTicker === holding.ticker}
                              onClick={() => handleRemoveHolding(holding.ticker)}
                              className="bg-red-500/80 text-white hover:bg-red-600"
                            >
                              {removingTicker === holding.ticker ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              ) : (
                                <Trash2 className="mr-2 h-4 w-4" />
                              )}
                              Delete Holding
                            </Button>
                          </div>
                        </TableCell>
                        </TableRow>

                        {activeSellForm ? (
                          <TableRow className="border-white/10">
                            <TableCell colSpan={9}>
                              <div className="rounded-2xl border border-amber-400/20 bg-amber-500/10 p-4">
                                <div className="grid gap-4 lg:grid-cols-[1fr_1fr_1fr_auto] lg:items-end">
                                  <div>
                                    <label className="text-xs text-slate-400">
                                      Shares to Sell
                                    </label>
                                    <input
                                      type="number"
                                      min="0"
                                      max={holding.shares}
                                      step="0.0001"
                                      value={sellShares}
                                      onChange={(event) =>
                                        setSellShares(event.target.value)
                                      }
                                      className="mt-1 w-full rounded-xl border border-white/10 bg-slate-950 px-3 py-2 text-sm text-white outline-none focus:border-amber-400"
                                    />
                                  </div>

                                  <div>
                                    <label className="text-xs text-slate-400">
                                      Sell Price
                                    </label>
                                    <input
                                      type="number"
                                      min="0"
                                      step="0.01"
                                      value={sellPrice}
                                      onChange={(event) =>
                                        setSellPrice(event.target.value)
                                      }
                                      className="mt-1 w-full rounded-xl border border-white/10 bg-slate-950 px-3 py-2 text-sm text-white outline-none focus:border-amber-400"
                                    />
                                  </div>

                                  <div className="grid grid-cols-2 gap-3 text-sm">
                                    <div className="rounded-xl border border-white/10 bg-black/20 p-3">
                                      <p className="text-xs text-slate-500">
                                        Proceeds
                                      </p>
                                      <p className="mt-1 font-semibold text-white">
                                        {formatCurrency(
                                          estimatedProceeds,
                                          currency
                                        )}
                                      </p>
                                    </div>

                                    <div className="rounded-xl border border-white/10 bg-black/20 p-3">
                                      <p className="text-xs text-slate-500">
                                        Realized P/L
                                      </p>
                                      <p
                                        className={
                                          (estimatedRealizedPL ?? 0) >= 0
                                            ? "mt-1 font-semibold text-emerald-200"
                                            : "mt-1 font-semibold text-red-200"
                                        }
                                      >
                                        {formatCurrency(
                                          estimatedRealizedPL,
                                          currency
                                        )}{" "}
                                        (
                                        {formatPercent(
                                          estimatedRealizedPLPercent
                                        )}
                                        )
                                      </p>
                                    </div>
                                  </div>

                                  <Button
                                    onClick={() => handleSellHolding(holding)}
                                    disabled={submittingSell}
                                    className="bg-amber-500 text-white hover:bg-amber-600"
                                  >
                                    {submittingSell ? (
                                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    ) : (
                                      <ReceiptText className="mr-2 h-4 w-4" />
                                    )}
                                    Confirm Sell
                                  </Button>
                                </div>
                              </div>
                            </TableCell>
                          </TableRow>
                        ) : null}
                      </Fragment>
                    );
                  })}
                </TableBody>
              </Table>
            ) : (
              <div className="rounded-2xl border border-dashed border-white/10 bg-black/20 p-8 text-center">
                <BriefcaseBusiness className="mx-auto h-8 w-8 text-slate-500" />

                <h2 className="mt-4 text-lg font-semibold text-white">
                  Your simulated portfolio is empty
                </h2>

                <p className="mt-2 text-sm text-slate-400">
                  Search a stock, open its stock research page, and simulate a
                  buy from there.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-white/10 bg-white/[0.04] text-white">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <History className="h-5 w-5 text-blue-300" />
              Transaction History
            </CardTitle>
          </CardHeader>

          <CardContent>
            {transactionHistory.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow className="border-white/10">
                    <TableHead className="text-slate-400">Action</TableHead>
                    <TableHead className="text-slate-400">Ticker</TableHead>
                    <TableHead className="text-slate-400">Shares</TableHead>
                    <TableHead className="text-slate-400">Price</TableHead>
                    <TableHead className="text-slate-400">Total</TableHead>
                    <TableHead className="text-slate-400">Realized P/L</TableHead>
                    <TableHead className="text-slate-400">Date</TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {transactionHistory.map((transaction) => {
                    const currency = transaction.currency ?? "USD";
                    const isSell = transaction.action === "SELL";
                    const realizedPL = transaction.realizedPL ?? null;
                    const isRealizedPositive = (realizedPL ?? 0) >= 0;

                    return (
                      <TableRow
                        key={transaction.id}
                        className="border-white/10"
                      >
                        <TableCell>
                          <Badge
                            className={
                              isSell
                                ? "bg-amber-500/15 text-amber-200"
                                : "bg-emerald-500/15 text-emerald-200"
                            }
                          >
                            {transaction.action}
                          </Badge>
                        </TableCell>

                        <TableCell>
                          <Link href={`/stock/${transaction.ticker}`}>
                            <span className="font-medium text-white hover:text-blue-300">
                              {transaction.ticker}
                            </span>
                          </Link>
                          <p className="mt-1 max-w-[220px] truncate text-xs text-slate-500">
                            {transaction.company}
                          </p>
                        </TableCell>

                        <TableCell className="text-slate-300">
                          {formatNumber(transaction.shares)}
                        </TableCell>

                        <TableCell className="text-slate-300">
                          {formatCurrency(transaction.price, currency)}
                        </TableCell>

                        <TableCell className="text-slate-300">
                          {formatCurrency(transaction.totalAmount, currency)}
                        </TableCell>

                        <TableCell>
                          {isSell ? (
                            <Badge
                              className={
                                isRealizedPositive
                                  ? "bg-emerald-500/15 text-emerald-200"
                                  : "bg-red-500/15 text-red-200"
                              }
                            >
                              {formatCurrency(realizedPL, currency)} (
                              {formatPercent(transaction.realizedPLPercent)})
                            </Badge>
                          ) : (
                            <span className="text-slate-500">-</span>
                          )}
                        </TableCell>

                        <TableCell className="text-slate-300">
                          {formatDate(transaction.createdAt)}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            ) : (
              <div className="rounded-2xl border border-dashed border-white/10 bg-black/20 p-8 text-center">
                <History className="mx-auto h-8 w-8 text-slate-500" />

                <h2 className="mt-4 text-lg font-semibold text-white">
                  No transaction history yet
                </h2>

                <p className="mt-2 text-sm text-slate-400">
                  Simulated buys and sells will appear here after you trade in
                  the paper portfolio.
                </p>
              </div>
            )}
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
              {activeHoldings.length > 0 ? (
                <>
                  {highRiskExposure > 25 ? (
                    <AlertCard
                      title="High-Risk Exposure"
                      description="More than 25% of your simulated portfolio is in high-risk holdings."
                      severity="High"
                    />
                  ) : null}

                  {sectorAllocation[0] && sectorAllocation[0].value > 50 ? (
                    <AlertCard
                      title="Concentration Risk"
                      description={`${sectorAllocation[0].value.toFixed(
                        2
                      )}% of your portfolio is concentrated in ${
                        sectorAllocation[0].name
                      }.`}
                      severity="Medium"
                    />
                  ) : null}

                  <AlertCard
                    title="Paper Trading Mode"
                    description="This portfolio uses virtual holdings only. No real money or brokerage trading is connected."
                    severity="Low"
                  />
                </>
              ) : (
                <p className="text-sm text-slate-400">
                  No alerts yet. Add simulated holdings to generate portfolio
                  insights.
                </p>
              )}
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
              <QualityMetric label="Cost basis coverage" value={holdingsCount > 0 ? 95 : 0} />
              <QualityMetric label="P/L readiness" value={holdingsCount > 0 ? 90 : 0} />
              <QualityMetric label="Sector coverage" value={sectorAllocation.length > 0 ? 85 : 0} />
              <QualityMetric label="AI readiness" value={holdingsCount > 0 ? 80 : 0} />
            </CardContent>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}

function AlertCard({
  title,
  description,
  severity,
}: {
  title: string;
  description: string;
  severity: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
      <div className="flex items-center justify-between">
        <p className="font-medium">{title}</p>
        <RiskBadge risk={severity} />
      </div>
      <p className="mt-2 text-sm leading-6 text-slate-400">{description}</p>
    </div>
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
