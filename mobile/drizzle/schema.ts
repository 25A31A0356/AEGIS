import { double, int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  settings: text("settings"), // JSON serialized user preferences
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export const safePings = mysqlTable("safe_pings", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId"),
  userName: varchar("userName", { length: 255 }),
  contact: varchar("contact", { length: 255 }).notNull(),
  message: text("message").notNull(),
  latitude: double("latitude"),
  longitude: double("longitude"),
  address: text("address"),
  relatedSosId: varchar("relatedSosId", { length: 64 }),
  status: varchar("status", { length: 32 }).default("queued").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const sosBeacons = mysqlTable("sos_beacons", {
  id: int("id").autoincrement().primaryKey(),
  trackingId: varchar("trackingId", { length: 64 }),
  userId: int("userId"),
  requesterName: varchar("requesterName", { length: 255 }),
  hazard: varchar("hazard", { length: 64 }).notNull(),
  note: text("note"),
  people: int("people").default(1).notNull(),
  bloodGroup: varchar("bloodGroup", { length: 16 }),
  medicalNotes: text("medicalNotes"),
  status: varchar("status", { length: 32 }).default("MATCHING").notNull(),
  latitude: double("latitude"),
  longitude: double("longitude"),
  accuracy: double("accuracy"),
  address: text("address"),
  district: varchar("district", { length: 128 }),
  state: varchar("state", { length: 128 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const communityReports = mysqlTable("community_reports", {
  id: int("id").autoincrement().primaryKey(),
  trackingId: varchar("trackingId", { length: 64 }),
  userId: int("userId"),
  authorName: varchar("authorName", { length: 255 }),
  hazard: varchar("hazard", { length: 64 }).notNull(),
  category: varchar("category", { length: 64 }),
  title: varchar("title", { length: 255 }),
  description: text("description"),
  details: text("details"),
  severity: mysqlEnum("severity", ["Low", "Medium", "High", "Critical"]).default("Medium").notNull(),
  status: varchar("status", { length: 32 }).default("pending_review").notNull(),
  verificationStatus: varchar("verificationStatus", { length: 32 }).default("PENDING").notNull(),
  latitude: double("latitude"),
  longitude: double("longitude"),
  accuracy: double("accuracy"),
  address: text("address"),
  imageUrl: text("imageUrl"),
  upvotes: int("upvotes").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const recentActivities = mysqlTable("recent_activities", {
  id: int("id").autoincrement().primaryKey(),
  type: varchar("type", { length: 64 }).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  subtitle: text("subtitle"),
  severity: varchar("severity", { length: 32 }),
  status: varchar("status", { length: 32 }),
  locationLabel: text("locationLabel"),
  latitude: double("latitude"),
  longitude: double("longitude"),
  userId: int("userId"),
  relatedId: varchar("relatedId", { length: 64 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const sasGridRecords = mysqlTable("sas_grid_records", {
  id: int("id").autoincrement().primaryKey(),
  sectorCode: varchar("sectorCode", { length: 64 }).notNull().unique(),
  sectorName: varchar("sectorName", { length: 255 }).notNull(),
  state: varchar("state", { length: 128 }).notNull(),
  district: varchar("district", { length: 128 }).notNull(),
  centerLat: double("centerLat").notNull(),
  centerLng: double("centerLng").notNull(),
  boundsJson: text("boundsJson"), // GeoJSON Polygon / Bounding Box
  safetyIndex: int("safetyIndex").default(85).notNull(), // 0-100
  hazardLevel: varchar("hazardLevel", { length: 32 }).default("LOW").notNull(), // LOW, MODERATE, HIGH, CRITICAL
  activeAlertsCount: int("activeAlertsCount").default(0).notNull(),
  status: varchar("status", { length: 32 }).default("OPERATIONAL").notNull(),
  lastTelemetryAt: timestamp("lastTelemetryAt").defaultNow().notNull(),
  weatherSummary: text("weatherSummary"),
  metadataJson: text("metadataJson"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const shelters = mysqlTable("shelters", {
  id: varchar("id", { length: 64 }).primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  type: varchar("type", { length: 128 }).notNull(),
  address: text("address").notNull(),
  latitude: double("latitude").notNull(),
  longitude: double("longitude").notNull(),
  elevationMeters: int("elevationMeters").default(0).notNull(),
  totalCapacity: int("totalCapacity").default(100).notNull(),
  occupiedCapacity: int("occupiedCapacity").default(0).notNull(),
  status: varchar("status", { length: 32 }).default("OPEN").notNull(),
  badge: varchar("badge", { length: 128 }),
  amenitiesJson: text("amenitiesJson"),
  contactPerson: varchar("contactPerson", { length: 255 }),
  contactNumber: varchar("contactNumber", { length: 64 }),
  lastUpdated: timestamp("lastUpdated").defaultNow().notNull(),
});

export const hospitals = mysqlTable("hospitals", {
  id: varchar("id", { length: 64 }).primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  type: varchar("type", { length: 128 }).notNull(),
  address: text("address").notNull(),
  latitude: double("latitude").notNull(),
  longitude: double("longitude").notNull(),
  elevationMeters: int("elevationMeters").default(0).notNull(),
  openBeds: int("openBeds").default(10).notNull(),
  totalCapacity: int("totalCapacity").default(100).notNull(),
  status: varchar("status", { length: 64 }).default("OPEN").notNull(),
  badge: varchar("badge", { length: 128 }),
  details: text("details"),
  contactNumber: varchar("contactNumber", { length: 64 }),
  hasTraumaReady: int("hasTraumaReady").default(1).notNull(),
  lastUpdated: timestamp("lastUpdated").defaultNow().notNull(),
});

export const hazardZones = mysqlTable("hazard_zones", {
  id: varchar("id", { length: 64 }).primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  type: varchar("type", { length: 64 }).notNull(),
  severity: varchar("severity", { length: 32 }).notNull(),
  latitude: double("latitude").notNull(),
  longitude: double("longitude").notNull(),
  radiusKm: double("radiusKm").default(1.0).notNull(),
  waterDepthM: double("waterDepthM"),
  description: text("description"),
  instructions: text("instructions"),
  source: varchar("source", { length: 255 }),
  status: varchar("status", { length: 32 }).default("ACTIVE").notNull(),
  boundsJson: text("boundsJson"),
  isUrgent: int("isUrgent").default(0).notNull(),
  lastUpdated: timestamp("lastUpdated").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type SafePing = typeof safePings.$inferSelect;
export type SosBeacon = typeof sosBeacons.$inferSelect;
export type CommunityReport = typeof communityReports.$inferSelect;
export type RecentActivityRecord = typeof recentActivities.$inferSelect;
export type SasGridRecord = typeof sasGridRecords.$inferSelect;
export type ShelterRecord = typeof shelters.$inferSelect;
export type HospitalRecord = typeof hospitals.$inferSelect;
export type HazardZoneRecord = typeof hazardZones.$inferSelect;
