import { Tabs } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Platform } from "react-native";

import { HapticTab } from "@/components/haptic-tab";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { useAppPreferences } from "@/lib/app-preferences";

export default function TabLayout() {
  const colors = useColors();
  const { t } = useAppPreferences();
  const insets = useSafeAreaInsets();
  const bottomPadding = Platform.OS === "web" ? 10 : Math.max(insets.bottom, 8);
  const tabBarHeight = 62 + bottomPadding;

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.tint,
        tabBarInactiveTintColor: colors.muted,
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarStyle: {
          paddingTop: 7,
          paddingBottom: bottomPadding,
          height: tabBarHeight,
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          borderTopWidth: 0.5,
        },
        tabBarLabelStyle: { fontSize: 10, fontWeight: "600" },
      }}
    >
      <Tabs.Screen name="index" options={{ title: t("home"), tabBarIcon: ({ color }) => <IconSymbol size={23} name="house.fill" color={color} /> }} />
      <Tabs.Screen name="safe" options={{ title: t("safe"), tabBarIcon: ({ color }) => <IconSymbol size={23} name="shield.lefthalf.filled" color={color} /> }} />
      <Tabs.Screen name="beacon" options={{ title: t("beacon"), tabBarIcon: ({ color }) => <IconSymbol size={27} name="sos.circle.fill" color={color} /> }} />
      <Tabs.Screen name="guide" options={{ href: null, title: t("guide"), tabBarIcon: ({ color }) => <IconSymbol size={23} name="book.closed.fill" color={color} /> }} />
      <Tabs.Screen name="reports" options={{ title: t("reports"), tabBarIcon: ({ color }) => <IconSymbol size={23} name="exclamationmark.bubble.fill" color={color} /> }} />
      <Tabs.Screen name="ask" options={{ title: t("ask"), tabBarIcon: ({ color }) => <IconSymbol size={23} name="message.fill" color={color} /> }} />
    </Tabs>
  );
}
