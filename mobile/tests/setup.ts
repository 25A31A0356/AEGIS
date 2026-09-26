import { vi } from "vitest";

// In-memory AsyncStorage mock for Node test environments
const storage = new Map<string, string>();

vi.mock("@react-native-async-storage/async-storage", () => ({
  default: {
    getItem: vi.fn(async (key: string) => storage.get(key) ?? null),
    setItem: vi.fn(async (key: string, value: string) => {
      storage.set(key, value);
    }),
    removeItem: vi.fn(async (key: string) => {
      storage.delete(key);
    }),
    clear: vi.fn(async () => {
      storage.clear();
    }),
    getAllKeys: vi.fn(async () => Array.from(storage.keys())),
    multiRemove: vi.fn(async (keys: string[]) => {
      for (const k of keys) storage.delete(k);
    }),
  },
}));

vi.mock("react-native", () => ({
  Platform: {
    OS: "web",
    select: (obj: any) => obj.web || obj.default,
  },
  NativeModules: {},
  Linking: {
    openURL: vi.fn(async () => {}),
    canOpenURL: vi.fn(async () => true),
    createURL: vi.fn(() => "http://localhost:3000"),
  },
}));

vi.mock("expo-linking", () => ({
  createURL: vi.fn(() => "http://localhost:3000/oauth/callback"),
  openURL: vi.fn(async () => {}),
  canOpenURL: vi.fn(async () => true),
}));

vi.mock("expo-modules-core", () => ({
  EventEmitter: class EventEmitter {
    addListener = vi.fn();
    removeListeners = vi.fn();
  },
  NativeModulesProxy: {},
  requireNativeModule: vi.fn(() => ({})),
  requireOptionalNativeModule: vi.fn(() => ({})),
}));

vi.mock("expo-location", () => ({
  requestForegroundPermissionsAsync: vi.fn(async () => ({ status: "granted", granted: true })),
  getForegroundPermissionsAsync: vi.fn(async () => ({ status: "granted", granted: true })),
  getCurrentPositionAsync: vi.fn(async () => ({
    coords: {
      latitude: 17.6868,
      longitude: 83.2185,
      accuracy: 10,
      altitude: 25,
      heading: 0,
      speed: 0,
    },
  })),
  reverseGeocodeAsync: vi.fn(async () => [
    {
      city: "Visakhapatnam",
      district: "Sector 04",
      region: "Andhra Pradesh",
      country: "India",
    },
  ]),
  geocodeAsync: vi.fn(async () => [
    {
      latitude: 17.6868,
      longitude: 83.2185,
    },
  ]),
  Accuracy: {
    Balanced: 3,
    High: 4,
  },
}));

vi.mock("expo-notifications", () => ({
  setNotificationHandler: vi.fn(),
  setNotificationChannelAsync: vi.fn(async () => {}),
  getPermissionsAsync: vi.fn(async () => ({ status: "granted", granted: true })),
  requestPermissionsAsync: vi.fn(async () => ({ status: "granted", granted: true })),
  getExpoPushTokenAsync: vi.fn(async () => ({ data: "ExponentPushToken[mock-token-123]" })),
  scheduleNotificationAsync: vi.fn(async () => "notification-id-123"),
  AndroidImportance: {
    MAX: 5,
    HIGH: 4,
    DEFAULT: 3,
  },
  AndroidNotificationPriority: {
    MAX: "max",
    HIGH: "high",
    DEFAULT: "default",
  },
}));

vi.mock("expo-secure-store", () => ({
  getItemAsync: vi.fn(async () => null),
  setItemAsync: vi.fn(async () => {}),
  deleteItemAsync: vi.fn(async () => {}),
}));
