import numpy as np
import xgboost as xgb
from typing import Dict, Any

class EnvironmentalRiskEnsemble:
    def __init__(self):
        self.booster = xgb.XGBClassifier(
            n_estimators=50,
            max_depth=3,
            learning_rate=0.05,
            objective="binary:logistic"
        )
        X_dummy = np.random.rand(100, 5)
        y_dummy = ((X_dummy[:, 0] < 0.4) & (X_dummy[:, 3] < 0.3)).astype(int)
        self.booster.fit(X_dummy, y_dummy)

    def calculate_risk(
        self,
        current_ndvi: float,
        rolling_precip: float,
        mean_temperature: float,
        soil_moisture: float,
        forecast_delta_ndvi: float
    ) -> Dict[str, Any]:
        features = np.array([[
            current_ndvi,
            rolling_precip,
            mean_temperature,
            soil_moisture,
            forecast_delta_ndvi
        ]])

        prob = float(self.booster.predict_proba(features)[0][1]) * 100.0

        if prob < 30.0:
            tier, action = "Low", "Nominal conditions. Baseline monitoring active."
        elif prob < 60.0:
            tier, action = "Moderate", "Soil drying detected. Field inspection recommended."
        elif prob < 80.0:
            tier, action = "High", "Critical evapotranspiration. Schedule irrigation within 48h."
        else:
            tier, action = "Severe", "Acute crop stress warning! Emergency irrigation required."

        return {
            "risk_probability": round(prob, 1),
            "tier": tier,
            "recommended_action": action
        }