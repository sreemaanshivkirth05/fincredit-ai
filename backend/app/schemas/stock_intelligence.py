from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field


class IntelligenceMetric(BaseModel):
    label: str
    value: str
    status: str
    explanation: str
    evidenceType: str


class IntelligenceScore(BaseModel):
    label: str
    score: int
    status: str
    explanation: str
    drivers: list[str] = Field(default_factory=list)
    missingData: list[str] = Field(default_factory=list)


class ValuationCheck(BaseModel):
    peRatio: Optional[float] = None
    forwardPe: Optional[float] = None
    priceToSales: Optional[float] = None
    priceToBook: Optional[float] = None
    enterpriseToRevenue: Optional[float] = None
    enterpriseToEbitda: Optional[float] = None
    marketCap: Optional[float] = None
    beta: Optional[float] = None
    fiftyTwoWeekHigh: Optional[float] = None
    fiftyTwoWeekLow: Optional[float] = None
    valuationRisk: str
    explanation: str
    missingData: list[str] = Field(default_factory=list)


class FinancialHealthCheck(BaseModel):
    revenue: Optional[float] = None
    netIncome: Optional[float] = None
    assets: Optional[float] = None
    liabilities: Optional[float] = None
    equity: Optional[float] = None
    profitMarginApprox: Optional[float] = None
    debtToAssetsApprox: Optional[float] = None
    returnOnAssetsApprox: Optional[float] = None
    status: str
    explanation: str
    redFlags: list[str] = Field(default_factory=list)
    strengths: list[str] = Field(default_factory=list)
    missingData: list[str] = Field(default_factory=list)


class BullBearBaseCase(BaseModel):
    bullCase: str
    bearCase: str
    baseCase: str
    whatCouldGoRight: list[str] = Field(default_factory=list)
    whatCouldGoWrong: list[str] = Field(default_factory=list)
    whatToMonitor: list[str] = Field(default_factory=list)
    evidenceUsed: list[str] = Field(default_factory=list)
    disclaimer: str


class PortfolioFitCheck(BaseModel):
    isInPortfolio: bool
    currentWeight: Optional[float] = None
    sector: Optional[str] = None
    concentrationMessage: str
    diversificationImpact: str
    riskDrivers: list[str] = Field(default_factory=list)
    explanation: str
    missingData: list[str] = Field(default_factory=list)


class DecisionReadinessCheck(BaseModel):
    score: int
    status: str
    completedChecks: list[str] = Field(default_factory=list)
    missingChecks: list[str] = Field(default_factory=list)
    warnings: list[str] = Field(default_factory=list)
    explanation: str


class EvidenceStrengthCheck(BaseModel):
    score: int
    status: str
    sourcesAvailable: list[str] = Field(default_factory=list)
    sourcesMissing: list[str] = Field(default_factory=list)
    explanation: str


class StockIntelligenceResponse(BaseModel):
    ticker: str
    company: str
    generatedAt: datetime
    investmentCaseScorecard: list[IntelligenceScore]
    valuationCheck: ValuationCheck
    financialHealthCheck: FinancialHealthCheck
    bullBearBaseCase: BullBearBaseCase
    portfolioFitCheck: PortfolioFitCheck
    decisionReadiness: DecisionReadinessCheck
    evidenceStrength: EvidenceStrengthCheck
    redFlags: list[str] = Field(default_factory=list)
    beginnerSummary: str
    disclaimer: str
