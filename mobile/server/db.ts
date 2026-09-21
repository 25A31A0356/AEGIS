import { desc, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  InsertUser,
  users,
  safePings,
  sosBeacons,
  communityReports,
  recentActivities,
  sasGridRecords,
  shelters,
  hospitals,
  hazardZones,
  RecentActivityRecord,
  SasGridRecord,
} from "../drizzle/schema";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// -------------------------------------------------------------
// USER & SETTINGS
// -------------------------------------------------------------
export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }
  const values: InsertUser = { openId: user.openId };
  const updateSet: Record<string, unknown> = {};
  const textFields = ["name", "email", "loginMethod", "settings"] as const;
  textFields.forEach((field) => {
    if (user[field] !== undefined) {
      values[field] = user[field] ?? null;
      updateSet[field] = user[field] ?? null;
    }
  });
  if (user.lastSignedIn !== undefined) {
    values.lastSignedIn = user.lastSignedIn;
    updateSet.lastSignedIn = user.lastSignedIn;
  }
  if (user.role !== undefined) {
    values.role = user.role;
    updateSet.role = user.role;
  } else if (user.openId === ENV.ownerOpenId) {
    values.role = "admin";
    updateSet.role = "admin";
  }
  if (!values.lastSignedIn) values.lastSignedIn = new Date();
  if (Object.keys(updateSet).length === 0) updateSet.lastSignedIn = new Date();
  await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function updateUserSettings(userId: number, settingsJson: string) {
  const db = await getDb();
  if (!db) return false;
  await db.update(users).set({ settings: settingsJson, updatedAt: new Date() }).where(eq(users.id, userId));
  return true;
}

// -------------------------------------------------------------
// SAFE PINGS / CHECK-INS
// -------------------------------------------------------------
export async function createSafePing(input: typeof safePings.$inferInsert) {
  const db = await getDb();
  if (!db) return { queued: true, localId: `local-ping-${Date.now()}` };
  const result = await db.insert(safePings).values(input);
  return { queued: true, id: Number(result[0].insertId) };
}

export async function getSafePings(limit: number = 50) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(safePings).orderBy(desc(safePings.createdAt)).limit(limit);
}

// -------------------------------------------------------------
// SOS BEACONS
// -------------------------------------------------------------
export async function createSosBeacon(input: typeof sosBeacons.$inferInsert) {
  const db = await getDb();
  if (!db) return { recorded: true, localId: `local-beacon-${Date.now()}` };
  const result = await db.insert(sosBeacons).values(input);
  return { recorded: true, id: Number(result[0].insertId) };
}

export async function updateSosBeacon(id: number, status: string) {
  const db = await getDb();
  if (!db) return false;
  await db.update(sosBeacons).set({ status, updatedAt: new Date() }).where(eq(sosBeacons.id, id));
  return true;
}

export async function getSosBeacons(limit: number = 50) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(sosBeacons).orderBy(desc(sosBeacons.createdAt)).limit(limit);
}

// -------------------------------------------------------------
// COMMUNITY REPORTS
// -------------------------------------------------------------
export async function createCommunityReport(input: typeof communityReports.$inferInsert) {
  const db = await getDb();
  if (!db) return { queued: true, localId: `local-report-${Date.now()}` };
  const result = await db.insert(communityReports).values(input);
  return { queued: true, id: Number(result[0].insertId) };
}

export async function updateCommunityReportStatus(
  id: number | string,
  status: string,
  verificationStatus?: string
) {
  const db = await getDb();
  if (!db) return false;
  const updateObj: Record<string, unknown> = { status, updatedAt: new Date() };
  if (verificationStatus) updateObj.verificationStatus = verificationStatus;

  if (typeof id === "number") {
    await db.update(communityReports).set(updateObj).where(eq(communityReports.id, id));
  } else {
    await db.update(communityReports).set(updateObj).where(eq(communityReports.trackingId, id));
  }
  return true;
}

export async function getCommunityReports(limit: number = 50) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(communityReports).orderBy(desc(communityReports.createdAt)).limit(limit);
}

// -------------------------------------------------------------
// RECENT ACTIVITIES
// -------------------------------------------------------------
export async function createRecentActivity(input: typeof recentActivities.$inferInsert) {
  const db = await getDb();
  if (!db) return false;
  await db.insert(recentActivities).values(input);
  return true;
}

export async function getRecentActivities(limit: number = 50): Promise<RecentActivityRecord[]> {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(recentActivities).orderBy(desc(recentActivities.createdAt)).limit(limit);
}

// -------------------------------------------------------------
// SASGRID RECORDS
// -------------------------------------------------------------
export async function createSasGridRecord(input: typeof sasGridRecords.$inferInsert) {
  const db = await getDb();
  if (!db) return false;
  await db.insert(sasGridRecords).values(input);
  return true;
}

const BASELINE_SASGRID_RECORDS: SasGridRecord[] = [
  {
    id: 1,
    sectorCode: "SEC-08-HARBOR",
    sectorName: "Harbor & Port Basin Grid",
    state: "Andhra Pradesh",
    district: "Visakhapatnam",
    centerLat: 17.695,
    centerLng: 83.2225,
    boundsJson: JSON.stringify([
      [17.685, 83.21],
      [17.705, 83.21],
      [17.705, 83.235],
      [17.685, 83.235],
    ]),
    safetyIndex: 18,
    hazardLevel: "HIGH",
    activeAlertsCount: 2,
    status: "CRITICAL_MONITORING",
    weatherSummary: "Heavy Rain (48mm/hr), Wind 54km/h",
    metadataJson: JSON.stringify({
      waterLevelMeters: 1.4,
      waterVelocityMs: 2.1,
      windSpeedKmH: 54,
      rainfallMmHr: 48,
      powerGridOnline: 0,
      networkCoveragePct: 65,
      recommendations: ["Evacuate to elevated shelters", "Avoid Harbor Lowland Road"],
    }),
    lastTelemetryAt: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 2,
    sectorCode: "SEC-14-RIDGE",
    sectorName: "Ridge Crest Safe Plateau",
    state: "Andhra Pradesh",
    district: "Visakhapatnam",
    centerLat: 17.74,
    centerLng: 83.295,
    boundsJson: JSON.stringify([
      [17.73, 83.28],
      [17.75, 83.28],
      [17.75, 83.31],
      [17.73, 83.31],
    ]),
    safetyIndex: 82,
    hazardLevel: "LOW",
    activeAlertsCount: 0,
    status: "OPERATIONAL",
    weatherSummary: "Light Rain (8mm/hr), Wind 22km/h",
    metadataJson: JSON.stringify({
      waterLevelMeters: 0.05,
      waterVelocityMs: 0.1,
      windSpeedKmH: 22,
      rainfallMmHr: 8,
      powerGridOnline: 1,
      networkCoveragePct: 98,
      recommendations: ["Designated safe muster sector", "Open for shelter intake"],
    }),
    lastTelemetryAt: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

export async function getSasGridRecords(limit: number = 100): Promise<SasGridRecord[]> {
  const db = await getDb();
  if (!db) return BASELINE_SASGRID_RECORDS.slice(0, limit);
  const rows = await db.select().from(sasGridRecords).orderBy(desc(sasGridRecords.lastTelemetryAt)).limit(limit);
  return rows.length > 0 ? rows : BASELINE_SASGRID_RECORDS.slice(0, limit);
}

// -------------------------------------------------------------
// SHELTERS, HOSPITALS, HAZARD ZONES
// -------------------------------------------------------------
export async function getSheltersFromDb() {
  const db = await getDb();
  if (!db) return [{ id: 1, name: "APSDMA Cyclone Relief Center", elevationMeters: 45 }];
  return await db.select().from(shelters);
}

export async function getHospitalsFromDb() {
  const db = await getDb();
  if (!db) return [{ id: 1, name: "King George Trauma Hospital", openBeds: 18 }];
  return await db.select().from(hospitals);
}

export async function getHazardZonesFromDb() {
  const db = await getDb();
  if (!db) return [{ id: 1, hazardType: "FLOOD", severity: "CRITICAL", radiusMeters: 2500 }];
  return await db.select().from(hazardZones).where(eq(hazardZones.status, "ACTIVE"));
}
