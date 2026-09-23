import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import Svg, { Path, Circle } from 'react-native-svg';
import { useColors } from '@/hooks/use-colors';

interface AegisLogoProps {
  size?: 'sm' | 'md' | 'lg';
  showSubtitle?: boolean;
  iconOnly?: boolean;
  onPress?: () => void;
}

export function AegisShieldIcon({ size = 32 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      <Path
        d="M50 4L16 17V48C16 71.5 30.5 91 50 97C69.5 91 84 71.5 84 48V17L50 4Z"
        fill="#0B132B"
        stroke="#1C2D5A"
        strokeWidth="3.5"
      />
      <Path
        d="M50 8L20 20V48C20 68.5 32.5 86.5 50 92C67.5 86.5 80 68.5 80 48V20L50 8Z"
        fill="#0F172A"
      />
      <Path
        d="M32 37C37.5 30.5 43.5 27 50 27C56.5 27 62.5 30.5 68 37"
        stroke="#0284C7"
        strokeWidth="4.5"
        strokeLinecap="round"
      />
      <Path
        d="M38 46C41.5 41.5 45.5 39 50 39C54.5 39 58.5 41.5 62 46"
        stroke="#0EA5E9"
        strokeWidth="4.5"
        strokeLinecap="round"
      />
      <Path
        d="M44 55C45.8 52.8 47.8 51.5 50 51.5C52.2 51.5 54.2 52.8 56 55"
        stroke="#38BDF8"
        strokeWidth="4"
        strokeLinecap="round"
      />
      <Circle cx="50" cy="68" r="9" fill="#0284C7" />
      <Circle cx="50" cy="68" r="6" fill="#38BDF8" />
    </Svg>
  );
}

export function AegisLogo({
  size = 'md',
  showSubtitle = true,
  iconOnly = false,
  onPress,
}: AegisLogoProps) {
  const colors = useColors();

  const iconSizes = {
    sm: 24,
    md: 32,
    lg: 40,
  };

  const titleSizes = {
    sm: 15,
    md: 18,
    lg: 22,
  };

  const subSizes = {
    sm: 7.5,
    md: 8.5,
    lg: 10,
  };

  const content = (
    <View style={styles.container}>
      <AegisShieldIcon size={iconSizes[size]} />
      {!iconOnly && (
        <View style={styles.textContainer}>
          <View style={styles.brandRow}>
            <Text style={[styles.brandText, { color: colors.foreground, fontSize: titleSizes[size] }]}>
              AEGIS
            </Text>
            <Text style={[styles.brandText, { color: '#0284C7', fontSize: titleSizes[size], marginLeft: 5 }]}>
              ALERT
            </Text>
          </View>
          {showSubtitle && (
            <Text style={[styles.subtitleText, { color: colors.muted, fontSize: subSizes[size] }]}>
              HAZARD & WEATHER INTELLIGENCE
            </Text>
          )}
        </View>
      )}
    </View>
  );

  if (onPress) {
    return (
      <Pressable onPress={onPress} style={({ pressed }) => [pressed && styles.pressed]}>
        {content}
      </Pressable>
    );
  }

  return content;
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  textContainer: {
    justifyContent: 'center',
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  brandText: {
    fontWeight: '900',
    letterSpacing: -0.3,
  },
  subtitleText: {
    fontWeight: '700',
    letterSpacing: 1.1,
    marginTop: 1,
  },
  pressed: {
    opacity: 0.8,
  },
});

export default AegisLogo;
