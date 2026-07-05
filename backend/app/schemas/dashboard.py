from datetime import datetime

from pydantic import BaseModel


class DashboardMetricResponse(BaseModel):
    label: str
    value: str
    detail: str


class DashboardReportResponse(BaseModel):
    id: str
    ticker: str
    company: str
    status: str
    grounding: int
    created: str


class DashboardAgentRunResponse(BaseModel):
    id: int
    question: str
    ticker: str | None
    groundingScore: int
    unsupportedClaims: int
    createdAt: datetime


class DashboardMarketSnapshotResponse(BaseModel):
    ticker: str
    companyName: str
    currentPrice: float | None
    previousClose: float | None
    marketCap: int | None
    fetchedAt: datetime


class DashboardSecFundamentalResponse(BaseModel):
    ticker: str
    companyName: str
    revenue: int | None
    netIncome: int | None
    assets: int | None
    liabilities: int | None
    fiscalYear: int | None
    filed: str | None
    fetchedAt: datetime


class DashboardResponse(BaseModel):
    portfolioValue: float
    portfolioCount: int
    averageRiskScore: int
    totalReports: int
    approvedReports: int
    needsReviewReports: int
    rejectedReports: int
    avgGrounding: int
    unsupportedClaims: int
    metrics: list[DashboardMetricResponse]
    latestReports: list[DashboardReportResponse]
    latestAgentRuns: list[DashboardAgentRunResponse]
    latestMarketSnapshots: list[DashboardMarketSnapshotResponse]
    latestSecFundamentals: list[DashboardSecFundamentalResponse]
    message: str