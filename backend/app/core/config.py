import os
from pathlib import Path
from pydantic_settings import BaseSettings
from typing import List, Optional

BASE_DIR = Path(__file__).resolve().parent.parent.parent.parent  # d:\tech

class Settings(BaseSettings):
    APP_NAME: str = "AI-Powered Digital Twin Framework for Land Use Change in Disaster-Affected Regions"
    APP_ENV: str = "development"
    DEBUG: bool = True
    API_V1_STR: str = "/api/v1"
    
    # Server settings
    HOST: str = "0.0.0.0"
    PORT: int = 8000
    
    # Database
    DATABASE_URL: str = f"sqlite:///{BASE_DIR / 'data' / 'digital_twin.db'}"
    
    # Storage directories
    BASE_DIR: Path = BASE_DIR
    UPLOAD_DIR: Path = BASE_DIR / "data" / "uploads"
    PROCESSED_DIR: Path = BASE_DIR / "data" / "processed"
    SAMPLES_DIR: Path = BASE_DIR / "data" / "samples"
    MODELS_DIR: Path = BASE_DIR / "models"
    DOCS_DIR: Path = BASE_DIR / "docs"
    
    # CORS
    CORS_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:3000",
        "*"
    ]
    
    # External API keys & Credentials (Optional with offline fallback)
    NASA_EARTHDATA_TOKEN: Optional[str] = None
    COPERNICUS_CLIENT_ID: Optional[str] = None
    COPERNICUS_CLIENT_SECRET: Optional[str] = None
    CDSE_AUTH_URL: str = "https://identity.dataspace.copernicus.eu/auth/realms/CDSE/protocol/openid-connect/token"
    CDSE_CATALOG_URL: str = "https://catalogue.dataspace.copernicus.eu/odata/v1/Products"
    CDSE_STAC_URL: str = "https://catalogue.dataspace.copernicus.eu/stac"
    OPENWEATHER_API_KEY: Optional[str] = None
    GOOGLE_MAPS_API_KEY: Optional[str] = None
    IMD_API_KEY: Optional[str] = None
    GEMINI_API_KEY: Optional[str] = None
    OPENAI_API_KEY: Optional[str] = None
    
    # JWT & Authentication
    JWT_SECRET_KEY: str = "disaster-twin-jwt-secret-key-india-geospatial-2026-secure"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 hours
    
    # System Administration & Demo
    ADMIN_USER_EMAIL: str = "admin@disastertwin.gov.in"
    DEMO_MODE: bool = True
    DATA_RETENTION_DAYS: int = 365
    
    # TTS Settings
    TTS_PROVIDER: str = "gtts_fallback"
    
    # Geography boundary storage
    GEOGRAPHY_DIR: Path = BASE_DIR / "data" / "geography"
    
    class Config:
        env_file = ".env"
        extra = "allow"

settings = Settings()

# Ensure directories exist
for p in [settings.UPLOAD_DIR, settings.PROCESSED_DIR, settings.SAMPLES_DIR, settings.MODELS_DIR, settings.GEOGRAPHY_DIR]:
    p.mkdir(parents=True, exist_ok=True)

