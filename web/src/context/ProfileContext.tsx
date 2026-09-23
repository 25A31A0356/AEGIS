import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  EmergencyProfile,
  FamilyContact,
  DEFAULT_EMERGENCY_PROFILE,
  DEFAULT_FAMILY_CONTACTS,
} from '../types/profile';

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
  updateProfile: (updates: Partial<EmergencyProfile>) => void;
  addFamilyContact: (contact: Omit<FamilyContact, 'id'>) => void;
  updateFamilyContact: (id: string, contact: Partial<FamilyContact>) => void;
  removeFamilyContact: (id: string) => void;
  resetToDefaults: () => void;
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

  const [colorScheme, setColorSchemeState] = useState<'light' | 'dark'>(() => {
    try {
      const saved = localStorage.getItem(THEME_KEY);
      if (saved === 'dark' || saved === 'light') {
        return saved;
      }
    } catch {}
    return 'dark';
  });

  const [notificationsEnabled, setNotificationsEnabledState] = useState<boolean>(true);
  const [liveLocationEnabled, setLiveLocationEnabledState] = useState<boolean>(true);

  // Sync profile changes to localStorage
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

  const updateProfile = (updates: Partial<EmergencyProfile>) => {
    setProfile((prev) => ({
      ...prev,
      ...updates,
    }));
  };

  const addFamilyContact = (contact: Omit<FamilyContact, 'id'>) => {
    const newContact: FamilyContact = {
      ...contact,
      id: 'fam-' + Date.now(),
    };
    setProfile((prev) => ({
      ...prev,
      familyContacts: [...prev.familyContacts, newContact],
    }));
  };

  const updateFamilyContact = (id: string, updates: Partial<FamilyContact>) => {
    setProfile((prev) => ({
      ...prev,
      familyContacts: prev.familyContacts.map((c) => (c.id === id ? { ...c, ...updates } : c)),
    }));
  };

  const removeFamilyContact = (id: string) => {
    setProfile((prev) => ({
      ...prev,
      familyContacts: prev.familyContacts.filter((c) => c.id !== id),
    }));
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
