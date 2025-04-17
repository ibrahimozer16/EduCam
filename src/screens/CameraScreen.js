import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Platform,
  PermissionsAndroid,
  TouchableOpacity,
  Image,
  ActivityIndicator,
} from 'react-native';
import { Camera, useCameraDevices } from 'react-native-vision-camera';
import RNFS from 'react-native-fs';
import * as tf from '@tensorflow/tfjs';
import '@tensorflow/tfjs-backend-cpu';
import '@tensorflow/tfjs-backend-webgl';
import * as mobilenet from '@tensorflow-models/mobilenet';
import { launchImageLibrary } from 'react-native-image-picker';

export default function CameraScreen() {
  const cameraRef = useRef(null);
  const modelRef = useRef(null);
  const [hasPermission, setHasPermission] = useState(false);
  const devices = useCameraDevices();
  const [selectedDevice, setSelectedDevice] = useState(null);
  const [photoUri, setPhotoUri] = useState(null);
  const [isCameraActive, setIsCameraActive] = useState(true);
  const [model, setModel] = useState(null);
  const [prediction, setPrediction] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  // 📌 Kamera izinleri
  const requestAndroidPermissions = async () => {
    if (Platform.OS === 'android') {
      await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.CAMERA, {
        title: 'Kamera İzni',
        message: 'Uygulamanın kameraya erişmesine izin verin.',
        buttonPositive: 'Tamam',
      });
    }
  };

  // 📌 Kamera erişimi
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

  // 📌 Kamera cihazı seçimi
  useEffect(() => {
    if (devices && devices.length > 0) {
      const back = devices.find(d => d.position === 'back');
      setSelectedDevice(back ?? devices[0]);
    }
  }, [devices]);

  useEffect(() => {
    (async () => {
      try {
        if (modelRef.current) {
          console.log("✅ Model daha önce yüklenmiş, tekrar yüklenmedi.");
          setModel(modelRef.current);
          return;
        }
  
        console.log("⚙️ TensorFlow başlatılıyor...");
        await tf.ready();
        console.log("🟢 tf.ready tamamlandı");
  
        await tf.setBackend('cpu');
        const backend = tf.getBackend();
        console.log("🔧 Backend:", backend);
  
        console.time("model-load");
        const loadedModel = await mobilenet.load({version: 2, alpha: 1});
        console.timeEnd("model-load");
  
        modelRef.current = loadedModel;
        setModel(loadedModel);
        console.log("✅ MobileNet modeli yüklendi ve state'e kaydedildi");
      } catch (e) {
        console.error("🧨 Model yüklenirken hata:", e);
      }
    })();
  }, []);
  

  

  // 📸 Fotoğraf çek
  const takePhoto = async () => {
    if (cameraRef.current == null) return;

    const photo = await cameraRef.current.takePhoto({
      qualityPrioritization: 'quality',
    });

    const path = `file://${photo.path}`;
    setPhotoUri(path);
    setIsCameraActive(false);
    setPrediction(null);
  };

  const classifyPhoto = async () => {
    console.log("🧪 model:", model);
    console.log("🧪 photoUri:", photoUri);
    if (!photoUri || !model) {
      console.warn("⚠️ Model veya fotoğraf eksik!");
      return;
    }
  
    console.log("🔍 Fotoğraf URI:", photoUri);
    setIsLoading(true);
  
    try {
      const base64 = await RNFS.readFile(photoUri, 'base64');
      console.log("📦 Base64 boyutu:", base64.length);
  
      // ❗ Buradaki Image yapısı DOM içindir, React Native'de çalışmaz
      // Mobilde tfjs modeline doğrudan resim veremeyiz, workaround gerekir
  
      console.warn("⛔️ Mobil ortamda doğrudan img verilemez. decodeImage/Canvas kullanımı gerekir.");
      // Burada dummy bir örnek dönüyoruz geçici olarak
      const dummyTensor = tf.randomNormal([224, 224, 3]); // modelin beklentisi
      const predictions = await model.classify(dummyTensor);
  
      console.log("📈 Tahminler:", predictions);
      setPrediction(predictions[0]);
    } catch (e) {
      console.error("🧨 Tahmin hatası:", e);
    }
  
    setIsLoading(false);
  };
  

  // 🔄 Kameraya geri dön
  const resetCamera = () => {
    setPhotoUri(null);
    setPrediction(null);
    setIsCameraActive(true);
  };

  const pickFromGallery = () => {
    launchImageLibrary({ mediaType: 'photo' }, (response) => {
      if (response.didCancel) {
        console.log("❌ Kullanıcı iptal etti");
      } else if (response.errorCode) {
        console.error("📛 Galeri hatası:", response.errorMessage);
      } else if (response.assets && response.assets.length > 0) {
        const image = response.assets[0];
        console.log("🖼️ Galeriden seçilen foto:", image.uri);
        setPhotoUri(image.uri);
        setIsCameraActive(false);
        setPrediction(null);
      }
    });
  };
  

  if (!hasPermission || !selectedDevice) {
    return (
      <View style={styles.centered}>
        <Text style={{ color: 'white' }}>Kamera yükleniyor...</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      {isCameraActive && (
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
          {/* Çekilen fotoğrafı tam ekran göster */}
          <Image
            source={{ uri: photoUri }}
            style={StyleSheet.absoluteFill}
            resizeMode="cover"
          />

          {/* Tahmin ve kontrol kutusu */}
          <View style={styles.overlayBox}>
            {isLoading ? (
              <ActivityIndicator color="white" size="large" />
            ) : prediction ? (
              <>
                <Text style={styles.predictionText}>🚀 {prediction.className}</Text>
                <Text style={styles.predictionText}>
                  🎯 Güven: {(prediction.probability * 100).toFixed(2)}%
                </Text>
              </>
            ) : model ? (
              <TouchableOpacity onPress={classifyPhoto}>
                <Text style={styles.buttonText}>🤖 Tahmin Et</Text>
              </TouchableOpacity>
            ) : (
              <Text style={styles.buttonText}>⏳ Model yükleniyor...</Text>
            )}

            {/* Geri Dön */}
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
    position: 'absolute',
    bottom: 40,
    alignSelf: 'center',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    textAlign: 'center',
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
    marginBottom: 4,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    position: 'absolute',
    bottom: 40,
    width: '100%',
  },
  galleryButton: {
    backgroundColor: '#6c5ce7',
    padding: 12,
    borderRadius: 10,
  },
  
});
