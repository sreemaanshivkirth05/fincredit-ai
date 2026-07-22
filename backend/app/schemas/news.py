from typing import Optional

from pydantic import BaseModel


class StockNewsItemResponse(BaseModel):
    title: str
    publisher: Optional[str] = None
    link: Optional[str] = None
    summary: Optional[str] = None
    publishedAt: Optional[str] = None
    thumbnail: Optional[str] = None
    type: Optional[str] = None


class StockNewsResponse(BaseModel):
    ticker: str
    count: int
    news: list[StockNewsItemResponse]
    source: str
    message: str