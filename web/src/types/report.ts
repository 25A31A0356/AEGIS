export type ReportHazardType =
  | 'flood'
  | 'fire'
  | 'road_blocked'
  | 'road_blockage'
  | 'landslide'
  | 'building_damage'
  | 'waterlogging'
  | 'power_failure'
  | 'missing_person'
  | 'severe_weather'
  | 'earthquake'
  | 'cyclone'
  | 'heavy_rainfall'
  | 'lightning'
  | 'other';

export type ReportSeverity = 'low' | 'moderate' | 'medium' | 'high' | 'critical';

export type ReportStatus =
  | 'submitted'
  | 'pending_verification'
  | 'pending_review'
  | 'verified'
  | 'rejected'
  | 'dispatched'
  | 'resolved'
  | 'dismissed';

export interface ReportMediaItem {
  id: string;
  mediaReference: string; // Object storage bucket key e.g. "s3://aegis-media/2026/09/rep-xxx.jpg"
  url: string; // Preview data URL or CDN URL
  fileType: 'image/jpeg' | 'image/png' | 'video/mp4' | 'video/quicktime' | string;
  fileSize: number; // in bytes
  fileName: string;
  uploadedAt: string;
}

export interface CitizenReport {
  id: string;
  category?: string;
  hazardType: ReportHazardType;
  hazardLabel: string;
  title?: string;
  location: {
    lat: number;
    lng: number;
    address: string;
    city: string;
    state: string;
    district?: string;
    pincode?: string;
  };
  media: ReportMediaItem[];
  mediaType?: 'PHOTO' | 'VIDEO' | 'MIXED' | 'NONE';
  description: string;
  severity: ReportSeverity;
  optionalDetails?: {
    peopleAffectedEstimate?: string;
    isRoadBlocked?: boolean | 'partial';
    isImmediateDanger?: boolean;
    contactPhone?: string;
  };
  reporter?: {
    name?: string;
    isAnonymous?: boolean;
    deviceFingerprint?: string;
  };
  timestamp: string;
  status: ReportStatus;
  verificationStatus?: 'UNVERIFIED' | 'VERIFIED' | 'REJECTED' | string;
  isVerified?: boolean;
  sourceType?: 'COMMUNITY_REPORT' | string;
  provenanceLabel?: string;
  upvotes?: number;
  downvotes?: number;
  verifiedByUserId?: string;
  verifiedAt?: string;
  rejectionReason?: string;
  linkedSosId?: string;
  linkedIncidentId?: string;
  operatorNotes?: string;
  verificationNotes?: string;
}
