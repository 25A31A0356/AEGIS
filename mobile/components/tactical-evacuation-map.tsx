import React, { useState } from "react";
import {
  StyleSheet,
  View,
  Text,
  Pressable,
  Platform,
} from "react-native";
import Svg, {
  Defs,
  LinearGradient,
  Stop,
  Rect,
  Circle,
  Path,
  G,
  Text as SvgText,
} from "react-native-svg";
import { useColors } from "@/hooks/use-colors";
import { IconSymbol } from "@/components/ui/icon-symbol";
import {
  GeoPoint,
  VerifiedShelter,
  EvacuationRouteOption,
} from "@/lib/navigation-data";

interface TacticalEvacuationMapProps {
  userLocation: GeoPoint;
  shelters: VerifiedShelter[];
  selectedShelter: VerifiedShelter | null;
  onSelectShelter: (shelter: VerifiedShelter) => void;
  routes: EvacuationRouteOption[];
  selectedRouteIndex: number;
  onSelectRouteIndex: (index: number) => void;
  isRecalculating?: boolean;
  activeStepIndex?: number;
}

export const TacticalEvacuationMap: React.FC<TacticalEvacuationMapProps> = ({
  userLocation,
  shelters,
  selectedShelter,
  onSelectShelter,
  routes,
  selectedRouteIndex,
  onSelectRouteIndex,
  isRecalculating = false,
  activeStepIndex = 0,
}) => {
  const colors = useColors();

  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [showInundation, setShowInundation] = useState<boolean>(true);
  const [showContours, setShowContours] = useState<boolean>(true);
  const [showWaypoints, setShowWaypoints] = useState<boolean>(true);

  // SVG coordinate transformation box: [minLat: 17.67, maxLat: 17.74], [minLng: 83.20, maxLng: 83.28]
  const minLat = 17.675;
  const maxLat = 17.745;
  const minLng = 83.205;
  const maxLng = 83.275;

  const mapWidth = 560;
  const mapHeight = 340;

  const toSvgX = (lng: number) => {
    const norm = (lng - minLng) / (maxLng - minLng);
    const center = mapWidth / 2;
    return center + (norm * mapWidth - center) * zoomLevel;
  };

  const toSvgY = (lat: number) => {
    // Invert lat because higher lat is up (lower Y in SVG)
    const norm = (lat - minLat) / (maxLat - minLat);
    const center = mapHeight / 2;
    return center + ((1 - norm) * mapHeight - center) * zoomLevel;
  };

  const userSvgX = toSvgX(userLocation.lng);
  const userSvgY = toSvgY(userLocation.lat);

  const selectedRoute = routes[selectedRouteIndex] || routes[0];

  return (
    <View
      style={[
        styles.mapCard,
        {
          backgroundColor: colors.surface,
          borderColor: colors.border,
        },
      ]}
    >
      {/* Top HUD Telemetry Bar */}
      <View style={[styles.hudHeader, { borderBottomColor: colors.border }]}>
        <View style={styles.hudLeft}>
          <View style={[styles.livePulseDot, { backgroundColor: colors.success }]} />
          <View>
            <Text style={[styles.hudTitle, { color: colors.foreground }]}>
              TACTICAL VECTOR EVACUATION MAP
            </Text>
            <Text style={[styles.hudSub, { color: colors.muted }]}>
              Topological Ridge Guidance • CWC Inundation Layer v2.4
            </Text>
          </View>
        </View>

        {isRecalculating ? (
          <View style={[styles.recalcBadge, { backgroundColor: colors.warning + "25" }]}>
            <Text style={[styles.recalcText, { color: colors.warning }]}>
              RECALCULATING AROUND WATER...
            </Text>
          </View>
        ) : (
          <View style={[styles.statusPill, { backgroundColor: colors.success + "20" }]}>
            <Text style={[styles.statusText, { color: colors.success }]}>
              {selectedRoute ? selectedRoute.safetyStatus.toUpperCase() : "SECURE CORRIDOR"}
            </Text>
          </View>
        )}
      </View>

      {/* SVG Canvas Map */}
      <View style={styles.canvasContainer}>
        <Svg
          viewBox={`0 0 ${mapWidth} ${mapHeight}`}
          width="100%"
          height={mapHeight}
          style={styles.svg}
        >
          <Defs>
            {/* Background Grid Pattern / Dark Grid */}
            <LinearGradient id="mapBg" x1="0%" y1="0%" x2="0%" y2="100%">
              <Stop offset="0%" stopColor="#0B1321" />
              <Stop offset="50%" stopColor="#0F1B2F" />
              <Stop offset="100%" stopColor="#080E18" />
            </LinearGradient>

            {/* Inundation Water Gradient */}
            <LinearGradient id="floodGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <Stop offset="0%" stopColor="#0284C7" stopOpacity={0.55} />
              <Stop offset="100%" stopColor="#0369A1" stopOpacity={0.8} />
            </LinearGradient>

            {/* Active Ridge Route Glow */}
            <LinearGradient id="routeGlow" x1="0%" y1="0%" x2="100%" y2="100%">
              <Stop offset="0%" stopColor="#10B981" />
              <Stop offset="50%" stopColor="#34D399" />
              <Stop offset="100%" stopColor="#059669" />
            </LinearGradient>

            {/* Blue Bypass Route */}
            <LinearGradient id="bypassRoute" x1="0%" y1="0%" x2="100%" y2="100%">
              <Stop offset="0%" stopColor="#3B82F6" />
              <Stop offset="100%" stopColor="#1D4ED8" />
            </LinearGradient>
          </Defs>

          {/* Map Baseplate */}
          <Rect width={mapWidth} height={mapHeight} fill="url(#mapBg)" rx={12} />

          {/* Grid lines */}
          <G stroke="#1E293B" strokeWidth={0.8} strokeDasharray="3,6" opacity={0.6}>
            <Path d="M 0,85 L 560,85 M 0,170 L 560,170 M 0,255 L 560,255" />
            <Path d="M 140,0 L 140,340 M 280,0 L 280,340 M 420,0 L 420,340" />
          </G>

          {/* Topographic High Ridge Contours Layer */}
          {showContours && (
            <G opacity={0.35}>
              <Path
                d="M 60,300 Q 180,180 320,190 T 520,100"
                fill="none"
                stroke="#10B981"
                strokeWidth={2}
                strokeDasharray="4,4"
              />
              <Path
                d="M 90,320 Q 210,150 360,160 T 550,70"
                fill="none"
                stroke="#34D399"
                strokeWidth={1.5}
              />
              <SvgText
                x={380}
                y={145}
                fill="#34D399"
                fontSize={9}
                fontWeight="bold"
                fontFamily={Platform.OS === "ios" ? "Courier" : "monospace"}
              >
                ▲ +54m HIGH-RIDGE EMBANKMENT
              </SvgText>
            </G>
          )}

          {/* Submerged Inundation Zones Layer */}
          {showInundation && (
            <G>
              {/* Sector 4 Low Basin Danger Zone */}
              <Path
                d={`M ${toSvgX(83.212)},${toSvgY(17.682)} L ${toSvgX(83.215)},${toSvgY(17.689)} L ${toSvgX(83.226)},${toSvgY(17.685)} L ${toSvgX(83.221)},${toSvgY(17.678)} Z`}
                fill="url(#floodGrad)"
                stroke="#38BDF8"
                strokeWidth={1.5}
                strokeDasharray="2,2"
              />
              <Circle
                cx={toSvgX(83.218)}
                cy={toSvgY(17.683)}
                r={14}
                fill="#EF4444"
                opacity={0.25}
              />
              <SvgText
                x={toSvgX(83.218) - 45}
                y={toSvgY(17.683) + 4}
                fill="#F87171"
                fontSize={8}
                fontWeight="900"
              >
                ⛔ SUBMERGED (&gt;1.4m)
              </SvgText>

              {/* Railway Underpass Submersion */}
              <Path
                d={`M ${toSvgX(83.217)},${toSvgY(17.695)} L ${toSvgX(83.219)},${toSvgY(17.699)} L ${toSvgX(83.225)},${toSvgY(17.697)} L ${toSvgX(83.223)},${toSvgY(17.693)} Z`}
                fill="#0284C7"
                opacity={0.5}
                stroke="#0EA5E9"
                strokeWidth={1}
              />
              <SvgText
                x={toSvgX(83.219) - 30}
                y={toSvgY(17.696) - 4}
                fill="#38BDF8"
                fontSize={7}
                fontWeight="bold"
              >
                ⚠️ WATERLOGGED
              </SvgText>
            </G>
          )}

          {/* Alternate Routes (Dashed Lines) */}
          {routes.map((route, idx) => {
            if (idx === selectedRouteIndex) return null;

            return (
              <G key={route.id} opacity={0.4}>
                <Path
                  d={`M ${route.waypoints.map(([lat, lng], i) => `${i === 0 ? "" : "L"} ${toSvgX(lng)} ${toSvgY(lat)}`).join(" ")}`}
                  fill="none"
                  stroke={route.statusTone === "blue" ? "#3B82F6" : "#F59E0B"}
                  strokeWidth={3}
                  strokeDasharray="5,5"
                />
              </G>
            );
          })}

          {/* Active Selected Evacuation Route Path */}
          {selectedRoute && (
            <G>
              {/* Outer Glow Halo */}
              <Path
                d={`M ${selectedRoute.waypoints.map(([lat, lng], i) => `${i === 0 ? "" : "L"} ${toSvgX(lng)} ${toSvgY(lat)}`).join(" ")}`}
                fill="none"
                stroke={selectedRoute.statusTone === "green" ? "#10B981" : "#3B82F6"}
                strokeWidth={8}
                opacity={0.25}
              />

              {/* Main Solid Route Line */}
              <Path
                d={`M ${selectedRoute.waypoints.map(([lat, lng], i) => `${i === 0 ? "" : "L"} ${toSvgX(lng)} ${toSvgY(lat)}`).join(" ")}`}
                fill="none"
                stroke={selectedRoute.statusTone === "green" ? "#34D399" : "#60A5FA"}
                strokeWidth={4}
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              {/* Waypoint Markers */}
              {showWaypoints &&
                selectedRoute.waypoints.map(([lat, lng], i) => {
                  const wx = toSvgX(lng);
                  const wy = toSvgY(lat);
                  const isOrigin = i === 0;
                  const isDestination = i === selectedRoute.waypoints.length - 1;
                  const isCurrentStep = i === activeStepIndex;

                  if (isOrigin || isDestination) return null;

                  return (
                    <G key={`wp-${i}`}>
                      <Circle
                        cx={wx}
                        cy={wy}
                        r={isCurrentStep ? 6 : 4}
                        fill={isCurrentStep ? "#F59E0B" : "#10B981"}
                        stroke="#0F172A"
                        strokeWidth={2}
                      />
                      <SvgText
                        x={wx + 6}
                        y={wy + 3}
                        fill="#E2E8F0"
                        fontSize={8}
                        fontWeight="bold"
                      >
                        Step {i + 1}
                      </SvgText>
                    </G>
                  );
                })}
            </G>
          )}

          {/* Verified High-Ground Shelter Markers */}
          {shelters.map((shelter) => {
            const sx = toSvgX(shelter.coordinates.lng);
            const sy = toSvgY(shelter.coordinates.lat);
            const isSelected = selectedShelter?.id === shelter.id;
            const isFull = shelter.status === "FULL";

            return (
              <G key={shelter.id} onPress={() => onSelectShelter(shelter)}>
                {/* Pulse Ring for Selected Destination */}
                {isSelected && (
                  <Circle
                    cx={sx}
                    cy={sy}
                    r={18}
                    fill="none"
                    stroke="#10B981"
                    strokeWidth={2}
                    opacity={0.7}
                  />
                )}

                {/* Shelter Pin Body */}
                <Circle
                  cx={sx}
                  cy={sy}
                  r={10}
                  fill={isFull ? "#EF4444" : isSelected ? "#10B981" : "#1E293B"}
                  stroke={isSelected ? "#A7F3D0" : "#64748B"}
                  strokeWidth={2.5}
                />

                {/* Shelter Icon / Initial */}
                <SvgText
                  x={sx}
                  y={sy + 3.5}
                  fill="#FFFFFF"
                  fontSize={8}
                  fontWeight="900"
                  textAnchor="middle"
                >
                  ⌂
                </SvgText>

                {/* Altitude & Name Callout Box */}
                <G>
                  <Rect
                    x={sx - 50}
                    y={sy - 28}
                    width={100}
                    height={16}
                    rx={4}
                    fill="#0F172A"
                    stroke={isSelected ? "#10B981" : "#334155"}
                    strokeWidth={1}
                    opacity={0.92}
                  />
                  <SvgText
                    x={sx}
                    y={sy - 17}
                    fill={isSelected ? "#34D399" : "#CBD5E1"}
                    fontSize={7.5}
                    fontWeight="800"
                    textAnchor="middle"
                  >
                    {shelter.name.split(" ")[0]} • +{shelter.elevationMeters}m
                  </SvgText>
                </G>
              </G>
            );
          })}

          {/* User Location Pulse Marker */}
          <G>
            <Circle
              cx={userSvgX}
              cy={userSvgY}
              r={16}
              fill="#EF4444"
              opacity={0.2}
            />
            <Circle
              cx={userSvgX}
              cy={userSvgY}
              r={8}
              fill="#EF4444"
              stroke="#FFFFFF"
              strokeWidth={2}
            />
            <Circle cx={userSvgX} cy={userSvgY} r={3} fill="#FFFFFF" />

            {/* You are here pill */}
            <Rect
              x={userSvgX - 35}
              y={userSvgY + 12}
              width={70}
              height={15}
              rx={4}
              fill="#7F1D1D"
              stroke="#EF4444"
              strokeWidth={1}
            />
            <SvgText
              x={userSvgX}
              y={userSvgY + 22}
              fill="#FECACA"
              fontSize={7.5}
              fontWeight="900"
              textAnchor="middle"
            >
              YOU ARE HERE
            </SvgText>
          </G>
        </Svg>

        {/* Floating Layer Controls Strip */}
        <View style={styles.floatingControls}>
          <Pressable
            style={[
              styles.controlBtn,
              showInundation && { backgroundColor: colors.error + "25", borderColor: colors.error },
            ]}
            onPress={() => setShowInundation(!showInundation)}
          >
            <IconSymbol
              name="drop.fill"
              size={13}
              color={showInundation ? colors.error : colors.muted}
            />
            <Text
              style={[
                styles.controlBtnText,
                { color: showInundation ? colors.error : colors.muted },
              ]}
            >
              Water
            </Text>
          </Pressable>

          <Pressable
            style={[
              styles.controlBtn,
              showContours && { backgroundColor: colors.success + "25", borderColor: colors.success },
            ]}
            onPress={() => setShowContours(!showContours)}
          >
            <IconSymbol
              name="shield.lefthalf.filled"
              size={13}
              color={showContours ? colors.success : colors.muted}
            />
            <Text
              style={[
                styles.controlBtnText,
                { color: showContours ? colors.success : colors.muted },
              ]}
            >
              Ridge
            </Text>
          </Pressable>

          <Pressable
            style={[
              styles.controlBtn,
              showWaypoints && { backgroundColor: colors.primary + "25", borderColor: colors.primary },
            ]}
            onPress={() => setShowWaypoints(!showWaypoints)}
          >
            <IconSymbol
              name="arrow.triangle.turn.up.right.diamond.fill"
              size={13}
              color={showWaypoints ? colors.primary : colors.muted}
            />
            <Text
              style={[
                styles.controlBtnText,
                { color: showWaypoints ? colors.primary : colors.muted },
              ]}
            >
              Steps
            </Text>
          </Pressable>

          <Pressable
            style={styles.controlIconBtn}
            onPress={() => setZoomLevel((z) => Math.min(z + 0.25, 2.0))}
          >
            <IconSymbol name="plus.circle.fill" size={15} color={colors.foreground} />
          </Pressable>

          <Pressable
            style={styles.controlIconBtn}
            onPress={() => setZoomLevel((z) => Math.max(z - 0.25, 0.75))}
          >
            <IconSymbol name="xmark" size={12} color={colors.foreground} />
          </Pressable>
        </View>
      </View>

      {/* Bottom Map Legend */}
      <View style={[styles.mapLegend, { borderTopColor: colors.border }]}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: colors.error }]} />
          <Text style={[styles.legendLabel, { color: colors.muted }]}>Your Location</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendLine, { backgroundColor: colors.success }]} />
          <Text style={[styles.legendLabel, { color: colors.muted }]}>Ridge Corridor</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: "#38BDF8" }]} />
          <Text style={[styles.legendLabel, { color: colors.muted }]}>Flooded Basin</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: colors.primary }]} />
          <Text style={[styles.legendLabel, { color: colors.muted }]}>Safe Haven</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  mapCard: {
    borderRadius: 20,
    borderWidth: 1,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 3,
    marginBottom: 16,
  },
  hudHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  hudLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  livePulseDot: {
    width: 9,
    height: 9,
    borderRadius: 5,
  },
  hudTitle: {
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 0.8,
  },
  hudSub: {
    fontSize: 9,
    marginTop: 1,
  },
  statusPill: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 9,
    fontWeight: "900",
  },
  recalcBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  recalcText: {
    fontSize: 9,
    fontWeight: "900",
  },
  canvasContainer: {
    position: "relative",
    width: "100%",
  },
  svg: {
    width: "100%",
  },
  floatingControls: {
    position: "absolute",
    right: 10,
    top: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(15, 23, 42, 0.85)",
    padding: 5,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(51, 65, 85, 0.8)",
  },
  controlBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 7,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "transparent",
  },
  controlBtnText: {
    fontSize: 9,
    fontWeight: "800",
  },
  controlIconBtn: {
    width: 24,
    height: 24,
    borderRadius: 6,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(30, 41, 59, 0.8)",
  },
  mapLegend: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    paddingVertical: 9,
    paddingHorizontal: 12,
    borderTopWidth: 1,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendLine: {
    width: 14,
    height: 3,
    borderRadius: 2,
  },
  legendLabel: {
    fontSize: 9.5,
    fontWeight: "600",
  },
});
