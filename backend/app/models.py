"""Pydantic models for request/response schemas."""
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime


# === Cadastral Models ===
class CadastralLookupRequest(BaseModel):
    numar_cadastral: str = Field(..., description="Cadastral number to lookup")


class CadastralLookupResponse(BaseModel):
    numar_cadastral: str
    geometry_type: str
    coordinates: list
    center_lat: float
    center_lng: float
    area_ha: float
    locality: str
    county: str


# === Geometry & Property Models ===
class CoordinatePoint(BaseModel):
    lat: float
    lng: float


class GeometryCreate(BaseModel):
    type: str = Field(default="Polygon", description="Geometry type: Polygon, MultiPolygon, Point")
    coordinates: List[List[CoordinatePoint]] = Field(..., description="List of coordinate rings")


class GeometryResponse(BaseModel):
    id: str
    type: str
    coordinates: list
    created_at: datetime

    class Config:
        from_attributes = True


class PropertyCreate(BaseModel):
    name: str = Field(..., description="Property name")
    geometry: GeometryCreate = Field(..., description="Property boundary geometry")
    crop_type: Optional[str] = Field(default=None, description="Type of crop grown")
    area_ha: Optional[float] = Field(default=None, description="Area in hectares")
    center_lat: float = Field(..., description="Center latitude for map zoom")
    center_lng: float = Field(..., description="Center longitude for map zoom")
    estimated_value: Optional[float] = Field(default=None, description="Estimated property value in EUR")
    assigned_user_id: Optional[str] = Field(default=None, description="Stack User ID of the insured individual")


class PropertyUpdate(BaseModel):
    name: Optional[str] = None
    crop_type: Optional[str] = None
    area_ha: Optional[float] = None
    estimated_value: Optional[float] = None


class PropertyResponse(BaseModel):
    id: str
    user_id: str
    name: str
    geometry: GeometryResponse
    crop_type: Optional[str]
    area_ha: Optional[float]
    center_lat: float
    center_lng: float
    estimated_value: Optional[float]
    risk_score: Optional[float]
    assigned_user_id: Optional[str]
    last_analysed_at: Optional[datetime]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# === Analysis Models ===
class AnalyzeRequest(BaseModel):
    lat: float = Field(..., description="Latitude of the affected area")
    lng: float = Field(..., description="Longitude of the affected area")
    crop_type: str = Field(..., description="Type of crop (e.g., 'wheat', 'corn')")
    value_per_ha: float = Field(..., description="Value per hectare in EUR")


class AnalyzeResponse(BaseModel):
    claim_id: str
    location: dict
    crop_type: str
    total_area_ha: float
    damaged_area_ha: float
    damage_percent: float
    value_per_ha: float
    financial_loss: float
    flood_mask_url: Optional[str] = None
    analysis_date: str
    disaster_type: str = "flood"


class ChatRequest(BaseModel):
    message: str = Field(..., description="User message to the AI assistant")
    context: Optional[dict] = Field(
        default=None, 
        description="Context data from satellite analysis (damage stats, etc.)"
    )
    conversation_history: Optional[list] = Field(
        default=None,
        description="Previous messages in the conversation"
    )


class ChatResponse(BaseModel):
    response: str
    suggested_actions: Optional[list[str]] = None
    claim_summary: Optional[dict] = None


class UserDetails(BaseModel):
    full_name: str
    address: str
    phone: Optional[str] = None
    email: Optional[str] = None
    policy_number: Optional[str] = None
    bank_iban: Optional[str] = None


class ReportRequest(BaseModel):
    claim_id: str
    user_details: UserDetails
    analysis_data: Optional[dict] = None


class ReportResponse(BaseModel):
    download_url: str
    filename: str
    generated_at: str


class AlertResponse(BaseModel):
    id: str
    type: str
    severity: str
    message: str
    sector: str
    lat: Optional[float]
    lng: Optional[float]
    radius_km: Optional[float]
    property_id: Optional[str]
    is_active: bool
    created_at: datetime
    updated_at: Optional[datetime] = None
    distance_km: Optional[float] = None
    nearest_property: Optional[str] = None

    class Config:
        from_attributes = True


class AlertsListResponse(BaseModel):
    alerts: List[AlertResponse]
    total: int

