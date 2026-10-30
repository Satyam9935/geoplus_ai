import httpx
import pandas as pd
from app.core.config import settings

class WeatherReanalysisService:
    def __init__(self):
        self.base_url = settings.OPEN_METEO_BASE_URL

    async def fetch_historical_and_forecast(
        self,
        latitude: float,
        longitude: float,
        past_days: int = 30,
        forecast_days: int = 14
    ) -> pd.DataFrame:
        params = {
            "latitude": latitude,
            "longitude": longitude,
            "past_days": past_days,
            "forecast_days": forecast_days,
            "hourly": [
                "temperature_2m",
                "relative_humidity_2m",
                "precipitation",
                "soil_moisture_0_to_7cm"
            ],
            "timezone": "UTC"
        }

        async with httpx.AsyncClient() as client:
            response = await client.get(self.base_url, params=params, timeout=20.0)
            response.raise_for_status()
            data = response.json()

        hourly = data["hourly"]
        df = pd.DataFrame({
            "timestamp": pd.to_datetime(hourly["time"]),
            "temperature_2m": hourly["temperature_2m"],
            "relative_humidity_2m": hourly["relative_humidity_2m"],
            "precipitation": hourly["precipitation"],
            "soil_moisture_0_to_7cm": hourly["soil_moisture_0_to_7cm"],
        })

        daily_df = df.set_index("timestamp").resample("1D").agg({
            "temperature_2m": "mean",
            "relative_humidity_2m": "mean",
            "precipitation": "sum",
            "soil_moisture_0_to_7cm": "mean"
        }).reset_index()

        return daily_df