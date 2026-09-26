import pytest
from datetime import datetime, timezone
from httpx import AsyncClient, ASGITransport
from backend.app.main import app


@pytest.mark.asyncio
async def test_record_device_location_v1_direct():
    """Verify POST /v1/locations works directly without /api prefix."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        payload = {
            "latitude": 17.000000,
            "longitude": 83.000000,
            "accuracyMeters": 8.5,
            "altitudeMeters": 32.0,
            "speedMps": 0.0,
            "bearingDegrees": None,
            "timestamp": "2026-09-25T15:20:30Z",
            "provider": "GPS/FUSED",
            "isMockLocation": False,
            "deviceId": "mobile-unit-test-1",
        }
        res = await ac.post("/v1/locations", json=payload)
        assert res.status_code == 201
        data = res.json()
        assert data["success"] is True
        coord_data = data.get("data") or data.get("result")
        assert coord_data["latitude"] == 17.000000
        assert coord_data["longitude"] == 83.000000
        assert coord_data["accuracyMeters"] == 8.5
        assert coord_data["accuracyTier"] == "HIGH_QUALITY"
        assert coord_data["isMockLocation"] is False
        assert coord_data["provider"] == "GPS/FUSED"


@pytest.mark.asyncio
async def test_record_device_location_api_v1_high_accuracy():
    """Verify POST /api/v1/locations works for high-accuracy GPS fix."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        payload = {
            "latitude": 17.1704512,
            "longitude": 82.0512345,
            "accuracyMeters": 4.5,
            "altitudeMeters": 28.5,
            "speedMps": 1.2,
            "bearingDegrees": 90.0,
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "provider": "GPS/FUSED",
            "isMockLocation": False,
            "deviceId": "test-device-pytest",
        }
        res = await ac.post("/api/v1/locations", json=payload)
        assert res.status_code == 201
        data = res.json()
        assert data["success"] is True
        coord_data = data.get("data") or data.get("result")
        assert coord_data["latitude"] == 17.1704512
        assert coord_data["longitude"] == 82.0512345
        assert coord_data["accuracyMeters"] == 4.5
        assert coord_data["accuracyTier"] == "HIGH_QUALITY"
        assert coord_data["isMockLocation"] is False


@pytest.mark.asyncio
async def test_record_device_location_accuracy_tiers():
    """Verify accuracy tier policy: <=10m (HIGH), 10-25m (USABLE), 25-50m (APPROXIMATE), >50m (POOR)."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        # High Quality (<=10m)
        res0 = await ac.post("/v1/locations", json={
            "latitude": 17.17, "longitude": 82.05, "accuracyMeters": 6.2,
            "timestamp": datetime.now(timezone.utc).isoformat()
        })
        assert res0.json()["data"]["accuracyTier"] == "HIGH_QUALITY"

        # Usable (10-25m)
        res1 = await ac.post("/v1/locations", json={
            "latitude": 17.17, "longitude": 82.05, "accuracyMeters": 18.0,
            "timestamp": datetime.now(timezone.utc).isoformat()
        })
        assert res1.json()["data"]["accuracyTier"] == "USABLE"

        # Approximate (25-50m)
        res2 = await ac.post("/v1/locations", json={
            "latitude": 17.17, "longitude": 82.05, "accuracyMeters": 35.0,
            "timestamp": datetime.now(timezone.utc).isoformat()
        })
        assert res2.json()["data"]["accuracyTier"] == "APPROXIMATE"

        # Poor (>50m)
        res3 = await ac.post("/v1/locations", json={
            "latitude": 17.17, "longitude": 82.05, "accuracyMeters": 120.0,
            "timestamp": datetime.now(timezone.utc).isoformat()
        })
        assert res3.json()["data"]["accuracyTier"] == "POOR"


@pytest.mark.asyncio
async def test_record_mock_location_detection():
    """Verify mock location flag is accurately captured in telemetry."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        res = await ac.post("/v1/locations", json={
            "latitude": 17.17, "longitude": 82.05, "accuracyMeters": 5.0,
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "isMockLocation": True
        })
        assert res.status_code == 201
        assert res.json()["data"]["isMockLocation"] is True


@pytest.mark.asyncio
async def test_batch_sync_offline_locations():
    """Verify batch synchronization of offline queued GPS readings."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        batch = {
            "deviceId": "offline-sync-device",
            "readings": [
                {
                    "latitude": 17.1701,
                    "longitude": 82.0501,
                    "accuracyMeters": 5.0,
                    "timestamp": datetime.now(timezone.utc).isoformat(),
                    "provider": "GPS/FUSED",
                    "isMockLocation": False,
                },
                {
                    "latitude": 17.1705,
                    "longitude": 82.0508,
                    "accuracyMeters": 3.8,
                    "timestamp": datetime.now(timezone.utc).isoformat(),
                    "provider": "GPS/FUSED",
                    "isMockLocation": False,
                },
            ]
        }
        res = await ac.post("/v1/locations/sync", json=batch)
        assert res.status_code == 200
        data = res.json()
        assert data["success"] is True
        assert data["data"]["status"] == "BATCH_SYNCED"
        assert data["data"]["syncedCount"] == 2
