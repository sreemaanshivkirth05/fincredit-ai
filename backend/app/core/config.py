from typing import Literal
from pydantic import Field, SecretStr, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    APP_NAME: str = "FinCredit AI"
    APP_ENV: str = "development"
    API_PREFIX: str = "/api"
    DATABASE_URL: str = "postgresql://postgres:postgres@localhost:5432/fincredit_ai"
    FRONTEND_URL: str = "http://localhost:3000"
    CORS_ALLOWED_ORIGINS: str = "http://localhost:3000,http://127.0.0.1:3000"
    # Local fallback keeps the demo easy to run. Production must override this value.
    JWT_SECRET_KEY: str = "fincredit-local-dev-secret-change-before-production"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24
    DEMO_USER_EMAIL: str = "demo@fincredit.ai"
    DEMO_USER_PASSWORD: str = "DemoPass123!"
    ADMIN_USER_EMAIL: str = "admin@fincredit.ai"
    ADMIN_USER_PASSWORD: str = "AdminPass123!"
    OLLAMA_MODEL: str = "llama3.1:8b"
    OLLAMA_MAX_OUTPUT_TOKENS: int = Field(default=768, ge=64, le=2048)
    LLM_TIMEOUT_SECONDS: int = Field(default=20, ge=1, le=180)
    LLM_PROVIDER: Literal["ollama", "huggingface"] = "ollama"
    HF_SPACE_ID: str = "Sreemaan05/fincredit-ai-inference"
    HF_TOKEN: SecretStr = SecretStr("")
    FINCREDIT_SPACE_KEY: SecretStr = SecretStr("")
    HF_TIMEOUT_SECONDS: int = Field(default=90, ge=1, le=180)
    HF_ALLOW_OLLAMA_FALLBACK: bool = False
    OLLAMA_BASE_URL: str = "http://localhost:11434"
    SIMULATION_ENABLED: bool = False
    SIMULATION_MAX_AGENTS: int = Field(default=6, ge=1, le=6)
    SIMULATION_MAX_ROUNDS: int = Field(default=10, ge=1, le=10)
    SIMULATION_MAX_MODEL_CALLS: int = Field(default=40, ge=1, le=40)
    SIMULATION_PROVIDER: Literal["ollama", "huggingface"] = "ollama"
    SIMULATION_MODEL: str = Field(default="", max_length=200)

    @model_validator(mode="after")
    def production_guard(self):
        if self.APP_ENV == "production":
            if len(self.JWT_SECRET_KEY) < 40 or any(word in self.JWT_SECRET_KEY.lower() for word in ("demo", "change-before", "local-dev")):
                raise ValueError("Production requires a unique JWT_SECRET_KEY of at least 40 characters")
            if not self.FRONTEND_URL.startswith("https://"):
                raise ValueError("Production requires an HTTPS FRONTEND_URL")
            if any(not origin.startswith("https://") for origin in self.cors_allowed_origins):
                raise ValueError("Production CORS origins must use HTTPS")
        return self

    @property
    def cors_allowed_origins(self) -> list[str]:
        origins = [
            origin.strip()
            for origin in self.CORS_ALLOWED_ORIGINS.split(",")
            if origin.strip()
        ]

        if self.FRONTEND_URL and self.FRONTEND_URL not in origins:
            origins.append(self.FRONTEND_URL)

        return origins

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")


settings = Settings()
