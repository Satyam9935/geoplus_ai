from fastapi import APIRouter, Query, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Any
from datetime import datetime, timedelta, timezone
import numpy as np
import torch

from app.services.ingestion.weather import WeatherReanalysisService
from app.services.ml.forecaster import BiLSTMStressForecaster
from app.services.ml.ensemble import EnvironmentalRiskEnsemble

router = APIRouter()
weather_service = WeatherReanalysisService()
forecaster = BiLSTMStressForecaster()
forecaster.eval()
ensemble = EnvironmentalRiskEnsemble()

class TrajectoryPoint(BaseModel):
    date: str
    predicted_ndvi: float
    confidence_upper: float
    confidence_lower: float

class ForecastResponse(BaseModel):
    latitude: float
    longitude: float
    current_metrics: Dict[str, float]
    risk_assessment: Dict[str, Any]
    trajectory_14d: List[TrajectoryPoint]

@router.get("/forecast", response_model=ForecastResponse)
async def get_forecast(
    lat: float = Query(..., ge=-90.0, le=90.0),
    lon: float = Query(..., ge=-180.0, le=180.0)
):
    try:
        meteo_data = await weather_service.fetch_historical_and_forecast(lat, lon)
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Meteo Ingestion Error: {str(e)}")

    history = meteo_data.iloc[:30]

    synth_input = np.stack([
        np.linspace(0.65, 0.58, 30),
        np.linspace(0.40, 0.32, 30),
        np.linspace(0.50, 0.44, 30),
        history["temperature_2m"].values[-30:],
        history["precipitation"].values[-30:],
        history["soil_moisture_0_to_7cm"].values[-30:]
    ], axis=1)

    tensor_input = torch.tensor(synth_input, dtype=torch.float32).unsqueeze(0)

    with torch.no_grad():
        mu, sigma = forecaster(tensor_input)
        mu_vals = mu.squeeze().numpy()
        sigma_vals = sigma.squeeze().numpy()

    cur_ndvi = float(synth_input[-1, 0])
    delta_ndvi = float(mu_vals[-1] - cur_ndvi)

    risk = ensemble.calculate_risk(
        current_ndvi=cur_ndvi,
        rolling_precip=float(history["precipitation"].sum()),
        mean_temperature=float(history["temperature_2m"].mean()),
        soil_moisture=float(history["soil_moisture_0_to_7cm"].iloc[-1]),
        forecast_delta_ndvi=delta_ndvi
    )

    trajectory = []
    base_time = datetime.now(timezone.utc)
    for i in range(14):
        target_date = base_time + timedelta(days=i + 1)
        mean_pred = float(mu_vals[i])
        spread = float(sigma_vals[i])
        trajectory.append(
            TrajectoryPoint(
                date=target_date.strftime("%Y-%m-%d"),
                predicted_ndvi=round(mean_pred, 3),
                confidence_upper=round(mean_pred + 1.96 * spread, 3),
                confidence_lower=round(mean_pred - 1.96 * spread, 3)
            )
        )

    return ForecastResponse(
        latitude=lat,
        longitude=lon,
        current_metrics={
            "ndvi": cur_ndvi,
            "soil_moisture_pct": float(history["soil_moisture_0_to_7cm"].iloc[-1] * 100),
            "temperature_celsius": float(history["temperature_2m"].iloc[-1])
        },
        risk_assessment=risk,
        trajectory_14d=trajectory
    )