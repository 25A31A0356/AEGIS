// Dynamic React Native bridge for seamless Node.js server and Expo client execution
const getRNLinking = () => {
  try {
    return require('react-native').Linking;
  } catch {
    return null;
  }
};

const getRNPlatform = () => {
  try {
    return require('react-native').Platform;
  } catch {
    return { OS: 'web', select: (obj: any) => obj.default || obj.web };
  }
};
import { IndiaEmergencyService } from "./services/aegis-types";

/**
 * Verified National Emergency Helplines across India
 */
export const NATIONAL_EMERGENCY_SERVICES: IndiaEmergencyService[] = [
  {
    id: "in-nat-112",
    name: "National Emergency Number (ERSS)",
    category: "national_emergency",
    number: "112",
    smsNumber: "112",
    description: "Single unified emergency number for Police, Fire, Ambulance & Disaster Response across all States & UTs.",
    state: "All India",
    isNational: true,
    available24x7: true,
    website: "https://112.gov.in",
  },
  {
    id: "in-nat-police-100",
    name: "Police Emergency Helpline",
    category: "police",
    number: "100",
    alternateNumber: "112",
    description: "Direct law enforcement, crime prevention, civil safety and patrol response.",
    state: "All India",
    isNational: true,
    available24x7: true,
  },
  {
    id: "in-nat-med-108",
    name: "National Ambulance & Medical Emergency",
    category: "ambulance",
    number: "108",
    alternateNumber: "102",
    description: "24x7 Emergency Medical Dispatch, Critical Care Transport and Hospital Triage.",
    state: "All India",
    isNational: true,
    available24x7: true,
  },
  {
    id: "in-nat-fire-101",
    name: "Fire & Rescue Service",
    category: "fire",
    number: "101",
    alternateNumber: "112",
    description: "Fire control, trapped victim extraction, building collapse rescue and hazardous material response.",
    state: "All India",
    isNational: true,
    available24x7: true,
  },
  {
    id: "in-nat-women-1091",
    name: "Women in Distress Helpline",
    category: "women_safety",
    number: "1091",
    alternateNumber: "181",
    description: "National emergency support for women safety, distress intervention and legal/medical referral.",
    state: "All India",
    isNational: true,
    available24x7: true,
  },
  {
    id: "in-nat-ndma-1078",
    name: "National Disaster Management Authority (NDMA / NDRF)",
    category: "disaster_management",
    number: "1078",
    alternateNumber: "+91-11-24363260",
    description: "National emergency operation center for cyclones, floods, landslides, earthquakes & mass evacuation.",
    state: "All India",
    isNational: true,
    available24x7: true,
    website: "https://ndma.gov.in",
  },
  {
    id: "in-nat-child-1098",
    name: "Childline Emergency Helpline",
    category: "child_helpline",
    number: "1098",
    description: "National emergency phone outreach service for children in need of care and protection.",
    state: "All India",
    isNational: true,
    available24x7: true,
  },
  {
    id: "in-nat-cyber-1930",
    name: "National Cyber Fraud & Safety Helpline",
    category: "cyber_crime",
    number: "1930",
    description: "Indian Cyber Crime Coordination Centre (I4C) for financial fraud freeze & cyber safety.",
    state: "All India",
    isNational: true,
    available24x7: true,
    website: "https://cybercrime.gov.in",
  },
];

/**
 * State & UT Disaster Management Authorities across India
 */
export const STATE_DISASTER_SERVICES: IndiaEmergencyService[] = [
  {
    id: "in-sdma-ap",
    name: "APSDMA - Andhra Pradesh State Disaster Management",
    category: "state_disaster_authority",
    number: "1070",
    alternateNumber: "+91-863-2377700",
    description: "State Emergency Operations Center (SEOC) Tadepalli / Kunchanapalli for coastal cyclones, floods & relief.",
    state: "Andhra Pradesh",
    isNational: false,
    available24x7: true,
    coordinates: { latitude: 16.485, longitude: 80.603 },
    website: "https://apsdma.ap.gov.in",
  },
  {
    id: "in-sdma-tg",
    name: "TGSDMA - Telangana Disaster Management Authority",
    category: "state_disaster_authority",
    number: "1070",
    alternateNumber: "+91-40-23454088",
    description: "Telangana State Emergency Operation Center, Secretariat Hyderabad.",
    state: "Telangana",
    isNational: false,
    available24x7: true,
    coordinates: { latitude: 17.385, longitude: 78.4867 },
  },
  {
    id: "in-sdma-tn",
    name: "TNSDMA - Tamil Nadu State Disaster Management",
    category: "state_disaster_authority",
    number: "1070",
    alternateNumber: "+91-44-28593990",
    description: "State Emergency Operations Centre, Ezhilagam, Chepauk, Chennai.",
    state: "Tamil Nadu",
    isNational: false,
    available24x7: true,
    coordinates: { latitude: 13.0645, longitude: 80.2815 },
    website: "https://tnsdma.tn.gov.in",
  },
  {
    id: "in-sdma-ka",
    name: "KSDMA - Karnataka State Disaster Management",
    category: "state_disaster_authority",
    number: "1070",
    alternateNumber: "+91-80-22340676",
    description: "Karnataka State Disaster Monitoring Centre (KSNDMC), Bengaluru.",
    state: "Karnataka",
    isNational: false,
    available24x7: true,
    coordinates: { latitude: 12.9716, longitude: 77.5946 },
    website: "https://ksndmc.karnataka.gov.in",
  },
  {
    id: "in-sdma-kl",
    name: "KSDMA - Kerala State Disaster Management Authority",
    category: "state_disaster_authority",
    number: "1070",
    alternateNumber: "+91-471-2364424",
    description: "State Emergency Operations Centre, Observatory Hills, Vikas Bhavan, Thiruvananthapuram.",
    state: "Kerala",
    isNational: false,
    available24x7: true,
    coordinates: { latitude: 8.5241, longitude: 76.9366 },
    website: "https://sdma.kerala.gov.in",
  },
  {
    id: "in-sdma-mh",
    name: "MSDMA - Maharashtra State Disaster Management",
    category: "state_disaster_authority",
    number: "1070",
    alternateNumber: "+91-22-22027990",
    description: "State Disaster Management Cell, Mantralaya, Mumbai.",
    state: "Maharashtra",
    isNational: false,
    available24x7: true,
    coordinates: { latitude: 18.9288, longitude: 72.8286 },
    website: "https://rfd.maharashtra.gov.in",
  },
  {
    id: "in-sdma-od",
    name: "OSDMA - Odisha State Disaster Management Authority",
    category: "state_disaster_authority",
    number: "1070",
    alternateNumber: "+91-674-2395398",
    description: "Rajiv Bhawan, Bhubaneswar - Premier cyclone & coastal early warning network.",
    state: "Odisha",
    isNational: false,
    available24x7: true,
    coordinates: { latitude: 20.2961, longitude: 85.8245 },
    website: "https://osdma.org",
  },
  {
    id: "in-sdma-gj",
    name: "GSDMA - Gujarat State Disaster Management Authority",
    category: "state_disaster_authority",
    number: "1070",
    alternateNumber: "+91-79-23259283",
    description: "Block 11, 5th Floor, Udyog Bhavan, Gandhinagar.",
    state: "Gujarat",
    isNational: false,
    available24x7: true,
    coordinates: { latitude: 23.2156, longitude: 72.6369 },
    website: "https://gsdma.org",
  },
  {
    id: "in-sdma-dl",
    name: "DDMA - Delhi Disaster Management Authority",
    category: "state_disaster_authority",
    number: "1077",
    alternateNumber: "+91-11-23831077",
    description: "Revenue Department, 5 Sham Nath Marg, Delhi.",
    state: "Delhi",
    isNational: false,
    available24x7: true,
    coordinates: { latitude: 28.6712, longitude: 77.2255 },
    website: "https://ddma.delhi.gov.in",
  },
  {
    id: "in-sdma-wb",
    name: "WBDMA - West Bengal Disaster Management",
    category: "state_disaster_authority",
    number: "1070",
    alternateNumber: "+91-33-22143526",
    description: "Nabanna, 325 Sarat Chatterjee Road, Howrah / Kolkata.",
    state: "West Bengal",
    isNational: false,
    available24x7: true,
    coordinates: { latitude: 22.5958, longitude: 88.2636 },
  },
  {
    id: "in-sdma-up",
    name: "UPSDMA - Uttar Pradesh State Disaster Management",
    category: "state_disaster_authority",
    number: "1070",
    alternateNumber: "+91-522-2720285",
    description: "B2/3 Vibhuti Khand, Gomti Nagar, Lucknow.",
    state: "Uttar Pradesh",
    isNational: false,
    available24x7: true,
    coordinates: { latitude: 26.8467, longitude: 80.9462 },
    website: "https://upsdma.up.nic.in",
  },
  {
    id: "in-sdma-uk",
    name: "USDMA - Uttarakhand State Disaster Management",
    category: "state_disaster_authority",
    number: "1070",
    alternateNumber: "+91-135-2710334",
    description: "State Disaster Mitigation & Management Centre, Secretariat, Dehradun.",
    state: "Uttarakhand",
    isNational: false,
    available24x7: true,
    coordinates: { latitude: 30.3165, longitude: 78.0322 },
  },
  {
    id: "in-sdma-as",
    name: "ASDMA - Assam State Disaster Management Authority",
    category: "state_disaster_authority",
    number: "1070",
    alternateNumber: "+91-361-2237011",
    description: "Assam Secretariat Complex, Dispur, Guwahati.",
    state: "Assam",
    isNational: false,
    available24x7: true,
    coordinates: { latitude: 26.1433, longitude: 91.7898 },
  },
  {
    id: "in-sdma-br",
    name: "BSDMA - Bihar State Disaster Management Authority",
    category: "state_disaster_authority",
    number: "1070",
    alternateNumber: "+91-612-2547232",
    description: "Pant Bhawan, Bailey Road, Patna.",
    state: "Bihar",
    isNational: false,
    available24x7: true,
    coordinates: { latitude: 25.5941, longitude: 85.1376 },
  },
  {
    id: "in-sdma-rj",
    name: "Rajasthan Disaster Management & Relief",
    category: "state_disaster_authority",
    number: "1070",
    alternateNumber: "+91-141-2227296",
    description: "Government Secretariat, Jaipur.",
    state: "Rajasthan",
    isNational: false,
    available24x7: true,
    coordinates: { latitude: 26.9124, longitude: 75.7873 },
  },
  {
    id: "in-sdma-mp",
    name: "MPSDMA - Madhya Pradesh State Disaster Management",
    category: "state_disaster_authority",
    number: "1070",
    alternateNumber: "+91-755-2441419",
    description: "Paryavas Bhawan, Bhopal.",
    state: "Madhya Pradesh",
    isNational: false,
    available24x7: true,
    coordinates: { latitude: 23.2599, longitude: 77.4126 },
  },
];

/**
 * Complete directory of all 28 States & 8 Union Territories in India
 */
export const ALL_INDIAN_STATES_AND_UTS = [
  "Andhra Pradesh",
  "Arunachal Pradesh",
  "Assam",
  "Bihar",
  "Chhattisgarh",
  "Goa",
  "Gujarat",
  "Haryana",
  "Himachal Pradesh",
  "Jharkhand",
  "Karnataka",
  "Kerala",
  "Madhya Pradesh",
  "Maharashtra",
  "Manipur",
  "Meghalaya",
  "Mizoram",
  "Nagaland",
  "Odisha",
  "Punjab",
  "Rajasthan",
  "Sikkim",
  "Tamil Nadu",
  "Telangana",
  "Tripura",
  "Uttar Pradesh",
  "Uttarakhand",
  "West Bengal",
  "Andaman and Nicobar Islands",
  "Chandigarh",
  "Dadra and Nagar Haveli and Daman and Diu",
  "Delhi",
  "Jammu and Kashmir",
  "Ladakh",
  "Lakshadweep",
  "Puducherry",
] as const;

const STATE_CODE_MAP: Record<string, string> = {
  AP: "Andhra Pradesh",
  TG: "Telangana",
  TN: "Tamil Nadu",
  KA: "Karnataka",
  KL: "Kerala",
  MH: "Maharashtra",
  OD: "Odisha",
  GJ: "Gujarat",
  DL: "Delhi",
  WB: "West Bengal",
  UP: "Uttar Pradesh",
  UK: "Uttarakhand",
  AS: "Assam",
  BR: "Bihar",
  RJ: "Rajasthan",
  MP: "Madhya Pradesh",
};

/**
 * Get unified emergency services combining national helplines and regional authorities
 */
export function getAllIndiaEmergencyServices(selectedState?: string): IndiaEmergencyService[] {
  if (!selectedState || selectedState === "All India" || selectedState === "ALL") {
    return [...NATIONAL_EMERGENCY_SERVICES, ...STATE_DISASTER_SERVICES];
  }

  const resolvedState = STATE_CODE_MAP[selectedState.toUpperCase()] || selectedState;

  const matchedStateServices = STATE_DISASTER_SERVICES.filter(
    (s) => s.state?.toLowerCase().includes(resolvedState.toLowerCase())
  );

  return [...NATIONAL_EMERGENCY_SERVICES, ...matchedStateServices];
}

export const ALL_INDIA_EMERGENCY_SERVICES: IndiaEmergencyService[] = getAllIndiaEmergencyServices();

export const getIndiaEmergencyServicesData = (stateCode?: string): IndiaEmergencyService[] =>
  getAllIndiaEmergencyServices(stateCode);

/**
 * Action: Direct Phone Call Trigger
 */
export async function callEmergencyNumber(number: string): Promise<boolean> {
  const cleanNumber = number.replace(/[^0-9+]/g, "");
  if (!cleanNumber) return false;

  const url = `tel:${cleanNumber}`;
  try {
    const Linking = getRNLinking();
    if (Linking) {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
        return true;
      }
    }
  } catch (error) {
    console.warn(`[IndiaEmergency] Failed to open phone call to ${cleanNumber}:`, error);
  }
  return false;
}

/**
 * Action: Direct SMS Trigger with GPS
 */
export async function sendEmergencySms(number: string, message: string): Promise<boolean> {
  const cleanNumber = number.replace(/[^0-9+]/g, "");
  if (!cleanNumber) return false;

  const encodedBody = encodeURIComponent(message);
  const Platform = getRNPlatform();
  const separator = Platform.OS === "ios" ? "&" : "?";
  const url = `sms:${cleanNumber}${separator}body=${encodedBody}`;

  try {
    const Linking = getRNLinking();
    if (Linking) {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
        return true;
      }
    }
  } catch (error) {
    console.warn(`[IndiaEmergency] Failed to open SMS to ${cleanNumber}:`, error);
  }
  return false;
}

/**
 * Action: Open Navigation / Directions in Native Maps
 */
export async function navigateToEmergencyLocation(
  latitude: number,
  longitude: number,
  label?: string
): Promise<boolean> {
  const encodedLabel = encodeURIComponent(label || "Emergency Service Location");
  const Platform = getRNPlatform();
  const url = Platform.select({
    ios: `maps:0,0?q=${encodedLabel}@${latitude},${longitude}`,
    android: `geo:0,0?q=${latitude},${longitude}(${encodedLabel})`,
    default: `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`,
  });

  try {
    const Linking = getRNLinking();
    if (Linking) {
      await Linking.openURL(url);
      return true;
    }
  } catch (e) {
    console.warn("[IndiaEmergency] Failed to open external navigation:", e);
    return false;
  }
  return false;
}

/**
 * Date/Time Formatting in Indian Standard Time (IST - UTC+5:30)
 */
export function formatISTDateTime(isoStringOrTimestamp: string | number | Date): {
  dateStr: string;
  timeStr: string;
  fullFormatted: string;
  relative: string;
} {
  try {
    const date = new Date(isoStringOrTimestamp);
    if (isNaN(date.getTime())) {
      return { dateStr: "--", timeStr: "--", fullFormatted: "Unknown", relative: "Recent" };
    }

    // Convert to IST representation
    const optionsDate: Intl.DateTimeFormatOptions = {
      timeZone: "Asia/Kolkata",
      day: "numeric",
      month: "short",
      year: "numeric",
    };
    const optionsTime: Intl.DateTimeFormatOptions = {
      timeZone: "Asia/Kolkata",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: true,
    };

    const dateStr = date.toLocaleDateString("en-IN", optionsDate);
    const timeStr = date.toLocaleTimeString("en-IN", optionsTime);
    const fullFormatted = `${dateStr}, ${timeStr} IST`;

    // Calculate Relative Time
    const now = Date.now();
    const diffSec = Math.floor((now - date.getTime()) / 1000);
    let relative = "Just now";
    if (diffSec >= 60 && diffSec < 3600) {
      relative = `${Math.floor(diffSec / 60)}m ago`;
    } else if (diffSec >= 3600 && diffSec < 86400) {
      relative = `${Math.floor(diffSec / 3600)}h ago`;
    } else if (diffSec >= 86400) {
      relative = `${Math.floor(diffSec / 86400)}d ago`;
    }

    return { dateStr, timeStr, fullFormatted, relative };
  } catch {
    return { dateStr: "--", timeStr: "--", fullFormatted: "Invalid Date", relative: "Recent" };
  }
}

export function formatISTDateTimeString(isoStringOrTimestamp: string | number | Date): string {
  return formatISTDateTime(isoStringOrTimestamp).fullFormatted;
}

export function formatRelativeTimeIST(isoStringOrTimestamp: string | number | Date): string {
  return formatISTDateTime(isoStringOrTimestamp).relative;
}

