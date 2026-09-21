import React, { createContext, useContext, useEffect, useState, useMemo, useCallback, ReactNode } from "react";
import { Platform } from "react-native";
import * as SecureStore from "expo-secure-store";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { AegisApiService } from "./services/aegis-api";

export interface FamilyContact {
  id: string;
  name: string;
  phone: string;
  relationship: string;
  isPrimary?: boolean;
  notes?: string;
}

export interface EmergencyContact {
  name: string;
  phone: string;
  relationship: string;
}

export interface EmergencyProfile {
  fullName: string;
  phoneNumber: string;
  bloodGroup: string;
  medicalNotes: string;
  peopleCount: number;
  familyContacts: FamilyContact[];
  primaryContact: EmergencyContact;
  secondaryContact?: EmergencyContact;
  customSosMessage: string;
  customSafeMessage: string;
}

export const DEFAULT_FAMILY_CONTACTS: FamilyContact[] = [];

export const DEFAULT_EMERGENCY_PROFILE: EmergencyProfile = {
  fullName: "",
  phoneNumber: "",
  bloodGroup: "",
  medicalNotes: "",
  peopleCount: 1,
  familyContacts: [],
  primaryContact: {
    name: "",
    phone: "",
    relationship: "",
  },
  secondaryContact: undefined,
  customSosMessage: "EMERGENCY SOS: I need immediate help! Please dispatch rescue to my location.",
  customSafeMessage: "I am safe and secure. Sharing my location with family through AEGIS ALERT.",
};

const STORAGE_KEY = "agies_emergency_profile_sec";
const LEGACY_STORAGE_KEY = "@agies_emergency_profile";

interface EmergencyProfileContextType {
  profile: EmergencyProfile;
  isLoading: boolean;
  updateProfile: (updates: Partial<EmergencyProfile>) => Promise<void>;
  updateFamilyContacts: (contacts: FamilyContact[]) => Promise<void>;
  addFamilyContact: (contact: Omit<FamilyContact, "id">) => Promise<void>;
  removeFamilyContact: (contactId: string) => Promise<void>;
  resetToDefaults: () => Promise<void>;
}

const EmergencyProfileContext = createContext<EmergencyProfileContextType | null>(null);

// Secure storage helpers
async function readSecureProfile(): Promise<string | null> {
  if (Platform.OS === "web") {
    return AsyncStorage.getItem(STORAGE_KEY);
  }
  try {
    const data = await SecureStore.getItemAsync(STORAGE_KEY);
    if (data) return data;

    // Check and migrate legacy unencrypted AsyncStorage if present
    const legacy = await AsyncStorage.getItem(LEGACY_STORAGE_KEY);
    if (legacy) {
      await SecureStore.setItemAsync(STORAGE_KEY, legacy);
      await AsyncStorage.removeItem(LEGACY_STORAGE_KEY);
      return legacy;
    }
    return null;
  } catch (err) {
    console.warn("SecureStore read failed, falling back to AsyncStorage:", err);
    return AsyncStorage.getItem(LEGACY_STORAGE_KEY);
  }
}

async function writeSecureProfile(jsonValue: string): Promise<void> {
  if (Platform.OS === "web") {
    await AsyncStorage.setItem(STORAGE_KEY, jsonValue);
    return;
  }
  try {
    await SecureStore.setItemAsync(STORAGE_KEY, jsonValue);
  } catch (err) {
    console.warn("SecureStore write failed, falling back to AsyncStorage:", err);
    await AsyncStorage.setItem(LEGACY_STORAGE_KEY, jsonValue);
  }
}

async function removeSecureProfile(): Promise<void> {
  if (Platform.OS === "web") {
    await AsyncStorage.removeItem(STORAGE_KEY);
    return;
  }
  try {
    await SecureStore.deleteItemAsync(STORAGE_KEY);
  } catch (err) {
    console.warn("SecureStore delete failed:", err);
  }
  await AsyncStorage.removeItem(LEGACY_STORAGE_KEY);
}

function normalizeProfile(parsed: any): EmergencyProfile {
  let familyContacts: FamilyContact[] = [];

  if (Array.isArray(parsed?.familyContacts) && parsed.familyContacts.length > 0) {
    familyContacts = parsed.familyContacts;
  } else if (parsed?.primaryContact) {
    familyContacts = [
      {
        id: "fam-1",
        name: parsed.primaryContact.name || "Primary Contact",
        phone: parsed.primaryContact.phone || "",
        relationship: parsed.primaryContact.relationship || "Family",
        isPrimary: true,
      },
    ];
    if (parsed?.secondaryContact && parsed.secondaryContact.name) {
      familyContacts.push({
        id: "fam-2",
        name: parsed.secondaryContact.name,
        phone: parsed.secondaryContact.phone || "",
        relationship: parsed.secondaryContact.relationship || "Family",
        isPrimary: false,
      });
    }
  } else {
    familyContacts = [];
  }

  const primary =
    familyContacts.find((c) => c.isPrimary) ||
    familyContacts[0] ||
    DEFAULT_EMERGENCY_PROFILE.primaryContact;

  const secondary = familyContacts.length > 1 ? familyContacts[1] : undefined;

  return {
    ...DEFAULT_EMERGENCY_PROFILE,
    ...parsed,
    familyContacts,
    primaryContact: {
      name: primary.name,
      phone: primary.phone,
      relationship: primary.relationship,
    },
    secondaryContact: secondary
      ? {
          name: secondary.name,
          phone: secondary.phone,
          relationship: secondary.relationship,
        }
      : undefined,
  };
}

export function EmergencyProfileProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<EmergencyProfile>(DEFAULT_EMERGENCY_PROFILE);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    (async () => {
      try {
        const saved = await readSecureProfile();
        if (saved) {
          const parsed = JSON.parse(saved);
          setProfile(normalizeProfile(parsed));
        }
      } catch (e) {
        console.warn("Failed to load emergency profile from secure storage", e);
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  const syncBackend = (p: EmergencyProfile) => {
    AegisApiService.updateUserSettings({
      userId: "default-user",
      fullName: p.fullName,
      phoneNumber: p.phoneNumber,
      bloodGroup: p.bloodGroup,
      medicalNotes: p.medicalNotes,
      peopleCount: p.peopleCount,
      emergencyContacts: p.familyContacts,
    }).catch((e) => console.warn("[Profile] Backend sync failed:", e));
  };

  const updateProfile = useCallback(async (updates: Partial<EmergencyProfile>) => {
    setProfile((prev) => {
      const nextProfile: EmergencyProfile = {
        ...prev,
        ...updates,
      };
      const normalized = normalizeProfile(nextProfile);
      void writeSecureProfile(JSON.stringify(normalized));
      syncBackend(normalized);
      return normalized;
    });
  }, []);

  const updateFamilyContacts = useCallback(async (contacts: FamilyContact[]) => {
    setProfile((prev) => {
      const nextProfile: EmergencyProfile = {
        ...prev,
        familyContacts: contacts,
      };
      const normalized = normalizeProfile(nextProfile);
      void writeSecureProfile(JSON.stringify(normalized));
      syncBackend(normalized);
      return normalized;
    });
  }, []);

  const addFamilyContact = useCallback(async (contact: Omit<FamilyContact, "id">) => {
    const newContact: FamilyContact = {
      ...contact,
      id: `fam-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    };
    setProfile((prev) => {
      const nextProfile: EmergencyProfile = {
        ...prev,
        familyContacts: [...prev.familyContacts, newContact],
      };
      const normalized = normalizeProfile(nextProfile);
      void writeSecureProfile(JSON.stringify(normalized));
      return normalized;
    });
  }, []);

  const removeFamilyContact = useCallback(async (contactId: string) => {
    setProfile((prev) => {
      const nextProfile: EmergencyProfile = {
        ...prev,
        familyContacts: prev.familyContacts.filter((c) => c.id !== contactId),
      };
      const normalized = normalizeProfile(nextProfile);
      void writeSecureProfile(JSON.stringify(normalized));
      return normalized;
    });
  }, []);

  const resetToDefaults = useCallback(async () => {
    try {
      setProfile(DEFAULT_EMERGENCY_PROFILE);
      await removeSecureProfile();
    } catch (e) {
      console.warn("Failed to reset emergency profile", e);
    }
  }, []);

  const contextValue = useMemo(
    () => ({
      profile,
      isLoading,
      updateProfile,
      updateFamilyContacts,
      addFamilyContact,
      removeFamilyContact,
      resetToDefaults,
    }),
    [
      profile,
      isLoading,
      updateProfile,
      updateFamilyContacts,
      addFamilyContact,
      removeFamilyContact,
      resetToDefaults,
    ]
  );

  return (
    <EmergencyProfileContext.Provider value={contextValue}>
      {children}
    </EmergencyProfileContext.Provider>
  );
}

export function useEmergencyProfile() {
  const context = useContext(EmergencyProfileContext);
  if (!context) {
    throw new Error("useEmergencyProfile must be used within an EmergencyProfileProvider");
  }
  return context;
}
