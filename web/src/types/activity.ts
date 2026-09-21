export type ActivityCategory =
  | 'official_bulletin'
  | 'incident_detected'
  | 'sos_dispatch'
  | 'radar_alert'
  | 'shelter_update'
  | 'advisory_escalation';

export type ActivityScope = 'india' | 'asia' | 'global' | 'state';

export interface ActivityFeedItem {
  id: string;
  timestamp: string;
  relativeTime: string;
  category: ActivityCategory;
  scope: ActivityScope;
  title: string;
  description: string;
  severity: 'critical' | 'warning' | 'moderate' | 'info' | 'safe';
  sourceAgency: string; // e.g. "IMD", "NDRF", "CWC", "INCOIS", "USGS", "JMA"
  locationTag: string; // e.g. "Bhubaneswar, Odisha"
  coordinates?: [number, number];
  metricsBadge?: string;
  isVerified: boolean;
  actionUrl?: string;
}
