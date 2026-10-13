from typing import Annotated
from pydantic import BaseModel, Field

Shock = Annotated[float, Field(ge=-100, le=100, allow_inf_nan=False)]


class PortfolioScenarioRequest(BaseModel):
    marketShockPercent: Shock = -10
    sectorShocks: dict[str, Shock] = Field(default_factory=dict, max_length=100)


class ScenarioPosition(BaseModel):
    ticker: str
    sector: str
    value: float
    weight: float
    shockPercent: float
    change: float
    scenarioValue: float


class AnalyticsSector(BaseModel):
    name: str
    weight: float


class CurrencyAnalytics(BaseModel):
    currency: str
    totalValue: float
    holdingsCount: int
    largestPositionPercent: float
    topThreePercent: float
    concentrationIndex: float
    effectiveHoldings: float
    sectorAllocation: list[AnalyticsSector]
    scenarioValue: float
    scenarioChange: float
    scenarioChangePercent: float
    positions: list[ScenarioPosition]


class PortfolioAnalyticsResponse(BaseModel):
    groups: list[CurrencyAnalytics]
    warnings: list[str]
    assumptions: list[str]
