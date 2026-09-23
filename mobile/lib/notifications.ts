import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

export async function registerForPushNotificationsAsync() {
  if (Platform.OS === "web") return null;
  try {
    const current = await Notifications.getPermissionsAsync();
    let status = current.status;
    if (status !== "granted") status = (await Notifications.requestPermissionsAsync()).status;
    if (status !== "granted") return null;
    if (Platform.OS === "android") await Notifications.setNotificationChannelAsync("aegis-alerts", { name: "AEGIS ALERTS", importance: Notifications.AndroidImportance.HIGH, vibrationPattern: [0, 250, 250, 250], lightColor: "#C73535" });
    const token = await Notifications.getExpoPushTokenAsync();
    return token.data;
  } catch {
    // Development builds without an EAS project ID can still use the rest of the app.
    return null;
  }
}
