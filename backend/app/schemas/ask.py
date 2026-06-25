from datetime import datetime

from pydantic import BaseModel


class AskRequest(BaseModel):
    question: str


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
    question: str
    answer: str
    riskDrivers: list[RiskDriverResponse]
    evidence: list[AskEvidenceResponse]
    suggestedActions: list[str]
    audit: AskAuditResponse
    message: str


class AgentRunItemResponse(BaseModel):
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