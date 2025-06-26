# 📱 EduCam – Çocuklar İçin Eğitici Görsel Tanıma Uygulaması

Bu proje, çocukların görsel, işitsel ve dil gelişimini desteklemek amacıyla geliştirilen, yapay zekâ destekli bir mobil eğitim uygulamasıdır. React Native CLI ile geliştirilen uygulama, nesne tanıma modeli, çoklu dil desteği, eğitici sınav ve oyunlarla donatılmıştır.

## 🚀 Temel Özellikler

- 📷 Görselden nesne tanıma (TFLite - ResNet50)
- 🌍 Türkçe, İngilizce, İspanyolca, Çince dil desteği (i18next)
- 🔊 Sesli yönlendirme (TTS) ve sesli yanıt alma (STT)
- 🎮 Eğitici oyunlar: Harf bulma, eşleştirme, sesli testler
- 📊 Analiz ekranı ve gelişim takibi
- 🔐 Firebase ile kullanıcı yönetimi ve sonuç kaydı

## 🧠 Kullanılan Teknolojiler

- React Native (CLI yapısı ile)
- Firebase (Auth, Firestore, Storage)
- TensorFlow Lite (ResNet50, .tflite modeli)
- i18next (Çoklu dil desteği)
- Python & Google Colab (Model eğitimi)
- TTS (react-native-tts), STT (Voice)

## ⚙️ Kurulum

> Proje `React Native CLI` ile geliştirilmiştir.

### Gerekli Araçlar:
- Android Studio (emülatör veya cihaz için)
- Visual Code ya da kodun çalışacağı bir IDE

### Adımlar:
```bash
git clone https://github.com/ibrahimozer16/educam.git
```

```bash
cd educam
npm install
```

- Metro için
```bash
npx react-native start --reset-cache
```

- Android başlatmak için
```bash
npx react-native run-android
```

## Projenin Videosu
https://www.youtube.com/watch?v=sTe-dEjaMQs
## Geliştirici
İbrahim Özer


