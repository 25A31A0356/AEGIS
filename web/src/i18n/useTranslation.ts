import { useProfile } from '../context/ProfileContext';
import { getTranslation, TRANSLATIONS } from './translations';

export function useTranslation() {
  const { language, setLanguage } = useProfile();

  const t = (key: string, fallback?: string): string => {
    return getTranslation(key, language, fallback);
  };

  return {
    t,
    language,
    setLanguage,
    availableLanguages: [
      { code: 'en', label: 'English', native: 'English' },
      { code: 'hi', label: 'Hindi', native: 'हिन्दी' },
      { code: 'te', label: 'Telugu', native: 'తెలుగు' },
      { code: 'ta', label: 'Tamil', native: 'தமிழ்' },
      { code: 'bn', label: 'Bengali', native: 'বাংলা' },
      { code: 'mr', label: 'Marathi', native: 'मराठी' },
      { code: 'kn', label: 'Kannada', native: 'ಕನ್ನಡ' },
      { code: 'ml', label: 'Malayalam', native: 'മലയാളം' },
      { code: 'gu', label: 'Gujarati', native: 'ગુજરાતી' },
    ],
  };
}
