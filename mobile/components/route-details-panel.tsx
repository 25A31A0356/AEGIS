import React, { useState } from "react";
import {
  StyleSheet,
  View,
  Text,
  Pressable,
} from "react-native";
import Svg, { Rect, Line, Text as SvgText } from "react-native-svg";
import { useColors } from "@/hooks/use-colors";
import { IconSymbol } from "@/components/ui/icon-symbol";
import {
  AlpineScenicBanner,
  SkyScenicBanner,
  SunsetScenicBanner,
} from "@/components/scenic-illustrations";
import {
  EvacuationRouteOption,
} from "@/lib/navigation-data";

interface RouteDetailsPanelProps {
  routes: EvacuationRouteOption[];
  selectedRouteIndex: number;
  onSelectRouteIndex: (index: number) => void;
  onRecalculate: () => void;
  isRecalculating: boolean;
  isNavigating: boolean;
  onToggleNavigation: (active: boolean) => void;
  activeStepIndex: number;
  onSelectStepIndex: (index: number) => void;
  onArrivedSafePing: () => void;
}

export const RouteDetailsPanel: React.FC<RouteDetailsPanelProps> = ({
  routes,
  selectedRouteIndex,
  onSelectRouteIndex,
  onRecalculate,
  isRecalculating,
  isNavigating,
  onToggleNavigation,
  activeStepIndex,
  onSelectStepIndex,
  onArrivedSafePing,
}) => {
  const colors = useColors();
  const [completedSteps, setCompletedSteps] = useState<Record<string, boolean>>({});

  const selectedRoute = routes[selectedRouteIndex] || routes[0];
  const currentStep = selectedRoute?.turnSteps[activeStepIndex] || selectedRoute?.turnSteps[0];

  const toggleStepCompleted = (stepId: string) => {
    setCompletedSteps((prev) => ({
      ...prev,
      [stepId]: !prev[stepId],
    }));
  };

  const getScenicBanner = (index: number) => {
    switch (index % 3) {
      case 0:
        return <AlpineScenicBanner height={95} />;
      case 1:
        return <SkyScenicBanner height={95} />;
      case 2:
      default:
        return <SunsetScenicBanner height={95} />;
    }
  };

  return (
    <View style={styles.container}>
      {/* Navigation Mode HUD Banner (When Navigation Active) */}
      {isNavigating && currentStep && (
        <View
          style={[
            styles.navHudCard,
            {
              backgroundColor: colors.surface,
              borderColor: colors.success,
              shadowColor: colors.success,
            },
          ]}
        >
          {/* Top Telemetry strip */}
          <View style={[styles.navTelemetry, { borderBottomColor: colors.border }]}>
            <View style={styles.telemetryItem}>
              <Text style={[styles.telemetryLabel, { color: colors.muted }]}>BEARING</Text>
              <Text style={[styles.telemetryValue, { color: colors.foreground }]}>042° NE</Text>
            </View>
            <View style={styles.telemetryDivider} />
            <View style={styles.telemetryItem}>
              <Text style={[styles.telemetryLabel, { color: colors.muted }]}>DISTANCE</Text>
              <Text style={[styles.telemetryValue, { color: colors.success }]}>
                {selectedRoute.distanceKm} km
              </Text>
            </View>
            <View style={styles.telemetryDivider} />
            <View style={styles.telemetryItem}>
              <Text style={[styles.telemetryLabel, { color: colors.muted }]}>ETA</Text>
              <Text style={[styles.telemetryValue, { color: colors.foreground }]}>
                {selectedRoute.estimatedTimeMinutes} min
              </Text>
            </View>
            <View style={styles.telemetryDivider} />
            <View style={styles.telemetryItem}>
              <Text style={[styles.telemetryLabel, { color: colors.muted }]}>HIGH RIDGE</Text>
              <Text style={[styles.telemetryValue, { color: colors.primary }]}>
                +{selectedRoute.elevationPeakM}m MSL
              </Text>
            </View>
          </View>

          {/* Current Turn Direction Prompt */}
          <View style={styles.navTurnBanner}>
            <View style={[styles.turnIconBox, { backgroundColor: colors.success + "20" }]}>
              <IconSymbol
                name="arrow.triangle.turn.up.right.diamond.fill"
                size={28}
                color={colors.success}
              />
            </View>
            <View style={{ flex: 1 }}>
              <View style={styles.stepKickerRow}>
                <Text style={[styles.stepKicker, { color: colors.success }]}>
                  STEP {activeStepIndex + 1} OF {selectedRoute.turnSteps.length} • NEXT MANEUVER
                </Text>
                <Text style={[styles.stepDistTag, { color: colors.muted }]}>
                  {currentStep.distanceMeters}m
                </Text>
              </View>
              <Text style={[styles.turnInstruction, { color: colors.foreground }]}>
                {currentStep.instruction}
              </Text>
              {currentStep.hazardNote && (
                <View style={styles.hazardTip}>
                  <IconSymbol name="shield.lefthalf.filled" size={12} color={colors.primary} />
                  <Text style={[styles.hazardTipText, { color: colors.primary }]}>
                    {currentStep.hazardNote}
                  </Text>
                </View>
              )}
            </View>
          </View>

          {/* Navigation Controls */}
          <View style={styles.navActionsRow}>
            <Pressable
              style={[
                styles.navStepNavBtn,
                { backgroundColor: colors.surface, borderColor: colors.border },
                activeStepIndex === 0 && styles.disabledBtn,
              ]}
              disabled={activeStepIndex === 0}
              onPress={() => onSelectStepIndex(Math.max(0, activeStepIndex - 1))}
            >
              <IconSymbol name="chevron.right" size={14} color={colors.foreground} style={{ transform: [{ rotate: "180deg" }] }} />
              <Text style={[styles.navStepNavText, { color: colors.foreground }]}>Prev Step</Text>
            </Pressable>

            {activeStepIndex < selectedRoute.turnSteps.length - 1 ? (
              <Pressable
                style={[styles.navStepNavBtnPrimary, { backgroundColor: colors.success }]}
                onPress={() => onSelectStepIndex(activeStepIndex + 1)}
              >
                <Text style={styles.navStepNavTextPrimary}>Next Step</Text>
                <IconSymbol name="chevron.right" size={14} color="#FFFFFF" />
              </Pressable>
            ) : (
              <Pressable
                style={[styles.arrivedBtn, { backgroundColor: colors.primary }]}
                onPress={onArrivedSafePing}
              >
                <IconSymbol name="checkmark.circle.fill" size={16} color="#FFFFFF" />
                <Text style={styles.arrivedBtnText}>Arrived • Send Safe Ping</Text>
              </Pressable>
            )}

            <Pressable
              style={[styles.exitNavBtn, { borderColor: colors.border }]}
              onPress={() => onToggleNavigation(false)}
            >
              <IconSymbol name="xmark" size={14} color={colors.muted} />
              <Text style={[styles.exitNavText, { color: colors.muted }]}>Exit HUD</Text>
            </Pressable>
          </View>
        </View>
      )}

      {/* Header with Title and Recalculate Button */}
      <View style={styles.sectionHeader}>
        <View>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
            Topological Route Tickets
          </Text>
          <Text style={[styles.sectionSub, { color: colors.muted }]}>
            Verified high-ground paths avoiding submerged underpasses
          </Text>
        </View>

        <View style={styles.headerRightButtons}>
          <Pressable
            style={[
              styles.startNavBtn,
              isNavigating
                ? { backgroundColor: colors.error + "20", borderColor: colors.error }
                : { backgroundColor: colors.success },
            ]}
            onPress={() => onToggleNavigation(!isNavigating)}
          >
            <IconSymbol
              name={isNavigating ? "xmark" : "arrow.triangle.turn.up.right.diamond.fill"}
              size={14}
              color={isNavigating ? colors.error : "#FFFFFF"}
            />
            <Text
              style={[
                styles.startNavText,
                { color: isNavigating ? colors.error : "#FFFFFF" },
              ]}
            >
              {isNavigating ? "Close HUD" : "Start Live HUD"}
            </Text>
          </Pressable>

          <Pressable
            style={[
              styles.recalculateBtn,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
            onPress={onRecalculate}
            disabled={isRecalculating}
          >
            <IconSymbol name="clock.arrow.circlepath" size={14} color={colors.primary} />
          </Pressable>
        </View>
      </View>

      {/* Route Ticket Cards List */}
      <View style={styles.routeCardsContainer}>
        {routes.map((route, index) => {
          const isSelected = index === selectedRouteIndex;
          const toneColor =
            route.statusTone === "green"
              ? colors.success
              : route.statusTone === "blue"
              ? colors.primary
              : colors.warning;

          return (
            <Pressable
              key={route.id}
              style={[
                styles.ticketCard,
                {
                  backgroundColor: colors.surface,
                  borderColor: isSelected ? toneColor : colors.border,
                },
                isSelected && {
                  shadowColor: toneColor,
                  shadowOpacity: 0.25,
                  shadowRadius: 10,
                  elevation: 4,
                },
              ]}
              onPress={() => onSelectRouteIndex(index)}
            >
              {/* Scenic Banner Art */}
              <View style={styles.bannerWrapper}>{getScenicBanner(index)}</View>

              {/* Ticket Notch & Content */}
              <View style={styles.ticketBody}>
                {/* Sector Codes Header */}
                <View style={styles.ticketHeaderRow}>
                  <View style={styles.sectorCodes}>
                    <View
                      style={[
                        styles.codeBadge,
                        { backgroundColor: "rgba(15, 23, 42, 0.7)" },
                      ]}
                    >
                      <Text style={[styles.codeText, { color: colors.foreground }]}>
                        {route.sectorCode}
                      </Text>
                    </View>
                    <IconSymbol name="chevron.right" size={12} color={colors.muted} />
                    <View
                      style={[
                        styles.codeBadge,
                        { backgroundColor: "rgba(15, 23, 42, 0.7)" },
                      ]}
                    >
                      <Text style={[styles.codeText, { color: toneColor }]}>
                        {route.shelterCode}
                      </Text>
                    </View>
                  </View>

                  <View
                    style={[
                      styles.tagBadge,
                      { backgroundColor: toneColor + "20", borderColor: toneColor + "40" },
                    ]}
                  >
                    <Text style={[styles.tagText, { color: toneColor }]}>{route.tag}</Text>
                  </View>
                </View>

                {/* Route Title & Mode */}
                <Text style={[styles.routeName, { color: colors.foreground }]}>
                  {route.name}
                </Text>

                {/* Metrics Pill Grid */}
                <View style={styles.metricsGrid}>
                  <View
                    style={[
                      styles.metricPill,
                      { backgroundColor: colors.background, borderColor: colors.border },
                    ]}
                  >
                    <IconSymbol name="location.fill" size={12} color={colors.muted} />
                    <Text style={[styles.metricValue, { color: colors.foreground }]}>
                      {route.distanceKm} km
                    </Text>
                  </View>

                  <View
                    style={[
                      styles.metricPill,
                      { backgroundColor: colors.background, borderColor: colors.border },
                    ]}
                  >
                    <IconSymbol name="bell.fill" size={12} color={colors.muted} />
                    <Text style={[styles.metricValue, { color: colors.foreground }]}>
                      {route.estimatedTimeMinutes} min
                    </Text>
                  </View>

                  <View
                    style={[
                      styles.metricPill,
                      { backgroundColor: colors.background, borderColor: colors.border },
                    ]}
                  >
                    <IconSymbol name="shield.lefthalf.filled" size={12} color={colors.success} />
                    <Text style={[styles.metricValue, { color: colors.success }]}>
                      ▲ +{route.elevationPeakM}m MSL
                    </Text>
                  </View>
                </View>

                {/* Hazards Avoided Highlights */}
                <View style={styles.hazardsBox}>
                  {route.hazardsAvoided.map((hazard, hIdx) => (
                    <View key={hIdx} style={styles.hazardRow}>
                      <IconSymbol name="checkmark.circle.fill" size={11} color={colors.success} />
                      <Text style={[styles.hazardText, { color: colors.muted }]}>
                        {hazard}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            </Pressable>
          );
        })}
      </View>

      {/* Elevation Profile Comparison Card */}
      {selectedRoute && (
        <View
          style={[
            styles.elevationCard,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
        >
          <View style={styles.elevationHeader}>
            <View style={styles.elevationTitleRow}>
              <IconSymbol name="chart.bar.fill" size={16} color={colors.primary} />
              <Text style={[styles.elevationTitle, { color: colors.foreground }]}>
                Topological Elevation vs Flood Water Level
              </Text>
            </View>
            <Text style={[styles.elevationPeakBadge, { color: colors.success }]}>
              Safe Delta: +{selectedRoute.elevationDeltaM}m Above Datum
            </Text>
          </View>

          {/* SVG Elevation Chart */}
          <View style={styles.elevationSvgWrapper}>
            <Svg viewBox="0 0 340 70" width="100%" height={70}>
              {/* Flood Water Level Datum line */}
              <Line
                x1="20"
                y1="52"
                x2="320"
                y2="52"
                stroke="#0284C7"
                strokeWidth={1.5}
                strokeDasharray="4,3"
              />
              <SvgText x="25" y="48" fill="#38BDF8" fontSize="7" fontWeight="bold">
                Flood Water Datum (19.4m)
              </SvgText>

              {/* Elevation Step Bars */}
              {selectedRoute.elevationProfile.map((point, pIdx) => {
                const stepX = 40 + pIdx * 65;
                const barHeight = Math.max(10, (point.elevationM / 65) * 45);
                const barY = 60 - barHeight;

                return (
                  <React.Fragment key={pIdx}>
                    {/* Ridge Elevation Bar */}
                    <Rect
                      x={stepX - 12}
                      y={barY}
                      width={24}
                      height={barHeight}
                      rx={3}
                      fill={pIdx === activeStepIndex ? "#10B981" : "#334155"}
                      opacity={0.85}
                    />
                    <SvgText
                      x={stepX}
                      y={barY - 3}
                      fill={pIdx === activeStepIndex ? "#34D399" : "#94A3B8"}
                      fontSize="7.5"
                      fontWeight="bold"
                      textAnchor="middle"
                    >
                      {point.elevationM}m
                    </SvgText>
                    <SvgText
                      x={stepX}
                      y="68"
                      fill="#64748B"
                      fontSize="6.5"
                      textAnchor="middle"
                    >
                      {point.distanceKm}km
                    </SvgText>
                  </React.Fragment>
                );
              })}
            </Svg>
          </View>
        </View>
      )}

      {/* Step-by-Step Waypoint Timeline Checklist */}
      {selectedRoute && (
        <View
          style={[
            styles.stepsCard,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
        >
          <View style={styles.stepsHeader}>
            <Text style={[styles.stepsTitle, { color: colors.foreground }]}>
              Turn-by-Turn Waypoints ({selectedRoute.turnSteps.length} Steps)
            </Text>
            <Text style={[styles.stepsSub, { color: colors.muted }]}>
              Tap to preview node on tactical map
            </Text>
          </View>

          <View style={styles.stepsList}>
            {selectedRoute.turnSteps.map((step, sIdx) => {
              const isActive = sIdx === activeStepIndex;
              const isDone = !!completedSteps[step.id];

              return (
                <Pressable
                  key={step.id}
                  style={[
                    styles.stepRow,
                    { borderBottomColor: colors.border },
                    isActive && {
                      backgroundColor: colors.success + "12",
                      borderColor: colors.success + "40",
                    },
                  ]}
                  onPress={() => onSelectStepIndex(sIdx)}
                >
                  {/* Step Completion Checkbox */}
                  <Pressable
                    style={styles.stepCheckbox}
                    onPress={() => toggleStepCompleted(step.id)}
                  >
                    <IconSymbol
                      name={isDone ? "checkmark.circle.fill" : "plus.circle.fill"}
                      size={20}
                      color={isDone ? colors.success : colors.muted}
                    />
                  </Pressable>

                  {/* Step Index Circle */}
                  <View
                    style={[
                      styles.stepNumBadge,
                      {
                        backgroundColor: isActive
                          ? colors.success
                          : isDone
                          ? colors.success + "30"
                          : colors.background,
                        borderColor: isActive ? colors.success : colors.border,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.stepNumText,
                        { color: isActive ? "#FFFFFF" : colors.foreground },
                      ]}
                    >
                      {sIdx + 1}
                    </Text>
                  </View>

                  {/* Step Instruction */}
                  <View style={{ flex: 1 }}>
                    <Text
                      style={[
                        styles.stepInstruction,
                        { color: colors.foreground },
                        isDone && styles.strikeText,
                      ]}
                    >
                      {step.instruction}
                    </Text>
                    <View style={styles.stepSubRow}>
                      <Text style={[styles.stepDistText, { color: colors.muted }]}>
                        {step.distanceMeters}m
                      </Text>
                      <Text style={[styles.stepElevText, { color: colors.success }]}>
                        ▲ {step.elevationGainM}m
                      </Text>
                      {step.hazardNote && (
                        <Text
                          numberOfLines={1}
                          style={[styles.stepHazardText, { color: colors.primary }]}
                        >
                          • {step.hazardNote}
                        </Text>
                      )}
                    </View>
                  </View>
                </Pressable>
              );
            })}
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
    gap: 16,
  },
  navHudCard: {
    borderWidth: 2,
    borderRadius: 20,
    padding: 14,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 4,
  },
  navTelemetry: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingBottom: 10,
    borderBottomWidth: 1,
  },
  telemetryItem: {
    alignItems: "center",
  },
  telemetryLabel: {
    fontSize: 8,
    fontWeight: "900",
    letterSpacing: 0.7,
  },
  telemetryValue: {
    fontSize: 12,
    fontWeight: "900",
    marginTop: 2,
  },
  telemetryDivider: {
    width: 1,
    height: 20,
    backgroundColor: "rgba(100, 116, 139, 0.3)",
  },
  navTurnBanner: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    paddingVertical: 12,
  },
  turnIconBox: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  stepKickerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  stepKicker: {
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 0.8,
  },
  stepDistTag: {
    fontSize: 11,
    fontWeight: "800",
  },
  turnInstruction: {
    fontSize: 14,
    fontWeight: "900",
    lineHeight: 20,
    marginTop: 3,
  },
  hazardTip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginTop: 5,
  },
  hazardTipText: {
    fontSize: 10,
    fontWeight: "700",
  },
  navActionsRow: {
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
    marginTop: 4,
  },
  navStepNavBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
  },
  navStepNavText: {
    fontSize: 11,
    fontWeight: "800",
  },
  navStepNavBtnPrimary: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 10,
  },
  navStepNavTextPrimary: {
    fontSize: 12,
    fontWeight: "900",
    color: "#FFFFFF",
  },
  arrivedBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 10,
  },
  arrivedBtnText: {
    fontSize: 12,
    fontWeight: "900",
    color: "#FFFFFF",
  },
  exitNavBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
  },
  exitNavText: {
    fontSize: 10,
    fontWeight: "700",
  },
  disabledBtn: {
    opacity: 0.4,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "900",
  },
  sectionSub: {
    fontSize: 11,
    marginTop: 2,
  },
  headerRightButtons: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  startNavBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "transparent",
  },
  startNavText: {
    fontSize: 11,
    fontWeight: "900",
  },
  recalculateBtn: {
    width: 32,
    height: 32,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  routeCardsContainer: {
    gap: 12,
  },
  ticketCard: {
    borderRadius: 18,
    borderWidth: 1.5,
    overflow: "hidden",
  },
  bannerWrapper: {
    width: "100%",
    height: 95,
  },
  ticketBody: {
    padding: 14,
  },
  ticketHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  sectorCodes: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  codeBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 5,
  },
  codeText: {
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
  tagBadge: {
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
  },
  tagText: {
    fontSize: 8.5,
    fontWeight: "900",
    letterSpacing: 0.6,
  },
  routeName: {
    fontSize: 16,
    fontWeight: "900",
    marginBottom: 8,
  },
  metricsGrid: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 10,
  },
  metricPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
  },
  metricValue: {
    fontSize: 11,
    fontWeight: "800",
  },
  hazardsBox: {
    gap: 4,
    marginTop: 4,
  },
  hazardRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  hazardText: {
    fontSize: 10.5,
    fontWeight: "600",
    flex: 1,
  },
  elevationCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
  },
  elevationHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  elevationTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  elevationTitle: {
    fontSize: 12,
    fontWeight: "900",
  },
  elevationPeakBadge: {
    fontSize: 10,
    fontWeight: "800",
  },
  elevationSvgWrapper: {
    width: "100%",
  },
  stepsCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
  },
  stepsHeader: {
    marginBottom: 10,
  },
  stepsTitle: {
    fontSize: 14,
    fontWeight: "900",
  },
  stepsSub: {
    fontSize: 10,
    marginTop: 2,
  },
  stepsList: {
    gap: 4,
  },
  stepRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 10,
    borderBottomWidth: 1,
  },
  stepCheckbox: {
    padding: 2,
  },
  stepNumBadge: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  stepNumText: {
    fontSize: 10,
    fontWeight: "900",
  },
  stepInstruction: {
    fontSize: 12,
    fontWeight: "800",
    lineHeight: 17,
  },
  stepSubRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 3,
  },
  stepDistText: {
    fontSize: 10,
    fontWeight: "600",
  },
  stepElevText: {
    fontSize: 10,
    fontWeight: "800",
  },
  stepHazardText: {
    fontSize: 10,
    fontWeight: "600",
    flex: 1,
  },
  strikeText: {
    textDecorationLine: "line-through",
    opacity: 0.55,
  },
});
