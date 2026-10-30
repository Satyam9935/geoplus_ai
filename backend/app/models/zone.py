from sqlalchemy import Column, BigInteger, String, DateTime
from geoalchemy2 import Geometry
from datetime import datetime, timezone
from app.core.database import Base

class Zone(Base):
    __tablename__ = "zones"

    id = Column(BigInteger, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    crop_type = Column(String(50), nullable=True)
    geom = Column(Geometry(geometry_type="POLYGON", srid=4326), nullable=False)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))