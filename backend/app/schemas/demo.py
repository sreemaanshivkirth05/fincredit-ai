from pydantic import BaseModel


class DemoResetResponse(BaseModel):
    holdingsCount: int
    transactionsCount: int
    watchlistCount: int
    message: str
