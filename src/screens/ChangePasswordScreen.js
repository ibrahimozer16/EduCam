import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import auth from '@react-native-firebase/auth';
import { useTranslation } from 'react-i18next';

export default function ChangePasswordScreen({ navigation }) {
  const { t } = useTranslation();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const reauthenticate = async (password) => {
    const user = auth().currentUser;
    const credential = auth.EmailAuthProvider.credential(user.email, password);
    await user.reauthenticateWithCredential(credential);
  };

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      Alert.alert(t('alertPasswordError'), t('alertMissingFields'));
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert(t('alertPasswordError'), t('alertPasswordMismatch'));
      return;
    }

    try {
      setLoading(true);
      await reauthenticate(currentPassword);
      await auth().currentUser.updatePassword(newPassword);
      Alert.alert(t('alertPasswordSuccess'), t('alertPasswordSuccess'));
      await auth().signOut();
    } catch (error) {
      console.error(error);
      Alert.alert(t('alertPasswordError'), t('alertPasswordError'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1 }}
    >
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.header} />
        <View style={styles.card}>
          <Text style={styles.title}>🔒 {t('changePassword')}</Text>

          <TextInput
            style={styles.input}
            placeholder={t('currentPassword')}
            secureTextEntry
            value={currentPassword}
            onChangeText={setCurrentPassword}
            placeholderTextColor="#aaa"
          />
          <TextInput
            style={styles.input}
            placeholder={t('newPassword')}
            secureTextEntry
            value={newPassword}
            onChangeText={setNewPassword}
            placeholderTextColor="#aaa"
          />
          <TextInput
            style={styles.input}
            placeholder={t('confirmPassword')}
            secureTextEntry
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            placeholderTextColor="#aaa"
          />

          <TouchableOpacity
            style={[styles.button, loading && { opacity: 0.6 }]}
            onPress={handleChangePassword}
            disabled={loading}
          >
            <Text style={styles.buttonText}>
              {loading ? t('updatingPassword') : t('updatePassword')}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.button1}
            onPress={() => navigation.navigate('Profile')}
          >
            <Text style={styles.buttonText}>{t('backToProfile')}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: '#1e3a8a',
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 80,
    paddingBottom: 40,
  },
  header: {
    position: 'absolute',
    top: 0,
    width: '100%',
    height: 180,
    backgroundColor: '#0abde3',
    borderBottomLeftRadius: 100,
    borderBottomRightRadius: 100,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    width: '85%',
    alignItems: 'center',
    elevation: 5,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1e3a8a',
    marginBottom: 20,
  },
  input: {
    width: '100%',
    backgroundColor: '#f1f2f6',
    padding: 14,
    borderRadius: 10,
    fontSize: 16,
    marginBottom: 14,
    borderColor: '#dcdde1',
    borderWidth: 1,
    color: '#2d3436',
  },
  button: {
    backgroundColor: '#fd9644',
    paddingVertical: 14,
    paddingHorizontal: 30,
    borderRadius: 10,
    marginTop: 10,
    width: '100%',
    alignItems: 'center',
  },
  button1: {
    backgroundColor: '#229CD1FF',
    paddingVertical: 14,
    paddingHorizontal: 30,
    borderRadius: 10,
    marginTop: 10,
    width: '100%',
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
