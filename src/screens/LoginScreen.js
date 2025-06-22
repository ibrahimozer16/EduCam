import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  StyleSheet,
  TouchableWithoutFeedback,
  Keyboard,
  ScrollView,
} from 'react-native';
import auth from '@react-native-firebase/auth';
import { useTranslation } from 'react-i18next';
import i18n from '../i18n/i18n';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DropDownPicker from 'react-native-dropdown-picker';

export default function LoginScreen({ navigation }) {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [selectedLang, setSelectedLang] = useState(i18n.language);
  const [value, setValue] = useState(i18n.language);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('⚠️', t('fillAllFields') || 'Lütfen tüm alanları doldurun.');
      return;
    }

    try {
      await auth().signInWithEmailAndPassword(email, password);
      Alert.alert('✅', t('loginSuccess'));
      navigation.reset({
        index: 0,
        routes: [{ name: 'Main' }],
      });
    } catch (error) {
      let message = '';

      switch (error.code) {
        case 'auth/invalid-email':
          message = t('invalidEmail') || 'Geçersiz e-posta adresi.';
          break;
        case 'auth/user-not-found':
          message = t('userNotFound') || 'Böyle bir kullanıcı bulunamadı.';
          break;
        case 'auth/wrong-password':
          message = t('wrongPassword') || 'Şifre hatalı.';
          break;
        case 'auth/too-many-requests':
          message = t('tooManyRequests') || 'Çok fazla deneme yapıldı. Lütfen sonra tekrar deneyin.';
          break;
        default:
          message = t('unknownError') || 'Bir hata oluştu. Lütfen tekrar deneyin.';
          break;
      }

      Alert.alert('❌', message);
    }
  };

  const changeLanguage = async (lang) => {
    await i18n.changeLanguage(lang);
    await AsyncStorage.setItem('userLang', lang);
    setSelectedLang(lang);
    setValue(lang);
  };

  useEffect(() => {
    AsyncStorage.getItem('userLang').then(storedLang => {
      if (storedLang && storedLang !== i18n.language) {
        i18n.changeLanguage(storedLang);
        setSelectedLang(storedLang);
        setValue(storedLang);
      }
    });
  }, []);

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <ScrollView
        contentContainerStyle={[styles.container, { minHeight: '100%' }]}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.inner}>
          <Text style={styles.title}>{t('loginTitle')}</Text>

          <TextInput
            style={styles.input}
            placeholder={t('email')}
            placeholderTextColor="#aaa"
            keyboardType="email-address"
            autoCapitalize="none"
            onChangeText={setEmail}
            value={email}
          />
          <TextInput
            style={styles.input}
            placeholder={t('password')}
            placeholderTextColor="#aaa"
            secureTextEntry
            onChangeText={setPassword}
            value={password}
            keyboardType="numeric"
          />

          <TouchableOpacity style={styles.loginButton} onPress={handleLogin}>
            <Text style={styles.buttonText}>{t('loginButton')}</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => navigation.navigate('Register')}>
            <Text style={styles.registerText}>{t('registerPrompt')}</Text>
          </TouchableOpacity>

          <View style={styles.langRow}>
            <TouchableOpacity
              style={[styles.langButton, selectedLang === 'tr' && styles.langSelected]}
              onPress={() => changeLanguage('tr')}
            >
              <Text style={styles.langText}>🇹🇷 Türkçe</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.langButton, selectedLang === 'en' && styles.langSelected]}
              onPress={() => changeLanguage('en')}
            >
              <Text style={styles.langText}>🇺🇸 English</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.langButton, selectedLang === 'es' && styles.langSelected]}
              onPress={() => changeLanguage('es')}
            >
              <Text style={styles.langText}>🇪🇸 Español</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.langButton, selectedLang === 'zh' && styles.langSelected]}
              onPress={() => changeLanguage('zh')}
            >
              <Text style={styles.langText}>🇨🇳 中文</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: '#1e3a8a',
    justifyContent: 'center',
    paddingHorizontal: 30,
  },
  inner: {
    flex: 1,
    justifyContent: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
    marginBottom: 30,
  },
  input: {
    height: 50,
    backgroundColor: 'white',
    borderRadius: 8,
    paddingHorizontal: 15,
    marginBottom: 20,
    fontSize: 16,
    color: '#1e3a8a',
  },
  loginButton: {
    backgroundColor: '#0abde3',
    paddingVertical: 15,
    borderRadius: 8,
    marginBottom: 15,
  },
  buttonText: {
    color: 'white',
    fontSize: 18,
    textAlign: 'center',
  },
  registerText: {
    color: 'white',
    fontSize: 16,
    textAlign: 'center',
  },
  langRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 20,
  },
  langButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: '#ccc',
    marginHorizontal: 4,
  },
  langSelected: {
    backgroundColor: '#0abde3',
  },
  langText: {
    color: 'white',
    fontWeight: 'bold',
  },
});
