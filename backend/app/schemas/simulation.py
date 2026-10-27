"""Phase 1 contracts: configuration only, no execution request or results."""
from datetime import datetime
from enum import Enum
from typing import Annotated, Literal
from uuid import UUID

from pydantic import BaseModel, BeforeValidator, ConfigDict, Field, StringConstraints, model_validator


class AgentType(str, Enum):
    institutional_investor = "institutional_investor"
    retail_investor = "retail_investor"
    risk_manager = "risk_manager"
    quantitative_analyst = "quantitative_analyst"
    news_sentiment_analyst = "news_sentiment_analyst"
    portfolio_manager = "portfolio_manager"


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
    status: Literal["configured"]
    version: Literal["simulation-v1"]
    createdAt: datetime


class SimulationResponse(SimulationSummary):
    snapshot: SnapshotResponse


class SimulationList(Contract):
    runs: list[SimulationSummary]
    limit: int
    offset: int
