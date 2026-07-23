from sqlalchemy import text

from app.db.database import engine


MIGRATION_STATEMENTS = [
    """
    CREATE TABLE IF NOT EXISTS portfolio_transactions (
        id SERIAL PRIMARY KEY,
        ticker VARCHAR NOT NULL,
        company VARCHAR NOT NULL,
        action VARCHAR NOT NULL,
        shares DOUBLE PRECISION NOT NULL,
        price DOUBLE PRECISION NOT NULL,
        total_amount DOUBLE PRECISION NOT NULL,
        currency VARCHAR,
        exchange VARCHAR,
        created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW()
    );
    """,
    """
    ALTER TABLE portfolio_transactions
    ADD COLUMN IF NOT EXISTS realized_pl DOUBLE PRECISION;
    """,
    """
    ALTER TABLE portfolio_transactions
    ADD COLUMN IF NOT EXISTS realized_pl_percent DOUBLE PRECISION;
    """,
]


def run_migration():
    with engine.begin() as connection:
        for statement in MIGRATION_STATEMENTS:
            connection.execute(text(statement))

    print("Phase 40F portfolio sell migration completed successfully.")


if __name__ == "__main__":
    run_migration()
