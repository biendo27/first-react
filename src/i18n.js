import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import Backend from 'i18next-http-backend';
import LanguageDetector from 'i18next-browser-languagedetector';

i18n
  // load translations using http (default public/locales)
  .use(Backend)
  // detect user language
  .use(LanguageDetector)
  // pass the i18n instance to react-i18next
  .use(initReactI18next)
  // init i18next
  .init({
    fallbackLng: 'vi', // Vietnamese as default language
    debug: true,
    supportedLngs: ['en', 'vi'],
    
    interpolation: {
      escapeValue: false, // not needed for react as it escapes by default
    },
    
    // Default namespaces to load
    ns: ['common', 'admin'],
    defaultNS: 'common',
    
    // Language detection options
    detection: {
      order: ['localStorage', 'navigator'],
      lookupLocalStorage: 'i18nextLng',
      caches: ['localStorage'],
    },
    
    react: {
      useSuspense: true,
    },
  });

export default i18n; 