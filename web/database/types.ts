/**
 * AGIES ALERT - Production Database TypeScript Models
 * Mirrors PostgreSQL schema tables, relations, PostGIS coordinates, and enums.
 */

export type UserRole = 'citizen' | 'official' | 'admin' | 'sdrf_responder' | 'ndrf_commander';

export type SeverityLevel = 'minor' | 'moderate' | 'warning' | 'high' | 'critical';

export type HazardType =
  | 'flood'
  | 'flash_flood'
  | 'cyclone'
  | 'heavy_rain'
  | 'thunderstorm'
  | 'lightning'
  | 'earthquake'
  | 'landslide'
  | 'heatwave'
  | 'coldwave'
  | 'dense_fog'
  | 'fire'
  | 'industrial_fire'
  | 'chemical_spill'
  | 'road_blockage'
  | 'dam_overflow'
  | 'building_collapse'
  | 'other';

export type AlertStatus = 'active' | 'monitoring' | 'escalated' | 'resolved' | 'cancelled';

export type ReportStatus =
  | 'Pending Review'
  | 'Under Review'
  | 'Verified'
  | 'Rejected'
  | 'Resolved';

export type MediaType = 'image/jpeg' | 'image/png' | 'image/webp' | 'video/mp4' | 'video/quicktime' | 'application/pdf';

export type LayerType = 'radar_reflectivity' | 'satellite_ir' | 'lightning_strikes' | 'safe_shelters' | 'flood_inundation_zones';

export interface UserEntity {
  id: string; // UUID
  full_name: string;
  email: string | null;
  phone_number: string | null;
  password_hash?: string;
  role: UserRole;
  state_id: string | null;
  district: string | null;
  preferred_language: string;
  is_active: boolean;
  is_verified: boolean;
  last_login_at: Date | string | null;
  created_at: Date | string;
  updated_at: Date | string;
}

export interface SavedLocationEntity {
  id: string; // UUID
  user_id: string | null;
  name: string;
  category: 'home' | 'work' | 'family' | 'other';
  latitude: number;
  longitude: number;
  address: string;
  district: string;
  state_name: string;
  state_id: string | null;
  risk_score_cache: number;
  created_at: Date | string;
  updated_at: Date | string;
}

export interface AlertEntity {
  id: string; // UUID
  bulletin_id: string;
  title: string;
  category: HazardType;
  severity: SeverityLevel;
  status: AlertStatus;
  headline: string;
  description: string;
  recommended_action: string;
  latitude: number;
  longitude: number;
  radius_km: number;
  state_name: string;
  district: string;
  source_agency: string;
  safety_guide_slug: string | null;
  published_at: Date | string;
  valid_until: Date | string;
  created_at: Date | string;
  updated_at: Date | string;
}

export interface HazardEventEntity {
  id: string; // UUID
  event_code: string;
  hazard_type: HazardType;
  title: string;
  severity: SeverityLevel;
  status: string;
  intensity_metric: string | null;
  latitude: number;
  longitude: number;
  affected_population_estimate: number;
  created_at: Date | string;
  updated_at: Date | string;
}

export interface WeatherObservationEntity {
  id: string; // UUID
  station_code: string;
  city_name: string;
  state_name: string;
  latitude: number;
  longitude: number;
  temperature_celsius: number;
  feels_like_celsius: number;
  humidity_percent: number;
  wind_speed_kmh: number;
  wind_direction: string | null;
  precipitation_probability_percent: number;
  rainfall_mm: number;
  barometric_pressure_hpa: number;
  uv_index: number;
  visibility_km: number;
  air_quality_index: number | null;
  weather_condition_text: string;
  observed_at: Date | string;
  created_at: Date | string;
}

export interface CitizenReportEntity {
  id: string; // UUID
  tracking_id: string; // 'AGIES-REP-XXXXXX'
  user_id: string | null;
  hazard_type: HazardType;
  latitude: number;
  longitude: number;
  address: string;
  description: string;
  severity: SeverityLevel;
  people_affected: number;
  road_blocked: boolean;
  immediate_danger: boolean;
  status: ReportStatus;
  reviewed_by: string | null;
  review_notes: string | null;
  contact_phone: string | null;
  is_anonymous: boolean;
  created_at: Date | string;
  updated_at: Date | string;
}

export interface ReportMediaEntity {
  id: string; // UUID
  report_id: string; // UUID
  storage_reference: string; // e.g. S3 / GCS object URL
  file_type: MediaType;
  file_size: number;
  checksum_sha256: string | null;
  is_moderated: boolean;
  created_at: Date | string;
}

export interface SafetyGuideEntity {
  id: string; // UUID
  slug: string;
  title: string;
  category: HazardType;
  status_tag: string;
  tagline: string;
  summary: string;
  dos_json: Array<{ step: number; title: string; text: string }>;
  donts_json: Array<{ step: number; title: string; text: string }>;
  video_metadata: {
    title: string;
    duration: string;
    thumbnailUrl: string;
    instructor: string;
    description: string;
    keyTakeaways: string[];
  } | null;
  is_published: boolean;
  created_at: Date | string;
  updated_at: Date | string;
}

export interface AnalyticsEventEntity {
  id: string; // UUID
  event_type: string;
  hazard_type: HazardType | null;
  state_id: string | null;
  district: string | null;
  latitude: number | null;
  longitude: number | null;
  intensity_value: number | null;
  estimated_affected: number;
  metadata: Record<string, any> | null;
  occurred_at: Date | string;
  created_at: Date | string;
}

export interface ChatSessionEntity {
  id: string; // UUID
  user_id: string | null;
  session_token: string;
  initial_page_context: string;
  location_context: string | null;
  risk_score_context: number | null;
  created_at: Date | string;
  updated_at: Date | string;
}

export interface ChatMessageEntity {
  id: string; // UUID
  session_id: string; // UUID
  sender: 'user' | 'bot';
  message_text: string;
  safety_level: string;
  sources_cited: string[] | null;
  suggested_actions: Record<string, any> | null;
  created_at: Date | string;
}

export interface MapLayerEntity {
  id: string; // UUID
  layer_type: LayerType;
  layer_name: string;
  is_active: boolean;
  tile_url_template: string | null;
  data_geojson: Record<string, any> | null;
  refresh_interval_seconds: number;
  created_at: Date | string;
  updated_at: Date | string;
}
