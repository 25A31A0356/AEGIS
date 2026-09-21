import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { SymbolWeight, SymbolViewProps } from "expo-symbols";
import { ComponentProps } from "react";
import { OpaqueColorValue, type StyleProp, type TextStyle } from "react-native";

type IconMapping = Record<SymbolViewProps["name"], ComponentProps<typeof MaterialIcons>["name"]>;
type IconSymbolName = keyof typeof MAPPING;
const MAPPING = {
  "house.fill": "home", "shield.lefthalf.filled": "alt-route", "sos.circle.fill": "cell-tower", "antenna.radiowaves.left.and.right": "cell-tower", "book.closed.fill": "menu-book", "exclamationmark.bubble.fill": "report", "bell.fill": "notifications", "gearshape.fill": "settings", "line.3.horizontal": "menu", "location.fill": "location-on", "drop.fill": "water-drop", "eye.fill": "visibility", "cloud.sun.fill": "cloud", "wind": "air", "arrow.triangle.turn.up.right.diamond.fill": "directions", "person.3.fill": "groups", "message.fill": "smart-toy", "chevron.right": "chevron-right", "paperplane.fill": "send", "phone.fill": "phone", "checkmark.circle.fill": "check-circle", "moon.fill": "dark-mode", "globe": "language", "pencil": "edit", "map.fill": "map", "download.fill": "download", "clock.arrow.circlepath": "history", "lock.shield.fill": "admin-panel-settings", "questionmark.circle.fill": "help", "link": "link", "xmark": "close", "lightbulb.fill": "lightbulb", "info.circle.fill": "info", "plus.circle.fill": "add-circle", "chart.bar.fill": "bar-chart", "person.crop.circle.fill": "account-circle", "flame.fill": "whatshot", "car.fill": "directions-car", "cross.case.fill": "medical-services", "exclamationmark.triangle.fill": "warning", "person.badge.shield.checkmark.fill": "verified-user", "building.2.fill": "location-city", "arrow.triangle.2.circlepath": "sync",
} as unknown as IconMapping;
export function IconSymbol({ name, size = 24, color, style }: { name: IconSymbolName; size?: number; color: string | OpaqueColorValue; style?: StyleProp<TextStyle>; weight?: SymbolWeight }) { return <MaterialIcons color={color} size={size} name={MAPPING[name]} style={style} />; }
