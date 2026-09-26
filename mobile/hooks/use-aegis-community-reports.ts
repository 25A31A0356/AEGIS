import { useState, useEffect, useCallback } from "react";
import { AegisCommunityReport, RealtimeConnectionStatus, CreateReportPayload, ReportSource, ReportVerificationStatus, CommunityReportStatus } from "@/lib/services/aegis-types";
import { AegisApiService } from "@/lib/services/aegis-api";
import { AegisRealtime } from "@/lib/services/aegis-realtime";
import { getOfflineQueue } from "@/lib/services/aegis-cache";

export function useAegisCommunityReports() {
  const [reports, setReports] = useState<AegisCommunityReport[]>([]);
  const [pendingReports, setPendingReports] = useState<AegisCommunityReport[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [connectionStatus, setConnectionStatus] = useState<RealtimeConnectionStatus>(
    AegisRealtime.getStatus()
  );
  const [lastUpdatedFormatted, setLastUpdatedFormatted] = useState<string>("Just now");

  // 1. Fetch initial reports and load pending queue
  const loadReports = useCallback(async (isRefresh = false) => {
    if (isRefresh) setIsRefreshing(true);
    else setIsLoading(true);

    try {
      const response = await AegisApiService.getCommunityReports();
      // Strictly filter out any old legacy mock or baseline items
      const genuine = (response.data || []).filter((r: any) => {
        const id = String(r.id || "");
        const title = String(r.title || "").toLowerCase();
        if (id.startsWith("rep-baseline") || id.startsWith("rep-offline")) return false;
        if (title.includes("substation") || title.includes("highway lane 2") || title.includes("storm surge")) return false;
        return true;
      });
      setReports(genuine);
      setLastUpdatedFormatted(response.lastUpdatedFormatted || "Just now");

      // Check offline queue for pending reports
      const queue = await getOfflineQueue();
      const pendingItems: AegisCommunityReport[] = queue
        .filter((q) => q.type === "community_report")
        .map((q) => {
          const payload = q.payload as any;
          return {
            id: q.id,
            category: payload.category || "otherHazard",
            hazard: payload.hazard || "Incident Report",
            title: payload.title || payload.hazard || "Incident Report",
            description: payload.description || payload.details || "Pending offline sync...",
            severity: (payload.severity || "MODERATE") as any,
            location: {
              latitude: payload.latitude ?? 17.6868,
              longitude: payload.longitude ?? 83.2185,
              accuracy: payload.accuracy,
              address: payload.address || "Sector 04",
            },
            source: "COMMUNITY" as ReportSource,
            verificationStatus: "PENDING" as ReportVerificationStatus,
            status: "pending_review" as CommunityReportStatus,
            imageUrl: payload.imageUrl || payload.image,
            upvotes: 1,
            idempotencyKey: payload.idempotencyKey,
            isPending: true,
            createdAt: new Date(q.createdAt).toISOString(),
            updatedAt: new Date(q.createdAt).toISOString(),
          };
        });
      setPendingReports(pendingItems);
    } catch (e) {
      console.warn("[useAegisCommunityReports] load failed:", e);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadReports();

    // 2. Subscribe to Real-Time SSE / Polling Stream
    const unsubEvent = AegisRealtime.onEvent((event) => {
      if (event.type === "report.created") {
        const newReport = event.data as AegisCommunityReport;
        setReports((prev) => {
          // Prevent duplicates by authoritative ID or idempotency key
          if (prev.some((r) => r.id === newReport.id || (newReport.idempotencyKey && r.idempotencyKey === newReport.idempotencyKey))) {
            return prev.map((r) => (r.id === newReport.id ? newReport : r));
          }
          return [newReport, ...prev];
        });

        // Remove from pending if matching idempotency key was received
        if (newReport.idempotencyKey) {
          setPendingReports((prev) =>
            prev.filter((p) => p.idempotencyKey !== newReport.idempotencyKey && p.id !== newReport.idempotencyKey)
          );
        }
      } else if (event.type === "report.updated" || event.type === "report.status_changed") {
        const updated = event.data as AegisCommunityReport;
        setReports((prev) =>
          prev.map((r) => (r.id === updated.id ? { ...r, ...updated } : r))
        );
      }
    });

    const unsubStatus = AegisRealtime.onStatusChange((status) => {
      setConnectionStatus(status);
      if (status === "LIVE") {
        // Automatically sync pending offline queue when signal returns
        AegisApiService.syncOfflineQueue().then(({ syncedCount }) => {
          if (syncedCount > 0) {
            loadReports();
          }
        });
      }
    });

    return () => {
      unsubEvent();
      unsubStatus();
    };
  }, [loadReports]);

  // 3. Submit a new community report
  const submitReport = async (payload: CreateReportPayload) => {
    setIsSubmitting(true);
    try {
      const result = await AegisApiService.submitCommunityReport(payload);
      if (result.report) {
        if (result.queued) {
          setPendingReports((prev) => [result.report!, ...prev]);
        } else {
          setReports((prev) => {
            if (prev.some((r) => r.id === result.report!.id)) return prev;
            return [result.report!, ...prev];
          });
        }
      }
      return result;
    } finally {
      setIsSubmitting(false);
    }
  };

  // 4. Update status of a report
  const updateStatus = async (id: string, status: string, verificationStatus?: string) => {
    const updated = await AegisApiService.updateReportStatus(id, status, verificationStatus);
    if (updated) {
      setReports((prev) => prev.map((r) => (r.id === id ? updated : r)));
    }
    return updated;
  };

  return {
    reports,
    pendingReports,
    allReports: [...pendingReports, ...reports],
    isLoading,
    isRefreshing,
    isSubmitting,
    connectionStatus,
    lastUpdatedFormatted,
    refresh: () => loadReports(true),
    submitReport,
    updateStatus,
  };
}
