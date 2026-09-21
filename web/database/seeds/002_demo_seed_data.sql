-- ============================================================================
-- AGIES ALERT: Demo / Staging Seed Data
-- Seed: 002_demo_seed_data.sql
-- Contains representative citizen & official users, active alerts, reports, and layers
-- ============================================================================

-- 1. Insert Demo Users
INSERT INTO users (id, full_name, email, phone_number, role, state_id, district, is_verified)
VALUES
(
    'a0000000-0000-0000-0000-000000000001',
    'Rohan Sharma',
    'rohan.sharma@example.com',
    '+919876543210',
    'citizen',
    'MH',
    'Mumbai Suburban',
    TRUE
),
(
    'a0000000-0000-0000-0000-000000000002',
    'Dr. A. Verma',
    'chief.ops@ndma.gov.in',
    '+919432109876',
    'ndrf_commander',
    'DL',
    'New Delhi',
    TRUE
),
(
    'a0000000-0000-0000-0000-000000000003',
    'Pooja Sen',
    'pooja.sen@example.com',
    '+919123456789',
    'citizen',
    'WB',
    'Kolkata',
    TRUE
)
ON CONFLICT (id) DO NOTHING;

-- 2. Insert User Saved Locations
INSERT INTO saved_locations (id, user_id, name, category, latitude, longitude, address, district, state_name, state_id, risk_score_cache)
VALUES
(
    'b0000000-0000-0000-0000-000000000001',
    'a0000000-0000-0000-0000-000000000001',
    'Home (Santacruz West)',
    'home',
    19.0820,
    72.8410,
    'Flat 402, Sea View Heights, Santacruz West, Mumbai, Maharashtra',
    'Mumbai Suburban',
    'Maharashtra',
    'MH',
    78
),
(
    'b0000000-0000-0000-0000-000000000002',
    'a0000000-0000-0000-0000-000000000001',
    'Office (BKC Complex)',
    'work',
    19.0600,
    72.8650,
    'Tower 2, G-Block, Bandra-Kurla Complex, Mumbai, Maharashtra',
    'Mumbai City',
    'Maharashtra',
    'MH',
    65
),
(
    'b0000000-0000-0000-0000-000000000003',
    'a0000000-0000-0000-0000-000000000001',
    'Parents (Pune Kothrud)',
    'family',
    18.5074,
    73.8077,
    'Plot 14, Mayur Colony, Kothrud, Pune, Maharashtra',
    'Pune',
    'Maharashtra',
    'MH',
    28
)
ON CONFLICT (id) DO NOTHING;

-- 3. Insert Active Alerts
INSERT INTO alerts (id, bulletin_id, title, category, severity, status, headline, description, recommended_action, latitude, longitude, radius_km, state_name, district, source_agency, safety_guide_slug, published_at, valid_until)
VALUES
(
    'c0000000-0000-0000-0000-000000000001',
    'IMD-BULL-2026-0891',
    'Red Warning: Severe Convective Rainfall & Urban Inundation',
    'flood',
    'critical',
    'active',
    'Extreme precipitation (>115 mm/hr) detected over coastal belt with severe waterlogging risk.',
    'IMD Doppler Radar indicates deep cumulonimbus cell movement along low-lying drainage catchments.',
    'Move to higher ground. Avoid low-lying subways and flooded underpasses.',
    19.0760,
    72.8777,
    35.0,
    'Maharashtra',
    'Mumbai Suburban',
    'India Meteorological Department (IMD)',
    'floods',
    CURRENT_TIMESTAMP - INTERVAL '20 minutes',
    CURRENT_TIMESTAMP + INTERVAL '6 hours'
),
(
    'c0000000-0000-0000-0000-000000000002',
    'CWC-HYD-2026-0412',
    'Orange Alert: Godavari River Basin Level Exceeding Danger Mark',
    'flood',
    'warning',
    'active',
    'Inflow at upstream barrages rising at 18 cm/hr; low-lying banks under active watch.',
    'Central Water Commission hydro-sensors confirm rapid water level rise across downstream sectors.',
    'Evacuate riverbank settlements to designated high-elevation relief shelters.',
    17.5500,
    80.6200,
    60.0,
    'Telangana',
    'Bhadradri Kothagudem',
    'Central Water Commission (CWC)',
    'floods',
    CURRENT_TIMESTAMP - INTERVAL '45 minutes',
    CURRENT_TIMESTAMP + INTERVAL '12 hours'
),
(
    'c0000000-0000-0000-0000-000000000003',
    'IMD-CYC-2026-0774',
    'Cyclone Watch: Severe Tropical Storm System Formulating',
    'cyclone',
    'critical',
    'active',
    'Deep depression over Bay of Bengal intensifies with squally winds up to 95 km/h.',
    'Cyclone track projection indicates landfall trajectory towards Odisha coastline in 36 hours.',
    'Complete rooftop reinforcement. Fishermen strictly advised not to venture into open seas.',
    19.8135,
    85.8312,
    120.0,
    'Odisha',
    'Puri',
    'IMD Cyclone Warning Division',
    'cyclones',
    CURRENT_TIMESTAMP - INTERVAL '80 minutes',
    CURRENT_TIMESTAMP + INTERVAL '24 hours'
)
ON CONFLICT (id) DO NOTHING;

-- 4. Insert Citizen Reports (with status enum values matching requirements)
INSERT INTO citizen_reports (id, tracking_id, user_id, hazard_type, latitude, longitude, address, description, severity, people_affected, road_blocked, immediate_danger, status, contact_phone, is_anonymous, created_at)
VALUES
(
    'd0000000-0000-0000-0000-000000000001',
    'AGIES-REP-894215',
    'a0000000-0000-0000-0000-000000000001',
    'flood',
    19.0760,
    72.8777,
    'Milan Subway East Junction, Santacruz, Mumbai, Maharashtra',
    'Water level reached 3 feet inside the subway. Two vehicles stalled, traffic completely halted.',
    'high',
    150,
    TRUE,
    TRUE,
    'Verified',
    '+919876543210',
    FALSE,
    CURRENT_TIMESTAMP - INTERVAL '35 minutes'
),
(
    'd0000000-0000-0000-0000-000000000002',
    'AGIES-REP-641209',
    'a0000000-0000-0000-0000-000000000001',
    'road_blockage',
    19.0596,
    72.8656,
    'Bandra-Kurla Complex Connecting Link Road, Mumbai, Maharashtra',
    'Heavy wind gust brought down an ancient tree across both northbound lanes, damaging power cables.',
    'warning',
    40,
    TRUE,
    FALSE,
    'Under Review',
    NULL,
    TRUE,
    CURRENT_TIMESTAMP - INTERVAL '70 minutes'
),
(
    'd0000000-0000-0000-0000-000000000003',
    'AGIES-REP-310582',
    'a0000000-0000-0000-0000-000000000003',
    'lightning',
    22.5726,
    88.3639,
    'Salt Lake Sector V, Kolkata, West Bengal',
    'Multiple cloud-to-ground strikes on transmission pole resulting in local transformer flare.',
    'critical',
    200,
    FALSE,
    TRUE,
    'Pending Review',
    '+919123456789',
    FALSE,
    CURRENT_TIMESTAMP - INTERVAL '15 minutes'
)
ON CONFLICT (id) DO NOTHING;

-- 5. Insert Report Media (Storage References / S3 Pointers)
INSERT INTO report_media (id, report_id, storage_reference, file_type, file_size, checksum_sha256, is_moderated)
VALUES
(
    'e0000000-0000-0000-0000-000000000001',
    'd0000000-0000-0000-0000-000000000001',
    's3://agies-incident-media/2026/09/milan-subway-flood-01.jpg',
    'image/jpeg',
    2485920,
    'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    TRUE
),
(
    'e0000000-0000-0000-0000-000000000002',
    'd0000000-0000-0000-0000-000000000002',
    's3://agies-incident-media/2026/09/bkc-tree-blockage-02.jpg',
    'image/jpeg',
    1894210,
    'a1b2c3d4e5f67890123456789abcdef0123456789abcdef0123456789abcdef0',
    TRUE
)
ON CONFLICT (id) DO NOTHING;

-- 6. Insert Live Map Layers
INSERT INTO map_layers (id, layer_type, layer_name, is_active, tile_url_template, refresh_interval_seconds)
VALUES
(
    'f0000000-0000-0000-0000-000000000001',
    'radar_reflectivity',
    'Doppler Weather Radar (IMD DWR-04 India Grid)',
    TRUE,
    'https://mausam.imd.gov.in/radar/tiles/{z}/{x}/{y}.png',
    180
),
(
    'f0000000-0000-0000-0000-000000000002',
    'satellite_ir',
    'INSAT-3D/3DR Multispectral Infrared Band',
    TRUE,
    'https://mosdac.gov.in/satellite/tiles/ir1/{z}/{x}/{y}.png',
    900
),
(
    'f0000000-0000-0000-0000-000000000003',
    'lightning_strikes',
    'Real-time Electrostatic Strike Detection Network',
    TRUE,
    NULL,
    30
)
ON CONFLICT (id) DO NOTHING;
