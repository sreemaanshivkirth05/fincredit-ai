from datetime import datetime

from pydantic import BaseModel


class SecCompanyFactsResponse(BaseModel):
    ticker: str
    cik: str
    companyName: str
    revenue: float | None
    netIncome: float | None
    assets: float | None
    liabilities: float | None
    equity: float | None
    fiscalYear: int | None
    form: str | None
    filed: str | None
    source: str
    message: str


class SecFundamentalSnapshotResponse(BaseModel):
    ticker: str
    cik: str
    companyName: str
    revenue: float | None
    netIncome: float | None
    assets: float | None
    liabilities: float | None
    equity: float | None
    fiscalYear: int | None
    form: str | None
    filed: str | None
    source: str
    fetchedAt: datetime


class SecFundamentalsHistoryResponse(BaseModel):
    ticker: str
    snapshotsCount: int
    snapshots: list[SecFundamentalSnapshotResponse]
    message: str