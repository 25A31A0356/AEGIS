import { EventEmitter } from "events";
import * as db from "./db";
import { CommunityReport } from "../drizzle/schema";

export interface AuthoritativeReport {
  id: string; // Authoritative ID e.g. "rep-1726768392100-847"
  trackingId: string;
  dbId?: number;
  category: string;
  hazard: string;
  title: string;
  description: string;
  severity: "LOW" | "MODERATE" | "HIGH" | "CRITICAL";
  location: {
    latitude: number;
    longitude: number;
    accuracy?: number | null;
    address?: string;
    sector?: string;
  };
  source: "OFFICIAL" | "COMMUNITY" | "VERIFIED COMMUNITY" | "UNVERIFIED COMMUNITY";
  verificationStatus: "VERIFIED" | "UNVERIFIED" | "PENDING";
  status: "pending_review" | "verified" | "action_dispatched" | "dismissed" | "resolved";
  imageUrl?: string;
  media?: { type: "image"; url: string }[];
  upvotes: number;
  idempotencyKey?: string;
  userId?: number | string;
  authorName?: string;
  createdAt: string; // ISO 8601
  updatedAt: string; // ISO 8601
}

const BASELINE_REPORTS: AuthoritativeReport[] = [
  {
    id: "rep-baseline-01",
    trackingId: "AEGIS-REP-100001",
    category: "flooding",
    hazard: "Coastal Inundation Surge",
    title: "Storm Surge Inundation at Beach Road",
    description: "Tidal surge overflowing road embankment by 0.8 meters. Light vehicles diverted.",
    severity: "HIGH",
    location: {
      latitude: 17.712,
      longitude: 83.324,
      accuracy: 5,
      address: "Beach Road Promenade, Sector 03",
    },
    source: "VERIFIED COMMUNITY",
    verificationStatus: "VERIFIED",
    status: "verified",
    upvotes: 18,
    createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 2).toISOString(),
  },
  {
    id: "rep-baseline-02",
    trackingId: "AEGIS-REP-100002",
    category: "powerOutage",
    hazard: "Transformer Submerged",
    title: "Power Substation Flooded in Lowland Sector",
    description: "Substation isolated for safety. Emergency generator active at community clinic.",
    severity: "CRITICAL",
    location: {
      latitude: 17.689,
      longitude: 83.212,
      accuracy: 8,
      address: "Substation Rd, Sector 08",
    },
    source: "COMMUNITY",
    verificationStatus: "PENDING",
    status: "pending_review",
    upvotes: 4,
    createdAt: new Date(Date.now() - 3600000 * 4).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 4).toISOString(),
  },
  {
    id: "rep-baseline-03",
    trackingId: "AEGIS-REP-100003",
    category: "roadBlocked",
    hazard: "Fallen Banyan Tree",
    title: "Highway Lane 2 Blocked by Fallen Tree",
    description: "NDRF clearing team deployed with chain cutters. One lane operating with police guidance.",
    severity: "MODERATE",
    location: {
      latitude: 17.742,
      longitude: 83.298,
      accuracy: 4,
      address: "NH-16 Junction, Sector 14",
    },
    source: "OFFICIAL",
    verificationStatus: "VERIFIED",
    status: "action_dispatched",
    upvotes: 27,
    createdAt: new Date(Date.now() - 3600000 * 6).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 6).toISOString(),
  },
];

class ReportsService {
  private emitter = new EventEmitter();
  private reports: AuthoritativeReport[] = [...BASELINE_REPORTS];
  private idempotencyMap = new Map<string, AuthoritativeReport>();

  constructor() {
    this.emitter.setMaxListeners(100);
    this.loadPersistedReports();
  }

  private async loadPersistedReports() {
    try {
      const dbReports = await db.getCommunityReports(100);
      if (dbReports && dbReports.length > 0) {
        const fromDb = dbReports.map((r) => this.mapDbToAuthoritative(r));
        const ids = new Set(fromDb.map((r) => r.id));
        const nonDuplicateBaselines = BASELINE_REPORTS.filter((b) => !ids.has(b.id));
        this.reports = [...fromDb, ...nonDuplicateBaselines];
      }
    } catch (e) {
      console.warn("[ReportsService] Failed to load persisted reports from DB:", e);
    }
  }

  private mapDbToAuthoritative(dbReport: CommunityReport): AuthoritativeReport {
    const rawSev = (dbReport.severity || "Medium").toUpperCase();
    const severity: AuthoritativeReport["severity"] =
      rawSev === "CRITICAL" ? "CRITICAL" : rawSev === "HIGH" ? "HIGH" : rawSev === "LOW" ? "LOW" : "MODERATE";

    return {
      id: dbReport.trackingId || `rep-${dbReport.id}`,
      trackingId: dbReport.trackingId || `AEGIS-REP-${dbReport.id}`,
      dbId: dbReport.id,
      category: dbReport.category || "general",
      hazard: dbReport.hazard,
      title: dbReport.title || `${dbReport.hazard} at ${dbReport.address || "Report Location"}`,
      description: dbReport.description || dbReport.details || "",
      severity,
      location: {
        latitude: dbReport.latitude || 17.6868,
        longitude: dbReport.longitude || 83.2185,
        accuracy: dbReport.accuracy,
        address: dbReport.address || "Field Location",
      },
      source: dbReport.verificationStatus === "VERIFIED" ? "VERIFIED COMMUNITY" : "COMMUNITY",
      verificationStatus: (dbReport.verificationStatus as any) || "PENDING",
      status: (dbReport.status as any) || "pending_review",
      imageUrl: dbReport.imageUrl || undefined,
      upvotes: dbReport.upvotes || 0,
      userId: dbReport.userId || undefined,
      authorName: dbReport.authorName || undefined,
      createdAt: dbReport.createdAt ? new Date(dbReport.createdAt).toISOString() : new Date().toISOString(),
      updatedAt: dbReport.updatedAt ? new Date(dbReport.updatedAt).toISOString() : new Date().toISOString(),
    };
  }

  public listReports(filter?: {
    category?: string;
    severity?: string;
    status?: string;
    verificationStatus?: string;
    limit?: number;
  }): AuthoritativeReport[] {
    let result = [...this.reports];

    if (filter?.category && filter.category !== "all") {
      result = result.filter(
        (r) => r.category.toLowerCase() === filter.category!.toLowerCase() || r.hazard.toLowerCase().includes(filter.category!.toLowerCase())
      );
    }

    if (filter?.severity && filter.severity !== "all") {
      result = result.filter((r) => r.severity.toUpperCase() === filter.severity!.toUpperCase());
    }

    if (filter?.status && filter.status !== "all") {
      result = result.filter((r) => r.status === filter.status);
    }

    if (filter?.verificationStatus && filter.verificationStatus !== "all") {
      result = result.filter((r) => r.verificationStatus === filter.verificationStatus);
    }

    result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    if (filter?.limit && filter.limit > 0) {
      result = result.slice(0, filter.limit);
    }

    return result;
  }

  public getReportById(id: string): AuthoritativeReport | undefined {
    return this.reports.find((r) => r.id === id || r.trackingId === id || String(r.dbId) === id);
  }

  public async createReport(
    payload: {
      hazard: string;
      category?: string;
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
    },
    author?: { id: number | string; name?: string }
  ): Promise<AuthoritativeReport> {
    // Idempotency check
    if (payload.idempotencyKey && this.idempotencyMap.has(payload.idempotencyKey)) {
      return this.idempotencyMap.get(payload.idempotencyKey)!;
    }

    const now = new Date();
    const trackingCode = Math.floor(100000 + Math.random() * 900000);
    const trackingId = `AEGIS-REP-${trackingCode}`;
    const reportId = `rep-${now.getTime()}-${Math.floor(Math.random() * 1000)}`;

    const rawSev = (payload.severity || "Medium").toUpperCase();
    const severity: AuthoritativeReport["severity"] =
      rawSev === "CRITICAL" ? "CRITICAL" : rawSev === "HIGH" ? "HIGH" : rawSev === "LOW" ? "LOW" : "MODERATE";

    const title = payload.title || `${payload.hazard} Incident`;
    const desc = payload.description || payload.details || "";

    const newReport: AuthoritativeReport = {
      id: reportId,
      trackingId,
      category: payload.category || "general",
      hazard: payload.hazard,
      title,
      description: desc,
      severity,
      location: {
        latitude: payload.latitude !== undefined ? payload.latitude : 17.6868,
        longitude: payload.longitude !== undefined ? payload.longitude : 83.2185,
        accuracy: payload.accuracy,
        address: payload.address || "Report Location",
      },
      source: "COMMUNITY",
      verificationStatus: "PENDING",
      status: "pending_review",
      imageUrl: payload.imageUrl || payload.image,
      upvotes: 1,
      idempotencyKey: payload.idempotencyKey,
      userId: author?.id,
      authorName: author?.name || "Citizen Reporter",
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    };

    // 1. Insert into Database
    try {
      const dbRes = await db.createCommunityReport({
        trackingId,
        userId: typeof author?.id === "number" ? author.id : undefined,
        authorName: author?.name || "Citizen Reporter",
        hazard: payload.hazard,
        category: payload.category || "general",
        title,
        description: desc,
        details: desc,
        severity: severity === "CRITICAL" ? "Critical" : severity === "HIGH" ? "High" : severity === "LOW" ? "Low" : "Medium",
        status: "pending_review",
        verificationStatus: "PENDING",
        latitude: payload.latitude,
        longitude: payload.longitude,
        accuracy: payload.accuracy,
        address: payload.address,
        imageUrl: payload.imageUrl || payload.image,
        upvotes: 1,
      });

      if (dbRes && dbRes.id) {
        newReport.dbId = dbRes.id;
      }
    } catch (dbErr) {
      console.warn("[ReportsService] DB insert warning:", dbErr);
    }

    // 2. Insert into Recent Activities
    try {
      await db.createRecentActivity({
        type: "community_report",
        title: `Citizen Report: ${payload.hazard}`,
        subtitle: `${payload.address || "Field Location"} • ${severity} Severity`,
        severity,
        status: "PENDING_REVIEW",
        locationLabel: payload.address || "Field Location",
        latitude: payload.latitude,
        longitude: payload.longitude,
        userId: typeof author?.id === "number" ? author.id : undefined,
        relatedId: trackingId,
      });
    } catch (actErr) {
      console.warn("[ReportsService] Activity insert warning:", actErr);
    }

    this.reports.unshift(newReport);
    if (payload.idempotencyKey) {
      this.idempotencyMap.set(payload.idempotencyKey, newReport);
    }

    // Broadcast Realtime Event
    this.emitter.emit("event", {
      type: "report.created",
      timestamp: now.toISOString(),
      data: newReport,
    });

    return newReport;
  }

  public updateReportStatus(
    id: string,
    status?: "pending_review" | "verified" | "action_dispatched" | "dismissed" | "resolved",
    verificationStatus?: "VERIFIED" | "UNVERIFIED" | "PENDING"
  ): AuthoritativeReport | undefined {
    const report = this.getReportById(id);
    if (!report) return undefined;

    if (status) report.status = status;
    if (verificationStatus) {
      report.verificationStatus = verificationStatus;
      if (verificationStatus === "VERIFIED") report.source = "VERIFIED COMMUNITY";
    }
    report.updatedAt = new Date().toISOString();

    // Update in DB
    void db.updateCommunityReportStatus(report.dbId || id, report.status, report.verificationStatus);

    this.emitter.emit("event", {
      type: "report.status_changed",
      timestamp: report.updatedAt,
      data: report,
    });

    return report;
  }

  public upvoteReport(id: string): AuthoritativeReport | undefined {
    const report = this.getReportById(id);
    if (!report) return undefined;

    report.upvotes += 1;
    report.updatedAt = new Date().toISOString();

    this.emitter.emit("event", {
      type: "report.updated",
      timestamp: report.updatedAt,
      data: report,
    });

    return report;
  }

  public registerRealtimeListener(handler: (event: any) => void): () => void {
    this.emitter.on("event", handler);
    return () => {
      this.emitter.off("event", handler);
    };
  }
}

export const reportsService = new ReportsService();
