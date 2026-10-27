"""Idempotent, additive Phase 1 tables and database-enforced snapshot immutability.

No seed, backfill, portfolio mutation, or destructive downgrade is performed.
"""
from sqlalchemy import text

from app.db.database import engine
from app.models.simulation import SimulationRun, SimulationSnapshot


def run_migration(bind=None):
    target = bind if bind is not None else engine
    with target.begin() as connection:
        SimulationRun.__table__.create(connection, checkfirst=True)
        SimulationSnapshot.__table__.create(connection, checkfirst=True)
        if connection.dialect.name == "postgresql":
            connection.execute(text("""
                CREATE OR REPLACE FUNCTION reject_simulation_snapshot_mutation()
                RETURNS trigger LANGUAGE plpgsql AS $$
                BEGIN
                    RAISE EXCEPTION 'Simulation input snapshots are immutable';
                END;
                $$
            """))
            # Creating the trigger conditionally makes repeated preparation safe.
            connection.execute(text("""
                DO $$ BEGIN
                    IF NOT EXISTS (SELECT 1 FROM pg_trigger
                        WHERE tgname = 'simulation_snapshot_immutable'
                        AND tgrelid = 'simulation_snapshots'::regclass) THEN
                        CREATE TRIGGER simulation_snapshot_immutable
                        BEFORE UPDATE OR DELETE ON simulation_snapshots
                        FOR EACH ROW EXECUTE FUNCTION reject_simulation_snapshot_mutation();
                    END IF;
                END $$
            """))
        elif connection.dialect.name == "sqlite":
            for operation in ("UPDATE", "DELETE"):
                connection.execute(text(f"""
                    CREATE TRIGGER IF NOT EXISTS simulation_snapshot_no_{operation.lower()}
                    BEFORE {operation} ON simulation_snapshots BEGIN
                        SELECT RAISE(ABORT, 'Simulation input snapshots are immutable');
                    END
                """))
        else:
            raise RuntimeError("Simulation snapshots require PostgreSQL or SQLite")


if __name__ == "__main__":
    run_migration()
    print("Simulation foundation prepared; existing records preserved.")
