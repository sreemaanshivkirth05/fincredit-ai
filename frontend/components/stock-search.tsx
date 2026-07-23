"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Search } from "lucide-react";

import { searchStocks, type StockSearchResult } from "@/lib/api";
import { Button } from "@/components/ui/button";

const COMPANY_TO_TICKER: Record<string, string> = {
  adobe: "ADBE",
  alphabet: "GOOGL",
  amazon: "AMZN",
  amd: "AMD",
  apple: "AAPL",
  "bank of america": "BAC",
  broadcom: "AVGO",
  costco: "COST",
  facebook: "META",
  google: "GOOGL",
  intel: "INTC",
  "jp morgan": "JPM",
  jpmorgan: "JPM",
  "jpmorgan chase": "JPM",
  mastercard: "MA",
  meta: "META",
  microsoft: "MSFT",
  netflix: "NFLX",
  nvidia: "NVDA",
  oracle: "ORCL",
  palantir: "PLTR",
  salesforce: "CRM",
  snowflake: "SNOW",
  tesla: "TSLA",
  uber: "UBER",
  visa: "V",
  walmart: "WMT",
};

const QUICK_TICKERS = ["AAPL", "AMZN", "GOOGL", "META", "NVDA", "TSLA", "AMD", "PLTR"];

export function StockSearch() {
  const router = useRouter();

  const [query, setQuery] = useState("");
  const [error, setError] = useState("");
  const [results, setResults] = useState<StockSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchUnavailable, setSearchUnavailable] = useState(false);
  const [hasFocus, setHasFocus] = useState(false);

  const cleanedQuery = useMemo(() => query.trim(), [query]);
  const showResults = hasFocus && cleanedQuery.length >= 2 && results.length > 0;

  useEffect(() => {
    let ignore = false;

    if (cleanedQuery.length < 2) {
      setResults([]);
      setIsSearching(false);
      setSearchUnavailable(false);
      return;
    }

    setIsSearching(true);

    const timer = window.setTimeout(async () => {
      try {
        const response = await searchStocks(cleanedQuery, 8);

        if (ignore) return;

        setResults(response.results);
        setSearchUnavailable(false);
      } catch {
        if (ignore) return;

        setResults([]);
        setSearchUnavailable(true);
      } finally {
        if (!ignore) {
          setIsSearching(false);
        }
      }
    }, 250);

    return () => {
      ignore = true;
      window.clearTimeout(timer);
    };
  }, [cleanedQuery]);

  function normalizeStockQuery(value: string) {
    const cleaned = value.trim();

    if (!cleaned) return "";

    const lower = cleaned.toLowerCase();

    if (COMPANY_TO_TICKER[lower]) {
      return COMPANY_TO_TICKER[lower];
    }

    return cleaned.toUpperCase().replace(/\s+/g, "").replace(".", "-");
  }

  function goToTicker(ticker: string) {
    const normalizedTicker = normalizeStockQuery(ticker);

    if (!normalizedTicker) return;

    setError("");
    setHasFocus(false);
    router.push(`/stock/${normalizedTicker}`);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const ticker = normalizeStockQuery(query);

    if (!ticker) {
      setError("Enter a ticker or company name.");
      return;
    }

    goToTicker(ticker);
  }

  return (
    <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-5 text-white">
      <div className="mb-4">
        <p className="text-sm font-medium text-white">Search Stocks</p>
        <p className="mt-1 text-sm leading-6 text-slate-400">
          Search by ticker or company name to research a stock, view market
          data, and ask AI follow-up questions.
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="flex flex-col gap-3 md:flex-row md:items-start"
      >
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-5 h-4 w-4 -translate-y-1/2 text-slate-500" />

          <input
            data-testid="stock-search-input"
            value={query}
            onBlur={() => window.setTimeout(() => setHasFocus(false), 150)}
            onChange={(event) => {
              setQuery(event.target.value);
              setError("");
            }}
            onFocus={() => setHasFocus(true)}
            placeholder="Search ticker or company, e.g. Apple, Amazon, Tesla..."
            className="h-11 w-full rounded-xl border border-white/10 bg-black/30 pl-10 pr-10 text-sm text-white outline-none placeholder:text-slate-500 focus:border-blue-400/60"
          />

          {isSearching ? (
            <Loader2 className="pointer-events-none absolute right-3 top-5 h-4 w-4 -translate-y-1/2 animate-spin text-slate-500" />
          ) : null}

          {showResults ? (
            <div
              data-testid="stock-search-results"
              className="absolute left-0 right-0 top-12 z-20 overflow-hidden rounded-2xl border border-white/10 bg-[#0b1220] shadow-2xl shadow-black/40"
            >
              {results.map((result) => (
                <button
                  key={`${result.ticker}-${result.cik ?? result.source}`}
                  type="button"
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => goToTicker(result.ticker)}
                  className="flex w-full items-center justify-between gap-3 border-b border-white/5 px-4 py-3 text-left transition hover:bg-white/[0.06] last:border-b-0"
                >
                  <span className="min-w-0">
                    <span className="block text-sm font-semibold text-white">
                      {result.ticker}
                    </span>
                    <span className="block truncate text-xs text-slate-400">
                      {result.name}
                    </span>
                  </span>
                  <span className="shrink-0 rounded-full border border-white/10 bg-white/[0.04] px-2 py-1 text-[10px] uppercase text-slate-400">
                    {result.source}
                  </span>
                </button>
              ))}
            </div>
          ) : null}
        </div>

        <Button
          type="submit"
          className="h-11 bg-blue-500 text-white hover:bg-blue-600 md:w-auto"
        >
          Search
        </Button>
      </form>

      {error ? <p className="mt-3 text-xs text-red-300">{error}</p> : null}

      {searchUnavailable && cleanedQuery.length >= 2 ? (
        <p className="mt-3 text-xs leading-5 text-amber-200">
          Live search is unavailable right now. Enter a ticker directly to
          continue.
        </p>
      ) : null}

      <div className="mt-4 flex flex-wrap gap-2">
        {QUICK_TICKERS.map((ticker) => (
          <button
            key={ticker}
            type="button"
            onClick={() => goToTicker(ticker)}
            className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs text-slate-300 transition hover:bg-white/10 hover:text-white"
          >
            {ticker}
          </button>
        ))}
      </div>
    </div>
  );
}
