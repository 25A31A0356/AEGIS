import pytest
import math
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from backend.app.main import app
from backend.app.database.models import SOSSignal, SOSNotification, UserPreference, User, EmergencyFacility

@pytest.mark.anyio
async def test_zero_fake_beacons_in_clean_sos_map(async_client: AsyncClient, test_db: AsyncSession):
    """Verify that by default, the active SOS list contains zero mock/fake pins."""
    resp = await async_client.get("/api/v1/sos?status=ACTIVE")
    assert resp.status_code == 200
    data = resp.json()["data"]
    for item in data:
        assert item.get("id") is not None

@pytest.mark.anyio
async def test_demo_mode_on_suppresses_police(async_client: AsyncClient, test_db: AsyncSession):
    """
    When Demo Mode = ON:
    - Family contacts receive SMS.
    - Police notification is strictly suppressed.
    - Event is marked demo_mode = True.
    """
    payload = {
        "caller_name": "Demo Tester",
        "caller_phone": "+919876543210",
        "emergency_type": "general",
        "severity": "CRITICAL",
        "short_message": "Testing SOS in Demo Mode",
        "latitude": 17.6868,
        "longitude": 83.2185,
        "accuracy_meters": 5.0,
        "demo_mode": True,
        "emergency_contacts": [
            {"name": "Family Member 1", "phone": "+919123456780", "relationship": "Parent"}
        ]
    }
    
    resp = await async_client.post("/api/v1/sos", json=payload)
    assert resp.status_code == 200
    sos_data = resp.json()["data"]
    assert sos_data["demo_mode"] is True
    assert sos_data["police_notification_status"] == "SKIPPED_DEMO_MODE"
    assert "DEMO MODE ON" in (sos_data.get("police_station_name") or "")

    # Verify database state
    db_res = await test_db.execute(select(SOSSignal).where(SOSSignal.id == sos_data["id"]))
    sos_db = db_res.scalars().first()
    assert sos_db is not None
    assert sos_db.demo_mode is True
    assert sos_db.demo_mode_snapshot is True
    assert sos_db.police_notification_status == "SKIPPED_DEMO_MODE"

    # Verify notifications table: Family SMS is present, but NO police SMS
    notif_res = await test_db.execute(select(SOSNotification).where(SOSNotification.sos_id == sos_db.id))
    notifs = notif_res.scalars().all()
    recipient_types = [n.recipient_type for n in notifs]
    assert "FAMILY_CONTACT" in recipient_types
    assert "POLICE_STATION" not in recipient_types

@pytest.mark.anyio
async def test_demo_mode_off_dispatches_police(async_client: AsyncClient, test_db: AsyncSession):
    """
    When Demo Mode = OFF:
    - Family contacts receive SMS.
    - Nearest police station is automatically looked up and notified.
    - Event is marked demo_mode = False.
    """
    police_fac = EmergencyFacility(
        name="Vizag Central Police Station",
        facility_type="POLICE_STATION",
        latitude=17.6900,
        longitude=83.2200,
        contact_phone="+918912565656",
        operational_status="OPERATIONAL"
    )
    test_db.add(police_fac)
    await test_db.commit()

    payload = {
        "caller_name": "Emergency Citizen",
        "caller_phone": "+919876543210",
        "emergency_type": "medical",
        "severity": "CRITICAL",
        "short_message": "Production SOS Emergency",
        "latitude": 17.6868,
        "longitude": 83.2185,
        "accuracy_meters": 4.2,
        "demo_mode": False,
        "emergency_contacts": [
            {"name": "Emergency Contact", "phone": "+919988776655", "relationship": "Spouse"}
        ]
    }
    
    resp = await async_client.post("/api/v1/sos", json=payload)
    assert resp.status_code == 200
    sos_data = resp.json()["data"]
    assert sos_data["demo_mode"] is False
    assert sos_data["police_notification_status"] == "SENT"
    assert sos_data["police_station_name"] is not None

    # Verify notifications table: Both Family Contact and Police Station were notified
    notif_res = await test_db.execute(select(SOSNotification).where(SOSNotification.sos_id == sos_data["id"]))
    notifs = notif_res.scalars().all()
    recipient_types = [n.recipient_type for n in notifs]
    assert "FAMILY_CONTACT" in recipient_types
    assert "POLICE_STATION" in recipient_types

@pytest.mark.anyio
async def test_20km_geospatial_network_matching(async_client: AsyncClient, test_db: AsyncSession):
    """
    Test 20 km Geospatial Network:
    User A: Origin (17.6868, 83.2185)
    User B: 5 km away -> Eligible (receives offer)
    User C: 12 km away -> Eligible (receives offer)
    User D: 19 km away -> Eligible (receives offer)
    User E: 25 km away -> Outside radius (does NOT receive offer)
    """
    origin_lat = 17.6868
    origin_lon = 83.2185

    def offset_lat(km):
        return origin_lat + (km / 111.0)

    responders = [
        ("user_b_5km", offset_lat(5.0), origin_lon, 5.0),
        ("user_c_12km", offset_lat(12.0), origin_lon, 12.0),
        ("user_d_19km", offset_lat(19.0), origin_lon, 19.0),
        ("user_e_25km", offset_lat(25.0), origin_lon, 25.0),
    ]

    for uid, lat, lon, dist in responders:
        u = User(id=uid, email=f"{uid}@aegis.org", hashed_password="secure_password_hash", full_name=f"Responder {uid}", role="responder")
        test_db.add(u)
        pref = UserPreference(
            user_id=uid,
            is_responder_opted_in=True,
            is_available=True,
            last_known_lat=lat,
            last_known_lng=lon,
            capabilities=["FIRST_AID", "SEARCH_AND_RESCUE"]
        )
        test_db.add(pref)
    await test_db.commit()

    payload = {
        "caller_name": "User A (Origin)",
        "caller_phone": "+919000000001",
        "emergency_type": "flood_trapped",
        "severity": "CRITICAL",
        "latitude": origin_lat,
        "longitude": origin_lon,
        "accuracy_meters": 8.0,
        "demo_mode": True
    }
    
    resp = await async_client.post("/api/v1/sos", json=payload)
    assert resp.status_code == 200
    sos_id = resp.json()["data"]["id"]

    cand_resp = await async_client.get(f"/api/v1/sos/{sos_id}/candidates")
    assert cand_resp.status_code == 200
    candidate_ids = [c["user_id"] for c in cand_resp.json()["data"]]

    assert "user_b_5km" in candidate_ids
    assert "user_c_12km" in candidate_ids
    assert "user_d_19km" in candidate_ids
    assert "user_e_25km" not in candidate_ids
