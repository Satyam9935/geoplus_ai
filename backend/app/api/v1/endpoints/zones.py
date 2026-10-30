import json
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import text
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
from app.core.database import get_db

router = APIRouter()

class ZoneCreateRequest(BaseModel):
    name: str
    crop_type: Optional[str] = "Wheat / Mustard"
    geometry: Dict[str, Any]

class ZoneResponse(BaseModel):
    id: int
    name: str
    crop_type: Optional[str]
    geometry: Dict[str, Any]

@router.post("/zones", response_model=ZoneResponse)
def create_zone(payload: ZoneCreateRequest, db: Session = Depends(get_db)):
    try:
        geojson_str = json.dumps(payload.geometry)
        
        # Explicitly cast to geometry and return GeoJSON text
        sql = text("""
            INSERT INTO zones (name, crop_type, geom)
            VALUES (
                :name, 
                :crop_type, 
                ST_SetSRID(ST_GeomFromGeoJSON(:geom_json), 4326)
            )
            RETURNING id, name, crop_type, ST_AsGeoJSON(geom) AS geojson_text;
        """)
        
        row = db.execute(
            sql,
            {
                "name": payload.name,
                "crop_type": payload.crop_type,
                "geom_json": geojson_str
            }
        ).fetchone()
        
        db.commit()

        return ZoneResponse(
            id=row[0],
            name=row[1],
            crop_type=row[2],
            geometry=json.loads(row[3])
        )
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Database Insertion Error: {str(e)}")

@router.get("/zones", response_model=List[ZoneResponse])
def list_zones(db: Session = Depends(get_db)):
    try:
        sql = text("""
            SELECT id, name, crop_type, ST_AsGeoJSON(geom) AS geojson_text
            FROM zones
            ORDER BY id DESC;
        """)
        rows = db.execute(sql).fetchall()
        
        zones = []
        for r in rows:
            zones.append(ZoneResponse(
                id=r[0],
                name=r[1],
                crop_type=r[2],
                geometry=json.loads(r[3])
            ))
        return zones
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database Retrieval Error: {str(e)}")