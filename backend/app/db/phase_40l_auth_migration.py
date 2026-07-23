from sqlalchemy import text

from app.core.config import settings
from app.core.security import get_password_hash
from app.db.database import SessionLocal, engine

DEMO_EMAIL = settings.DEMO_USER_EMAIL
DEMO_PASSWORD = settings.DEMO_USER_PASSWORD
ADMIN_EMAIL = settings.ADMIN_USER_EMAIL
ADMIN_PASSWORD = settings.ADMIN_USER_PASSWORD


def ensure_user(db, email: str, password: str, role: str, full_name: str):
    existing_user = db.execute(
        text("SELECT id FROM users WHERE lower(email) = lower(:email)"),
        {"email": email},
    ).first()

    if existing_user:
        return existing_user[0]

    result = db.execute(
        text(
            """
            INSERT INTO users
                (email, full_name, hashed_password, role, is_active, created_at, updated_at)
            VALUES
                (:email, :full_name, :hashed_password, :role, true, NOW(), NOW())
            RETURNING id
            """
        ),
        {
            "email": email,
            "full_name": full_name,
            "hashed_password": get_password_hash(password),
            "role": role,
        },
    )

    return result.scalar_one()


def run_migration():
    with engine.begin() as connection:
        connection.execute(
            text(
                """
                CREATE TABLE IF NOT EXISTS users (
                    id SERIAL PRIMARY KEY,
                    email VARCHAR NOT NULL UNIQUE,
                    full_name VARCHAR NULL,
                    hashed_password VARCHAR NOT NULL,
                    role VARCHAR NOT NULL DEFAULT 'user',
                    is_active BOOLEAN NOT NULL DEFAULT true,
                    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
                    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
                )
                """
            )
        )
        connection.execute(
            text("CREATE INDEX IF NOT EXISTS ix_users_email ON users (email)")
        )
        connection.execute(
            text("CREATE INDEX IF NOT EXISTS ix_users_id ON users (id)")
        )

        for table in [
            "holdings",
            "portfolio_transactions",
            "watchlist_companies",
            "agent_runs",
        ]:
            connection.execute(
                text(f"ALTER TABLE {table} ADD COLUMN IF NOT EXISTS user_id INTEGER NULL")
            )
            connection.execute(
                text(
                    f"CREATE INDEX IF NOT EXISTS ix_{table}_user_id ON {table} (user_id)"
                )
            )

    db = SessionLocal()
    try:
        demo_user_id = ensure_user(
            db=db,
            email=DEMO_EMAIL,
            password=DEMO_PASSWORD,
            role="user",
            full_name="FinCredit Demo User",
        )
        ensure_user(
            db=db,
            email=ADMIN_EMAIL,
            password=ADMIN_PASSWORD,
            role="admin",
            full_name="FinCredit Admin",
        )

        for table in [
            "holdings",
            "portfolio_transactions",
            "watchlist_companies",
            "agent_runs",
        ]:
            db.execute(
                text(f"UPDATE {table} SET user_id = :user_id WHERE user_id IS NULL"),
                {"user_id": demo_user_id},
            )

        db.commit()

        print("Phase 40L auth migration complete.")
        print(f"Demo user: {DEMO_EMAIL}")
        print(f"Admin user: {ADMIN_EMAIL}")
    finally:
        db.close()


if __name__ == "__main__":
    run_migration()
