from fastapi import APIRouter

from backend.app.api.v1.endpoints import (
    health, regions, images, analysis, rainfall,
    digital_twin, alerts, chatbot, voice, reports, jobs,
    auth, geography, satellite, events, multi_year, portal
)

api_router = APIRouter()

# Core Services & Existing Functionality
api_router.include_router(health.router, prefix="/health", tags=["Health"])
api_router.include_router(auth.router, prefix="/auth", tags=["Authentication & User Accounts"])
api_router.include_router(portal.router, prefix="/portal", tags=["User Portal & Workspaces"])
api_router.include_router(geography.router, prefix="/geography", tags=["All-India Geography & Boundaries"])
api_router.include_router(satellite.router, prefix="/satellite", tags=["Historical Satellite Data Ingestion"])
api_router.include_router(events.router, prefix="/events", tags=["Historical Flood & Disaster Events"])
api_router.include_router(multi_year.router, prefix="/multi-year", tags=["Multi-Year Land-Change Analysis"])
api_router.include_router(regions.router, prefix="/regions", tags=["Regions"])
api_router.include_router(images.router, prefix="/images", tags=["Images"])
api_router.include_router(analysis.router, prefix="/analysis", tags=["Analysis"])
api_router.include_router(rainfall.router, prefix="/rainfall", tags=["Rainfall & Climate Database"])
api_router.include_router(digital_twin.router, prefix="/digital-twin", tags=["Digital Twin"])
api_router.include_router(alerts.router, prefix="/alerts", tags=["Alerts"])
api_router.include_router(chatbot.router, prefix="/chatbot", tags=["AI Chatbot"])
api_router.include_router(voice.router, prefix="/voice", tags=["Voice Engine"])
api_router.include_router(reports.router, prefix="/reports", tags=["Reports & Exports"])
api_router.include_router(jobs.router, prefix="/jobs", tags=["Background Ingestion & Jobs"])

