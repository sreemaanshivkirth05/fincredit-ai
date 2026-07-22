from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field


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


class PortfolioBuyRequest(BaseModel):
    ticker: str
    company: Optional[str] = None
    sector: Optional[str] = None

    shares: float
    price: float

    currency: Optional[str] = "USD"
    exchange: Optional[str] = None


class PortfolioTransactionResponse(BaseModel):
    id: int
    ticker: str
    company: str
    action: str
    shares: float
    price: float
    totalAmount: float
    currency: Optional[str] = None
    exchange: Optional[str] = None
    createdAt: Optional[datetime] = None


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