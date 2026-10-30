import React, { useState, useEffect } from "react";
import MapViewer from "./components/Map/MapViewer";
import TrajectoryChart from "./components/Analytics/TrajectoryChart";
import { Activity, Droplets, Thermometer, CheckCircle, AlertCircle } from "lucide-react";
import apiClient from "./api/client";

export default function App() {
  const [selectedPos, setSelectedPos] = useState([26.8467, 80.9462]);
  const [forecast, setForecast] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [zoneStatus, setZoneStatus] = useState(null);

  // Fetch forecast predictions from live Render backend
  const fetchForecast = async (lat, lon) => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiClient.get("/forecast", {
        params: { lat, lon }
      });
      setForecast(res.data);
    } catch (err) {
      setError(
        err.response?.data?.detail ||
        "Failed to reach forecast engine. The backend might be starting up from cold sleep (takes ~45s)."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchForecast(selectedPos[0], selectedPos[1]);
  }, []);

  const handleSelectLocation = (lat, lon) => {
    setSelectedPos([lat, lon]);
    fetchForecast(lat, lon);
  };

  // Persist polygon drawn in Leaflet-Geoman into Supabase PostGIS
  const handleSaveZone = async (layer) => {
    try {
      const geojson = typeof layer.toGeoJSON === "function" ? layer.toGeoJSON() : layer;
      const payload = {
        name: `Zone_${new Date().toISOString().slice(11, 19)}`,
        crop_type: "Wheat",
        geom: geojson.geometry || geojson
      };

      const res = await apiClient.post("/zones", payload);
      setZoneStatus({ type: "success", message: `Zone #${res.data?.id || ""} saved to PostGIS successfully!` });
      setTimeout(() => setZoneStatus(null), 5000);
    } catch (err) {
      console.error("Failed to save zone:", err);
      setZoneStatus({
        type: "error",
        message: err.response?.data?.detail || "Failed to persist zone to database."
      });
      setTimeout(() => setZoneStatus(null), 6000);
    }
  };

  const getTierColor = (tier) => {
    switch (tier) {
      case "Low": return "#10b981";
      case "Moderate": return "#f59e0b";
      case "High": return "#f97316";
      case "Severe": return "#ef4444";
      default: return "#94a3b8";
    }
  };

  return (
    <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "24px" }}>
      <header style={{ marginBottom: "20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h1 style={{ fontSize: "24px", fontWeight: "bold", color: "#38bdf8" }}>GeoPlus AI</h1>
          <p style={{ color: "#94a3b8", fontSize: "14px" }}>Autonomous Environmental Risk & Crop Stress Prognostics</p>
        </div>
        <div style={{ textAlign: "right", fontSize: "12px", color: "#64748b" }}>
          Active Coordinates: {selectedPos[0].toFixed(4)}, {selectedPos[1].toFixed(4)}
        </div>
      </header>

      {/* Network or Cold-Start Error Notice */}
      {error && (
        <div style={{ background: "#7f1d1d", color: "#fecaca", padding: "12px", borderRadius: "8px", marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {/* Zone Persistence Status Notice */}
      {zoneStatus && (
        <div style={{
          background: zoneStatus.type === "success" ? "#064e3b" : "#7f1d1d",
          color: zoneStatus.type === "success" ? "#a7f3d0" : "#fecaca",
          padding: "12px",
          borderRadius: "8px",
          marginBottom: "16px",
          display: "flex",
          alignItems: "center",
          gap: "8px"
        }}>
          {zoneStatus.type === "success" ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
          <span>{zoneStatus.message}</span>
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: "24px" }}>
        <div>
          <div style={{ marginBottom: "12px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "14px", fontWeight: "600", color: "#cbd5e1" }}>Interactive Field Selection</span>
            <span style={{ fontSize: "12px", color: "#64748b" }}>Click map to query / Draw to create zone</span>
          </div>
          <MapViewer 
            selectedPos={selectedPos} 
            onSelectLocation={handleSelectLocation}
            onSaveZone={handleSaveZone}
          />
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {/* Telemetry Cards */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "12px" }}>
            <div style={{ background: "#1e293b", padding: "14px", borderRadius: "8px", border: "1px solid #334155" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "#38bdf8", fontSize: "12px" }}>
                <Activity size={16} /> Baseline NDVI
              </div>
              <div style={{ fontSize: "20px", fontWeight: "bold", marginTop: "4px" }}>
                {forecast ? forecast.current_metrics?.ndvi?.toFixed(2) ?? "--" : "--"}
              </div>
            </div>

            <div style={{ background: "#1e293b", padding: "14px", borderRadius: "8px", border: "1px solid #334155" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "#60a5fa", fontSize: "12px" }}>
                <Droplets size={16} /> Soil Moisture
              </div>
              <div style={{ fontSize: "20px", fontWeight: "bold", marginTop: "4px" }}>
                {forecast ? `${forecast.current_metrics?.soil_moisture_pct?.toFixed(1) ?? "--"}%` : "--"}
              </div>
            </div>

            <div style={{ background: "#1e293b", padding: "14px", borderRadius: "8px", border: "1px solid #334155" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "#f87171", fontSize: "12px" }}>
                <Thermometer size={16} /> Temperature
              </div>
              <div style={{ fontSize: "20px", fontWeight: "bold", marginTop: "4px" }}>
                {forecast ? `${forecast.current_metrics?.temperature_celsius?.toFixed(1) ?? "--"}°C` : "--"}
              </div>
            </div>
          </div>

          {/* Risk Evaluation Box */}
          <div style={{ 
            background: "#1e293b", 
            padding: "16px", 
            borderRadius: "8px", 
            borderLeft: `4px solid ${getTierColor(forecast?.risk_assessment?.tier)}`,
            borderTop: "1px solid #334155",
            borderRight: "1px solid #334155",
            borderBottom: "1px solid #334155"
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: "14px", color: "#94a3b8" }}>Environmental Risk Tier:</span>
              <span style={{ 
                fontSize: "14px", 
                fontWeight: "bold", 
                color: getTierColor(forecast?.risk_assessment?.tier) 
              }}>
                {forecast ? `${forecast.risk_assessment?.tier} (${forecast.risk_assessment?.risk_probability}%)` : "Evaluating..."}
              </span>
            </div>
            <p style={{ marginTop: "8px", fontSize: "13px", color: "#e2e8f0" }}>
              <b>Action:</b> {forecast?.risk_assessment?.recommended_action || "Awaiting sensor inference..."}
            </p>
          </div>

          {/* 14-Day Trajectory Area */}
          <div style={{ background: "#1e293b", padding: "16px", borderRadius: "8px", border: "1px solid #334155" }}>
            <h3 style={{ fontSize: "14px", fontWeight: "600", marginBottom: "12px", color: "#cbd5e1" }}>
              14-Day BiLSTM Stress & Phenology Trajectory
            </h3>
            {loading ? (
              <p style={{ color: "#38bdf8", padding: "20px 0" }}>Running inference pipeline...</p>
            ) : (
              <TrajectoryChart data={forecast?.trajectory_14d} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}