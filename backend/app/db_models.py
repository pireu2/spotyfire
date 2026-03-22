"""
Database models for SpotyFire.
Neon Auth automatically creates neon_auth.users_sync table for user data.
We only need to create our own tables (claims, etc.) that reference users.
"""
from sqlalchemy import Column, String, Float, DateTime, Text, JSON, Integer, ForeignKey, Enum, Date
from sqlalchemy.dialects.postgresql import UUID, ARRAY
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid
import enum

from app.database import Base


class GeometryType(str, enum.Enum):
    POLYGON = "Polygon"
    MULTI_POLYGON = "MultiPolygon"
    POINT = "Point"


class Geometry(Base):
    __tablename__ = "geometries"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    type = Column(String(50), nullable=False, default=GeometryType.POLYGON.value)
    coordinates = Column(JSON, nullable=False)
    
    created_at = Column(DateTime, default=datetime.utcnow)


class Property(Base):
    __tablename__ = "properties"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(String(255), nullable=False, index=True)
    name = Column(String(255), nullable=False)
    
    geometry_id = Column(UUID(as_uuid=True), ForeignKey("geometries.id"), nullable=False)
    geometry = relationship("Geometry", backref="properties", lazy="joined")
    
    crop_type = Column(String(100), nullable=True)
    area_ha = Column(Float, nullable=True)
    
    center_lat = Column(Float, nullable=False)
    center_lng = Column(Float, nullable=False)
    
    estimated_value = Column(Float, nullable=True)
    risk_score = Column(Float, nullable=True, default=0.0)
    
    assigned_user_id = Column(String(255), nullable=True, index=True)
    
    last_analysed_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class Claim(Base):
    __tablename__ = "claims"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    claim_id = Column(String(50), unique=True, index=True)
    user_id = Column(String(255), nullable=False, index=True)
    
    lat = Column(Float, nullable=False)
    lng = Column(Float, nullable=False)
    location_name = Column(String(255), nullable=True)
    
    crop_type = Column(String(100), nullable=False)
    total_area_ha = Column(Float, nullable=False)
    damaged_area_ha = Column(Float, nullable=False)
    damage_percent = Column(Float, nullable=False)
    value_per_ha = Column(Float, nullable=False)
    financial_loss = Column(Float, nullable=False)
    
    disaster_type = Column(String(50), default="flood")
    status = Column(String(50), default="pending")
    
    analysis_data = Column(JSON, nullable=True)
    satellite_info = Column(JSON, nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class SatelliteAnalysis(Base):
    __tablename__ = "satellite_analyses"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    property_id = Column(UUID(as_uuid=True), ForeignKey("properties.id", ondelete="CASCADE"), nullable=False)
    property = relationship("Property", backref="analyses", passive_deletes=True)
    
    analysis_type = Column(String(50), nullable=False)
    date_range_start = Column(Date, nullable=False)
    date_range_end = Column(Date, nullable=False)
    
    damage_percent = Column(Float, nullable=True)
    damaged_area_ha = Column(Float, nullable=True)
    total_area_ha = Column(Float, nullable=True)
    estimated_cost = Column(Float, nullable=True)
    
    ndvi_before = Column(Float, nullable=True)
    ndvi_after = Column(Float, nullable=True)
    burn_severity = Column(Float, nullable=True)
    
    overlay_image_b64 = Column(Text, nullable=True)
    overlay_before_b64 = Column(Text, nullable=True)
    overlay_after_b64 = Column(Text, nullable=True)
    fire_points = Column(JSON, nullable=True)
    
    analysis_metadata = Column(JSON, nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow)


class AlertType(str, enum.Enum):
    FIRE = "FIRE"
    FLOOD = "FLOOD"
    NDVI = "NDVI"
    WARNING = "WARNING"


class AlertSeverity(str, enum.Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"


class Alert(Base):
    __tablename__ = "alerts"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    type = Column(Enum(AlertType), nullable=False)
    severity = Column(Enum(AlertSeverity), nullable=False)
    
    message = Column(String(500), nullable=False)
    sector = Column(String(255), nullable=False)
    
    lat = Column(Float, nullable=True)
    lng = Column(Float, nullable=True)
    radius_km = Column(Float, nullable=True, default=10.0)
    
    property_id = Column(UUID(as_uuid=True), ForeignKey("properties.id", ondelete="CASCADE"), nullable=True)
    property = relationship("Property", backref="alerts", passive_deletes=True)
    
    is_active = Column(Integer, default=1)
    dismissed_at = Column(DateTime, nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class InsuredUser(Base):
    __tablename__ = "insured_users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    company_id = Column(String(255), nullable=False)
    stack_user_id = Column(String(255), unique=True, nullable=False)
    name = Column(String(255), nullable=False)
    email = Column(String(255), unique=True, nullable=False)
    paid_price = Column(Float, default=0.0)
    is_paid = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)