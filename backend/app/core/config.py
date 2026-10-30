from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "GeoPlus AI"
    API_V1_STR: str = "/api/v1"
    
    # Supabase IPv4 Pooler Session connection URI
    DATABASE_URL: str = "postgresql+psycopg://postgres.sqyeyjtfkzuuisibqmhe:GeoPulse_ai@aws-0-eu-north-1.pooler.supabase.com:5432/postgres"
    
    OPEN_METEO_BASE_URL: str = "https://api.open-meteo.com/v1/forecast"
    
    class Config:
        env_file = ".env"
        extra = "ignore"

settings = Settings()