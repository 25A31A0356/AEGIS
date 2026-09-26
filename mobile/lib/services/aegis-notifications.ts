import { AegisApiService } from "./aegis-api";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { AegisHazardAlert } from "./aegis-types";

const NOTIFIED_ALERTS_KEY = "aegis_notified_alert_ids_v1";

interface NotifiedRecord {
  id: string;
  severity: string;
  notifiedAt: number;
}

/**
 * Configure global notification behavior for incoming alerts.
 */
if (Platform.OS !== "web") {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
      shouldShowBanner: true,
      shouldShowList: true,
      priority: Notifications.AndroidNotificationPriority.MAX,
    }),
  });
}

/**
 * Request notification permissions with Android channel setup.
 */
export async function requestNotificationPermission(): Promise<boolean> {
  if (Platform.OS === "web") return false;

  try {
    const current = await Notifications.getPermissionsAsync();
    let status = current.status;

    if (status !== "granted") {
      const requested = await Notifications.requestPermissionsAsync();
      status = requested.status;
    }

    if (status !== "granted") return false;

    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync("aegis-emergency-alerts", {
        name: "AEGIS Emergency Hazard Alerts",
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 500, 200, 500],
        lightColor: "#D93025",
        sound: "default",
        enableVibrate: true,
        showBadge: true,
      });

      await Notifications.setNotificationChannelAsync("aegis-weather-updates", {
        name: "AEGIS Weather & Safety Updates",
        importance: Notifications.AndroidImportance.DEFAULT,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: "#1A73E8",
        enableVibrate: true,
      });
    }

    return true;
  } catch (error) {
    console.warn("[AegisNotifications] Failed to setup notification channels:", error);
    return false;
  }
}

/**
 * Register and return the Expo Push Token.
 */
import Constants, { ExecutionEnvironment } from "expo-constants";

export async function getDevicePushToken(): Promise<string | null> {
  if (Constants.executionEnvironment === ExecutionEnvironment.StoreClient) {
    return null;
  }
  if (Platform.OS === "web") return null;

  try {
    const granted = await requestNotificationPermission();
    if (!granted) return null;

    const token = await Notifications.getExpoPushTokenAsync();
    if (token && token.data) {
      // Register with authoritative backend push notification service
      void AegisApiService.registerDevicePushToken(token.data, Platform.OS);
    }
    return token.data;
  } catch {
    // In local dev without EAS config, getExpoPushTokenAsync may fail gracefully
    console.info("[AegisNotifications] Push token registration skipped (development/no EAS ID)");
    return null;
  }
}

/**
 * Filter and dispatch notifications for unnotified HIGH or CRITICAL active alerts.
 * Ensures:
 * 1. No fabricated data (only real alerts from Aegis Software)
 * 2. Deduplication of previously notified alert IDs
 * 3. Expired alerts are skipped
 * 4. Updates with increased severity are re-triggered
 */
export async function processAndNotifyHazardAlerts(
  alerts: AegisHazardAlert[]
): Promise<{ dispatched: number; skippedExpired: number; skippedDuplicate: number }> {
  if (Platform.OS === "web" || !alerts || alerts.length === 0) {
    return { dispatched: 0, skippedExpired: 0, skippedDuplicate: 0 };
  }

  const now = Date.now();
  const notifiedMap = await getNotifiedRecords();

  let dispatched = 0;
  let skippedExpired = 0;
  let skippedDuplicate = 0;

  for (const alert of alerts) {
    // 1. Check expiration
    const expiresAtMs = new Date(alert.expiresAt).getTime();
    if (!isNaN(expiresAtMs) && expiresAtMs <= now) {
      skippedExpired++;
      continue;
    }

    // 2. Only automatically notify for HIGH and CRITICAL severity
    if (alert.severity !== "HIGH" && alert.severity !== "CRITICAL") {
      continue;
    }

    // 3. Check for duplicates or severity elevation
    const existing = notifiedMap[alert.id];
    if (existing && existing.severity === alert.severity) {
      skippedDuplicate++;
      continue;
    }

    // 4. Dispatch local notification
    try {
      const isCritical = alert.severity === "CRITICAL";
      const titlePrefix = isCritical ? "🚨 CRITICAL ALERT" : "⚠️ HIGH HAZARD ALERT";

      await Notifications.scheduleNotificationAsync({
        content: {
          title: `${titlePrefix}: ${alert.title}`,
          body: `${alert.description.substring(0, 140)}${alert.description.length > 140 ? "..." : ""} (Source: ${alert.source})`,
          data: {
            alertId: alert.id,
            type: alert.type,
            severity: alert.severity,
          },
          sound: isCritical ? "default" : undefined,
        },
        trigger: null, // trigger immediately
      });

      notifiedMap[alert.id] = {
        id: alert.id,
        severity: alert.severity,
        notifiedAt: now,
      };

      dispatched++;
    } catch (error) {
      console.warn(`[AegisNotifications] Failed to dispatch notification for alert ${alert.id}:`, error);
    }
  }

  if (dispatched > 0) {
    await saveNotifiedRecords(notifiedMap);
  }

  return { dispatched, skippedExpired, skippedDuplicate };
}

async function getNotifiedRecords(): Promise<Record<string, NotifiedRecord>> {
  try {
    const stored = await AsyncStorage.getItem(NOTIFIED_ALERTS_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
}

async function saveNotifiedRecords(records: Record<string, NotifiedRecord>): Promise<void> {
  try {
    // Keep only records from last 7 days to prevent unbounded growth
    const cutoff = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const cleaned: Record<string, NotifiedRecord> = {};

    for (const [id, rec] of Object.entries(records)) {
      if (rec.notifiedAt > cutoff) {
        cleaned[id] = rec;
      }
    }

    await AsyncStorage.setItem(NOTIFIED_ALERTS_KEY, JSON.stringify(cleaned));
  } catch {}
}
