"""Validated Simulation Lab configuration, execution, and audit contracts."""
from datetime import datetime
from enum import Enum
from typing import Annotated, Any, Literal
from uuid import UUID

from pydantic import BaseModel, BeforeValidator, ConfigDict, Field, StringConstraints, model_validator


class AgentType(str, Enum):
    institutional_investor = "institutional_investor"
    retail_investor = "retail_investor"
    risk_manager = "risk_manager"
    quantitative_analyst = "quantitative_analyst"
    news_sentiment_analyst = "news_sentiment_analyst"
    portfolio_manager = "portfolio_manager"


class SimulationStatus(str, Enum):
    configured = "configured"
    queued = "queued"
    running = "running"
    completed = "completed"
    cancelled = "cancelled"
    failed = "failed"


class SimulatedAction(str, Enum):
    buy = "BUY"
    sell = "SELL"
    hold = "HOLD"
    abstain = "ABSTAIN"


class Contract(BaseModel):
    model_config = ConfigDict(extra="forbid")


class SimulationConfiguration(Contract):
    agentTypes: list[AgentType] = Field(default_factory=lambda: [
        AgentType.institutional_investor, AgentType.risk_manager,
        AgentType.quantitative_analyst, AgentType.portfolio_manager,
    ], min_length=1, max_length=6)
    rounds: int = Field(default=5, strict=True, ge=1, le=10)
    seed: int = Field(default=42, strict=True, ge=0, le=2**31 - 1)
    maxModelCalls: int = Field(default=40, strict=True, ge=1, le=40)

    @model_validator(mode="after")
    def consistent_budget(self):
        if len(set(self.agentTypes)) != len(self.agentTypes):
            raise ValueError("Agent types must be unique")
        if len(self.agentTypes) * self.rounds > self.maxModelCalls:
            raise ValueError("Model call budget must cover agents times rounds")
        return self


Ticker = Annotated[str, StringConstraints(pattern=r"^[A-Z0-9.^=\-]{1,20}$"),
                   BeforeValidator(lambda value: value.strip().upper() if isinstance(value, str) else value)]


class SimulationCreate(Contract):
    title: str = Field(default="Simulation draft", min_length=1, max_length=120)
    scenario: Annotated[str, StringConstraints(strip_whitespace=True, min_length=8, max_length=4000)]
    tickers: list[Ticker] = Field(default_factory=list, max_length=20)
    configuration: SimulationConfiguration = Field(default_factory=SimulationConfiguration)

    @model_validator(mode="after")
    def clean_input(self):
        self.title = self.title.strip()
        if not self.title:
            raise ValueError("Title must not be blank")
        if len(set(self.tickers)) != len(self.tickers):
            raise ValueError("Tickers must be unique")
        return self


class HoldingInput(Contract):
    holdingId: int
    ticker: str
    company: str
    shares: str | None
    averagePrice: str | None
    currentPrice: str | None
    currency: str | None
    sector: str
    sourceUpdatedAt: datetime | None


class SnapshotInputs(Contract):
    request: SimulationCreate
    provider: Literal["ollama", "huggingface"]
    model: str
    holdings: list[HoldingInput]
    limitations: list[str]


class SnapshotResponse(Contract):
    capturedAt: datetime
    sha256: str = Field(pattern=r"^[a-f0-9]{64}$")
    inputs: SnapshotInputs


class SimulationSummary(Contract):
    id: UUID
    title: str
    status: SimulationStatus
    version: Literal["simulation-v1", "simulation-v2"]
    createdAt: datetime
    updatedAt: datetime
    startedAt: datetime | None = None
    finishedAt: datetime | None = None
    cancellationRequested: bool = False
    modelCalls: int = 0


class SimulationResponse(SimulationSummary):
    snapshot: SnapshotResponse
    progress: "SimulationProgress"
    result: dict[str, Any] = Field(default_factory=dict)


class SimulationList(Contract):
    runs: list[SimulationSummary]
    limit: int
    offset: int


class SimulationProgress(Contract):
    completedRounds: int = 0
    totalRounds: int
    completedActions: int = 0
    totalPlannedActions: int


class AgentDecision(Contract):
    """Only this bounded vocabulary may be persisted as a simulated action."""
    action: SimulatedAction
    ticker: Ticker | None = None
    allocationIntentPct: int = Field(strict=True, ge=-100, le=100)
    confidence: int = Field(strict=True, ge=0, le=100)
    rationale: Annotated[str, StringConstraints(strip_whitespace=True, min_length=20, max_length=1500)]
    evidenceIds: list[Annotated[str, StringConstraints(pattern=r"^[a-z]+:[A-Za-z0-9.^=\-]+$")]] = Field(
        min_length=1, max_length=12
    )
    uncertainties: list[Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=240)]] = Field(
        default_factory=list, max_length=6
    )

    @model_validator(mode="after")
    def consistent_action(self):
        if self.action in (SimulatedAction.buy, SimulatedAction.sell) and not self.ticker:
            raise ValueError("BUY and SELL require a ticker")
        if self.action == SimulatedAction.abstain and self.allocationIntentPct != 0:
            raise ValueError("ABSTAIN requires zero allocation intent")
        return self


class SimulationActionResponse(Contract):
    id: UUID
    roundNumber: int
    agentType: AgentType
    action: SimulatedAction
    ticker: str | None
    allocationIntentPct: int
    confidence: int
    rationale: str
    evidenceIds: list[str]
    uncertainties: list[str]
    provider: Literal["ollama", "huggingface"]
    model: str
    truncationNotice: str | None
    createdAt: datetime


class SimulationRoundResponse(Contract):
    roundNumber: int
    status: Literal["running", "completed", "failed", "cancelled"]
    startedAt: datetime
    completedAt: datetime | None
    checkpoint: dict[str, Any]
    actions: list[SimulationActionResponse]


class SimulationExecutionResponse(Contract):
    run: SimulationResponse
    rounds: list[SimulationRoundResponse]


class SimulationEventResponse(Contract):
    sequence: int
    eventType: str
    payload: dict[str, Any]
    createdAt: datetime


class SimulationEventList(Contract):
    events: list[SimulationEventResponse]
    limit: int
    offset: int


SimulationResponse.model_rebuild()
