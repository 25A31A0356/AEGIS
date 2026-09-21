import React from "react";
import Svg, {
  Defs,
  LinearGradient,
  Stop,
  Rect,
  Circle,
  Path,
  Polygon,
  Ellipse,
} from "react-native-svg";
import { View, StyleSheet, StyleProp, ViewStyle } from "react-native";

interface ScenicBannerProps {
  style?: StyleProp<ViewStyle>;
  height?: number;
}

/**
 * Route Ticket 1: Alpine Green Ridge & Mountain Safe Corridor
 */
export const AlpineScenicBanner: React.FC<ScenicBannerProps> = ({ style, height = 110 }) => (
  <View style={[styles.container, { height }, style]}>
    <Svg viewBox="0 0 400 130" width="100%" height="100%" preserveAspectRatio="xMidYMid slice">
      <Defs>
        <LinearGradient id="alpineSky" x1="0%" y1="0%" x2="100%" y2="0%">
          <Stop offset="0%" stopColor="#102D26" />
          <Stop offset="50%" stopColor="#1B4237" />
          <Stop offset="100%" stopColor="#0F332A" />
        </LinearGradient>
        <LinearGradient id="leftPeak" x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0%" stopColor="#2A634E" />
          <Stop offset="100%" stopColor="#153B2D" />
        </LinearGradient>
        <LinearGradient id="rightPeak" x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0%" stopColor="#3F8C6D" />
          <Stop offset="100%" stopColor="#1F543F" />
        </LinearGradient>
      </Defs>

      <Rect width="400" height="130" fill="url(#alpineSky)" />
      <Path d="M-20 130 L 70 20 L 180 130 Z" fill="url(#leftPeak)" opacity={0.65} />
      <Path d="M20 130 L 110 35 L 195 130 Z" fill="url(#leftPeak)" opacity={0.8} />

      {/* Ridge Fortress / Shelter Silhouette */}
      <Rect x="185" y="45" width="14" height="40" fill="#63C7C0" opacity={0.7} rx="2" />
      <Polygon points="183,45 192,30 201,45" fill="#6BE39C" opacity={0.9} />
      <Rect x="203" y="55" width="10" height="30" fill="#63C7C0" opacity={0.6} rx="1" />

      <Path d="M200 130 L 290 15 L 420 130 Z" fill="url(#rightPeak)" opacity={0.7} />
      <Path d="M240 130 L 330 30 L 420 130 Z" fill="url(#rightPeak)" opacity={0.85} />
      <Circle cx="200" cy="65" r="50" fill="#63C7C0" opacity={0.15} />
    </Svg>
  </View>
);

/**
 * Route Ticket 2: Sky Mist Blue & Elevated Outer Bypass
 */
export const SkyScenicBanner: React.FC<ScenicBannerProps> = ({ style, height = 110 }) => (
  <View style={[styles.container, { height }, style]}>
    <Svg viewBox="0 0 400 130" width="100%" height="100%" preserveAspectRatio="xMidYMid slice">
      <Defs>
        <LinearGradient id="skyBlueGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <Stop offset="0%" stopColor="#0E2338" />
          <Stop offset="50%" stopColor="#163654" />
          <Stop offset="100%" stopColor="#0B1C2E" />
        </LinearGradient>
        <LinearGradient id="towerBlue" x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0%" stopColor="#3B82F6" />
          <Stop offset="100%" stopColor="#1D4ED8" />
        </LinearGradient>
      </Defs>

      <Rect width="400" height="130" fill="url(#skyBlueGrad)" />

      {/* Radar Beacon / Sky elements */}
      <Ellipse cx="140" cy="55" rx="14" ry="18" fill="#60A5FA" opacity={0.5} />
      <Path d="M130 65 L 140 78 L 150 65 Z" fill="#3B82F6" opacity={0.6} />
      <Rect x="138" y="80" width="4" height="3" fill="#93C5FD" opacity={0.8} />

      <Circle cx="90" cy="40" r="28" fill="#38BDF8" opacity={0.15} />
      <Circle cx="180" cy="45" r="35" fill="#38BDF8" opacity={0.2} />

      {/* High-Rise Medical / Expressway Towers */}
      <Rect x="270" y="30" width="18" height="80" fill="url(#towerBlue)" opacity={0.7} rx="2" />
      <Polygon points="268,30 279,10 290,30" fill="#60A5FA" opacity={0.8} />
      <Rect x="294" y="50" width="12" height="60" fill="url(#towerBlue)" opacity={0.5} rx="1" />
      <Circle cx="200" cy="55" r="45" fill="#38BDF8" opacity={0.12} />
    </Svg>
  </View>
);

/**
 * Route Ticket 3: Sunset Peach Amber & Medical Trail
 */
export const SunsetScenicBanner: React.FC<ScenicBannerProps> = ({ style, height = 110 }) => (
  <View style={[styles.container, { height }, style]}>
    <Svg viewBox="0 0 400 130" width="100%" height="100%" preserveAspectRatio="xMidYMid slice">
      <Defs>
        <LinearGradient id="sunsetPeach" x1="0%" y1="0%" x2="100%" y2="0%">
          <Stop offset="0%" stopColor="#2D1A10" />
          <Stop offset="50%" stopColor="#452718" />
          <Stop offset="100%" stopColor="#24140D" />
        </LinearGradient>
        <LinearGradient id="peachBridge" x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0%" stopColor="#F59E0B" />
          <Stop offset="100%" stopColor="#B45309" />
        </LinearGradient>
      </Defs>

      <Rect width="400" height="130" fill="url(#sunsetPeach)" />

      {/* Elevated Arch Bridge */}
      <Path d="M-10 110 Q 60 70 140 110 L 140 130 L -10 130 Z" fill="url(#peachBridge)" opacity={0.55} />
      <Path d="M50 115 Q 130 75 210 115 L 210 130 L 50 130 Z" fill="url(#peachBridge)" opacity={0.7} />

      {/* Hospital Enclave on High Ridge */}
      <Ellipse cx="310" cy="85" rx="35" ry="12" fill="#FBBF24" opacity={0.5} />
      <Rect x="295" y="60" width="30" height="25" fill="#F59E0B" opacity={0.65} rx="2" />
      <Polygon points="290,60 310,40 330,60" fill="#FBBF24" opacity={0.8} />

      <Circle cx="200" cy="65" r="45" fill="#F59E0B" opacity={0.15} />
    </Svg>
  </View>
);

const styles = StyleSheet.create({
  container: {
    width: "100%",
    overflow: "hidden",
    borderRadius: 16,
  },
});
