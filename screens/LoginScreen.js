import React, { useState } from 'react';
import { View, Text, TextInput, Button, Alert, StyleSheet, KeyboardAvoidingView, Platform, TouchableWithoutFeedback, Keyboard } from 'react-native';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebase/firebase';

const LoginScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async () => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
      Alert.alert('Başarılı', 'Giriş yapıldı!');
      navigation.navigate('Main'); // Giriş başarılıysa Home'a git
    } catch (error) {
      Alert.alert('Hata', error.message);
    }
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === "ios" ? "padding" : "height"} 
      style={styles.container}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={styles.inner}>
          <Text style={styles.title}>Giriş Yap</Text>
          <TextInput 
            style={styles.input} 
            placeholder="Email" 
            onChangeText={setEmail} 
            keyboardType="email-address"
          />
          <TextInput 
            style={styles.input} 
            placeholder="Şifre" 
            secureTextEntry 
            onChangeText={setPassword} 
          />
          <Button title="Giriş Yap" onPress={handleLogin} />
          <Button title="Kayıt Ol" onPress={() => navigation.navigate('Register')} />
        </View>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    justifyContent: 'center', 
    padding: 20 
  },
  inner: {
    flex: 1,
    justifyContent: 'center',
  },
  title: { 
    fontSize: 20, 
    textAlign: 'center', 
    marginBottom: 20 
  },
  input: { 
    height: 40, 
    borderColor: 'gray', 
    borderWidth: 1, 
    marginBottom: 20, 
    paddingHorizontal: 10 
  }
});

export default LoginScreen;
