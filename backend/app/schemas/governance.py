from pydantic import BaseModel


class ModelUsageResponse(BaseModel):
    model: str
    task: str
    calls: int
    cost: float
    status: str


class QualityMetricResponse(BaseModel):
    metric: str
    value: int


class AgentRunResponse(BaseModel):
    agent: str
    company: str
    status: str
    model: str
    duration: str
    grounding: int


class DataSourceResponse(BaseModel):
    source: str
    status: str
    lastSync: str
    latency: str


class AuditLogResponse(BaseModel):
    time: str
    event: str
    detail: str
    severity: str


class GovernanceResponse(BaseModel):
    totalModelCalls: int
    estimatedCost: float
    avgGrounding: int
    auditEvents: int
    modelUsage: list[ModelUsageResponse]
    qualityMetrics: list[QualityMetricResponse]
    agentRuns: list[AgentRunResponse]
    dataSources: list[DataSourceResponse]
    auditLogs: list[AuditLogResponse]
    message: str