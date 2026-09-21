-- ============================================================================
-- AGIES ALERT: Multi-Hazard Early Warning System
-- Production PostgreSQL Database Schema with PostGIS Geospatial Extensions
-- Migration: 001_initial_schema.sql
-- ============================================================================

-- 1. Enable Required Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. Define Enum Types
DO $$ BEGIN
    CREATE TYPE user_role_enum AS ENUM ('citizen', 'official', 'admin', 'sdrf_responder', 'ndrf_commander');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE severity_level_enum AS ENUM ('minor', 'moderate', 'warning', 'high', 'critical');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE hazard_type_enum AS ENUM (
        'flood',
        'flash_flood',
        'cyclone',
        'heavy_rain',
        'thunderstorm',
        'lightning',
        'earthquake',
        'landslide',
        'heatwave',
        'coldwave',
        'dense_fog',
        'fire',
        'industrial_fire',
        'chemical_spill',
        'road_blockage',
        'dam_overflow',
        'building_collapse',
        'other'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE alert_status_enum AS ENUM ('active', 'monitoring', 'escalated', 'resolved', 'cancelled');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE report_status_enum AS ENUM (
        'Pending Review',
        'Under Review',
        'Verified',
        'Rejected',
        'Resolved'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE media_type_enum AS ENUM ('image/jpeg', 'image/png', 'image/webp', 'video/mp4', 'video/quicktime', 'application/pdf');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE layer_type_enum AS ENUM ('radar_reflectivity', 'satellite_ir', 'lightning_strikes', 'safe_shelters', 'flood_inundation_zones');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 3. Automatic updated_at Trigger Function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- ============================================================================
-- TABLE 1: users
-- ============================================================================
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    full_name VARCHAR(150) NOT NULL,
    email VARCHAR(255) UNIQUE,
    phone_number VARCHAR(30) UNIQUE,
    password_hash VARCHAR(255),
    role user_role_enum NOT NULL DEFAULT 'citizen',
    state_id VARCHAR(10),
    district VARCHAR(100),
    preferred_language VARCHAR(10) DEFAULT 'en',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    is_verified BOOLEAN NOT NULL DEFAULT FALSE,
    last_login_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone_number);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

CREATE TRIGGER trg_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- TABLE 2: saved_locations
-- ============================================================================
CREATE TABLE IF NOT EXISTS saved_locations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(150) NOT NULL,
    category VARCHAR(50) NOT NULL DEFAULT 'home', -- 'home', 'work', 'family', 'other'
    latitude NUMERIC(10, 7) NOT NULL,
    longitude NUMERIC(10, 7) NOT NULL,
    geom GEOMETRY(Point, 4326),
    address TEXT NOT NULL,
    district VARCHAR(100) NOT NULL,
    state_name VARCHAR(100) NOT NULL,
    state_id VARCHAR(10),
    risk_score_cache INT DEFAULT 50,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_saved_locations_user_id ON saved_locations(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_locations_geom ON saved_locations USING GIST(geom);

CREATE TRIGGER trg_saved_locations_updated_at BEFORE UPDATE ON saved_locations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Automatically populate PostGIS geometry from latitude & longitude
CREATE OR REPLACE FUNCTION set_saved_location_geometry()
RETURNS TRIGGER AS $$
BEGIN
    NEW.geom = ST_SetSRID(ST_MakePoint(NEW.longitude, NEW.latitude), 4326);
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER trg_saved_locations_geom BEFORE INSERT OR UPDATE OF latitude, longitude ON saved_locations FOR EACH ROW EXECUTE FUNCTION set_saved_location_geometry();

-- ============================================================================
-- TABLE 3: alerts
-- ============================================================================
CREATE TABLE IF NOT EXISTS alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bulletin_id VARCHAR(100) UNIQUE NOT NULL,
    title VARCHAR(255) NOT NULL,
    category hazard_type_enum NOT NULL,
    severity severity_level_enum NOT NULL,
    status alert_status_enum NOT NULL DEFAULT 'active',
    headline TEXT NOT NULL,
    description TEXT NOT NULL,
    recommended_action TEXT NOT NULL,
    latitude NUMERIC(10, 7) NOT NULL,
    longitude NUMERIC(10, 7) NOT NULL,
    geom GEOMETRY(Point, 4326),
    radius_km NUMERIC(8, 2) NOT NULL DEFAULT 50.0,
    state_name VARCHAR(100) NOT NULL,
    district VARCHAR(100) NOT NULL,
    source_agency VARCHAR(150) NOT NULL, -- 'IMD', 'CWC', 'NDMA', 'NCS', 'INCOIS'
    safety_guide_slug VARCHAR(50),
    published_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    valid_until TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_alerts_geom ON alerts USING GIST(geom);
CREATE INDEX IF NOT EXISTS idx_alerts_status ON alerts(status);
CREATE INDEX IF NOT EXISTS idx_alerts_severity ON alerts(severity);
CREATE INDEX IF NOT EXISTS idx_alerts_published_at ON alerts(published_at DESC);

CREATE TRIGGER trg_alerts_updated_at BEFORE UPDATE ON alerts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE OR REPLACE FUNCTION set_alert_geometry()
RETURNS TRIGGER AS $$
BEGIN
    NEW.geom = ST_SetSRID(ST_MakePoint(NEW.longitude, NEW.latitude), 4326);
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER trg_alerts_geom BEFORE INSERT OR UPDATE OF latitude, longitude ON alerts FOR EACH ROW EXECUTE FUNCTION set_alert_geometry();

-- ============================================================================
-- TABLE 4: hazard_events
-- ============================================================================
CREATE TABLE IF NOT EXISTS hazard_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_code VARCHAR(100) UNIQUE NOT NULL,
    hazard_type hazard_type_enum NOT NULL,
    title VARCHAR(255) NOT NULL,
    severity severity_level_enum NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'active',
    intensity_metric VARCHAR(100), -- e.g. '54 dBZ', 'M5.2 Richter', '85 km/h gusts'
    latitude NUMERIC(10, 7) NOT NULL,
    longitude NUMERIC(10, 7) NOT NULL,
    geom GEOMETRY(Point, 4326),
    affected_population_estimate INT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_hazard_events_geom ON hazard_events USING GIST(geom);
CREATE INDEX IF NOT EXISTS idx_hazard_events_type ON hazard_events(hazard_type);

CREATE TRIGGER trg_hazard_events_updated_at BEFORE UPDATE ON hazard_events FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE OR REPLACE FUNCTION set_hazard_event_geometry()
RETURNS TRIGGER AS $$
BEGIN
    NEW.geom = ST_SetSRID(ST_MakePoint(NEW.longitude, NEW.latitude), 4326);
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER trg_hazard_events_geom BEFORE INSERT OR UPDATE OF latitude, longitude ON hazard_events FOR EACH ROW EXECUTE FUNCTION set_hazard_event_geometry();

-- ============================================================================
-- TABLE 5: weather_observations
-- ============================================================================
CREATE TABLE IF NOT EXISTS weather_observations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    station_code VARCHAR(50) NOT NULL,
    city_name VARCHAR(100) NOT NULL,
    state_name VARCHAR(100) NOT NULL,
    latitude NUMERIC(10, 7) NOT NULL,
    longitude NUMERIC(10, 7) NOT NULL,
    geom GEOMETRY(Point, 4326),
    temperature_celsius NUMERIC(5, 2) NOT NULL,
    feels_like_celsius NUMERIC(5, 2) NOT NULL,
    humidity_percent NUMERIC(5, 2) NOT NULL,
    wind_speed_kmh NUMERIC(5, 2) NOT NULL,
    wind_direction VARCHAR(10),
    precipitation_probability_percent NUMERIC(5, 2) NOT NULL,
    rainfall_mm NUMERIC(6, 2) DEFAULT 0.0,
    barometric_pressure_hpa NUMERIC(6, 2) NOT NULL,
    uv_index INT DEFAULT 0,
    visibility_km NUMERIC(5, 2) NOT NULL,
    air_quality_index INT,
    weather_condition_text VARCHAR(150) NOT NULL,
    observed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_weather_station_time ON weather_observations(station_code, observed_at DESC);
CREATE INDEX IF NOT EXISTS idx_weather_geom ON weather_observations USING GIST(geom);

CREATE OR REPLACE FUNCTION set_weather_observation_geometry()
RETURNS TRIGGER AS $$
BEGIN
    NEW.geom = ST_SetSRID(ST_MakePoint(NEW.longitude, NEW.latitude), 4326);
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER trg_weather_observations_geom BEFORE INSERT OR UPDATE OF latitude, longitude ON weather_observations FOR EACH ROW EXECUTE FUNCTION set_weather_observation_geometry();

-- ============================================================================
-- TABLE 6: citizen_reports
-- ============================================================================
CREATE TABLE IF NOT EXISTS citizen_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tracking_id VARCHAR(50) UNIQUE NOT NULL, -- e.g. 'AGIES-REP-894215'
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    hazard_type hazard_type_enum NOT NULL,
    latitude NUMERIC(10, 7) NOT NULL,
    longitude NUMERIC(10, 7) NOT NULL,
    geom GEOMETRY(Point, 4326),
    address TEXT NOT NULL,
    description TEXT NOT NULL,
    severity severity_level_enum NOT NULL,
    people_affected INT DEFAULT 0,
    road_blocked BOOLEAN NOT NULL DEFAULT FALSE,
    immediate_danger BOOLEAN NOT NULL DEFAULT FALSE,
    status report_status_enum NOT NULL DEFAULT 'Pending Review',
    reviewed_by UUID REFERENCES users(id) ON DELETE SET NULL,
    review_notes TEXT,
    contact_phone VARCHAR(30),
    is_anonymous BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_citizen_reports_geom ON citizen_reports USING GIST(geom);
CREATE INDEX IF NOT EXISTS idx_citizen_reports_status ON citizen_reports(status);
CREATE INDEX IF NOT EXISTS idx_citizen_reports_created ON citizen_reports(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_citizen_reports_tracking ON citizen_reports(tracking_id);

CREATE TRIGGER trg_citizen_reports_updated_at BEFORE UPDATE ON citizen_reports FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE OR REPLACE FUNCTION set_citizen_report_geometry()
RETURNS TRIGGER AS $$
BEGIN
    NEW.geom = ST_SetSRID(ST_MakePoint(NEW.longitude, NEW.latitude), 4326);
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER trg_citizen_reports_geom BEFORE INSERT OR UPDATE OF latitude, longitude ON citizen_reports FOR EACH ROW EXECUTE FUNCTION set_citizen_report_geometry();

-- ============================================================================
-- TABLE 7: report_media
-- (Stores metadata and object-storage pointers, not large binary blobs)
-- ============================================================================
CREATE TABLE IF NOT EXISTS report_media (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    report_id UUID NOT NULL REFERENCES citizen_reports(id) ON DELETE CASCADE,
    storage_reference VARCHAR(500) NOT NULL, -- e.g. 's3://agies-bucket/reports/2026/09/uuid.jpg'
    file_type media_type_enum NOT NULL,
    file_size BIGINT NOT NULL, -- in bytes
    checksum_sha256 VARCHAR(64),
    is_moderated BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_report_media_report_id ON report_media(report_id);

-- ============================================================================
-- TABLE 8: safety_guides
-- ============================================================================
CREATE TABLE IF NOT EXISTS safety_guides (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug VARCHAR(50) UNIQUE NOT NULL, -- 'floods', 'earthquakes', 'cyclones', etc.
    title VARCHAR(150) NOT NULL,
    category hazard_type_enum NOT NULL,
    status_tag VARCHAR(50) NOT NULL DEFAULT 'ACTIVE WATCH',
    tagline TEXT NOT NULL,
    summary TEXT NOT NULL,
    dos_json JSONB NOT NULL, -- Array of { step, title, text }
    donts_json JSONB NOT NULL, -- Array of { step, title, text }
    video_metadata JSONB, -- { title, duration, thumbnailUrl, instructor, description }
    is_published BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_safety_guides_slug ON safety_guides(slug);
CREATE TRIGGER trg_safety_guides_updated_at BEFORE UPDATE ON safety_guides FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- TABLE 9: analytics_events
-- ============================================================================
CREATE TABLE IF NOT EXISTS analytics_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_type VARCHAR(100) NOT NULL, -- 'hazard_alert_triggered', 'report_filed', 'evacuation_routed'
    hazard_type hazard_type_enum,
    state_id VARCHAR(10),
    district VARCHAR(100),
    latitude NUMERIC(10, 7),
    longitude NUMERIC(10, 7),
    intensity_value NUMERIC(10, 2),
    estimated_affected INT DEFAULT 0,
    metadata JSONB,
    occurred_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_analytics_type_occurred ON analytics_events(event_type, occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_analytics_state ON analytics_events(state_id);

-- ============================================================================
-- TABLE 10: chat_sessions
-- ============================================================================
CREATE TABLE IF NOT EXISTS chat_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    session_token VARCHAR(100) UNIQUE NOT NULL,
    initial_page_context VARCHAR(50) DEFAULT 'homepage',
    location_context VARCHAR(150),
    risk_score_context INT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_chat_sessions_token ON chat_sessions(session_token);
CREATE TRIGGER trg_chat_sessions_updated_at BEFORE UPDATE ON chat_sessions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- TABLE 11: chat_messages
-- ============================================================================
CREATE TABLE IF NOT EXISTS chat_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES chat_sessions(id) ON DELETE CASCADE,
    sender VARCHAR(10) NOT NULL, -- 'user' or 'bot'
    message_text TEXT NOT NULL,
    safety_level VARCHAR(20) DEFAULT 'NORMAL', -- 'NORMAL', 'ADVISORY', 'WARNING', 'CRITICAL'
    sources_cited TEXT[],
    suggested_actions JSONB,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_chat_messages_session ON chat_messages(session_id, created_at ASC);

-- ============================================================================
-- TABLE 12: map_layers
-- ============================================================================
CREATE TABLE IF NOT EXISTS map_layers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    layer_type layer_type_enum NOT NULL,
    layer_name VARCHAR(150) NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    tile_url_template VARCHAR(500),
    data_geojson JSONB,
    refresh_interval_seconds INT DEFAULT 300,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_map_layers_type ON map_layers(layer_type);
CREATE TRIGGER trg_map_layers_updated_at BEFORE UPDATE ON map_layers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
