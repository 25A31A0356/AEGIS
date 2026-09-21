import AsyncStorage from "@react-native-async-storage/async-storage";
import { DataFreshness, SosIncident, SafeCheckInRecord, RecentActivity } from "./aegis-types";

export interface CacheEntry<T> {
  data: T;
  timestamp: number; // Date.now()
  ttlMs: number;
  source: string;
}

export interface CapturedGps {
  latitude: number;
  longitude: number;
  accuracyMeters: number;
  altitude?: number | null;
  heading?: number | null;
  speed?: number | null;
  timestamp: number;
  provider: "GPS" | "NETWORK" | "FALLBACK" | "CACHED";
  locationName?: string;
  city?: string;
  state?: string;
}

export type OfflineSosStatus =
  | "QUEUED"
  | "WAITING_FOR_NETWORK"
  | "SYNCING"
  | "CONFIRMED"
  | "RESOLVED"
  | "CANCELLED";

export interface OfflineSosState {
  id: string; // Client-side tracking ID
  idempotencyKey: string; // Unique UUID key for offline deduplication
  status: OfflineSosStatus;
  gps: CapturedGps;
  emergencyType: string;
  description: string;
  peopleCount: number;
  batteryLevel?: number;
  networkStatus?: "OFFLINE" | "CELLULAR" | "WIFI" | "UNKNOWN";
  isConfirmed: boolean;
  backendSosId?: string; // Set once acknowledged by PostgreSQL
  confirmedAt?: string;
  queuedAt: number;
  lastAttemptAt?: number;
  syncAttempts: number;
  smsSent: boolean;
  smsDetails?: {
    phoneNumber: string;
    sentAt: string;
    body: string;
    platformConfirmed: boolean;
  };
}

export interface ReportDraft {
  category: string;
  hazardType?: string;
  title: string;
  description: string;
  severity: string;
  location: {
    lat: number;
    lng: number;
    address: string;
    city: string;
    state: string;
  };
  mediaUrls: string[];
  mediaType?: "PHOTO" | "VIDEO" | "MIXED" | "NONE";
  peopleAffected?: string;
  isRoadBlocked?: boolean | "partial";
  isImmediateDanger?: boolean;
  contactPhone?: string;
  updatedAt: number;
}

export interface EmergencyHotline {
  id: string;
  number: string;
  name: string;
  department: string;
  category: "NATIONAL" | "POLICE" | "FIRE" | "MEDICAL" | "DISASTER" | "WOMEN_CHILD" | "UTILITY";
  description: string;
  isTollFree: boolean;
  available24x7: boolean;
}

export interface SafetyGuide {
  id: string;
  hazardType: string;
  title: string;
  severity: "CRITICAL" | "HIGH" | "MODERATE";
  iconName: string;
  summary: string;
  before: string[];
  during: string[];
  after: string[];
  emergencyKit: string[];
}

export interface QueuedAction {
  id: string;
  type: "safe_ping" | "sos_beacon" | "community_report" | "sos_incident" | "safe_checkin" | "safe_check_in";
  payload: Record<string, unknown>;
  createdAt: number;
  retryCount: number;
}

const CACHE_PREFIX = "aegis_cache_";
const QUEUE_KEY = "aegis_offline_action_queue";
const SAFE_HISTORY_KEY = "aegis_safe_checkin_history";
const SOS_INCIDENTS_KEY = "aegis_local_sos_incidents";
const SOS_STATE_KEY = "aegis_active_offline_sos_state";
const REPORT_DRAFT_KEY = "aegis_active_report_draft";
const FAMILY_CONTACTS_KEY = "aegis_family_emergency_contacts";
const ACTIVITIES_KEY = "aegis_recent_activities_cache";
const ALERTS_CACHE_KEY = "aegis_cached_active_alerts";
const COMMUNITY_REPORTS_KEY = "@aegis_local_community_reports";

// In-memory quick lookup cache
const memoryCache = new Map<string, CacheEntry<unknown>>();

// Default TTLs in milliseconds
export const CACHE_TTL = {
  WEATHER: 15 * 60 * 1000, // 15 minutes
  HAZARDS: 5 * 60 * 1000, // 5 minutes
  ALERTS: 10 * 60 * 1000, // 10 minutes
  SHELTERS: 60 * 60 * 1000, // 1 hour
  HOSPITALS: 60 * 60 * 1000, // 1 hour
  ROUTES: 120 * 60 * 1000, // 2 hours
  ACTIVITIES: 10 * 60 * 1000, // 10 minutes
};

/**
 * Format a timestamp into a human-readable "LAST UPDATED: <date/time>" string.
 */
export function formatLastUpdated(timestamp: number | string | Date): string {
  const date = new Date(timestamp);
  if (isNaN(date.getTime())) {
    return "LAST UPDATED: Unknown";
  }

  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMinutes = Math.floor(diffMs / 60000);

  if (diffMinutes < 1) {
    return "LAST UPDATED: Just now";
  } else if (diffMinutes < 60) {
    return `LAST UPDATED: ${diffMinutes}m ago`;
  } else if (diffMinutes < 1440) {
    const hours = Math.floor(diffMinutes / 60);
    return `LAST UPDATED: ${hours}h ago`;
  } else {
    return `LAST UPDATED: ${date.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })}`;
  }
}

/**
 * Calculate the data freshness level based on age and TTL.
 */
export function calculateFreshness(
  timestamp: number,
  ttlMs: number
): DataFreshness {
  const age = Date.now() - timestamp;
  if (age <= ttlMs) {
    return "LIVE";
  } else if (age <= ttlMs * 4) {
    return "CACHED";
  } else {
    return "STALE";
  }
}

/**
 * Save data to persistent and in-memory cache with specified TTL.
 */
export async function setCachedData<T>(
  key: string,
  data: T,
  ttlMs: number = CACHE_TTL.WEATHER,
  source: string = "Aegis Software"
): Promise<void> {
  const entry: CacheEntry<T> = {
    data,
    timestamp: Date.now(),
    ttlMs,
    source,
  };

  const fullKey = `${CACHE_PREFIX}${key}`;
  memoryCache.set(fullKey, entry as CacheEntry<unknown>);

  try {
    await AsyncStorage.setItem(fullKey, JSON.stringify(entry));
  } catch (error) {
    console.warn(`[AegisCache] Failed to persist cache key ${fullKey}:`, error);
  }
}

/**
 * Retrieve cached data. Returns the entry along with calculated freshness and formatted timestamp.
 */
export async function getCachedData<T>(
  key: string
): Promise<{
  data: T;
  timestamp: number;
  freshness: DataFreshness;
  lastUpdatedFormatted: string;
  source: string;
  isStale: boolean;
} | null> {
  const fullKey = `${CACHE_PREFIX}${key}`;

  // 1. Try Memory cache first
  let entry = memoryCache.get(fullKey) as CacheEntry<T> | undefined;

  // 2. Try AsyncStorage
  if (!entry) {
    try {
      const stored = await AsyncStorage.getItem(fullKey);
      if (stored) {
        entry = JSON.parse(stored) as CacheEntry<T>;
        memoryCache.set(fullKey, entry as CacheEntry<unknown>);
      }
    } catch (error) {
      console.warn(`[AegisCache] Failed to read cache key ${fullKey}:`, error);
    }
  }

  if (!entry) {
    return null;
  }

  const freshness = calculateFreshness(entry.timestamp, entry.ttlMs);
  const isStale = freshness === "STALE";

  return {
    data: entry.data,
    timestamp: entry.timestamp,
    freshness,
    lastUpdatedFormatted: formatLastUpdated(entry.timestamp),
    source: entry.source || "Aegis Cache",
    isStale,
  };
}

/**
 * Clear a specific cached key or all aegis cache.
 */
export async function clearCachedData(key?: string): Promise<void> {
  if (key) {
    const fullKey = `${CACHE_PREFIX}${key}`;
    memoryCache.delete(fullKey);
    try {
      await AsyncStorage.removeItem(fullKey);
    } catch {}
  } else {
    memoryCache.clear();
    try {
      const keys = await AsyncStorage.getAllKeys();
      const aegisKeys = keys.filter((k) => k.startsWith(CACHE_PREFIX));
      if (aegisKeys.length > 0) {
        await AsyncStorage.multiRemove(aegisKeys);
      }
    } catch {}
  }
}

/**
 * Clear entire persistent cache including queues, history, and incidents.
 */
export async function clearAllCache(): Promise<void> {
  await clearCachedData();
  await clearOfflineQueue();
  await clearLocalSosState();
  await clearReportDraft();
  try {
    await AsyncStorage.multiRemove([
      SAFE_HISTORY_KEY,
      SOS_INCIDENTS_KEY,
      SOS_STATE_KEY,
      REPORT_DRAFT_KEY,
      ACTIVITIES_KEY,
      ALERTS_CACHE_KEY,
      COMMUNITY_REPORTS_KEY,
    ]);
  } catch {}
}

// ---------------------------------------------------------------------------
// 1. SOS QUEUE & PERSISTENT STATE MACHINE
// ---------------------------------------------------------------------------

export async function saveLocalSosState(state: OfflineSosState): Promise<void> {
  try {
    await AsyncStorage.setItem(SOS_STATE_KEY, JSON.stringify(state));
  } catch (e) {
    console.warn("[AegisCache] Failed to save offline SOS state:", e);
  }
}

export async function getLocalSosState(): Promise<OfflineSosState | null> {
  try {
    const raw = await AsyncStorage.getItem(SOS_STATE_KEY);
    return raw ? (JSON.parse(raw) as OfflineSosState) : null;
  } catch {
    return null;
  }
}

export async function clearLocalSosState(): Promise<void> {
  try {
    await AsyncStorage.removeItem(SOS_STATE_KEY);
  } catch {}
}

export async function queueOfflineSos(
  payload: {
    emergencyType: string;
    description: string;
    peopleCount: number;
    batteryLevel?: number;
    networkStatus?: "OFFLINE" | "CELLULAR" | "WIFI" | "UNKNOWN";
  },
  gps: CapturedGps
): Promise<OfflineSosState> {
  const idempotencyKey = `sos_offline_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  const localId = `sos_loc_${Date.now()}`;

  const state: OfflineSosState = {
    id: localId,
    idempotencyKey,
    status: "QUEUED",
    gps,
    emergencyType: payload.emergencyType,
    description: payload.description,
    peopleCount: payload.peopleCount,
    batteryLevel: payload.batteryLevel,
    networkStatus: payload.networkStatus || "OFFLINE",
    isConfirmed: false,
    queuedAt: Date.now(),
    syncAttempts: 0,
    smsSent: false,
  };

  // 1. Save authoritative local state
  await saveLocalSosState(state);

  // 2. Queue for background sync engine
  await queueOfflineAction("sos_beacon", {
    ...state,
    latitude: gps.latitude,
    longitude: gps.longitude,
    accuracy_meters: gps.accuracyMeters,
    emergency_type: payload.emergencyType,
    people_count: payload.peopleCount,
    idempotency_key: idempotencyKey,
  });

  return state;
}

// ---------------------------------------------------------------------------
// 2. CITIZEN REPORT DRAFTS & OFFLINE QUEUE
// ---------------------------------------------------------------------------

export async function saveReportDraft(draft: ReportDraft): Promise<void> {
  try {
    await AsyncStorage.setItem(
      REPORT_DRAFT_KEY,
      JSON.stringify({ ...draft, updatedAt: Date.now() })
    );
  } catch (e) {
    console.warn("[AegisCache] Failed to save report draft:", e);
  }
}

export async function getReportDraft(): Promise<ReportDraft | null> {
  try {
    const raw = await AsyncStorage.getItem(REPORT_DRAFT_KEY);
    return raw ? (JSON.parse(raw) as ReportDraft) : null;
  } catch {
    return null;
  }
}

export async function clearReportDraft(): Promise<void> {
  try {
    await AsyncStorage.removeItem(REPORT_DRAFT_KEY);
  } catch {}
}

export async function queueOfflineReport(
  report: {
    category: string;
    title: string;
    description: string;
    severity: string;
    latitude: number;
    longitude: number;
    accuracy_meters?: number;
    location_name?: string;
    city?: string;
    state?: string;
    media_urls?: string[];
    media_type?: string;
    reporter_name?: string;
    idempotency_key?: string;
  }
): Promise<QueuedAction> {
  const idempotencyKey =
    report.idempotency_key ||
    `rep_offline_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

  const localReportRecord = {
    ...report,
    id: `rep_local_${Date.now()}`,
    idempotency_key: idempotencyKey,
    status: "SUBMITTED",
    is_verified: false,
    verification_status: "UNVERIFIED",
    source_type: "COMMUNITY_REPORT",
    created_at: new Date().toISOString(),
  };

  // Save to local reports cache
  await saveLocalCommunityReport(localReportRecord);

  // Clear active draft since report was queued
  await clearReportDraft();

  // Enqueue for background synchronization
  return await queueOfflineAction("community_report", {
    ...report,
    idempotency_key: idempotencyKey,
  });
}

// ---------------------------------------------------------------------------
// 3. GENERIC OFFLINE ACTION QUEUE
// ---------------------------------------------------------------------------

export async function queueOfflineAction(
  type: QueuedAction["type"],
  payload: Record<string, unknown>
): Promise<QueuedAction> {
  const action: QueuedAction = {
    id: `queue_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    type,
    payload,
    createdAt: Date.now(),
    retryCount: 0,
  };

  try {
    const queue = await getOfflineQueue();
    queue.push(action);
    await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
  } catch (error) {
    console.error("[AegisCache] Failed to queue offline action:", error);
  }

  return action;
}

export async function getOfflineQueue(): Promise<QueuedAction[]> {
  try {
    const stored = await AsyncStorage.getItem(QUEUE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

export async function removeQueuedAction(id: string): Promise<void> {
  try {
    const queue = await getOfflineQueue();
    const filtered = queue.filter((item) => item.id !== id);
    await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(filtered));
  } catch {}
}

export async function clearOfflineQueue(): Promise<void> {
  try {
    await AsyncStorage.removeItem(QUEUE_KEY);
  } catch {}
}

// ---------------------------------------------------------------------------
// 4. PAN-INDIA NATIONAL EMERGENCY HOTLINES & CONTACTS
// ---------------------------------------------------------------------------

export const PAN_INDIA_NATIONAL_HOTLINES: EmergencyHotline[] = [
  {
    id: "hotline_112",
    number: "112",
    name: "National Emergency Response System (NERS)",
    department: "Ministry of Home Affairs",
    category: "NATIONAL",
    description: "Unified pan-India emergency number for Police, Fire, and Ambulance.",
    isTollFree: true,
    available24x7: true,
  },
  {
    id: "hotline_100",
    number: "100",
    name: "Police Control Room",
    department: "State Police Forces",
    category: "POLICE",
    description: "Direct emergency dispatch for law enforcement and immediate threat assistance.",
    isTollFree: true,
    available24x7: true,
  },
  {
    id: "hotline_101",
    number: "101",
    name: "Fire & Rescue Services",
    department: "Fire Services Directorate",
    category: "FIRE",
    description: "Emergency fire response, rescue operations, and structural collapse dispatch.",
    isTollFree: true,
    available24x7: true,
  },
  {
    id: "hotline_108",
    number: "108",
    name: "Emergency Medical & Disaster Ambulance",
    department: "National Health Mission",
    category: "MEDICAL",
    description: "Advanced Life Support (ALS) and Basic Life Support (BLS) emergency ambulances.",
    isTollFree: true,
    available24x7: true,
  },
  {
    id: "hotline_1070",
    number: "1070",
    name: "State Disaster Management Authority (SDMA)",
    department: "Disaster Management Dept",
    category: "DISASTER",
    description: "State disaster operations center for cyclones, floods, earthquakes, and landslides.",
    isTollFree: true,
    available24x7: true,
  },
  {
    id: "hotline_1077",
    number: "1077",
    name: "District Disaster Control Room (DDMA)",
    department: "District Collectorate",
    category: "DISASTER",
    description: "District-level emergency operations center and local flood/relief coordination.",
    isTollFree: true,
    available24x7: true,
  },
  {
    id: "hotline_1091",
    number: "1091",
    name: "Women in Distress Helpline",
    department: "National Commission for Women",
    category: "WOMEN_CHILD",
    description: "24x7 emergency response and safety coordination for women.",
    isTollFree: true,
    available24x7: true,
  },
  {
    id: "hotline_1098",
    number: "1098",
    name: "Childline Emergency Support",
    department: "Ministry of Women & Child Development",
    category: "WOMEN_CHILD",
    description: "24-hour emergency outreach service for missing or stranded children.",
    isTollFree: true,
    available24x7: true,
  },
  {
    id: "hotline_1906",
    number: "1906",
    name: "LPG Gas Leakage Emergency Helpline",
    department: "Petroleum Ministry",
    category: "UTILITY",
    description: "Immediate emergency assistance for gas pipeline or cylinder leaks.",
    isTollFree: true,
    available24x7: true,
  },
];

export function getNationalEmergencyHotlines(): EmergencyHotline[] {
  return PAN_INDIA_NATIONAL_HOTLINES;
}

export async function saveFamilyEmergencyContacts(contacts: any[]): Promise<void> {
  try {
    await AsyncStorage.setItem(FAMILY_CONTACTS_KEY, JSON.stringify(contacts));
  } catch (e) {
    console.warn("[AegisCache] Failed to save family emergency contacts:", e);
  }
}

export async function getFamilyEmergencyContacts(): Promise<any[]> {
  try {
    const raw = await AsyncStorage.getItem(FAMILY_CONTACTS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

// ---------------------------------------------------------------------------
// 5. OFFLINE EMERGENCY SURVIVAL GUIDES
// ---------------------------------------------------------------------------

export const OFFLINE_SAFETY_GUIDES: SafetyGuide[] = [
  {
    id: "guide_flood",
    hazardType: "FLOOD",
    title: "Flood & Flash Flood Survival Protocol",
    severity: "CRITICAL",
    iconName: "drop.fill",
    summary: "Immediate survival procedures for rising waters, flash floods, and dam spillages.",
    before: [
      "Move to higher ground or upper floor immediately upon warning.",
      "Turn off main electrical breaker and gas cylinders.",
      "Store at least 5 liters of clean drinking water in sealed containers.",
      "Pack emergency kit in waterproof bag (ID cards, medicines, torch).",
    ],
    during: [
      "NEVER walk or drive through moving water. 6 inches of water can knock you down; 2 feet can sweep cars.",
      "Avoid contact with floodwater — it is often contaminated and electrically charged by downed lines.",
      "If trapped in a building, climb to the roof and signal for rescue. Do not enter closed attics.",
      "Keep phone on battery saver mode and broadcast SOS beacon.",
    ],
    after: [
      "Do not return home until emergency authorities confirm it is safe.",
      "Boil all tap or well water for at least 3 minutes before drinking.",
      "Watch out for snakes, rodents, and electrical hazards.",
      "Report damaged roads or fallen power poles via AEGIS Community Report.",
    ],
    emergencyKit: [
      "Drinking water (3 days supply)",
      "Non-perishable food & energy bars",
      "First aid kit & antiseptic solution",
      "LED flashlight with extra batteries",
      "Power bank & charging cables",
      "Waterproof document pouch",
      "Emergency whistle",
    ],
  },
  {
    id: "guide_earthquake",
    hazardType: "EARTHQUAKE",
    title: "Earthquake Survival: Drop, Cover, Hold On",
    severity: "CRITICAL",
    iconName: "waveform.path.ecg",
    summary: "High-priority seismic safety actions during tremors and aftershocks.",
    before: [
      "Fasten heavy furniture, cupboards, and water heaters to wall studs.",
      "Identify safe spots in every room: under sturdy desks or interior walls.",
      "Keep emergency exits and stairways free of obstructions.",
    ],
    during: [
      "DROP to your hands and knees to prevent being knocked over.",
      "COVER your head and neck under a sturdy table or desk.",
      "HOLD ON until the shaking stops.",
      "If indoors, stay inside. DO NOT use elevators or rush for exits.",
      "If outdoors, move to an open area away from buildings, trees, and power lines.",
    ],
    after: [
      "Expect aftershocks within hours and days.",
      "Check yourself and others for injuries; provide first aid.",
      "Check for gas leaks; if smelled, turn off main valve and evacuate.",
      "Listen to battery-powered radio or AEGIS Alert updates.",
    ],
    emergencyKit: [
      "Sturdy shoes & leather work gloves",
      "First aid supplies & painkillers",
      "Dust mask (N95) for debris",
      "Emergency whistle",
      "Flashlight & power bank",
    ],
  },
  {
    id: "guide_cyclone",
    hazardType: "CYCLONE",
    title: "Severe Cyclone & Storm Surge Safety",
    severity: "CRITICAL",
    iconName: "tornado",
    summary: "Safety protocol for landfall, gale-force winds, and coastal storm surges.",
    before: [
      "Board up windows or install storm shutters; tape large glass panes.",
      "Clear loose debris, tin sheets, and potted plants from balconies and roofs.",
      "Identify the nearest designated cyclone shelter.",
      "Fully charge all phones, power banks, and emergency lanterns.",
    ],
    during: [
      "Stay indoors in the strongest, windowless room on the ground floor.",
      "Beware the 'eye of the storm': a sudden calm means the other half is coming.",
      "Disconnect all electrical appliances.",
    ],
    after: [
      "Beware of fallen live wires and weakened structures.",
      "Do not enter coastal areas until storm surge has completely receded.",
      "Use AEGIS Safe Check-in to notify loved ones.",
    ],
    emergencyKit: [
      "Portable radio with batteries",
      "Water purification tablets",
      "Dry rations (flattened rice, biscuits)",
      "Prescription medications",
    ],
  },
  {
    id: "guide_fire",
    hazardType: "FIRE",
    title: "Building & Wildfire Emergency Protocol",
    severity: "HIGH",
    iconName: "flame.fill",
    summary: "Immediate evacuation protocol and smoke inhalation prevention.",
    before: [
      "Install and test smoke detectors on every floor.",
      "Know at least two escape routes from every room.",
      "Keep a multipurpose fire extinguisher (ABC type) accessible.",
    ],
    during: [
      "Crawl low under smoke where air is cleaner and cooler.",
      "Feel closed doors with the back of your hand before opening. If hot, use another exit.",
      "If clothes catch fire: STOP, DROP, and ROLL.",
      "Call 101 / 112 immediately once safely outside.",
    ],
    after: [
      "Do not re-enter a burned building until cleared by the fire department.",
      "Seek medical attention for smoke inhalation or burns.",
    ],
    emergencyKit: [
      "Smoke hood / N95 masks",
      "Burn ointment & sterile dressings",
      "Emergency escape ladder",
    ],
  },
  {
    id: "guide_landslide",
    hazardType: "LANDSLIDE",
    title: "Landslide & Mudflow Safety Guide",
    severity: "HIGH",
    iconName: "mountain.2.fill",
    summary: "Precautions for hilly regions during monsoon downpours and soil erosion.",
    before: [
      "Recognize warning signs: doors sticking, cracks in soil, tilting utility poles.",
      "Plan rapid evacuation routes to stable ridge tops.",
    ],
    during: [
      "If near a stream or channel, be alert for sudden changes in water flow or mud.",
      "Move away from the path of debris flow immediately.",
      "If escape is impossible, curl into a tight ball and protect your head.",
    ],
    after: [
      "Stay away from slide areas; secondary landslides often follow.",
      "Report damaged mountain roads and blocked drainage channels.",
    ],
    emergencyKit: [
      "Sturdy hiking boots",
      "High-visibility reflective vest",
      "Thermal survival blanket",
    ],
  },
  {
    id: "guide_lightning",
    hazardType: "LIGHTNING",
    title: "Lightning & Severe Thunderstorm Safety",
    severity: "HIGH",
    iconName: "bolt.fill",
    summary: "The 30-30 Rule and grounding protection against cloud-to-ground strikes.",
    before: [
      "Follow the 30-30 Rule: If time between lightning flash and thunder is < 30s, take shelter.",
    ],
    during: [
      "Seek shelter in a fully enclosed substantial building or metal-topped vehicle.",
      "Avoid open fields, tall isolated trees, water bodies, and metal fences.",
      "If caught outdoors with no shelter: crouch down on the balls of your feet with heels touching, hands over ears.",
      "Do not use corded phones or touch plugged-in electronics.",
    ],
    after: [
      "Wait 30 minutes after the last thunderclap before leaving shelter.",
      "Provide CPR immediately if someone is struck; lightning victims carry no electrical charge.",
    ],
    emergencyKit: [
      "Surge protectors for electronics",
      "Emergency battery-operated lantern",
    ],
  },
  {
    id: "guide_first_aid",
    hazardType: "FIRST_AID",
    title: "Emergency First Aid & Trauma Response",
    severity: "HIGH",
    iconName: "cross.fill",
    summary: "Immediate life-saving techniques for severe bleeding, shock, and CPR.",
    before: [
      "Keep a comprehensive first aid kit in your home, car, and workplace.",
      "Memorize the universal emergency number: 112 / 108.",
    ],
    during: [
      "Severe Bleeding: Apply firm, direct pressure with a clean cloth. Elevate if possible.",
      "CPR: Place hands in center of chest. Push hard and fast at 100-120 beats per minute.",
      "Shock: Lay person flat, elevate feet 12 inches, and keep warm with a blanket.",
      "Choking: Perform the Heimlich maneuver (upward abdominal thrusts).",
    ],
    after: [
      "Monitor victim's breathing and consciousness until medical responders arrive.",
    ],
    emergencyKit: [
      "Sterile gauze pads & adhesive tape",
      "Tourniquet & elastic bandages",
      "Antiseptic wipes & povidone iodine",
      "Burn dressing & CPR face shield",
      "Scissors & tweezers",
    ],
  },
];

export function getOfflineSafetyGuides(): SafetyGuide[] {
  return OFFLINE_SAFETY_GUIDES;
}

// ---------------------------------------------------------------------------
// 6. LAST-KNOWN DISASTER ALERTS CACHING
// ---------------------------------------------------------------------------

export async function saveActiveAlertsCache(alerts: any[]): Promise<void> {
  await setCachedData(ALERTS_CACHE_KEY, alerts, CACHE_TTL.ALERTS, "AEGIS Unified Alert Stream");
}

export async function getCachedAlertsWithFreshness(): Promise<{
  alerts: any[];
  freshness: DataFreshness;
  lastUpdatedFormatted: string;
  isStale: boolean;
}> {
  const res = await getCachedData<any[]>(ALERTS_CACHE_KEY);
  if (!res || !Array.isArray(res.data)) {
    return {
      alerts: [],
      freshness: "STALE",
      lastUpdatedFormatted: "LAST UPDATED: Never",
      isStale: true,
    };
  }
  return {
    alerts: res.data,
    freshness: res.freshness,
    lastUpdatedFormatted: res.lastUpdatedFormatted,
    isStale: res.isStale,
  };
}

// ---------------------------------------------------------------------------
// 7. HISTORICAL RECORDS & FALLBACK WRAPPERS
// ---------------------------------------------------------------------------

export async function saveSafeCheckInHistory(record: SafeCheckInRecord | any): Promise<void> {
  try {
    const raw = await AsyncStorage.getItem(SAFE_HISTORY_KEY);
    const list = raw ? JSON.parse(raw) : [];
    list.unshift(record);
    await AsyncStorage.setItem(SAFE_HISTORY_KEY, JSON.stringify(list.slice(0, 100)));
  } catch (e) {
    console.warn("[AegisCache] Failed to save safe check-in history:", e);
  }
}

export const recordSafeCheckIn = saveSafeCheckInHistory;

export async function getSafeCheckInHistory(): Promise<SafeCheckInRecord[]> {
  try {
    const raw = await AsyncStorage.getItem(SAFE_HISTORY_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export async function saveLocalSosIncident(incident: SosIncident | any): Promise<void> {
  try {
    const raw = await AsyncStorage.getItem(SOS_INCIDENTS_KEY);
    const map = raw ? JSON.parse(raw) : {};
    map[incident.id] = incident;
    await AsyncStorage.setItem(SOS_INCIDENTS_KEY, JSON.stringify(map));
  } catch (e) {
    console.warn("[AegisCache] Failed to save local SOS incident:", e);
  }
}

export async function getLocalSosIncidents(): Promise<Record<string, SosIncident>> {
  try {
    const raw = await AsyncStorage.getItem(SOS_INCIDENTS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export async function getLocalSosIncident(): Promise<SosIncident | null> {
  try {
    const map = await getLocalSosIncidents();
    const incidents = Object.values(map);
    if (incidents.length === 0) return null;

    incidents.sort(
      (a, b) =>
        new Date(b.updatedAt || b.createdAt).getTime() -
        new Date(a.updatedAt || a.createdAt).getTime()
    );
    return incidents[0] || null;
  } catch {
    return null;
  }
}

export async function removeLocalSosIncident(id: string): Promise<void> {
  try {
    const raw = await AsyncStorage.getItem(SOS_INCIDENTS_KEY);
    if (!raw) return;
    const map = JSON.parse(raw);
    delete map[id];
    await AsyncStorage.setItem(SOS_INCIDENTS_KEY, JSON.stringify(map));
  } catch {}
}

export async function saveRecentActivitiesCache(activities: RecentActivity[] | any[]): Promise<void> {
  try {
    await AsyncStorage.setItem(ACTIVITIES_KEY, JSON.stringify(activities));
  } catch {}
}

export const setCachedActivities = saveRecentActivitiesCache;

export async function getRecentActivitiesCache(): Promise<RecentActivity[] | null> {
  try {
    const raw = await AsyncStorage.getItem(ACTIVITIES_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export const getCachedActivities = getRecentActivitiesCache;

export async function saveLocalCommunityReport(report: any): Promise<void> {
  try {
    const raw = await AsyncStorage.getItem(COMMUNITY_REPORTS_KEY);
    const list: any[] = raw ? JSON.parse(raw) : [];
    const existingIdx = list.findIndex((r) => r.id === report.id);
    if (existingIdx >= 0) {
      list[existingIdx] = { ...list[existingIdx], ...report };
    } else {
      list.unshift(report);
    }
    await AsyncStorage.setItem(COMMUNITY_REPORTS_KEY, JSON.stringify(list.slice(0, 100)));
  } catch (e) {
    console.warn("[AegisCache] Failed to save local community report:", e);
  }
}

export async function getLocalCommunityReports(): Promise<any[]> {
  try {
    const raw = await AsyncStorage.getItem(COMMUNITY_REPORTS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}
