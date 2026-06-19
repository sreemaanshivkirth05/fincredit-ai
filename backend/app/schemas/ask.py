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
    primaryModel: str
    localModel: str
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