import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "PulseGuard-AI Gateway"
    SCHEMA_VERSION: str = "1.0"
    API_KEY: str = os.getenv("API_KEY", "pg_mon_secret_key_2026")
    JWT_SECRET: str = os.getenv("JWT_SECRET", "pg_jwt_secret_key_super_secure_9982")
    JWT_ALGORITHM: str = "HS256"
    
    # DB & Redis URLs
    POSTGRES_USER: str = os.getenv("POSTGRES_USER", "postgres")
    POSTGRES_PASSWORD: str = os.getenv("POSTGRES_PASSWORD", "postgres")
    POSTGRES_HOST: str = os.getenv("POSTGRES_HOST", "postgres")
    POSTGRES_PORT: str = os.getenv("POSTGRES_PORT", "5432")
    POSTGRES_DB: str = os.getenv("POSTGRES_DB", "pulseguard")
    
    REDIS_HOST: str = os.getenv("REDIS_HOST", "redis")
    REDIS_PORT: int = int(os.getenv("REDIS_PORT", "6379"))

    # Threshold constants
    SPO2_CRITICAL_MIN: int = 85
    HR_CRITICAL_MIN: int = 20
    HR_CRITICAL_MAX: int = 220
    
    # Window settings
    SLIDING_WINDOW_SECONDS: int = 10
    TICK_TIMEOUT_SECONDS: float = 2.0
    SERVER_MUTE_MAX_SECONDS: int = 300  # Server-clamped 5 minutes

    @property
    def async_database_url(self) -> str:
        return f"postgresql+asyncpg://{self.POSTGRES_USER}:{self.POSTGRES_PASSWORD}@{self.POSTGRES_HOST}:{self.POSTGRES_PORT}/{self.POSTGRES_DB}"

settings = Settings()
