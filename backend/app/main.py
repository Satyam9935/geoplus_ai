from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.v1.endpoints import forecast, zones
from app.core.config import settings

app = FastAPI(
    title=settings.PROJECT_NAME,
    version="1.0.0",
    docs_url="/docs",
    openapi_url="/api/v1/openapi.json"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(forecast.router, prefix=settings.API_V1_STR, tags=["Forecast"])
app.include_router(zones.router, prefix=settings.API_V1_STR, tags=["Zones"])

@app.get("/health")
def health_check():
    return {"status": "ok", "service": "GeoPlus AI Engine"}