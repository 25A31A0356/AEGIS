import React from 'react';
import { View, Text, StyleSheet, Pressable, Image } from 'react-native';
import { useColors } from '@/hooks/use-colors';

interface AegisLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showSubtitle?: boolean;
  iconOnly?: boolean;
  textColor?: string;
  subtitleColor?: string;
  onPress?: () => void;
}

export function AegisShieldIcon({ size = 36 }: { size?: number }) {
  return (
    <Image
      source={require('@/assets/images/logo.png')}
      style={{ width: size, height: size }}
      resizeMode="contain"
    />
  );
}

export function AegisLogo({
  size = 'md',
  showSubtitle = true,
  iconOnly = false,
  textColor,
  subtitleColor,
  onPress,
}: AegisLogoProps) {
  const colors = useColors();

  const iconSizes = {
    sm: 28,
    md: 36,
    lg: 44,
    xl: 56,
  };

  const titleSizes = {
    sm: 15,
    md: 18,
    lg: 22,
    xl: 26,
  };

  const subSizes = {
    sm: 7.5,
    md: 8.5,
    lg: 10,
    xl: 11.5,
  };

  const aegisTextColor = textColor || (colors.background === '#000000' || colors.background.startsWith('#0') || colors.background.startsWith('#1') ? '#FFFFFF' : '#0F172A');
  const alertColor = '#0284C7';
  const subColor = subtitleColor || '#94A3B8';

  const content = (
    <View style={styles.container}>
      <AegisShieldIcon size={iconSizes[size]} />
      {!iconOnly && (
        <View style={styles.textContainer}>
          <View style={styles.brandRow}>
            <Text style={[styles.brandText, { color: aegisTextColor, fontSize: titleSizes[size] }]}>
              AEGIS
            </Text>
            <Text style={[styles.brandText, { color: alertColor, fontSize: titleSizes[size], marginLeft: 6 }]}>
              ALERT
            </Text>
          </View>
          {showSubtitle && (
            <Text style={[styles.subtitleText, { color: subColor, fontSize: subSizes[size] }]}>
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
    gap: 10,
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
    marginTop: 2,
  },
  pressed: {
    opacity: 0.8,
  },
});

export default AegisLogo;
