import React from "react";
import {
  Modal,
  StyleSheet,
  Text,
  View,
  Pressable,
  ActivityIndicator,
} from "react-native";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { NearbySosOffer } from "@/lib/services/aegis-types";
import { useColors } from "@/hooks/use-colors";

interface NearbySosRequestModalProps {
  visible: boolean;
  offer: NearbySosOffer | null;
  isAccepting?: boolean;
  errorMessage?: string | null;
  onAccept: (offer: NearbySosOffer) => void;
  onDecline: (offer: NearbySosOffer) => void;
}

export function NearbySosRequestModal({
  visible,
  offer,
  isAccepting = false,
  errorMessage = null,
  onAccept,
  onDecline,
}: NearbySosRequestModalProps) {
  const colors = useColors();

  if (!offer) return null;

  const categoryLabels: Record<string, { label: string; icon: any; color: string }> = {
    medical: { label: "Medical Emergency", icon: "cross.case.fill", color: "#D93025" },
    flood: { label: "Flash Flood / Inundation", icon: "drop.fill", color: "#2479A8" },
    fire: { label: "Fire / Smoke Hazard", icon: "flame.fill", color: "#EA8600" },
    trapped: { label: "Person Trapped / Debris", icon: "exclamationmark.triangle.fill", color: "#D93025" },
    cyclone: { label: "Severe Storm / Cyclone", icon: "wind", color: "#188038" },
    accident: { label: "Road / Structural Incident", icon: "car.fill", color: "#D93025" },
    general: { label: "Critical Distress Assistance", icon: "sos.circle.fill", color: "#D93025" },
  };

  const catMeta = categoryLabels[offer.category] || categoryLabels.general;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={() => onDecline(offer)}
    >
      <View style={styles.backdrop}>
        <View style={[styles.card, { backgroundColor: colors.background, borderColor: colors.border }]}>
          {/* Header Beacon Bar */}
          <View style={styles.headerBar}>
            <View style={styles.beaconIconWrapper}>
              <IconSymbol name="sos.circle.fill" size={24} color="#FFFFFF" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.kicker}>🚨 AEGIS SOS REQUEST</Text>
              <Text style={[styles.subKicker, { color: colors.muted }]}>
                Someone nearby needs emergency assistance
              </Text>
            </View>
          </View>

          {/* Error Banner (e.g. Already Accepted by competing responder) */}
          {errorMessage && (
            <View style={styles.errorBanner}>
              <IconSymbol name="exclamationmark.triangle.fill" size={14} color="#D93025" />
              <Text style={styles.errorText}>{errorMessage}</Text>
            </View>
          )}

          {/* Detail Metric Rows */}
          <View style={[styles.detailsContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            {/* Distance Pill */}
            <View style={styles.metricRow}>
              <View style={styles.metricLabelCol}>
                <IconSymbol name="location.fill" size={16} color={colors.primary} />
                <Text style={[styles.metricLabel, { color: colors.muted }]}>Approximate distance</Text>
              </View>
              <Text style={[styles.metricValueLarge, { color: colors.primary }]}>
                {offer.approximateDistanceKm} km
              </Text>
            </View>

            <View style={styles.divider} />

            {/* Area Row */}
            <View style={styles.metricRow}>
              <View style={styles.metricLabelCol}>
                <IconSymbol name="building.2.fill" size={15} color={colors.foreground} />
                <Text style={[styles.metricLabel, { color: colors.muted }]}>Area</Text>
              </View>
              <Text numberOfLines={1} style={[styles.metricValue, { color: colors.foreground }]}>
                {offer.area}
              </Text>
            </View>

            <View style={styles.divider} />

            {/* Emergency Type Row */}
            <View style={styles.metricRow}>
              <View style={styles.metricLabelCol}>
                <IconSymbol name={catMeta.icon} size={15} color={catMeta.color} />
                <Text style={[styles.metricLabel, { color: colors.muted }]}>Emergency</Text>
              </View>
              <Text style={[styles.metricValue, { color: catMeta.color, fontWeight: "800" }]}>
                {catMeta.label}
              </Text>
            </View>
          </View>

          {/* Privacy Notice Badge */}
          <View style={styles.privacyPill}>
            <IconSymbol name="lock.shield.fill" size={12} color="#188038" />
            <Text style={styles.privacyText}>
              Exact location & route revealed upon authorized acceptance
            </Text>
          </View>

          {/* Action Buttons: [ ACCEPT ] [ DECLINE ] */}
          <View style={styles.actionsRow}>
            <Pressable
              onPress={() => onDecline(offer)}
              disabled={isAccepting}
              style={({ pressed }) => [
                styles.declineBtn,
                { borderColor: colors.border, backgroundColor: colors.surface },
                pressed && { opacity: 0.75 },
              ]}
            >
              <Text style={[styles.declineBtnText, { color: colors.foreground }]}>DECLINE</Text>
            </Pressable>

            <Pressable
              onPress={() => onAccept(offer)}
              disabled={isAccepting}
              style={({ pressed }) => [
                styles.acceptBtn,
                pressed && { opacity: 0.85, transform: [{ scale: 0.98 }] },
              ]}
            >
              {isAccepting ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <IconSymbol name="checkmark.circle.fill" size={18} color="#FFFFFF" />
                  <Text style={styles.acceptBtnText}>ACCEPT</Text>
                </>
              )}
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.65)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  card: {
    width: "100%",
    maxWidth: 390,
    borderRadius: 24,
    borderWidth: 1.5,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.35,
    shadowRadius: 20,
    elevation: 12,
  },
  headerBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 16,
  },
  beaconIconWrapper: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#D93025",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#D93025",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 4,
  },
  kicker: {
    fontSize: 14,
    fontWeight: "900",
    color: "#D93025",
    letterSpacing: 0.5,
  },
  subKicker: {
    fontSize: 11.5,
    fontWeight: "600",
    marginTop: 2,
  },
  errorBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "rgba(217, 48, 37, 0.12)",
    padding: 10,
    borderRadius: 12,
    marginBottom: 12,
  },
  errorText: {
    flex: 1,
    fontSize: 11,
    fontWeight: "700",
    color: "#D93025",
  },
  detailsContainer: {
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 12,
  },
  metricRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 6,
  },
  metricLabelCol: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  metricLabel: {
    fontSize: 12,
    fontWeight: "600",
  },
  metricValue: {
    fontSize: 13,
    fontWeight: "700",
    maxWidth: 160,
    textAlign: "right",
  },
  metricValueLarge: {
    fontSize: 18,
    fontWeight: "900",
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: "rgba(150, 150, 150, 0.2)",
    marginVertical: 4,
  },
  privacyPill: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 8,
    marginBottom: 16,
  },
  privacyText: {
    fontSize: 10.5,
    fontWeight: "600",
    color: "#188038",
    textAlign: "center",
  },
  actionsRow: {
    flexDirection: "row",
    gap: 12,
  },
  declineBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },
  declineBtnText: {
    fontSize: 13,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  acceptBtn: {
    flex: 1.4,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: "#188038",
    shadowColor: "#188038",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 4,
  },
  acceptBtnText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "900",
    letterSpacing: 0.6,
  },
});
