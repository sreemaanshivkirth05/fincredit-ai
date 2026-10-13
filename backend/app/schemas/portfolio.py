from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field, field_validator


class HoldingResponse(BaseModel):
    ticker: str
    company: str

    shares: float
    avgPrice: float
    currentPrice: Optional[float] = None

    totalCost: Optional[float] = None
    value: float
    weight: float

    unrealizedPL: Optional[float] = None
    unrealizedPLPercent: Optional[float] = None

    sector: str
    risk: str
    score: int
    sentiment: str

    currency: Optional[str] = None
    exchange: Optional[str] = None

    createdAt: Optional[datetime] = None
    updatedAt: Optional[datetime] = None


class TradeRequest(BaseModel):
    ticker: str = Field(min_length=1, max_length=20)
    shares: float = Field(gt=0, allow_inf_nan=False)
    price: float = Field(gt=0, allow_inf_nan=False)

    @field_validator("ticker")
    @classmethod
    def clean_ticker(cls, value: str) -> str:
        value = value.strip().upper()
        if not value:
            raise ValueError("Ticker cannot be blank.")
        return value


class PortfolioBuyRequest(TradeRequest):
    company: Optional[str] = None
    sector: Optional[str] = None

    currency: Optional[str] = "USD"
    exchange: Optional[str] = None


class PortfolioSellRequest(TradeRequest):
    pass


class PortfolioTransactionResponse(BaseModel):
    id: int
    ticker: str
    company: str
    action: str
    shares: float
    price: float
    totalAmount: float
    realizedPL: Optional[float] = None
    realizedPLPercent: Optional[float] = None
    currency: Optional[str] = None
    exchange: Optional[str] = None
    createdAt: Optional[datetime] = None


class PortfolioTransactionsResponse(BaseModel):
    count: int
    transactions: list[PortfolioTransactionResponse] = Field(default_factory=list)
    message: str


class PortfolioActionResponse(BaseModel):
    ticker: str
    message: str
    holding: Optional[HoldingResponse] = None
    transaction: Optional[PortfolioTransactionResponse] = None


class PortfolioStatusResponse(BaseModel):
    ticker: str
    isInPortfolio: bool
    holding: Optional[HoldingResponse] = None


class SectorAllocationResponse(BaseModel):
    name: str
    value: float


class PortfolioResponse(BaseModel):
    totalValue: float
    totalCost: float
    unrealizedPL: float
    unrealizedPLPercent: float

    overallRisk: int
    highRiskExposure: float
    holdingsCount: int

    holdings: list[HoldingResponse]
    sectorAllocation: list[SectorAllocationResponse] = Field(default_factory=list)
    transactions: list[PortfolioTransactionResponse] = Field(default_factory=list)

    message: str


class PortfolioRefreshResponse(BaseModel):
    refreshedCount: int
    failedCount: int
    failedTickers: list[str] = Field(default_factory=list)
    portfolio: PortfolioResponse
    message: str
