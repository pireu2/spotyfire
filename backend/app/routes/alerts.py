from fastapi import APIRouter, HTTPException, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, or_
from typing import Optional, List
from datetime import datetime, timedelta
import math

from app.database import get_db
from app.db_models import Alert, AlertType, AlertSeverity, Property
from app.models import AlertResponse, AlertsListResponse
from app.services.auth import get_current_user, NeonAuthUser


router = APIRouter(prefix="/api/alerts", tags=["alerts"])


def calculate_distance_km(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
    R = 6371.0
    lat1_rad = math.radians(lat1)
    lat2_rad = math.radians(lat2)
    delta_lat = math.radians(lat2 - lat1)
    delta_lng = math.radians(lng2 - lng1)
    
    a = math.sin(delta_lat / 2)**2 + math.cos(lat1_rad) * math.cos(lat2_rad) * math.sin(delta_lng / 2)**2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    
    distance = R * c
    return distance


@router.get("", response_model=AlertsListResponse)
async def get_alerts(
    type: Optional[str] = Query(None),
    severity: Optional[str] = Query(None),
    active_only: bool = Query(True),
    limit: int = Query(100, le=1000),
    db: AsyncSession = Depends(get_db)
):
    conditions = []
    
    if active_only:
        conditions.append(Alert.is_active == 1)
    
    if type and type != "all":
        conditions.append(Alert.type == type)
    
    if severity:
        conditions.append(Alert.severity == severity)
    
    query = select(Alert).where(and_(*conditions)).order_by(Alert.created_at.desc()).limit(limit)
    
    result = await db.execute(query)
    alerts = result.scalars().all()
    
    return AlertsListResponse(
        alerts=[
            AlertResponse(
                id=str(a.id),
                type=a.type.value,
                severity=a.severity.value,
                message=a.message,
                sector=a.sector,
                lat=a.lat,
                lng=a.lng,
                radius_km=a.radius_km,
                property_id=str(a.property_id) if a.property_id else None,
                is_active=bool(a.is_active),
                created_at=a.created_at,
                updated_at=a.updated_at
            )
            for a in alerts
        ],
        total=len(alerts)
    )


@router.get("/near", response_model=AlertsListResponse)
async def get_alerts_near_properties(
    radius_km: float = Query(50.0, ge=1.0, le=500.0),
    type: Optional[str] = Query(None),
    severity: Optional[str] = Query(None),
    active_only: bool = Query(True),
    db: AsyncSession = Depends(get_db),
    user: NeonAuthUser = Depends(get_current_user)
):
    user_id = user.id
    
    props_result = await db.execute(
        select(Property).where(
            or_(
                Property.user_id == user_id,
                Property.assigned_user_id == user_id
            )
        )
    )
    user_properties = props_result.scalars().all()
    
    if not user_properties:
        return AlertsListResponse(alerts=[], total=0)
    
    conditions = []
    if active_only:
        conditions.append(Alert.is_active == 1)
    if type and type != "all":
        conditions.append(Alert.type == type)
    if severity:
        conditions.append(Alert.severity == severity)
    
    query = select(Alert).where(and_(*conditions))
    result = await db.execute(query)
    all_alerts = result.scalars().all()
    
    nearby_alerts = []
    for alert in all_alerts:
        if alert.lat is None or alert.lng is None:
            continue
        
        min_distance = None
        closest_property = None
        
        for prop in user_properties:
            distance = calculate_distance_km(prop.center_lat, prop.center_lng, alert.lat, alert.lng)
            if min_distance is None or distance < min_distance:
                min_distance = distance
                closest_property = prop
        
        if min_distance is not None and min_distance <= radius_km:
            nearby_alerts.append({
                "alert": alert,
                "distance_km": round(min_distance, 2),
                "property_name": closest_property.name
            })
    
    nearby_alerts.sort(key=lambda x: x["distance_km"])
    
    return AlertsListResponse(
        alerts=[
            AlertResponse(
                id=str(item["alert"].id),
                type=item["alert"].type.value,
                severity=item["alert"].severity.value,
                message=item["alert"].message,
                sector=item["alert"].sector,
                lat=item["alert"].lat,
                lng=item["alert"].lng,
                radius_km=item["alert"].radius_km,
                property_id=str(item["alert"].property_id) if item["alert"].property_id else None,
                is_active=bool(item["alert"].is_active),
                created_at=item["alert"].created_at,
                updated_at=item["alert"].updated_at,
                distance_km=item["distance_km"],
                nearest_property=item["property_name"]
            )
            for item in nearby_alerts
        ],
        total=len(nearby_alerts)
    )
