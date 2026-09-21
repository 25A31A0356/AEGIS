-- ============================================================================
-- AGIES ALERT: Production Reference Data
-- Seed: 001_production_reference_data.sql
-- Contains verified disaster preparedness guides and authoritative baseline metadata
-- ============================================================================

INSERT INTO safety_guides (slug, title, category, status_tag, tagline, summary, dos_json, donts_json, video_metadata)
VALUES
(
    'floods',
    'Floods Safety Guide',
    'flood',
    'ACTIVE WATCH',
    'Move to higher ground, stay informed and never walk or drive through moving water.',
    'Urban and riverine floodwaters can rise rapidly within minutes. Flash floods carry strong undertows, debris, and electrical hazards.',
    '[
        {"step": 1, "title": "Move to higher ground", "text": "Move to higher ground as soon as flooding begins. Do not wait for mandatory evacuation orders if water levels are rising rapidly around you."},
        {"step": 2, "title": "Keep emergency kit ready", "text": "Keep emergency supplies, clean drinking water, waterproof battery torch, power banks, and essential medications in a sealed waterproof bag."},
        {"step": 3, "title": "Turn off main utilities", "text": "Turn off electricity, main gas valves, and water supplies at the main switches before evacuating to prevent fire and electrocution."},
        {"step": 4, "title": "Follow official broadcasts", "text": "Follow official weather updates, IMD bulletins, and state disaster management authority alerts via radio, SMS, or the AGIES ALERT portal."}
    ]'::jsonb,
    '[
        {"step": 1, "title": "Do not walk through moving water", "text": "Never walk through moving floodwater. Just 15 cm (6 inches) of rushing water can knock a full-grown adult off their feet."},
        {"step": 2, "title": "Do not drive in flooded areas", "text": "Do not drive into flooded areas or underpasses. 30 cm of water can float small cars, and 60 cm can sweep away heavy SUVs."},
        {"step": 3, "title": "Avoid electrical poles & cables", "text": "Never touch fallen power lines, submerged electrical poles, or wet electrical appliances. Report snapped cables immediately."},
        {"step": 4, "title": "Do not drink untreated water", "text": "Do not consume tap water or open well water in flooded zones. Drink only boiled, filtered, or chlorine-treated sealed bottled water."}
    ]'::jsonb,
    '{
        "title": "Flood Survival & Urban Evacuation Masterclass",
        "duration": "4 min 30 sec",
        "thumbnailUrl": "https://images.unsplash.com/photo-1547683905-f686c993aae5?w=1200",
        "instructor": "National Disaster Response Force (NDRF)",
        "description": "Essential protocols on escaping stranded vehicles, avoiding open drains, and emergency rooftop signaling during extreme urban deluge.",
        "keyTakeaways": [
            "Learn how to spot and avoid invisible open manholes submerged in water",
            "Emergency procedures when trapped inside a waterlogged vehicle",
            "Water purification and disease prevention after severe inundation"
        ]
    }'::jsonb
),
(
    'earthquakes',
    'Earthquakes Safety Guide',
    'earthquake',
    'READINESS ACTIVE',
    'Drop, Cover, and Hold On. Protect your head and neck from falling debris.',
    'Earthquakes strike without warning. Structural collapses, broken glass, falling parapets, and secondary fires cause the majority of injuries.',
    '[
        {"step": 1, "title": "Drop onto your hands & knees", "text": "Drop down onto your hands and knees. This position protects you from being knocked down and allows you to crawl to shelter."},
        {"step": 2, "title": "Cover head & neck", "text": "Cover your head and neck under a sturdy table or desk. If no shelter is nearby, cover your head with your arms against an interior wall."},
        {"step": 3, "title": "Hold on until shaking stops", "text": "Hold on to your shelter with one hand; be prepared to move with your shelter if it shifts during violent shaking."},
        {"step": 4, "title": "Evacuate via stairs", "text": "Once shaking stops, evacuate using stairwells only. Check for fire, gas leaks, and structural fissures before exiting."}
    ]'::jsonb,
    '[
        {"step": 1, "title": "Do not use elevators", "text": "Never use elevators during or immediately after an earthquake. Power outages can trap you inside shafts indefinitely."},
        {"step": 2, "title": "Do not stand near windows", "text": "Stay away from glass windows, heavy mirrors, hanging chandeliers, tall bookcases, and unanchored furniture."},
        {"step": 3, "title": "Do not run outside during shaking", "text": "Do not attempt to run outside during active shaking. Falling brick facades and glass shards cause severe trauma."},
        {"step": 4, "title": "Do not light matches or gas", "text": "Do not use lighters, matches, or electrical switches until you have verified there are no gas pipe leaks."}
    ]'::jsonb,
    '{
        "title": "Earthquake Structural Survival & Drop-Cover-Hold",
        "duration": "3 min 45 sec",
        "thumbnailUrl": "https://images.unsplash.com/photo-1588681664899-f142ff2dc9b1?w=1200",
        "instructor": "National Center for Seismology (NCS)",
        "description": "Comprehensive visual guide on indoor survival positioning and surviving aftershocks safely.",
        "keyTakeaways": [
            "Why the Triangle of Life theory is dangerous and why Drop, Cover, Hold is proven",
            "How to shut off gas mains and locate safe structural load-bearing zones",
            "Emergency communication protocols when mobile networks are congested"
        ]
    }'::jsonb
),
(
    'cyclones',
    'Cyclones Safety Guide',
    'cyclone',
    'COASTAL ALERT',
    'Secure loose items, board up windows, and stay indoors until the cyclone eyewall completely passes.',
    'Cyclones generate gale-force winds exceeding 120 km/h, catastrophic storm surges, and torrential flash rainfall along coastal corridors.',
    '[
        {"step": 1, "title": "Board & tape glass windows", "text": "Secure all exterior windows with hurricane shutters or tape large glass panes in an X pattern to prevent flying shards."},
        {"step": 2, "title": "Tie down loose outdoor assets", "text": "Bring inside or firmly anchor rooftop tin sheets, satellite dishes, air-conditioner units, and loose outdoor furniture."},
        {"step": 3, "title": "Stock non-perishable rations", "text": "Ensure at least 72 hours of clean drinking water, non-perishable canned food, charged power banks, and dry batteries."},
        {"step": 4, "title": "Evacuate if near coastline", "text": "If residing in low-lying coastal or thatched roof zones, evacuate immediately to designated reinforced cyclone shelters."}
    ]'::jsonb,
    '[
        {"step": 1, "title": "Do not venture into open sea", "text": "Fishermen, mariners, and tourists must not enter sea waters or approach beaches under any circumstances during warning."},
        {"step": 2, "title": "Do not go out during the eye", "text": "If winds suddenly calm down, DO NOT go outdoors. The calm eye is temporary; reverse violent winds will strike in minutes."},
        {"step": 3, "title": "Do not touch downed cables", "text": "Never touch sagging or broken electric wires. Treat all fallen lines as live high-voltage cables."},
        {"step": 4, "title": "Do not spread rumors", "text": "Do not forward unverified voice notes or rumors. Rely solely on official IMD bulletins and district alerts."}
    ]'::jsonb,
    '{
        "title": "Cyclone Preparedness & Storm Surge Evacuation",
        "duration": "5 min 10 sec",
        "thumbnailUrl": "https://images.unsplash.com/photo-1527482797697-8795b05a13fe?w=1200",
        "instructor": "Odisha Disaster Rapid Action Force (ODRAF)",
        "description": "Best practices for residential reinforcement and turn-by-turn navigation to multi-purpose cyclone shelters.",
        "keyTakeaways": [
            "Understanding cyclone warning stages: Watch, Alert, Warning, and Landfall",
            "How to pack a lightweight 72-hour grab-and-go disaster kit",
            "Safe shelter protocols and sanitation in relief camps"
        ]
    }'::jsonb
)
ON CONFLICT (slug) DO UPDATE SET
    title = EXCLUDED.title,
    summary = EXCLUDED.summary,
    dos_json = EXCLUDED.dos_json,
    donts_json = EXCLUDED.donts_json,
    video_metadata = EXCLUDED.video_metadata,
    updated_at = CURRENT_TIMESTAMP;
