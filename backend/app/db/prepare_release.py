"""Additive schema preparation without creating demo credentials or resetting data."""
from sqlalchemy import text
from app.db.database import engine
from app.db.init_db import init_db
from app.db.phase_43_research_migration import run_migration
from app.db.simulation_migration import run_migration as migrate_simulations

if __name__ == "__main__":
    init_db()
    run_migration()
    migrate_simulations()
    # Refuse an unsafe promotion of a seeded demo database.
    from app.core.config import settings
    if settings.APP_ENV == "production":
        with engine.connect() as conn:
            if conn.execute(text("SELECT 1 FROM users WHERE email IN (:demo, :admin)"),
                            {"demo": settings.DEMO_USER_EMAIL, "admin": settings.ADMIN_USER_EMAIL}).first():
                raise RuntimeError("Remove or rename seeded demo accounts and rotate their passwords before production promotion")
    print("Release schema prepared; no demo accounts created.")
