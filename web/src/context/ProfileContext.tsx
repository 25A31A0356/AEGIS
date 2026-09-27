import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  EmergencyProfile,
  FamilyContact,
  DEFAULT_EMERGENCY_PROFILE,
  DEFAULT_FAMILY_CONTACTS,
} from '../types/profile';
import { ApiClient } from '../services/apiClient';

interface ProfileContextType {
  profile: EmergencyProfile;
  language: string;
  setLanguage: (lang: string) => void;
  colorScheme: 'light' | 'dark';
  setColorScheme: (scheme: 'light' | 'dark') => void;
  notificationsEnabled: boolean;
  setNotificationsEnabled: (enabled: boolean) => void;
  liveLocationEnabled: boolean;
  setLiveLocationEnabled: (enabled: boolean) => void;
  updateProfile: (updates: Partial<EmergencyProfile>) => Promise<void>;
  addFamilyContact: (contact: Omit<FamilyContact, 'id'>) => Promise<void>;
  updateFamilyContact: (id: string, contact: Partial<FamilyContact>) => Promise<void>;
  removeFamilyContact: (id: string) => Promise<void>;
  resetToDefaults: () => void;
  refreshProfileFromServer: () => Promise<void>;
}

const STORAGE_KEY = 'aegis_user_emergency_profile';
const THEME_KEY = 'aegis-theme';
const LANG_KEY = 'aegis-lang';

const ProfileContext = createContext<ProfileContextType | undefined>(undefined);

export const ProfileProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [profile, setProfile] = useState<EmergencyProfile>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          ...DEFAULT_EMERGENCY_PROFILE,
          ...parsed,
          familyContacts: parsed.familyContacts || DEFAULT_FAMILY_CONTACTS,
        };
      }
    } catch {}
    return DEFAULT_EMERGENCY_PROFILE;
  });

  const [language, setLanguageState] = useState<string>(() => {
    try {
      const saved = localStorage.getItem(LANG_KEY);
      if (saved) return saved;
    } catch {}
    return 'en';
  });

  const [colorScheme, setColorSchemeState] = useState<'light' | 'dark'>('dark');
  const [notificationsEnabled, setNotificationsEnabledState] = useState<boolean>(true);
  const [liveLocationEnabled, setLiveLocationEnabledState] = useState<boolean>(true);

  // Synchronize with Central Server Database upon session availability
  const refreshProfileFromServer = useCallback(async () => {
    const token = localStorage.getItem('aegis_auth_token');
    if (!token) return;

    try {
      const res = await ApiClient.get<any>('/auth/me', undefined, { skipCache: true, timeoutMs: 3500 });
      if (res) {
        const serverProfile: Partial<EmergencyProfile> = {
          fullName: res.full_name || res.name || profile.fullName,
          phoneNumber: res.phoneNumber || res.phone || profile.phoneNumber,
          avatarUrl: res.avatarUrl || res.avatar_url || res.avatarUri || profile.avatarUrl,
          avatarUri: res.avatarUri || res.avatarUrl || res.avatar_url || profile.avatarUri,
          bloodGroup: res.bloodGroup || res.blood_group || profile.bloodGroup || 'O+',
          medicalNotes: res.medicalNotes || res.medical_notes || profile.medicalNotes || '',
          peopleCount: res.peopleCount || res.people_count || profile.peopleCount || 1,
          homeCity: res.homeCity || res.home_city || profile.homeCity || 'Kakinada',
          homePoliceStation: res.homePoliceStation || res.home_police_station || profile.homePoliceStation || 'Kakinada Town Police Station',
          homePoliceNumber: res.homePoliceNumber || res.home_police_number || profile.homePoliceNumber || '0884-2365555',
          familyContacts: Array.isArray(res.familyContacts) && res.familyContacts.length > 0
            ? res.familyContacts
            : (Array.isArray(res.family_contacts) && res.family_contacts.length > 0 ? res.family_contacts : profile.familyContacts),
          customSosMessage: res.customSosMessage || res.custom_sos_message || profile.customSosMessage,
          customSafeMessage: res.customSafeMessage || res.custom_safe_message || profile.customSafeMessage,
        };

        setProfile((prev) => {
          const merged = { ...prev, ...serverProfile };
          try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
          } catch {}
          return merged;
        });

        if (res.language) {
          setLanguageState(res.language);
        }
      }
    } catch (e) {
      console.warn('[ProfileContext] Server sync error:', e);
    }
  }, [profile]);

  useEffect(() => {
    void refreshProfileFromServer();
  }, []);

  // Save to localStorage when profile changes
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
    } catch {}
  }, [profile]);

  // Global Unified Theme Sync
  useEffect(() => {
    if (typeof document !== 'undefined') {
      const root = document.documentElement;
      const body = document.body;

      if (colorScheme === 'dark') {
        root.classList.add('dark');
        root.classList.remove('light');
        body.classList.add('dark');
        body.classList.remove('light');
      } else {
        root.classList.remove('dark');
        root.classList.add('light');
        body.classList.remove('dark');
        body.classList.add('light');
      }
      try {
        localStorage.setItem(THEME_KEY, colorScheme);
      } catch {}
    }
  }, [colorScheme]);

  const setLanguage = (lang: string) => {
    setLanguageState(lang);
    try {
      localStorage.setItem(LANG_KEY, lang);
    } catch {}
  };

  const setColorScheme = (scheme: 'light' | 'dark') => {
    setColorSchemeState(scheme);
  };

  const setNotificationsEnabled = (enabled: boolean) => {
    setNotificationsEnabledState(enabled);
  };

  const setLiveLocationEnabled = (enabled: boolean) => {
    setLiveLocationEnabledState(enabled);
  };

  // Helper to sync to server
  const pushProfileToServer = async (updated: EmergencyProfile) => {
    const token = localStorage.getItem('aegis_auth_token');
    if (!token) return;

    try {
      await ApiClient.put('/auth/profile', {
        full_name: updated.fullName,
        phone: updated.phoneNumber,
        phoneNumber: updated.phoneNumber,
        avatar_url: updated.avatarUrl || updated.avatarUri,
        avatarUrl: updated.avatarUrl || updated.avatarUri,
        blood_group: updated.bloodGroup,
        bloodGroup: updated.bloodGroup,
        medical_notes: updated.medicalNotes,
        medicalNotes: updated.medicalNotes,
        people_count: updated.peopleCount,
        peopleCount: updated.peopleCount,
        home_city: updated.homeCity,
        homeCity: updated.homeCity,
        home_police_station: updated.homePoliceStation,
        homePoliceStation: updated.homePoliceStation,
        home_police_number: updated.homePoliceNumber,
        homePoliceNumber: updated.homePoliceNumber,
        family_contacts: updated.familyContacts,
        familyContacts: updated.familyContacts,
        custom_sos_message: updated.customSosMessage,
        customSosMessage: updated.customSosMessage,
        custom_safe_message: updated.customSafeMessage,
        customSafeMessage: updated.customSafeMessage,
      });
    } catch (err) {
      console.warn('[ProfileContext] Failed to push profile update to server:', err);
    }
  };

  const updateProfile = async (updates: Partial<EmergencyProfile>) => {
    const nextProfile: EmergencyProfile = {
      ...profile,
      ...updates,
    };
    setProfile(nextProfile);
    await pushProfileToServer(nextProfile);
  };

  const addFamilyContact = async (contact: Omit<FamilyContact, 'id'>) => {
    const newContact: FamilyContact = {
      ...contact,
      id: 'fam-' + Date.now(),
    };
    const nextProfile: EmergencyProfile = {
      ...profile,
      familyContacts: [...profile.familyContacts, newContact],
    };
    setProfile(nextProfile);
    await pushProfileToServer(nextProfile);
  };

  const updateFamilyContact = async (id: string, updates: Partial<FamilyContact>) => {
    const nextProfile: EmergencyProfile = {
      ...profile,
      familyContacts: profile.familyContacts.map((c) => (c.id === id ? { ...c, ...updates } : c)),
    };
    setProfile(nextProfile);
    await pushProfileToServer(nextProfile);
  };

  const removeFamilyContact = async (id: string) => {
    const nextProfile: EmergencyProfile = {
      ...profile,
      familyContacts: profile.familyContacts.filter((c) => c.id !== id),
    };
    setProfile(nextProfile);
    await pushProfileToServer(nextProfile);
  };

  const resetToDefaults = () => {
    setProfile(DEFAULT_EMERGENCY_PROFILE);
    setLanguageState('en');
    setColorSchemeState('dark');
    setNotificationsEnabledState(true);
    setLiveLocationEnabledState(true);
    try {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(LANG_KEY);
      localStorage.setItem(THEME_KEY, 'dark');
    } catch {}
  };

  return (
    <ProfileContext.Provider
      value={{
        profile,
        language,
        setLanguage,
        colorScheme,
        setColorScheme,
        notificationsEnabled,
        setNotificationsEnabled,
        liveLocationEnabled,
        setLiveLocationEnabled,
        updateProfile,
        addFamilyContact,
        updateFamilyContact,
        removeFamilyContact,
        resetToDefaults,
        refreshProfileFromServer,
      }}
    >
      {children}
    </ProfileContext.Provider>
  );
};

export const useProfile = (): ProfileContextType => {
  const context = useContext(ProfileContext);
  if (!context) {
    throw new Error('useProfile must be used within a ProfileProvider');
  }
  return context;
};
