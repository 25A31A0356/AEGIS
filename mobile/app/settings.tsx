import { useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Linking,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { useThemeContext } from "@/lib/theme-provider";
import { LANGUAGES, useAppPreferences, type LanguageCode } from "@/lib/app-preferences";
import { useEmergencyProfile } from "@/lib/emergency-profile";

const BLOOD_GROUPS = ["O+", "A+", "B+", "AB+", "O-", "A-", "B-", "AB-"];

export default function SettingsScreen() {
  const colors = useColors();
  const router = useRouter();
  const { colorScheme, setColorScheme } = useThemeContext();
  const {
    language,
    setLanguage,
    notificationsEnabled,
    setNotificationsEnabled,
    liveLocationEnabled,
    setLiveLocationEnabled,
    isNearbyResponderEnabled,
    setNearbyResponderEnabled,
    t,
    dict,
  } = useAppPreferences();
  const { profile, updateProfile } = useEmergencyProfile();
  const current = LANGUAGES.find((item) => item.code === language) || LANGUAGES[0];

  // Edit Profile Modal State
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [tempName, setTempName] = useState(profile.fullName || "");
  const [tempPhone, setTempPhone] = useState(profile.phoneNumber || "");
  const [tempBlood, setTempBlood] = useState(profile.bloodGroup || "O+");
  const [tempMedical, setTempMedical] = useState(profile.medicalNotes || "");
  const [tempPeople, setTempPeople] = useState(String(profile.peopleCount || 1));
  const [saveSuccess, setSaveSuccess] = useState(false);

  const openEditModal = () => {
    setTempName(profile.fullName || "");
    setTempPhone(profile.phoneNumber || "");
    setTempBlood(profile.bloodGroup || "O+");
    setTempMedical(profile.medicalNotes || "");
    setTempPeople(String(profile.peopleCount || 1));
    setIsEditModalVisible(true);
  };

  const handleSaveModal = async () => {
    if (!tempName.trim()) {
      Alert.alert("Name Required", "Please enter your name.");
      return;
    }
    await updateProfile({
      fullName: tempName.trim(),
      phoneNumber: tempPhone.trim(),
      bloodGroup: tempBlood,
      medicalNotes: tempMedical.trim(),
      peopleCount: parseInt(tempPeople, 10) || 1,
    });
    setSaveSuccess(true);
    setTimeout(() => {
      setSaveSuccess(false);
      setIsEditModalVisible(false);
    }, 600);
  };

  return (
    <ScreenContainer className="px-5" edges={["top", "left", "right"]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {/* Back Button */}
        <Pressable onPress={() => router.back()} style={styles.back}>
          <IconSymbol
            name="chevron.right"
            size={18}
            color={colors.primary}
            style={{ transform: [{ rotate: "180deg" }] }}
          />
          <Text style={[styles.backText, { color: colors.primary }]}>{dict.back}</Text>
        </Pressable>

        <Text style={[styles.kicker, { color: colors.primary }]}>{dict.preferences}</Text>
        <Text style={[styles.title, { color: colors.foreground }]}>{t("settings")}</Text>
        <Text style={[styles.intro, { color: colors.muted }]}>{dict.makeAgiesWork}</Text>

        {/* PROFILE CARD WITH WORKING PENCIL EDIT BUTTON */}
        <View style={styles.profileSectionHeader}>
          <Text style={[styles.section, { color: colors.muted }]}>{dict.yourProfile}</Text>
          <Pressable onPress={openEditModal} style={styles.editBadgeBtn}>
            <IconSymbol name="pencil" size={13} color={colors.primary} />
            <Text style={[styles.editBadgeText, { color: colors.primary }]}>Edit Profile</Text>
          </Pressable>
        </View>

        <Pressable
          onPress={openEditModal}
          style={({ pressed }) => [
            styles.card,
            { backgroundColor: colors.surface, borderColor: colors.border },
            pressed && styles.pressed,
          ]}
        >
          <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
            <Text style={styles.avatarText}>
              {profile.fullName?.trim() ? profile.fullName.trim()[0].toUpperCase() : "A"}
            </Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.cardLabel, { color: colors.muted }]}>{dict.nameInApp}</Text>
            <Text style={[styles.nameDisplay, { color: colors.foreground }]}>
              {profile.fullName || "Aarav Sharma"}
            </Text>
            <Text style={[styles.profileSubDetails, { color: colors.muted }]}>
              {profile.bloodGroup ? `Blood: ${profile.bloodGroup}` : ""}
              {profile.phoneNumber ? ` • ${profile.phoneNumber}` : ""}
            </Text>
          </View>
          <Pressable
            onPress={openEditModal}
            hitSlop={10}
            style={({ pressed }) => [
              styles.pencilButton,
              { backgroundColor: colors.primary + "18" },
              pressed && styles.pressed,
            ]}
          >
            <IconSymbol name="pencil" size={16} color={colors.primary} />
          </Pressable>
        </Pressable>

        {/* LANGUAGE SELECTOR */}
        <Text style={[styles.section, { color: colors.muted, marginTop: 24 }]}>
          {dict.language.toUpperCase()}
        </Text>
        <View style={[styles.languageCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.languageHeader}>
            <View>
              <Text style={[styles.cardTitle, { color: colors.foreground }]}>{t("language")}</Text>
              <Text style={[styles.cardSub, { color: colors.muted }]}>
                {current.native} • {current.label}
              </Text>
            </View>
            <IconSymbol name="globe" size={23} color={colors.primary} />
          </View>
          <View style={styles.languageGrid}>
            {LANGUAGES.map((item) => (
              <Pressable
                key={item.code}
                onPress={() => setLanguage(item.code as LanguageCode)}
                style={[
                  styles.languageOption,
                  {
                    borderColor: language === item.code ? colors.primary : colors.border,
                    backgroundColor: language === item.code ? colors.primary + "14" : colors.background,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.languageNative,
                    { color: language === item.code ? colors.primary : colors.foreground },
                  ]}
                >
                  {item.native}
                </Text>
                <Text style={[styles.languageLabel, { color: colors.muted }]}>{item.label}</Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* APP EXPERIENCE */}
        <Text style={[styles.section, { color: colors.muted }]}>{dict.appExperience}</Text>
        <View style={[styles.group, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <SettingRow
            icon="moon.fill"
            title={t("appearance")}
            detail={colorScheme === "dark" ? dict.dark : dict.light}
            colors={colors}
            onPress={() => setColorScheme(colorScheme === "dark" ? "light" : "dark")}
            right={
              <Switch
                value={colorScheme === "dark"}
                onValueChange={(value) => setColorScheme(value ? "dark" : "light")}
                trackColor={{ false: colors.border, true: colors.primary }}
                thumbColor="#fff"
              />
            }
          />
          <SettingRow
            icon="bell.fill"
            title={t("notifications")}
            detail={dict.weatherSafetyAlerts}
            colors={colors}
            onPress={() => setNotificationsEnabled(!notificationsEnabled)}
            right={
              <Switch
                value={notificationsEnabled}
                onValueChange={setNotificationsEnabled}
                trackColor={{ false: colors.border, true: colors.success }}
                thumbColor="#fff"
              />
            }
          />
          <SettingRow
            icon="location.fill"
            title={t("liveLocation")}
            detail={dict.usedWeatherRoutes}
            colors={colors}
            onPress={() => setLiveLocationEnabled(!liveLocationEnabled)}
            right={
              <Switch
                value={liveLocationEnabled}
                onValueChange={setLiveLocationEnabled}
                trackColor={{ false: colors.border, true: colors.primary }}
                thumbColor="#fff"
              />
            }
          />
          <SettingRow
            icon="person.badge.shield.checkmark.fill"
            title="Nearby Community Responder"
            detail="Available to help nearby Aegis users (within 10-20 km)"
            colors={colors}
            onPress={() => setNearbyResponderEnabled(!isNearbyResponderEnabled)}
            right={
              <Switch
                value={isNearbyResponderEnabled}
                onValueChange={setNearbyResponderEnabled}
                trackColor={{ false: colors.border, true: "#188038" }}
                thumbColor="#fff"
              />
            }
            last
          />
        </View>

        {/* SUPPORT & ACCESS */}
        <Text style={[styles.section, { color: colors.muted }]}>{dict.supportAccess}</Text>
        <View style={[styles.group, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <SettingRow
            icon="person.3.fill"
            title={t("familyContacts")}
            detail={dict.trustedSafeContacts}
            colors={colors}
            onPress={() => router.push({ pathname: "/utility/[section]", params: { section: "familyContacts" } } as any)}
          />
          <SettingRow
            icon="lock.shield.fill"
            title={t("permissions")}
            detail={dict.locationPhotosNotifs}
            colors={colors}
            onPress={() => router.push({ pathname: "/utility/[section]", params: { section: "permissions" } } as any)}
          />
          <SettingRow
            icon="questionmark.circle.fill"
            title={t("helpDesk")}
            detail="help@agiesalert.app"
            colors={colors}
            onPress={() => Linking.openURL("mailto:help@agiesalert.app")}
          />
          <SettingRow
            icon="link"
            title={dict.agiesWeb}
            detail={dict.openCompanionWeb}
            colors={colors}
            onPress={() => Linking.openURL("https://agiesalert.app")}
            last
          />
        </View>

        {/* Sign Out */}
        <Pressable onPress={() => router.replace("/")} style={[styles.signOut, { borderColor: colors.error }]}>
          <Text style={[styles.signOutText, { color: colors.error }]}>{t("signOut")}</Text>
        </Pressable>

        {/* EDIT PROFILE MODAL */}
        <Modal
          visible={isEditModalVisible}
          animationType="slide"
          transparent
          onRequestClose={() => setIsEditModalVisible(false)}
        >
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : undefined}
            style={styles.modalBackdrop}
          >
            <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
              <View style={styles.modalHeader}>
                <View>
                  <Text style={[styles.modalKicker, { color: colors.primary }]}>PERSONAL DETAILS</Text>
                  <Text style={[styles.modalTitle, { color: colors.foreground }]}>Edit Profile</Text>
                </View>
                <Pressable onPress={() => setIsEditModalVisible(false)} style={styles.closeBtn}>
                  <IconSymbol name="xmark" size={18} color={colors.foreground} />
                </Pressable>
              </View>

              <ScrollView showsVerticalScrollIndicator={false} style={styles.modalScroll}>
                {/* Full Name */}
                <Text style={[styles.fieldLabel, { color: colors.foreground }]}>Full Name *</Text>
                <TextInput
                  value={tempName}
                  onChangeText={setTempName}
                  placeholder="e.g. Aarav Sharma"
                  placeholderTextColor={colors.muted}
                  style={[styles.modalInput, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.foreground }]}
                />

                {/* Phone Number */}
                <Text style={[styles.fieldLabel, { color: colors.foreground }]}>Mobile Phone Number</Text>
                <TextInput
                  value={tempPhone}
                  onChangeText={setTempPhone}
                  placeholder="+91 98765 00000"
                  keyboardType="phone-pad"
                  placeholderTextColor={colors.muted}
                  style={[styles.modalInput, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.foreground }]}
                />

                {/* Blood Group */}
                <Text style={[styles.fieldLabel, { color: colors.foreground }]}>Blood Group</Text>
                <View style={styles.bloodGrid}>
                  {BLOOD_GROUPS.map((bg) => (
                    <Pressable
                      key={bg}
                      onPress={() => setTempBlood(bg)}
                      style={[
                        styles.bloodPill,
                        {
                          borderColor: tempBlood === bg ? "#D93025" : colors.border,
                          backgroundColor: tempBlood === bg ? "rgba(217, 48, 37, 0.15)" : colors.surface,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.bloodPillText,
                          { color: tempBlood === bg ? "#D93025" : colors.foreground },
                        ]}
                      >
                        {bg}
                      </Text>
                    </Pressable>
                  ))}
                </View>

                {/* People in Household */}
                <Text style={[styles.fieldLabel, { color: colors.foreground }]}>Family Members in Household</Text>
                <TextInput
                  value={tempPeople}
                  onChangeText={setTempPeople}
                  placeholder="3"
                  keyboardType="number-pad"
                  placeholderTextColor={colors.muted}
                  style={[styles.modalInput, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.foreground }]}
                />

                {/* Medical Notes */}
                <Text style={[styles.fieldLabel, { color: colors.foreground }]}>Medical Notes & Allergies</Text>
                <TextInput
                  value={tempMedical}
                  onChangeText={setTempMedical}
                  placeholder="e.g. Diabetic, Asthma, Penicillin allergy"
                  placeholderTextColor={colors.muted}
                  multiline
                  style={[
                    styles.modalInputMultiline,
                    { backgroundColor: colors.surface, borderColor: colors.border, color: colors.foreground },
                  ]}
                />

                {/* Save Button */}
                <Pressable
                  onPress={handleSaveModal}
                  style={({ pressed }) => [
                    styles.saveBtn,
                    { backgroundColor: saveSuccess ? colors.success : colors.primary },
                    pressed && styles.pressed,
                  ]}
                >
                  <IconSymbol
                    name={saveSuccess ? "checkmark.circle.fill" : "checkmark"}
                    size={18}
                    color="#fff"
                  />
                  <Text style={styles.saveBtnText}>
                    {saveSuccess ? "Saved Successfully!" : dict.save}
                  </Text>
                </Pressable>
              </ScrollView>
            </View>
          </KeyboardAvoidingView>
        </Modal>
      </ScrollView>
    </ScreenContainer>
  );
}

function SettingRow({
  icon,
  title,
  detail,
  colors,
  right,
  last,
  onPress,
}: {
  icon: any;
  title: string;
  detail: string;
  colors: ReturnType<typeof useColors>;
  right?: React.ReactNode;
  last?: boolean;
  onPress?: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.setting, !last && { borderBottomColor: colors.border, borderBottomWidth: 1 }]}
    >
      <IconSymbol name={icon} size={21} color={colors.primary} />
      <View style={{ flex: 1, marginLeft: 11 }}>
        <Text style={[styles.cardTitle, { color: colors.foreground }]}>{title}</Text>
        <Text style={[styles.cardSub, { color: colors.muted }]}>{detail}</Text>
      </View>
      {right || <IconSymbol name="chevron.right" size={17} color={colors.muted} />}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingTop: 14, paddingBottom: 36 },
  back: { flexDirection: "row", alignItems: "center", gap: 2, marginBottom: 20 },
  backText: { fontSize: 12, fontWeight: "800" },
  kicker: { fontSize: 10, fontWeight: "900", letterSpacing: 1.3 },
  title: { fontSize: 28, fontWeight: "900", marginTop: 4 },
  intro: { fontSize: 13, lineHeight: 19, marginTop: 9 },
  profileSectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 24,
    marginBottom: 9,
  },
  section: { fontSize: 10, fontWeight: "900", letterSpacing: 1.1 },
  editBadgeBtn: { flexDirection: "row", alignItems: "center", gap: 4, paddingVertical: 2, paddingHorizontal: 6 },
  editBadgeText: { fontSize: 11, fontWeight: "800" },
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    borderRadius: 18,
    borderWidth: 1,
  },
  avatar: { width: 46, height: 46, borderRadius: 16, alignItems: "center", justifyContent: "center" },
  avatarText: { color: "#fff", fontSize: 20, fontWeight: "900" },
  cardLabel: { fontSize: 9.5, fontWeight: "700", letterSpacing: 0.4 },
  nameDisplay: { fontSize: 16, fontWeight: "800", marginTop: 1 },
  profileSubDetails: { fontSize: 11, marginTop: 3 },
  pencilButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  cardTitle: { fontSize: 13, fontWeight: "800" },
  cardSub: { fontSize: 10, marginTop: 4 },
  group: { borderWidth: 1, borderRadius: 16, paddingHorizontal: 14 },
  setting: { flexDirection: "row", alignItems: "center", minHeight: 65 },
  languageCard: { borderWidth: 1, borderRadius: 16, padding: 14 },
  languageHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  languageGrid: { flexDirection: "row", flexWrap: "wrap", gap: 7, marginTop: 14 },
  languageOption: { width: "31.5%", borderWidth: 1, borderRadius: 10, paddingVertical: 9, alignItems: "center" },
  languageNative: { fontSize: 13, fontWeight: "800" },
  languageLabel: { fontSize: 9, marginTop: 3 },
  signOut: { alignItems: "center", borderWidth: 1, borderRadius: 15, paddingVertical: 14, marginTop: 23 },
  signOutText: { fontSize: 13, fontWeight: "900" },
  pressed: { opacity: 0.75, transform: [{ scale: 0.98 }] },

  // Modal Styles
  modalBackdrop: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: Platform.OS === "ios" ? 38 : 24,
    maxHeight: "88%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  modalKicker: { fontSize: 10, fontWeight: "900", letterSpacing: 1.2 },
  modalTitle: { fontSize: 24, fontWeight: "900", marginTop: 2 },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  modalScroll: {
    marginBottom: 10,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: "800",
    marginBottom: 6,
    marginTop: 12,
  },
  modalInput: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontSize: 14,
    fontWeight: "600",
  },
  modalInputMultiline: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontSize: 13,
    minHeight: 70,
    textAlignVertical: "top",
  },
  bloodGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 4,
  },
  bloodPill: {
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
  bloodPillText: {
    fontSize: 12,
    fontWeight: "800",
  },
  saveBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: 14,
    paddingVertical: 14,
    marginTop: 22,
    marginBottom: 12,
  },
  saveBtnText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "900",
  },
});
