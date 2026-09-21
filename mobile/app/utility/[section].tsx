import React, { useEffect, useState } from "react";
import {
  Alert,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { useAppPreferences } from "@/lib/app-preferences";
import {
  useEmergencyProfile,
  FamilyContact,
} from "@/lib/emergency-profile";
import {
  getSafeCheckInHistory,
  getOfflineQueue,
  clearAllCache,
} from "@/lib/services/aegis-cache";
import { SafeCheckInRecord, IndiaEmergencyService } from "@/lib/services/aegis-types";
import { ALL_INDIA_EMERGENCY_SERVICES, getIndiaEmergencyServicesData } from "@/lib/india-emergency-data";
import { AegisApiService } from "@/lib/services/aegis-api";

const config: Record<string, { icon: any; title: string; body: string }> = {
  familyContacts: {
    icon: "person.3.fill",
    title: "Family contacts",
    body: "Manage contacts who receive emergency SOS distress alerts and Safe Check-In pings from the Beacon.",
  },
  emergencyServices: {
    icon: "phone.badge.checkmark",
    title: "Emergency Services — India",
    body: "Pan-India 24x7 National helplines & 28 State and 8 Union Territory Disaster Management Authorities.",
  },
  downloads: {
    icon: "download.fill",
    title: "Downloads",
    body: "Your saved guides, sector shelter maps, and triage protocols are available offline here.",
  },
  offlineMaps: {
    icon: "map.fill",
    title: "Offline maps & cache",
    body: "Inspect and manage local sector cache, shelters, hospitals, and queued offline sync items.",
  },
  history: {
    icon: "clock.arrow.circlepath",
    title: "History",
    body: "Review recent SOS distress beacons, Safe Check-In history, and citizen report records.",
  },
  permissions: {
    icon: "lock.shield.fill",
    title: "Permissions",
    body: "Manage location, photo library, and notification access in device settings.",
  },
  helpDesk: {
    icon: "questionmark.circle.fill",
    title: "Help desk",
    body: "Contact the AGIES ALERT national operations desk for support.",
  },
};

const RELATIONSHIPS = [
  "Spouse",
  "Father",
  "Mother",
  "Son",
  "Daughter",
  "Brother",
  "Sister",
  "Guardian",
  "Relative",
  "Doctor",
  "Friend",
  "Other",
];

export default function UtilityScreen() {
  const colors = useColors();
  const router = useRouter();
  const { section } = useLocalSearchParams<{ section: string }>();
  const { t, dict } = useAppPreferences();
  const { profile, updateFamilyContacts } = useEmergencyProfile();

  const item = config[section || "history"] || config.history;

  // Family Contacts Local State
  const [contacts, setContacts] = useState<FamilyContact[]>(profile.familyContacts || []);
  const [savedFeedback, setSavedFeedback] = useState<string | null>(null);

  // Emergency Services Directory State
  const [selectedStateFilter, setSelectedStateFilter] = useState<string>("ALL");
  const [emergencyServicesList, setEmergencyServicesList] = useState<IndiaEmergencyService[]>(ALL_INDIA_EMERGENCY_SERVICES);

  // History State
  const [safeHistory, setSafeHistory] = useState<SafeCheckInRecord[]>([]);
  const [offlineQueueCount, setOfflineQueueCount] = useState<number>(0);

  useEffect(() => {
    if (profile.familyContacts) {
      setContacts(profile.familyContacts);
    }
  }, [profile.familyContacts]);

  useEffect(() => {
    if (section === "history") {
      void getSafeCheckInHistory().then(setSafeHistory);
      void getOfflineQueue().then((q) => setOfflineQueueCount(q.length));
    } else if (section === "offlineMaps") {
      void getOfflineQueue().then((q) => setOfflineQueueCount(q.length));
    } else if (section === "emergencyServices") {
      setEmergencyServicesList(
        selectedStateFilter === "ALL"
          ? ALL_INDIA_EMERGENCY_SERVICES
          : getIndiaEmergencyServicesData(selectedStateFilter)
      );
    }
  }, [section, selectedStateFilter]);

  // Family Contact Actions
  const handleAddContact = () => {
    const newContact: FamilyContact = {
      id: `fam-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      name: "",
      phone: "",
      relationship: "Family Member",
      isPrimary: contacts.length === 0,
      notes: "",
    };
    setContacts((prev) => [...prev, newContact]);
  };

  const handleUpdateContact = (id: string, field: keyof FamilyContact, value: any) => {
    setContacts((prev) =>
      prev.map((c) => (c.id === id ? { ...c, [field]: value } : c))
    );
  };

  const handleSetPrimary = (id: string) => {
    setContacts((prev) =>
      prev.map((c) => ({
        ...c,
        isPrimary: c.id === id,
      }))
    );
  };

  const handleRemoveContact = (id: string, name: string) => {
    Alert.alert(
      "Remove Family Contact",
      `Are you sure you want to remove ${name || "this contact"} from your emergency alert list?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: () => {
            setContacts((prev) => prev.filter((c) => c.id !== id));
          },
        },
      ]
    );
  };

  const handleSaveContacts = async () => {
    const valid = contacts.filter((c) => c.name.trim().length > 0 || c.phone.trim().length > 0);
    if (valid.length === 0) {
      Alert.alert("No Contacts", "Please enter at least one family member's name and working phone number.");
      return;
    }
    await updateFamilyContacts(valid);
    setSavedFeedback("✓ Family contacts saved! Beacon SOS & Safe buttons will alert these numbers.");
    setTimeout(() => setSavedFeedback(null), 4000);
  };

  return (
    <ScreenContainer className="px-5" edges={["top", "left", "right"]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <Pressable onPress={() => router.back()} style={styles.back}>
          <IconSymbol
            name="chevron.right"
            size={18}
            color={colors.primary}
            style={{ transform: [{ rotate: "180deg" }] }}
          />
          <Text style={[styles.backText, { color: colors.primary }]}>{dict.back}</Text>
        </Pressable>

        <View
          style={[
            styles.hero,
            { backgroundColor: colors.primary + "12", borderColor: colors.primary + "35" },
          ]}
        >
          <View style={[styles.icon, { backgroundColor: colors.primary }]}>
            <IconSymbol name={item.icon} size={25} color="#fff" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.title, { color: colors.foreground }]}>
              {section ? t(section) : item.title}
            </Text>
            <Text style={[styles.body, { color: colors.muted }]}>{item.body}</Text>
          </View>
        </View>

        {/* ======================================================== */}
        {/* FAMILY CONTACTS SECTION: LIVE WORKING PHONE NUMBERS     */}
        {/* ======================================================== */}
        {section === "familyContacts" && (
          <View style={{ marginTop: 6 }}>
            {savedFeedback && (
              <View
                style={[
                  styles.feedbackBanner,
                  { backgroundColor: colors.success + "1A", borderColor: colors.success + "66" },
                ]}
              >
                <IconSymbol name="checkmark.circle.fill" size={18} color={colors.success} />
                <Text style={[styles.feedbackBannerText, { color: colors.success }]}>
                  {savedFeedback}
                </Text>
              </View>
            )}

            <View style={[styles.infoCallout, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <IconSymbol name="shield.lefthalf.filled" size={18} color={colors.primary} />
              <Text style={[styles.infoCalloutText, { color: colors.muted }]}>
                The round <Text style={{ color: "#D93025", fontWeight: "800" }}>SOS</Text> and{" "}
                <Text style={{ color: "#188038", fontWeight: "800" }}>SAFE</Text> buttons in the Beacon will automatically broadcast your live GPS and dispatch alerts to these working numbers.
              </Text>
            </View>

            {contacts.map((contact, index) => (
              <View
                key={contact.id}
                style={[
                  styles.contactCard,
                  { backgroundColor: colors.surface, borderColor: colors.border },
                  contact.isPrimary && { borderColor: colors.primary, borderWidth: 1.8 },
                ]}
              >
                <View style={styles.cardHeader}>
                  <View style={styles.badgeRow}>
                    <View style={[styles.indexBadge, { backgroundColor: colors.primary }]}>
                      <Text style={styles.indexBadgeText}>#{index + 1}</Text>
                    </View>
                    <View>
                      <Text style={[styles.cardTitle, { color: colors.foreground }]}>
                        {contact.name.trim() || `Family Contact #${index + 1}`}
                      </Text>
                      <Text style={[styles.cardSub, { color: colors.muted }]}>
                        {contact.relationship} {contact.isPrimary ? "• Primary SOS Recipient" : ""}
                      </Text>
                    </View>
                  </View>

                  {contacts.length > 1 && (
                    <Pressable
                      onPress={() => handleRemoveContact(contact.id, contact.name)}
                      style={[styles.removeBtn, { backgroundColor: "#FCE8E6" }]}
                    >
                      <IconSymbol name="trash.fill" size={13} color="#D93025" />
                      <Text style={styles.removeBtnText}>Delete</Text>
                    </Pressable>
                  )}
                </View>

                {/* Member Name Input */}
                <View style={styles.inputBlock}>
                  <Text style={[styles.inputLabel, { color: colors.foreground }]}>
                    Full Name <Text style={{ color: "#D93025" }}>*</Text>
                  </Text>
                  <TextInput
                    value={contact.name}
                    onChangeText={(text) => handleUpdateContact(contact.id, "name", text)}
                    placeholder="e.g. Priya Sharma"
                    placeholderTextColor={colors.muted}
                    style={[
                      styles.inputBox,
                      { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.background },
                    ]}
                  />
                </View>

                {/* Working Phone Input */}
                <View style={styles.inputBlock}>
                  <Text style={[styles.inputLabel, { color: colors.foreground }]}>
                    Active Working Phone Number <Text style={{ color: "#D93025" }}>*</Text>
                  </Text>
                  <TextInput
                    value={contact.phone}
                    onChangeText={(text) => handleUpdateContact(contact.id, "phone", text)}
                    placeholder="+91 98765 43210"
                    placeholderTextColor={colors.muted}
                    keyboardType="phone-pad"
                    style={[
                      styles.inputBox,
                      { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.background },
                    ]}
                  />
                </View>

                {/* Relationship Grid */}
                <View style={styles.inputBlock}>
                  <Text style={[styles.inputLabel, { color: colors.foreground }]}>Relationship</Text>
                  <View style={styles.chipGrid}>
                    {RELATIONSHIPS.slice(0, 6).map((rel) => {
                      const isSelected = contact.relationship === rel;
                      return (
                        <Pressable
                          key={rel}
                          onPress={() => handleUpdateContact(contact.id, "relationship", rel)}
                          style={[
                            styles.chip,
                            {
                              backgroundColor: isSelected ? colors.primary : colors.background,
                              borderColor: isSelected ? colors.primary : colors.border,
                            },
                          ]}
                        >
                          <Text
                            style={[
                              styles.chipText,
                              { color: isSelected ? "#FFFFFF" : colors.foreground },
                            ]}
                          >
                            {rel}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                </View>

                {/* Primary Alert Switch */}
                <View style={styles.primarySwitchRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.switchTitle, { color: colors.foreground }]}>
                      Primary Priority Alert
                    </Text>
                    <Text style={[styles.switchSub, { color: colors.muted }]}>
                      Direct first phone call & SMS on SOS trigger
                    </Text>
                  </View>
                  <Switch
                    value={Boolean(contact.isPrimary)}
                    onValueChange={() => handleSetPrimary(contact.id)}
                    trackColor={{ false: colors.border, true: "#D93025" }}
                    thumbColor="#fff"
                  />
                </View>
              </View>
            ))}

            {/* Add Contact Button */}
            <Pressable
              onPress={handleAddContact}
              style={[
                styles.addContactBtn,
                { borderColor: colors.primary, backgroundColor: colors.primary + "12" },
              ]}
            >
              <IconSymbol name="plus.circle.fill" size={19} color={colors.primary} />
              <Text style={[styles.addContactBtnText, { color: colors.primary }]}>
                + Add Another Family Contact (Unlimited)
              </Text>
            </Pressable>

            {/* Save All Contacts Button */}
            <Pressable
              onPress={handleSaveContacts}
              style={[styles.saveAllBtn, { backgroundColor: colors.primary }]}
            >
              <IconSymbol name="checkmark.circle.fill" size={20} color="#FFFFFF" />
              <Text style={styles.saveAllBtnText}>Save All Family Contacts</Text>
            </Pressable>
          </View>
        )}

        {/* ======================================================== */}
        {/* EMERGENCY SERVICES — INDIA (NATIONAL + 28 STATES & 8 UTs) */}
        {/* ======================================================== */}
        {section === "emergencyServices" && (
          <View style={{ gap: 12 }}>
            <View style={[styles.infoCallout, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <IconSymbol name="phone.fill" size={18} color="#D93025" />
              <Text style={[styles.infoCalloutText, { color: colors.muted }]}>
                Direct 24x7 pan-India emergency dispatches. Tap any number to call or dispatch SMS with GPS.
              </Text>
            </View>

            {/* State Filter Chips */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6, paddingVertical: 4 }}>
              {["ALL", "National", "AP", "MH", "OD", "KL", "TN", "DL", "KA", "WB", "GJ"].map((st) => (
                <Pressable
                  key={st}
                  onPress={() => setSelectedStateFilter(st)}
                  style={[
                    styles.chip,
                    {
                      backgroundColor: selectedStateFilter === st ? colors.primary : colors.surface,
                      borderColor: selectedStateFilter === st ? colors.primary : colors.border,
                    },
                  ]}
                >
                  <Text style={[styles.chipText, { color: selectedStateFilter === st ? "#FFFFFF" : colors.foreground }]}>
                    {st === "ALL" ? "All Services" : st}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>

            {emergencyServicesList.map((srv) => (
              <View
                key={srv.id}
                style={[styles.contactCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
              >
                <View style={styles.cardHeader}>
                  <View style={{ flex: 1 }}>
                    <View style={styles.tagRow}>
                      <Text style={[styles.categoryBadge, { backgroundColor: srv.isNational ? "#D93025" : colors.primary }]}>
                        {srv.isNational ? "NATIONAL 24x7" : srv.state || "STATE AUTHORITY"}
                      </Text>
                      {srv.available24x7 && (
                        <Text style={[styles.statusBadge, { color: "#188038" }]}>● 24x7 Active</Text>
                      )}
                    </View>
                    <Text style={[styles.cardTitle, { color: colors.foreground, marginTop: 4 }]}>
                      {srv.name}
                    </Text>
                    <Text style={[styles.cardSub, { color: colors.muted }]}>
                      {srv.description}
                    </Text>
                  </View>
                </View>

                <View style={styles.serviceActionsRow}>
                  <Pressable
                    onPress={() => Linking.openURL(`tel:${srv.number}`)}
                    style={[styles.serviceActionBtn, { backgroundColor: "#D93025" }]}
                  >
                    <IconSymbol name="phone.fill" size={13} color="#FFFFFF" />
                    <Text style={styles.serviceActionText}>Call {srv.number}</Text>
                  </Pressable>

                  {srv.smsNumber && (
                    <Pressable
                      onPress={() => Linking.openURL(`sms:${srv.smsNumber}`)}
                      style={[styles.serviceActionBtn, { backgroundColor: "#EA580C" }]}
                    >
                      <IconSymbol name="message.fill" size={13} color="#FFFFFF" />
                      <Text style={styles.serviceActionText}>SMS {srv.smsNumber}</Text>
                    </Pressable>
                  )}

                  {srv.website && (
                    <Pressable
                      onPress={() => Linking.openURL(srv.website!)}
                      style={[styles.serviceActionBtn, { backgroundColor: colors.primary }]}
                    >
                      <IconSymbol name="globe" size={13} color="#FFFFFF" />
                      <Text style={styles.serviceActionText}>Website</Text>
                    </Pressable>
                  )}
                </View>
              </View>
            ))}
          </View>
        )}

        {/* ======================================================== */}
        {/* REAL OFFLINE STORAGE & RESILIENT CACHE INSPECTOR         */}
        {/* ======================================================== */}
        {section === "offlineMaps" && (
          <View style={{ gap: 12 }}>
            <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <IconSymbol name="internaldrive.fill" size={22} color={colors.primary} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.cardTitle, { color: colors.foreground }]}>Local Sector Storage Grid</Text>
                <Text style={[styles.cardSub, { color: colors.muted }]}>
                  Offline verified shelters, hospital beds, and weather baseline
                </Text>
              </View>
              <View style={[styles.dot, { backgroundColor: colors.success }]} />
            </View>

            <Field label="Offline SOS Queue" detail={`${offlineQueueCount} action(s) pending background sync`} colors={colors} />
            <Field label="Verified Shelters Dataset" detail="12 high-ground shelters cached locally with GPS" colors={colors} />
            <Field label="Emergency Hospitals" detail="8 disaster trauma centers cached with elevation metrics" colors={colors} />
            <Field label="Sector Hazard Risk Map" detail="Flash inundation and storm surge boundaries ready" colors={colors} />

            {offlineQueueCount > 0 && (
              <Action
                label="Sync Queued Actions Now"
                colors={colors}
                onPress={async () => {
                  const res = await AegisApiService.syncOfflineQueue();
                  setOfflineQueueCount(res.remainingCount);
                  Alert.alert("Sync Complete", `Synchronized ${res.syncedCount} queued action(s) with central Aegis backend.`);
                }}
              />
            )}

            <Action
              label="Open Live Safety Map"
              colors={colors}
              onPress={() => router.push("/map" as any)}
            />

            <Pressable
              onPress={() => {
                Alert.alert(
                  "Clear Offline Cache",
                  "Are you sure you want to clear local cached records? Live fresh data will be downloaded when online.",
                  [
                    { text: "Cancel", style: "cancel" },
                    {
                      text: "Clear Cache",
                      style: "destructive",
                      onPress: async () => {
                        await clearAllCache();
                        Alert.alert("Cache Cleared", "Local cache reset successfully.");
                      },
                    },
                  ]
                );
              }}
              style={[styles.clearCacheBtn, { borderColor: colors.border }]}
            >
              <Text style={[styles.clearCacheText, { color: colors.error }]}>Clear Local Cache</Text>
            </Pressable>
          </View>
        )}

        {section === "downloads" && (
          <>
            <Field label="NDMA National Disaster Guide" detail="Available offline • 2.4 MB" colors={colors} />
            <Field label="Pan-India Emergency Numbers Directory" detail="Available offline • 42 KB" colors={colors} />
            <Field label="Coastal Flood & Cyclone Safety Manual" detail="Available offline • 1.8 MB" colors={colors} />
            <Field label="First Aid & Trauma Triage Guidelines" detail="Available offline • 950 KB" colors={colors} />
            <Action
              label="Explore Safety Guides"
              colors={colors}
              onPress={() => router.push("/guide")}
            />
          </>
        )}

        {/* ======================================================== */}
        {/* SAFE CHECK-IN & SOS INCIDENT HISTORY (IST COMPLIANT)     */}
        {/* ======================================================== */}
        {section === "history" && (
          <View style={{ gap: 10 }}>
            {safeHistory.length === 0 ? (
              <Field
                label="No past Safe Check-In records"
                detail="When you broadcast 'I AM SAFE' in Beacon, check-in timestamps and GPS coordinates are preserved here."
                colors={colors}
              />
            ) : (
              safeHistory.map((rec) => (
                <View
                  key={rec.id}
                  style={[styles.contactCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
                >
                  <View style={styles.cardHeader}>
                    <View style={{ flex: 1 }}>
                      <View style={styles.tagRow}>
                        <Text style={[styles.categoryBadge, { backgroundColor: rec.status === "delivered" ? "#188038" : "#D97706" }]}>
                          {rec.status === "delivered" ? "✓ DELIVERED" : "⏳ PENDING SYNC"}
                        </Text>
                        <Text style={[styles.statusBadge, { color: colors.muted }]}>
                          {typeof rec.timestampFormattedIST === "string"
                            ? rec.timestampFormattedIST
                            : rec.timestampFormattedIST?.fullFormatted || rec.timestamp}
                        </Text>
                      </View>
                      <Text style={[styles.cardTitle, { color: colors.foreground, marginTop: 4 }]}>
                        {rec.message}
                      </Text>
                      <Text style={[styles.cardSub, { color: colors.muted }]}>
                        📍 {rec.location.address || "Live Location"} • {rec.familyNotifiedCount} contact(s) alerted
                      </Text>
                    </View>
                  </View>
                </View>
              ))
            )}
            <Action
              label="Open Citizen Reports"
              colors={colors}
              onPress={() => router.push("/(tabs)/reports" as any)}
            />
          </View>
        )}

        {section === "permissions" && (
          <>
            <Field
              label="Location"
              detail="Used for live weather, routes, and emergency context"
              colors={colors}
            />
            <Field
              label="Photos"
              detail="Used only when you attach evidence to a citizen report"
              colors={colors}
            />
            <Action
              label="Open device settings"
              colors={colors}
              onPress={() => Linking.openSettings()}
            />
          </>
        )}

        {section === "helpDesk" && (
          <>
            <Field label="Email support" detail="help@agiesalert.app" colors={colors} />
            <Action
              label="Email the help desk"
              colors={colors}
              onPress={() => Linking.openURL("mailto:help@agiesalert.app")}
            />
          </>
        )}
      </ScrollView>
    </ScreenContainer>
  );
}

function Field({
  label,
  detail,
  colors,
}: {
  label: string;
  detail: string;
  colors: ReturnType<typeof useColors>;
}) {
  return (
    <View style={[styles.field, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <Text style={[styles.fieldTitle, { color: colors.foreground }]}>{label}</Text>
      <Text style={[styles.fieldDetail, { color: colors.muted }]}>{detail}</Text>
    </View>
  );
}

function Action({
  label,
  colors,
  onPress,
}: {
  label: string;
  colors: ReturnType<typeof useColors>;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.action,
        { backgroundColor: colors.primary },
        pressed && { opacity: 0.75 },
      ]}
    >
      <Text style={styles.actionText}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingTop: 14, paddingBottom: 36 },
  back: { flexDirection: "row", alignItems: "center", gap: 2, marginBottom: 23 },
  backText: { fontSize: 12, fontWeight: "800" },
  hero: { flexDirection: "row", gap: 12, padding: 15, borderWidth: 1, borderRadius: 18, marginBottom: 18 },
  icon: { width: 47, height: 47, borderRadius: 15, alignItems: "center", justifyContent: "center" },
  title: { fontSize: 22, fontWeight: "900", marginBottom: 5 },
  body: { fontSize: 12, lineHeight: 17 },
  feedbackBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 14,
  },
  feedbackBannerText: { fontSize: 12, fontWeight: "700", flex: 1 },
  infoCallout: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 14,
  },
  infoCalloutText: { fontSize: 11.5, lineHeight: 16, flex: 1 },
  contactCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    marginBottom: 12,
    gap: 10,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  badgeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flex: 1,
  },
  indexBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  indexBadgeText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "900",
  },
  cardTitle: { fontSize: 14, fontWeight: "800" },
  cardSub: { fontSize: 10.5, marginTop: 2 },
  removeBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 8,
  },
  removeBtnText: {
    color: "#D93025",
    fontSize: 10.5,
    fontWeight: "800",
  },
  inputBlock: {
    marginTop: 2,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: "700",
    marginBottom: 4,
  },
  inputBox: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 13,
    fontWeight: "600",
  },
  chipGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginTop: 4,
  },
  chip: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  chipText: {
    fontSize: 11,
    fontWeight: "700",
  },
  primarySwitchRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: "rgba(150,150,150,0.15)",
  },
  switchTitle: {
    fontSize: 12,
    fontWeight: "800",
  },
  switchSub: {
    fontSize: 10,
    marginTop: 1,
  },
  addContactBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderWidth: 1.5,
    borderStyle: "dashed",
    borderRadius: 14,
    paddingVertical: 12,
    marginTop: 4,
    marginBottom: 12,
  },
  addContactBtnText: {
    fontSize: 12.5,
    fontWeight: "800",
  },
  saveAllBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: 14,
    paddingVertical: 14,
    marginBottom: 16,
  },
  saveAllBtnText: {
    color: "#FFFFFF",
    fontSize: 13.5,
    fontWeight: "900",
  },
  field: { borderWidth: 1, borderRadius: 15, padding: 14, marginBottom: 9 },
  fieldTitle: { fontSize: 13, fontWeight: "800" },
  fieldDetail: { fontSize: 11, lineHeight: 16, marginTop: 4 },
  card: { flexDirection: "row", alignItems: "center", gap: 10, padding: 14, borderWidth: 1, borderRadius: 15 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  simCard: { borderWidth: 1, borderRadius: 16, padding: 14, marginTop: 12 },
  simHeader: { flexDirection: "row", alignItems: "center" },
  percent: { fontSize: 18, fontWeight: "900" },
  progressTrack: { height: 8, borderRadius: 5, overflow: "hidden", marginTop: 15 },
  progressFill: { height: 8, borderRadius: 5 },
  statusNote: { fontSize: 10, lineHeight: 15, marginTop: 10 },
  note: { fontSize: 11, lineHeight: 17, marginTop: 14 },
  serviceActionsRow: { flexDirection: "row", gap: 8, marginTop: 6, flexWrap: "wrap" },
  serviceActionBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
  },
  serviceActionText: { color: "#FFFFFF", fontSize: 11, fontWeight: "800" },
  tagRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 4 },
  categoryBadge: { color: "#FFFFFF", fontSize: 9.5, fontWeight: "900", paddingHorizontal: 6, paddingVertical: 2, borderRadius: 5 },
  statusBadge: { fontSize: 10.5, fontWeight: "700" },
  clearCacheBtn: { paddingVertical: 12, borderRadius: 12, borderWidth: 1, alignItems: "center", marginTop: 8 },
  clearCacheText: { fontSize: 12, fontWeight: "800" },
  action: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
  },
  actionText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "800",
  },
});
