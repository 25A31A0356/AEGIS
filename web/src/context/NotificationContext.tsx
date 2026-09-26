import React, { createContext, useContext, useState, useEffect } from 'react';
import { RealtimeService, RealtimeEvent } from '../services/realtimeService';

export interface AlertNotification {
  id: string;
  timestamp: string;
  severity: 'critical' | 'warning' | 'info';
  title: string;
  message: string;
  source: string;
  location: string;
  read: boolean;
  linkTab?: string;
  hazardId?: string;
  sosId?: string;
}

const INITIAL_NOTIFICATIONS: AlertNotification[] = [
  {
    id: 'NOTIF-SOS-AARAV',
    timestamp: 'Just now',
    severity: 'critical',
    title: '🚨 SOS: Aarav Sharma (Needs Help)',
    message: '1.2 km away • Rapid Inundation • Trapped Near Residence. Tap to view victim profile & help him.',
    source: 'Aegis SOS Beacon Network',
    location: 'Local Sector Main Road (1.2 km away)',
    read: false,
    linkTab: 'sos',
    sosId: 'sos-aarav-sharma',
  },
  {
    id: 'NOTIF-01',
    timestamp: '10m ago',
    severity: 'critical',
    title: 'Severe Cyclone "VAYU" Landfall Red Alert',
    message: 'Gale wind gusts 120-135 km/h expected along Puri-Gopalpur coast. Evacuations in progress.',
    source: 'IMD Cyclone Warning Center',
    location: 'Odisha Coastal Belt',
    read: false,
    linkTab: 'hazards',
    hazardId: 'HAZ-2026-CYC-01',
  },
  
  {
    id: 'NOTIF-03',
    timestamp: '35m ago',
    severity: 'warning',
    title: 'Hyderabad Doppler Radar Alert: High Convective Lightning',
    message: 'Intense cell moving SE across Greater Hyderabad. Seek indoor shelter immediately.',
    source: 'IMD Doppler Radar Begumpet',
    location: 'Hyderabad, Telangana',
    read: false,
    linkTab: 'forecasts',
  },
  {
    id: 'NOTIF-04',
    timestamp: '2h ago',
    severity: 'info',
    title: 'Chemical Vapor Plume Neutralized in Atchutapuram SEZ',
    message: 'Sensors confirm return to baseline atmospheric safety levels.',
    source: 'APPCB Environmental Desk',
    location: 'Anakapalli, AP',
    read: true,
    linkTab: 'hazards',
  },
];

interface NotificationContextType {
  notifications: AlertNotification[];
  unreadCount: number;
  isDrawerOpen: boolean;
  setIsDrawerOpen: (open: boolean) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearNotification: (id: string) => void;
  addNotification: (notif: Omit<AlertNotification, 'id' | 'timestamp' | 'read'>) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<AlertNotification[]>(INITIAL_NOTIFICATIONS);
  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(false);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const clearNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const addNotification = (notif: Omit<AlertNotification, 'id' | 'timestamp' | 'read'>) => {
    const id = `NOTIF-${Date.now()}`;
    const newEntry: AlertNotification = {
      ...notif,
      id,
      timestamp: 'Just now',
      read: false,
    };
    setNotifications((prev) => {
      // Deduplicate by message or title+location
      const exists = prev.some((p) => p.title === notif.title && p.location === notif.location);
      if (exists) return prev;
      return [newEntry, ...prev];
    });
  };

  // Subscribe to real-time events for automated emergency alerts
  useEffect(() => {
    const unsubSOS = RealtimeService.on('SOS_CREATED', (evt: RealtimeEvent) => {
      const beacon = evt.data?.beacon || evt.data;
      if (!beacon) return;

      addNotification({
        severity: 'critical',
        title: `🚨 SOS ALERT: ${beacon.state || 'India'}`,
        message: `Active emergency reported in ${beacon.locationName || beacon.district || 'Sector'}. ${beacon.emergencyTitle || 'Distress Beacon Initialized'}.`,
        source: 'Central SOS Command Grid',
        location: `${beacon.district || 'District'}, ${beacon.state || 'India'}`,
        linkTab: 'sos',
        sosId: beacon.id,
      });
    });

    const unsubSafe = RealtimeService.on('SAFE_REPORTED', (evt: RealtimeEvent) => {
      const safeData = evt.data || {};
      addNotification({
        severity: 'info',
        title: `🛡️ Safety Status Update: ${safeData.name || 'Citizen'}`,
        message: `${safeData.name || 'Citizen'} in ${safeData.city || 'Sector'}, ${safeData.state || 'India'} has confirmed safe status.`,
        source: 'Citizen Safety Sentinel',
        location: `${safeData.city || 'Sector'}, ${safeData.state || 'India'}`,
        linkTab: 'safety',
      });
    });

    return () => {
      unsubSOS();
      unsubSafe();
    };
  }, []);

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        isDrawerOpen,
        setIsDrawerOpen,
        markAsRead,
        markAllAsRead,
        clearNotification,
        addNotification,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};
