/**
 * AEGIS Web Offline SOS Emergency Relay Service
 * Handles decoding of incoming offline SMS relay links and publishing
 * the victim's distress signal with the victim's location to the backend.
 */

export interface OfflineRelayData {
  caller_name: string;
  caller_phone?: string;
  latitude: number;
  longitude: number;
  accuracy_meters?: number;
  address?: string;
  district?: string;
  emergency_type?: string;
  short_message?: string;
  blood_group?: string;
  medical_notes?: string;
  timestamp: string;
  idempotency_key?: string;
}

export function decodeRelayPayload(encoded: string): OfflineRelayData | null {
  try {
    const raw = decodeURIComponent(encoded);
    let jsonStr = '';
    try {
      jsonStr = decodeURIComponent(escape(atob(raw)));
    } catch {
      jsonStr = atob(raw);
    }
    return JSON.parse(jsonStr) as OfflineRelayData;
  } catch (e) {
    try {
      return JSON.parse(decodeURIComponent(encoded)) as OfflineRelayData;
    } catch {
      console.warn('[OfflineRelay] Failed to decode relay token:', e);
      return null;
    }
  }
}

export function extractRelayPayloadFromUrl(): OfflineRelayData | null {
  if (typeof window === 'undefined') return null;
  const url = new URL(window.location.href);
  let token = url.searchParams.get('relay') || url.searchParams.get('d');
  
  if (!token && window.location.hash) {
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    token = hashParams.get('relay') || hashParams.get('d');
  }

  if (token) {
    return decodeRelayPayload(token);
  }
  return null;
}
