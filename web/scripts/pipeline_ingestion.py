#!/usr/bin/env python3
"""
AEGIS ALERT: Automated Multi-Hazard Ingestion Pipeline
Fetches GDACS severe weather alerts and Open-Meteo flood telemetry for India,
transforms geometry via Shapely, and performs atomic UPSERTs into PostgreSQL/PostGIS.
"""

import os
import sys
import time
import logging
import json
from datetime import datetime, timezone
from typing import Dict, Any, List

import requests
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry
from shapely.geometry import shape
from shapely.wkt import dumps as to_wkt
from sqlalchemy import create_engine, text

LOG_FORMAT = "%(asctime)s [%(levelname)s] %(name)s: %(message)s"
logging.basicConfig(level=logging.INFO, format=LOG_FORMAT)
logger = logging.getLogger("AegisDataPipeline")

DB_USER = os.getenv("DB_USER", "postgres")
DB_PASS = os.getenv("DB_PASS", "postgres")
DB_HOST = os.getenv("DB_HOST", "localhost")
DB_PORT = os.getenv("DB_PORT", "5432")
DB_NAME = os.getenv("DB_NAME", "aegis_safety_db")

DATABASE_URI = f"postgresql+psycopg2://{DB_USER}:{DB_PASS}@{DB_HOST}:{DB_PORT}/{DB_NAME}"

# Subcontinent Bounding Box: [MinLng, MinLat, MaxLng, MaxLat]
INDIA_BBOX = [68.0, 6.0, 97.5, 37.5]
GDACS_FEED_URL = "https://www.gdacs.org/datareport/resources/GDACS_GeoJSON.geojson"

def build_resilient_session(retries: int = 3, backoff_factor: float = 1.5) -> requests.Session:
    session = requests.Session()
    retry_strategy = Retry(
        total=retries,
        read=retries,
        connect=retries,
        backoff_factor=backoff_factor,
        status_forcelist=[429, 500, 502, 503, 504],
        allowed_methods=["GET", "POST"]
    )
    adapter = HTTPAdapter(max_retries=retry_strategy, pool_connections=10, pool_maxsize=20)
    session.mount("https://", adapter)
    session.mount("http://", adapter)
    session.headers.update({
        "User-Agent": "AegisAlertIndia-DataEngine/2.4 (+https://github.com/25A31A0356/Aegis-web)",
        "Accept": "application/json"
    })
    return session

class HazardDataIngestion:
    def __init__(self, db_uri: str):
        self.engine = create_engine(db_uri, pool_pre_ping=True, pool_size=5, max_overflow=10)
        self.session = build_resilient_session()

    def fetch_gdacs_hazards(self) -> List[Dict[str, Any]]:
        logger.info("Fetching real-time disaster alerts from GDACS...")
        try:
            resp = self.session.get(GDACS_FEED_URL, timeout=15)
            resp.raise_for_status()
            data = resp.json()
        except Exception as e:
            logger.error(f"Failed to fetch GDACS feed: {e}")
            return []

        features = data.get("features", [])
        logger.info(f"Received {len(features)} global events from GDACS. Filtering for India region...")
        
        parsed_records = []
        for feat in features:
            props = feat.get("properties", {})
            geom = feat.get("geometry", {})
            
            if not geom or "coordinates" not in geom:
                continue

            try:
                geom_shape = shape(geom)
                centroid = geom_shape.centroid
                lng, lat = centroid.x, centroid.y
                
                # BBox test
                if not (INDIA_BBOX[0] <= lng <= INDIA_BBOX[2] and INDIA_BBOX[1] <= lat <= INDIA_BBOX[3]):
                    continue
                
                event_type_raw = str(props.get("eventtype", "HAZARD")).upper()
                type_map = {
                    "TC": "cyclone",
                    "FL": "flood",
                    "EQ": "earthquake",
                    "DR": "drought",
                    "WF": "wildfire"
                }
                hazard_type = type_map.get(event_type_raw, "general_alert")
                
                alert_level = props.get("alertlevel", "Green").lower()
                severity_map = {
                    "red": "critical",
                    "orange": "warning",
                    "yellow": "moderate",
                    "green": "advisory"
                }
                severity = severity_map.get(alert_level, "moderate")
                event_id = f"GDACS-{props.get('eventtype', 'EV')}-{props.get('eventid', int(time.time()))}"
                
                parsed_records.append({
                    "event_id": event_id,
                    "hazard_type": hazard_type,
                    "severity_level": severity,
                    "title": props.get("name", f"Natural Hazard Incident ({hazard_type.upper()})"),
                    "description": props.get("description", "Active multi-agency monitored disaster event."),
                    "source_agency": "GDACS / IMD Relay",
                    "location_name": props.get("country", "India"),
                    "state_code": "IN",
                    "impact_population": props.get("population", 0) or 0,
                    "alert_score": float(props.get("alertscore", 5.0) or 5.0),
                    "centroid_wkt": f"SRID=4326;POINT({lng} {lat})",
                    "impact_geometry_wkt": f"SRID=4326;{to_wkt(geom_shape)}",
                    "issued_at": props.get("fromdate", datetime.now(timezone.utc).isoformat()),
                    "expires_at": props.get("todate", None)
                })
            except Exception as parse_err:
                logger.warning(f"Error parsing feature {props.get('eventid')}: {parse_err}")
                continue

        logger.info(f"Successfully processed {len(parsed_records)} active hazards in Indian territory.")
        return parsed_records

    def upsert_hazards(self, records: List[Dict[str, Any]]) -> int:
        if not records:
            logger.info("No hazard records to upsert.")
            return 0

        upsert_query = text("""
            INSERT INTO hazard_events (
                event_id, hazard_type, severity_level, title, description,
                source_agency, location_name, state_code, impact_population,
                alert_score, centroid, impact_geometry, issued_at, expires_at
            ) VALUES (
                :event_id, :hazard_type, :severity_level, :title, :description,
                :source_agency, :location_name, :state_code, :impact_population,
                :alert_score, ST_GeomFromEWKT(:centroid_wkt), ST_GeomFromEWKT(:impact_geometry_wkt),
                :issued_at, :expires_at
            )
            ON CONFLICT (event_id) DO UPDATE SET
                severity_level = EXCLUDED.severity_level,
                title = EXCLUDED.title,
                description = EXCLUDED.description,
                impact_population = EXCLUDED.impact_population,
                alert_score = EXCLUDED.alert_score,
                centroid = EXCLUDED.centroid,
                impact_geometry = EXCLUDED.impact_geometry,
                expires_at = EXCLUDED.expires_at,
                updated_at = NOW();
        """)

        with self.engine.begin() as conn:
            for rec in records:
                conn.execute(upsert_query, rec)
                
        logger.info(f"Database commit successful: {len(records)} hazards upserted.")
        return len(records)

    def run_pipeline(self):
        logger.info("Starting Aegis Data Ingestion Routine...")
        records = self.fetch_gdacs_hazards()
        self.upsert_hazards(records)
        logger.info("Ingestion pipeline cycle complete.")

if __name__ == "__main__":
    ingestion_service = HazardDataIngestion(DATABASE_URI)
    ingestion_service.run_pipeline()
