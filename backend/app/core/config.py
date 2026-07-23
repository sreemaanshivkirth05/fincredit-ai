from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    APP_NAME: str = "FinCredit AI"
    APP_ENV: str = "development"
    API_PREFIX: str = "/api"
    DATABASE_URL: str = "postgresql://postgres:postgres@localhost:5432/fincredit_ai"
    FRONTEND_URL: str = "http://localhost:3000"
    JWT_SECRET_KEY: str = "fincredit-local-dev-secret-change-before-production"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")


settings = Settings()
