import AsyncStorage from "@react-native-async-storage/async-storage";
import { createContext, useContext, useEffect, useMemo, useState, useCallback } from "react";
import { LANGUAGES, LanguageCode, TRANSLATIONS, TranslationDictionary } from "./translations";
import { AegisApiService } from "./services/aegis-api";

export { LANGUAGES, LanguageCode, TranslationDictionary };

type PreferencesValue = {
  language: LanguageCode;
  setLanguage: (language: LanguageCode) => void;
  notificationsEnabled: boolean;
  setNotificationsEnabled: (enabled: boolean) => void;
  liveLocationEnabled: boolean;
  setLiveLocationEnabled: (enabled: boolean) => void;
  isNearbyResponderEnabled: boolean;
  setNearbyResponderEnabled: (enabled: boolean) => void;
  t: (key: string) => string;
  dict: TranslationDictionary;
};

const PreferencesContext = createContext<PreferencesValue | null>(null);

export function AppPreferencesProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<LanguageCode>("en");
  const [notificationsEnabled, setNotificationsState] = useState<boolean>(true);
  const [liveLocationEnabled, setLiveLocationState] = useState<boolean>(true);
  const [isNearbyResponderEnabled, setIsNearbyResponderEnabledState] = useState<boolean>(true);

  useEffect(() => {
    AsyncStorage.getItem("agies-language").then((saved) => {
      if (saved && LANGUAGES.some((l) => l.code === saved)) {
        setLanguageState(saved as LanguageCode);
      }
    });
    AsyncStorage.getItem("agies-notifications-enabled").then((saved) => {
      if (saved !== null) {
        setNotificationsState(saved === "true");
      }
    });
    AsyncStorage.getItem("agies-live-location-enabled").then((saved) => {
      if (saved !== null) {
        setLiveLocationState(saved === "true");
      }
    });
    AsyncStorage.getItem("aegis-nearby-responder-enabled").then((saved) => {
      if (saved !== null) {
        setIsNearbyResponderEnabledState(saved === "true");
      }
    });
  }, []);

  const syncBackend = useCallback(
    (updates: {
      language?: string;
      notificationsEnabled?: boolean;
      liveLocationEnabled?: boolean;
      isNearbyResponder?: boolean;
    }) => {
      AegisApiService.updateUserSettings({
        userId: "default-user",
        ...updates,
      }).catch((e) => console.warn("[Preferences] Backend sync failed:", e));
    },
    []
  );

  const setLanguage = useCallback(
    (next: LanguageCode) => {
      setLanguageState(next);
      void AsyncStorage.setItem("agies-language", next);
      syncBackend({ language: next });
    },
    [syncBackend]
  );

  const setNotificationsEnabled = useCallback(
    (enabled: boolean) => {
      setNotificationsState(enabled);
      void AsyncStorage.setItem("agies-notifications-enabled", String(enabled));
      syncBackend({ notificationsEnabled: enabled });
    },
    [syncBackend]
  );

  const setLiveLocationEnabled = useCallback(
    (enabled: boolean) => {
      setLiveLocationState(enabled);
      void AsyncStorage.setItem("agies-live-location-enabled", String(enabled));
      syncBackend({ liveLocationEnabled: enabled });
    },
    [syncBackend]
  );

  const setNearbyResponderEnabled = useCallback(
    (enabled: boolean) => {
      setIsNearbyResponderEnabledState(enabled);
      void AsyncStorage.setItem("aegis-nearby-responder-enabled", String(enabled));
      syncBackend({ isNearbyResponder: enabled });
    },
    [syncBackend]
  );

  const value = useMemo(() => {
    const currentDict = TRANSLATIONS[language] || TRANSLATIONS.en;
    const currentRecord = currentDict as unknown as Record<string, string>;
    const enRecord = TRANSLATIONS.en as unknown as Record<string, string>;

    return {
      language,
      setLanguage,
      notificationsEnabled,
      setNotificationsEnabled,
      liveLocationEnabled,
      setLiveLocationEnabled,
      isNearbyResponderEnabled,
      setNearbyResponderEnabled,
      dict: currentDict,
      t: (key: string) => {
        const val = currentRecord[key];
        if (val !== undefined && val !== "") return val;
        const enVal = enRecord[key];
        if (enVal !== undefined && enVal !== "") return enVal;
        return key;
      },
    };
  }, [
    language,
    notificationsEnabled,
    liveLocationEnabled,
    isNearbyResponderEnabled,
    setLanguage,
    setNotificationsEnabled,
    setLiveLocationEnabled,
    setNearbyResponderEnabled,
  ]);

  return <PreferencesContext.Provider value={value}>{children}</PreferencesContext.Provider>;
}

export function useAppPreferences() {
  const value = useContext(PreferencesContext);
  if (!value) {
    throw new Error("useAppPreferences must be used within AppPreferencesProvider");
  }
  return value;
}
