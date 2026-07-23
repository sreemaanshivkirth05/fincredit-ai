from pydantic import BaseModel


class StockSearchResult(BaseModel):
    ticker: str
    name: str
    cik: str | None = None
    source: str


class StockSearchResponse(BaseModel):
    query: str
    results: list[StockSearchResult]
