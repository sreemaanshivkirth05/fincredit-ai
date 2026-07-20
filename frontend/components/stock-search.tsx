"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";

import { Button } from "@/components/ui/button";

const COMPANY_TO_TICKER: Record<string, string> = {
  amazon: "AMZN",
  microsoft: "MSFT",
  apple: "AAPL",
  nvidia: "NVDA",
  tesla: "TSLA",
  amd: "AMD",
  google: "GOOGL",
  alphabet: "GOOGL",
  meta: "META",
  facebook: "META",
  netflix: "NFLX",
  jpmorgan: "JPM",
  "jp morgan": "JPM",
  "jpmorgan chase": "JPM",
  walmart: "WMT",
  costco: "COST",
  oracle: "ORCL",
  salesforce: "CRM",
  adobe: "ADBE",
  intel: "INTC",
  broadcom: "AVGO",
  "bank of america": "BAC",
  visa: "V",
  mastercard: "MA",
};

export function StockSearch() {
  const router = useRouter();

  const [query, setQuery] = useState("");
  const [error, setError] = useState("");

  function normalizeStockQuery(value: string) {
    const cleaned = value.trim();

    if (!cleaned) return "";

    const lower = cleaned.toLowerCase();

    if (COMPANY_TO_TICKER[lower]) {
      return COMPANY_TO_TICKER[lower];
    }

    return cleaned.toUpperCase().replace(/\s+/g, "");
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const ticker = normalizeStockQuery(query);

    if (!ticker) {
      setError("Enter a ticker or company name.");
      return;
    }

    setError("");
    router.push(`/stock/${ticker}`);
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
        className="flex flex-col gap-3 md:flex-row md:items-center"
      >
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />

          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search Amazon, MSFT, Nvidia, AMD..."
            className="h-11 w-full rounded-xl border border-white/10 bg-black/30 pl-10 pr-4 text-sm text-white outline-none placeholder:text-slate-500 focus:border-blue-400/60"
          />
        </div>

        <Button type="submit" className="bg-blue-500 text-white hover:bg-blue-600">
          Search
        </Button>
      </form>

      {error && <p className="mt-3 text-xs text-red-300">{error}</p>}

      <div className="mt-4 flex flex-wrap gap-2">
        {["AMZN", "MSFT", "NVDA", "AAPL", "TSLA", "AMD"].map((ticker) => (
          <button
            key={ticker}
            type="button"
            onClick={() => router.push(`/stock/${ticker}`)}
            className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs text-slate-300 transition hover:bg-white/10 hover:text-white"
          >
            {ticker}
          </button>
        ))}
      </div>
    </div>
  );
}