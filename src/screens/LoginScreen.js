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
  ScrollView
} from 'react-native';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebase/firebase';

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async () => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
      Alert.alert('✅ Başarılı', 'Giriş yapıldı!');
      navigation.reset({
        index: 0,
        routes: [{ name: 'Main' }],
      });
    } catch (error) {
      Alert.alert('❌ Hata', error.message);
    }
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <ScrollView 
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.inner}>
          <Text style={styles.title}>EduCam Giriş</Text>

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
            placeholder="Şifre" 
            placeholderTextColor="#aaa"
            secureTextEntry 
            onChangeText={setPassword} 
            value={password}
            keyboardType='numeric'
          />

          <TouchableOpacity style={styles.loginButton} onPress={handleLogin}>
            <Text style={styles.buttonText}>Giriş Yap</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => navigation.navigate('Register')}>
            <Text style={styles.registerText}>Hesabın yok mu? Kayıt Ol</Text>
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
    paddingHorizontal: 30 
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
    marginBottom: 30 
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
    textAlign: 'center' 
  },
  registerText: { 
    color: 'white', 
    fontSize: 16, 
    textAlign: 'center' 
  },
});
