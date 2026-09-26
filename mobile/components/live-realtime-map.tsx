import React, { useEffect, useRef, useState } from "react";
import {
  StyleSheet,
  View,
  Text,
  Pressable,
  Platform,
  ActivityIndicator,
} from "react-native";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { EmergencyPlace, INUNDATION_ZONES } from "@/lib/navigation-data";
import { SasGridSector } from "@/lib/services/aegis-types";

export interface LiveCoordinate {
  latitude: number;
  longitude: number;
  accuracy?: number | null;
  altitude?: number | null;
  heading?: number | null;
  speed?: number | null;
  address?: string;
}

export interface ResponderLiveTrack {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  badge?: string;
  etaMinutes?: number;
  distanceKm?: number;
  status?: string;
}

export type GoogleMapLayerType = "roadmap" | "hybrid" | "terrain";

export const GOOGLE_MAP_LAYERS: Record<
  GoogleMapLayerType,
  { id: GoogleMapLayerType; name: string; shortName: string; url: string; icon: string; description: string }
> = {
  roadmap: {
    id: "roadmap",
    name: "Google Roadmap",
    shortName: "Roadmap",
    url: "https://mt{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}",
    icon: "🗺️",
    description: "Standard road vectors & evacuation corridors",
  },
  hybrid: {
    id: "hybrid",
    name: "Satellite Hybrid",
    shortName: "Satellite",
    url: "https://mt{s}.google.com/vt/lyrs=y&x={x}&y={y}&z={z}",
    icon: "🛰️",
    description: "High-resolution satellite imagery + roads",
  },
  terrain: {
    id: "terrain",
    name: "Topographic Terrain",
    shortName: "Terrain",
    url: "https://mt{s}.google.com/vt/lyrs=p&x={x}&y={y}&z={z}",
    icon: "⛰️",
    description: "Topographic elevation contours & watersheds",
  },
};

interface LiveRealtimeMapProps {
  userLocation: LiveCoordinate;
  places: EmergencyPlace[];
  selectedPlace: EmergencyPlace | null;
  onSelectPlace: (place: EmergencyPlace) => void;
  onRecenter: () => void;
  onMapClickLocation?: (lat: number, lng: number) => void;
  isLoadingLocation?: boolean;
  routeCoordinates?: [number, number][];
  routeDistanceKm?: number;
  routeDurationMin?: number;
  routingProvider?: string;
  isNavigating?: boolean;
  currentStepInstruction?: string;
  currentStepDistanceMeters?: number;
  activeStepNumber?: number;
  totalSteps?: number;
  activeCategoryFilter?: "all" | "hospital" | "hazard" | "shelter" | "sos" | "sasgrid";
  onSelectCategoryFilter?: (category: "all" | "hospital" | "hazard" | "shelter" | "sos" | "sasgrid") => void;
  sasGridSectors?: SasGridSector[];
  responderTrack?: ResponderLiveTrack | null;
  defaultLayer?: GoogleMapLayerType;
  fullScreen?: boolean;
  height?: string | number;
}

export const LiveRealtimeMap: React.FC<LiveRealtimeMapProps> = ({
  userLocation,
  places,
  selectedPlace,
  onSelectPlace,
  onRecenter,
  onMapClickLocation,
  isLoadingLocation = false,
  routeCoordinates,
  routeDistanceKm,
  routeDurationMin,
  routingProvider = "Google Maps Live Directions",
  isNavigating = false,
  currentStepInstruction,
  currentStepDistanceMeters,
  activeStepNumber = 1,
  totalSteps = 1,
  activeCategoryFilter = "all",
  onSelectCategoryFilter,
  sasGridSectors = [],
  responderTrack,
  defaultLayer = "roadmap",
  fullScreen = true,
  height,
}) => {
  const containerId = useRef(`gmaps-canvas-${Math.random().toString(36).substring(2, 9)}`).current;

  const [activeLayer, setActiveLayer] = useState<GoogleMapLayerType>(defaultLayer);
  const [showLayerMenu, setShowLayerMenu] = useState(false);

  const mapInstanceRef = useRef<any>(null);
  const tileLayerRef = useRef<any>(null);
  const userMarkerRef = useRef<any>(null);
  const placesGroupRef = useRef<any>(null);
  const hazardsLayerGroupRef = useRef<any>(null);
  const sasGridLayerGroupRef = useRef<any>(null);
  const routeGroupRef = useRef<any>(null);
  const responderGroupRef = useRef<any>(null);
  const userInteractedRef = useRef<boolean>(false);
  const hasAutoFittedRouteRef = useRef<string>("");

  const onMapClickLocationRef = useRef(onMapClickLocation);
  onMapClickLocationRef.current = onMapClickLocation;
  const userLocationRef = useRef(userLocation);
  userLocationRef.current = userLocation;
  const onSelectPlaceRef = useRef(onSelectPlace);
  onSelectPlaceRef.current = onSelectPlace;

  // 1. Initialize Leaflet Map with Google Maps Layer & Interactive Features
  useEffect(() => {
    if (Platform.OS !== "web") return;

    let isMounted = true;

    const initMap = async () => {
      // Inject Leaflet CSS
      if (!document.getElementById("leaflet-css")) {
        const link = document.createElement("link");
        link.id = "leaflet-css";
        link.rel = "stylesheet";
        link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
        document.head.appendChild(link);
      }

      // Load Leaflet JS
      if (!(window as any).L) {
        await new Promise((resolve) => {
          const script = document.createElement("script");
          script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
          script.onload = resolve;
          document.head.appendChild(script);
        });
      }

      const L = (window as any).L;
      if (!L || !isMounted) return;

      const container = document.getElementById(containerId);
      if (!container || mapInstanceRef.current) return;

      const { latitude, longitude } = userLocationRef.current;
      const map = L.map(container, {
        center: [latitude, longitude],
        zoom: 15,
        zoomControl: false,
        attributionControl: false,
      });

      mapInstanceRef.current = map;

      // Official Google Maps Tile Layer
      const layerConfig = GOOGLE_MAP_LAYERS[activeLayer] || GOOGLE_MAP_LAYERS.roadmap;
      tileLayerRef.current = L.tileLayer(layerConfig.url, {
        maxZoom: 21,
        subdomains: ["0", "1", "2", "3"],
      }).addTo(map);

      // Layer Groups for clean incremental updates
      hazardsLayerGroupRef.current = L.layerGroup().addTo(map);
      sasGridLayerGroupRef.current = L.layerGroup().addTo(map);
      placesGroupRef.current = L.layerGroup().addTo(map);
      routeGroupRef.current = L.layerGroup().addTo(map);
      responderGroupRef.current = L.layerGroup().addTo(map);

      // Capture user manual panning and zooming to preserve view during 30s auto-refreshes
      map.on("dragstart zoomstart movestart", () => {
        userInteractedRef.current = true;
      });

      // Map Click to drop a custom pin anywhere like Google Maps
      map.on("click", (e: any) => {
        if (onMapClickLocationRef.current && e.latlng) {
          onMapClickLocationRef.current(e.latlng.lat, e.latlng.lng);
        }
      });

      // Iconic Google Maps Live Blue Navigation Dot with Pulsing Radar
      const userIcon = L.divIcon({
        className: "gmaps-user-dot",
        html: `
          <div style="position:relative; width:44px; height:44px; display:flex; align-items:center; justify-content:center;">
            <div style="position:absolute; width:44px; height:44px; border-radius:50%; background:rgba(66, 133, 244, 0.25); animation: gmapRadar 2s infinite cubic-bezier(0.215, 0.61, 0.355, 1);"></div>
            <div style="position:absolute; width:26px; height:26px; border-radius:50%; background:rgba(66, 133, 244, 0.45);"></div>
            <div style="width:18px; height:18px; border-radius:50%; background:#1A73E8; border:3.5px solid #FFFFFF; box-shadow:0 3px 8px rgba(0,0,0,0.35); position:relative; z-index:4;"></div>
          </div>
          <style>
            @keyframes gmapRadar {
              0% { transform: scale(0.55); opacity: 1; }
              100% { transform: scale(2.5); opacity: 0; }
            }
          </style>
        `,
        iconSize: [44, 44],
        iconAnchor: [22, 22],
      });

      userMarkerRef.current = L.marker([latitude, longitude], { icon: userIcon })
        .addTo(map)
        .bindPopup(
          `<div style="font-family:Roboto, Arial, sans-serif; padding:6px; min-width:140px;">
            <div style="font-size:13px; font-weight:700; color:#1A73E8; display:flex; align-items:center; gap:4px;">
              <span>📍</span> Your Live GPS Location
            </div>
            <div style="font-size:11px; color:#5F6368; margin-top:2px;">
              ${latitude.toFixed(5)}°N, ${longitude.toFixed(5)}°E
            </div>
          </div>`
        );

      // Trigger map resize so it fills 100% of the viewport immediately
      setTimeout(() => {
        try {
          map.invalidateSize();
        } catch {}
      }, 150);

      window.addEventListener("resize", () => {
        try {
          map.invalidateSize();
        } catch {}
      });
    };

    initMap();

    return () => {
      isMounted = false;
      if (mapInstanceRef.current) {
        try {
          mapInstanceRef.current.remove();
        } catch {}
        mapInstanceRef.current = null;
      }
    };
  }, [containerId]);

  // 1b. Switch Tile Layer Dynamically (Roadmap / Satellite Hybrid / Terrain)
  useEffect(() => {
    if (tileLayerRef.current && mapInstanceRef.current) {
      const layerConfig = GOOGLE_MAP_LAYERS[activeLayer] || GOOGLE_MAP_LAYERS.roadmap;
      tileLayerRef.current.setUrl(layerConfig.url);
    }
  }, [activeLayer]);

  // 2. Update User Location Marker
  useEffect(() => {
    if (userMarkerRef.current && mapInstanceRef.current) {
      const { latitude, longitude } = userLocation;
      userMarkerRef.current.setLatLng([latitude, longitude]);
    }
  }, [userLocation]);

  // 3. Render Inundation & Hazard Danger Polygons on Map
  useEffect(() => {
    const L = (window as any).L;
    if (!L || !hazardsLayerGroupRef.current) return;

    hazardsLayerGroupRef.current.clearLayers();

    INUNDATION_ZONES.forEach((zone) => {
      if (!zone.coordinates || zone.coordinates.length === 0) return;

      const avgLat = zone.coordinates.reduce((sum, p) => sum + p[0], 0) / zone.coordinates.length;
      const avgLng = zone.coordinates.reduce((sum, p) => sum + p[1], 0) / zone.coordinates.length;
      const dLat = (avgLat - userLocation.latitude) * 111;
      const dLng = (avgLng - userLocation.longitude) * 111 * Math.cos((userLocation.latitude * Math.PI) / 180);
      const approxDistKm = Math.sqrt(dLat * dLat + dLng * dLng);

      if (approxDistKm > 25) return;

      const poly = L.polygon(zone.coordinates, {
        color: "#D93025",
        weight: 2,
        dashArray: "4, 4",
        fillColor: "#EA4335",
        fillOpacity: 0.28,
      });

      poly.bindPopup(`
        <div style="font-family:Roboto, sans-serif; padding:4px;">
          <b style="color:#D93025;">⛔ Hazard Inundation Area</b><br/>
          <span style="font-size:11px; color:#202124;">${zone.name}</span><br/>
          <span style="font-size:10px; color:#D93025; font-weight:700;">Water Depth: ~${zone.waterDepthM}m</span>
        </div>
      `);

      hazardsLayerGroupRef.current.addLayer(poly);
    });
  }, [userLocation.latitude, userLocation.longitude]);

  // 3b. Render SASGrid Sectors on Map
  useEffect(() => {
    const L = (window as any).L;
    if (!L || !sasGridLayerGroupRef.current) return;

    sasGridLayerGroupRef.current.clearLayers();

    if (!sasGridSectors || sasGridSectors.length === 0) return;

    sasGridSectors.forEach((sec: SasGridSector) => {
      const safetyIndex = sec.safetyIndex ?? 85;
      const sectorCode = sec.sectorCode || sec.sectorId || "GRID";
      const activeAlerts = sec.activeAlertsCount ?? 0;
      const isHealthy = safetyIndex >= 75;
      const isWarning = safetyIndex >= 50 && safetyIndex < 75;
      const strokeColor = isHealthy ? "#188038" : isWarning ? "#D97706" : "#D93025";
      const fillColor = isHealthy ? "#34A853" : isWarning ? "#FBBC04" : "#EA4335";

      if (sec.boundsPolygon && sec.boundsPolygon.length > 0) {
        const poly = L.polygon(sec.boundsPolygon, {
          color: strokeColor,
          weight: 2.5,
          dashArray: "6, 4",
          fillColor: fillColor,
          fillOpacity: 0.18,
        });

        poly.bindPopup(`
          <div style="font-family:Roboto, sans-serif; padding:5px; min-width:180px;">
            <div style="font-weight:800; font-size:12.5px; color:${strokeColor}; display:flex; align-items:center; gap:4px;">
              <span>🌐</span> ${sec.sectorName}
            </div>
            <div style="font-size:11px; font-weight:700; color:#202124; margin-top:3px;">
              Sector Code: <code>${sectorCode}</code>
            </div>
            <div style="font-size:11px; color:#5F6368; margin-top:2px;">
              Safety Score: <b style="color:${strokeColor};">${safetyIndex}/100</b> • Status: <b>${sec.status}</b>
            </div>
            ${sec.weatherSummary ? `<div style="font-size:10px; color:#3C4043; margin-top:3px; background:#F1F3F4; padding:3px 6px; border-radius:4px;">${sec.weatherSummary}</div>` : ""}
          </div>
        `);

        sasGridLayerGroupRef.current.addLayer(poly);
      }

      // Add center marker
      const centerIcon = L.divIcon({
        className: `sasgrid-node-${sec.id || sectorCode}`,
        html: `
          <div style="background:${strokeColor}; color:#FFFFFF; font-family:Roboto, sans-serif; font-weight:800; font-size:10px; padding:2px 6px; border-radius:10px; border:1.5px solid #FFFFFF; box-shadow:0 2px 6px rgba(0,0,0,0.3); display:flex; align-items:center; gap:3px; white-space:nowrap;">
            <span>🌐</span> ${sectorCode.split("-").slice(-1)[0] || "GRID"}
          </div>
        `,
        iconSize: [60, 24],
        iconAnchor: [30, 12],
      });

      const centerMarker = L.marker([sec.centerCoordinates.latitude, sec.centerCoordinates.longitude], {
        icon: centerIcon,
      });

      centerMarker.bindPopup(`
        <div style="font-family:Roboto, sans-serif; padding:5px; min-width:160px;">
          <b style="color:${strokeColor};">SASGrid Telemetry Node</b><br/>
          <span style="font-size:11px; font-weight:700;">${sec.sectorName}</span><br/>
          <span style="font-size:10px; color:#5F6368;">Safety Score: ${safetyIndex}/100</span><br/>
          <span style="font-size:10px; color:#5F6368;">Active Alerts: ${activeAlerts}</span>
        </div>
      `);

      sasGridLayerGroupRef.current.addLayer(centerMarker);
    });
  }, [sasGridSectors]);

  // 3c. Render Live Responder Marker (When Active)
  useEffect(() => {
    const L = (window as any).L;
    if (!L || !responderGroupRef.current) return;

    responderGroupRef.current.clearLayers();

    if (!responderTrack) return;

    const respIcon = L.divIcon({
      className: `gmaps-responder-marker`,
      html: `
        <div style="position:relative; width:46px; height:46px; display:flex; align-items:center; justify-content:center;">
          <div style="position:absolute; width:46px; height:46px; border-radius:50%; background:rgba(24, 128, 56, 0.25); animation: gmapRadar 1.8s infinite cubic-bezier(0.215, 0.61, 0.355, 1);"></div>
          <div style="width:30px; height:30px; border-radius:50%; background:#188038; border:3px solid #FFFFFF; box-shadow:0 3px 8px rgba(0,0,0,0.35); display:flex; align-items:center; justify-content:center; color:#FFFFFF; font-size:15px; position:relative; z-index:5;">
            🚑
          </div>
          <div style="position:absolute; top:-22px; background:#188038; color:#FFFFFF; font-family:Roboto, sans-serif; font-weight:800; font-size:10px; padding:2px 6px; border-radius:8px; border:1px solid #FFFFFF; white-space:nowrap; box-shadow:0 2px 4px rgba(0,0,0,0.25);">
            ${responderTrack.etaMinutes ? `~${responderTrack.etaMinutes}m ETA` : "RESPONDER"}
          </div>
        </div>
      `,
      iconSize: [46, 46],
      iconAnchor: [23, 23],
    });

    const marker = L.marker([responderTrack.latitude, responderTrack.longitude], {
      icon: respIcon,
    });

    marker.bindPopup(`
      <div style="font-family:Roboto, sans-serif; padding:5px; min-width:160px;">
        <div style="color:#188038; font-weight:800; font-size:12px;">🚑 Active Responder En-Route</div>
        <div style="font-size:12px; font-weight:700; margin-top:2px;">${responderTrack.name}</div>
        <div style="font-size:10.5px; color:#5F6368; margin-top:2px;">${responderTrack.badge || "Verified First Responder"}</div>
        ${responderTrack.etaMinutes ? `<div style="font-size:11px; font-weight:700; color:#188038; margin-top:3px;">Estimated Arrival: ~${responderTrack.etaMinutes} mins (${responderTrack.distanceKm || 1.2} km)</div>` : ""}
      </div>
    `);

    responderGroupRef.current.addLayer(marker);
  }, [responderTrack]);

  // 4. Update Destination Markers: Hospitals, Hazards, Shelters, and Authentic SOS Pins
  useEffect(() => {
    const L = (window as any).L;
    if (!L || !placesGroupRef.current) return;

    placesGroupRef.current.clearLayers();

    const filteredPlaces = places.filter((p) => {
      if (activeCategoryFilter === "all") return true;
      return p.category === activeCategoryFilter;
    });

    filteredPlaces.forEach((place) => {
      const isSelected = selectedPlace?.id === place.id;

      // Distinct Blinking Red Circle Named SOS with expanding radar wave rings
      if (place.category === "sos") {
        const isEnRoute = place.status?.includes("RESPONDER") || place.status?.includes("EN ROUTE") || place.status?.includes("AID");
        const sosIcon = L.divIcon({
          className: `sos-blinking-marker-${place.id}`,
          html: `
            <div style="position:relative; width:58px; height:58px; cursor:pointer; display:flex; align-items:center; justify-content:center;">
              <!-- Pulsing Expanding Red Radar Wave Rings -->
              <div style="position:absolute; width:58px; height:58px; border-radius:50%; background:rgba(220, 38, 38, 0.32); animation: sosRadarRing 1.8s infinite ease-out;"></div>
              <div style="position:absolute; width:42px; height:42px; border-radius:50%; background:rgba(220, 38, 38, 0.5); animation: sosRadarRing 1.8s infinite ease-out 0.45s;"></div>

              <!-- Inner Blinking Solid Red Circle Named SOS -->
              <div style="width:36px; height:36px; border-radius:50%; background:#DC2626; border:3px solid #FFFFFF; box-shadow:0 4px 12px rgba(220,38,38,0.7); display:flex; flex-direction:column; align-items:center; justify-content:center; z-index:5; animation: sosBlinkGlow 1.2s infinite alternate;">
                <span style="color:#FFFFFF; font-family:system-ui, -apple-system, sans-serif; font-weight:900; font-size:11px; letter-spacing:0.8px; line-height:1;">SOS</span>
              </div>

              <!-- Top Floating Distance & Status Badge -->
              <div style="position:absolute; top:-24px; background:#DC2626; color:#FFFFFF; font-family:system-ui, -apple-system, sans-serif; font-weight:900; font-size:10px; padding:2px 8px; border-radius:12px; border:1.5px solid #FFFFFF; white-space:nowrap; box-shadow:0 2px 6px rgba(0,0,0,0.35); z-index:6;">
                ${place.distanceKm ? `${place.distanceKm} km` : "SOS"} • ${isEnRoute ? "AID EN ROUTE" : "NEEDS HELP"}
              </div>
            </div>
            <style>
              @keyframes sosRadarRing {
                0% { transform: scale(0.5); opacity: 1; }
                100% { transform: scale(2.4); opacity: 0; }
              }
              @keyframes sosBlinkGlow {
                0% { transform: scale(0.95); filter: brightness(1); box-shadow: 0 0 4px rgba(220,38,38,0.5); }
                100% { transform: scale(1.1); filter: brightness(1.3); box-shadow: 0 0 16px rgba(220,38,38,0.9); }
              }
            </style>
          `,
          iconSize: [58, 58],
          iconAnchor: [29, 29],
        });

        const marker = L.marker([place.coordinates.lat, place.coordinates.lng], {
          icon: sosIcon,
        });

        marker.on("click", () => {
          onSelectPlaceRef.current(place);
        });

        placesGroupRef.current.addLayer(marker);
        return;
      }

      // Color coding per category
      let pinColor = "#1A73E8"; // Blue default
      let iconSymbol = "📍";
      let badgeTag = place.badge;

      if (place.category === "hospital") {
        pinColor = isSelected ? "#1A73E8" : "#188038";
        iconSymbol = "🏥";
        badgeTag = place.openBeds ? `${place.openBeds} beds` : "Hospital";
      } else if (place.category === "hazard") {
        pinColor = "#D93025"; // Red danger
        iconSymbol = "⛔";
        badgeTag = place.hazardDepthM ? `${place.hazardDepthM}m water` : "Danger";
      } else if (place.category === "shelter") {
        pinColor = isSelected ? "#EA4335" : "#5F6368";
        iconSymbol = "🛡️";
        badgeTag = `+${place.elevationMeters}m`;
      } else if ((place as any).category === "sos") {
        pinColor = "#DC2626"; // Vibrant Red
        iconSymbol = "🚨";
        badgeTag = place.badge || "ACTIVE SOS";
      } else if (place.category === "custom") {
        pinColor = "#EA4335"; // Google Maps red drop pin
        iconSymbol = "📍";
        badgeTag = "Destination";
      }

      const placeIcon = L.divIcon({
        className: `gmaps-pin-${place.id}`,
        html: `
          <div style="position:relative; width:44px; height:52px; cursor:pointer; display:flex; flex-direction:column; align-items:center;">
            <!-- Floating Place Label Badge -->
            <div style="position:absolute; top:-24px; background:#FFFFFF; color:#202124; font-family:Roboto, sans-serif; font-weight:700; font-size:10.5px; padding:2px 8px; border-radius:12px; box-shadow:0 2px 6px rgba(0,0,0,0.25); white-space:nowrap; border:${isSelected ? `2px solid ${pinColor}` : "1px solid #DADCE0"}; display:flex; align-items:center; gap:3px;">
              <span>${place.name.split(" ")[0]}</span>
              <span style="color:${pinColor}; font-size:9.5px; font-weight:800;">${badgeTag}</span>
            </div>

            <!-- Google Maps Teardrop Marker Pin -->
            <svg width="34" height="46" viewBox="0 0 384 512" style="filter: drop-shadow(0 3px 6px rgba(0,0,0,0.35));">
              <path fill="${pinColor}" d="M172.268 501.67C26.97 291.031 0 269.413 0 192 0 85.961 85.961 0 192 0s192 85.961 192 192c0 77.413-26.97 99.031-172.268 309.67-9.535 13.774-29.93 13.773-39.464 0z"/>
              <circle fill="#FFFFFF" cx="192" cy="192" r="75"/>
              <text x="192" y="218" font-size="68" font-weight="900" fill="${pinColor}" text-anchor="middle" font-family="sans-serif">${iconSymbol}</text>
            </svg>
          </div>
        `,
        iconSize: [44, 52],
        iconAnchor: [22, 50],
      });

      const marker = L.marker([place.coordinates.lat, place.coordinates.lng], {
        icon: placeIcon,
      });

      marker.on("click", () => {
        onSelectPlaceRef.current(place);
      });

      placesGroupRef.current.addLayer(marker);
    });
  }, [places, selectedPlace, activeCategoryFilter]);

  // 5. Update Google Maps Blue Route Polyline
  useEffect(() => {
    const L = (window as any).L;
    if (!L || !routeGroupRef.current || !mapInstanceRef.current) return;

    routeGroupRef.current.clearLayers();

    // Only draw route if explicit routeCoordinates provided or local destination selected (<35km)
    let pathPoints: [number, number][] = [];
    if (routeCoordinates && routeCoordinates.length > 0) {
      pathPoints = routeCoordinates;
    } else if (selectedPlace) {
      const dLat = Math.abs(userLocation.latitude - selectedPlace.coordinates.lat);
      const dLng = Math.abs(userLocation.longitude - selectedPlace.coordinates.lng);
      // Rough distance check: if within ~0.35 degrees (~38 km), draw local connector
      if (dLat < 0.35 && dLng < 0.35) {
        pathPoints = [
          [userLocation.latitude, userLocation.longitude],
          [selectedPlace.coordinates.lat, selectedPlace.coordinates.lng],
        ];
      }
    }

    if (pathPoints.length > 0) {
      // Outer Dark Blue Border Casing (Google Maps Style)
      const casingLine = L.polyline(pathPoints, {
        color: "#185ABC",
        weight: 8,
        opacity: 0.9,
        lineCap: "round",
        lineJoin: "round",
      });
      routeGroupRef.current.addLayer(casingLine);

      // Google Maps Royal Blue Navigation Line
      const routeLine = L.polyline(pathPoints, {
        color: "#4285F4",
        weight: 5.5,
        opacity: 1.0,
        lineCap: "round",
        lineJoin: "round",
      });
      routeGroupRef.current.addLayer(routeLine);

      const routeSig = pathPoints.map(p => `${p[0].toFixed(3)},${p[1].toFixed(3)}`).join("|");
      const isNewRoute = hasAutoFittedRouteRef.current !== routeSig;

      // Only auto-fit camera bounds on initial destination selection, NOT during 30s periodic auto-refresh
      if (isNewRoute && !userInteractedRef.current) {
        hasAutoFittedRouteRef.current = routeSig;
        try {
          const bounds = L.latLngBounds(pathPoints);
          mapInstanceRef.current.fitBounds(bounds, {
            padding: [45, 45],
            maxZoom: 16,
            animate: false,
          });
        } catch {}
      }
    }
  }, [routeCoordinates, selectedPlace, userLocation.latitude, userLocation.longitude]);

  const handleZoomIn = () => {
    if (mapInstanceRef.current) {
      try {
        mapInstanceRef.current.zoomIn();
      } catch {}
    }
  };

  const handleZoomOut = () => {
    if (mapInstanceRef.current) {
      try {
        mapInstanceRef.current.zoomOut();
      } catch {}
    }
  };

  const handleRecenterClick = () => {
    userInteractedRef.current = false;
    hasAutoFittedRouteRef.current = "";
    if (mapInstanceRef.current) {
      try {
        mapInstanceRef.current.setView(
          [userLocation.latitude, userLocation.longitude],
          16,
          { animate: true }
        );
      } catch {}
    }
    onRecenter();
  };

  const mapHeightStyle = height
    ? { height }
    : fullScreen
    ? { flex: 1, width: "100%", height: "100%" }
    : { height: isNavigating ? 340 : 310 };

  return (
    <View
      style={[
        fullScreen ? styles.fullScreenContainer : styles.mapCard,
        {
          backgroundColor: "#FFFFFF",
          borderColor: fullScreen ? "transparent" : "#DADCE0",
        },
      ]}
    >
      {/* Top Header Filter Chips Bar on Map (shown only if not fullScreen or when explicitly filtered) */}
      {!fullScreen && (
      <View style={styles.categoryFilterRow}>
        <Pressable
          style={[
            styles.filterChip,
            activeCategoryFilter === "all" && styles.filterChipActive,
          ]}
          onPress={() => onSelectCategoryFilter && onSelectCategoryFilter("all")}
        >
          <Text
            style={[
              styles.filterChipText,
              activeCategoryFilter === "all" && styles.filterChipTextActive,
            ]}
          >
            🌟 All
          </Text>
        </Pressable>

        <Pressable
          style={[
            styles.filterChip,
            activeCategoryFilter === "hospital" && styles.filterChipActiveBlue,
          ]}
          onPress={() => onSelectCategoryFilter && onSelectCategoryFilter("hospital")}
        >
          <Text
            style={[
              styles.filterChipText,
              activeCategoryFilter === "hospital" && styles.filterChipTextActiveBlue,
            ]}
          >
            🏥 Hospitals & ER
          </Text>
        </Pressable>

        <Pressable
          style={[
            styles.filterChip,
            activeCategoryFilter === "hazard" && styles.filterChipActiveRed,
          ]}
          onPress={() => onSelectCategoryFilter && onSelectCategoryFilter("hazard")}
        >
          <Text
            style={[
              styles.filterChipText,
              activeCategoryFilter === "hazard" && styles.filterChipTextActiveRed,
            ]}
          >
            ⚠️ Hazard Zones
          </Text>
        </Pressable>

        <Pressable
          style={[
            styles.filterChip,
            activeCategoryFilter === "shelter" && styles.filterChipActive,
          ]}
          onPress={() => onSelectCategoryFilter && onSelectCategoryFilter("shelter")}
        >
          <Text
            style={[
              styles.filterChipText,
              activeCategoryFilter === "shelter" && styles.filterChipTextActive,
            ]}
          >
            🛡️ Safe Havens
          </Text>
        </Pressable>

        <Pressable
          style={[
            styles.filterChip,
            activeCategoryFilter === "sos" && styles.filterChipActiveRed,
          ]}
          onPress={() => onSelectCategoryFilter && onSelectCategoryFilter("sos")}
        >
          <Text
            style={[
              styles.filterChipText,
              activeCategoryFilter === "sos" && styles.filterChipTextActiveRed,
            ]}
          >
            🚨 SOS Map
          </Text>
        </Pressable>
      </View>
      )}

      {/* Google Maps Navigation Mode Green HUD Banner (When Active) */}
      {isNavigating && (
        <View style={styles.gmapsNavGreenBanner}>
          <View style={styles.gmapsManeuverIconCircle}>
            <IconSymbol
              name="arrow.triangle.turn.up.right.diamond.fill"
              size={24}
              color="#FFFFFF"
            />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.gmapsManeuverDist}>
              {currentStepDistanceMeters !== undefined ? `${currentStepDistanceMeters} m` : "180 m"}
            </Text>
            <Text numberOfLines={2} style={styles.gmapsManeuverText}>
              {currentStepInstruction || `Head along route towards ${selectedPlace?.name}`}
            </Text>
          </View>
          <View style={styles.stepCounterPill}>
            <Text style={styles.stepCounterText}>
              {activeStepNumber}/{totalSteps}
            </Text>
          </View>
        </View>
      )}

      {/* Real-time Map Canvas View */}
      <View style={[styles.mapViewport, fullScreen && styles.fullScreenViewport]}>
        {Platform.OS === "web" ? (
          <div
            id={containerId}
            style={{
              width: "100%",
              height: "100%",
              minHeight: fullScreen ? "100vh" : isNavigating ? "340px" : "310px",
              position: fullScreen ? "absolute" : "relative",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: "#E8EAED",
              zIndex: 1,
            }}
          />
        ) : (
          <View style={styles.nativeFallback}>
            <IconSymbol name="map.fill" size={38} color="#1A73E8" />
            <Text style={styles.nativeTitle}>Google Maps Route Active</Text>
            <Text style={styles.nativeSub}>
              {routeDistanceKm} km • ~{routeDurationMin} min to {selectedPlace?.name}
            </Text>
          </View>
        )}



        {/* Google Maps Trip ETA Floating Pill (Bottom Left of Canvas) */}
        {routeDistanceKm !== undefined && !isNavigating && (
          <View style={styles.gmapsFloatingEtaPill}>
            <View style={styles.etaCol}>
              <Text style={styles.etaDurationText}>
                {routeDurationMin} <Text style={{ fontSize: 11, fontWeight: "600" }}>min</Text>
              </Text>
              <Text style={styles.etaMetaText}>
                {routeDistanceKm} km • {routingProvider}
              </Text>
            </View>
          </View>
        )}

        {/* Floating Single Location Refresh Button (Bottom Right) */}
        <View style={styles.floatingControlsContainer}>
          <Pressable
            style={styles.gmapFabButton}
            onPress={handleRecenterClick}
            accessibilityLabel="Refresh Location"
          >
            {isLoadingLocation ? (
              <ActivityIndicator size="small" color="#1A73E8" />
            ) : (
              <IconSymbol name="location.fill" size={18} color="#1A73E8" />
            )}
          </Pressable>
        </View>
      </View>

      {/* Google Maps Bottom Place Card */}
      {selectedPlace && (
        <View style={styles.placeFooterSheet}>
          <View style={styles.placeInfoRow}>
            <View style={{ flex: 1 }}>
              <View style={styles.placeTitleRow}>
                <Text numberOfLines={1} style={styles.placeTitle}>
                  {selectedPlace.name}
                </Text>
                <View
                  style={[
                    styles.categoryTagPill,
                    {
                      backgroundColor:
                        selectedPlace.category === "hospital"
                          ? "#E8F0FE"
                          : selectedPlace.category === "hazard"
                          ? "#FCE8E6"
                          : selectedPlace.category === "sos"
                          ? "#FEE2E2"
                          : "#E6F4EA",
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.categoryTagText,
                      {
                        color:
                          selectedPlace.category === "hospital"
                            ? "#1A73E8"
                            : selectedPlace.category === "hazard"
                            ? "#D93025"
                            : selectedPlace.category === "sos"
                            ? "#DC2626"
                            : "#188038",
                      },
                    ]}
                  >
                    {selectedPlace.type}
                  </Text>
                </View>
              </View>

              <View style={styles.placeTagsRow}>
                {selectedPlace.statusColor && (
                  <View
                    style={[
                      styles.statusDotSmall,
                      { backgroundColor: selectedPlace.statusColor },
                    ]}
                  />
                )}
                <Text
                  style={[
                    styles.placeStatus,
                    selectedPlace.category === "hazard" && { color: "#D93025", fontWeight: "700" },
                    selectedPlace.category === "sos" && { color: "#DC2626", fontWeight: "800" },
                  ]}
                >
                  {selectedPlace.status}
                </Text>
                <Text style={styles.placeDot}>•</Text>
                <Text style={styles.placeElevation}>+{selectedPlace.elevationMeters}m MSL</Text>
              </View>
            </View>

            <View style={styles.etaBadgeSmall}>
              <Text style={styles.etaBadgeTime}>{routeDurationMin || 12} min</Text>
              <Text style={styles.etaBadgeDist}>{routeDistanceKm || 2.4} km</Text>
            </View>
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  fullScreenContainer: {
    flex: 1,
    width: "100%",
    height: "100%",
    position: "relative",
    borderWidth: 0,
    borderRadius: 0,
    marginBottom: 0,
    overflow: "hidden",
  },
  fullScreenViewport: {
    flex: 1,
    width: "100%",
    height: "100%",
    position: "relative",
  },
  mapCard: {
    borderRadius: 20,
    borderWidth: 1,
    overflow: "hidden",
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 3,
  },
  categoryFilterRow: {
    flexDirection: "row",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E8EAED",
    overflow: "scroll",
  },
  filterChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    backgroundColor: "#F1F3F4",
    borderWidth: 1,
    borderColor: "#DADCE0",
  },
  filterChipActive: {
    backgroundColor: "#E8F0FE",
    borderColor: "#1A73E8",
  },
  filterChipActiveBlue: {
    backgroundColor: "#E8F0FE",
    borderColor: "#1A73E8",
  },
  filterChipActiveRed: {
    backgroundColor: "#FCE8E6",
    borderColor: "#D93025",
  },
  filterChipText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#5F6368",
  },
  filterChipTextActive: {
    color: "#1A73E8",
  },
  filterChipTextActiveBlue: {
    color: "#1A73E8",
  },
  filterChipTextActiveRed: {
    color: "#D93025",
  },
  gmapsNavGreenBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#0D652D",
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 12,
    zIndex: 10,
  },
  gmapsManeuverIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#188038",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.4)",
  },
  gmapsManeuverDist: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "900",
  },
  gmapsManeuverText: {
    color: "rgba(255,255,255,0.92)",
    fontSize: 11.5,
    fontWeight: "600",
    marginTop: 1,
  },
  stepCounterPill: {
    backgroundColor: "rgba(0,0,0,0.25)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  stepCounterText: {
    color: "#FFFFFF",
    fontSize: 10.5,
    fontWeight: "800",
  },
  mapViewport: {
    position: "relative",
    width: "100%",
    overflow: "hidden",
  },
  nativeFallback: {
    height: 280,
    backgroundColor: "#F1F3F4",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  nativeTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: "#202124",
  },
  nativeSub: {
    fontSize: 11,
    color: "#5F6368",
  },
  topRightControls: {
    position: "absolute",
    top: 10,
    right: 10,
    zIndex: 1000,
    alignItems: "flex-end",
  },
  layerToggleButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.22,
    shadowRadius: 5,
    elevation: 4,
    borderWidth: 1,
    borderColor: "#DADCE0",
  },
  layerToggleButtonActive: {
    borderColor: "#1A73E8",
    backgroundColor: "#E8F0FE",
  },
  layerToggleIcon: {
    fontSize: 13,
  },
  layerToggleText: {
    fontSize: 11,
    fontWeight: "800",
    color: "#202124",
  },
  layerMenuPopover: {
    marginTop: 6,
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#DADCE0",
    padding: 6,
    width: 220,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
    gap: 4,
  },
  layerMenuItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 8,
  },
  layerMenuItemActive: {
    backgroundColor: "#E8F0FE",
  },
  layerMenuIcon: {
    fontSize: 16,
  },
  layerMenuTitle: {
    fontSize: 11.5,
    fontWeight: "800",
    color: "#202124",
  },
  layerMenuDesc: {
    fontSize: 9.5,
    color: "#5F6368",
    marginTop: 1,
  },
  gmapsFloatingEtaPill: {
    position: "absolute",
    bottom: 12,
    left: 12,
    zIndex: 1000,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 7,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
    borderWidth: 1,
    borderColor: "#DADCE0",
  },
  etaCol: {
    gap: 1,
  },
  etaDurationText: {
    fontSize: 15,
    fontWeight: "900",
    color: "#188038",
  },
  etaMetaText: {
    fontSize: 10,
    fontWeight: "600",
    color: "#5F6368",
  },
  floatingControlsContainer: {
    position: "absolute",
    bottom: 12,
    right: 12,
    zIndex: 1000,
    gap: 8,
    alignItems: "center",
  },
  gmapFabButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
    borderWidth: 1,
    borderColor: "#DADCE0",
  },
  zoomStack: {
    backgroundColor: "#FFFFFF",
    borderRadius: 10,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
    borderWidth: 1,
    borderColor: "#DADCE0",
  },
  zoomStackBtn: {
    width: 32,
    height: 30,
    alignItems: "center",
    justifyContent: "center",
  },
  zoomDivider: {
    height: 1,
    backgroundColor: "#E8EAED",
  },
  placeFooterSheet: {
    padding: 12,
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderTopColor: "#E8EAED",
  },
  placeInfoRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  placeTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  placeTitle: {
    fontSize: 13.5,
    fontWeight: "800",
    color: "#202124",
    maxWidth: "68%",
  },
  categoryTagPill: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  categoryTagText: {
    fontSize: 9.5,
    fontWeight: "800",
  },
  placeTagsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginTop: 3,
  },
  statusDotSmall: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  placeStatus: {
    fontSize: 10.5,
    fontWeight: "600",
    color: "#5F6368",
  },
  placeDot: {
    fontSize: 10,
    color: "#80868B",
  },
  placeElevation: {
    fontSize: 10.5,
    fontWeight: "600",
    color: "#5F6368",
  },
  etaBadgeSmall: {
    alignItems: "flex-end",
    backgroundColor: "#E8F0FE",
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 10,
  },
  etaBadgeTime: {
    fontSize: 12,
    fontWeight: "800",
    color: "#1A73E8",
  },
  etaBadgeDist: {
    fontSize: 9.5,
    fontWeight: "600",
    color: "#5F6368",
  },
});
