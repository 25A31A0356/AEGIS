/**
 * AGIES ALERT - Backend NotificationService
 * Manages multi-channel emergency broadcast alerts (In-App, Push, CAP Gateway).
 */

export interface EmergencyNotification {
  id: string;
  title: string;
  body: string;
  severity: 'critical' | 'warning' | 'info';
  category: string;
  timestamp: string;
  isRead: boolean;
  actionUrl?: string;
  soundAlert?: boolean;
}

export class NotificationService {
  private static notifications: EmergencyNotification[] = [
    {
      id: 'notif-001',
      title: 'Flash Flood Warning: Lowland Inundation Active',
      body: 'Rapid water level rise detected along Western Subways. Traffic diversion initiated.',
      severity: 'critical',
      category: 'flood',
      timestamp: '5 mins ago',
      isRead: false,
      soundAlert: true,
      actionUrl: '/live-map',
    },
    {
      id: 'notif-002',
      title: 'Cyclone Bay of Bengal Update',
      body: 'Deep depression track confirmed by IMD with 85 km/h squally wind gust.',
      severity: 'warning',
      category: 'cyclone',
      timestamp: '25 mins ago',
      isRead: false,
      actionUrl: '/safety',
    },
    {
      id: 'notif-003',
      title: 'Safety Drill Advisory Completed',
      body: 'Monthly coastal evacuation siren test concluded with nominal telemetry.',
      severity: 'info',
      category: 'system',
      timestamp: '2 hrs ago',
      isRead: true,
    },
  ];

  public static async getNotifications(): Promise<EmergencyNotification[]> {
    return [...this.notifications];
  }

  public static async broadcastNotification(notif: Omit<EmergencyNotification, 'id' | 'timestamp' | 'isRead'>): Promise<EmergencyNotification> {
    const newNotif: EmergencyNotification = {
      ...notif,
      id: `notif-${Date.now()}`,
      timestamp: 'Just now',
      isRead: false,
    };
    this.notifications.unshift(newNotif);
    return newNotif;
  }
}
