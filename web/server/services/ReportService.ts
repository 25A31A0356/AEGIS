/**
 * AGIES ALERT - Backend ReportService
 * Handles citizen incident reporting, verification workflows, and media object uploads with strict server-side validation.
 */

import { IncidentReportSubmission } from '../types/api';
import { FileValidationMiddleware } from '../middleware/fileValidationMiddleware';
import { SanitizationMiddleware } from '../middleware/sanitizationMiddleware';
import { AuditLogger } from './AuditLogger';
import { RealtimeHub } from './RealtimeHub';

export interface IncidentReportRecord {
  id: string;
  trackingId: string;
  hazardType: string;
  title: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'pending_review' | 'verified' | 'dispatched' | 'resolved';
  verificationStatus?: 'pending' | 'verified' | 'rejected' | 'resolved';
  location: {
    lat: number;
    lng: number;
    address: string;
    city: string;
    state: string;
  };
  mediaUrls: string[];
  contactInfo?: {
    name?: string;
    phone?: string;
    isAnonymous?: boolean;
  };
  submittedAt: string;
  reviewedBy?: string;
  dispatchUnitsAssigned?: string[];
}

export class ReportService {
  private static reports: IncidentReportRecord[] = [];

  /**
   * Submit new citizen incident report
   */
  public static async createReport(
    submission: IncidentReportSubmission,
    clientIp: string = '127.0.0.1'
  ): Promise<IncidentReportRecord> {
    const trackingId = `AGIES-REP-${Math.floor(100000 + Math.random() * 900000)}`;

    const newRecord: IncidentReportRecord = {
      id: `rep-${Date.now()}`,
      trackingId,
      hazardType: SanitizationMiddleware.stripHtmlTags(submission.hazardType),
      title: submission.title
        ? SanitizationMiddleware.stripHtmlTags(submission.title)
        : `${SanitizationMiddleware.stripHtmlTags(submission.hazardType)} incident reported near ${SanitizationMiddleware.stripHtmlTags(submission.location.city || 'local sector')}`,
      description: SanitizationMiddleware.stripHtmlTags(submission.description),
      severity: submission.severity,
      status: 'pending_review',
      verificationStatus: 'pending',
      location: {
        lat: submission.location.lat,
        lng: submission.location.lng,
        address: SanitizationMiddleware.stripHtmlTags(submission.location.address),
        city: SanitizationMiddleware.stripHtmlTags(submission.location.city || 'Local Area'),
        state: SanitizationMiddleware.stripHtmlTags(submission.location.state || 'India'),
      },
      mediaUrls: submission.mediaUrls || [],
      contactInfo: submission.contactInfo
        ? {
            name: submission.contactInfo.name ? SanitizationMiddleware.stripHtmlTags(submission.contactInfo.name) : undefined,
            phone: submission.contactInfo.phone ? SanitizationMiddleware.stripHtmlTags(submission.contactInfo.phone) : undefined,
            isAnonymous: submission.contactInfo.isAnonymous,
          }
        : undefined,
      submittedAt: new Date().toISOString(),
    };

    this.reports.unshift(newRecord);

    AuditLogger.log({
      action: 'INCIDENT_REPORT_CREATED',
      severity: 'INFO',
      clientIp,
      resourceId: trackingId,
      details: {
        hazardType: newRecord.hazardType,
        severity: newRecord.severity,
        city: newRecord.location.city,
      },
    });

    // Realtime broadcast to all connected App & Web clients
    RealtimeHub.broadcast({
      id: `evt-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      type: 'REPORT_CREATED',
      timestamp: new Date().toISOString(),
      data: newRecord,
    });

    return newRecord;
  }

  /**
   * Get all filed incident reports
   */
  public static async getReports(limit: number = 50): Promise<IncidentReportRecord[]> {
    return this.reports.slice(0, limit);
  }

  /**
   * Generates unified activity stream combining official alerts and community reports
   */
  public static async getActivityStream(limit: number = 50): Promise<any[]> {
    const communityActivities = this.reports.map((r) => {
      const diffMins = Math.max(1, Math.round((Date.now() - new Date(r.submittedAt).getTime()) / 60000));
      const relTime = diffMins < 60 ? `${diffMins} min${diffMins > 1 ? 's' : ''} ago` : `${Math.round(diffMins / 60)} hr ago`;

      return {
        id: r.id,
        trackingId: r.trackingId,
        timestamp: r.submittedAt,
        relativeTime: relTime,
        category: 'incident_detected',
        scope: 'india',
        title: r.title,
        description: r.description,
        severity: r.severity,
        sourceAgency: 'Citizen Intelligence Network',
        sourceType: 'community',
        locationTag: `${r.location.city}, ${r.location.state}`,
        coordinates: [r.location.lat, r.location.lng],
        metricsBadge: r.status === 'verified' ? 'Verified by Ops' : r.status === 'dispatched' ? 'Dispatched' : 'Pending Review',
        isVerified: r.status === 'verified' || r.status === 'dispatched',
        status: r.status,
        actionUrl: `/live-map?reportId=${r.trackingId}`,
      };
    });

    return communityActivities.slice(0, limit);
  }

  /**
   * Upload incident media attachment with strict server-side validation
   */
  public static async processMediaUpload(
    fileData: { fileName: string; fileType?: string; fileSizeBytes?: number; base64Content?: string },
    clientIp: string = '127.0.0.1'
  ): Promise<{ mediaUrl: string; fileId: string; sanitizedFileName: string; mimeType: string }> {
    const validation = FileValidationMiddleware.validateMediaUpload(fileData);

    if (!validation.valid) {
      AuditLogger.log({
        action: 'FILE_UPLOAD_REJECTED',
        severity: 'SECURITY_ALERT',
        clientIp,
        details: {
          attemptedFileName: fileData.fileName,
          error: validation.error,
        },
      });
      throw new Error(validation.error || 'Invalid media attachment.');
    }

    const fileId = `media-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const mediaUrl = `/storage/incidents/${fileId}-${validation.sanitizedFileName}`;

    AuditLogger.log({
      action: 'FILE_UPLOAD_ACCEPTED',
      severity: 'INFO',
      clientIp,
      resourceId: fileId,
      details: {
        fileName: validation.sanitizedFileName,
        mimeType: validation.detectedMimeType,
        sizeBytes: validation.fileSizeBytes,
      },
    });

    return {
      fileId,
      mediaUrl,
      sanitizedFileName: validation.sanitizedFileName,
      mimeType: validation.detectedMimeType || 'image/jpeg',
    };
  }
}
