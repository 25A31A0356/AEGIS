import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { SymbolWeight } from "expo-symbols";
import { ComponentProps } from "react";
import { OpaqueColorValue, type StyleProp, type TextStyle } from "react-native";

type IconMapping = Record<string, ComponentProps<typeof MaterialIcons>["name"]>;

const MAPPING: IconMapping = {
  // Navigation & Core
  "house.fill": "home",
  "shield.lefthalf.filled": "alt-route",
  "sos.circle.fill": "cell-tower",
  "antenna.radiowaves.left.and.right": "cell-tower",
  "book.closed.fill": "menu-book",
  "exclamationmark.bubble.fill": "report",
  "bell.fill": "notifications",
  "gearshape.fill": "settings",
  "line.3.horizontal": "menu",
  "location.fill": "location-on",
  "location.circle.fill": "my-location",
  "location.slash.fill": "location-off",
  "drop.fill": "water-drop",
  "eye.fill": "visibility",
  "cloud.sun.fill": "cloud",
  "cloud.rain.fill": "grain",
  "sun.max.fill": "wb-sunny",
  "wind": "air",
  "arrow.triangle.turn.up.right.diamond.fill": "directions",
  "person.3.fill": "groups",
  "person.2.fill": "people",
  "person.crop.circle.fill": "account-circle",
  "person.crop.circle.badge.exclamationmark": "warning",
  "person.badge.shield.checkmark.fill": "verified-user",
  "message.fill": "smart-toy",
  "chevron.right": "chevron-right",
  "chevron.left": "chevron-left",
  "chevron.down": "expand-more",
  "paperplane.fill": "send",
  "phone.fill": "phone",
  "checkmark.circle.fill": "check-circle",
  "checkmark": "check",
  "checkmark.seal.fill": "verified",
  "checkmark.shield.fill": "verified-user",
  "moon.fill": "dark-mode",
  "globe": "language",
  "pencil": "edit",
  "map.fill": "map",
  "download.fill": "download",
  "clock.arrow.circlepath": "history",
  "clock.fill": "schedule",
  "lock.shield.fill": "admin-panel-settings",
  "questionmark.circle.fill": "help",
  "link": "link",
  "xmark": "close",
  "xmark.circle.fill": "cancel",
  "lightbulb.fill": "lightbulb",
  "info.circle.fill": "info",
  "plus.circle.fill": "add-circle",
  "chart.bar.fill": "bar-chart",
  "flame.fill": "whatshot",
  "car.fill": "directions-car",
  "cross.case.fill": "medical-services",
  "exclamationmark.triangle.fill": "warning",
  "building.2.fill": "location-city",
  "arrow.triangle.2.circlepath": "sync",
  "arrow.clockwise": "refresh",
  "magnifyingglass": "search",
  "camera.fill": "photo-camera",
  "trash.fill": "delete",
  "bag.fill": "medical-services",
  "calendar": "calendar-today",
  "hand.raised.fill": "pan-tool",
  "internaldrive.fill": "storage",
  "leaf.fill": "eco",
  "shield.fill": "shield",
  "sparkles": "auto-awesome",
  "square.and.arrow.up": "share",
  "wifi.slash": "wifi-off",
};

export function IconSymbol({
  name,
  size = 24,
  color,
  style,
}: {
  name: string;
  size?: number;
  color: string | OpaqueColorValue;
  style?: StyleProp<TextStyle>;
  weight?: SymbolWeight;
}) {
  const mapped = MAPPING[name];
  const iconName = (mapped || name || "help") as ComponentProps<typeof MaterialIcons>["name"];
  return (
    <MaterialIcons
      color={color}
      size={size}
      name={iconName}
      style={style}
    />
  );
}
