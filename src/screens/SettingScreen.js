import React, { useContext, useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, BackHandler } from 'react-native';
import { AuthContext } from '../firebase/AuthProvider';
import { useFocusEffect } from '@react-navigation/native';

export default function SettingScreen() {

  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        Alert.alert('Çıkış', 'Uygulamadan çıkmak istiyor musunuz?', [
          { text: 'İptal', style: 'cancel' },
          { text: 'Evet', onPress: () => BackHandler.exitApp() },
        ]);
        return true; // Geri tuşu davranışını durdur
      };

      const subscription = BackHandler.addEventListener(
        'hardwareBackPress',
        onBackPress
      );

      return () => subscription.remove(); // ❗️ removeEventListener yerine .remove()
    }, [])
  );

  const { logout } = useContext(AuthContext);

  const handleLogout = () => {
    Alert.alert(
      'Çıkış Yap',
      'Gerçekten çıkmak istiyor musun?',
      [
        { text: 'İptal', style: 'cancel' },
        { text: 'Çıkış Yap', onPress: logout }
      ]
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>⚙️ Ayarlar</Text>

      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutText}>🚪 Çıkış Yap</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f6fa', justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 28, fontWeight: 'bold', color: '#2d3436', marginBottom: 30 },
  logoutButton: {
    backgroundColor: '#d63031',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 10,
  },
  logoutText: { color: 'white', fontSize: 18 },
});
