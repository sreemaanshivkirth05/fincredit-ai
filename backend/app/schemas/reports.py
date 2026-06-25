from datetime import datetime
from typing import Any

from pydantic import BaseModel


class ReportItemResponse(BaseModel):
    id: str
    company: str
    ticker: str
    type: str
    status: str
    grounding: int
    unsupported: int
    model: str
    created: str


class ReportQualityResponse(BaseModel):
    report: str
    grounding: int


class WorkflowStepResponse(BaseModel):
    title: str
    detail: str
    status: str


class ReportsResponse(BaseModel):
    totalReports: int
    approvedReports: int
    needsReview: int
    avgGrounding: int
    reports: list[ReportItemResponse]
    reportQuality: list[ReportQualityResponse]
    workflow: list[WorkflowStepResponse]
    message: str


class GeneratedReportResponse(BaseModel):
    reportId: str
    agentRunId: int
    ticker: str
    company: str
    reportType: str
    status: str
    grounding: int
    unsupported: int
    model: str
    created: str
    message: str


class ReportDocumentResponse(BaseModel):
    reportId: str
    agentRunId: int
    ticker: str | None
    question: str
    answer: str
    riskDrivers: list[dict[str, Any]]
    evidence: list[dict[str, Any]]
    suggestedActions: list[str]
    createdAt: datetime
    message: str