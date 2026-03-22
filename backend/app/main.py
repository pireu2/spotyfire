"""
SpotyFire Backend - FastAPI Entry Point
Satellite-powered agricultural insurance claims processing.
"""
from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from datetime import datetime, timedelta
import os

from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.models import (
    AnalyzeRequest, AnalyzeResponse,
    ChatRequest, ChatResponse,
    ReportRequest, ReportResponse
)
from app.data.mocks import DEMO_MODE, MOCK_ANALYSIS_RESPONSE, MOCK_CHAT_CONTEXT
from app.services.ai_agent import chat_with_agent
from app.database import init_db, get_db, AsyncSessionLocal
from app.db_models import Property, SatelliteAnalysis
from app.routes.user import router as user_router
from app.routes.property import router as property_router
from app.routes.satellite import router as satellite_router
from app.routes.alerts import router as alerts_router
from app.services.auth import get_current_user, NeonAuthUser
import app.db_models


@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()

    if DEMO_MODE and AsyncSessionLocal:
        async with AsyncSessionLocal() as session:
            properties_result = await session.execute(select(Property))
            properties = properties_result.scalars().all()

            now = datetime.utcnow()
            for prop in properties:
                existing_result = await session.execute(
                    select(SatelliteAnalysis.id).where(SatelliteAnalysis.property_id == prop.id).limit(1)
                )
                if existing_result.scalar_one_or_none():
                    continue

                total_area = float(prop.area_ha or 100.0)
                damage_percent = 22.0
                damaged_area = round(total_area * damage_percent / 100.0, 4)
                estimated_cost = round(damaged_area * 5000.0, 2)

                seeded = SatelliteAnalysis(
                    property_id=prop.id,
                    analysis_type="demo_seed",
                    date_range_start=(now - timedelta(days=30)).date(),
                    date_range_end=(now - timedelta(days=7)).date(),
                    damage_percent=damage_percent,
                    damaged_area_ha=damaged_area,
                    total_area_ha=total_area,
                    estimated_cost=estimated_cost,
                    ndvi_before=0.64,
                    ndvi_after=0.47,
                    burn_severity=0.29,
                    overlay_image_b64=None,
                    overlay_before_b64=None,
                    overlay_after_b64=None,
                    fire_points=None,
                )
                session.add(seeded)

            await session.commit()

    yield


app = FastAPI(
    title="SpotyFire API",
    description="Satellite-powered agricultural insurance claims processing",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

os.makedirs("static", exist_ok=True)
app.mount("/static", StaticFiles(directory="static"), name="static")

app.include_router(user_router)
app.include_router(property_router)
app.include_router(satellite_router, prefix="/api", tags=["satellite"])
app.include_router(alerts_router)


@app.get("/")
async def root():
    """Health check endpoint."""
    return {
        "status": "online",
        "service": "SpotyFire API",
        "version": "1.0.0",
        "demo_mode": DEMO_MODE
    }


@app.get("/health")
async def health_check():
    """Detailed health check."""
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "demo_mode": DEMO_MODE
    }


# === Analysis Endpoint ===
@app.post("/api/analyze", response_model=AnalyzeResponse)
async def analyze_damage(request: AnalyzeRequest):
    """
    Analyze satellite imagery to detect flood/fire damage.
    
    In DEMO_MODE, returns pre-calculated data for the Galați flood event.
    In production, fetches real Sentinel-1 data and calculates damage.
    """
    if DEMO_MODE:
        # Return mock data for demo/presentation
        return AnalyzeResponse(**MOCK_ANALYSIS_RESPONSE)
    
    # TODO: Implement real satellite analysis
    # This would call the satellite service to:
    # 1. Fetch Sentinel-1 image from 2 weeks ago (before)
    # 2. Fetch Sentinel-1 image from yesterday (after)
    # 3. Calculate pixel difference (change detection)
    # 4. Determine damaged_area_ha and financial_loss
    
    raise HTTPException(
        status_code=501,
        detail="Real satellite analysis not yet implemented. Enable DEMO_MODE."
    )


# === Chat Endpoint ===
@app.post("/api/chat", response_model=ChatResponse)
async def chat(
    request: ChatRequest,
    user: NeonAuthUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Chat with the AI Claims Adjuster (SpotyBot).
    
    Provides context-aware assistance for insurance claims
    using satellite damage analysis data.
    
    Requires authentication.
    """
    from app.db_models import SatelliteAnalysis, Alert
    from datetime import datetime, timedelta
    from sqlalchemy import and_
    from app.routes.alerts import calculate_distance_km
    
    context = request.context or {}
    
    if DEMO_MODE and not request.context:
        context = MOCK_CHAT_CONTEXT.copy()
    
    result = await db.execute(
        select(Property).where(Property.user_id == user.id)
    )
    properties = result.scalars().all()
    
    if properties:
        context['properties'] = [
            {
                'name': p.name,
                'crop_type': p.crop_type,
                'area_ha': p.area_ha,
                'center_lat': p.center_lat,
                'center_lng': p.center_lng,
                'estimated_value': p.estimated_value,
                'risk_score': p.risk_score,
                'last_analysed_at': p.last_analysed_at.isoformat() if p.last_analysed_at else None,
            }
            for p in properties
        ]
        
        analyses_result = await db.execute(
            select(SatelliteAnalysis)
            .join(Property)
            .where(Property.user_id == user.id)
            .order_by(SatelliteAnalysis.created_at.desc())
            .limit(5)
        )
        analyses = analyses_result.scalars().all()
        
        if analyses:
            context['analyses'] = [
                {
                    'property_name': next((p.name for p in properties if str(p.id) == str(a.property_id)), 'Unknown'),
                    'date_range_start': a.date_range_start.isoformat() if a.date_range_start else None,
                    'date_range_end': a.date_range_end.isoformat() if a.date_range_end else None,
                    'damage_percent': a.damage_percent,
                    'damaged_area_ha': a.damaged_area_ha,
                    'estimated_cost': a.estimated_cost,
                    'ndvi_before': a.ndvi_before,
                    'ndvi_after': a.ndvi_after,
                    'analysis_type': a.analysis_type,
                    'created_at': a.created_at.isoformat() if a.created_at else None,
                }
                for a in analyses
            ]
        
        total_reports = len(analyses)
        month_ago = datetime.utcnow() - timedelta(days=30)
        reports_this_month = len([a for a in analyses if a.created_at and a.created_at >= month_ago])
        total_damage_ha = sum(a.damaged_area_ha or 0 for a in analyses)
        total_loss = sum(a.estimated_cost or 0 for a in analyses)
        avg_damage = sum(a.damage_percent or 0 for a in analyses) / len(analyses) if analyses else 0
        
        context['report_stats'] = {
            'total_reports': total_reports,
            'reports_this_month': reports_this_month,
            'total_damage_ha': total_damage_ha,
            'total_loss': total_loss,
            'avg_damage_percent': avg_damage
        }
        
        alerts_result = await db.execute(
            select(Alert).where(Alert.is_active == 1).order_by(Alert.created_at.desc())
        )
        all_alerts = alerts_result.scalars().all()
        
        nearby_alerts = []
        for alert in all_alerts:
            if alert.lat is None or alert.lng is None:
                continue
            
            min_distance = None
            closest_property = None
            
            for prop in properties:
                distance = calculate_distance_km(prop.center_lat, prop.center_lng, alert.lat, alert.lng)
                if min_distance is None or distance < min_distance:
                    min_distance = distance
                    closest_property = prop
            
            if min_distance is not None and min_distance <= 100:
                nearby_alerts.append({
                    'id': str(alert.id),
                    'type': alert.type.value,
                    'severity': alert.severity.value,
                    'message': alert.message,
                    'sector': alert.sector,
                    'lat': alert.lat,
                    'lng': alert.lng,
                    'radius_km': alert.radius_km,
                    'distance_km': round(min_distance, 1),
                    'nearest_property': closest_property.name,
                    'created_at': alert.created_at.isoformat() if alert.created_at else None
                })
        
        nearby_alerts.sort(key=lambda x: x['distance_km'])
        
        if nearby_alerts:
            context['alerts'] = nearby_alerts[:10]
    
    result = await chat_with_agent(
        message=request.message,
        context=context,
        conversation_history=request.conversation_history
    )
    
    return ChatResponse(**result)


# === Report Generation Endpoint ===
@app.post("/api/generate-report", response_model=ReportResponse)
async def generate_report(request: ReportRequest):
    """
    Generate a formal insurance claim PDF.
    
    Creates a downloadable Notice of Loss document with:
    - Map/damage visualization
    - Damage statistics
    - Estimated payout
    - User details
    """
    # TODO: Implement PDF generation service
    # This would call pdf_maker service to generate the document
    
    raise HTTPException(
        status_code=501,
        detail="PDF generation not yet implemented."
    )


# === Development Server ===
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=True
    )
