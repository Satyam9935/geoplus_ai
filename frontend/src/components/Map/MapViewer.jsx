import React, { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "@geoman-io/leaflet-geoman-free";
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
});

function GeomanControls({ onPolygonCreated }) {
  const map = useMap();

  useEffect(() => {
    if (!map.pm) return;

    // Add Geoman drawing controls to map
    map.pm.addControls({
      position: "topleft",
      drawMarker: false,
      drawCircleMarker: false,
      drawPolyline: false,
      drawRectangle: true,
      drawPolygon: true,
      drawCircle: false,
      editMode: true,
      dragMode: false,
      cutPolygon: false,
      removalMode: true,
    });

    map.pm.setPathOptions({
      color: "#10b981",
      fillColor: "#10b981",
      fillOpacity: 0.25,
      weight: 2,
    });

    const handleCreate = (e) => {
      const layer = e.layer;
      const geojson = layer.toGeoJSON();
      if (onPolygonCreated) {
        onPolygonCreated(geojson.geometry);
      }
    };

    map.on("pm:create", handleCreate);

    return () => {
      map.off("pm:create", handleCreate);
      map.pm.removeControls();
    };
  }, [map, onPolygonCreated]);

  return null;
}

function LocationMarker({ selectedPos, onSelectLocation }) {
  useMapEvents({
    click(e) {
      onSelectLocation(e.latlng.lat, e.latlng.lng);
    },
  });

  return selectedPos === null ? null : (
    <Marker position={selectedPos}>
      <Popup>
        Target Coordinates:<br />
        <b>Lat:</b> {selectedPos[0].toFixed(4)}<br />
        <b>Lon:</b> {selectedPos[1].toFixed(4)}
      </Popup>
    </Marker>
  );
}

export default function MapViewer({ selectedPos, onSelectLocation, onPolygonCreated }) {
  const defaultCenter = [26.8467, 80.9462];

  return (
    <div style={{ height: "480px", width: "100%", borderRadius: "12px", overflow: "hidden", border: "1px solid #334155" }}>
      <MapContainer center={defaultCenter} zoom={11} scrollWheelZoom={true}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <LocationMarker selectedPos={selectedPos} onSelectLocation={onSelectLocation} />
        <GeomanControls onPolygonCreated={onPolygonCreated} />
      </MapContainer>
    </div>
  );
}