import React from "react";
import {
  StyleSheet,
  View,
  Text,
  Pressable,
  Linking,
} from "react-native";
import { useColors } from "@/hooks/use-colors";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { VerifiedShelter } from "@/lib/navigation-data";

interface ShelterDirectoryPanelProps {
  shelters: VerifiedShelter[];
  selectedShelter: VerifiedShelter | null;
  onSelectShelter: (shelter: VerifiedShelter) => void;
  onCheckinSafePing: (shelter: VerifiedShelter) => void;
}

export const ShelterDirectoryPanel: React.FC<ShelterDirectoryPanelProps> = ({
  shelters,
  selectedShelter,
  onSelectShelter,
  onCheckinSafePing,
}) => {
  const colors = useColors();

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.surface,
          borderColor: colors.border,
        },
      ]}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={[styles.headerDot, { backgroundColor: colors.success }]} />
          <Text style={[styles.kicker, { color: colors.muted }]}>
            VERIFIED HIGH-GROUND SHELTER DIRECTORY
          </Text>
        </View>
        <Text style={[styles.title, { color: colors.foreground }]}>
          NDMA Authorized Safe Havens
        </Text>
        <Text style={[styles.sub, { color: colors.muted }]}>
          Select a shelter to instantly plot elevated ridge evacuation routes
        </Text>
      </View>

      {/* Shelters List */}
      <View style={styles.shelterList}>
        {shelters.map((shelter) => {
          const isSelected = selectedShelter?.id === shelter.id;
          const occupancyPercent = Math.round(
            (shelter.occupiedCapacity / shelter.totalCapacity) * 100
          );
          const isFull = shelter.status === "FULL" || occupancyPercent >= 95;
          const isCrowded = occupancyPercent >= 80 && !isFull;

          const statusColor = isFull
            ? colors.error
            : isCrowded
            ? colors.warning
            : colors.success;

          return (
            <Pressable
              key={shelter.id}
              style={[
                styles.shelterCard,
                {
                  backgroundColor: colors.background,
                  borderColor: isSelected ? colors.success : colors.border,
                },
                isSelected && {
                  borderColor: colors.success,
                  borderWidth: 1.5,
                  shadowColor: colors.success,
                  shadowOpacity: 0.18,
                  shadowRadius: 8,
                  elevation: 3,
                },
              ]}
              onPress={() => onSelectShelter(shelter)}
            >
              {/* Card Top Row: Type & High-Ground Badge */}
              <View style={styles.cardTopRow}>
                <View
                  style={[
                    styles.typeBadge,
                    { backgroundColor: colors.primary + "18" },
                  ]}
                >
                  <Text style={[styles.typeText, { color: colors.primary }]}>
                    {shelter.type}
                  </Text>
                </View>

                <View
                  style={[
                    styles.elevBadge,
                    { backgroundColor: colors.success + "20", borderColor: colors.success + "40" },
                  ]}
                >
                  <IconSymbol name="shield.lefthalf.filled" size={11} color={colors.success} />
                  <Text style={[styles.elevText, { color: colors.success }]}>
                    +{shelter.elevationMeters}m MSL
                  </Text>
                </View>
              </View>

              {/* Shelter Name & Address */}
              <Text style={[styles.shelterName, { color: colors.foreground }]}>
                {shelter.name}
              </Text>
              <Text style={[styles.shelterAddress, { color: colors.muted }]}>
                {shelter.address} • {shelter.distanceKm} km away
              </Text>

              {/* Capacity Meter Bar */}
              <View style={styles.capacitySection}>
                <View style={styles.capacityHeader}>
                  <Text style={[styles.capacityLabel, { color: colors.muted }]}>
                    Live Occupancy Capacity:
                  </Text>
                  <Text style={[styles.capacityRatio, { color: statusColor }]}>
                    {shelter.occupiedCapacity} / {shelter.totalCapacity} ({occupancyPercent}%)
                  </Text>
                </View>

                <View style={[styles.progressBarBg, { backgroundColor: colors.border }]}>
                  <View
                    style={[
                      styles.progressBarFill,
                      {
                        width: `${Math.min(100, occupancyPercent)}%`,
                        backgroundColor: statusColor,
                      },
                    ]}
                  />
                </View>
              </View>

              {/* Amenities Grid */}
              <View style={styles.amenitiesRow}>
                {shelter.amenities.drinkingWater && (
                  <View
                    style={[
                      styles.amenityPill,
                      { backgroundColor: colors.surface, borderColor: colors.border },
                    ]}
                  >
                    <IconSymbol name="drop.fill" size={11} color={colors.primary} />
                    <Text style={[styles.amenityText, { color: colors.foreground }]}>Water</Text>
                  </View>
                )}
                {shelter.amenities.medicalStation && (
                  <View
                    style={[
                      styles.amenityPill,
                      { backgroundColor: colors.surface, borderColor: colors.border },
                    ]}
                  >
                    <IconSymbol name="plus.circle.fill" size={11} color={colors.error} />
                    <Text style={[styles.amenityText, { color: colors.foreground }]}>Medical</Text>
                  </View>
                )}
                {shelter.amenities.powerBackup && (
                  <View
                    style={[
                      styles.amenityPill,
                      { backgroundColor: colors.surface, borderColor: colors.border },
                    ]}
                  >
                    <IconSymbol name="lightbulb.fill" size={11} color={colors.warning} />
                    <Text style={[styles.amenityText, { color: colors.foreground }]}>Power</Text>
                  </View>
                )}
                {shelter.amenities.foodSupply && (
                  <View
                    style={[
                      styles.amenityPill,
                      { backgroundColor: colors.surface, borderColor: colors.border },
                    ]}
                  >
                    <IconSymbol name="checkmark.circle.fill" size={11} color={colors.success} />
                    <Text style={[styles.amenityText, { color: colors.foreground }]}>Rations</Text>
                  </View>
                )}
              </View>

              {/* Bottom Actions Row */}
              <View style={[styles.cardActions, { borderTopColor: colors.border }]}>
                <Pressable
                  style={[
                    styles.callBtn,
                    { backgroundColor: colors.surface, borderColor: colors.border },
                  ]}
                  onPress={() => Linking.openURL(`tel:${shelter.contactNumber.replace(/[^0-9+]/g, "")}`)}
                >
                  <IconSymbol name="phone.fill" size={12} color={colors.foreground} />
                  <Text style={[styles.callBtnText, { color: colors.foreground }]}>
                    {shelter.contactPerson.split(" ")[0]}
                  </Text>
                </Pressable>

                <Pressable
                  style={[
                    styles.routeSelectBtn,
                    {
                      backgroundColor: isSelected ? colors.success : colors.primary,
                    },
                  ]}
                  onPress={() => onSelectShelter(shelter)}
                >
                  <IconSymbol
                    name="arrow.triangle.turn.up.right.diamond.fill"
                    size={12}
                    color="#FFFFFF"
                  />
                  <Text style={styles.routeSelectText}>
                    {isSelected ? "Route Active" : "Plot Evacuation"}
                  </Text>
                </Pressable>

                <Pressable
                  style={[
                    styles.checkinBtn,
                    { backgroundColor: colors.surface, borderColor: colors.border },
                  ]}
                  onPress={() => onCheckinSafePing(shelter)}
                >
                  <IconSymbol name="paperplane.fill" size={12} color={colors.primary} />
                  <Text style={[styles.checkinBtnText, { color: colors.primary }]}>
                    Safe Ping
                  </Text>
                </Pressable>
              </View>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 16,
    marginBottom: 16,
  },
  header: {
    marginBottom: 12,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 2,
  },
  headerDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  kicker: {
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 0.8,
  },
  title: {
    fontSize: 17,
    fontWeight: "900",
    marginTop: 2,
  },
  sub: {
    fontSize: 11,
    marginTop: 2,
  },
  shelterList: {
    gap: 12,
  },
  shelterCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 13,
  },
  cardTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  typeBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2.5,
    borderRadius: 6,
  },
  typeText: {
    fontSize: 8.5,
    fontWeight: "800",
  },
  elevBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3.5,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 5,
    borderWidth: 1,
  },
  elevText: {
    fontSize: 8.5,
    fontWeight: "900",
  },
  shelterName: {
    fontSize: 14,
    fontWeight: "900",
  },
  shelterAddress: {
    fontSize: 10.5,
    marginTop: 2,
    marginBottom: 8,
  },
  capacitySection: {
    marginBottom: 8,
  },
  capacityHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  capacityLabel: {
    fontSize: 9.5,
    fontWeight: "600",
  },
  capacityRatio: {
    fontSize: 9.5,
    fontWeight: "800",
  },
  progressBarBg: {
    height: 6,
    borderRadius: 3,
    overflow: "hidden",
  },
  progressBarFill: {
    height: "100%",
    borderRadius: 3,
  },
  amenitiesRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginBottom: 10,
  },
  amenityPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
  },
  amenityText: {
    fontSize: 9,
    fontWeight: "700",
  },
  cardActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingTop: 10,
    borderTopWidth: 1,
  },
  callBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  callBtnText: {
    fontSize: 10,
    fontWeight: "700",
  },
  routeSelectBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  routeSelectText: {
    fontSize: 11,
    fontWeight: "900",
    color: "#FFFFFF",
  },
  checkinBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  checkinBtnText: {
    fontSize: 10,
    fontWeight: "800",
  },
});
