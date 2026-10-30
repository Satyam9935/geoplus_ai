import React from "react";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";

export default function TrajectoryChart({ data }) {
  if (!data || data.length === 0) {
    return <p style={{ color: "#94a3b8" }}>No trajectory forecast available. Click on the map to evaluate.</p>;
  }

  return (
    <div style={{ width: "100%", height: 260 }}>
      <ResponsiveContainer>
        <AreaChart data={data} margin={{ top: 10, right: 20, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="ndviColor" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
              <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
          <XAxis dataKey="date" stroke="#94a3b8" fontSize={11} tickFormatter={(val) => val.slice(5)} />
          <YAxis domain={[0, 1]} stroke="#94a3b8" fontSize={11} />
          <Tooltip 
            contentStyle={{ backgroundColor: "#1e293b", borderColor: "#475569", borderRadius: "8px", color: "#f8fafc" }} 
          />
          <Area 
            type="monotone" 
            dataKey="confidence_upper" 
            stroke="#38bdf8" 
            fill="#0284c7" 
            fillOpacity={0.1} 
            name="Upper 95% CI"
          />
          <Area 
            type="monotone" 
            dataKey="predicted_ndvi" 
            stroke="#10b981" 
            strokeWidth={2} 
            fillOpacity={1} 
            fill="url(#ndviColor)" 
            name="Predicted NDVI"
          />
          <Area 
            type="monotone" 
            dataKey="confidence_lower" 
            stroke="#f43f5e" 
            fill="none" 
            strokeDasharray="4 4" 
            name="Lower 95% CI"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}