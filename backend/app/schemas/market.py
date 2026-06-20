from datetime import datetime

from pydantic import BaseModel


class MarketDataResponse(BaseModel):
    ticker: str
    companyName: str
    sector: str | None
    currentPrice: float | None
    previousClose: float | None
    dayHigh: float | None
    dayLow: float | None
    volume: int | None
    marketCap: int | None
    currency: str | None
    exchange: str | None
    message: str


class MarketSnapshotResponse(BaseModel):
    ticker: str
    companyName: str
    sector: str | None
    currentPrice: float | None
    previousClose: float | None
    dayHigh: float | None
    dayLow: float | None
    volume: int | None
    marketCap: int | None
    currency: str | None
    exchange: str | None
    fetchedAt: datetime


class MarketHistoryResponse(BaseModel):
    ticker: str
    snapshotsCount: int
    snapshots: list[MarketSnapshotResponse]
    message: str