const API_BASE_URL = "http://127.0.0.1:8000";

export async function getDashboardData() {
  const response = await fetch(`${API_BASE_URL}/api/dashboard`, {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Failed to fetch dashboard data");
  }

  return response.json();
}

export async function getPortfolioData() {
  const response = await fetch(`${API_BASE_URL}/api/portfolio`, {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Failed to fetch portfolio data");
  }

  return response.json();
}

export async function getWatchlistData() {
  const response = await fetch(`${API_BASE_URL}/api/watchlist`, {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Failed to fetch watchlist data");
  }

  return response.json();
}

export async function getReportsData() {
  const response = await fetch(`${API_BASE_URL}/api/reports`, {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Failed to fetch reports data");
  }

  return response.json();
}

export async function getGovernanceData() {
  const response = await fetch(`${API_BASE_URL}/api/governance`, {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Failed to fetch governance data");
  }

  return response.json();
}

export async function getCompanyData(ticker: string) {
  const response = await fetch(`${API_BASE_URL}/api/company/${ticker}`, {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Failed to fetch company data");
  }

  return response.json();
}

export async function askFinCredit(question: string) {
  const response = await fetch(`${API_BASE_URL}/api/ask`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    cache: "no-store",
    body: JSON.stringify({ question }),
  });

  if (!response.ok) {
    throw new Error("Failed to ask FinCredit");
  }

  return response.json();
}