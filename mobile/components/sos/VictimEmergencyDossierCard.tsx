import React from "react";
import { StyleSheet, Text, View, Pressable, Linking } from "react-native";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { SosIncident } from "@/lib/services/aegis-types";
import { EmergencyProfile } from "@/lib/emergency-profile";

interface VictimEmergencyDossierProps {
  incident?: SosIncident | null;
  profile?: EmergencyProfile | null;
}

export function VictimEmergencyDossierCard({ incident, profile }: VictimEmergencyDossierProps) {
  const colors = useColors();

  const callerName = incident?.requesterName || profile?.fullName || "Citizen in Distress";
  const callerPhone = incident?.requesterPhone || profile?.phoneNumber || "";
  const bloodGroup = incident?.bloodGroup || profile?.bloodGroup || "O+";
  
  // Extract Family Contacts
  const rawContacts = incident?.familyContacts && incident.familyContacts.length > 0
    ? incident.familyContacts
    : (profile?.familyContacts && profile.familyContacts.length > 0
        ? profile.familyContacts
        : (profile?.primaryContact?.phone ? [profile.primaryContact] : []));

  // Extract Police Stations
  const homeStationName = incident?.homePoliceStation || (profile as any)?.homePoliceStation || "Kakinada Town Police Station";
  const homeStationPhone = incident?.homePoliceNumber || (profile as any)?.homePoliceNumber || "0884-2365555";
  
  const currentStationName = incident?.currentPoliceStation || "Jurisdictional Police Station (Area Dispatch)";
  const currentStationPhone = incident?.currentPoliceNumber || "112";

  const handleCall = (phone?: string) => {
    if (!phone) return;
    const clean = phone.replace(/[^0-9+]/g, "");
    if (clean) {
      Linking.openURL(`tel:${clean}`);
    }
  };

  return (
    <View style={[styles.card, { backgroundColor: colors.surface, borderColor: "rgba(217, 48, 37, 0.4)" }]}>
      {/* Card Header */}
      <View style={styles.cardHeader}>
        <View style={styles.badge}>
          <IconSymbol name="person.crop.circle.badge.exclamationmark" size={16} color="#FFFFFF" />
          <Text style={styles.badgeText}>VICTIM & JURISDICTION DOSSIER</Text>
        </View>
        <View style={[styles.bloodBadge, { backgroundColor: "rgba(217, 48, 37, 0.15)" }]}>
          <Text style={styles.bloodText}>🩸 {bloodGroup}</Text>
        </View>
      </View>

      {/* Victim Direct Info */}
      <View style={[styles.victimRow, { backgroundColor: colors.background, borderColor: colors.border }]}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.victimName, { color: colors.foreground }]}>{callerName}</Text>
          <Text style={[styles.victimPhone, { color: colors.primary }]}>
            {callerPhone ? `📞 ${callerPhone}` : "Direct Phone Available"}
          </Text>
        </View>
        {callerPhone ? (
          <Pressable
            onPress={() => handleCall(callerPhone)}
            style={({ pressed }) => [styles.callBtn, { backgroundColor: "#188038" }, pressed && { opacity: 0.8 }]}
          >
            <IconSymbol name="phone.fill" size={13} color="#FFFFFF" />
            <Text style={styles.callBtnText}>CALL</Text>
          </Pressable>
        ) : null}
      </View>

      {/* Family Emergency Contacts */}
      {rawContacts.length > 0 && (
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.muted }]}>
            👨‍👩‍👧‍👦 FAMILY EMERGENCY CONTACTS ({rawContacts.length})
          </Text>
          <View style={styles.familyList}>
            {rawContacts.map((contact, idx) => (
              <View
                key={idx}
                style={[styles.contactItem, { backgroundColor: colors.background, borderColor: colors.border }]}
              >
                <View style={{ flex: 1 }}>
                  <Text style={[styles.contactName, { color: colors.foreground }]}>
                    {contact.name} {contact.relationship ? `(${contact.relationship})` : ""}
                  </Text>
                  <Text style={[styles.contactPhone, { color: colors.muted }]}>
                    {contact.phone}
                  </Text>
                </View>
                {contact.phone ? (
                  <Pressable
                    onPress={() => handleCall(contact.phone)}
                    style={({ pressed }) => [styles.smallCallBtn, { backgroundColor: "#2563EB" }, pressed && { opacity: 0.8 }]}
                  >
                    <IconSymbol name="phone.fill" size={11} color="#FFFFFF" />
                    <Text style={styles.smallCallText}>CALL</Text>
                  </Pressable>
                ) : null}
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Police Jurisdiction Section */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.muted }]}>
          🚔 JURISDICTIONAL POLICE STATIONS
        </Text>

        {/* Home Town Police */}
        <View style={[styles.policeCard, { backgroundColor: colors.background, borderColor: colors.border }]}>
          <View style={{ flex: 1 }}>
            <Text style={styles.policeTypeLabel}>VICTIM HOMETOWN STATION</Text>
            <Text style={[styles.policeName, { color: colors.foreground }]}>{homeStationName}</Text>
            <Text style={[styles.policePhone, { color: colors.primary }]}>{homeStationPhone}</Text>
          </View>
          <Pressable
            onPress={() => handleCall(homeStationPhone)}
            style={({ pressed }) => [styles.smallCallBtn, { backgroundColor: "#D93025" }, pressed && { opacity: 0.8 }]}
          >
            <IconSymbol name="phone.fill" size={11} color="#FFFFFF" />
            <Text style={styles.smallCallText}>CALL</Text>
          </Pressable>
        </View>

        {/* Current Incident Location Police */}
        <View style={[styles.policeCard, { backgroundColor: colors.background, borderColor: colors.border, marginTop: 6 }]}>
          <View style={{ flex: 1 }}>
            <Text style={styles.policeTypeLabel}>INCIDENT LOCATION POLICE</Text>
            <Text style={[styles.policeName, { color: colors.foreground }]}>{currentStationName}</Text>
            <Text style={[styles.policePhone, { color: "#EA580C" }]}>{currentStationPhone}</Text>
          </View>
          <Pressable
            onPress={() => handleCall(currentStationPhone)}
            style={({ pressed }) => [styles.smallCallBtn, { backgroundColor: "#EA580C" }, pressed && { opacity: 0.8 }]}
          >
            <IconSymbol name="phone.fill" size={11} color="#FFFFFF" />
            <Text style={styles.smallCallText}>CALL</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    borderWidth: 1.5,
    padding: 12,
    marginVertical: 8,
    gap: 10,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#D93025",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  badgeText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
  bloodBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  bloodText: {
    color: "#D93025",
    fontSize: 12,
    fontWeight: "900",
  },
  victimRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  victimName: {
    fontSize: 14,
    fontWeight: "800",
  },
  victimPhone: {
    fontSize: 12,
    fontWeight: "700",
    marginTop: 2,
  },
  callBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
  },
  callBtnText: {
    color: "#FFFFFF",
    fontSize: 11.5,
    fontWeight: "900",
  },
  section: {
    gap: 6,
  },
  sectionTitle: {
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.6,
  },
  familyList: {
    gap: 6,
  },
  contactItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 8,
    borderRadius: 10,
    borderWidth: 1,
  },
  contactName: {
    fontSize: 12,
    fontWeight: "700",
  },
  contactPhone: {
    fontSize: 11,
    marginTop: 1,
  },
  smallCallBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
  },
  smallCallText: {
    color: "#FFFFFF",
    fontSize: 10.5,
    fontWeight: "900",
  },
  policeCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 8,
    borderRadius: 10,
    borderWidth: 1,
  },
  policeTypeLabel: {
    fontSize: 9,
    fontWeight: "800",
    color: "#D97706",
    letterSpacing: 0.5,
  },
  policeName: {
    fontSize: 11.5,
    fontWeight: "700",
    marginTop: 1,
  },
  policePhone: {
    fontSize: 11,
    fontWeight: "700",
    marginTop: 1,
  },
});
