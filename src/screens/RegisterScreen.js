import React, { useState } from 'react';
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
import firestore from '@react-native-firebase/firestore';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useTranslation } from 'react-i18next';

export default function RegisterScreen({ navigation }) {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [gender, setGender] = useState('');
  const [birthDate, setBirthDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);

  const handleRegister = async () => {
    if (password.length !== 6 || !/^[0-9]+$/.test(password)) {
      Alert.alert('❗ ' + t('error'), t('passwordRule'));
      return;
    }

    try {
      const userCredential = await auth().createUserWithEmailAndPassword(email, password);
      const user = userCredential.user;

      await firestore().collection('users').doc(user.uid).set({
        fullName,
        gender,
        birthDate: birthDate.toISOString().split('T')[0],
        email,
      });

      Alert.alert('✅ ' + t('success'), t('registrationSuccess'));
      navigation.navigate('Login');
    } catch (error) {
      Alert.alert('❌ ' + t('error'), error.message);
    }
  };

  const onDateChange = (event, selectedDate) => {
    const currentDate = selectedDate || birthDate;
    setShowDatePicker(false);
    setBirthDate(currentDate);
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <View style={styles.inner}>
          <Text style={styles.title}>{t('registerTitle')}</Text>

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
          <TextInput
            style={styles.input}
            placeholder={t('name')}
            placeholderTextColor="#aaa"
            onChangeText={setFullName}
            value={fullName}
          />
          <TextInput
            style={styles.input}
            placeholder={t('gender')}
            placeholderTextColor="#aaa"
            onChangeText={setGender}
            value={gender}
          />

          <TouchableOpacity
            onPress={() => setShowDatePicker(true)}
            style={[styles.input, { justifyContent: 'center' }]}
          >
            <Text style={{ color: '#1e3a8a' }}>{t('birthDate')}: {birthDate.toISOString().split('T')[0]}</Text>
          </TouchableOpacity>

          {showDatePicker && (
            <DateTimePicker
              value={birthDate}
              mode="date"
              display="default"
              onChange={onDateChange}
            />
          )}

          <TouchableOpacity style={styles.loginButton} onPress={handleRegister}>
            <Text style={styles.buttonText}>{t('registerButton')}</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => navigation.navigate('Login')}>
            <Text style={styles.registerText}>{t('loginPrompt')}</Text>
          </TouchableOpacity>
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
});
