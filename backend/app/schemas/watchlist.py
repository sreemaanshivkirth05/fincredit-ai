from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field


class WatchlistCompanyResponse(BaseModel):
    ticker: str
    company: str
    sector: str
    risk: str
    riskScore: int
    sentiment: str
    filing: str
    status: str

    currentPrice: Optional[float] = None
    previousClose: Optional[float] = None
    marketCap: Optional[float] = None
    volume: Optional[int] = None
    currency: Optional[str] = None
    exchange: Optional[str] = None
    addedAt: Optional[datetime] = None


class WatchlistAddRequest(BaseModel):
    ticker: str
    company: Optional[str] = None
    sector: Optional[str] = None

    currentPrice: Optional[float] = None
    previousClose: Optional[float] = None
    marketCap: Optional[float] = None
    volume: Optional[int] = None
    currency: Optional[str] = None
    exchange: Optional[str] = None


class WatchlistActionResponse(BaseModel):
    ticker: str
    isWatchlisted: bool
    message: str
    item: Optional[WatchlistCompanyResponse] = None


class WatchlistStatusResponse(BaseModel):
    ticker: str
    isWatchlisted: bool
    item: Optional[WatchlistCompanyResponse] = None


class SentimentDataResponse(BaseModel):
    ticker: str
    positive: int
    negative: int


class NewsRadarResponse(BaseModel):
    ticker: str
    headline: str
    category: str
    impact: str


class WatchlistResponse(BaseModel):
    companiesTracked: int
    needsReview: int
    newFilingChanges: int
    positiveSentiment: int
    watchlist: list[WatchlistCompanyResponse]
    sentimentData: list[SentimentDataResponse]
    newsRadar: list[NewsRadarResponse]
    message: str


class WatchlistRefreshResponse(BaseModel):
    refreshedCount: int
    failedCount: int
    failedTickers: list[str] = Field(default_factory=list)
    watchlist: WatchlistResponse
    message: str
