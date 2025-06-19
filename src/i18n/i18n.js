import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import en from './locales/en.json';
import tr from './locales/tr.json';
import es from './locales/es.json';
import zh from './locales/zh.json';

i18n.use(initReactI18next).init({
  compatibilityJSON: 'v3',
  lng: 'tr', // başlangıç dili (kullanıcıdan alınacak)
  fallbackLng: 'en',
  resources: {
    en: { translation: en },
    tr: { translation: tr },
    es: { translation: es },
    zh: { translation: zh },
  },
  interpolation: {
    escapeValue: false,
  },
});

export default i18n;
