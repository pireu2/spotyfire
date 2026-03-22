"""
Property routes for managing user properties/land parcels.
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete, or_
from typing import List
import uuid

from app.database import get_db
from app.db_models import Property, Geometry, SatelliteAnalysis
from app.models import PropertyCreate, PropertyUpdate, PropertyResponse, GeometryResponse, CadastralLookupRequest, CadastralLookupResponse
from app.services.auth import get_current_user, NeonAuthUser
from app.services.ancpi import fetch_cadastral_data

router = APIRouter(prefix="/api/properties", tags=["Properties"])


@router.post("/cadastral-lookup", response_model=CadastralLookupResponse)
async def lookup_cadastral(
    data: CadastralLookupRequest,
    user: NeonAuthUser = Depends(get_current_user),
):
    """
    Lookup cadastral data from ANCPI by cadastral number.
    Returns geometry and location information.
    """
    result = await fetch_cadastral_data(data.numar_cadastral)
    
    if not result:
        raise HTTPException(status_code=404, detail="Numărul cadastral nu a fost găsit")
    
    return CadastralLookupResponse(
        numar_cadastral=result.numar_cadastral,
        geometry_type=result.geometry_type,
        coordinates=result.coordinates,
        center_lat=result.center_lat,
        center_lng=result.center_lng,
        area_ha=result.area_ha,
        locality=result.locality,
        county=result.county,
    )


def geometry_to_response(geometry: Geometry) -> GeometryResponse:
    return GeometryResponse(
        id=str(geometry.id),
        type=geometry.type,
        coordinates=geometry.coordinates,
        created_at=geometry.created_at,
    )


def property_to_response(prop: Property) -> PropertyResponse:
    return PropertyResponse(
        id=str(prop.id),
        user_id=prop.user_id,
        name=prop.name,
        geometry=geometry_to_response(prop.geometry),
        crop_type=prop.crop_type,
        area_ha=prop.area_ha,
        center_lat=prop.center_lat,
        center_lng=prop.center_lng,
        estimated_value=prop.estimated_value,
        risk_score=prop.risk_score,
        assigned_user_id=prop.assigned_user_id,
        last_analysed_at=prop.last_analysed_at,
        created_at=prop.created_at,
        updated_at=prop.updated_at,
    )


@router.get("", response_model=List[PropertyResponse])
async def get_properties(
    user: NeonAuthUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Property).where(
            or_(
                Property.user_id == user.id,
                Property.assigned_user_id == user.id
            )
        )
    )
    properties = result.scalars().all()
    return [property_to_response(p) for p in properties]


@router.get("/{property_id}", response_model=PropertyResponse)
async def get_property(
    property_id: str,
    user: NeonAuthUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Property).where(
            Property.id == uuid.UUID(property_id),
            or_(
                Property.user_id == user.id,
                Property.assigned_user_id == user.id
            )
        )
    )
    prop = result.scalar_one_or_none()
    
    if not prop:
        raise HTTPException(status_code=404, detail="Property not found")
    
    return property_to_response(prop)


@router.post("", response_model=PropertyResponse)
async def create_property(
    data: PropertyCreate,
    user: NeonAuthUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    coordinates_json = [[{"lat": c.lat, "lng": c.lng} for c in ring] for ring in data.geometry.coordinates]
    
    geometry = Geometry(
        type=data.geometry.type,
        coordinates=coordinates_json,
    )
    db.add(geometry)
    await db.flush()
    
    prop = Property(
        user_id=user.id,
        name=data.name,
        geometry_id=geometry.id,
        crop_type=data.crop_type,
        area_ha=data.area_ha,
        center_lat=data.center_lat,
        center_lng=data.center_lng,
        estimated_value=data.estimated_value,
        assigned_user_id=data.assigned_user_id,
    )
    db.add(prop)
    await db.commit()
    await db.refresh(prop)
    
    return property_to_response(prop)


@router.put("/{property_id}", response_model=PropertyResponse)
async def update_property(
    property_id: str,
    data: PropertyUpdate,
    user: NeonAuthUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Property).where(
            Property.id == uuid.UUID(property_id),
            Property.user_id == user.id
        )
    )
    prop = result.scalar_one_or_none()
    
    if not prop:
        raise HTTPException(status_code=404, detail="Property not found")
    
    if data.name is not None:
        prop.name = data.name
    if data.crop_type is not None:
        prop.crop_type = data.crop_type
    if data.area_ha is not None:
        prop.area_ha = data.area_ha
    if data.estimated_value is not None:
        prop.estimated_value = data.estimated_value
    
    await db.commit()
    await db.refresh(prop)
    
    return property_to_response(prop)


@router.delete("/{property_id}")
async def delete_property(
    property_id: str,
    user: NeonAuthUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Property).where(
            Property.id == uuid.UUID(property_id),
            Property.user_id == user.id
        )
    )
    prop = result.scalar_one_or_none()
    
    if not prop:
        raise HTTPException(status_code=404, detail="Property not found")
    
    await db.execute(
        delete(SatelliteAnalysis).where(SatelliteAnalysis.property_id == uuid.UUID(property_id))
    )
    
    geometry_id = prop.geometry_id
    await db.delete(prop)
    await db.flush()
    
    geometry_result = await db.execute(select(Geometry).where(Geometry.id == geometry_id))
    geometry = geometry_result.scalar_one_or_none()
    if geometry:
        await db.delete(geometry)
    
    await db.commit()
    
    return {"message": "Property deleted successfully"}
