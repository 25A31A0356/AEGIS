import React, { useState, useEffect } from 'react';
import {
  Navigation,
  Loader2,
  Crosshair,
} from 'lucide-react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { LocationService } from '../../services/locationService';

interface LocationPickerMapProps {
  location: {
    lat: number;
    lng: number;
    address: string;
    city: string;
    state: string;
    pincode?: string;
  };
  onChangeLocation: (loc: {
    lat: number;
    lng: number;
    address: string;
    city: string;
    state: string;
    pincode?: string;
  }) => void;
}

// Custom Marker Icon for incident pin
const IncidentMarkerIcon = L.divIcon({
  className: 'custom-incident-pin',
  html: `
    <div style="position: relative; display: flex; align-items: center; justify-content: center;">
      <div style="position: absolute; width: 32px; height: 32px; border-radius: 50%; background: rgba(233, 75, 104, 0.25); border: 2px solid #E94B68; animation: ping 1.5s cubic-bezier(0,0,0.2,1) infinite;"></div>
      <div style="width: 22px; height: 22px; border-radius: 50%; background: #E94B68; border: 3px solid #FFFFFF; box-shadow: 0 4px 10px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center;">
        <div style="width: 6px; height: 6px; border-radius: 50%; background: #FFFFFF;"></div>
      </div>
    </div>
  `,
  iconSize: [32, 32],
  iconAnchor: [16, 16],
});

// Map click & drag handler component
const MapClickHandler: React.FC<{
  onPositionChange: (lat: number, lng: number) => void;
}> = ({ onPositionChange }) => {
  useMapEvents({
    click(e) {
      onPositionChange(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
};

export const LocationPickerMap: React.FC<LocationPickerMapProps> = ({
  location,
  onChangeLocation,
}) => {
  const [isDetecting, setIsDetecting] = useState(false);
  const [addressInput, setAddressInput] = useState(location.address);

  useEffect(() => {
    setAddressInput(location.address);
  }, [location.address]);

  const handleUseCurrentLocation = () => {
    if (!('geolocation' in navigator)) {
      alert('Geolocation is not supported by your browser.');
      return;
    }

    setIsDetecting(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        try {
          const geo = await LocationService.reverseGeocode(lat, lng);
          const fullAddress = geo.readableAddress;
          onChangeLocation({
            lat,
            lng,
            address: fullAddress,
            city: geo.cityName,
            state: geo.stateName,
          });
        } catch {
          onChangeLocation({
            lat,
            lng,
            address: `GPS Location (${lat.toFixed(4)}° N, ${lng.toFixed(4)}° E)`,
            city: 'Local Area',
            state: 'India',
          });
        } finally {
          setIsDetecting(false);
        }
      },
      (err) => {
        alert(`Location permission denied or timed out: ${err.message}`);
        setIsDetecting(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleMapPinMoved = async (lat: number, lng: number) => {
    try {
      const geo = await LocationService.reverseGeocode(lat, lng);
      const fullAddress = geo.readableAddress;
      onChangeLocation({
        lat,
        lng,
        address: fullAddress,
        city: geo.cityName,
        state: geo.stateName,
      });
    } catch {
      onChangeLocation({
        ...location,
        lat,
        lng,
      });
    }
  };

  return (
    <div className="bg-white rounded-[24px] border border-[#DCEBED] p-5 sm:p-6 shadow-card mb-6">
      <div className="pb-3 mb-4 border-b border-[#DCEBED] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-base sm:text-lg font-bold text-[#18364A] font-sans">
            Step 2: Incident Location
          </h3>
          <p className="text-xs text-[#708696] mt-0.5">
            Pin the exact coordinates on the map or use your current device location.
          </p>
        </div>

        {/* Current Location Trigger */}
        <button
          type="button"
          onClick={handleUseCurrentLocation}
          disabled={isDetecting}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#075B8A] hover:bg-[#0B6E9E] text-white font-bold text-xs shadow-sm transition-all active:scale-98 shrink-0 self-start sm:self-auto"
        >
          {isDetecting ? (
            <Loader2 className="w-4 h-4 animate-spin text-[#18C3D0]" />
          ) : (
            <Navigation className="w-4 h-4 text-[#18C3D0]" />
          )}
          <span>{isDetecting ? 'Detecting GPS...' : 'Use Current Location'}</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Left: Interactive Mini Map */}
        <div className="lg:col-span-7 space-y-2">
          <div className="h-64 sm:h-72 w-full rounded-2xl overflow-hidden border border-[#DCEBED] relative shadow-inner">
            <MapContainer
              center={[location.lat, location.lng]}
              zoom={13}
              scrollWheelZoom={false}
              className="h-full w-full"
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <Marker
                position={[location.lat, location.lng]}
                icon={IncidentMarkerIcon}
                draggable={true}
                eventHandlers={{
                  dragend: (e) => {
                    const marker = e.target;
                    const position = marker.getLatLng();
                    handleMapPinMoved(position.lat, position.lng);
                  },
                }}
              />
              <MapClickHandler onPositionChange={handleMapPinMoved} />
            </MapContainer>

            {/* Map Instruction Overlay Pill */}
            <div className="absolute top-2.5 left-2.5 z-[1000] bg-white/90 backdrop-blur-xs px-2.5 py-1 rounded-full border border-[#DCEBED] shadow-xs text-[10px] font-mono text-[#075B8A] font-bold flex items-center gap-1.5 pointer-events-none">
              <Crosshair className="w-3 h-3 text-[#E94B68]" />
              <span>Click or drag pin to fine-tune</span>
            </div>
          </div>
        </div>

        {/* Right: Location Details & Address Input */}
        <div className="lg:col-span-5 space-y-3.5">
          {/* Coordinates Display Card */}
          <div className="bg-[#F4F8FA] p-3.5 rounded-2xl border border-[#DCEBED]">
            <span className="text-[10px] font-mono font-bold uppercase text-[#708696] block mb-1">
              Exact GPS Coordinates
            </span>
            <div className="font-mono text-xs font-bold text-[#075B8A] flex items-center justify-between">
              <span>Latitude: {location.lat.toFixed(5)}° N</span>
              <span>Longitude: {location.lng.toFixed(5)}° E</span>
            </div>
          </div>

          {/* Readable Address Textarea / Input */}
          <div>
            <label className="block text-[11px] font-mono font-bold uppercase text-[#708696] mb-1">
              Readable Address & Landmark
            </label>
            <textarea
              rows={3}
              value={addressInput}
              onChange={(e) => {
                setAddressInput(e.target.value);
                onChangeLocation({ ...location, address: e.target.value });
              }}
              placeholder="e.g., Near Cyber Towers Junction, Madhapur, Hyderabad, Telangana..."
              className="w-full p-3 bg-[#F4F8FA] border border-[#DCEBED] rounded-2xl text-xs text-[#18364A] placeholder:text-[#708696] focus:outline-none focus:border-[#18C3D0] focus:bg-white transition-colors"
            />
          </div>

          {/* State / City Tagging */}
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="p-2.5 rounded-xl bg-white border border-[#DCEBED]">
              <span className="text-[10px] text-[#708696] font-mono block">City / District</span>
              <span className="font-bold text-[#18364A] truncate block">{location.city || 'Local Sector'}</span>
            </div>
            <div className="p-2.5 rounded-xl bg-white border border-[#DCEBED]">
              <span className="text-[10px] text-[#708696] font-mono block">State</span>
              <span className="font-bold text-[#18364A] truncate block">{location.state || 'India'}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
