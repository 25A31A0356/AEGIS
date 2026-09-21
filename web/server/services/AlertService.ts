/**
 * AEGIS ALERT - Backend AlertService
 * Aggregates multi-hazard alerts from IMD, CWC, NCS, NDMA, FSI, and State SDMAs.
 * Covers Weather, Flood, Earthquake, Cyclone, Wildfire, Extreme Heat, Heavy Rain, Storm, and Emergency.
 */

import { AlertQueryFilter } from '../types/api';

export interface AlertSafetyAdvice {
  title: string;
  instruction: string;
  urgent: boolean;
}

export interface AlertEmergencyContact {
  name: string;
  phone: string;
}

export interface AlertItem {
  id: string;
  title: string;
  category: 'weather' | 'flood' | 'earthquake' | 'cyclone' | 'wildfire' | 'heatwave' | 'heavy_rain' | 'storm' | 'emergency';
  categoryName: string;
  severity: 'critical' | 'warning' | 'moderate' | 'minor';
  status: 'active' | 'monitoring' | 'resolved';
  headline: string;
  description: string;
  location: {
    state: string;
    district: string;
    city?: string;
    coordinates: [number, number];
    radiusKm: number;
    affectedZones: string[];
  };
  source: {
    agency: string;
    bulletinId: string;
    publishedAt: string;
    validUntil: string;
  };
  metrics?: {
    intensity?: string;
    magnitudeRichter?: number;
    windSpeedKmph?: number;
    rainfallRateMmHr?: number;
    heatIndexCelsius?: number;
  };
  timeline?: Array<{
    time: string;
    stage: string;
    description: string;
    source: string;
  }>;
  safetyAdvice?: AlertSafetyAdvice[];
  emergencyContacts?: AlertEmergencyContact[];
  recommendedAction: string;
  safetyGuideSlug?: string;
}

export class AlertService {
  private static alerts: AlertItem[] = [
    {
      id: 'ALT-IMD-2026-0891',
      title: 'Red Warning: Severe Convective Rainfall & Urban Inundation',
      category: 'flood',
      categoryName: 'Urban Inundation & Floods',
      severity: 'critical',
      status: 'active',
      headline: 'Extreme precipitation (>115 mm/hr) detected over coastal belt with severe waterlogging risk.',
      description: 'IMD Doppler Radar indicates deep cumulonimbus cell movement along low-lying drainage catchments across Mumbai and Konkan coast.',
      location: {
        state: 'Maharashtra',
        district: 'Mumbai Suburban',
        city: 'Mumbai',
        coordinates: [19.0760, 72.8777],
        radiusKm: 35,
        affectedZones: ['Kurla Lowlands', 'Milan Subway', 'Hindmata Junction', 'Dharavi Drainage Canal'],
      },
      source: {
        agency: 'India Meteorological Department (IMD)',
        bulletinId: 'IMD-BULL-0891',
        publishedAt: new Date(Date.now() - 15 * 60000).toISOString(),
        validUntil: new Date(Date.now() + 6 * 3600000).toISOString(),
      },
      metrics: {
        intensity: '128 mm / hr Runoff',
        rainfallRateMmHr: 128,
      },
      timeline: [
        { time: '13:30 IST', stage: 'Radar Detection', description: 'Doppler echo intensity crossed 54 dBZ over western coastline.', source: 'IMD Mumbai Radar' },
        { time: '14:15 IST', stage: 'Red Alert Issued', description: 'Municipal pump stations switched to maximum discharge capacity.', source: 'MCGM Emergency Cell' },
      ],
      safetyAdvice: [
        { title: 'Avoid Subways & Depressed Roads', instruction: 'Do not attempt to drive through water of unknown depth.', urgent: true },
        { title: 'Elevate Valuable Documents', instruction: 'Move critical household appliances and medical kits to upper floors.', urgent: false },
      ],
      emergencyContacts: [
        { name: 'National Emergency Support', phone: '112' },
        { name: 'Mumbai Disaster Control', phone: '1916' },
      ],
      recommendedAction: 'Move to higher ground. Avoid low-lying subways and flooded underpasses.',
      safetyGuideSlug: 'floods',
    },
    {
      id: 'ALT-CWC-2026-0412',
      title: 'Orange Alert: Godavari River Basin Level Exceeding Danger Mark',
      category: 'flood',
      categoryName: 'Riverine Basin Flooding',
      severity: 'warning',
      status: 'active',
      headline: 'Inflow at upstream barrages rising at 18 cm/hr; low-lying banks under active watch.',
      description: 'Central Water Commission hydro-sensors confirm rapid water level rise across downstream sectors of Telangana and Andhra Pradesh.',
      location: {
        state: 'Telangana',
        district: 'Bhadradri Kothagudem',
        city: 'Bhadrachalam',
        coordinates: [17.5500, 80.6200],
        radiusKm: 60,
        affectedZones: ['Bhadrachalam Ghats', 'Burgampahad Riverbank', 'Aswapuram Lowlands'],
      },
      source: {
        agency: 'Central Water Commission (CWC)',
        bulletinId: 'CWC-HYD-0412',
        publishedAt: new Date(Date.now() - 45 * 60000).toISOString(),
        validUntil: new Date(Date.now() + 12 * 3600000).toISOString(),
      },
      metrics: {
        intensity: 'Gauge 53.4 ft (Danger Mark: 53.0 ft)',
      },
      timeline: [
        { time: '09:00 IST', stage: 'First Warning Level', description: 'Water level touched 43 ft at Bhadrachalam gauge.', source: 'CWC Hydro-Network' },
        { time: '13:00 IST', stage: 'Second Warning Exceeded', description: 'Gates opened at upstream reservoirs to balance discharge.', source: 'Irrigation Dept' },
      ],
      safetyAdvice: [
        { title: 'Evacuate Riparian Settlements', instruction: 'Follow SDRF guidance to designated elevated shelters immediately.', urgent: true },
      ],
      emergencyContacts: [
        { name: 'SDRF Telangana Command', phone: '1070' },
        { name: 'District Emergency Cell', phone: '08744-241950' },
      ],
      recommendedAction: 'Evacuate riverbank settlements to designated high-elevation relief shelters.',
      safetyGuideSlug: 'floods',
    },
    {
      id: 'ALT-IMD-2026-0774',
      title: 'Cyclone Watch: Severe Tropical Storm System Formulating',
      category: 'cyclone',
      categoryName: 'Tropical Cyclones & Storms',
      severity: 'critical',
      status: 'active',
      headline: 'Deep depression over Bay of Bengal intensifies with squally winds up to 95 km/h.',
      description: 'Cyclone track projection indicates landfall trajectory towards Odisha coastline in 36 hours. Storm surge up to 2.5m anticipated.',
      location: {
        state: 'Odisha',
        district: 'Puri',
        city: 'Puri',
        coordinates: [19.8135, 85.8312],
        radiusKm: 120,
        affectedZones: ['Puri Coastal Swath', 'Konark Marine Drive', 'Astaranga Fishing Harbor'],
      },
      source: {
        agency: 'IMD Cyclone Warning Division',
        bulletinId: 'IMD-CYC-0774',
        publishedAt: new Date(Date.now() - 75 * 60000).toISOString(),
        validUntil: new Date(Date.now() + 24 * 3600000).toISOString(),
      },
      metrics: {
        intensity: 'Sustained Gale 95 km/h, Gusts 115 km/h',
        windSpeedKmph: 95,
      },
      timeline: [
        { time: 'Yesterday', stage: 'Low Pressure Formed', description: 'Deep convective depression identified over East-Central Bay of Bengal.', source: 'INSAT-3DR Telemetry' },
        { time: '06:00 IST', stage: 'Cyclone Upgraded', description: 'Storm center coordinates tracked at 17.2°N, 88.4°E moving NW.', source: 'IMD CWD' },
      ],
      safetyAdvice: [
        { title: 'Fishermen Suspension Order', instruction: 'Total suspension of all fishing and marine operations along east coast.', urgent: true },
        { title: 'Rooftop & Window Reinforcement', instruction: 'Secure loose tin sheets, antenna arrays, and board glass panes.', urgent: true },
      ],
      emergencyContacts: [
        { name: 'Odisha Disaster Management (OSDMA)', phone: '1070' },
        { name: 'Coast Guard Maritime Search & Rescue', phone: '1554' },
      ],
      recommendedAction: 'Complete rooftop reinforcement. Fishermen strictly advised not to venture into open seas.',
      safetyGuideSlug: 'cyclones',
    },
    {
      id: 'ALT-NCS-2026-0105',
      title: 'Moderate Seismic Tremor (M4.8) Recorded',
      category: 'earthquake',
      categoryName: 'Seismic & Tectonic Activity',
      severity: 'warning',
      status: 'monitoring',
      headline: 'Shallow focal depth of 12 km recorded; light structural vibration felt across valley.',
      description: 'National Center for Seismology confirms M4.8 tremor with epicentral region in Kamrup Metropolitan district. Surveillance for aftershocks active.',
      location: {
        state: 'Assam',
        district: 'Kamrup Metropolitan',
        city: 'Guwahati',
        coordinates: [26.1445, 91.7362],
        radiusKm: 45,
        affectedZones: ['Guwahati City Core', 'Dispur Complex', 'North Guwahati Hills'],
      },
      source: {
        agency: 'National Center for Seismology (NCS)',
        bulletinId: 'NCS-EQ-0105',
        publishedAt: new Date(Date.now() - 120 * 60000).toISOString(),
        validUntil: new Date(Date.now() + 48 * 3600000).toISOString(),
      },
      metrics: {
        intensity: 'M4.8 on Richter Scale (Depth 12 km)',
        magnitudeRichter: 4.8,
      },
      timeline: [
        { time: '11:15 IST', stage: 'Seismic Event Registered', description: 'Primary P-waves captured at Guwahati & Shillong broadband observatories.', source: 'NCS Network' },
      ],
      safetyAdvice: [
        { title: 'Drop, Cover & Hold', instruction: 'If tremors reoccur, take shelter under sturdy furniture or interior doorway.', urgent: true },
        { title: 'Inspect Structural Hairlines', instruction: 'Check domestic gas lines and masonry foundations before entering buildings.', urgent: false },
      ],
      emergencyContacts: [
        { name: 'Assam State Disaster Management (ASDMA)', phone: '1079' },
        { name: 'NDRF 1st Battalion Control', phone: '0361-2849005' },
      ],
      recommendedAction: 'Inspect structures for major hairline cracks. Review Drop, Cover & Hold protocol.',
      safetyGuideSlug: 'earthquakes',
    },
    {
      id: 'ALT-FSI-2026-0219',
      title: 'Forest Fire & Wildfire Danger Warning: High Thermal Hotspots',
      category: 'wildfire',
      categoryName: 'Wildfire & Forest Conflagration',
      severity: 'warning',
      status: 'active',
      headline: 'Forest Survey of India thermal sensors confirm 14 active fire spots along dry deciduous ridges.',
      description: 'High dry winds and low relative humidity (18%) driving rapid brush fire spreading along outer reserve forest corridors.',
      location: {
        state: 'Uttarakhand',
        district: 'Nainital',
        city: 'Nainital',
        coordinates: [29.3919, 79.4542],
        radiusKm: 30,
        affectedZones: ['Kilbury Forest Belt', 'Bhowali Valley Slopes', 'Pangot Reserve Buffer'],
      },
      source: {
        agency: 'Forest Survey of India (FSI) & State Forest Dept',
        bulletinId: 'FSI-FIRE-0219',
        publishedAt: new Date(Date.now() - 90 * 60000).toISOString(),
        validUntil: new Date(Date.now() + 18 * 3600000).toISOString(),
      },
      metrics: {
        intensity: 'Fire Danger Index: Extreme (Dry Fuel Index 91%)',
      },
      timeline: [
        { time: '08:45 IST', stage: 'MODIS Satellite Detection', description: 'Thermal anomalies identified across 3 forest compartments.', source: 'FSI Realtime Fire Portal' },
        { time: '11:20 IST', stage: 'Ground Teams Dispatched', description: 'Forest beat officers creating controlled fire counter-lines.', source: 'Van Vibhag Nainital' },
      ],
      safetyAdvice: [
        { title: 'Maintain Evacuation Buffer', instruction: 'Keep a 2km clear buffer from active smoke plumes along hill ridges.', urgent: true },
        { title: 'Report New Smoke Plumes', instruction: 'Immediately notify forest guards on sighting uncontained brush smoke.', urgent: false },
      ],
      emergencyContacts: [
        { name: 'Uttarakhand Forest Fire Helpline', phone: '1800-180-4141' },
        { name: 'State Disaster Emergency (USDMA)', phone: '1070' },
      ],
      recommendedAction: 'Create 200m fuel breaks around settlements. Stay tuned to forest department advisories.',
      safetyGuideSlug: 'wildfires',
    },
    {
      id: 'ALT-IMD-2026-0551',
      title: 'Severe Thermal Heatwave & Solar Radiation Advisory',
      category: 'heatwave',
      categoryName: 'Extreme Heat & Heatwave',
      severity: 'warning',
      status: 'active',
      headline: 'Daytime surface temperatures projected to breach 44.5°C with severe heat dome entrapment.',
      description: 'Anticyclone circulation over northwest plains causing persistent intense heat wave conditions across Rajasthan, Haryana, and Delhi NCR.',
      location: {
        state: 'Rajasthan',
        district: 'Jaipur',
        city: 'Jaipur',
        coordinates: [26.9124, 75.7873],
        radiusKm: 50,
        affectedZones: ['Jaipur Urban Sector', 'Amber Ridge Basin', 'Chomu Agricultural Belt'],
      },
      source: {
        agency: 'India Meteorological Department (IMD)',
        bulletinId: 'IMD-HEAT-0551',
        publishedAt: new Date(Date.now() - 180 * 60000).toISOString(),
        validUntil: new Date(Date.now() + 36 * 3600000).toISOString(),
      },
      metrics: {
        intensity: 'Peak Thermal Ambient: 44.5°C',
        heatIndexCelsius: 47.8,
      },
      timeline: [
        { time: 'Yesterday', stage: 'Heatwave Advisory', description: 'Surface telemetry crossed yellow threshold (42°C).', source: 'IMD Jaipur Center' },
        { time: '08:00 IST', stage: 'Orange Upgrade', description: 'Heat dome stability confirmed across western sector.', source: 'NWP Heat Index Grid' },
      ],
      safetyAdvice: [
        { title: 'Avoid Direct Sun Exposure', instruction: 'Do not venture outdoors between 11:30 AM and 4:30 PM.', urgent: true },
        { title: 'Electrolyte Hydration', instruction: 'Consume oral rehydration solutions (ORS) and tender coconut water regularly.', urgent: false },
      ],
      emergencyContacts: [
        { name: 'Heat Stroke Emergency Ambulance', phone: '108' },
        { name: 'Rajasthan Disaster Control Room', phone: '0141-2227296' },
      ],
      recommendedAction: 'Stay hydrated with electrolytes. Reschedule all outdoor physical labor to early mornings.',
      safetyGuideSlug: 'heatwaves',
    },
  ];

  /**
   * Get all active alerts with optional query filtering
   */
  public static async getAlerts(filter?: AlertQueryFilter): Promise<AlertItem[]> {
    let result = [...this.alerts];
    if (!filter) return result;

    if (filter.status && filter.status !== 'all') {
      result = result.filter((a) => a.status.toLowerCase() === filter.status?.toLowerCase());
    }
    if (filter.category && filter.category !== 'all') {
      result = result.filter((a) => a.category.toLowerCase() === filter.category?.toLowerCase());
    }
    if (filter.severity && filter.severity !== 'all') {
      result = result.filter((a) => a.severity.toLowerCase() === filter.severity?.toLowerCase());
    }
    if (filter.stateId) {
      result = result.filter((a) => a.location.state.toLowerCase().includes(filter.stateId!.toLowerCase()));
    }
    return result;
  }

  /**
   * Get alerts near specified geographic coordinates
   */
  public static async getNearbyAlerts(lat: number, lng: number, radiusKm: number = 100): Promise<AlertItem[]> {
    return this.alerts.filter((a) => {
      const dist = this.calculateDistanceKm([lat, lng], a.location.coordinates);
      return dist <= (radiusKm || a.location.radiusKm);
    });
  }

  private static calculateDistanceKm(c1: [number, number], c2: [number, number]): number {
    const [lat1, lon1] = c1;
    const [lat2, lon2] = c2;
    const R = 6371;
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    return Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)) * 10) / 10;
  }
}
