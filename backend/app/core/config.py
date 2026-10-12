from typing import Literal
from pydantic import Field, SecretStr
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
    LLM_TIMEOUT_SECONDS: int = Field(default=20, ge=1, le=180)
    LLM_PROVIDER: Literal["ollama", "huggingface"] = "ollama"
    HF_SPACE_ID: str = "Sreemaan05/fincredit-ai-inference"
    HF_TOKEN: SecretStr = SecretStr("")
    FINCREDIT_SPACE_KEY: SecretStr = SecretStr("")
    HF_TIMEOUT_SECONDS: int = Field(default=90, ge=1, le=180)
    HF_ALLOW_OLLAMA_FALLBACK: bool = False
    OLLAMA_BASE_URL: str = "http://localhost:11434"

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
