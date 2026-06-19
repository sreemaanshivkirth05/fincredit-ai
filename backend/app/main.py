from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.dashboard import router as dashboard_router
from app.api.portfolio import router as portfolio_router
from app.api.watchlist import router as watchlist_router
from app.api.reports import router as reports_router
from app.api.governance import router as governance_router
from app.api.company import router as company_router
from app.api.ask import router as ask_router
from app.core.config import settings
from sqlalchemy import text
from sqlalchemy.exc import SQLAlchemyError
from app.db.database import engine

app = FastAPI(
    title=settings.APP_NAME,
    version="0.1.0",
    description="Backend API for FinCredit AI financial intelligence platform.",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.FRONTEND_URL],
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
app.include_router(portfolio_router, prefix=settings.API_PREFIX)
app.include_router(watchlist_router, prefix=settings.API_PREFIX)
app.include_router(reports_router, prefix=settings.API_PREFIX)
app.include_router(governance_router, prefix=settings.API_PREFIX)
app.include_router(company_router, prefix=settings.API_PREFIX)
app.include_router(ask_router, prefix=settings.API_PREFIX)