import i18n from '../i18n/i18n';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const setLanguage = async (langCode) => {
  i18n.changeLanguage(langCode);
  await AsyncStorage.setItem('user-language', langCode);
};

export const getStoredLanguage = async () => {
  const lang = await AsyncStorage.getItem('user-language');
  if (lang) {
    i18n.changeLanguage(lang);
  }
};
