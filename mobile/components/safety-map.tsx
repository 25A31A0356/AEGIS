import React, { useState } from "react";
import { StyleSheet, View } from "react-native";
import { TacticalEvacuationMap } from "@/components/tactical-evacuation-map";
import {
  DEFAULT_USER_LOCATION,
  VERIFIED_SHELTERS,
  EVACUATION_ROUTES,
  VerifiedShelter,
} from "@/lib/navigation-data";

export type SafetyMapProps = {
  region: {
    latitude: number;
    longitude: number;
    latitudeDelta: number;
    longitudeDelta: number;
  };
  markers: {
    latitude: number;
    longitude: number;
    title: string;
    description: string;
  }[];
};

export default function SafetyMap({ region }: SafetyMapProps) {
  const [selectedRouteIdx, setSelectedRouteIdx] = useState(0);
  const [selectedShelter, setSelectedShelter] = useState<VerifiedShelter | null>(
    VERIFIED_SHELTERS[0]
  );

  const userLoc = {
    lat: region?.latitude || DEFAULT_USER_LOCATION.lat,
    lng: region?.longitude || DEFAULT_USER_LOCATION.lng,
    label: "Live Device Position",
  };

  return (
    <View style={styles.container}>
      <TacticalEvacuationMap
        userLocation={userLoc}
        shelters={VERIFIED_SHELTERS}
        selectedShelter={selectedShelter}
        onSelectShelter={setSelectedShelter}
        routes={EVACUATION_ROUTES}
        selectedRouteIndex={selectedRouteIdx}
        onSelectRouteIndex={setSelectedRouteIdx}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 12,
    paddingTop: 8,
  },
});
