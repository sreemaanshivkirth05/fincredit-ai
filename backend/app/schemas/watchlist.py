from pydantic import BaseModel


class WatchlistCompanyResponse(BaseModel):
    ticker: str
    company: str
    sector: str
    risk: str
    riskScore: int
    sentiment: str
    filing: str
    status: str


class SentimentDataResponse(BaseModel):
    ticker: str
    positive: int
    negative: int


class NewsRadarResponse(BaseModel):
    ticker: str
    headline: str
    category: str
    impact: str


class WatchlistResponse(BaseModel):
    companiesTracked: int
    needsReview: int
    newFilingChanges: int
    positiveSentiment: int
    watchlist: list[WatchlistCompanyResponse]
    sentimentData: list[SentimentDataResponse]
    newsRadar: list[NewsRadarResponse]
    message: str