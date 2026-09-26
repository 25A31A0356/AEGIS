import React, { useEffect } from "react";
import { View, StyleSheet, StyleProp, ViewStyle } from "react-native";
import Svg, {
  Defs,
  LinearGradient,
  RadialGradient,
  Stop,
  Circle,
  Path,
  G,
  Line,
} from "react-native-svg";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  withDelay,
  Easing,
} from "react-native-reanimated";

interface WeatherIllustrationProps {
  conditionCode?: string;
  isNight?: boolean;
  size?: number;
  style?: StyleProp<ViewStyle>;
}

export const WeatherIllustration: React.FC<WeatherIllustrationProps> = ({
  conditionCode = "partly_cloudy",
  isNight = false,
  size = 180,
  style,
}) => {
  const code = conditionCode.toLowerCase();

  // Animation shared values
  const floatOffset = useSharedValue(0);
  const backCloudOffset = useSharedValue(0);
  const sunGlowScale = useSharedValue(1);
  const sunRayRotate = useSharedValue(0);
  const lightningOpacity = useSharedValue(0);

  // Rain droplet animations
  const rainDrop1 = useSharedValue(0);
  const rainDrop2 = useSharedValue(0);
  const rainDrop3 = useSharedValue(0);

  useEffect(() => {
    // 1. Cloud floating motion
    floatOffset.value = withRepeat(
      withTiming(-9, {
        duration: 2500,
        easing: Easing.inOut(Easing.sin),
      }),
      -1,
      true
    );

    // 2. Secondary cloud counter-drift
    backCloudOffset.value = withRepeat(
      withTiming(5, {
        duration: 3200,
        easing: Easing.inOut(Easing.sin),
      }),
      -1,
      true
    );

    // 3. Sun glow pulse
    sunGlowScale.value = withRepeat(
      withSequence(
        withTiming(1.1, { duration: 1800, easing: Easing.inOut(Easing.quad) }),
        withTiming(0.96, { duration: 1800, easing: Easing.inOut(Easing.quad) })
      ),
      -1,
      true
    );

    // 4. Sun ray rotation
    sunRayRotate.value = withRepeat(
      withTiming(360, {
        duration: 24000,
        easing: Easing.linear,
      }),
      -1,
      false
    );

    // 5. Rain drop animation cycles
    rainDrop1.value = withRepeat(
      withTiming(1, { duration: 1000, easing: Easing.linear }),
      -1,
      false
    );
    rainDrop2.value = withRepeat(
      withDelay(300, withTiming(1, { duration: 1100, easing: Easing.linear })),
      -1,
      false
    );
    rainDrop3.value = withRepeat(
      withDelay(600, withTiming(1, { duration: 950, easing: Easing.linear })),
      -1,
      false
    );

    // 6. Lightning flicker
    lightningOpacity.value = withRepeat(
      withSequence(
        withTiming(0, { duration: 2500 }),
        withTiming(1, { duration: 80 }),
        withTiming(0.2, { duration: 50 }),
        withTiming(1, { duration: 100 }),
        withTiming(0, { duration: 120 })
      ),
      -1,
      false
    );
  }, []);

  const animatedFloatStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: floatOffset.value }],
  }));

  const animatedBackCloudStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: backCloudOffset.value }, { translateY: -backCloudOffset.value * 0.3 }],
  }));

  const animatedSunGlowStyle = useAnimatedStyle(() => ({
    transform: [{ scale: sunGlowScale.value }],
    opacity: 0.85 + (sunGlowScale.value - 1) * 0.8,
  }));

  const animatedSunRaysStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${sunRayRotate.value}deg` }],
  }));

  const animatedLightningStyle = useAnimatedStyle(() => ({
    opacity: lightningOpacity.value,
  }));

  const animatedRain1 = useAnimatedStyle(() => ({
    transform: [{ translateY: rainDrop1.value * 28 }],
    opacity: 1 - rainDrop1.value * 0.7,
  }));

  const animatedRain2 = useAnimatedStyle(() => ({
    transform: [{ translateY: rainDrop2.value * 28 }],
    opacity: 1 - rainDrop2.value * 0.7,
  }));

  const animatedRain3 = useAnimatedStyle(() => ({
    transform: [{ translateY: rainDrop3.value * 28 }],
    opacity: 1 - rainDrop3.value * 0.7,
  }));

  // 1. NIGHT TIME
  if (isNight) {
    return (
      <View style={[styles.container, { width: size, height: size }, style]}>
        <Animated.View style={[styles.glowOrb, { backgroundColor: "rgba(99, 102, 241, 0.2)" }, animatedSunGlowStyle]} />
        <Svg viewBox="0 0 200 200" width="100%" height="100%">
          <Defs>
            <LinearGradient id="moonGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <Stop offset="0%" stopColor="#FEF08A" />
              <Stop offset="100%" stopColor="#F59E0B" />
            </LinearGradient>
            <LinearGradient id="nightCloudGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <Stop offset="0%" stopColor="#334155" />
              <Stop offset="100%" stopColor="#0F172A" />
            </LinearGradient>
          </Defs>

          <Circle cx="45" cy="40" r="2" fill="#F8FAFC" opacity={0.8} />
          <Circle cx="160" cy="50" r="2.5" fill="#38BDF8" opacity={0.9} />
          <Circle cx="140" cy="30" r="1.5" fill="#F8FAFC" opacity={0.7} />
          <Circle cx="60" cy="80" r="1.5" fill="#F8FAFC" opacity={0.6} />

          <Path
            d="M95 45 C70 45 50 65 50 90 C50 115 70 135 95 135 C108 135 120 129 128 120 C108 122 90 106 90 85 C90 68 100 54 115 47 C109 45 102 45 95 45 Z"
            fill="url(#moonGrad)"
          />
        </Svg>
        <Animated.View style={[StyleSheet.absoluteFillObject, animatedFloatStyle]}>
          <Svg viewBox="0 0 200 200" width="100%" height="100%">
            <Path
              d="M60 140 C50 140 40 130 40 120 C40 112 45 105 53 102 C56 90 67 82 80 82 C90 82 99 87 104 95 C108 93 113 92 118 92 C132 92 143 103 143 117 C143 118 143 119 143 120 C150 122 155 128 155 136 C155 145 147 152 138 152 L60 152 Z"
              fill="url(#nightCloudGrad)"
              opacity={0.88}
            />
          </Svg>
        </Animated.View>
      </View>
    );
  }

  // 2. THUNDERSTORM / CYCLONIC
  if (code.includes("thunder") || code.includes("storm") || code.includes("cyclone")) {
    return (
      <View style={[styles.container, { width: size, height: size }, style]}>
        <Animated.View style={[styles.glowOrb, { backgroundColor: "rgba(56, 189, 248, 0.22)" }, animatedSunGlowStyle]} />
        <Animated.View style={[StyleSheet.absoluteFillObject, animatedFloatStyle]}>
          <Svg viewBox="0 0 200 200" width="100%" height="100%">
            <Defs>
              <LinearGradient id="stormCloudGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                <Stop offset="0%" stopColor="#475569" />
                <Stop offset="100%" stopColor="#1E293B" />
              </LinearGradient>
              <LinearGradient id="lightningGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <Stop offset="0%" stopColor="#FEF08A" />
                <Stop offset="38%" stopColor="#38BDF8" />
              </LinearGradient>
            </Defs>

            <Path
              d="M48 135 C35 135 25 125 25 113 C25 103 32 95 41 92 C45 77 58 67 75 67 C88 67 99 73 105 83 C110 80 116 79 123 79 C140 79 153 92 153 109 C153 110 153 111 153 113 C161 115 168 123 168 133 C168 143 160 151 149 151 L48 151 Z"
              fill="url(#stormCloudGrad)"
            />
          </Svg>
        </Animated.View>

        <Animated.View style={[StyleSheet.absoluteFillObject, animatedLightningStyle]}>
          <Svg viewBox="0 0 200 200" width="100%" height="100%">
            <Path
              d="M95 112 L78 145 L102 145 L86 178 L124 135 L102 135 Z"
              fill="url(#lightningGrad)"
            />
          </Svg>
        </Animated.View>

        <Animated.View style={[StyleSheet.absoluteFillObject, animatedRain1]}>
          <Svg viewBox="0 0 200 200" width="100%" height="100%">
            <Line x1="45" y1="130" x2="38" y2="152" stroke="#38BDF8" strokeWidth={2.5} strokeLinecap="round" opacity={0.8} />
            <Line x1="135" y1="132" x2="128" y2="154" stroke="#38BDF8" strokeWidth={2.5} strokeLinecap="round" opacity={0.8} />
          </Svg>
        </Animated.View>
        <Animated.View style={[StyleSheet.absoluteFillObject, animatedRain2]}>
          <Svg viewBox="0 0 200 200" width="100%" height="100%">
            <Line x1="75" y1="134" x2="68" y2="158" stroke="#38BDF8" strokeWidth={2.5} strokeLinecap="round" opacity={0.9} />
            <Line x1="155" y1="130" x2="148" y2="154" stroke="#38BDF8" strokeWidth={2.5} strokeLinecap="round" opacity={0.8} />
          </Svg>
        </Animated.View>
      </View>
    );
  }

  // 3. RAIN / HEAVY RAIN
  if (code.includes("rain") || code.includes("drizzle") || code.includes("shower")) {
    return (
      <View style={[styles.container, { width: size, height: size }, style]}>
        <Animated.View style={[styles.glowOrb, { backgroundColor: "rgba(56, 189, 248, 0.16)" }, animatedSunGlowStyle]} />
        <Animated.View style={[StyleSheet.absoluteFillObject, animatedFloatStyle]}>
          <Svg viewBox="0 0 200 200" width="100%" height="100%">
            <Defs>
              <LinearGradient id="rainCloudGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                <Stop offset="0%" stopColor="#64748B" />
                <Stop offset="100%" stopColor="#334155" />
              </LinearGradient>
            </Defs>
            <Path
              d="M48 105 C35 105 25 95 25 83 C25 73 32 65 41 62 C45 47 58 37 75 37 C88 37 99 43 105 53 C110 50 116 49 123 49 C140 49 153 62 153 79 C153 80 153 81 153 83 C161 85 168 93 168 103 C168 113 160 121 149 121 L48 121 Z"
              fill="url(#rainCloudGrad)"
            />
          </Svg>
        </Animated.View>

        <Animated.View style={[StyleSheet.absoluteFillObject, animatedRain1]}>
          <Svg viewBox="0 0 200 200" width="100%" height="100%">
            <Line x1="55" y1="125" x2="48" y2="148" stroke="#38BDF8" strokeWidth={3} strokeLinecap="round" />
            <Line x1="125" y1="128" x2="118" y2="152" stroke="#38BDF8" strokeWidth={3} strokeLinecap="round" />
          </Svg>
        </Animated.View>
        <Animated.View style={[StyleSheet.absoluteFillObject, animatedRain2]}>
          <Svg viewBox="0 0 200 200" width="100%" height="100%">
            <Line x1="85" y1="128" x2="78" y2="154" stroke="#38BDF8" strokeWidth={3} strokeLinecap="round" />
            <Line x1="145" y1="125" x2="138" y2="148" stroke="#38BDF8" strokeWidth={3} strokeLinecap="round" />
          </Svg>
        </Animated.View>
        <Animated.View style={[StyleSheet.absoluteFillObject, animatedRain3]}>
          <Svg viewBox="0 0 200 200" width="100%" height="100%">
            <Line x1="105" y1="125" x2="98" y2="150" stroke="#38BDF8" strokeWidth={3} strokeLinecap="round" />
          </Svg>
        </Animated.View>
      </View>
    );
  }

  // 4. CLEAR / SUNNY / HEATWAVE
  if (code.includes("sun") || code.includes("clear") || code.includes("heat")) {
    return (
      <View style={[styles.container, { width: size, height: size }, style]}>
        <Animated.View style={[styles.glowOrb, { backgroundColor: "rgba(251, 191, 36, 0.3)" }, animatedSunGlowStyle]} />
        <Animated.View style={[StyleSheet.absoluteFillObject, animatedSunRaysStyle]}>
          <Svg viewBox="0 0 200 200" width="100%" height="100%">
            <Defs>
              <LinearGradient id="sunRayGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <Stop offset="0%" stopColor="#FDE047" />
                <Stop offset="100%" stopColor="#F97316" />
              </LinearGradient>
            </Defs>
            <G stroke="url(#sunRayGrad)" strokeWidth={3.8} strokeLinecap="round" opacity={0.88}>
              <Line x1="100" y1="18" x2="100" y2="34" />
              <Line x1="100" y1="166" x2="100" y2="182" />
              <Line x1="18" y1="100" x2="34" y2="100" />
              <Line x1="166" y1="100" x2="182" y2="100" />
              <Line x1="42" y1="42" x2="53" y2="53" />
              <Line x1="147" y1="147" x2="158" y2="158" />
              <Line x1="42" y1="158" x2="53" y2="147" />
              <Line x1="147" y1="53" x2="158" y2="42" />
            </G>
          </Svg>
        </Animated.View>

        <Animated.View style={[StyleSheet.absoluteFillObject, animatedFloatStyle]}>
          <Svg viewBox="0 0 200 200" width="100%" height="100%">
            <Defs>
              <RadialGradient id="sunDiscGrad" cx="35%" cy="35%" rx="65%" ry="65%">
                <Stop offset="0%" stopColor="#FEF08A" />
                <Stop offset="45%" stopColor="#FBBF24" />
                <Stop offset="100%" stopColor="#EA580C" />
              </RadialGradient>
            </Defs>
            <Circle cx="100" cy="100" r="44" fill="url(#sunDiscGrad)" />
          </Svg>
        </Animated.View>
      </View>
    );
  }

  // 5. DEFAULT / PARTLY CLOUDY / CLOUDY (EXACT MATCH TO WEB DESIGN)
  return (
    <View style={[styles.container, { width: size, height: size }, style]}>
      {/* 1. Ambient Sun Glow Backing */}
      <Animated.View
        style={[
          styles.glowOrb,
          {
            backgroundColor: "rgba(251, 191, 36, 0.28)",
            top: 25,
            right: 25,
            width: size * 0.65,
            height: size * 0.65,
          },
          animatedSunGlowStyle,
        ]}
      />

      {/* 2. Sun Disc with rich radial gradient peaking from top right */}
      <Animated.View style={[StyleSheet.absoluteFillObject, animatedSunGlowStyle]}>
        <Svg viewBox="0 0 200 200" width="100%" height="100%">
          <Defs>
            <RadialGradient id="partlySunGrad" cx="35%" cy="35%" rx="65%" ry="65%">
              <Stop offset="0%" stopColor="#FEF08A" />
              <Stop offset="45%" stopColor="#FBBF24" />
              <Stop offset="100%" stopColor="#EA580C" />
            </RadialGradient>
          </Defs>
          <Circle cx="128" cy="74" r="33" fill="url(#partlySunGrad)" />
        </Svg>
      </Animated.View>

      {/* 3. Front Fluffy Layered Cloud Floating Smoothly */}
      <Animated.View style={[StyleSheet.absoluteFillObject, animatedFloatStyle]}>
        <Svg viewBox="0 0 200 200" width="100%" height="100%">
          <Defs>
            <LinearGradient id="cloudWhiteGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <Stop offset="0%" stopColor="#FFFFFF" />
              <Stop offset="55%" stopColor="#F8FAFC" />
              <Stop offset="100%" stopColor="#CBD5E1" />
            </LinearGradient>
            <LinearGradient id="cloudEdgeHighlight" x1="0%" y1="0%" x2="100%" y2="0%">
              <Stop offset="0%" stopColor="#FFFFFF" stopOpacity={0.95} />
              <Stop offset="100%" stopColor="#E2E8F0" stopOpacity={0.3} />
            </LinearGradient>
          </Defs>

          {/* Front Layered Cloud with organic curves */}
          <Path
            d="M48 135 C35 135 25 125 25 113 C25 103 32 95 41 92 C45 77 58 67 75 67 C88 67 99 73 105 83 C110 80 116 79 123 79 C140 79 153 92 153 109 C153 110 153 111 153 113 C161 115 168 123 168 133 C168 143 160 151 149 151 L48 151 Z"
            fill="url(#cloudWhiteGrad)"
          />

          {/* Cloud Top Puff Highlight */}
          <Path
            d="M45 93 C48 79 60 69 75 69 C87 69 97 74 103 83 C109 81 115 80 122 80 C137 80 149 91 151 105"
            stroke="url(#cloudEdgeHighlight)"
            strokeWidth={2.5}
            strokeLinecap="round"
            fill="none"
          />
        </Svg>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  glowOrb: {
    position: "absolute",
    width: 130,
    height: 130,
    borderRadius: 65,
  },
});

export default WeatherIllustration;