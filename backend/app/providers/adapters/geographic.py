"""
AEGIS UNIFIED DATA CORE - Geographic & Location Provider Adapter
Comprehensive India Administrative Centroid, Village, Town, Mandal & Boundary Resolution Engine.
"""
from typing import Dict, Any, List, Optional, Tuple
from datetime import datetime, timezone
import math
import httpx
from backend.app.providers.base import BaseProvider
from backend.app.schemas.unified import UnifiedObservation, GeoLocation
from backend.app.providers.adapters.india_districts_data import ALL_INDIA_DISTRICTS

OFFLINE_LOCATIONS: List[Dict[str, Any]] = ALL_INDIA_DISTRICTS


def haversine_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calculates great-circle distance in kilometers between two GPS coordinates."""
    d_lat = math.radians(lat2 - lat1)
    d_lon = math.radians(lon2 - lon1)
    a = (
        math.sin(d_lat / 2) ** 2 +
        math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(d_lon / 2) ** 2
    )
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return 6371.0 * c


class GeographicLocationProvider(BaseProvider):
    def __init__(
        self,
        name: str = "AEGIS National Geocoding & Locality Grid",
        base_url: str = "https://geocoding-api.open-meteo.com/v1",
        endpoint: str = "/search",
        api_key: Optional[str] = None,
        headers: Optional[Dict[str, str]] = None,
        params: Optional[Dict[str, Any]] = None,
        timeout_seconds: float = 8.0
    ):
        super().__init__(
            name=name,
            provider_code="GEOGRAPHIC_CORE",
            base_url=base_url,
            endpoint=endpoint,
            api_key=api_key,
            headers=headers,
            params=params,
            timeout_seconds=timeout_seconds
        )

    async def geocode(self, query: str, count: int = 5) -> List[Dict[str, Any]]:
        """Searches for villages, towns, mandals, districts, and cities matching query string."""
        if not query or len(query.strip()) < 2:
            return []

        q_clean = query.strip().lower()
        results: List[Dict[str, Any]] = []

        # 1. High-accuracy Nominatim geocoder (supports all Indian villages, e.g. Goneda)
        try:
            async with httpx.AsyncClient(timeout=4.0) as client:
                res = await client.get(
                    f"https://nominatim.openstreetmap.org/search?format=json&q={query}+India&addressdetails=1&limit={count}",
                    headers={"User-Agent": "AEGIS-Disaster/1.0"}
                )
                if res.is_success:
                    items = res.json()
                    for item in items:
                        addr = item.get("address", {})
                        village = addr.get("village") or addr.get("hamlet") or addr.get("isolated_dwelling") or addr.get("neighbourhood") or addr.get("suburb")
                        town = addr.get("town") or addr.get("city") or addr.get("municipality")
                        mandal = addr.get("county") or addr.get("subdistrict") or addr.get("taluk") or addr.get("tehsil")
                        district = addr.get("state_district") or addr.get("district") or mandal or town or "District"
                        state_name = addr.get("state", "India")
                        primary = village or town or mandal or district or item.get("name")

                        context = []
                        if mandal and mandal != primary:
                            context.append(mandal)
                        if district and district != primary and district not in context:
                            context.append(district)
                        if state_name and state_name not in context:
                            context.append(state_name)

                        formatted_addr = f"{primary} • {', '.join(context)}" if context else primary
                        results.append({
                            "name": primary,
                            "locality": primary,
                            "village": village,
                            "mandal": mandal,
                            "district": district,
                            "state": state_name,
                            "country": addr.get("country", "India"),
                            "latitude": float(item.get("lat", 0.0)),
                            "longitude": float(item.get("lon", 0.0)),
                            "elevation": 50.0,
                            "timezone": "Asia/Kolkata",
                            "formatted_address": formatted_addr,
                            "source": "OpenStreetMap & National Locality Grid"
                        })
        except Exception:
            pass

        # 2. Offline curated reference matching fallback
        if not results:
            for loc in OFFLINE_LOCATIONS:
                if (
                    q_clean in loc["name"].lower() or
                    q_clean in loc["district"].lower() or
                    q_clean in loc["state"].lower()
                ):
                    formatted_addr = f"{loc['name']}, {loc['district']}, {loc['state']}, India"
                    results.append({
                        "name": loc["name"],
                        "locality": loc["name"],
                        "district": loc["district"],
                        "state": loc["state"],
                        "country": loc["country"],
                        "latitude": loc["lat"],
                        "longitude": loc["lng"],
                        "elevation": loc["elevation"],
                        "timezone": loc["timezone"],
                        "formatted_address": formatted_addr,
                        "source": "AEGIS National Geographic Centroid Registry"
                    })
                if len(results) >= count:
                    break

        return results

    @classmethod
    def reverse_geocode_offline(cls, latitude: float, longitude: float) -> Dict[str, Any]:
        """Resolves latitude/longitude coordinates to nearest Indian administrative district and state."""
        best_match = None
        min_dist = float("inf")

        for loc in OFFLINE_LOCATIONS:
            dist_km = haversine_km(latitude, longitude, loc["lat"], loc["lng"])
            if dist_km < min_dist:
                min_dist = dist_km
                best_match = loc

        if best_match:
            formatted_addr = f"{best_match['name']} (District) • {best_match['state']}, India"
            speech = f"Your current location is {best_match['name']}, {best_match['state']}."
            confidence = max(0.65, round(1.0 - (min_dist / 600.0), 2)) if min_dist <= 600.0 else 0.50
            return {
                "name": best_match["name"],
                "locality": best_match["name"],
                "locality_type": "District",
                "locality_name": best_match["name"],
                "district": best_match["district"],
                "state": best_match["state"],
                "country": best_match["country"],
                "latitude": latitude,
                "longitude": longitude,
                "distance_to_centroid_km": round(min_dist, 2),
                "elevation": best_match["elevation"],
                "timezone": best_match["timezone"],
                "confidence": confidence,
                "formatted_address": formatted_addr,
                "speech_summary": speech,
                "source": "AEGIS National Geographic Centroid Registry"
            }

        return {
            "name": f"Coordinates ({latitude:.4f}, {longitude:.4f})",
            "locality": "Regional Jurisdiction",
            "district": "General District",
            "state": "National Territory",
            "country": "India",
            "latitude": latitude,
            "longitude": longitude,
            "distance_to_centroid_km": 0.0,
            "elevation": 50.0,
            "timezone": "Asia/Kolkata",
            "confidence": 0.5,
            "formatted_address": f"Location ({latitude:.4f}, {longitude:.4f}), India",
            "source": "AEGIS Geometric Interpolation"
        }

    @classmethod
    async def reverse_geocode(cls, latitude: float, longitude: float) -> Dict[str, Any]:
        """
        High-accuracy async reverse geocoder: Resolves exact Village, Town, Locality, City, Mandal, District, and State.
        """
        try:
            async with httpx.AsyncClient(timeout=4.0) as client:
                res = await client.get(
                    f"https://nominatim.openstreetmap.org/reverse?format=json&lat={latitude}&lon={longitude}&zoom=18&addressdetails=1",
                    headers={"User-Agent": "AEGIS-Disaster/1.0"}
                )
                if res.is_success:
                    addr = res.json().get("address", {})
                    village = addr.get("village") or addr.get("hamlet") or addr.get("isolated_dwelling")
                    suburb = addr.get("suburb") or addr.get("neighbourhood") or addr.get("residential")
                    town = addr.get("town") or addr.get("municipality")
                    city = addr.get("city")
                    mandal = addr.get("county") or addr.get("subdistrict") or addr.get("taluk") or addr.get("tehsil") or addr.get("mandal")
                    district = addr.get("state_district") or addr.get("district") or ""
                    state_name = addr.get("state", "India")

                    if village:
                        loc_type = "Village"
                        loc_name = village
                    elif town:
                        loc_type = "Town"
                        loc_name = town
                    elif suburb:
                        loc_type = "Locality"
                        loc_name = suburb
                    elif city:
                        loc_type = "City"
                        loc_name = city
                    else:
                        loc_type = "District"
                        loc_name = district or mandal or "Local Sector"

                    nearby_parts = []
                    if mandal and mandal != loc_name:
                        nearby_parts.append(mandal)
                    if city and city != loc_name and city not in nearby_parts:
                        nearby_parts.append(city)
                    if district and district != loc_name and district not in nearby_parts:
                        nearby_parts.append(district)

                    nearby_str = f"Near {', '.join(nearby_parts)}" if nearby_parts else ""
                    formatted = f"{loc_name} ({loc_type})" + (f" • {nearby_str}" if nearby_str else "") + (f", {state_name}" if state_name else "")
                    speech = f"Your current location is {loc_name} {loc_type}" + (f", near {', '.join(nearby_parts)}" if nearby_parts else "") + f", {state_name}."

                    return {
                        "name": loc_name,
                        "locality": loc_name,
                        "locality_type": loc_type,
                        "village": village,
                        "mandal": mandal,
                        "nearby_place": ", ".join(nearby_parts) if nearby_parts else None,
                        "district": district or loc_name,
                        "state": state_name,
                        "country": addr.get("country", "India"),
                        "latitude": latitude,
                        "longitude": longitude,
                        "distance_to_centroid_km": 0.0,
                        "elevation": 50.0,
                        "timezone": "Asia/Kolkata",
                        "confidence": 0.98,
                        "formatted_address": formatted,
                        "speech_summary": speech,
                        "source": "OpenStreetMap High-Resolution Locality Grid"
                    }
        except Exception:
            pass

        return cls.reverse_geocode_offline(latitude, longitude)

    def parse(self, raw_data: Any) -> List[Dict[str, Any]]:
        if isinstance(raw_data, dict):
            return raw_data.get("results") or []
        return []

    def normalize(self, parsed_record: Dict[str, Any]) -> Optional[UnifiedObservation]:
        lat = float(parsed_record.get("latitude", 0.0))
        lng = float(parsed_record.get("longitude", 0.0))
        now = datetime.now(timezone.utc)

        return UnifiedObservation(
            id=f"GEO-{abs(hash(str(lat)+str(lng)))}",
            data_source_id=self.provider_code,
            hazard_type="OTHER",
            location=GeoLocation(
                latitude=lat,
                longitude=lng,
                city_name=parsed_record.get("name"),
                district_name=parsed_record.get("district") or parsed_record.get("admin2"),
                state_name=parsed_record.get("state") or parsed_record.get("admin1")
            ),
            observed_at=now,
            received_at=now,
            severity="minor",
            risk_level="LOW",
            confidence=1.0,
            source_authority=self.name,
            measurements={
                "elevation": parsed_record.get("elevation", 0.0),
                "timezone": parsed_record.get("timezone", "Asia/Kolkata")
            }
        )

    def validate(self, normalized: UnifiedObservation) -> Tuple[bool, Optional[str]]:
        if not (-90.0 <= normalized.location.latitude <= 90.0):
            return False, "Latitude out of bounds"
        if not (-180.0 <= normalized.location.longitude <= 180.0):
            return False, "Longitude out of bounds"
        return True, None
