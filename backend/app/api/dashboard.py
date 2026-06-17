from fastapi import APIRouter

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])


@router.get("")
def get_dashboard():
    return {
        "portfolioRisk": 57,
        "groundingScore": 94,
        "redFlags": 3,
        "watchlistCount": 8,
        "message": "Dashboard API connected successfully",
    }