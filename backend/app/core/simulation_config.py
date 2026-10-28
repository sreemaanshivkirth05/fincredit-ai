"""Execution-only Simulation Lab limits, separated from general app secrets."""
from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class SimulationExecutionSettings(BaseSettings):
    SIMULATION_MAX_OUTPUT_TOKENS: int = Field(default=384, ge=128, le=1024)
    SIMULATION_MAX_RUNTIME_SECONDS: int = Field(default=3600, ge=60, le=7200)
    SIMULATION_STALE_SECONDS: int = Field(default=600, ge=60, le=1800)

    model_config = SettingsConfigDict(
        env_file=".env", env_file_encoding="utf-8", extra="ignore"
    )


execution_settings = SimulationExecutionSettings()
