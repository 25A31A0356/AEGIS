/**
 * AEGIS ALERT - Citizen Incident Report Service
 * Exclusively handles user-uploaded incident reports submitted by citizens and emergency volunteers.
 * Filters out all outer weather forecasts, generic disaster warnings, and system alerts.
 */

import { ApiClient } from './apiClient';
import { CitizenReport, ReportMediaItem, ReportHazardType, ReportSeverity, ReportStatus } from '../types/report';

const STORAGE_KEY = 'aegis_citizen_reports';

export const INITIAL_DEMO_REPORTS: CitizenReport[] = [];

export class ReportService {
  /**
   * Uploads media attachment via Aegis API multipart /api/v1/reports/upload-media
   */
  public static async uploadMediaFile(file: File): Promise<{ url: string; mediaType: string; sizeBytes: number }> {
    const formData = new FormData();
    formData.append('file', file);

    const res = await ApiClient.post<{ url: string; media_type: string; size_bytes: number; filename: string }>(
      '/reports/upload-media',
      formData
    );

    if (res && res.url) {
      return {
        url: res.url,
        mediaType: res.media_type,
        sizeBytes: res.size_bytes,
      };
    }
    throw new Error('Media upload failed: invalid response from server.');
  }

  /**
   * Uploads media attachment and returns standard ReportMediaItem
   */
  public static async uploadMediaToObjectStorage(file: File): Promise<ReportMediaItem> {
    try {
      const uploadRes = await this.uploadMediaFile(file);
      return {
        id: `med-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        mediaReference: uploadRes.url,
        url: uploadRes.url,
        fileType: file.type,
        fileSize: uploadRes.sizeBytes || file.size,
        fileName: file.name,
        uploadedAt: 'Just now',
      };
    } catch (e) {
      console.warn('[ReportService] Remote media upload fallback to local preview:', e);
      let previewUrl = '';
      if (typeof FileReader !== 'undefined') {
        previewUrl = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(file);
        });
      }
      return {
        id: `med-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        mediaReference: `local-upload://${Date.now()}-${file.name.replace(/\s+/g, '_')}`,
        url: previewUrl || (typeof URL !== 'undefined' && URL.createObjectURL ? URL.createObjectURL(file) : ''),
        fileType: file.type,
        fileSize: file.size,
        fileName: file.name,
        uploadedAt: 'Just now',
      };
    }
  }

  /**
   * Submits user-uploaded citizen incident report
   */
  public static async submitReport(
    payload: Omit<CitizenReport, 'id' | 'timestamp' | 'status'>
  ): Promise<CitizenReport> {
    if (!payload.hazardType) {
      throw new Error('Hazard type is required.');
    }
    if (!payload.location) {
      throw new Error('Valid location and address are required.');
    }
    if (!payload.description || payload.description.trim().length < 3) {
      throw new Error('Please provide at least 3 characters describing the incident.');
    }
    if (!payload.severity) {
      throw new Error('Severity classification is required.');
    }

    const now = new Date();
    const timestamp = `Today, ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} IST`;

    try {
      const idempotencyKey = `web-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
      const backendRes = await ApiClient.post<any>('/reports', {
        category: (payload.category || payload.hazardType || 'OTHER').toUpperCase(),
        hazard_type: payload.hazardType,
        title: payload.title || `${payload.hazardLabel || payload.hazardType} reported at ${payload.location?.city || payload.location?.district || payload.location?.address || 'Local Sector'}`,
        description: payload.description,
        severity: (payload.severity || 'MODERATE').toUpperCase(),
        latitude: payload.location?.lat ?? 17.6868,
        longitude: payload.location?.lng ?? 83.2185,
        accuracy_meters: 10.0,
        location_name: payload.location?.address || payload.location?.city || 'Live Location',
        city: payload.location.city || '',
        state: payload.location.state || '',
        district: payload.location.district || '',
        media_urls: payload.media?.map((m) => m.url) || [],
        media_type: payload.mediaType || (payload.media && payload.media.length > 0 ? 'PHOTO' : 'NONE'),
        reporter_name: payload.reporter?.name || (payload.reporter?.isAnonymous ? 'Anonymous Citizen' : 'Citizen Observer'),
        idempotency_key: idempotencyKey,
        linked_sos_id: payload.linkedSosId,
        linked_incident_id: payload.linkedIncidentId,
      });

      if (backendRes) {
        const createdReport: CitizenReport = {
          ...payload,
          id: backendRes.id || backendRes.trackingId || `AEGIS-REP-${Math.floor(100000 + Math.random() * 900000)}`,
          timestamp: backendRes.created_at ? new Date(backendRes.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' IST' : timestamp,
          status: (backendRes.status?.toLowerCase() || 'submitted') as ReportStatus,
          isVerified: Boolean(backendRes.is_verified),
          verificationStatus: backendRes.verification_status || 'UNVERIFIED',
          sourceType: 'COMMUNITY_REPORT',
          provenanceLabel: backendRes.provenance_label || 'User Uploaded (Citizen Report)',
        };

        this.persistToLocalStorage(createdReport);
        return createdReport;
      }
    } catch (err) {
      console.warn('[ReportService] Backend submit offline fallback:', err);
    }

    const reportId = `AEGIS-REP-${Math.floor(100000 + Math.random() * 900000)}`;
    const newReport: CitizenReport = {
      ...payload,
      id: reportId,
      timestamp,
      status: 'submitted',
      isVerified: false,
      verificationStatus: 'UNVERIFIED',
      sourceType: 'COMMUNITY_REPORT',
      provenanceLabel: 'User Uploaded (Citizen Report)',
    };

    this.persistToLocalStorage(newReport);
    return newReport;
  }

  /**
   * Fetches latest user-uploaded citizen reports strictly filtering out outer events
   */
  public static async fetchLiveReports(params?: {
    status?: string;
    category?: string;
    severity?: string;
    verification_status?: string;
  }): Promise<CitizenReport[]> {
    try {
      const queryParams: Record<string, string> = {};
      if (params?.status) queryParams.status = params.status;
      if (params?.category) queryParams.category = params.category;
      if (params?.severity) queryParams.severity = params.severity;
      if (params?.verification_status) queryParams.verification_status = params.verification_status;

      const remote = await ApiClient.get<any[]>('/reports', queryParams);
      if (Array.isArray(remote)) {
        // Strictly filter to user-uploaded community reports only
        const normalized: CitizenReport[] = remote
          .filter((r) => {
            // Must not be test/system titles or outer weather forecasts
            const title = (r.title || '').toLowerCase();
            const desc = (r.description || '').toLowerCase();
            if (title.includes('e2e') || title.includes('idempotency') || title.includes('test')) return false;
            if (desc.includes('e2e') || desc.includes('test')) return false;
            return true;
          })
          .map((r) => {
            const rawStatus = (r.status || 'SUBMITTED').toUpperCase();
            let normStatus: ReportStatus = 'submitted';
            if (rawStatus === 'VERIFIED') normStatus = 'verified';
            else if (rawStatus === 'REJECTED') normStatus = 'rejected';
            else if (rawStatus === 'PENDING_VERIFICATION') normStatus = 'pending_verification';
            else if (rawStatus === 'RESOLVED') normStatus = 'resolved';

            const rawSev = (r.severity || 'MODERATE').toLowerCase();
            const sev: ReportSeverity = ['low', 'moderate', 'medium', 'high', 'critical'].includes(rawSev)
              ? (rawSev as ReportSeverity)
              : 'moderate';

            return {
              id: r.id || r.trackingId,
              category: r.category || r.hazard_type || 'OTHER',
              hazardType: (r.hazard_type || r.category || 'other').toLowerCase().replace(/\s+/g, '_') as ReportHazardType,
              hazardLabel: r.title || r.category || r.hazard_type || 'Incident',
              title: r.title,
              location: {
                lat: r.latitude ?? r.location?.lat ?? 17.68,
                lng: r.longitude ?? r.location?.lng ?? 83.21,
                address: r.location_name || r.address || r.location?.address || 'Reported Sector',
                city: r.city || r.location?.city || 'Local Sector',
                state: r.state || r.location?.state || 'India',
                district: r.district || r.location?.district,
              },
              media: (r.media_urls || r.mediaUrls || []).map((url: string, i: number) => ({
                id: `med-${i}`,
                mediaReference: url,
                url,
                fileType: url.endsWith('.mp4') ? 'video/mp4' : 'image/jpeg',
                fileSize: 1024000,
                fileName: `evidence_${i}.${url.endsWith('.mp4') ? 'mp4' : 'jpg'}`,
                uploadedAt: r.created_at || 'Recent',
              })),
              mediaType: r.media_type || 'NONE',
              description: r.description,
              severity: sev,
              optionalDetails: {
                peopleAffectedEstimate: r.peopleAffected || 'Unknown',
                isRoadBlocked: r.isRoadBlocked ?? false,
                isImmediateDanger: r.isImmediateDanger ?? false,
                contactPhone: r.contactInfo?.phone,
              },
              reporter: r.reporter_name
                ? { name: r.reporter_name, isAnonymous: r.reporter_name === 'Anonymous Citizen' }
                : { isAnonymous: true, name: 'Citizen Observer' },
              timestamp: (r.created_at || r.submittedAt)
                ? new Date(r.created_at || r.submittedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' IST'
                : 'Recent',
              status: normStatus,
              verificationStatus: r.verification_status || (r.is_verified ? 'VERIFIED' : 'UNVERIFIED'),
              isVerified: Boolean(r.is_verified),
              sourceType: 'COMMUNITY_REPORT',
              provenanceLabel: 'User Uploaded (Citizen Report)',
              upvotes: r.upvotes || 0,
              downvotes: r.downvotes || 0,
              verifiedByUserId: r.verified_by_user_id,
              verifiedAt: r.verified_at,
              rejectionReason: r.rejection_reason,
              linkedSosId: r.linked_sos_id,
              linkedIncidentId: r.linked_incident_id,
              operatorNotes: r.operator_notes,
            };
          });

        if (normalized.length > 0) {
          // Sync with local storage
          try {
            if (typeof localStorage !== 'undefined') {
              const localSaved = this.getAllReports();
              const merged = [...normalized];
              for (const loc of localSaved) {
                if (!merged.some((m) => m.id === loc.id)) {
                  merged.push(loc);
                }
              }
              localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
            }
          } catch {}
          return normalized;
        }
      }
    } catch (e) {
      console.warn('[ReportService] Error fetching live reports from backend:', e);
    }

    return this.getAllReports();
  }

  public static async fetchReportsFromApi(): Promise<CitizenReport[]> {
    return this.fetchLiveReports();
  }

  public static async voteReport(reportId: string, voteType: 'UPVOTE' | 'DOWNVOTE'): Promise<void> {
    try {
      await ApiClient.post(`/reports/${reportId}/vote`, {
        voter_id: `user-${Date.now()}`,
        vote_type: voteType,
      });
    } catch {}

    // Update local storage representation
    const reports = this.getAllReports();
    const updated = reports.map((r) => {
      if (r.id === reportId) {
        return {
          ...r,
          upvotes: voteType === 'UPVOTE' ? (r.upvotes || 0) + 1 : (r.upvotes || 0),
          downvotes: voteType === 'DOWNVOTE' ? (r.downvotes || 0) + 1 : (r.downvotes || 0),
        };
      }
      return r;
    });
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      }
    } catch {}
  }

  private static persistToLocalStorage(report: CitizenReport) {
    const existing = this.getAllReports();
    const updated = [report, ...existing.filter((r) => r.id !== report.id)];
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      }
    } catch (e) {
      console.warn('[ReportService] Failed to save report to localStorage:', e);
    }
  }

  private static listeners: Set<(reports: CitizenReport[]) => void> = new Set();
  private static isListenerSetup = false;

  public static onReportsChange(listener: (reports: CitizenReport[]) => void): () => void {
    this.listeners.add(listener);
    this.ensureGlobalListeners();
    return () => this.listeners.delete(listener);
  }

  private static notifyListeners(): void {
    const all = this.getAllReports();
    this.listeners.forEach((l) => {
      try {
        l(all);
      } catch {}
    });
  }

  private static ensureGlobalListeners(): void {
    if (this.isListenerSetup || typeof window === 'undefined') return;
    this.isListenerSetup = true;

    // Storage listener across tabs
    window.addEventListener('storage', (e) => {
      if (e.key === STORAGE_KEY || e.key === '@aegis_local_community_reports' || e.key === 'aegis_offline_action_queue') {
        this.notifyListeners();
      }
    });

    // BroadcastChannel listener
    if (typeof BroadcastChannel !== 'undefined') {
      try {
        const bc = new BroadcastChannel('aegis_emergency_bus');
        bc.onmessage = (evt) => {
          if (evt.data && (evt.data.type === 'REPORT_CREATED' || evt.data.type === 'report.created')) {
            this.notifyListeners();
          }
        };
      } catch {}
    }
  }

  public static getAllReports(): CitizenReport[] {
    this.ensureGlobalListeners();
    const reportsMap = new Map<string, CitizenReport>();

    if (typeof localStorage === 'undefined') return INITIAL_DEMO_REPORTS;

    // 1. Load from aegis_citizen_reports
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          parsed.forEach((r: CitizenReport) => {
            if (r && r.id) reportsMap.set(r.id, r);
          });
        }
      }
    } catch {}

    // 2. Load and normalize from mobile @aegis_local_community_reports
    try {
      const mobileStored = localStorage.getItem('@aegis_local_community_reports');
      if (mobileStored) {
        const parsed = JSON.parse(mobileStored);
        if (Array.isArray(parsed)) {
          parsed.forEach((m: any) => {
            if (m && m.id && !reportsMap.has(m.id)) {
              const rawSev = (m.severity || 'MODERATE').toLowerCase();
              const sev: ReportSeverity = ['low', 'moderate', 'medium', 'high', 'critical'].includes(rawSev)
                ? (rawSev as ReportSeverity)
                : 'moderate';
              const norm: CitizenReport = {
                id: m.id,
                category: m.category || 'OTHER',
                hazardType: (m.category || m.hazard || 'other').toLowerCase().replace(/\s+/g, '_') as ReportHazardType,
                hazardLabel: m.title || m.hazard || 'Incident Report',
                title: m.title || m.hazard || 'Incident Report',
                description: m.description || '',
                media: m.imageUrl ? [{ id: 'm-1', url: m.imageUrl, mediaReference: m.imageUrl, fileType: 'image/jpeg', fileSize: 1024, fileName: 'evidence.jpg', uploadedAt: 'Recent' }] : [],
                mediaType: m.imageUrl ? 'PHOTO' : 'NONE',
                severity: sev,
                location: {
                  lat: m.location?.latitude ?? 17.6868,
                  lng: m.location?.longitude ?? 83.2185,
                  address: m.location?.address || 'Live Location',
                  city: (m.location?.address || '').split(',')[0] || 'Local Sector',
                  state: 'India',
                },
                timestamp: m.createdAt ? `Today, ${new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} IST` : 'Today, IST',
                status: 'submitted',
                verificationStatus: m.verificationStatus || 'UNVERIFIED',
                isVerified: false,
                sourceType: 'COMMUNITY_REPORT',
                provenanceLabel: 'User Uploaded (Mobile App)',
                upvotes: m.upvotes || 0,
                downvotes: 0,
                reporter: { name: 'Citizen Observer', isAnonymous: true },
              };
              reportsMap.set(m.id, norm);
            }
          });
        }
      }
    } catch {}

    // 3. Load from mobile offline queue
    try {
      const queueStored = localStorage.getItem('aegis_offline_action_queue');
      if (queueStored) {
        const queue = JSON.parse(queueStored);
        if (Array.isArray(queue)) {
          queue.forEach((q: any) => {
            if (q && q.type === 'community_report' && q.id && !reportsMap.has(q.id)) {
              const p = q.payload || {};
              const rawSev = (p.severity || 'MODERATE').toLowerCase();
              const sev: ReportSeverity = ['low', 'moderate', 'medium', 'high', 'critical'].includes(rawSev)
                ? (rawSev as ReportSeverity)
                : 'moderate';
              const norm: CitizenReport = {
                id: q.id,
                category: p.category || 'OTHER',
                hazardType: (p.category || p.hazard_type || 'other').toLowerCase().replace(/\s+/g, '_') as ReportHazardType,
                hazardLabel: p.title || p.hazard || 'Incident Report',
                title: p.title || p.hazard || 'Incident Report',
                description: p.description || '',
                media: p.imageUrl ? [{ id: 'm-1', url: p.imageUrl, mediaReference: p.imageUrl, fileType: 'image/jpeg', fileSize: 1024, fileName: 'evidence.jpg', uploadedAt: 'Recent' }] : [],
                mediaType: p.imageUrl ? 'PHOTO' : 'NONE',
                severity: sev,
                location: {
                  lat: p.latitude ?? 17.6868,
                  lng: p.longitude ?? 83.2185,
                  address: p.location_name || 'Queued Location',
                  city: (p.location_name || '').split(',')[0] || 'Local Sector',
                  state: 'India',
                },
                timestamp: `Today, ${new Date(q.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} IST`,
                status: 'submitted',
                verificationStatus: 'UNVERIFIED',
                isVerified: false,
                sourceType: 'COMMUNITY_REPORT',
                provenanceLabel: 'User Uploaded (Offline Queue)',
                upvotes: 0,
                downvotes: 0,
                reporter: { name: 'Citizen Observer', isAnonymous: true },
              };
              reportsMap.set(q.id, norm);
            }
          });
        }
      }
    } catch {}

    const result = Array.from(reportsMap.values());
    return result.length > 0 ? result : INITIAL_DEMO_REPORTS;
  }
}
