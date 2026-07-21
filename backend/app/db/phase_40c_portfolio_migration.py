from sqlalchemy import text

from app.db.database import engine


MIGRATION_STATEMENTS = [
    """
    ALTER TABLE holdings
    ADD COLUMN IF NOT EXISTS current_price DOUBLE PRECISION;
    """,
    """
    ALTER TABLE holdings
    ADD COLUMN IF NOT EXISTS total_cost DOUBLE PRECISION;
    """,
    """
    ALTER TABLE holdings
    ADD COLUMN IF NOT EXISTS unrealized_pl DOUBLE PRECISION;
    """,
    """
    ALTER TABLE holdings
    ADD COLUMN IF NOT EXISTS unrealized_pl_percent DOUBLE PRECISION;
    """,
    """
    ALTER TABLE holdings
    ADD COLUMN IF NOT EXISTS currency VARCHAR;
    """,
    """
    ALTER TABLE holdings
    ADD COLUMN IF NOT EXISTS exchange VARCHAR;
    """,
    """
    ALTER TABLE holdings
    ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW();
    """,
    """
    ALTER TABLE holdings
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW();
    """,
    """
    UPDATE holdings
    SET current_price =
        CASE
            WHEN current_price IS NOT NULL THEN current_price
            WHEN shares IS NOT NULL AND shares <> 0 AND value IS NOT NULL THEN value / shares
            ELSE avg_price
        END
    WHERE current_price IS NULL;
    """,
    """
    UPDATE holdings
    SET total_cost = shares * avg_price
    WHERE total_cost IS NULL;
    """,
    """
    UPDATE holdings
    SET value = shares * COALESCE(current_price, avg_price)
    WHERE shares IS NOT NULL;
    """,
    """
    UPDATE holdings
    SET unrealized_pl = value - total_cost
    WHERE unrealized_pl IS NULL;
    """,
    """
    UPDATE holdings
    SET unrealized_pl_percent =
        CASE
            WHEN total_cost IS NOT NULL AND total_cost <> 0
            THEN ((value - total_cost) / total_cost) * 100
            ELSE 0
        END
    WHERE unrealized_pl_percent IS NULL;
    """,
    """
    UPDATE holdings
    SET currency = 'USD'
    WHERE currency IS NULL;
    """,
    """
    UPDATE holdings
    SET created_at = NOW()
    WHERE created_at IS NULL;
    """,
    """
    UPDATE holdings
    SET updated_at = NOW()
    WHERE updated_at IS NULL;
    """,
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
]


def run_migration():
    with engine.begin() as connection:
        for statement in MIGRATION_STATEMENTS:
            connection.execute(text(statement))

    print("Phase 40C portfolio migration completed successfully.")


if __name__ == "__main__":
    run_migration()