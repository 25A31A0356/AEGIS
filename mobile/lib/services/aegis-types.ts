/**
 * Aegis Alert Data Types & Contract
 *
 * Defines the central data structures consumed by the Aegis Alert App
 * from Aegis Software (Aegis API), satisfying all required data points.
 */

export type HazardSeverity = "LOW" | "MODERATE" | "HIGH" | "CRITICAL";

export type HazardType =
  | "cyclone"
  | "flood"
  | "earthquake"
  | "wildfire"
  | "severe_weather"
  | "tsunami"
  | "landslide"
  | "emergency_broadcast";

export type AlertStatus = "ACTIVE" | "UPDATED" | "RESOLVED" | "EXPIRED";

export type DataFreshness = "LIVE" | "CACHED" | "STALE";

export interface GeoCoordinate {
  latitude: number;
  longitude: number;
  label?: string;
}

export interface WeatherForecastDay {
  day: string;
  date: string;
  label: string;
  hi: string;
  lo: string;
  tempMaxC: number;
  tempMinC: number;
  rainProbabilityPct: number;
  color: string;
  weatherCode: number;
}

export interface HourlyWeatherPoint {
  time?: string; // e.g. "12:00" or ISO string
  timeIST?: string;
  hourLabel?: string;
  tempC?: number;
  temperatureC?: number;
  apparentTempC?: number;
  rainProbabilityPct: number;
  rainfallMm?: number;
  windSpeedKmH: number;
  humidityPct: number;
  weatherCode: number;
  weatherLabel: string;
  isDay?: boolean;
  isCurrentHour?: boolean;
}

export interface TodayHourlyForecast {
  date: string;
  hours?: HourlyWeatherPoint[];
  hourly?: HourlyWeatherPoint[];
  tempMinC?: number;
  tempMaxC?: number;
  uvIndexMax?: number;
  sunriseTime?: string;
  sunsetTime?: string;
  source?: string;
  lastUpdated?: string;
}

export interface AegisWeatherData {
  temperature: number; // in °C
  apparentTemperature: number; // "feels like" in °C
  humidity: number; // in %
  windSpeedKmH: number; // in km/h
  windDirectionDeg?: number;
  windGustKmH?: number;
  rainfallMm: number; // Precipitation in mm
  rainfallProbabilityPct?: number; // 0-100%
  visibilityKm: number; // in km
  weatherCode: number;
  weatherLabel: string;
  condition?: string;
  isSevereWeather: boolean;
  severeWeatherNote?: string;
  forecast: WeatherForecastDay[];
  pressureHpa?: number;
  uvIndex?: number;
  aqi?: number;
  aqiStatus?: string;
  dewPointC?: number;
  windDirectionCardinal?: string;
  sunriseTime?: string;
  sunsetTime?: string;
  daylightDuration?: string;
  riskScore?: number;
  riskLevel?: string;
  todayHourly?: TodayHourlyForecast | HourlyWeatherPoint[];
  source: string;
  issuedAt: string;
  lastUpdated: string;
  freshness: DataFreshness;
}

export interface AegisHazardAlert {
  id: string;
  type: HazardType;
  title: string;
  severity: HazardSeverity;
  affectedLocation: {
    name: string;
    latitude: number;
    longitude: number;
    radiusKm?: number;
    polygon?: [number, number][];
  };
  distanceKm?: number;
  description: string;
  instructions?: string;
  issuedAt: string; // ISO string
  expiresAt: string; // ISO string
  source: string;
  status: AlertStatus;
  magnitude?: number; // for earthquakes
  windSpeedKts?: number; // for cyclones
  waterDepthM?: number; // for floods
  isUrgent: boolean;
}

export interface AegisShelter {
  id: string;
  name: string;
  type: "Government Cyclone Shelter" | "Community High Hall" | "School Campus Safe Haven" | "Hospital Evacuation Center";
  address: string;
  coordinates: { latitude: number; longitude: number };
  totalCapacity: number;
  occupiedCapacity: number;
  availableCapacity: number;
  elevationMeters: number;
  distanceKm: number;
  estimatedMinutes: number;
  amenities: {
    drinkingWater: boolean;
    medicalStation: boolean;
    powerBackup: boolean;
    foodSupply: boolean;
    sanitation: boolean;
  };
  contactPerson: string;
  contactNumber: string;
  status: "OPEN" | "NEAR_CAPACITY" | "FULL";
  badge: string;
  lastUpdated: string;
}

export interface AegisHospital {
  id: string;
  name: string;
  type: string;
  address: string;
  coordinates: { latitude: number; longitude: number };
  elevationMeters: number;
  contactNumber?: string;
  status: string;
  statusColor?: string;
  badge: string;
  details: string;
  openBeds: number;
  totalCapacity: number;
  distanceKm?: number;
  hasTraumaReady: boolean;
  lastUpdated: string;
}

export interface AegisApiResponse<T> {
  data: T;
  source: string;
  timestamp: string;
  cached: boolean;
  freshness: DataFreshness;
  lastUpdatedFormatted?: string;
}

export interface SafePingInput {
  contact: string;
  message: string;
  latitude?: number;
  longitude?: number;
}

export interface SosBeaconInput {
  hazard: string;
  people: number;
  note?: string;
  latitude?: number;
  longitude?: number;
}

export interface CommunityReportInput {
  hazard: string;
  severity: "Low" | "Medium" | "High" | "Critical" | string;
  details?: string;
  description?: string;
  title?: string;
  category?: string;
  latitude?: number;
  longitude?: number;
  accuracy?: number | null;
  address?: string;
  image?: string;
  imageUrl?: string;
  idempotencyKey?: string;
}

export interface AegisCommunityReport {
  id: string;
  trackingId?: string;
  userId?: string | number;
  authorName?: string;
  hazard: string;
  category: string;
  title: string;
  description: string;
  severity: HazardSeverity;
  status: CommunityReportStatus;
  verificationStatus: ReportVerificationStatus;
  location: {
    latitude: number;
    longitude: number;
    accuracy?: number | null;
    address?: string;
    sector?: string;
  };
  distanceKm?: number;
  imageUrl?: string;
  upvotes: number;
  source: ReportSource;
  isPending?: boolean;
  idempotencyKey?: string;
  createdAt: string;
  updatedAt: string;
  freshness?: DataFreshness;
}

export interface CreateReportPayload {
  category?: string;
  hazard: string;
  title?: string;
  description?: string;
  details?: string;
  severity?: string;
  latitude?: number;
  longitude?: number;
  accuracy?: number | null;
  address?: string;
  image?: string;
  imageUrl?: string;
  idempotencyKey?: string;
}

export type RealtimeConnectionStatus =
  | "LIVE"
  | "CACHED"
  | "OFFLINE"
  | "CONNECTING"
  | "CONNECTED"
  | "DISCONNECTED"
  | "RECONNECTING"
  | "ERROR"
  | string;

export type ReportSource = "OFFICIAL" | "COMMUNITY" | "VERIFIED COMMUNITY" | "UNVERIFIED COMMUNITY" | string;
export type ReportVerificationStatus = "VERIFIED" | "UNVERIFIED" | "PENDING" | string;
export type CommunityReportStatus = "pending_review" | "verified" | "action_dispatched" | "dismissed" | "resolved" | string;

export type SosIncidentStatus =
  | "MATCHING"
  | "OFFERED"
  | "ACCEPTED"
  | "RESPONDER_ASSIGNED"
  | "RESPONDER_EN_ROUTE"
  | "RESPONDER_ON_SITE"
  | "ON_SITE"
  | "SAFE_RESOLVED"
  | "RESOLVED"
  | "CANCELLED"
  | "EXPIRED"
  | string;

export type SosEmergencyCategory =
  | "flood"
  | "flooding"
  | "cyclone"
  | "medical"
  | "fire"
  | "structural"
  | "electrical"
  | "general"
  | "trapped"
  | "accident"
  | string;

export interface CreateSosPayload {
  category: SosEmergencyCategory;
  requesterId?: string;
  requesterName?: string;
  note?: string;
  peopleCount?: number;
  bloodGroup?: string;
  medicalNotes?: string;
  latitude: number;
  longitude: number;
  accuracy?: number;
  address?: string;
  area?: string;
  district?: string;
  state?: string;
  searchRadiusKm?: number;
  familyContacts?: { name: string; phone: string; relationship?: string }[];
  idempotencyKey?: string;
}

export interface SosResponder {
  id: string;
  name: string;
  phone?: string;
  badge?: string;
  latitude: number;
  longitude: number;
  location?: { latitude: number; longitude: number };
  accuracy?: number;
  address?: string;
  assignedAt?: string;
  arrivedAt?: string;
  status?: string;
  rating?: number;
  distanceKm?: number;
  etaMinutes?: number;
}

export interface SosRouteStep {
  instruction: string;
  distanceMeters: number;
  durationSeconds: number;
}

export interface SosRouteData {
  coordinates: [number, number][]; // [lat, lng][] polyline
  distanceKm: number;
  etaMinutes: number;
  steps: SosRouteStep[];
  provider?: string;
}

export interface SosIncident {
  id: string;
  trackingId?: string;
  requesterId: string;
  requesterName: string;
  category: SosEmergencyCategory;
  note?: string;
  peopleCount: number;
  bloodGroup?: string;
  medicalNotes?: string;
  location: {
    latitude: number;
    longitude: number;
    accuracy?: number;
    address?: string;
    area?: string;
    district?: string;
    state?: string;
  };
  searchRadiusKm: number;
  status: SosIncidentStatus;
  responder?: SosResponder;
  assignedResponder?: SosResponder;
  route?: SosRouteData;
  routeToDestination?: SosRouteData;
  familyAlert?: {
    notifiedCount: number;
    contacts: string[];
    dispatchedAt: string;
    status: "PENDING" | "SENT" | "DELIVERED";
  };
  declinedResponderIds?: string[];
  idempotencyKey?: string;
  cancellationReason?: string;
  isPending?: boolean;
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string;
  freshness?: DataFreshness;
}

export interface NearbySosOffer {
  sosId: string;
  category: SosEmergencyCategory;
  title: string;
  severity: HazardSeverity;
  distanceKm: number;
  approximateDistanceKm?: number;
  area?: string;
  estimatedArrivalMinutes: number;
  peopleCount: number;
  urgencyReason: string;
  maskedLocation: {
    area: string;
    district: string;
    state: string;
    approximateLatitude: number;
    approximateLongitude: number;
  };
  requesterInitials: string;
  timestamp: string;
  expiresInSeconds: number;
}

export type SosLifecycleDisplayState =
  | "IDLE"
  | "TRIGGERING"
  | "SEARCHING_NEARBY_RESPONDERS"
  | "OFFER_EXTENDED"
  | "RESPONDER_ACCEPTED"
  | "RESPONDER_EN_ROUTE"
  | "RESPONDER_ON_SCENE"
  | "INCIDENT_RESOLVED_SAFE"
  | "SERVER RECEIVED"
  | "OFFLINE — SYNC PENDING"
  | "RESOLVED"
  | "SYNCING"
  | "RESPONDER ACKNOWLEDGED"
  | "CONTACTS NOTIFIED"
  | "SOS ACTIVE"
  | string;

export interface SafeCheckInInput {
  userId?: string;
  userName?: string;
  latitude?: number;
  longitude?: number;
  accuracy?: number;
  address?: string;
  state?: string;
  district?: string;
  message?: string;
  relatedSosId?: string;
  contactsNotified?: string[];
  familyContacts?: { name: string; phone: string; relationship?: string }[];
  shelterId?: string;
  shelterName?: string;
  idempotencyKey?: string;
}

export interface SafeCheckInRecord {
  id: string;
  userId?: string;
  userName?: string;
  timestamp: string;
  timestampFormattedIST?:
    | string
    | {
        dateStr: string;
        timeStr: string;
        fullFormatted: string;
        relative: string;
      };
  location: {
    latitude: number;
    longitude: number;
    accuracy?: number | null;
    address?: string;
    state?: string;
    district?: string;
  };
  relatedSosId?: string | null;
  status: "SAFE" | "RESOLVED_SOS" | "delivered" | "pending_sync" | "SYNCED" | "OFFLINE_PENDING" | "SYNCING" | string;
  syncState?: "SYNCED" | "OFFLINE_PENDING" | "SYNCING" | string;
  message: string;
  contactsNotified?: string[];
  shelterId?: string;
  shelterName?: string;
  familyNotifiedCount?: number;
  familyContacts?: { name: string; phone: string; relationship?: string }[];
  isOfflineSync?: boolean;
  idempotencyKey?: string;
  createdAt?: string;
}

export type ActivityType =
  | "sos_beacon"
  | "safe_checkin"
  | "hazard_alert"
  | "weather_warning"
  | "community_report"
  | "emergency_response"
  | "responder_assigned"
  | "sasgrid_alert";

export interface RecentActivity {
  id: string;
  type: ActivityType;
  title: string;
  summary: string;
  severity?: HazardSeverity;
  timestamp: string;
  timestampFormattedIST: string;
  relativeTime: string;
  locationName: string;
  state?: string;
  district?: string;
  coordinates?: { latitude: number; longitude: number };
  status?: string;
  source: string;
  deepLinkUrl?: string;
}

// -------------------------------------------------------------
// SASGRID (Situational Awareness & Safety Grid)
// -------------------------------------------------------------
export interface SasGridSector {
  id?: string;
  sectorId?: string;
  sectorCode?: string; // e.g. "SAS-SEC-04-NORTH"
  sectorName: string; // e.g. "Sector 04 High Ground & Basin Grid"
  state?: string;
  district?: string;
  centerCoordinates: {
    latitude: number;
    longitude: number;
  };
  boundsPolygon?: [number, number][]; // [[lat, lng], ...]
  coordinates?: [number, number][];
  safetyIndex?: number; // 0-100 score
  riskScore?: number;
  hazardLevel?: "LOW" | "MODERATE" | "HIGH" | "CRITICAL";
  riskLevel?: "GREEN" | "YELLOW" | "ORANGE" | "RED" | "LOW" | "MODERATE" | "HIGH" | "CRITICAL";
  activeAlertsCount?: number;
  activeReportsCount?: number;
  activeSosCount?: number;
  activeRespondersCount?: number;
  status: "OPERATIONAL" | "STANDBY" | "ADVISORY" | "WARNING" | "EMERGENCY" | "SAFE" | "ALERT" | "CRITICAL_MONITORING" | string;
  weatherSummary?: string;
  lastTelemetryAt: string;
  distanceKm?: number;
  recommendations?: string[];
  telemetry: {
    waterLevelMeters?: number;
    waterVelocityMs?: number;
    windSpeedKmH?: number;
    rainfallMmHr?: number;
    rainfallRateMmH?: number;
    powerGridOnline?: boolean | number;
    networkCoveragePct?: number;
    waterLevelStatus?: "Normal" | "Elevated" | "Inundated" | string;
    powerGridStatus?: "Online" | "Degraded" | "Isolated" | string;
    telecomConnectivity?: "Strong" | "Moderate" | "Intermittent" | string;
    evacuationRoutesOpen?: number;
  };
}

export interface SasGridResponse {
  sectors: SasGridSector[];
  activeGridCount: number;
  overallRegionalSafetyIndex: number;
  source: string;
  timestamp: string;
  freshness: DataFreshness;
}

// -------------------------------------------------------------
// ANALYTICS DATA
// -------------------------------------------------------------
export interface AegisAnalyticsData {
  regionalSafetyScore: number; // 0-100
  activeIncidentsCount: number;
  activeVerifiedReportsCount: number;
  activeSheltersCount: number;
  totalShelterCapacity: number;
  availableShelterCapacity: number;
  emergencyHospitalsCount: number;
  availableTraumaBeds: number;
  activeRespondersOnDuty: number;
  averageResponseTimeMinutes: number;
  weatherRiskLevel: "LOW" | "MODERATE" | "HIGH" | "CRITICAL";
  sectorStatusSummary: string;
  lastUpdated: string;
}

// -------------------------------------------------------------
// USER SETTINGS
// -------------------------------------------------------------
export interface UserSettingsPayload {
  userId?: string;
  fullName?: string;
  phoneNumber?: string;
  bloodGroup?: string;
  medicalNotes?: string;
  peopleCount?: number;
  language?: string;
  theme?: "system" | "light" | "dark" | string;
  notificationsEnabled?: boolean;
  hazardAlertsEnabled?: boolean;
  liveLocationEnabled?: boolean;
  isNearbyResponder?: boolean;
  proximityRadiusKm?: number;
  emergencyContacts?: any[];
  updatedAt?: string;
}

export type IndiaEmergencyCategory =
  | "national_emergency"
  | "police"
  | "ambulance"
  | "fire"
  | "women_safety"
  | "disaster_management"
  | "child_helpline"
  | "cyber_crime"
  | "state_disaster_authority";

export interface IndiaEmergencyService {
  id: string;
  name: string;
  category: IndiaEmergencyCategory;
  number: string;
  smsNumber?: string;
  alternateNumber?: string;
  description: string;
  state?: string;
  district?: string;
  isNational: boolean;
  available24x7: boolean;
  coordinates?: { latitude: number; longitude: number };
  website?: string;
}

export interface SosMapMarker {
  id: string;
  sosId?: string;
  category?: SosEmergencyCategory;
  emergency_type?: string;
  title: string;
  severity: HazardSeverity | string;
  status: SosIncidentStatus | string;
  state: string;
  district: string;
  area: string;
  coordinates: {
    latitude: number;
    longitude: number;
  };
  isMasked?: boolean;
  peopleCount?: number;
  timestamp?: string;
  created_at?: string;
  freshness?: "LIVE" | "CACHED" | "OFFLINE" | "SYNC PENDING";
  deepLinkUrl?: string;
}

export type AegisRealtimeEventType =
  | "report.created"
  | "report.updated"
  | "report.status_changed"
  | "hazard.alert"
  | "sos.created"
  | "sos.offered"
  | "sos.accepted"
  | "sos.updated"
  | "sos.location_updated"
  | "sos.route_updated"
  | "sos.responder_moving"
  | "sos.on_site"
  | "sos.resolved"
  | "sos.cancelled"
  | "sos.expired"
  | "safe.reported"
  | "activity.created"
  | "sasgrid.updated"
  | "ping"
  | "connected";

export interface AegisRealtimeEvent {
  type: AegisRealtimeEventType;
  timestamp: string;
  data: any;
}
