/**
 * AEGIS ALERT - Citizen Incident Report Service
 * Connects to Aegis Software API (/api/v1/reports) via ApiClient.
 * Handles client validation, media uploads, operator verification, rejection, and SOS/incident linking.
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
        id: `med-${Date.now()}`,
        mediaReference: uploadRes.url,
        url: uploadRes.url,
        fileType: file.type,
        fileSize: uploadRes.sizeBytes || file.size,
        fileName: file.name,
        uploadedAt: 'Just now',
      };
    } catch (e) {
      console.warn('[ReportService] Remote media upload failed, fallback to local URL:', e);
      let previewUrl = '';
      if (typeof FileReader !== 'undefined') {
        previewUrl = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(file);
        });
      }
      return {
        id: `med-${Date.now()}`,
        mediaReference: `s3://aegis-media-vault/${Date.now()}-${file.name.replace(/\\s+/g, '_')}`,
        url: previewUrl || (typeof URL !== 'undefined' && URL.createObjectURL ? URL.createObjectURL(file) : `blob:https://aegis.internal/${Date.now()}`),
        fileType: file.type,
        fileSize: file.size,
        fileName: file.name,
        uploadedAt: 'Just now',
      };
    }
  }

  /**
   * Submits citizen incident report to Aegis API (/api/v1/reports)
   */
  public static async submitReport(
    payload: Omit<CitizenReport, 'id' | 'timestamp' | 'status'>
  ): Promise<CitizenReport> {
    if (!payload.hazardType) {
      throw new Error('Hazard type is required.');
    }
    if (!payload.location || !payload.location.address) {
      throw new Error('Valid location and address are required.');
    }
    if (!payload.description || payload.description.trim().length < 5) {
      throw new Error('Please provide at least 5 characters describing the incident.');
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
        title: payload.title || `${payload.hazardLabel || payload.hazardType} incident near ${payload.location.city || payload.location.address || 'local sector'}`,
        description: payload.description,
        severity: (payload.severity || 'MODERATE').toUpperCase(),
        latitude: payload.location.lat,
        longitude: payload.location.lng,
        accuracy_meters: 10.0,
        location_name: payload.location.address,
        city: payload.location.city || '',
        state: payload.location.state || '',
        media_urls: payload.media?.map((m) => m.url) || [],
        media_type: payload.mediaType || 'NONE',
        reporter_name: payload.reporter?.name || (payload.reporter?.isAnonymous ? 'Anonymous Citizen' : 'Citizen Observer'),
        idempotency_key: idempotencyKey,
        linked_sos_id: payload.linkedSosId,
        linked_incident_id: payload.linkedIncidentId,
      });

      if (backendRes) {
        const createdReport: CitizenReport = {
          ...payload,
          id: backendRes.id || backendRes.trackingId || `rep-${Date.now()}`,
          timestamp: backendRes.created_at ? new Date(backendRes.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' IST' : timestamp,
          status: (backendRes.status?.toLowerCase() || 'submitted') as ReportStatus,
          isVerified: Boolean(backendRes.is_verified),
          verificationStatus: backendRes.verification_status || 'UNVERIFIED',
          sourceType: 'COMMUNITY_REPORT',
          provenanceLabel: backendRes.provenance_label || 'Community Report (Unverified)',
        };

        this.persistToLocalStorage(createdReport);
        return createdReport;
      }
    } catch (err) {
      console.warn('[ReportService] Central API report submission failed, persisting locally:', err);
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
      provenanceLabel: 'Community Report (Unverified)',
    };

    this.persistToLocalStorage(newReport);
    return newReport;
  }

  /**
   * Fetches latest citizen reports from backend API or cached store
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
      if (Array.isArray(remote) && remote.length >= 0) {
        const normalized: CitizenReport[] = remote.map((r) => {
          const rawStatus = (r.status || 'SUBMITTED').toUpperCase();
          let normStatus: ReportStatus = 'submitted';
          if (rawStatus === 'VERIFIED') normStatus = 'verified';
          else if (rawStatus === 'REJECTED') normStatus = 'rejected';
          else if (rawStatus === 'PENDING_VERIFICATION') normStatus = 'pending_verification';
          else if (rawStatus === 'RESOLVED') normStatus = 'resolved';
          else if (rawStatus === 'ACTIVE') normStatus = 'submitted';

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
              lat: r.latitude ?? r.location?.lat ?? 19.076,
              lng: r.longitude ?? r.location?.lng ?? 72.877,
              address: r.location_name || r.address || r.location?.address || 'Reported Sector',
              city: r.city || r.location?.city || 'Local Area',
              state: r.state || r.location?.state || 'India',
              district: r.district,
            },
            media: (r.media_urls || r.mediaUrls || []).map((url: string, i: number) => ({
              id: `med-${i}`,
              mediaReference: url,
              url,
              fileType: url.endsWith('.mp4') ? 'video/mp4' : 'image/jpeg',
              fileSize: 1024000,
              fileName: `incident_media_${i}.${url.endsWith('.mp4') ? 'mp4' : 'jpg'}`,
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
              : { isAnonymous: true },
            timestamp: (r.created_at || r.submittedAt)
              ? new Date(r.created_at || r.submittedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' IST'
              : 'Recent',
            status: normStatus,
            verificationStatus: r.verification_status || (r.is_verified ? 'VERIFIED' : 'UNVERIFIED'),
            isVerified: Boolean(r.is_verified),
            sourceType: 'COMMUNITY_REPORT',
            provenanceLabel: r.provenance_label || (r.is_verified ? 'Community Report (Verified)' : 'Community Report (Unverified)'),
            upvotes: r.upvotes || 0,
            downvotes: r.downvotes || 0,
            verifiedByUserId: r.verified_by_user_id,
            verifiedAt: r.verified_at,
            rejectionReason: r.rejection_reason,
            linkedSosId: r.linked_sos_id,
            linkedIncidentId: r.linked_incident_id,
            operatorNotes: r.operator_notes,
            verificationNotes: r.operator_notes || (r.rejection_reason ? `Rejected: ${r.rejection_reason}` : undefined),
          };
        });

        return normalized;
      }
    } catch (e) {
      console.warn('[ReportService] Error fetching /api/v1/reports:', e);
    }

    return this.getAllReports();
  }

  public static async fetchReportsFromApi(): Promise<CitizenReport[]> {
    return this.fetchLiveReports();
  }

  /**
   * Operator Action: Verify Report
   */
  public static async verifyReport(
    id: string,
    payload?: { severity?: string; operator_notes?: string }
  ): Promise<CitizenReport> {
    const res = await ApiClient.post<any>(`/reports/${id}/verify`, {
      severity: payload?.severity,
      operator_notes: payload?.operator_notes || 'Verified by emergency operations command.',
    });
    return this.mapBackendReportToCitizenReport(res);
  }

  /**
   * Operator Action: Reject Report
   */
  public static async rejectReport(
    id: string,
    payload: { rejection_reason: string; operator_notes?: string }
  ): Promise<CitizenReport> {
    const res = await ApiClient.post<any>(`/reports/${id}/reject`, {
      rejection_reason: payload.rejection_reason,
      operator_notes: payload.operator_notes || '',
    });
    return this.mapBackendReportToCitizenReport(res);
  }

  /**
   * Operator Action: Cross-link Report to SOS beacon or master incident
   */
  public static async linkReport(
    id: string,
    payload: { linked_sos_id?: string; linked_incident_id?: string; operator_notes?: string }
  ): Promise<CitizenReport> {
    const res = await ApiClient.post<any>(`/reports/${id}/link`, {
      linked_sos_id: payload.linked_sos_id,
      linked_incident_id: payload.linked_incident_id,
      operator_notes: payload.operator_notes || 'Linked to operational incident by controller.',
    });
    return this.mapBackendReportToCitizenReport(res);
  }

  /**
   * Operator Action: Patch Report severity / notes
   */
  public static async updateReport(
    id: string,
    payload: { severity?: string; status?: string; category?: string; operator_notes?: string }
  ): Promise<CitizenReport> {
    const res = await ApiClient.patch<any>(`/reports/${id}`, payload);
    return this.mapBackendReportToCitizenReport(res);
  }

  private static mapBackendReportToCitizenReport(r: any): CitizenReport {
    const rawStatus = (r.status || 'SUBMITTED').toUpperCase();
    let normStatus: ReportStatus = 'submitted';
    if (rawStatus === 'VERIFIED') normStatus = 'verified';
    else if (rawStatus === 'REJECTED') normStatus = 'rejected';
    else if (rawStatus === 'PENDING_VERIFICATION') normStatus = 'pending_verification';
    else if (rawStatus === 'RESOLVED') normStatus = 'resolved';

    return {
      id: r.id,
      category: r.category,
      hazardType: (r.hazard_type || r.category || 'other').toLowerCase() as ReportHazardType,
      hazardLabel: r.title || r.category,
      title: r.title,
      location: {
        lat: r.latitude,
        lng: r.longitude,
        address: r.location_name || '',
        city: r.city || '',
        state: r.state || '',
        district: r.district,
      },
      media: (r.media_urls || []).map((url: string, i: number) => ({
        id: `med-${i}`,
        mediaReference: url,
        url,
        fileType: url.endsWith('.mp4') ? 'video/mp4' : 'image/jpeg',
        fileSize: 1024000,
        fileName: `media_${i}`,
        uploadedAt: r.created_at || 'Recent',
      })),
      mediaType: r.media_type || 'NONE',
      description: r.description,
      severity: (r.severity?.toLowerCase() || 'moderate') as ReportSeverity,
      timestamp: r.created_at ? new Date(r.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' IST' : 'Recent',
      status: normStatus,
      verificationStatus: r.verification_status,
      isVerified: Boolean(r.is_verified),
      sourceType: 'COMMUNITY_REPORT',
      provenanceLabel: r.provenance_label,
      upvotes: r.upvotes,
      downvotes: r.downvotes,
      verifiedByUserId: r.verified_by_user_id,
      verifiedAt: r.verified_at,
      rejectionReason: r.rejection_reason,
      linkedSosId: r.linked_sos_id,
      linkedIncidentId: r.linked_incident_id,
      operatorNotes: r.operator_notes,
    };
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

  public static getAllReports(): CitizenReport[] {
    try {
      if (typeof localStorage !== 'undefined') {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          return JSON.parse(stored);
        }
      }
    } catch {
      // fallback
    }
    return INITIAL_DEMO_REPORTS;
  }
}
