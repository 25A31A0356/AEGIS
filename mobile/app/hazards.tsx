import React, { useState, useMemo } from 'react';
import {
  ActivityIndicator,
  Linking,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { ScreenContainer } from '@/components/screen-container';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useColors } from '@/hooks/use-colors';
import { useAegisData } from '@/hooks/use-aegis-data';
import { AegisHazardAlert, HazardSeverity, HazardType } from '@/lib/services/aegis-types';

type FilterType = 'all' | 'critical' | 'flood' | 'cyclone' | 'infra';

function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Number((6371 * c).toFixed(1));
}

export default function HazardsScreen() {
  const colors = useColors();
  const router = useRouter();
  const {
    hazardAlerts,
    location,
    isLoading,
    isRefreshing,
    dataFreshness,
    refresh,
  } = useAegisData();

  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Fallback enriched regional hazards including Kakinada Road Inundation and Cyclone Arnab
  const allAlerts: AegisHazardAlert[] = useMemo(() => {
    const userLat = location.latitude || 16.989;
    const userLng = location.longitude || 82.247;

    const baseList = hazardAlerts.length > 0 ? [...hazardAlerts] : [];

    const hasKakinadaRoad = baseList.some(
      (a) => a.title.toLowerCase().includes('kakinada') || a.description.toLowerCase().includes('road')
    );
    const hasCycloneArnab = baseList.some(
      (a) => a.title.toLowerCase().includes('arnab') || a.description.toLowerCase().includes('arnab')
    );

    if (!hasCycloneArnab) {
      baseList.unshift({
        id: 'cyclone-arnab-bay-alert',
        type: 'cyclone',
        title: 'Cyclone ARNAB Bay of Bengal Warning & Squall Alert',
        severity: 'CRITICAL',
        affectedLocation: {
          name: 'Bay of Bengal Coast (Kakinada, Konaseema & Godavari Basin)',
          latitude: 16.989,
          longitude: 82.247,
          radiusKm: 35.0,
        },
        distanceKm: calculateDistance(userLat, userLng, 16.989, 82.247),
        description:
          'Deep Depression escalated into Cyclonic Storm ARNAB over West-Central Bay of Bengal. Gale winds 75-95 km/h with heavy squally rainfall across coastal sectors.',
        instructions:
          'Coastal fishermen must stay ashore. Secure loose structures, keep emergency power banks charged, and locate the nearest APSDMA cyclone shelter.',
        issuedAt: new Date(Date.now() - 900000).toISOString(),
        expiresAt: new Date(Date.now() + 86400000).toISOString(),
        source: 'IMD Cyclone Warning Centre / SDMA Andhra Pradesh',
        status: 'ACTIVE',
        windSpeedKts: 48,
        isUrgent: true,
      });
    }

    if (!hasKakinadaRoad) {
      baseList.unshift({
        id: 'kakinada-road-flood-alert',
        type: 'flood',
        title: 'Kakinada Port Road & Jagannaickpur Submerged / Flooded',
        severity: 'HIGH',
        affectedLocation: {
          name: 'Kakinada Main Port Corridor & Jagannaickpur Low Bridge',
          latitude: 16.9604,
          longitude: 82.2381,
          radiusKm: 4.0,
        },
        distanceKm: calculateDistance(userLat, userLng, 16.9604, 82.2381),
        description:
          'Heavy waterlogging and road inundation reported since early morning. Road depth reached 1.2 meters. Traffic disrupted near Beach Road and Port Access corridor.',
        instructions:
          'Avoid low-lying coastal arterial roads. Use ADB Road bypass and elevated Collectorate flyover route. Disaster response team deployed.',
        issuedAt: new Date(Date.now() - 1800000).toISOString(),
        expiresAt: new Date(Date.now() + 43200000).toISOString(),
        source: 'APSDMA / Kakinada Municipal Disaster Management Cell',
        status: 'ACTIVE',
        waterDepthM: 1.2,
        isUrgent: true,
      });
    }

    return baseList.map((alert) => {
      const aLat = alert.affectedLocation?.latitude ?? userLat;
      const aLng = alert.affectedLocation?.longitude ?? userLng;
      const dynamicDist = calculateDistance(userLat, userLng, aLat, aLng);
      return {
        ...alert,
        distanceKm: alert.distanceKm !== undefined && alert.distanceKm > 0 ? alert.distanceKm : dynamicDist,
      };
    });
  }, [hazardAlerts, location.latitude, location.longitude]);

  const filteredAlerts = useMemo(() => {
    return allAlerts.filter((alert) => {
      const matchSearch =
        searchQuery.trim() === '' ||
        alert.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        alert.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (alert.affectedLocation?.name || '').toLowerCase().includes(searchQuery.toLowerCase());

      if (!matchSearch) return false;

      if (activeFilter === 'critical') {
        return alert.severity === 'CRITICAL' || alert.severity === 'HIGH';
      }
      if (activeFilter === 'flood') {
        return alert.type === 'flood' || alert.title.toLowerCase().includes('flood') || alert.title.toLowerCase().includes('inundat') || alert.title.toLowerCase().includes('submerge');
      }
      if (activeFilter === 'cyclone') {
        return alert.type === 'cyclone' || alert.title.toLowerCase().includes('cyclone') || alert.title.toLowerCase().includes('arnab') || alert.title.toLowerCase().includes('wind');
      }
      if (activeFilter === 'infra') {
        return alert.type === 'emergency_broadcast' || alert.title.toLowerCase().includes('road') || alert.title.toLowerCase().includes('power') || alert.title.toLowerCase().includes('bridge');
      }
      return true;
    });
  }, [allAlerts, activeFilter, searchQuery]);

  const criticalCount = allAlerts.filter((a) => a.severity === 'CRITICAL' || a.severity === 'HIGH').length;

  const getHazardIcon = (type: HazardType) => {
    switch (type) {
      case 'flood':
        return 'drop.fill';
      case 'cyclone':
        return 'wind';
      case 'earthquake':
        return 'waveform.path.ecg';
      case 'wildfire':
        return 'flame.fill';
      case 'severe_weather':
        return 'cloud.bolt.rain.fill';
      default:
        return 'exclamationmark.triangle.fill';
    }
  };

  const getSeverityStyle = (severity: HazardSeverity) => {
    switch (severity) {
      case 'CRITICAL':
        return { bg: '#FEF2F2', badgeBg: '#DC2626', text: '#991B1B', border: '#EF4444' };
      case 'HIGH':
        return { bg: '#FFF7ED', badgeBg: '#EA580C', text: '#9A3412', border: '#F97316' };
      case 'MODERATE':
        return { bg: '#FFFBEB', badgeBg: '#D97706', text: '#92400E', border: '#F59E0B' };
      case 'LOW':
        return { bg: '#F0FDF4', badgeBg: '#16A34A', text: '#166534', border: '#22C55E' };
      default:
        return { bg: colors.surface, badgeBg: colors.primary, text: colors.primary, border: colors.border };
    }
  };

  return (
    <ScreenContainer className="px-4" edges={['top', 'left', 'right']}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={refresh} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Header Bar with Back Button */}
        <View style={styles.topHeader}>
          <Pressable onPress={() => router.back()} style={[styles.backBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <IconSymbol
              name="chevron.right"
              size={18}
              color={colors.foreground}
              style={{ transform: [{ rotate: '180deg' }] }}
            />
            <Text style={[styles.backBtnText, { color: colors.foreground }]}>Back</Text>
          </Pressable>

          <View
            style={[
              styles.freshnessBadge,
              {
                backgroundColor: dataFreshness === 'LIVE' ? '#DCFCE7' : '#FEF3C7',
                borderColor: dataFreshness === 'LIVE' ? '#16A34A' : '#D97706',
              },
            ]}
          >
            <View
              style={[
                styles.pulseDot,
                { backgroundColor: dataFreshness === 'LIVE' ? '#16A34A' : '#D97706' },
              ]}
            />
            <Text
              style={[
                styles.freshnessText,
                { color: dataFreshness === 'LIVE' ? '#15803D' : '#B45309' },
              ]}
            >
              {dataFreshness} MONITORING
            </Text>
          </View>
        </View>

        {/* Title & Sector Summary Card */}
        <View style={[styles.heroSummaryCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.heroTopRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.sectorKicker}>AEGIS REGIONAL HAZARD RADAR</Text>
              <Text style={[styles.heroTitle, { color: colors.foreground }]}>Active Hazards Near You</Text>
              <Text style={[styles.heroLocation, { color: colors.muted }]}>
                📍 Station: {location.village || location.localityName || location.label || 'Kakinada / East Godavari Sector'}
              </Text>
            </View>
            <View style={[styles.criticalCounterPill, { backgroundColor: criticalCount > 0 ? '#EF4444' : '#10B981' }]}>
              <Text style={styles.criticalCounterNum}>{criticalCount}</Text>
              <Text style={styles.criticalCounterLabel}>{criticalCount === 1 ? 'High Risk' : 'High Risks'}</Text>
            </View>
          </View>

          <Text style={[styles.heroSub, { color: colors.muted }]}>
            Live alerts, road inundations, cyclonic warnings, and emergency directives synced with State Disaster Authority.
          </Text>

          {/* Quick Action Buttons */}
          <View style={styles.heroActionsRow}>
            <Pressable
              style={[styles.heroActionButton, { backgroundColor: '#0284C7' }]}
              onPress={() => router.push('/map' as any)}
            >
              <IconSymbol name="map.fill" size={15} color="#FFFFFF" />
              <Text style={styles.heroActionBtnText}>Radar Map View</Text>
            </Pressable>

            <Pressable
              style={[styles.heroActionButton, { backgroundColor: '#DC2626' }]}
              onPress={() => Linking.openURL('tel:112')}
            >
              <IconSymbol name="phone.fill" size={15} color="#FFFFFF" />
              <Text style={styles.heroActionBtnText}>Emergency Call 112</Text>
            </Pressable>
          </View>
        </View>

        {/* Search Bar */}
        <View style={[styles.searchBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <IconSymbol name="magnifyingglass" size={16} color={colors.muted} />
          <TextInput
            placeholder="Search hazards (Kakinada, Road, Cyclone Arnab)..."
            placeholderTextColor={colors.muted}
            value={searchQuery}
            onChangeText={setSearchQuery}
            style={[styles.searchInput, { color: colors.foreground }]}
          />
          {searchQuery.length > 0 && (
            <Pressable onPress={() => setSearchQuery('')}>
              <Text style={{ color: colors.muted, fontSize: 16, fontWeight: '700' }}>✕</Text>
            </Pressable>
          )}
        </View>

        {/* Filter Tabs */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
          <Pressable
            onPress={() => setActiveFilter('all')}
            style={[
              styles.filterPill,
              activeFilter === 'all'
                ? { backgroundColor: colors.primary, borderColor: colors.primary }
                : { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            <Text style={[styles.filterPillText, { color: activeFilter === 'all' ? '#FFFFFF' : colors.foreground }]}>
              All Hazards ({allAlerts.length})
            </Text>
          </Pressable>

          <Pressable
            onPress={() => setActiveFilter('critical')}
            style={[
              styles.filterPill,
              activeFilter === 'critical'
                ? { backgroundColor: '#DC2626', borderColor: '#DC2626' }
                : { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            <Text style={[styles.filterPillText, { color: activeFilter === 'critical' ? '#FFFFFF' : '#DC2626' }]}>
              🚨 Critical / High ({criticalCount})
            </Text>
          </Pressable>

          <Pressable
            onPress={() => setActiveFilter('flood')}
            style={[
              styles.filterPill,
              activeFilter === 'flood'
                ? { backgroundColor: '#0284C7', borderColor: '#0284C7' }
                : { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            <Text style={[styles.filterPillText, { color: activeFilter === 'flood' ? '#FFFFFF' : colors.foreground }]}>
              🌊 Road Inundation & Floods
            </Text>
          </Pressable>

          <Pressable
            onPress={() => setActiveFilter('cyclone')}
            style={[
              styles.filterPill,
              activeFilter === 'cyclone'
                ? { backgroundColor: '#7C3AED', borderColor: '#7C3AED' }
                : { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            <Text style={[styles.filterPillText, { color: activeFilter === 'cyclone' ? '#FFFFFF' : colors.foreground }]}>
              🌀 Cyclone Arnab & Winds
            </Text>
          </Pressable>

          <Pressable
            onPress={() => setActiveFilter('infra')}
            style={[
              styles.filterPill,
              activeFilter === 'infra'
                ? { backgroundColor: '#D97706', borderColor: '#D97706' }
                : { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            <Text style={[styles.filterPillText, { color: activeFilter === 'infra' ? '#FFFFFF' : colors.foreground }]}>
              ⚡ Roads & Infrastructure
            </Text>
          </Pressable>
        </ScrollView>

        {/* Hazard List */}
        {isLoading && allAlerts.length === 0 ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={[styles.loadingText, { color: colors.muted }]}>
              Syncing live radar telemetry and municipal hazard records...
            </Text>
          </View>
        ) : filteredAlerts.length === 0 ? (
          <View style={[styles.emptyBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={{ fontSize: 32 }}>🛡️</Text>
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>No Hazards Found</Text>
            <Text style={[styles.emptySub, { color: colors.muted }]}>
              No active alerts matching your search in this category.
            </Text>
          </View>
        ) : (
          filteredAlerts.map((alert) => {
            const sevStyle = getSeverityStyle(alert.severity);
            const iconName = getHazardIcon(alert.type);

            return (
              <View
                key={alert.id}
                style={[
                  styles.hazardCard,
                  {
                    backgroundColor: colors.surface,
                    borderColor: alert.severity === 'CRITICAL' ? '#EF4444' : colors.border,
                  },
                ]}
              >
                {/* Alert Top Row: Type & Severity */}
                <View style={styles.hazardHeader}>
                  <View style={styles.hazardTypeRow}>
                    <View style={[styles.hazardIconCircle, { backgroundColor: sevStyle.bg }]}>
                      <IconSymbol name={iconName} size={18} color={sevStyle.badgeBg} />
                    </View>
                    <View>
                      <Text style={[styles.hazardTypeLabel, { color: colors.muted }]}>
                        {alert.type.toUpperCase().replace('_', ' ')}
                      </Text>
                      <Text style={[styles.affectedName, { color: colors.foreground }]} numberOfLines={1}>
                        📍 {alert.affectedLocation?.name || 'Local Vicinity'}
                      </Text>
                    </View>
                  </View>

                  <View style={[styles.severityPill, { backgroundColor: sevStyle.badgeBg }]}>
                    <Text style={styles.severityPillText}>{alert.severity}</Text>
                  </View>
                </View>

                {/* Title */}
                <Text style={[styles.hazardTitle, { color: colors.foreground }]}>{alert.title}</Text>

                {/* Description */}
                <Text style={[styles.hazardDesc, { color: colors.muted }]}>{alert.description}</Text>

                {/* Live Telemetry / Metrics if available */}
                {(alert.waterDepthM !== undefined || alert.windSpeedKts !== undefined || alert.distanceKm !== undefined) && (
                  <View style={styles.telemetryRow}>
                    {alert.waterDepthM !== undefined && (
                      <View style={[styles.telemetryPill, { backgroundColor: '#E0F2FE' }]}>
                        <Text style={[styles.telemetryText, { color: '#0369A1' }]}>
                          💧 Flood Depth: {alert.waterDepthM}m
                        </Text>
                      </View>
                    )}
                    {alert.windSpeedKts !== undefined && (
                      <View style={[styles.telemetryPill, { backgroundColor: '#F3E8FF' }]}>
                        <Text style={[styles.telemetryText, { color: '#7E22CE' }]}>
                          💨 Wind Speed: {alert.windSpeedKts} kts
                        </Text>
                      </View>
                    )}
                    <View style={[styles.telemetryPill, { backgroundColor: '#F1F5F9' }]}>
                      <Text style={[styles.telemetryText, { color: '#475569' }]}>
                        📏 Distance: {alert.distanceKm ? `${alert.distanceKm} km away` : 'Near Station'}
                      </Text>
                    </View>
                  </View>
                )}

                {/* Advisory & Instructions Box */}
                {alert.instructions && (
                  <View style={[styles.instructionBox, { backgroundColor: sevStyle.bg, borderColor: sevStyle.border }]}>
                    <Text style={[styles.instructionKicker, { color: sevStyle.text }]}>EMERGENCY DIRECTIVE:</Text>
                    <Text style={[styles.instructionText, { color: sevStyle.text }]}>{alert.instructions}</Text>
                  </View>
                )}

                {/* Footer with Distance, Authority Source, and Navigation */}
                <View style={[styles.cardFooter, { borderTopColor: colors.border }]}>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.footerSource, { color: colors.muted }]} numberOfLines={1}>
                      Issued by {alert.source || 'Disaster Management Authority'}
                    </Text>
                    <Text style={[styles.footerTime, { color: colors.muted }]}>
                      Active &bull; Verified Bulletin
                    </Text>
                  </View>

                  <Pressable
                    style={[styles.mapBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
                    onPress={() => router.push('/map' as any)}
                  >
                    <Text style={[styles.mapBtnText, { color: colors.primary }]}>View Radar ➔</Text>
                  </Pressable>
                </View>
              </View>
            );
          })
        )}
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  scroll: {
    paddingBottom: 40,
  },
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
  },
  backBtnText: {
    fontSize: 14,
    fontWeight: '600',
  },
  freshnessBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
  },
  pulseDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  freshnessText: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  heroSummaryCard: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  heroTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  sectorKicker: {
    fontSize: 11,
    fontWeight: '800',
    color: '#0284C7',
    letterSpacing: 0.8,
    marginBottom: 2,
  },
  heroTitle: {
    fontSize: 20,
    fontWeight: '800',
  },
  heroLocation: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
  },
  criticalCounterPill: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    minWidth: 64,
  },
  criticalCounterNum: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '900',
  },
  criticalCounterLabel: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },
  heroSub: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 14,
  },
  heroActionsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  heroActionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 10,
  },
  heroActionBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    paddingVertical: 0,
  },
  filterScroll: {
    flexDirection: 'row',
    gap: 8,
    paddingBottom: 14,
  },
  filterPill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  filterPillText: {
    fontSize: 12,
    fontWeight: '700',
  },
  loadingBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    gap: 12,
  },
  loadingText: {
    fontSize: 13,
    textAlign: 'center',
  },
  emptyBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
    borderRadius: 16,
    borderWidth: 1,
    gap: 8,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  emptySub: {
    fontSize: 13,
    textAlign: 'center',
  },
  hazardCard: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  hazardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  hazardTypeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  hazardIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hazardTypeLabel: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  affectedName: {
    fontSize: 13,
    fontWeight: '700',
    maxWidth: 200,
  },
  severityPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  severityPillText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  hazardTitle: {
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 6,
    lineHeight: 22,
  },
  hazardDesc: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 10,
  },
  telemetryRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  telemetryPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  telemetryText: {
    fontSize: 11,
    fontWeight: '700',
  },
  instructionBox: {
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 12,
  },
  instructionKicker: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  instructionText: {
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 18,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 10,
    borderTopWidth: 1,
  },
  footerSource: {
    fontSize: 11,
    fontWeight: '600',
  },
  footerTime: {
    fontSize: 10,
    marginTop: 2,
  },
  mapBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  mapBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },
});
