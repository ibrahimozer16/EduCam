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
  TouchableWithoutFeedback, 
  Keyboard, 
  ScrollView 
} from 'react-native';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from '../firebase/firebase';
import DateTimePicker from '@react-native-community/datetimepicker';

export default function RegisterScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [gender, setGender] = useState('');
  const [birthDate, setBirthDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);

  const handleRegister = async () => {
    if (password.length !== 6 || !/^\d+$/.test(password)) {
      Alert.alert('❗ Hata', 'Şifre 6 basamaklı sadece rakam içermelidir.');
      return;
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      await setDoc(doc(db, 'users', user.uid), {
        fullName,
        gender,
        birthDate: birthDate.toISOString().split('T')[0],
        email
      });

      Alert.alert('✅ Başarılı', 'Kayıt tamamlandı!');
      navigation.navigate('Login');
    } catch (error) {
      Alert.alert('❌ Hata', error.message);
    }
  };

  const onDateChange = (event, selectedDate) => {
    const currentDate = selectedDate || birthDate;
    setShowDatePicker(false);
    setBirthDate(currentDate);
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
      style={styles.container}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <ScrollView contentContainerStyle={styles.inner}>
          <Text style={styles.title}>EduCam Kayıt</Text>

          <TextInput 
            style={styles.input} 
            placeholder="Ad Soyad" 
            placeholderTextColor="#aaa"
            onChangeText={setFullName}
            value={fullName}
          />
          <TextInput 
            style={styles.input} 
            placeholder="Email" 
            placeholderTextColor="#aaa"
            keyboardType="email-address"
            autoCapitalize="none"
            onChangeText={setEmail}
            value={email}
          />
          <TextInput 
            style={styles.input} 
            placeholder="6 Haneli Şifre (Sadece Rakam)" 
            placeholderTextColor="#aaa"
            secureTextEntry 
            keyboardType="numeric"
            maxLength={6}
            onChangeText={setPassword}
            value={password}
          />
          <TextInput 
            style={styles.input} 
            placeholder="Cinsiyet (Erkek/Kadın)" 
            placeholderTextColor="#aaa"
            onChangeText={setGender}
            value={gender}
          />
          
          <TouchableOpacity onPress={() => setShowDatePicker(true)} style={styles.dateButton}>
            <Text style={styles.buttonText}>
              Doğum Tarihi: {birthDate.toLocaleDateString('tr-TR')}
            </Text>
          </TouchableOpacity>

          {showDatePicker && (
            <DateTimePicker
              value={birthDate}
              mode="date"
              display="default"
              onChange={onDateChange}
              maximumDate={new Date()}
            />
          )}

          <TouchableOpacity style={styles.registerButton} onPress={handleRegister}>
            <Text style={styles.buttonText}>Kayıt Ol</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => navigation.navigate('Login')}>
            <Text style={styles.loginText}>Hesabın var mı? Giriş Yap</Text>
          </TouchableOpacity>

        </ScrollView>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1e3a8a' },
  inner: { paddingHorizontal: 30, justifyContent: 'center', flexGrow: 1 },
  title: { fontSize: 28, fontWeight: 'bold', color: 'white', textAlign: 'center', marginBottom: 30 },
  input: {
    height: 50,
    backgroundColor: 'white',
    borderRadius: 8,
    paddingHorizontal: 15,
    marginBottom: 20,
    fontSize: 16,
    color: '#1e3a8a',
  },
  dateButton: {
    backgroundColor: '#0984e3',
    paddingVertical: 15,
    borderRadius: 8,
    marginBottom: 20,
  },
  registerButton: {
    backgroundColor: '#0abde3',
    paddingVertical: 15,
    borderRadius: 8,
    marginBottom: 15,
  },
  buttonText: { color: 'white', fontSize: 18, textAlign: 'center' },
  loginText: { color: 'white', fontSize: 16, textAlign: 'center' },
});
