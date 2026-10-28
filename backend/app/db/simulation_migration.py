"""Idempotent, additive Simulation Lab schema preparation.

PostgreSQL Phase 1 records and immutable snapshots are preserved while Phase 2
adds execution columns and child tables. SQLite is supported for fresh isolated
test databases; application upgrades use PostgreSQL.
"""
from sqlalchemy import inspect, text

from app.db.database import engine
from app.models.simulation import (
    SimulationAction, SimulationAgent, SimulationAuditEvent, SimulationMemory,
    SimulationRound, SimulationRun, SimulationSnapshot,
)


EXECUTION_TABLES = (
    SimulationAgent, SimulationRound, SimulationAction, SimulationMemory,
    SimulationAuditEvent,
)


def _postgres_run_upgrade(connection):
    statements = (
        "ALTER TABLE simulation_runs ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ",
        "ALTER TABLE simulation_runs ADD COLUMN IF NOT EXISTS started_at TIMESTAMPTZ",
        "ALTER TABLE simulation_runs ADD COLUMN IF NOT EXISTS finished_at TIMESTAMPTZ",
        "ALTER TABLE simulation_runs ADD COLUMN IF NOT EXISTS cancel_requested BOOLEAN",
        "ALTER TABLE simulation_runs ADD COLUMN IF NOT EXISTS model_calls INTEGER",
        "ALTER TABLE simulation_runs ADD COLUMN IF NOT EXISTS result JSONB",
        "UPDATE simulation_runs SET updated_at = COALESCE(updated_at, created_at, NOW()), "
        "cancel_requested = COALESCE(cancel_requested, FALSE), "
        "model_calls = COALESCE(model_calls, 0), result = COALESCE(result, '{}'::jsonb)",
        "ALTER TABLE simulation_runs ALTER COLUMN updated_at SET DEFAULT NOW()",
        "ALTER TABLE simulation_runs ALTER COLUMN updated_at SET NOT NULL",
        "ALTER TABLE simulation_runs ALTER COLUMN cancel_requested SET DEFAULT FALSE",
        "ALTER TABLE simulation_runs ALTER COLUMN cancel_requested SET NOT NULL",
        "ALTER TABLE simulation_runs ALTER COLUMN model_calls SET DEFAULT 0",
        "ALTER TABLE simulation_runs ALTER COLUMN model_calls SET NOT NULL",
        "ALTER TABLE simulation_runs ALTER COLUMN result SET DEFAULT '{}'::jsonb",
        "ALTER TABLE simulation_runs ALTER COLUMN result SET NOT NULL",
        "ALTER TABLE simulation_runs DROP CONSTRAINT IF EXISTS ck_simulation_configured",
        "ALTER TABLE simulation_runs DROP CONSTRAINT IF EXISTS ck_simulation_status",
        "ALTER TABLE simulation_runs DROP CONSTRAINT IF EXISTS ck_simulation_model_calls",
        "ALTER TABLE simulation_runs ADD CONSTRAINT ck_simulation_status CHECK "
        "(status IN ('configured','queued','running','completed','cancelled','failed'))",
        "ALTER TABLE simulation_runs ADD CONSTRAINT ck_simulation_model_calls CHECK (model_calls >= 0)",
        "CREATE INDEX IF NOT EXISTS ix_simulation_runs_status ON simulation_runs (status)",
        "CREATE UNIQUE INDEX IF NOT EXISTS uq_simulation_active_user ON simulation_runs (user_id) "
        "WHERE status IN ('queued', 'running')",
    )
    for statement in statements:
        connection.execute(text(statement))


def _snapshot_guards(connection):
    if connection.dialect.name == "postgresql":
        connection.execute(text("""
            CREATE OR REPLACE FUNCTION reject_simulation_snapshot_mutation()
            RETURNS trigger LANGUAGE plpgsql AS $$
            BEGIN
                RAISE EXCEPTION 'Simulation input snapshots are immutable';
            END;
            $$
        """))
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


def _postgres_action_upgrade(connection):
    for statement in (
        "ALTER TABLE simulation_actions ADD COLUMN IF NOT EXISTS decision_detail JSONB",
        "UPDATE simulation_actions SET decision_detail = COALESCE(decision_detail, '{}'::jsonb)",
        "ALTER TABLE simulation_actions ALTER COLUMN decision_detail SET DEFAULT '{}'::jsonb",
        "ALTER TABLE simulation_actions ALTER COLUMN decision_detail SET NOT NULL",
    ):
        connection.execute(text(statement))


def run_migration(bind=None):
    target = bind if bind is not None else engine
    with target.begin() as connection:
        existing = set(inspect(connection).get_table_names())
        if (connection.dialect.name == "sqlite" and "simulation_runs" in existing
                and "updated_at" not in {
                    column["name"] for column in inspect(connection).get_columns("simulation_runs")
                }):
            raise RuntimeError(
                "Phase 2 cannot alter a legacy SQLite simulation table safely; "
                "use a fresh isolated SQLite test database. PostgreSQL upgrades are additive."
            )
        SimulationRun.__table__.create(connection, checkfirst=True)
        SimulationSnapshot.__table__.create(connection, checkfirst=True)
        if connection.dialect.name == "postgresql":
            _postgres_run_upgrade(connection)
        for model in EXECUTION_TABLES:
            model.__table__.create(connection, checkfirst=True)
        if connection.dialect.name == "postgresql":
            _postgres_action_upgrade(connection)
        _snapshot_guards(connection)


if __name__ == "__main__":
    run_migration()
    print("Simulation execution schema prepared; existing records preserved.")
