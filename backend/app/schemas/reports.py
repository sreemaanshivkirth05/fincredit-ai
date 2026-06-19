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