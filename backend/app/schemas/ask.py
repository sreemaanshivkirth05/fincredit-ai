from datetime import datetime

from pydantic import BaseModel, Field


class AskRequest(BaseModel):
    question: str = Field(min_length=1, max_length=4000)


class RiskDriverResponse(BaseModel):
    ticker: str
    driver: str
    impact: str


class AskEvidenceResponse(BaseModel):
    source: str
    claim: str
    confidence: int


class AskAuditResponse(BaseModel):
    workflow: str
    agentsUsed: list[str]
    groundingScore: int
    unsupportedClaims: int
    status: str


class AskResponse(BaseModel):
    researchDetails: dict | None = None
    agentRunId: int
    question: str
    answer: str
    riskDrivers: list[RiskDriverResponse]
    evidence: list[AskEvidenceResponse]
    suggestedActions: list[str]
    audit: AskAuditResponse
    message: str


class AgentRunItemResponse(BaseModel):
    researchDetails: dict | None = None
    id: int
    question: str
    ticker: str | None
    answer: str
    workflow: str
    agentsUsed: list[str]
    groundingScore: int
    unsupportedClaims: int
    status: str
    riskDrivers: list[RiskDriverResponse]
    evidence: list[AskEvidenceResponse]
    suggestedActions: list[str]
    createdAt: datetime


class AgentRunsResponse(BaseModel):
    totalRuns: int
    runs: list[AgentRunItemResponse]
    message: str


class AgentRunsByTickerResponse(BaseModel):
    ticker: str
    totalRuns: int
    runs: list[AgentRunItemResponse]
    message: str