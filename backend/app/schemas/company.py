from typing import Any

from pydantic import BaseModel


class CompanyResponse(BaseModel):
    ticker: str
    company: str
    sector: str
    risk: str
    riskScore: int
    sentiment: str
    summary: str
    marketCap: str
    revenue: str
    debtToEquity: str
    profitMargin: str
    groundingScore: int
    unsupportedClaims: int
    riskTrend: list[dict[str, Any]]
    redFlags: list[dict[str, Any]]
    filingSignals: list[dict[str, Any]]
    peerBenchmark: list[dict[str, Any]]
    evidence: list[dict[str, Any]]
    message: str