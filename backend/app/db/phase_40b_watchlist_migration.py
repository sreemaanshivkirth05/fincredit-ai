from sqlalchemy import text

from app.db.database import engine


MIGRATION_STATEMENTS = [
    """
    ALTER TABLE watchlist_companies
    ADD COLUMN IF NOT EXISTS current_price DOUBLE PRECISION;
    """,
    """
    ALTER TABLE watchlist_companies
    ADD COLUMN IF NOT EXISTS previous_close DOUBLE PRECISION;
    """,
    """
    ALTER TABLE watchlist_companies
    ADD COLUMN IF NOT EXISTS market_cap DOUBLE PRECISION;
    """,
    """
    ALTER TABLE watchlist_companies
    ADD COLUMN IF NOT EXISTS volume BIGINT;
    """,
    """
    ALTER TABLE watchlist_companies
    ADD COLUMN IF NOT EXISTS currency VARCHAR;
    """,
    """
    ALTER TABLE watchlist_companies
    ADD COLUMN IF NOT EXISTS exchange VARCHAR;
    """,
    """
    ALTER TABLE watchlist_companies
    ADD COLUMN IF NOT EXISTS added_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW();
    """,
    """
    UPDATE watchlist_companies
    SET added_at = NOW()
    WHERE added_at IS NULL;
    """,
]


def run_migration():
    with engine.begin() as connection:
        for statement in MIGRATION_STATEMENTS:
            connection.execute(text(statement))

    print("Phase 40B watchlist migration completed successfully.")


if __name__ == "__main__":
    run_migration()