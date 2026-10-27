from datetime import datetime, timezone
from typing import Optional, Dict, Any
from pydantic import BaseModel, Field

class DataFreshnessStatus:
    LATEST_AVAILABLE = "LATEST_AVAILABLE_OBSERVATION"
    UPDATED_TODAY = "UPDATED_TODAY"
    HISTORICAL_2026 = "HISTORICAL_2026_RECORD"
    FORECAST = "FORECAST"
    STALE_DATA = "STALE_DATA"
    SOURCE_UNAVAILABLE = "SOURCE_UNAVAILABLE"

class VerificationStatus:
    OFFICIAL_VERIFIED = "OFFICIALLY_VERIFIED"
    STATION_MEASURED = "STATION_MEASURED"
    SATELLITE_DERIVED = "SATELLITE_DERIVED"
    MODEL_ESTIMATE = "MODEL_ESTIMATE"
    CROWDSOURCED_REPORT = "CROWDSOURCED_UNVERIFIED"

class DataProvenance(BaseModel):
    source_name: str = Field(..., description="Legitimate agency or provider name")
    observation_date: datetime = Field(..., description="Actual date and time of physical observation/measurement")
    source_publication_time: Optional[datetime] = Field(None, description="When the publishing agency released the data")
    last_retrieval_time: datetime = Field(default_factory=lambda: datetime.now(timezone.utc), description="Timestamp when our system fetched the data")
    data_period: str = Field("2026 Real-Time Observation", description="Temporal scope of the record")
    geographic_resolution: str = Field("District / Locality", description="Spatial granularity (e.g. 0.1 deg, 10m SAR, Station point)")
    verification_status: str = Field(VerificationStatus.OFFICIAL_VERIFIED, description="Level of ground truth verification")
    freshness_status: str = Field(DataFreshnessStatus.LATEST_AVAILABLE, description="Strict freshness indicator")
    official_source_url: str = Field(..., description="Canonical source website or API documentation link")
    limitations_notice: Optional[str] = Field(None, description="Explicit technical caveats, quality flags, or resolution constraints")

    def to_dict(self) -> Dict[str, Any]:
        return {
            "source_name": self.source_name,
            "observation_date": self.observation_date.isoformat(),
            "source_publication_time": self.source_publication_time.isoformat() if self.source_publication_time else None,
            "last_retrieval_time": self.last_retrieval_time.isoformat(),
            "data_period": self.data_period,
            "geographic_resolution": self.geographic_resolution,
            "verification_status": self.verification_status,
            "freshness_status": self.freshness_status,
            "official_source_url": self.official_source_url,
            "limitations_notice": self.limitations_notice
        }
