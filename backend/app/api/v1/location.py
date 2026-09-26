"""
AEGIS UNIFIED DATA CORE - Geographic & Administrative Location API
/api/v1/location & /api/v1/locations & /v1/locations
"""
from typing import Optional, List, Dict, Any
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, Query, HTTPException, status
from pydantic import BaseModel, Field, field_validator
from sqlalchemy.ext.asyncio import AsyncSession
from backend.app.schemas.common import ApiResponse, FreshnessMetadata, ProvenanceMetadata
from backend.app.providers.adapters.geographic import GeographicLocationProvider
from backend.app.cache.redis_client import CacheManager
from backend.app.api.deps import rate_limit_check
from backend.app.database.session import get_db
from backend.app.database.models import DeviceLocationTelemetry
from backend.app.utils.logger import logger

router = APIRouter(prefix="/location", tags=["Geographic & Location Services"])


class DeviceLocationReading(BaseModel):
    """Authoritative native GPS hardware / Fused Location reading model."""
    latitude: float = Field(..., ge=-90.0, le=90.0, description="Authoritative GPS Latitude")
    longitude: float = Field(..., ge=-180.0, le=180.0, description="Authoritative GPS Longitude")
    accuracyMeters: float = Field(..., ge=0.0, description="Device-measured accuracy in meters")
    altitudeMeters: Optional[float] = Field(default=None, description="Altitude in meters")
    speedMps: Optional[float] = Field(default=None, ge=0.0, description="Instantaneous velocity in meters per second")
    bearingDegrees: Optional[float] = Field(default=None, ge=0.0, le=360.0, description="Compass heading/bearing")
    timestamp: datetime = Field(..., description="ISO-8601 device GPS fix timestamp")
    provider: str = Field(default="GPS/FUSED", description="Hardware or fused provider (GPS/FUSED, GPS, NETWORK, MANUAL)")
    isMockLocation: bool = Field(default=False, description="Whether location is mocked/spoofed")
    deviceId: Optional[str] = Field(default=None, description="Unique client device identifier")
    userId: Optional[str] = Field(default=None, description="Authenticated user ID if available")

    @field_validator("accuracyMeters")
    @classmethod
    def validate_accuracy(cls, v: float) -> float:
        if v < 0:
            raise ValueError("accuracyMeters cannot be negative")
        return v


class DeviceLocationSyncBatch(BaseModel):
    """Batch synchronization payload for offline queue uploads."""
    deviceId: Optional[str] = None
    readings: List[DeviceLocationReading] = Field(..., min_length=1, max_length=500)


class DeviceLocationResponseData(BaseModel):
    status: str
    recordedAt: datetime
    latitude: float
    longitude: float
    accuracyMeters: float
    accuracyTier: str  # HIGH_QUALITY (<=10m), USABLE (10-25m), APPROXIMATE (25-50m), POOR (>50m)
    provider: str
    isMockLocation: bool
    isStale: bool
    syncedCount: Optional[int] = None


class LocationSearchResult(BaseModel):
    name: str
    locality: Optional[str] = None
    district: Optional[str] = None
    state: Optional[str] = None
    country: str = "India"
    latitude: float
    longitude: float
    elevation: Optional[float] = 0.0
    timezone: str = "Asia/Kolkata"
    source: str = "AEGIS Geographic Registry"


class ReverseLocationResult(BaseModel):
    name: str
    locality: str
    district: str
    state: str
    country: str
    latitude: float
    longitude: float
    distance_to_centroid_km: float = 0.0
    elevation: float = 0.0
    timezone: str = "Asia/Kolkata"
    confidence: float = 1.0
    source: str = "AEGIS Administrative Boundary Grid"


def calculate_accuracy_tier(accuracy_meters: float) -> str:
    if accuracy_meters <= 10.0:
        return "HIGH_QUALITY"
    elif accuracy_meters <= 25.0:
        return "USABLE"
    elif accuracy_meters <= 50.0:
        return "APPROXIMATE"
    else:
        return "POOR"


def check_is_stale(reading_time: datetime, max_age_seconds: int = 120) -> bool:
    now = datetime.now(timezone.utc)
    if reading_time.tzinfo is None:
        reading_time = reading_time.replace(tzinfo=timezone.utc)
    age = (now - reading_time).total_seconds()
    return age > max_age_seconds


@router.post("", response_model=ApiResponse[DeviceLocationResponseData], status_code=status.HTTP_201_CREATED, dependencies=[Depends(rate_limit_check)])
async def record_device_location(
    reading: DeviceLocationReading,
    db: AsyncSession = Depends(get_db),
):
    """
    Authoritative native GPS Ingestion Endpoint.
    Ingests device-reported coordinates with device-measured accuracy in meters.
    Never replaces coordinates with reverse-geocoded city coordinates.
    """
    reading_time = reading.timestamp
    if reading_time.tzinfo is None:
        reading_time = reading_time.replace(tzinfo=timezone.utc)

    logger.info(
        f"[GPS Telemetry] Lat={reading.latitude:.7f}, Lng={reading.longitude:.7f}, "
        f"Accuracy={reading.accuracyMeters:.1f}m, Timestamp={reading_time.isoformat()}, "
        f"Provider={reading.provider}, Mock={reading.isMockLocation}, Device={reading.deviceId}"
    )

    tier = calculate_accuracy_tier(reading.accuracyMeters)
    is_stale = check_is_stale(reading_time)

    # Persist to database
    location_record = DeviceLocationTelemetry(
        device_id=reading.deviceId,
        user_id=reading.userId,
        latitude=reading.latitude,
        longitude=reading.longitude,
        accuracy_meters=reading.accuracyMeters,
        altitude_meters=reading.altitudeMeters,
        speed_mps=reading.speedMps,
        bearing_degrees=reading.bearingDegrees,
        provider=reading.provider,
        is_mock_location=reading.isMockLocation,
        accuracy_tier=tier,
        recorded_at=reading_time,
    )
    
    try:
        db.add(location_record)
        await db.commit()
    except Exception as e:
        await db.rollback()
        pass

    # Cache latest live coordinate in Redis for quick emergency queries
    if reading.deviceId:
        cache_key = f"device_latest_gps_{reading.deviceId}"
        await CacheManager.set(
            cache_key,
            {
                "latitude": reading.latitude,
                "longitude": reading.longitude,
                "accuracyMeters": reading.accuracyMeters,
                "provider": reading.provider,
                "timestamp": reading_time.isoformat(),
            },
            ttl_seconds=86400,
        )

    return ApiResponse(
        success=True,
        data=DeviceLocationResponseData(
            status="RECORDED",
            recordedAt=reading_time,
            latitude=reading.latitude,
            longitude=reading.longitude,
            accuracyMeters=reading.accuracyMeters,
            accuracyTier=tier,
            provider=reading.provider,
            isMockLocation=reading.isMockLocation,
            isStale=is_stale,
        ),
        freshness=FreshnessMetadata(status="live_gps", age_seconds=0),
        provenance=ProvenanceMetadata(
            data_type="native_device_gps",
            source_authority="Android Fused Location Provider / Hardware GNSS",
            processing_version="1.0.0"
        )
    )


@router.post("/sync", response_model=ApiResponse[DeviceLocationResponseData], dependencies=[Depends(rate_limit_check)])
async def sync_offline_location_queue(
    batch: DeviceLocationSyncBatch,
    db: AsyncSession = Depends(get_db),
):
    """
    Synchronizes offline queued location telemetry readings when internet reconnects.
    """
    inserted_count = 0
    latest_reading = batch.readings[-1]

    for item in batch.readings:
        item_time = item.timestamp
        if item_time.tzinfo is None:
            item_time = item_time.replace(tzinfo=timezone.utc)

        tier = calculate_accuracy_tier(item.accuracyMeters)
        rec = DeviceLocationTelemetry(
            device_id=batch.deviceId or item.deviceId,
            user_id=item.userId,
            latitude=item.latitude,
            longitude=item.longitude,
            accuracy_meters=item.accuracyMeters,
            altitude_meters=item.altitudeMeters,
            speed_mps=item.speedMps,
            bearing_degrees=item.bearingDegrees,
            provider=item.provider,
            is_mock_location=item.isMockLocation,
            accuracy_tier=tier,
            recorded_at=item_time,
        )
        db.add(rec)
        inserted_count += 1

    try:
        await db.commit()
    except Exception:
        await db.rollback()

    tier = calculate_accuracy_tier(latest_reading.accuracyMeters)
    is_stale = check_is_stale(latest_reading.timestamp)

    return ApiResponse(
        success=True,
        data=DeviceLocationResponseData(
            status="BATCH_SYNCED",
            recordedAt=latest_reading.timestamp,
            latitude=latest_reading.latitude,
            longitude=latest_reading.longitude,
            accuracyMeters=latest_reading.accuracyMeters,
            accuracyTier=tier,
            provider=latest_reading.provider,
            isMockLocation=latest_reading.isMockLocation,
            isStale=is_stale,
            syncedCount=inserted_count,
        ),
        freshness=FreshnessMetadata(status="batch_synced", age_seconds=0),
        provenance=ProvenanceMetadata(
            data_type="offline_queue_sync",
            source_authority="AEGIS Offline Location Sync Engine",
            processing_version="1.0.0"
        )
    )


@router.get("", response_model=ApiResponse[Dict[str, Any]], dependencies=[Depends(rate_limit_check)])
async def get_location_info(
    query: Optional[str] = Query(default=None, description="Search location name"),
    q: Optional[str] = Query(default=None, description="Search location name shorthand (q)"),
    lat: Optional[float] = Query(default=None, ge=-90.0, le=90.0, description="Latitude for reverse geocoding"),
    lng: Optional[float] = Query(default=None, ge=-180.0, le=180.0, description="Longitude for reverse geocoding (lng)"),
    lon: Optional[float] = Query(default=None, ge=-180.0, le=180.0, description="Longitude for reverse geocoding (lon)"),
):
    """
    Unified location resolver: accepts either a text search query or coordinates.
    """
    provider = GeographicLocationProvider()
    longitude = lng if lng is not None else lon

    search_query = query or q
    if search_query:
        cache_key = f"geo_search_{search_query.strip().lower()}"
        cached = await CacheManager.get(cache_key)
        if cached:
            return ApiResponse(
                success=True,
                data={"query": query, "results": cached},
                freshness=FreshnessMetadata(status="fresh", age_seconds=30),
                provenance=ProvenanceMetadata(
                    data_type="geographic_reference",
                    source_authority="Open-Meteo & AEGIS Centroid Registry",
                    processing_version="1.0.0"
                )
            )

        results = await provider.geocode(query, count=5)
        await CacheManager.set(cache_key, results, ttl_seconds=3600)
        return ApiResponse(
            success=True,
            data={"query": query, "results": results},
            freshness=FreshnessMetadata(status="fresh", age_seconds=5),
            provenance=ProvenanceMetadata(
                data_type="geographic_reference",
                source_authority="Open-Meteo & AEGIS Centroid Registry",
                processing_version="1.0.0"
            )
        )

    if lat is not None and longitude is not None:
        cache_key = f"geo_reverse_{lat:.3f}_{longitude:.3f}"
        cached = await CacheManager.get(cache_key)
        if cached:
            return ApiResponse(
                success=True,
                data=cached,
                freshness=FreshnessMetadata(status="fresh", age_seconds=30),
                provenance=ProvenanceMetadata(
                    data_type="geographic_reference",
                    source_authority="AEGIS Administrative Boundary Grid",
                    processing_version="1.0.0"
                )
            )

        resolved = await provider.reverse_geocode(lat, longitude)
        await CacheManager.set(cache_key, resolved, ttl_seconds=3600)
        return ApiResponse(
            success=True,
            data=resolved,
            freshness=FreshnessMetadata(status="fresh", age_seconds=5),
            provenance=ProvenanceMetadata(
                data_type="geographic_reference",
                source_authority="AEGIS Administrative Boundary Grid",
                processing_version="1.0.0"
            )
        )

    raise HTTPException(status_code=400, detail="Must provide either 'query' string or ('lat', 'lng'/'lon') coordinates.")


@router.get("/search", response_model=ApiResponse[List[LocationSearchResult]], dependencies=[Depends(rate_limit_check)])
async def search_location(
    query: str = Query(..., min_length=2, description="Place or city name"),
    limit: int = Query(default=5, ge=1, le=20)
):
    """
    Forward geocodes city, district, or landmark to geographic coordinates.
    """
    provider = GeographicLocationProvider()
    results = await provider.geocode(query, count=limit)
    return ApiResponse(
        success=True,
        data=[LocationSearchResult(**r) for r in results],
        freshness=FreshnessMetadata(status="fresh", age_seconds=5),
        provenance=ProvenanceMetadata(
            data_type="geographic_reference",
            source_authority="Open-Meteo & AEGIS Centroid Registry",
            processing_version="1.0.0"
        )
    )


@router.get("/reverse", response_model=ApiResponse[ReverseLocationResult], dependencies=[Depends(rate_limit_check)])
async def reverse_location(
    lat: float = Query(..., ge=-90.0, le=90.0),
    lng: Optional[float] = Query(default=None, ge=-180.0, le=180.0, description="Longitude (lng)"),
    lon: Optional[float] = Query(default=None, ge=-180.0, le=180.0, description="Longitude (lon)")
):
    """
    Reverse geocodes latitude/longitude coordinates into administrative district, state, and elevation.
    Used ONLY for human-readable UI display labels, never as authoritative GPS replacement.
    """
    longitude = lng if lng is not None else lon
    if longitude is None:
        raise HTTPException(status_code=422, detail="Missing required longitude coordinate (provide 'lng' or 'lon').")

    provider = GeographicLocationProvider()
    resolved = await provider.reverse_geocode(lat, longitude)
    return ApiResponse(
        success=True,
        data=ReverseLocationResult(**resolved),
        freshness=FreshnessMetadata(status="fresh", age_seconds=5),
        provenance=ProvenanceMetadata(
            data_type="geographic_reference",
            source_authority="AEGIS Administrative Boundary Grid",
            processing_version="1.0.0"
        )
    )


# Plural router alias for /locations endpoints
locations_router = APIRouter(prefix="/locations", tags=["Geographic & Location Services"])
locations_router.add_api_route("", record_device_location, methods=["POST"], response_model=ApiResponse[DeviceLocationResponseData], status_code=status.HTTP_201_CREATED, dependencies=[Depends(rate_limit_check)])
locations_router.add_api_route("/sync", sync_offline_location_queue, methods=["POST"], response_model=ApiResponse[DeviceLocationResponseData], dependencies=[Depends(rate_limit_check)])
locations_router.add_api_route("", get_location_info, methods=["GET"], response_model=ApiResponse[Dict[str, Any]], dependencies=[Depends(rate_limit_check)])
locations_router.add_api_route("/search", search_location, methods=["GET"], response_model=ApiResponse[List[LocationSearchResult]], dependencies=[Depends(rate_limit_check)])
locations_router.add_api_route("/reverse", reverse_location, methods=["GET"], response_model=ApiResponse[ReverseLocationResult], dependencies=[Depends(rate_limit_check)])
