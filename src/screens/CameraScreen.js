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
  BackHandler,
} from 'react-native';
import { Camera, useCameraDevices } from 'react-native-vision-camera';
import RNFS from 'react-native-fs';
import Tflite from 'tflite-react-native';
import { firestore, auth } from '../firebase/firebase';
import storage from '@react-native-firebase/storage';
import Tts from 'react-native-tts';
import ImagePicker from 'react-native-image-crop-picker';
import { useFocusEffect } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';

const tflite = new Tflite();

export default function CameraScreen() {
  const { t } = useTranslation();
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
        Alert.alert(t('exitAppTitle'), t('exitAppMessage'), [
          { text: t('cancel'), style: 'cancel' },
          { text: t('yes'), onPress: () => BackHandler.exitApp() },
        ]);
        return true;
      };

      const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
      return () => subscription.remove();
    }, [t])
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
      cropperToolbarTitle: t('galleryCropTitle'),
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
      Alert.alert('Hata', t('noPhotoAlert'));
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
          label,
          label_en: label,
          confidence: prediction.confidence,
          timestamp: firestore.FieldValue.serverTimestamp(),
          photoUrl: downloadURL,
        });

      Alert.alert('✅', t('predictionSaved'));
      resetCamera();
    } catch (err) {
      console.error('🔥 Firestore kayıt hatası:', err);
      Alert.alert('❌', t('predictionError'));
    } finally {
      setSaveLoading(false);
    }
  };

  const speakPrediction = () => {
    if (prediction) {
      const key = `label_${prediction.label.toLowerCase().trim().replace(/\s+/g, '_')}`;
      const text = t(key);
      Tts.stop();
      Tts.speak(text);
    }
  };

  const getTranslatedLabel = () => {
    if (!prediction?.label) return '';
    const key = `label_${prediction.label.toLowerCase().trim().replace(/\s+/g, '_')}`;
    return t(key) || prediction.label;
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
            <Text style={styles.buttonText}>{t('takePhoto')}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.galleryButton} onPress={pickFromGallery}>
            <Text style={styles.buttonText}>{t('chooseFromGallery')}</Text>
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
                  {t('predictionTitle', {
                    label: getTranslatedLabel() || '---',
                    confidence: prediction?.confidence ? (prediction.confidence * 100).toFixed(2) : '---',
                  })}
                </Text>
                <TouchableOpacity style={styles.saveButton} onPress={saveToFirestore}>
                  <Text style={styles.buttonText}>
                    {saveLoading ? t('saving') : t('save')}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.speakButton} onPress={speakPrediction}>
                  <Text style={styles.buttonText}>{t('readAloud')}</Text>
                </TouchableOpacity>
              </>
            ) : (
              <TouchableOpacity onPress={classifyPhoto}>
                <Text style={styles.buttonText}>{t('predict')}</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity onPress={resetCamera}>
              <Text style={[styles.buttonText, { marginTop: 10 }]}>{t('reset')}</Text>
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
