from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from backend.app.core.config import settings
from backend.app.api.v1.api import api_router
from backend.app.database.session import Base, engine

from backend.app.database.migration import run_migrations

# Ensure DB tables and safe migrations exist
run_migrations()

app = FastAPI(
    title=settings.APP_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    docs_url=f"{settings.API_V1_STR}/docs",
    redoc_url=f"{settings.API_V1_STR}/redoc"
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Static file serving for uploads, processed rasters, and samples
app.mount("/data/uploads", StaticFiles(directory=str(settings.UPLOAD_DIR)), name="uploads")
app.mount("/data/processed", StaticFiles(directory=str(settings.PROCESSED_DIR)), name="processed")
app.mount("/data/samples", StaticFiles(directory=str(settings.SAMPLES_DIR)), name="samples")

# Include API v1 Router
app.include_router(api_router, prefix=settings.API_V1_STR)

@app.get("/")
def root():
    return {
        "title": settings.APP_NAME,
        "api_docs": f"{settings.API_V1_STR}/docs",
        "status": "online",
        "description": "Multi-Temporal Geospatial & Computer Vision Disaster Digital Twin Platform"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.app.main:app", host="0.0.0.0", port=8000, reload=True)
