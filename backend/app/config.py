from functools import lru_cache

from pydantic import Field
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    app_name: str = "AI Delivery Operating System"
    app_env: str = "development"
    debug: bool = Field(default=True, validation_alias="APP_DEBUG")
    auto_create_tables: bool = Field(default=True, validation_alias="APP_AUTO_CREATE_TABLES")

    host: str = "0.0.0.0"
    port: int = 8100

    postgres_host: str = "localhost"
    postgres_port: int = 5432
    postgres_db: str = "delivery_os"
    postgres_user: str = "delivery_os"
    postgres_password: str = "change-me"
    database_url_override: str | None = None

    redis_url: str = "redis://localhost:6379/1"

    @property
    def database_url(self) -> str:
        if self.database_url_override:
            return self.database_url_override
        return "sqlite+aiosqlite:///./delivery_os.db"

    model_config = {
        "env_file": ".env",
        "env_file_encoding": "utf-8",
        "extra": "ignore",
    }


@lru_cache
def get_settings() -> Settings:
    return Settings()
