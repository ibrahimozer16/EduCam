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
import Icon from 'react-native-vector-icons/Ionicons';
import { useTranslation } from 'react-i18next';

export default function ProfileScreen({ navigation }) {
  const { t } = useTranslation();
  const [user, setUser] = useState(null);
  const [profileData, setProfileData] = useState(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    const fetchUserData = async () => {
      const currentUser = auth().currentUser;
      if (!currentUser) {
        Alert.alert(t('userLoading'));
        return;
      }
      setUser(currentUser);
      try {
        const docSnap = await firestore().collection('users').doc(currentUser.uid).get();
        if (docSnap.exists) {
          setProfileData(docSnap.data());
        }
      } catch (error) {
        console.error('Firestore veri çekme hatası:', error);
      }
    };

    fetchUserData();
  }, [t]);

  const pickImageAndUpload = async () => {
    launchImageLibrary({ mediaType: 'photo' }, async (response) => {
      if (response.didCancel || !response.assets?.length) return;

      const uploadUri = response.assets[0].uri;
      if (!uploadUri?.startsWith('file://')) return;

      try {
        setUploading(true);
        const filename = `profile_${Date.now()}.jpg`;
        const ref = storage().ref(`profile_photos/${user.uid}/${filename}`);
        await ref.putFile(uploadUri);
        const downloadURL = await ref.getDownloadURL();
        await auth().currentUser.updateProfile({ photoURL: downloadURL });
        setUser((prev) => ({ ...prev, photoURL: downloadURL }));
        Alert.alert(t('uploadSuccess'));
      } catch (error) {
        Alert.alert(t('uploadFailed'));
      } finally {
        setUploading(false);
      }
    });
  };

  if (!user || !profileData) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#1e3a8a" />
        <Text style={{ color: 'white', marginTop: 10 }}>{t('userLoading')}</Text>
      </View>
    );
  }

  const genderKey = profileData.gender?.toLowerCase() === 'erkek'
    ? 'gender_male'
    : profileData.gender?.toLowerCase() === 'kadın'
    ? 'gender_female'
    : profileData.gender;

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.card}>
        <View style={styles.headerCircle} />
        <View style={styles.avatarContainer}>
          <Image source={{ uri: user.photoURL }} style={styles.avatar} />
        </View>

        <Text style={styles.name}>{profileData.fullName || 'Ad Soyad'}</Text>
        <Text style={styles.info}>📧 {user.email}</Text>
        <Text style={styles.info}>🎂 {profileData.birthDate}</Text>
        <Text style={styles.info}>🚻 {t(genderKey)}</Text>

        <TouchableOpacity style={styles.uploadBtn} onPress={pickImageAndUpload}>
          <Text style={styles.uploadText}>
            {uploading ? t('profileUploading') : t('uploadProfilePhoto')}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.passwordBtn} onPress={() => navigation.navigate('ChangePassword')}>
          <Text style={styles.passwordText}>{t('changePasswordAction')}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.button} onPress={() => navigation.navigate('Main')}>
          <Icon name="arrow-back-circle-outline" size={26} color={'white'} />
          <Text style={styles.buttonText}>{t('backToHome')}</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: '#1e3a8a',
    paddingVertical: 40,
    alignItems: 'center',
  },
  centered: {
    flex: 1,
    backgroundColor: '#1e3a8a',
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    width: '85%',
    backgroundColor: '#fff',
    borderRadius: 20,
    alignItems: 'center',
    paddingVertical: 30,
    elevation: 6,
    overflow: 'hidden',
    marginTop: 50,
  },
  headerCircle: {
    backgroundColor: '#0984e3',
    height: 120,
    width: '100%',
    position: 'absolute',
    top: 0,
    borderBottomLeftRadius: 90,
    borderBottomRightRadius: 90,
  },
  avatarContainer: {
    marginTop: 20,
    backgroundColor: '#fff',
    borderRadius: 100,
    padding: 4,
    elevation: 4,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#dfe6e9',
  },
  name: {
    fontSize: 24,
    fontWeight: '700',
    color: '#2d3436',
    marginTop: 20,
  },
  info: {
    fontSize: 20,
    color: '#636e72',
    marginVertical: 2,
  },
  uploadBtn: {
    backgroundColor: '#00cec9',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    marginTop: 20,
  },
  uploadText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  passwordBtn: {
    backgroundColor: '#fd9644',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    marginTop: 15,
  },
  passwordText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  button: {
    backgroundColor: '#229CD1FF',
    padding: 10,
    borderRadius: 12,
    marginTop: 15,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    justifyContent: 'center'
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
