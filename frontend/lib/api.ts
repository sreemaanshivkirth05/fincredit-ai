const API_BASE_URL = "http://127.0.0.1:8000";

async function fetchJson(url: string, options?: RequestInit) {
  const response = await fetch(url, {
    cache: "no-store",
    ...options,
  });

  if (!response.ok) {
    let errorBody = "";

    try {
      errorBody = await response.text();
    } catch {
      errorBody = "";
    }

    throw new Error(
      `Request failed: ${response.status} ${response.statusText}${
        errorBody ? ` - ${errorBody}` : ""
      }`
    );
  }

  return response.json();
}

export type WatchlistAddPayload = {
  ticker: string;
  company?: string | null;
  sector?: string | null;
  currentPrice?: number | null;
  previousClose?: number | null;
  marketCap?: number | null;
  volume?: number | null;
  currency?: string | null;
  exchange?: string | null;
};

export type PortfolioBuyPayload = {
  ticker: string;
  company?: string | null;
  sector?: string | null;
  shares: number;
  price: number;
  currency?: string | null;
  exchange?: string | null;
};

export type PortfolioSellPayload = {
  ticker: string;
  shares: number;
  price: number;
};

export async function getDashboardData() {
  return fetchJson(`${API_BASE_URL}/api/dashboard`);
}

export async function getPortfolioData() {
  return fetchJson(`${API_BASE_URL}/api/portfolio`);
}

export async function getPortfolioHoldingStatus(ticker: string) {
  return fetchJson(`${API_BASE_URL}/api/portfolio/${ticker}/status`);
}

export async function getPortfolioTransactions() {
  return fetchJson(`${API_BASE_URL}/api/portfolio/transactions`);
}

export async function refreshPortfolioPrices() {
  return fetchJson(`${API_BASE_URL}/api/portfolio/refresh-prices`, {
    method: "POST",
  });
}

export async function buyStockForPortfolio(payload: PortfolioBuyPayload) {
  return fetchJson(`${API_BASE_URL}/api/portfolio/buy`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
}

export async function sellStockFromPortfolio(payload: PortfolioSellPayload) {
  return fetchJson(`${API_BASE_URL}/api/portfolio/sell`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
}

export async function removePortfolioHolding(ticker: string) {
  return fetchJson(`${API_BASE_URL}/api/portfolio/${ticker}`, {
    method: "DELETE",
  });
}

export async function getWatchlistData() {
  return fetchJson(`${API_BASE_URL}/api/watchlist`);
}

export async function refreshWatchlistPrices() {
  return fetchJson(`${API_BASE_URL}/api/watchlist/refresh-prices`, {
    method: "POST",
  });
}

export async function getWatchlistStatus(ticker: string) {
  return fetchJson(`${API_BASE_URL}/api/watchlist/${ticker}/status`);
}

export async function addStockToWatchlist(payload: WatchlistAddPayload) {
  return fetchJson(`${API_BASE_URL}/api/watchlist`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
}

export async function removeStockFromWatchlist(ticker: string) {
  return fetchJson(`${API_BASE_URL}/api/watchlist/${ticker}`, {
    method: "DELETE",
  });
}

export async function getReportsData() {
  return fetchJson(`${API_BASE_URL}/api/reports`);
}

export async function getReportsByTicker(ticker: string) {
  return fetchJson(`${API_BASE_URL}/api/reports/by-ticker/${ticker}`);
}

export async function getReportDocument(reportId: string) {
  return fetchJson(`${API_BASE_URL}/api/reports/${reportId}/document`);
}

export function getReportPdfUrl(reportId: string) {
  return `${API_BASE_URL}/api/reports/${reportId}/pdf`;
}

export async function updateReportStatus(
  reportId: string,
  status: string,
  comment?: string
) {
  return fetchJson(`${API_BASE_URL}/api/reports/${reportId}/status`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ status, comment }),
  });
}

export async function updateReportStatusWithComment(
  reportId: string,
  status: string,
  comment: string
) {
  return fetchJson(`${API_BASE_URL}/api/reports/${reportId}/status`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ status, comment }),
  });
}

export async function getReportStatusHistory(reportId: string) {
  return fetchJson(`${API_BASE_URL}/api/reports/${reportId}/status-history`);
}

export async function generateReportFromAgentRun(agentRunId: number) {
  return fetchJson(
    `${API_BASE_URL}/api/reports/generate-from-agent-run/${agentRunId}`,
    {
      method: "POST",
    }
  );
}

export async function generateLatestReportForTicker(ticker: string) {
  return fetchJson(
    `${API_BASE_URL}/api/reports/generate-latest-for-ticker/${ticker}`,
    {
      method: "POST",
    }
  );
}

export async function getGovernanceData() {
  return fetchJson(`${API_BASE_URL}/api/governance`);
}

export async function getCompanyData(ticker: string) {
  return fetchJson(`${API_BASE_URL}/api/company/${ticker}`);
}

export async function getMarketData(ticker: string) {
  return fetchJson(`${API_BASE_URL}/api/market/${ticker}`);
}

export async function getMarketHistory(ticker: string, range?: string) {
  if (range) {
    return fetchJson(
      `${API_BASE_URL}/api/market/${ticker}/chart?range=${encodeURIComponent(
        range
      )}`
    );
  }

  return fetchJson(`${API_BASE_URL}/api/market/${ticker}/history`);
}

export async function getStockNews(ticker: string, limit = 8) {
  return fetchJson(
    `${API_BASE_URL}/api/news/${ticker}?limit=${encodeURIComponent(limit)}`
  );
}

export async function getSecCompanyFacts(ticker: string) {
  return fetchJson(`${API_BASE_URL}/api/sec/company-facts/${ticker}`);
}

export async function getSecFundamentalsHistory(ticker: string) {
  return fetchJson(`${API_BASE_URL}/api/sec/company-facts/${ticker}/history`);
}

export async function askFinCredit(question: string) {
  return fetchJson(`${API_BASE_URL}/api/ask`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ question }),
  });
}

export async function getAgentRuns() {
  return fetchJson(`${API_BASE_URL}/api/ask/runs`);
}

export async function getAgentRunsByTicker(ticker: string) {
  return fetchJson(`${API_BASE_URL}/api/ask/runs/by-ticker/${ticker}`);
}

export async function getAgentRunById(agentRunId: string) {
  return fetchJson(`${API_BASE_URL}/api/ask/runs/${agentRunId}`);
}
