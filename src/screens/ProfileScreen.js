import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  Alert,
  ScrollView,
} from 'react-native';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import storage from '@react-native-firebase/storage';
import { launchImageLibrary } from 'react-native-image-picker';

export default function ProfileScreen() {
  const [user, setUser] = useState(null);
  const [profileData, setProfileData] = useState(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    const fetchUserData = async () => {
      const currentUser = auth().currentUser;

      console.log('🧪 auth().currentUser:', currentUser);
      if (!currentUser) {
        Alert.alert('Kullanıcı oturumu bulunamadı');
        return;
      }

      setUser(currentUser);

      try {
        const docSnap = await firestore().collection('users').doc(currentUser.uid).get();
        if (docSnap.exists) {
          setProfileData(docSnap.data());
        } else {
          console.warn('🟡 Kullanıcı verisi bulunamadı (Firestore)');
        }
      } catch (error) {
        console.error('🔴 Firestore veri çekme hatası:', error);
      }
    };

    fetchUserData();
  }, []);

  const pickImageAndUpload = async () => {
    launchImageLibrary({ mediaType: 'photo' }, async (response) => {
      if (response.didCancel) {
        console.log('🟡 Kullanıcı seçim yapmadı.');
        return;
      }

      if (!response.assets || response.assets.length === 0) {
        console.warn('🟠 Seçilen dosya yok');
        return;
      }

      const asset = response.assets[0];
      const uploadUri = asset.uri;

      console.log('📷 Seçilen dosya URI:', uploadUri);

      if (!uploadUri || !uploadUri.startsWith('file://')) {
        console.error('⛔ Geçersiz URI: ', uploadUri);
        Alert.alert('Hata', 'Geçersiz dosya URI.');
        return;
      }

      try {
        setUploading(true);

        const filename = `profile_${Date.now()}.jpg`;
        const ref = storage().ref(`profile_photos/${user.uid}/${filename}`);

        console.log('📤 Yükleme başlıyor →', ref.fullPath);

        await ref.putFile(uploadUri);

        const downloadURL = await ref.getDownloadURL();
        console.log('✅ Yükleme tamamlandı, downloadURL:', downloadURL);

        await auth().currentUser.updateProfile({ photoURL: downloadURL });
        setUser((prev) => ({ ...prev, photoURL: downloadURL }));

        Alert.alert('✅ Başarılı', 'Profil fotoğrafı yüklendi!');
      } catch (error) {
        console.error('🔥 Fotoğraf yükleme hatası:', error);
        Alert.alert('❌ Hata', 'Fotoğraf yüklenemedi.');
      } finally {
        setUploading(false);
      }
    });
  };

  if (!user || !profileData) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#1e3a8a" />
        <Text style={{ color: 'white', marginTop: 10 }}>Kullanıcı yükleniyor...</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.profileCard}>
        <Image
          source={{ uri: user.photoURL }}
          style={styles.avatar}
        />

        <Text style={styles.name}>{profileData.fullName || 'Ad Soyad'}</Text>
        <Text style={styles.infoText}>📧 {user.email}</Text>
        <Text style={styles.infoText}>🎂 {profileData.birthDate}</Text>
        <Text style={styles.infoText}>🚻 {profileData.gender}</Text>

        <TouchableOpacity style={styles.button} onPress={pickImageAndUpload}>
          <Text style={styles.buttonText}>
            {uploading ? '⏳ Yükleniyor...' : '📸 Profil Fotoğrafı Yükle'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.button, { backgroundColor: '#fd9644' }]}>
          <Text style={styles.buttonText}>🔑 Şifre Değiştir</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1e3a8a',
    paddingVertical: 30,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1e3a8a',
  },
  profileCard: {
    backgroundColor: 'white',
    padding: 30,
    borderRadius: 20,
    alignItems: 'center',
    width: '85%',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#dcdde1',
    marginBottom: 20,
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1e3a8a',
    marginBottom: 10,
  },
  infoText: {
    fontSize: 16,
    color: '#636e72',
    marginBottom: 5,
  },
  button: {
    backgroundColor: '#0abde3',
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 8,
    marginTop: 15,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
  },
});