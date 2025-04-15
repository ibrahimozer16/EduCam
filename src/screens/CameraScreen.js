import React, { useEffect, useState, useRef, useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Camera, useCameraDevices } from 'react-native-vision-camera';
import * as tf from '@tensorflow/tfjs';
import '@tensorflow/tfjs-backend-cpu';
import * as mobilenet from '@tensorflow-models/mobilenet';

export default function CameraScreen() {
  const cameraRef = useRef(null);
  const [hasPermission, setHasPermission] = useState(false);
  const [model, setModel] = useState(null);
  const [prediction, setPrediction] = useState('');
  const [device, setDevice] = useState(null);
  const cameraDevices = useCameraDevices();

  // Kamera izni ve model yükleme
  useEffect(() => {
    (async () => {
      const status = await Camera.getCameraPermissionStatus();
      console.log("🎯 İlk izin durumu:", status);

      if (status !== 'authorized') {
        const newStatus = await Camera.requestCameraPermission();
        console.log("🔄 Yeniden istenen izin sonucu:", newStatus);
        setHasPermission(newStatus === 'authorized');
      } else {
        setHasPermission(true);
      }

      await tf.setBackend('cpu');
      await tf.ready();

      const loadedModel = await mobilenet.load();
      setModel(loadedModel);
    })();
  }, []);

  useEffect(() => {
    if (cameraDevices.devices && cameraDevices.devices.length > 0) {
      const selected = cameraDevices.devices.find((cam) => cam.hardwareLevel !== 'limited') ?? cameraDevices.devices[0];
      console.log("📸 Seçilen cihaz:", selected);
      setDevice(selected);
    } else {
      console.log("🚫 Cihaz listesi henüz boş.");
    }
  }, [cameraDevices.devices]);

  // Kamera cihazları loglama
  useEffect(() => {
    console.log("📷 Seçilen device:", device);
    console.log("🔐 Kamera izni:", hasPermission);
    console.log("📦 Tüm cihaz verisi:", cameraDevices);
  }, [device, hasPermission, cameraDevices]);

  // Fotoğraf çekme ve sınıflandırma
  const handleCaptureAndPredict = async () => {
    if (!cameraRef.current || !model) return;

    try {
      const photo = await cameraRef.current.takePhoto({ flash: 'off' });
      console.log('📸 Fotoğraf çekildi:', photo.path);
      setPrediction('⚙️ Tanıma henüz entegre değil (Tensor çeviri gelecek)');
    } catch (err) {
      console.error('❌ Fotoğraf çekme hatası:', err);
    }
  };

  if (!device || !hasPermission) {
    return (
      <View style={styles.centered}>
        <Text style={{ color: '#fff' }}>Kamera yükleniyor...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Camera
        ref={cameraRef}
        style={StyleSheet.absoluteFill}
        device={device}
        isActive={true}
        photo={true}
      />

      <View style={styles.overlay}>
        <TouchableOpacity style={styles.button} onPress={handleCaptureAndPredict}>
          <Text style={styles.buttonText}>📸 Fotoğraf Çek</Text>
        </TouchableOpacity>

        <Text style={styles.result}>{prediction}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#000' },
  overlay: {
    position: 'absolute',
    bottom: 60,
    width: '100%',
    alignItems: 'center',
  },
  button: {
    backgroundColor: '#1e90ff',
    padding: 12,
    borderRadius: 10,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
  },
  result: {
    marginTop: 15,
    fontSize: 18,
    color: '#fff',
    backgroundColor: 'rgba(0,0,0,0.6)',
    padding: 10,
    borderRadius: 8,
  },
});
