export interface SafetyGuideItem {
  id: string;
  name: string;
  category: string;
  statusTag: string;
  tagline: string;
  summary: string;
  dos: Array<{ step: number; title: string; text: string }>;
  donts: Array<{ step: number; title: string; text: string }>;
  video: {
    title: string;
    duration: string;
    thumbnailUrl: string;
    description: string;
    instructor: string;
    keyTakeaways: string[];
  };
}

export const SAFETY_GUIDES: Record<string, SafetyGuideItem> = {
  floods: {
    id: 'floods',
    name: 'Floods',
    category: 'flood',
    statusTag: 'ACTIVE WATCH',
    tagline: 'Move to higher ground, stay informed and never walk or drive through moving water.',
    summary:
      'Urban and riverine floodwaters can rise rapidly within minutes. Flash floods carry strong undertows, debris, and electrical hazards.',
    dos: [
      {
        step: 1,
        title: 'Move to higher ground',
        text: 'Move to higher ground as soon as flooding begins. Do not wait for mandatory orders if water is rising.',
      },
      {
        step: 2,
        title: 'Keep emergency kit ready',
        text: 'Keep emergency supplies, clean drinking water, waterproof battery torch and essential medicines ready.',
      },
      {
        step: 3,
        title: 'Isolate utilities safely',
        text: 'Switch off main electricity fuses and gas cylinders before leaving if it is safe to do so.',
      },
      {
        step: 4,
        title: 'Follow designated evacuation paths',
        text: 'Follow official evacuation routes and disaster management updates from local municipal authorities.',
      },
    ],
    donts: [
      {
        step: 1,
        title: 'Never drive into floodwater',
        text: 'Do not walk or drive through moving floodwater. 6 inches of water can sweep a vehicle away.',
      },
      {
        step: 2,
        title: 'Avoid submerged electrical gear',
        text: 'Do not touch electrical equipment or switches when standing in water or wet surfaces.',
      },
      {
        step: 3,
        title: 'Never ignore evacuation sirens',
        text: 'Do not ignore official evacuation instructions or delay departure to protect physical belongings.',
      },
      {
        step: 4,
        title: 'Do not return prematurely',
        text: 'Do not return home until emergency authorities officially declare the area safe and structurally inspected.',
      },
    ],
    video: {
      title: 'NDMA Protocol: Flood Evacuation & Floodwater Survival Masterclass',
      duration: '4:28 mins',
      thumbnailUrl:
        'https://images.unsplash.com/photo-1547683905-f686c993aae5?auto=format&fit=crop&w=800&q=80',
      description:
        'Official National Disaster Management Authority visual guidelines on river basin inundation, identifying safe refuge zones, and emergency distress signaling.',
      instructor: 'Senior Civil Defense Trainer',
      keyTakeaways: [
        'How to identify safe higher elevations during rapid water level rise',
        'Improvised flotation techniques using common household plastic containers',
        'Water disinfection protocol: 1 minute rolling boil or sodium hypochlorite purification',
      ],
    },
  },

  earthquakes: {
    id: 'earthquakes',
    name: 'Earthquakes',
    category: 'earthquake',
    statusTag: 'CRITICAL PROTOCOL',
    tagline: 'Drop, Cover, and Hold On. Protect your head and stay clear of unreinforced structures.',
    summary:
      'Ground tremors occur with zero advance warning. Taking immediate protective posture saves lives within the first 10 seconds of P-wave detection.',
    dos: [
      {
        step: 1,
        title: 'Drop to your hands and knees',
        text: 'DROP to your hands and knees immediately to prevent being knocked over by severe horizontal ground shear.',
      },
      {
        step: 2,
        title: 'Take shelter under sturdy tables',
        text: 'COVER your head and neck under a sturdy table, desk, or against an interior load-bearing wall.',
      },
      {
        step: 3,
        title: 'Hold on firmly until shaking stops',
        text: 'HOLD ON to your shelter until shaking stops completely, and be prepared for strong aftershock sequences.',
      },
      {
        step: 4,
        title: 'Evacuate via stairs when tremor ceases',
        text: 'Use marked stairwells once shaking ceases. Check gas lines for leaks and turn off main breakers.',
      },
    ],
    donts: [
      {
        step: 1,
        title: 'Do not run outside during shaking',
        text: 'Do not run outside or into hallways during active shaking; falling bricks and glass are the #1 hazard.',
      },
      {
        step: 2,
        title: 'Never use elevators',
        text: 'Do not use elevators or lifts under any circumstances during or immediately following a tremor.',
      },
      {
        step: 3,
        title: 'Do not stand near exterior glass',
        text: 'Do not stand near windows, glass partitions, heavy bookshelves, or suspended light fixtures.',
      },
      {
        step: 4,
        title: 'Do not light matches or open flames',
        text: 'Do not use candles, matches, or lighters due to potential ruptured domestic gas lines.',
      },
    ],
    video: {
      title: 'Seismic Resilience: Drop, Cover, Hold On Demonstration',
      duration: '3:45 mins',
      thumbnailUrl:
        'https://images.unsplash.com/photo-1590247813693-5541d1c609fd?auto=format&fit=crop&w=800&q=80',
      description:
        'Practical demonstration of indoor and outdoor posture during seismic tremors, stairwell evacuation, and aftershock safety.',
      instructor: 'National Institute of Disaster Management (NIDM)',
      keyTakeaways: [
        'Triangle of Life vs Drop-Cover-Hold: Official proven survivability data',
        'Securing heavy appliances and wall hangings before an event',
        'Post-earthquake utility inspection checklist',
      ],
    },
  },

  tsunamis: {
    id: 'tsunamis',
    name: 'Tsunamis',
    category: 'tsunami',
    statusTag: 'COASTAL ALERT',
    tagline: 'If you feel an earthquake near the coast or see water receding, flee inland to high ground immediately.',
    summary:
      'Tsunami wave trains travel across open ocean at jet speeds. The first wave is rarely the largest; surging water can persist for hours.',
    dos: [
      {
        step: 1,
        title: 'Move inland and uphill immediately',
        text: 'Run inland at least 2 kilometers or ascend at least 30 meters above sea level as fast as possible.',
      },
      {
        step: 2,
        title: 'Heed natural warning signs',
        text: 'Treat severe ground shaking or sudden receding coastal water as an immediate natural evacuation alarm.',
      },
      {
        step: 3,
        title: 'Seek multi-story concrete structures',
        text: 'If unable to flee inland, climb to the 4th floor or roof of a reinforced concrete building.',
      },
      {
        step: 4,
        title: 'Maintain battery radio communication',
        text: 'Listen to emergency broadcasts and all-clear announcements from INCOIS and disaster authorities.',
      },
    ],
    donts: [
      {
        step: 1,
        title: 'Never go to the beach to watch waves',
        text: 'Do not visit beaches or harbours to observe receding water or incoming waves. If you see the wave, you are too close.',
      },
      {
        step: 2,
        title: 'Do not return after the first surge',
        text: 'Do not return to coastal areas after the first wave passes. Subsequent waves are often substantially larger.',
      },
      {
        step: 3,
        title: 'Do not use coastal highway routes',
        text: 'Do not drive along low-elevation coastal bridges or causeways vulnerable to surge washouts.',
      },
      {
        step: 4,
        title: 'Do not board grounded marine vessels',
        text: 'Do not attempt to board grounded boats or ships stranded on tidal flats.',
      },
    ],
    video: {
      title: 'INCOIS Coastal Early Warning: Tsunami Evacuation Drills',
      duration: '5:10 mins',
      thumbnailUrl:
        'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80',
      description:
        'Coastal defense strategies, identifying vertical evacuation structures, and understanding Indian Ocean early warning buoys.',
      instructor: 'Indian National Centre for Ocean Information Services',
      keyTakeaways: [
        'Recognizing seismic sea-withdrawal cues',
        'Vertical evacuation criteria for reinforced structures',
        'Maritime vessel deep-water safety protocols (depths > 100 fathoms)',
      ],
    },
  },

  cyclones: {
    id: 'cyclones',
    name: 'Cyclones',
    category: 'cyclone',
    statusTag: 'EXTREME GALE WATCH',
    tagline: 'Board up windows, secure loose roofs, and evacuate designated storm surge zones before landfall.',
    summary:
      'Tropical cyclones combine Category 3-5 gale winds, torrential downpours, and deadly marine storm surges along coastal belts.',
    dos: [
      {
        step: 1,
        title: 'Fasten loose roof sheets and boards',
        text: 'Secure tin roofing, outdoor furniture, billboards, and trim weak tree branches near your dwelling.',
      },
      {
        step: 2,
        title: 'Move to fortified cyclone shelters',
        text: 'Relocate to reinforced cyclone multi-purpose shelters well before landfall winds exceed 60 km/h.',
      },
      {
        step: 3,
        title: 'Store potable water & non-perishable food',
        text: 'Stockpile 3 days of clean drinking water, dry rations, candles, and charged emergency power banks.',
      },
      {
        step: 4,
        title: 'Keep tuned to IMD bulletins',
        text: 'Follow India Meteorological Department (IMD) cyclone bulletins and coordinate alerts via disaster SMS.',
      },
    ],
    donts: [
      {
        step: 1,
        title: 'Do not venture outdoors during the eye',
        text: 'Do not leave shelter when the eye of the storm passes. Calm winds are brief and will violently reverse.',
      },
      {
        step: 2,
        title: 'Do not shelter in thatched huts',
        text: 'Do not remain in unreinforced masonry or thatched structures located within 10 km of the shoreline.',
      },
      {
        step: 3,
        title: 'Do not touch fallen transmission lines',
        text: 'Avoid all snapped overhead power lines and submerged electrical transformers.',
      },
      {
        step: 4,
        title: 'Do not spread unverified rumors',
        text: 'Do not forward panic messages or speculative landfall locations on social media.',
      },
    ],
    video: {
      title: 'Cyclone Readiness: Structural Fortification & Landfall Safety',
      duration: '4:15 mins',
      thumbnailUrl:
        'https://images.unsplash.com/photo-1527482797697-8795b05a13fe?auto=format&fit=crop&w=800&q=80',
      description:
        'Step-by-step cyclone preparedness guide covering window taping, roof strapping, storm surge maps, and post-cyclone recovery.',
      instructor: 'IMD Coastal Disaster Division',
      keyTakeaways: [
        'Anatomy of a tropical cyclone: Eye, Eyewall, and Rainbands',
        'Storm surge vulnerability estimation based on coastal bathymetry',
        'Safe restoration of electrical appliances after saline water immersion',
      ],
    },
  },

  heatwaves: {
    id: 'heatwaves',
    name: 'Heatwaves',
    category: 'heatwave',
    statusTag: 'THERMAL ADVISORY',
    tagline: 'Hydrate constantly, avoid direct sunlight between 11 AM and 4 PM, and recognize heat stroke symptoms.',
    summary:
      'Sustained ambient temperatures exceeding 42°C with dry northern winds cause severe dehydration, hyperthermia, and fatal heat stroke.',
    dos: [
      {
        step: 1,
        title: 'Drink abundant fluids and ORS',
        text: 'Drink water frequently even if not thirsty. Consume ORS, lemon water, buttermilk (chaas), and tender coconut.',
      },
      {
        step: 2,
        title: 'Wear loose, light-colored cotton clothing',
        text: 'Wear lightweight, breathable cotton garments. Use umbrellas, wide-brim hats, or headscarves outdoors.',
      },
      {
        step: 3,
        title: 'Keep indoor spaces insulated and shaded',
        text: 'Keep curtains and blinds closed during peak daylight hours. Use wet towels and fans to cool indoor air.',
      },
      {
        step: 4,
        title: 'Check on elderly and vulnerable persons',
        text: 'Regularly monitor children, pregnant women, pets, and senior citizens for signs of heat exhaustion.',
      },
    ],
    donts: [
      {
        step: 1,
        title: 'Do not do strenuous outdoor work at noon',
        text: 'Avoid heavy physical exertion and direct sun exposure between 11:00 AM and 4:00 PM.',
      },
      {
        step: 2,
        title: 'Never leave children or pets inside parked cars',
        text: 'Never leave children, elderly persons, or pets in locked vehicles; cabin temperatures reach 60°C within minutes.',
      },
      {
        step: 3,
        title: 'Avoid dehydrating caffeinated beverages',
        text: 'Do not consume high-sugar soft drinks, excessive alcohol, or concentrated coffee which dehydrate the body.',
      },
      {
        step: 4,
        title: 'Do not neglect dizziness or rapid pulse',
        text: 'Do not ignore symptoms of heat stroke (dry hot skin, confusion, vomiting, rapid heartbeat). Call 108 immediately.',
      },
    ],
    video: {
      title: 'Beat the Heat: Heat Stroke Prevention & Emergency First Aid',
      duration: '3:20 mins',
      thumbnailUrl:
        'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=800&q=80',
      description:
        'Clinical guidelines on differentiating heat cramps, heat exhaustion, and heat stroke, with step-by-step cold immersion first aid.',
      instructor: 'National Health Mission & Red Cross',
      keyTakeaways: [
        'How to prepare instant home ORS rehydration solution',
        'Emergency rapid cooling techniques for heat stroke patients',
        'Occupational safety guidelines for outdoor construction and agrarian labor',
      ],
    },
  },

  firestorms: {
    id: 'firestorms',
    name: 'Firestorms',
    category: 'wildfire',
    statusTag: 'CRITICAL HAZARD',
    tagline: 'Create defensible space around dwellings, evacuate upwind of smoke, and know primary fire exits.',
    summary:
      'Forest and urban firestorms generate intense radiant heat, toxic smoke plumes, and gale-force convective ember storms.',
    dos: [
      {
        step: 1,
        title: 'Create 30-meter defensible clearance',
        text: 'Clear dry brush, dead leaves, firewood piles, and flammable clutter within 30 meters of your building.',
      },
      {
        step: 2,
        title: 'Evacuate early along designated upwind routes',
        text: 'Evacuate immediately when advised. Travel perpendicular or upwind of the advancing smoke plume.',
      },
      {
        step: 3,
        title: 'Wear N95 masks and heavy clothing',
        text: 'Wear N95 respirators or damp cotton cloth over nose and mouth, heavy jeans, and leather boots.',
      },
      {
        step: 4,
        title: 'Keep hoses, buckets, and ladders accessible',
        text: 'Keep water hoses connected, buckets filled, and ladders placed against the roof for emergency ember control.',
      },
    ],
    donts: [
      {
        step: 1,
        title: 'Never attempt to outrun fire uphill',
        text: 'Do not attempt to outrun wildfire uphill on steep terrain; fires spread exponentially faster uphill.',
      },
      {
        step: 2,
        title: 'Do not delay evacuation for property',
        text: 'Do not remain behind to hose down roofs once fire fronts are within 500 meters.',
      },
      {
        step: 3,
        title: 'Do not inhale dense particulate smoke',
        text: 'Avoid walking through dense smoke corridors without eye protection and respiratory covering.',
      },
      {
        step: 4,
        title: 'Do not re-enter burned forest tracts',
        text: 'Do not enter burned zones until fire crews extinguish subterranean root fires and falling timber hazards.',
      },
    ],
    video: {
      title: 'Wildfire Defense: Creating Defensible Space & Smoke Evacuation',
      duration: '4:50 mins',
      thumbnailUrl:
        'https://images.unsplash.com/photo-1542382156909-9ae37b3f56fd?auto=format&fit=crop&w=800&q=80',
      description:
        'Wildland-urban interface defense tactics, ember storm management, and personal protective equipment for wildfire zones.',
      instructor: 'Forest Fire Protection & Rescue Service',
      keyTakeaways: [
        'Hardening roofs and attic vents against windborne ember ignition',
        'Vehicle entrapment survival protocol in burning corridors',
        'Smoke inhalation mitigation and air filtration at home',
      ],
    },
  },
};
