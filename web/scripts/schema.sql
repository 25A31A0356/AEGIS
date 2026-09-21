-- =================================================================
-- 🛡️ AEGIS ALERT: PostgreSQL 16 + PostGIS Multi-Hazard Schema
-- =================================================================

CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Hazard Events Table
CREATE TABLE IF NOT EXISTS hazard_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id VARCHAR(64) UNIQUE NOT NULL,
    hazard_type VARCHAR(32) NOT NULL,
    severity_level VARCHAR(16) NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    source_agency VARCHAR(64) NOT NULL,
    location_name VARCHAR(128) NOT NULL,
    state_code VARCHAR(8),
    impact_population BIGINT DEFAULT 0,
    max_wind_kmh NUMERIC(6, 2),
    rainfall_accum_mm NUMERIC(6, 2),
    alert_score NUMERIC(4, 2),
    event_status VARCHAR(20) DEFAULT 'active',
    centroid GEOMETRY(Point, 4326) NOT NULL,
    impact_geometry GEOMETRY(Geometry, 4326),
    issued_at TIMESTAMPTZ NOT NULL,
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Time-Series Telemetry Table
CREATE TABLE IF NOT EXISTS weather_telemetry (
    id BIGSERIAL,
    station_id VARCHAR(32) NOT NULL,
    station_name VARCHAR(128) NOT NULL,
    state VARCHAR(64) NOT NULL,
    coordinates GEOMETRY(Point, 4326) NOT NULL,
    temperature_c NUMERIC(4, 2) NOT NULL,
    feels_like_c NUMERIC(4, 2),
    humidity_pct NUMERIC(5, 2) NOT NULL,
    wind_speed_kmh NUMERIC(5, 2) NOT NULL,
    wind_direction_deg NUMERIC(5, 2),
    precipitation_prob NUMERIC(5, 2),
    precipitation_mm NUMERIC(6, 2) DEFAULT 0.0,
    surface_pressure_hpa NUMERIC(6, 2),
    aqi_index INT,
    pm25_ugm3 NUMERIC(6, 2),
    recorded_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (id, recorded_at)
);

-- Spatial & B-Tree Indexes
CREATE INDEX IF NOT EXISTS idx_hazard_impact_geom ON hazard_events USING GIST (impact_geometry);
CREATE INDEX IF NOT EXISTS idx_hazard_centroid ON hazard_events USING GIST (centroid);
CREATE INDEX IF NOT EXISTS idx_weather_coords ON weather_telemetry USING GIST (coordinates);
CREATE INDEX IF NOT EXISTS idx_hazard_status_type ON hazard_events (event_status, hazard_type, severity_level);
CREATE INDEX IF NOT EXISTS idx_hazard_issued_at ON hazard_events (issued_at DESC);
CREATE INDEX IF NOT EXISTS idx_weather_station_time ON weather_telemetry (station_id, recorded_at DESC);
