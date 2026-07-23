const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://127.0.0.1:8000";
const AUTH_TOKEN_KEY = "fincredit_access_token";
const AUTH_USER_KEY = "fincredit_current_user";

export type AuthUser = {
  id: number;
  email: string;
  fullName?: string | null;
  role: string;
  isActive: boolean;
  createdAt: string;
};

export type AuthResponse = {
  accessToken: string;
  tokenType: string;
  user: AuthUser;
};

function isBrowser() {
  return typeof window !== "undefined";
}

export function getStoredToken() {
  if (!isBrowser()) return null;
  return window.localStorage.getItem(AUTH_TOKEN_KEY);
}

export function getStoredUser(): AuthUser | null {
  if (!isBrowser()) return null;

  const storedUser = window.localStorage.getItem(AUTH_USER_KEY);
  if (!storedUser) return null;

  try {
    return JSON.parse(storedUser);
  } catch {
    return null;
  }
}

export function storeAuthSession(auth: AuthResponse) {
  if (!isBrowser()) return;
  window.localStorage.setItem(AUTH_TOKEN_KEY, auth.accessToken);
  window.localStorage.setItem(AUTH_USER_KEY, JSON.stringify(auth.user));
}

export function clearAuthSession() {
  if (!isBrowser()) return;
  window.localStorage.removeItem(AUTH_TOKEN_KEY);
  window.localStorage.removeItem(AUTH_USER_KEY);
}

async function fetchJson(url: string, options?: RequestInit) {
  const token = getStoredToken();
  const headers = new Headers(options?.headers);

  if (token && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(url, {
    cache: "no-store",
    ...options,
    headers,
  });

  if (response.status === 401) {
    clearAuthSession();
  }

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

export async function resetDemoData() {
  return fetchJson(`${API_BASE_URL}/api/demo/reset`, {
    method: "POST",
  });
}

export type RegisterPayload = {
  email: string;
  password: string;
  fullName?: string | null;
};

export type LoginPayload = {
  email: string;
  password: string;
};

export async function registerUser(payload: RegisterPayload) {
  const response = await fetchJson(`${API_BASE_URL}/api/auth/register`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  storeAuthSession(response);
  return response;
}

export async function loginUser(payload: LoginPayload) {
  const response = await fetchJson(`${API_BASE_URL}/api/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  storeAuthSession(response);
  return response;
}

export async function getCurrentUser() {
  const user = await fetchJson(`${API_BASE_URL}/api/auth/me`);
  if (isBrowser()) {
    window.localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
  }
  return user;
}

export async function logoutUser() {
  try {
    await fetchJson(`${API_BASE_URL}/api/auth/logout`, {
      method: "POST",
    });
  } finally {
    clearAuthSession();
  }
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

export async function getAdminOverview() {
  return fetchJson(`${API_BASE_URL}/api/admin/overview`);
}

export async function getAdminUsers() {
  return fetchJson(`${API_BASE_URL}/api/admin/users`);
}

export async function getAdminUserDetail(userId: number) {
  return fetchJson(`${API_BASE_URL}/api/admin/users/${userId}`);
}
