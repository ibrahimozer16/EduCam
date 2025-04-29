import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ActivityIndicator, 
  Image, 
  Alert, 
  ScrollView 
} from 'react-native';
import { auth, db, storage } from '../firebase/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { launchImageLibrary } from 'react-native-image-picker';
import { updateProfile } from 'firebase/auth';

export default function ProfileScreen() {
  const [user, setUser] = useState(null);
  const [profileData, setProfileData] = useState(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    const fetchUserData = async () => {
      const currentUser = auth.currentUser;
      if (currentUser) {
        setUser(currentUser);

        try {
          const docRef = doc(db, 'users', currentUser.uid);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            setProfileData(docSnap.data());
          }
        } catch (error) {
          console.error('Profil verisi alınamadı:', error);
        }
      }
    };

    fetchUserData();
  }, []);

  const pickImageAndUpload = async () => {
    launchImageLibrary({ mediaType: 'photo' }, async (response) => {
      if (!response.didCancel && response.assets?.length > 0) {
        const asset = response.assets[0];
        const uploadUri = asset.uri;
        const filename = uploadUri.substring(uploadUri.lastIndexOf('/') + 1);
        const storageRef = ref(storage, `profile_photos/${user.uid}/${filename}`);

        try {
          setUploading(true);
          const img = await fetch(uploadUri);
          const bytes = await img.blob();
          await uploadBytes(storageRef, bytes);
          const downloadURL = await getDownloadURL(storageRef);

          await updateProfile(user, { photoURL: downloadURL });
          setUser(prev => ({ ...prev, photoURL: downloadURL }));

          Alert.alert('✅ Başarılı', 'Profil fotoğrafı güncellendi!');
        } catch (error) {
          console.error('Fotoğraf yükleme hatası:', error);
          Alert.alert('❌ Hata', 'Fotoğraf yüklenemedi.');
        } finally {
          setUploading(false);
        }
      }
    });
  };

  if (!user || !profileData) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#1e3a8a" />
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.profileCard}>
        {/* <Image
          source={user.photoURL ? { uri: user.photoURL } : require('../assets/default_profile.png')}
          style={styles.avatar}
        /> */}

        <Text style={styles.name}>{profileData.fullName || 'Ad Soyad'}</Text>
        <Text style={styles.infoText}>📧 {user.email}</Text>
        <Text style={styles.infoText}>🎂 {profileData.birthDate}</Text>
        <Text style={styles.infoText}>🚻 {profileData.gender}</Text>

        <TouchableOpacity style={styles.button} onPress={pickImageAndUpload}>
          <Text style={styles.buttonText}>{uploading ? '⏳ Yükleniyor...' : '📸 Profil Fotoğrafı Yükle'}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.button, { backgroundColor: '#fd9644' }]}>
          <Text style={styles.buttonText}>🔑 Şifre Değiştir</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#1e3a8a', paddingVertical: 30 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#1e3a8a' },
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
  name: { fontSize: 24, fontWeight: 'bold', color: '#1e3a8a', marginBottom: 10 },
  infoText: { fontSize: 16, color: '#636e72', marginBottom: 5 },
  button: {
    backgroundColor: '#0abde3',
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 8,
    marginTop: 15,
  },
  buttonText: { color: 'white', fontSize: 16 },
});
