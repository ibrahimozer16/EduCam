import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  PermissionsAndroid,
  Platform,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
  BackHandler
} from 'react-native';
import { Camera, useCameraDevices } from 'react-native-vision-camera';
import RNFS from 'react-native-fs';
import Tflite from 'tflite-react-native';
import translations from '../jsons/translations.json';
import { firestore, auth } from '../firebase/firebase';
import storage from '@react-native-firebase/storage';
import Tts from 'react-native-tts';
import ImagePicker from 'react-native-image-crop-picker';
import { useFocusEffect } from '@react-navigation/native';

const tflite = new Tflite();

export default function CameraScreen() {
  const cameraRef = useRef(null);
  const [hasPermission, setHasPermission] = useState(false);
  const devices = useCameraDevices();
  const [selectedDevice, setSelectedDevice] = useState(null);
  const [photoUri, setPhotoUri] = useState(null);
  const [isCameraActive, setIsCameraActive] = useState(true);
  const [prediction, setPrediction] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);

  const requestAndroidPermissions = async () => {
    if (Platform.OS === 'android') {
      await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.CAMERA);
    }
  };

  useEffect(() => {
    (async () => {
      if (Platform.OS === 'android') await requestAndroidPermissions();
      const status = await Camera.getCameraPermissionStatus();
      if (status !== 'authorized') {
        const newStatus = await Camera.requestCameraPermission();
        setHasPermission(newStatus === 'authorized' || newStatus === 'granted');
      } else {
        setHasPermission(true);
      }
    })();
  }, []);

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

  useEffect(() => {
    if (devices && devices.length > 0) {
      const back = devices.find(d => d.position === 'back');
      setSelectedDevice(back ?? devices[0]);
    }
  }, [devices]);
  

  useEffect(() => {
    tflite.loadModel(
      {
        model: 'resnet50_augmented_quant.tflite',
        labels: 'labels.txt',
        numThreads: 1,
      },
      (err, res) => {
        if (err) console.error('🧨 Model yükleme hatası:', err);
        else console.log('✅ TFLite model yüklendi:', res);
      }
    );

    RNFS.readFileAssets('labels.txt')
      .then(content => {
        console.log('📄 Etiketler (ilk 10):', content.split('\n').slice(0, 10));
      })
      .catch(err => console.error('❌ labels.txt okunamadı:', err));
  }, []);

  const takePhoto = async () => {
    if (!cameraRef.current) return;
    const photo = await cameraRef.current.takePhoto({
      qualityPrioritization: 'quality',
      flash: 'off',
    });
    const path = `file://${photo.path}`;
    setPhotoUri(path);
    setIsCameraActive(false);
    setPrediction(null);
  };

  const pickFromGallery = () => {
    ImagePicker.openPicker({
      cropping: true,
      freeStyleCropEnabled: true,
      hideBottomControls: true,
      mediaType: 'photo',
      cropperToolbarTitle: 'İstediğiniz Alanı Seçin',
    })
      .then(image => {
        setPhotoUri(image.path);
        setIsCameraActive(false);
        setPrediction(null);
      })
      .catch(err => {
        if (err.code !== 'E_PICKER_CANCELLED') {
          console.error('📁 Galeri hatası:', err);
        }
      });
  };

  const classifyPhoto = async () => {
    if (!photoUri) {
      Alert.alert('Hata', 'Fotoğraf bulunamadı');
      return;
    }
    setIsLoading(true);
    tflite.runModelOnImage(
      {
        path: photoUri.replace('file://', ''),
        imageMean: 127.5,
        imageStd: 127.5,
        numResults: 1,
        threshold: 0.05,
      },
      (err, res) => {
        if (err) console.error('🧨 Tahmin hatası:', err);
        else setPrediction(res?.[0] ?? null);
        setIsLoading(false);
      }
    );
  };

  const resetCamera = () => {
    setPhotoUri(null);
    setPrediction(null);
    setIsCameraActive(true);
  };

  const saveToFirestore = async () => {
    if (!prediction || !auth().currentUser || !photoUri) return;
    try {
      setSaveLoading(true);
      const label = prediction.label.toLowerCase().trim();
      const translation = translations[label] || label;
      const userId = auth().currentUser.uid;
      const timestamp = Date.now();
      const filename = `prediction_${timestamp}.jpg`;
      const ref = storage().ref(`predictions/${userId}/${filename}`);
      await ref.putFile(photoUri);
      const downloadURL = await ref.getDownloadURL();

      await firestore()
        .collection('users')
        .doc(userId)
        .collection('recognized_items')
        .add({
          label_en: label,
          label_tr: translation,
          confidence: prediction.confidence,
          timestamp: firestore.FieldValue.serverTimestamp(),
          photoUrl: downloadURL,
        });

      Alert.alert('✅ Başarılı', 'Tahmin ve fotoğraf kaydedildi!');
      resetCamera();
    } catch (err) {
      console.error('🔥 Firestore kayıt hatası:', err);
      Alert.alert('❌ Hata', 'Veri kaydedilemedi.');
    } finally {
      setSaveLoading(false);
    }
  };

  const speakPrediction = () => {
    if (prediction) {
      const text = translations[prediction.label] || prediction.label;
      Tts.stop();
      Tts.speak(text);
    }
  };

  return (
    <View style={{ flex: 1 }}>
      {isCameraActive && selectedDevice && (
        <Camera
          ref={cameraRef}
          style={StyleSheet.absoluteFill}
          device={selectedDevice}
          isActive={true}
          photo={true}
        />
      )}

      {!photoUri ? (
        <View style={styles.buttonRow}>
          <TouchableOpacity style={styles.captureButton} onPress={takePhoto}>
            <Text style={styles.buttonText}>📸 Fotoğraf Çek</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.galleryButton} onPress={pickFromGallery}>
            <Text style={styles.buttonText}>📁 Galeriden Seç</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          <View style={styles.photoBox}>
            <Image source={{ uri: photoUri }} style={styles.previewImage} resizeMode="contain" />
          </View>
          <View style={styles.overlayBox}>
            {isLoading ? (
              <ActivityIndicator color="white" size="large" />
            ) : prediction ? (
              <>
                <Text style={styles.predictionText}>
                  📌 {translations[prediction.label] || prediction.label} ({(prediction.confidence * 100).toFixed(2)}%)
                </Text>
                <TouchableOpacity style={styles.saveButton} onPress={saveToFirestore}>
                  <Text style={styles.buttonText}>{saveLoading ? '⏳ Kaydediliyor...' : '💾 Kaydet'}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.speakButton} onPress={speakPrediction}>
                  <Text style={styles.buttonText}>🔊 Sesli Oku</Text>
                </TouchableOpacity>
              </>
            ) : (
              <TouchableOpacity onPress={classifyPhoto}>
                <Text style={styles.buttonText}>🤖 Tahmin Et</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity onPress={resetCamera}>
              <Text style={[styles.buttonText, { marginTop: 10 }]}>🔄 Geri Dön</Text>
            </TouchableOpacity>
          </View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  photoBox: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'black',
  },
  previewImage: {
    width: '100%',
    aspectRatio: 3 / 4,
    borderRadius: 10,
  },
  captureButton: {
    backgroundColor: '#00cec9',
    padding: 12,
    borderRadius: 10,
  },
  galleryButton: {
    backgroundColor: '#6c5ce7',
    padding: 12,
    borderRadius: 10,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    position: 'absolute',
    bottom: 40,
    width: '100%',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
  },
  overlayBox: {
    position: 'absolute',
    bottom: 40,
    alignSelf: 'center',
    backgroundColor: '#2d3436aa',
    padding: 20,
    borderRadius: 10,
    alignItems: 'center',
  },
  predictionText: {
    color: 'white',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 8,
  },
  saveButton: {
    backgroundColor: '#0984e3',
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 10,
    marginTop: 10,
  },
  speakButton: {
    backgroundColor: '#74b9ff',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10,
    marginTop: 10,
  },
});