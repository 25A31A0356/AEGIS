import { AegisLogo } from '@/components/aegis-logo';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { useAppPreferences } from "@/lib/app-preferences";
import { useEmergencyProfile } from "@/lib/emergency-profile";

export default function MenuScreen() {
  const colors = useColors();
  const router = useRouter();
  const { t, dict } = useAppPreferences();
  const { profile } = useEmergencyProfile();

  const items = [
    { icon: "person.3.fill", key: "familyContacts", title: dict.familyContacts, detail: dict.trustedSafeContacts },
    { icon: "download.fill", key: "downloads", title: dict.downloads, detail: "Offline survival content" },
    { icon: "map.fill", key: "offlineMaps", title: dict.offlineMaps, detail: "Cached vector maps for no-signal use" },
    { icon: "clock.arrow.circlepath", key: "history", title: dict.history, detail: "Activity and beacon log" },
    { icon: "lock.shield.fill", key: "permissions", title: dict.permissions, detail: dict.locationPhotosNotifs },
    { icon: "questionmark.circle.fill", key: "helpDesk", title: dict.helpDesk, detail: "24/7 disaster assistance guide" },
  ] as const;

  return (
    <ScreenContainer className="px-5" edges={["top", "left", "right"]}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Pressable onPress={() => router.back()} style={styles.close}>
          <IconSymbol name="xmark" size={21} color={colors.foreground} />
          <Text style={[styles.closeText, { color: colors.muted }]}>{dict.menu}</Text>
        </Pressable>
        <View style={{ marginBottom: 4 }}><AegisLogo size="sm" showSubtitle={false} /></View>
        <Text style={[styles.title, { color: colors.foreground }]}>{dict.safetyHub}</Text>
        <Text style={[styles.intro, { color: colors.muted }]}>{dict.everythingPrepare}</Text>

        <View style={[styles.profile, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={[styles.avatar, { backgroundColor: colors.primary, overflow: "hidden" }]}>
            {profile.avatarUri ? (
              <Image source={{ uri: profile.avatarUri }} style={{ width: "100%", height: "100%", borderRadius: 16 }} />
            ) : (
              <Text style={styles.avatarText}>
                {profile.fullName?.trim() ? profile.fullName.trim()[0].toUpperCase() : "A"}
              </Text>
            )}
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.profileName, { color: colors.foreground }]}>{profile.fullName || "Aarav"}</Text>
            <Text style={[styles.profileSub, { color: colors.muted }]}>{dict.readyToday}</Text>
          </View>
          <Pressable onPress={() => router.push("/settings")}>
            <IconSymbol name="person.crop.circle.fill" size={24} color={colors.primary} />
          </Pressable>
        </View>

        <View style={styles.list}>
          {items.map((item) => (
            <Pressable
              key={item.key}
              onPress={() => router.push({ pathname: "/utility/[section]", params: { section: item.key } } as any)}
              style={({ pressed }) => [
                styles.item,
                { backgroundColor: colors.surface, borderColor: colors.border },
                pressed && styles.pressed,
              ]}
            >
              <View style={[styles.itemIcon, { backgroundColor: colors.primary + "14" }]}>
                <IconSymbol name={item.icon as any} size={22} color={colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.itemTitle, { color: colors.foreground }]}>{item.title}</Text>
                <Text style={[styles.itemDetail, { color: colors.muted }]}>{item.detail}</Text>
              </View>
              <IconSymbol name="chevron.right" size={18} color={colors.muted} />
            </Pressable>
          ))}
        </View>

        <Pressable
          onPress={() => router.push("/settings")}
          style={[styles.settingsButton, { borderColor: colors.border }]}
        >
          <IconSymbol name="person.crop.circle.fill" size={20} color={colors.primary} />
          <Text style={[styles.settingsText, { color: colors.foreground }]}>{t("settings")}</Text>
        </Pressable>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingTop: 17, paddingBottom: 36 },
  close: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 28 },
  closeText: { fontSize: 13, fontWeight: "700" },
  kicker: { fontSize: 10, letterSpacing: 1.4, fontWeight: "900" },
  title: { fontSize: 28, fontWeight: "900", marginTop: 5 },
  intro: { fontSize: 13, lineHeight: 19, marginTop: 8, marginBottom: 18 },
  profile: { flexDirection: "row", alignItems: "center", borderWidth: 1, borderRadius: 17, padding: 14 },
  avatar: { width: 43, height: 43, borderRadius: 15, alignItems: "center", justifyContent: "center", marginRight: 11 },
  avatarText: { color: "#fff", fontSize: 18, fontWeight: "900" },
  profileName: { fontSize: 14, fontWeight: "900" },
  profileSub: { fontSize: 11, marginTop: 4 },
  list: { gap: 9, marginTop: 18 },
  item: { flexDirection: "row", alignItems: "center", gap: 11, borderWidth: 1, borderRadius: 16, padding: 12 },
  itemIcon: { width: 42, height: 42, borderRadius: 13, alignItems: "center", justifyContent: "center" },
  itemTitle: { fontSize: 13, fontWeight: "800" },
  itemDetail: { fontSize: 10, marginTop: 4 },
  settingsButton: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, borderWidth: 1, borderRadius: 15, paddingVertical: 13, marginTop: 18 },
  settingsText: { fontSize: 13, fontWeight: "800" },
  pressed: { opacity: 0.72, transform: [{ scale: 0.98 }] },
});
