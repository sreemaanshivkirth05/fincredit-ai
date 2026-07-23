from datetime import datetime

from pydantic import BaseModel, Field

from app.schemas.ask import AgentRunItemResponse
from app.schemas.portfolio import HoldingResponse, PortfolioTransactionResponse
from app.schemas.watchlist import WatchlistCompanyResponse


class AdminUserSummaryResponse(BaseModel):
    id: int
    email: str
    fullName: str | None = None
    role: str
    isActive: bool
    createdAt: datetime
    holdingsCount: int
    transactionsCount: int
    watchlistCount: int
    agentRunsCount: int
    portfolioValue: float
    totalCost: float
    unrealizedPL: float


class AdminUsersResponse(BaseModel):
    totalUsers: int
    users: list[AdminUserSummaryResponse] = Field(default_factory=list)
    message: str


class AdminUserDetailResponse(BaseModel):
    user: AdminUserSummaryResponse
    holdings: list[HoldingResponse] = Field(default_factory=list)
    transactions: list[PortfolioTransactionResponse] = Field(default_factory=list)
    watchlist: list[WatchlistCompanyResponse] = Field(default_factory=list)
    agentRuns: list[AgentRunItemResponse] = Field(default_factory=list)
    message: str


class AdminOverviewResponse(BaseModel):
    totalUsers: int
    activeUsers: int
    adminUsers: int
    totalHoldings: int
    totalTransactions: int
    totalWatchlistItems: int
    totalAgentRuns: int
    totalPortfolioValue: float
    message: str
