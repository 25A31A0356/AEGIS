/**
 * AEGIS Offline SOS Emergency Relay Service
 * Encodes offline distress data into a URL-safe compact payload for SMS dispatch.
 * When a family member with internet receives the SMS and clicks the link,
 * they can publish the SOS to the AEGIS Responder Network on behalf of the victim.
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

// Encode payload into URL-safe base64 string
export function encodeRelayPayload(data: OfflineRelayData): string {
  try {
    const jsonStr = JSON.stringify(data);
    // Base64 encoding compatible across react-native and web
    if (typeof btoa === 'function') {
      return encodeURIComponent(btoa(unescape(encodeURIComponent(jsonStr))));
    } else {
      // Buffer fallback
      return encodeURIComponent(Buffer.from(jsonStr, 'utf8').toString('base64'));
    }
  } catch (e) {
    console.warn('[OfflineRelay] Encoding error:', e);
    return encodeURIComponent(JSON.stringify(data));
  }
}

// Decode payload from URL-safe string
export function decodeRelayPayload(encoded: string): OfflineRelayData | null {
  try {
    const raw = decodeURIComponent(encoded);
    let jsonStr = '';
    if (typeof atob === 'function') {
      try {
        jsonStr = decodeURIComponent(escape(atob(raw)));
      } catch {
        jsonStr = atob(raw);
      }
    } else {
      jsonStr = Buffer.from(raw, 'base64').toString('utf8');
    }
    return JSON.parse(jsonStr) as OfflineRelayData;
  } catch (e) {
    try {
      return JSON.parse(decodeURIComponent(encoded)) as OfflineRelayData;
    } catch {
      console.warn('[OfflineRelay] Decoding failed:', e);
      return null;
    }
  }
}

// Generate the offline SMS message containing the relay link
export function buildOfflineRelaySmsMessage(
  data: OfflineRelayData,
  webBaseUrl: string = 'https://aegis-disaster.web.app'
): string {
  const token = encodeRelayPayload(data);
  const relayUrl = `${webBaseUrl}/?relay=${token}`;
  const coordsStr = `${data.latitude.toFixed(4)}, ${data.longitude.toFixed(4)}`;
  const place = data.address ? `${data.address} (${coordsStr})` : coordsStr;

  return `[AEGIS OFFLINE SOS] ${data.caller_name || 'Family Member'} is in DANGER at ${place}. Phone is OFFLINE without internet. Family: Tap link to publish SOS to AEGIS Responders: ${relayUrl}`;
}
