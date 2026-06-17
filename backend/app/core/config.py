from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    APP_NAME: str = "FinCredit AI"
    APP_ENV: str = "development"
    API_PREFIX: str = "/api"
    DATABASE_URL: str = "postgresql://postgres:postgres@localhost:5432/fincredit_ai"
    FRONTEND_URL: str = "http://localhost:3000"

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")


settings = Settings()