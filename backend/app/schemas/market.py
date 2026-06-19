from pydantic import BaseModel


class MarketDataResponse(BaseModel):
    ticker: str
    companyName: str
    sector: str | None
    currentPrice: float | None
    previousClose: float | None
    dayHigh: float | None
    dayLow: float | None
    volume: int | None
    marketCap: int | None
    currency: str | None
    exchange: str | None
    message: str