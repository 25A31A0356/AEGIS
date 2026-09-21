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
const PREFS_KEY = 'aegis_user_app_preferences';

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
    } catch {
      // ignore
    }
    return DEFAULT_EMERGENCY_PROFILE;
  });

  const [language, setLanguageState] = useState<string>(() => {
    try {
      const saved = localStorage.getItem(`${PREFS_KEY}_lang`);
      if (saved) return saved;
    } catch {}
    return 'en';
  });

  const [colorScheme, setColorSchemeState] = useState<'light' | 'dark'>(() => {
    try {
      const savedTheme = localStorage.getItem(`${PREFS_KEY}_theme`) || localStorage.getItem('aegis_user_theme');
      if (savedTheme === 'dark' || savedTheme === 'light') {
        return savedTheme;
      }
      if (typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        return 'dark';
      }
    } catch {}
    return 'light';
  });
  const [notificationsEnabled, setNotificationsEnabledState] = useState<boolean>(true);
  const [liveLocationEnabled, setLiveLocationEnabledState] = useState<boolean>(true);

  // Sync profile changes to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
    } catch {}
  }, [profile]);

  // Sync colorScheme class to documentElement and body
  useEffect(() => {
    if (typeof document !== 'undefined') {
      if (colorScheme === 'dark') {
        document.documentElement.classList.add('dark');
        document.body.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
        document.body.classList.remove('dark');
      }
    }
  }, [colorScheme]);

  const setLanguage = (lang: string) => {
    setLanguageState(lang);
    try {
      localStorage.setItem(`${PREFS_KEY}_lang`, lang);
    } catch {}
  };

  const setColorScheme = (scheme: 'light' | 'dark') => {
    setColorSchemeState(scheme);
    try {
      localStorage.setItem(`${PREFS_KEY}_theme`, scheme);
      localStorage.setItem('aegis_user_theme', scheme);
    } catch {}
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
      id: `fam-${Date.now()}`,
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
    setColorSchemeState('light');
    setNotificationsEnabledState(true);
    setLiveLocationEnabledState(true);
    try {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(`${PREFS_KEY}_lang`);
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
