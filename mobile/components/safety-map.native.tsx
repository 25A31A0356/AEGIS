import React from "react";
import { StyleSheet } from "react-native";
import MapView, { Marker, Polyline } from "react-native-maps";

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

export default function SafetyMap({ region, markers }: SafetyMapProps) {
  return (
    <MapView
      style={styles.map}
      region={region}
      mapType="satellite"
      showsUserLocation
      showsMyLocationButton
    >
      <Marker coordinate={region} title="You are here" pinColor="#C73535" />
      {markers.map((marker) => (
        <Marker
          key={marker.title}
          coordinate={marker}
          title={marker.title}
          description={marker.description}
          pinColor="#0F5B66"
        />
      ))}
      {markers[0] && (
        <Polyline
          coordinates={[region, markers[0]]}
          strokeColor="#0F5B66"
          strokeWidth={4}
        />
      )}
    </MapView>
  );
}

const styles = StyleSheet.create({
  map: { flex: 1, marginTop: 10 },
});
