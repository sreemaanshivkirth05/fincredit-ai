"""Add nullable diagnostics storage; old research runs remain readable."""
from sqlalchemy import text
from app.db.database import engine


def run_migration():
    with engine.begin() as connection:
        connection.execute(text("ALTER TABLE agent_runs ADD COLUMN IF NOT EXISTS research_details JSON NULL"))


if __name__ == "__main__":
    run_migration()
