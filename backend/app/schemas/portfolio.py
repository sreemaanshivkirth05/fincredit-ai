from pydantic import BaseModel


class HoldingResponse(BaseModel):
    ticker: str
    company: str
    shares: float
    avgPrice: float
    value: float
    weight: float
    sector: str
    risk: str
    score: int
    sentiment: str


class PortfolioResponse(BaseModel):
    totalValue: float
    overallRisk: int
    highRiskExposure: float
    holdingsCount: int
    holdings: list[HoldingResponse]
    message: str