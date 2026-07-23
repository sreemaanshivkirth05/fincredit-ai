from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text
from sqlalchemy.exc import SQLAlchemyError

from app.api.ask import router as ask_router
from app.api.admin import router as admin_router
from app.api.auth import router as auth_router
from app.api.company import router as company_router
from app.api.dashboard import router as dashboard_router
from app.api.demo import router as demo_router
from app.api.governance import router as governance_router
from app.api.market import router as market_router
from app.api.news import router as news_router
from app.api.portfolio import router as portfolio_router
from app.api.reports import router as reports_router
from app.api.sec import router as sec_router
from app.api.stock_intelligence import router as stock_intelligence_router
from app.api.stocks import router as stocks_router
from app.api.watchlist import router as watchlist_router
from app.core.config import settings
from app.db.database import engine
from app.routers.market_chart import router as market_chart_router

app = FastAPI(
    title=settings.APP_NAME,
    version="0.1.0",
    description="Backend API for FinCredit AI financial intelligence platform.",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def root():
    return {
        "message": "FinCredit AI backend is running",
        "environment": settings.APP_ENV,
    }


@app.get("/api/health")
def health_check():
    return {
        "status": "healthy",
        "service": settings.APP_NAME,
        "environment": settings.APP_ENV,
    }


@app.get("/api/db-check")
def database_check():
    try:
        with engine.connect() as connection:
            result = connection.execute(text("SELECT current_database();"))
            database_name = result.scalar()

        return {
            "status": "connected",
            "database": database_name,
        }

    except SQLAlchemyError as error:
        return {
            "status": "error",
            "message": str(error),
        }


app.include_router(dashboard_router, prefix=settings.API_PREFIX)
app.include_router(auth_router, prefix=settings.API_PREFIX)
app.include_router(admin_router, prefix=settings.API_PREFIX)
app.include_router(demo_router, prefix=settings.API_PREFIX)
app.include_router(portfolio_router, prefix=settings.API_PREFIX)
app.include_router(watchlist_router, prefix=settings.API_PREFIX)
app.include_router(reports_router, prefix=settings.API_PREFIX)
app.include_router(governance_router, prefix=settings.API_PREFIX)
app.include_router(company_router, prefix=settings.API_PREFIX)
app.include_router(ask_router, prefix=settings.API_PREFIX)
app.include_router(market_router, prefix=settings.API_PREFIX)
app.include_router(sec_router, prefix=settings.API_PREFIX)
app.include_router(news_router, prefix=settings.API_PREFIX)
app.include_router(stocks_router, prefix=settings.API_PREFIX)
app.include_router(stock_intelligence_router, prefix=settings.API_PREFIX)

app.include_router(market_chart_router)
