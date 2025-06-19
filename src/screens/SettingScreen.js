import React, { useContext, useCallback, useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  BackHandler,
} from 'react-native';
import { AuthContext } from '../firebase/AuthProvider';
import { useFocusEffect } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { changeLanguage, getStoredLanguage } from '../utils/langHelper';

export default function SettingScreen() {
  const { logout } = useContext(AuthContext);
  const { t, i18n } = useTranslation();
  const [selectedLang, setSelectedLang] = useState(i18n.language || 'tr');

  useEffect(() => {
    getStoredLanguage().then((lang) => {
      if (lang) setSelectedLang(lang);
    });
  }, []);

  const handleLanguageChange = async (lang) => {
    setSelectedLang(lang);
    await i18n.changeLanguage(lang);
    await changeLanguage(lang);
  };

  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        Alert.alert(t('exitAppTitle'), t('exitAppMessage'), [
          { text: t('cancel'), style: 'cancel' },
          { text: t('yes'), onPress: () => BackHandler.exitApp() },
        ]);
        return true;
      };

      const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
      return () => subscription.remove();
    }, [t])
  );

  const handleLogout = () => {
    Alert.alert(
      t('logoutConfirmTitle'),
      t('logoutConfirmMessage'),
      [
        { text: t('cancel'), style: 'cancel' },
        { text: t('logout'), onPress: logout },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>⚙️ {t('settings')}</Text>

      <Text style={styles.label}>{t('language')}</Text>
      <View style={styles.langRow}>
        <TouchableOpacity
          style={[styles.langButton, selectedLang === 'tr' && styles.langSelected]}
          onPress={() => handleLanguageChange('tr')}
        >
          <Text style={styles.langText}>🇹🇷 Türkçe</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.langButton, selectedLang === 'en' && styles.langSelected]}
          onPress={() => handleLanguageChange('en')}
        >
          <Text style={styles.langText}>🇺🇸 English</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.langButton, selectedLang === 'es' && styles.langSelected]}
          onPress={() => handleLanguageChange('es')}
        >
          <Text style={styles.langText}>🇪🇸 Español</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.langButton, selectedLang === 'zh' && styles.langSelected]}
          onPress={() => handleLanguageChange('zh')}
        >
          <Text style={styles.langText}>🇨🇳 中文</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutText}>🚪 {t('logout')}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f6fa', alignItems: 'center', paddingTop: 80 },
  title: { fontSize: 28, fontWeight: 'bold', color: '#2d3436', marginBottom: 30 },
  label: { fontSize: 18, marginBottom: 10, color: '#2d3436' },
  langRow: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 10, marginBottom: 40 },
  langButton: {
    backgroundColor: '#dfe6e9',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    margin: 5,
  },
  langSelected: {
    backgroundColor: '#74b9ff',
  },
  langText: {
    fontSize: 16,
    color: '#2d3436',
  },
  logoutButton: {
    backgroundColor: '#d63031',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 10,
  },
  logoutText: { color: 'white', fontSize: 18 },
});
