import React, { useState, useEffect, useRef } from 'react';
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
} from 'react-native';
import { Camera, useCameraDevices } from 'react-native-vision-camera';
import { launchImageLibrary } from 'react-native-image-picker';
import RNFS from 'react-native-fs';
import Tflite from 'tflite-react-native';
import translations from '../jsons/translations.json';
import { db, auth } from '../firebase/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

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

  useEffect(() => {
    if (devices && devices.length > 0) {
      const back = devices.find(d => d.position === 'back');
      setSelectedDevice(back ?? devices[0]);
    }
  }, [devices]);

  useEffect(() => {
    tflite.loadModel(
      {
        model: 'mobilenetv2_finetuned_model.tflite',
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
    launchImageLibrary({ mediaType: 'photo' }, (response) => {
      if (!response.didCancel && response.assets?.length > 0) {
        setPhotoUri(response.assets[0].uri);
        setIsCameraActive(false);
        setPrediction(null);
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
        if (err) {
          console.error('🧨 Tahmin hatası:', err);
        } else {
          setPrediction(res?.[0] ?? null);
        }
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
    if (!prediction || !auth.currentUser) return;

    try {
      setSaveLoading(true);
      const label = prediction.label.toLowerCase().trim();
      const translation = translations[label] || label;
      const userId = auth.currentUser.uid;
      const userCollection = collection(db, 'users', userId, 'recognized_items');

      await addDoc(userCollection, {
        label_en: label,
        label_tr: translation,
        confidence: prediction.confidence,
        timestamp: serverTimestamp(),
        photoUrl: "",
      });
      Alert.alert('✅ Başarılı', 'Tahmin verisi Firebase\'e kaydedildi!');
    } catch (err) {
      console.error('🔥 Firestore kayıt hatası:', err);
      Alert.alert('❌ Hata', 'Veri kaydedilemedi.');
    } finally {
      setSaveLoading(false);
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
          <Image source={{ uri: photoUri }} style={StyleSheet.absoluteFill} resizeMode="cover" />
          <View style={styles.overlayBox}>
            {isLoading ? (
              <ActivityIndicator color="white" size="large" />
            ) : prediction ? (
              <>
                <Text style={styles.predictionText}>
                  📌 {translations[prediction.label] || prediction.label} ({(prediction.confidence * 100).toFixed(2)}%)
                </Text>
                <TouchableOpacity style={styles.saveButton} onPress={saveToFirestore}>
                  <Text style={styles.buttonText}>
                    {saveLoading ? '⏳ Kaydediliyor...' : '💾 Kaydet'}
                  </Text>
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
  centered: {
    flex: 1,
    backgroundColor: 'black',
    justifyContent: 'center',
    alignItems: 'center',
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
});
