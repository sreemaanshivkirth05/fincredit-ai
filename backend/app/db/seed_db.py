from app.db.database import SessionLocal
from app.models.holding import Holding


def seed_holdings():
    db = SessionLocal()

    try:
        existing_count = db.query(Holding).count()

        if existing_count > 0:
            print("Holdings already exist. Skipping seed.")
            return

        holdings = [
            Holding(
                ticker="MSFT",
                company="Microsoft Corp.",
                shares=5,
                avg_price=410,
                value=2245,
                weight=34,
                sector="Technology",
                risk="Low",
                score=28,
                sentiment="Positive",
            ),
            Holding(
                ticker="NVDA",
                company="NVIDIA Corp.",
                shares=3,
                avg_price=125,
                value=2130,
                weight=31,
                sector="Semiconductors",
                risk="Medium",
                score=54,
                sentiment="Positive",
            ),
            Holding(
                ticker="TSLA",
                company="Tesla Inc.",
                shares=2,
                avg_price=220,
                value=1430,
                weight=21,
                sector="Automotive",
                risk="High",
                score=78,
                sentiment="Mixed",
            ),
            Holding(
                ticker="JPM",
                company="JPMorgan Chase",
                shares=4,
                avg_price=190,
                value=960,
                weight=14,
                sector="Financials",
                risk="Low",
                score=33,
                sentiment="Neutral",
            ),
        ]

        db.add_all(holdings)
        db.commit()

        print("Holdings seeded successfully.")

    finally:
        db.close()


if __name__ == "__main__":
    seed_holdings()