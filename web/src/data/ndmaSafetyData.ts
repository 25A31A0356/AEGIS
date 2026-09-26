/**
 * Official NDMA (National Disaster Management Authority) SACHET & MoRTH
 * Comprehensive Multi-Hazard Safety Protocols, Do's, Don'ts & Official Safety Videos.
 * Grounded in NDMA SACHET Guidelines.
 */

export interface HazardSafetyGuide {
  id: string;
  name: string;
  shortName: string;
  category: 'flood' | 'cyclone' | 'earthquake' | 'landslide' | 'road' | 'lightning' | 'ocean';
  badgeColor: string;
  bgGradient: string;
  imageUrl: string;
  tagline: string;
  authority: 'NDMA SACHET' | 'MoRTH' | 'IMD & NDMA';
  videoUrl: string;
  videoButtonLabel: string;
  dos: string[];
  donts: string[];
}

export const NDMA_HAZARD_SAFETY_GUIDES: HazardSafetyGuide[] = [
  // 1. FLOOD
  {
    id: 'flood',
    name: 'Flood Disaster Safety',
    shortName: 'Flood',
    category: 'flood',
    badgeColor: '#0284C7',
    bgGradient: 'from-sky-950/40 to-blue-900/20',
    imageUrl: 'https://images.unsplash.com/photo-1547683905-f686c993aae5?auto=format&fit=crop&w=800&q=80',
    tagline: 'Riverine overflow, urban waterlogging, and flash flood survival protocols.',
    authority: 'NDMA SACHET',
    videoUrl: 'https://sachet.ndma.gov.in/DosDont',
    videoButtonLabel: 'Watch Flood Safety Video',
    dos: [
      'Move to higher ground immediately when flooding threatens your area.',
      'Follow official alerts and evacuate without delay when instructed by authorities.',
      'Keep your phone fully charged and carry essential emergency supplies in a go-bag.',
      'Keep important identification documents, land deeds, and valuables in a sealed waterproof pouch.',
      'Stay updated continuously through trusted national disaster and IMD weather alerts.',
      'If trapped inside a building, move to the highest safe level; do not climb into closed attics without roof exits.',
      'After flooding recedes, return to the area only when local authorities explicitly declare it safe.',
    ],
    donts: [
      'Do not walk, swim, or drive through floodwater. As little as 15 cm of moving water can knock an adult down.',
      'Do not touch electrical equipment, switches, or power cords while standing in water.',
      'Do not cross submerged or flooded bridges, culverts, or causeways.',
      'Do not drive around official road barricades or caution tape.',
      'Do not enter underpasses, subways, tunnels, or underground roads during heavy rainfall.',
      'Do not assume floodwater is clean or safe to drink; consume only boiled or chlorinated water.',
      'Do not return to an evacuated or flooded sector until civic officials declare it structurally sound.',
    ],
  },

  // 2. CYCLONE
  {
    id: 'cyclone',
    name: 'Cyclone & Gale Storm Safety',
    shortName: 'Cyclone',
    category: 'cyclone',
    badgeColor: '#DC2626',
    bgGradient: 'from-red-950/40 to-orange-950/20',
    imageUrl: 'https://images.unsplash.com/photo-1527482797697-8795b05a13fe?auto=format&fit=crop&w=800&q=80',
    tagline: 'Severe cyclonic storm gale winds, storm surges, and coastal evacuation SOP.',
    authority: 'NDMA SACHET',
    videoUrl: 'https://sachet.ndma.gov.in/DosDont',
    videoButtonLabel: 'Watch Cyclone Safety Video',
    dos: [
      'Stay indoors and remain inside a structurally strong, pucca building.',
      'Follow official IMD cyclone warnings, track bulletins, and evacuation orders diligently.',
      'Keep your mobile phone charged, power banks topped up, and 72-hour emergency kit ready.',
      'Secure loose outdoor items such as corrugated tin sheets, signage boards, furniture, and containers.',
      'Keep essential medicines, prescriptions, and identity documents in a sealed waterproof bag.',
      'Stay away from windows, glass doors, and exterior facade walls during peak winds.',
      'If an evacuation is ordered, relocate promptly to designated cyclone multi-purpose shelters.',
    ],
    donts: [
      'Do not venture outside during severe gale squalls or during the deceptive calm "eye" of the cyclone.',
      'Do not stand near windows, open balconies, large trees, high-voltage poles, or weak structures.',
      'Do not undertake unnecessary road or maritime travel during the cyclone warning period.',
      'Do not touch fallen electrical cables, damaged power lines, or grounded transformers.',
      'Do not spread rumors or rely on unverified cyclone tracks on social media.',
      'Do not return to evacuated coastal lowlands until emergency authorities issue an all-clear bulletin.',
    ],
  },

  // 3. EARTHQUAKE (Updated with High-Impact Real Seismic & Structural Fissure Image)
  {
    id: 'earthquake',
    name: 'Earthquake & Seismic Hazard',
    shortName: 'Earthquake',
    category: 'earthquake',
    badgeColor: '#D97706',
    bgGradient: 'from-amber-950/40 to-yellow-900/20',
    imageUrl: '/hazards/earthquake.jpg',
    tagline: 'Ground shaking, building structural integrity, and Drop-Cover-Hold protocols.',
    authority: 'NDMA SACHET',
    videoUrl: 'https://sachet.ndma.gov.in/DosDont',
    videoButtonLabel: 'Watch Earthquake Safety Video',
    dos: [
      'Drop, Cover, and Hold On immediately when seismic shaking starts.',
      'Protect your head and neck under a sturdy wooden table, desk, or reinforced interior corner.',
      'Stay well clear of large windows, glass partitions, heavy mirrors, and falling wall fixtures.',
      'If outdoors, move into an open area away from multistory buildings, trees, and overhead power lines.',
      'After shaking ceases, check yourself and others for injuries and listen for official emergency instructions.',
      'If building evacuation is required, always use the stairs; never attempt to use lifts or elevators.',
    ],
    donts: [
      'Do not run outside blindly while the ground is actively shaking; falling facade masonry is a primary risk.',
      'Do not use elevators/lifts during or immediately following an earthquake.',
      'Do not stand near windows, unanchored bookcases, tall cabinets, or hanging chandeliers.',
      'Do not light matches, lighters, or open flames if there is any suspicion of a ruptured gas line.',
      'Do not re-enter a visibly cracked or structurally damaged building until authorized by structural engineers.',
      'Do not circulate panic messages or unverified rumors regarding predicted aftershocks.',
    ],
  },

  // 4. LANDSLIDE
  {
    id: 'landslide',
    name: 'Landslide & Debris Flow Safety',
    shortName: 'Landslide',
    category: 'landslide',
    badgeColor: '#854D0E',
    bgGradient: 'from-amber-950/50 to-stone-900/30',
    imageUrl: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=80',
    tagline: 'Hill slope destabilization, mudflow alerts, and mountainous terrain evacuations.',
    authority: 'NDMA SACHET',
    videoUrl: 'https://sachet.ndma.gov.in/DosDont',
    videoButtonLabel: 'Watch Landslide Safety Video',
    dos: [
      'Move away from steep slopes, unstable cliffs, and known landslide corridors when warnings are active.',
      'Follow official district administration evacuation instructions immediately.',
      'Stay vigilant for ground tension cracks, tilting trees, leaning utility poles, or rumbling sounds.',
      'Relocate to stable, geologically sound higher ground if a debris flow or mudslide is approaching.',
      'Keep emergency communication devices fully charged and portable first aid kits on hand.',
      'After a landslide event, check in with rescue personnel and local authorities before returning.',
    ],
    donts: [
      'Do not remain near steep unreinforced slopes or ravine cuts during heavy or prolonged downpours.',
      'Do not attempt to cross an active landslide, mudflow path, or rolling rock zone.',
      'Do not walk, cycle, or drive across loose landslide silt, fallen boulders, or muck.',
      'Do not stand directly below unstable cliffs, retaining walls, or damaged hillside foundations.',
      'Do not approach snapped or fallen overhead electricity lines on mountain roads.',
      'Do not enter the disaster zone until state geological and disaster response teams declare the slope stabilized.',
    ],
  },

  // 5. ROAD SAFETY HAZARD
  {
    id: 'road',
    name: 'Road Safety & Highway Hazards',
    shortName: 'Road Safety',
    category: 'road',
    badgeColor: '#4F46E5',
    bgGradient: 'from-indigo-950/40 to-blue-950/20',
    imageUrl: 'https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?auto=format&fit=crop&w=800&q=80',
    tagline: 'Adverse weather commuting, collision prevention, and road obstruction reporting.',
    authority: 'MoRTH',
    videoUrl: 'https://morth.nic.in/road-safety',
    videoButtonLabel: 'Watch Road Safety Video',
    dos: [
      'Strictly observe traffic signals, lane discipline, and statutory speed limits.',
      'Always wear a certified helmet on two-wheelers and fasten seat belts in all four-wheeler seats.',
      'Significantly reduce driving speed during torrential rain, waterlogged asphalt, dense fog, or poor visibility.',
      'Maintain an extended, safe following distance from vehicles ahead to accommodate wet braking distances.',
      'Turn on low-beam headlights and hazard indicators when navigating poor visibility conditions or taking turns.',
      'Promptly report hazardous road washouts, fallen trees, deep potholes, or accidents via AEGIS Alert.',
    ],
    donts: [
      'Do not overspeed, tailgate, or engage in aggressive overtaking maneuvers.',
      'Do not operate a mobile phone, text, or browse while operating a vehicle.',
      'Do not drive into submerged roads, flash flooded dips, or swift debris washouts.',
      'Do not breach police barricades, road closed signboards, or caution ribbons.',
      'Do not overtake on blind curves, narrow bridges, or during severe fog conditions.',
      'Do not drive if fatigued, sleep-deprived, or under the influence of alcohol or sedating medication.',
    ],
  },

  // 6. LIGHTNING & THUNDERSTORMS
  {
    id: 'lightning',
    name: 'Lightning & Severe Thunderstorm',
    shortName: 'Lightning',
    category: 'lightning',
    badgeColor: '#EAB308',
    bgGradient: 'from-yellow-950/40 to-amber-950/20',
    imageUrl: 'https://images.unsplash.com/photo-1516912481808-3406841bd33c?auto=format&fit=crop&w=800&q=80',
    tagline: 'Cloud-to-ground strike mitigation, 30-30 rule, and electrical isolation protocols.',
    authority: 'NDMA SACHET',
    videoUrl: 'https://sachet.ndma.gov.in/DosDont',
    videoButtonLabel: 'Watch Lightning Safety Video',
    dos: [
      'Head indoors immediately upon hearing thunder (Follow the rule: When Thunder Roars, Go Indoors).',
      'Shelter inside a fully enclosed pucca building or an enclosed metal-roof vehicle.',
      'Keep a safe distance from windows, balconies, veranda railings, and exterior metal doors.',
      'Unplug non-essential electronic appliances and sensitive gadgets if safe to do so before the storm.',
      'Remain indoors for at least 30 minutes after hearing the last clap of thunder.',
      'Follow real-time IMD nowcasts, Doppler radar echoes, and SACHET lightning flash alerts.',
    ],
    donts: [
      'Do not remain in wide open agricultural fields, open rooftops, elevated hilltops, or beaches.',
      'Do not seek shelter under isolated trees, metal sheds, or open bus stops.',
      'Do not stand near tall metallic structures, transmission towers, wire fences, or flagpoles.',
      'Do not use corded electrical equipment or plug in chargers during an active lightning storm.',
      'Do not use plumbing fixtures, take showers, or run water unnecessarily, as pipes conduct electricity.',
      'Do not resume outdoor activities simply because rain has paused while lightning thunder continues.',
    ],
  },

  // 7. OCEAN & COASTAL HAZARDS
  {
    id: 'ocean',
    name: 'Ocean & Coastal Maritime Hazards',
    shortName: 'Coastal Hazards',
    category: 'ocean',
    badgeColor: '#0D9488',
    bgGradient: 'from-teal-950/40 to-cyan-950/20',
    imageUrl: 'https://images.unsplash.com/photo-1505118380757-91f5f5632de0?auto=format&fit=crop&w=800&q=80',
    tagline: 'High swell waves, spring tides, rip currents, and marine safety protocols.',
    authority: 'NDMA SACHET',
    videoUrl: 'https://sachet.ndma.gov.in/DosDont',
    videoButtonLabel: 'Watch Coastal Safety Video',
    dos: [
      'Adhere strictly to INCOIS swell surge warnings, high-wave alerts, and coastal storm bulletins.',
      'Relocate to elevated ground or designated coastal shelters immediately when evacuation is directed.',
      'Stay well away from open sea beaches, rocky breakwaters, and low-lying coastal paths during rough seas.',
      'Keep mobile devices charged and emergency survival kits accessible.',
      'If operating at sea, immediately heed Coast Guard and marine police broadcast instructions to return to port.',
      'Following coastal surge or inundation events, return only after maritime authorities declare the shoreline secure.',
    ],
    donts: [
      'Do not enter the sea for bathing, swimming, surfing, or fishing during declared rough sea conditions.',
      'Do not crowd the shoreline or sea piers to take photographs or observe high waves.',
      'Do not ignore tsunami advisories, storm-surge notices, or INCOIS high-wave bulletins.',
      'Do not attempt to navigate vehicles over flooded coastal access roads, beach roads, or causeways.',
      'Do not enter barricaded harbor promenades or designated coastal danger zones.',
      'Do not assume ocean waters are safe simply because the surf temporarily appears calm.',
    ],
  },
];
