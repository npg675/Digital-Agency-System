from pydantic_settings import BaseSettings
from typing import Optional

class Settings(BaseSettings):
    PROJECT_NAME: str = "LandingForge API"
    API_V1_STR: str = "/api/v1"
    SECRET_KEY: str = "supersecretkey_change_in_production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440 # 1 day

    # DATABASE
    DATABASE_URL: str = "sqlite:///./landingforge.db"

    # EXTERNAL APIS
    OPENAI_API_KEY: Optional[str] = None

    class Config:
        env_file = ".env"
        case_sensitive = True
        extra = "ignore"

settings = Settings()
