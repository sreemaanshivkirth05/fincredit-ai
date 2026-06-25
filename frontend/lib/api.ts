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

export async function getReportDocument(reportId: string) {
  const response = await fetch(
    `${API_BASE_URL}/api/reports/${reportId}/document`,
    {
      cache: "no-store",
    }
  );

  if (!response.ok) {
    throw new Error("Failed to fetch report document");
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

export async function getMarketData(ticker: string) {
  const response = await fetch(`${API_BASE_URL}/api/market/${ticker}`, {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Failed to fetch market data");
  }

  return response.json();
}

export async function getMarketHistory(ticker: string) {
  const response = await fetch(`${API_BASE_URL}/api/market/${ticker}/history`, {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Failed to fetch market history");
  }

  return response.json();
}

export async function getSecCompanyFacts(ticker: string) {
  const response = await fetch(
    `${API_BASE_URL}/api/sec/company-facts/${ticker}`,
    {
      cache: "no-store",
    }
  );

  if (!response.ok) {
    throw new Error("Failed to fetch SEC company facts");
  }

  return response.json();
}

export async function getSecFundamentalsHistory(ticker: string) {
  const response = await fetch(
    `${API_BASE_URL}/api/sec/company-facts/${ticker}/history`,
    {
      cache: "no-store",
    }
  );

  if (!response.ok) {
    throw new Error("Failed to fetch SEC fundamentals history");
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

export async function getAgentRuns() {
  const response = await fetch(`${API_BASE_URL}/api/ask/runs`, {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Failed to fetch agent runs");
  }

  return response.json();
}

export async function generateReportFromAgentRun(agentRunId: number) {
  const response = await fetch(
    `${API_BASE_URL}/api/reports/generate-from-agent-run/${agentRunId}`,
    {
      method: "POST",
      cache: "no-store",
    }
  );

  if (!response.ok) {
    throw new Error("Failed to generate report from agent run");
  }

  return response.json();
}