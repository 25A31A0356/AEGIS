import { useProfile } from '../context/ProfileContext';
import { LANGUAGES, TRANSLATIONS, LanguageCode, TranslationDictionary } from './translations';

export { LANGUAGES, TRANSLATIONS };
export type { LanguageCode, TranslationDictionary };

export function useTranslation() {
  const { language, setLanguage } = useProfile();

  const activeLangCode = (LANGUAGES.some((l) => l.code === language) ? language : 'en') as LanguageCode;
  const dict: TranslationDictionary = TRANSLATIONS[activeLangCode] || TRANSLATIONS.en;

  const t = (key: string, fallback?: string): string => {
    if (key in dict) {
      return (dict as any)[key] || fallback || key;
    }

    const shortKey = key.split('.').pop() || key;
    if (shortKey in dict) {
      return (dict as any)[shortKey] || fallback || key;
    }

    return fallback || key;
  };

  return {
    t,
    dict,
    language: activeLangCode,
    setLanguage,
    availableLanguages: LANGUAGES,
  };
}

export default useTranslation;
