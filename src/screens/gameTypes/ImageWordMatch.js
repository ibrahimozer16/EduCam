import React, { useEffect, useState } from 'react';
import { View, Text, Image, StyleSheet, Dimensions, TouchableOpacity } from 'react-native';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import Tts from 'react-native-tts';
import Icon from 'react-native-vector-icons/Ionicons';
import DraggableFlatList from 'react-native-draggable-flatlist';
import { useTranslation } from 'react-i18next';

const { width } = Dimensions.get('window');

export default function ImageWordMatchScreen({ route, navigation }) {
  const { mode } = route.params;
  const { t, i18n } = useTranslation();

  const [images, setImages] = useState([]);
  const [labels, setLabels] = useState([]);
  const [showResult, setShowResult] = useState(false);
  const [score, setScore] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      const lang = i18n.language;
      const uid = auth().currentUser?.uid;
      const isLibrary = mode === 'library';
      const labelKey = isLibrary ? 'label_en' : 'label';

      const query = isLibrary
        ? firestore().collection('users').doc(uid).collection('recognized_items').where(labelKey, '!=', '')
        : firestore().collection('general_quiz').where(labelKey, '!=', '');

      const snapshot = await query.get();
      const allData = snapshot.docs
        .map(doc => doc.data())
        .filter(d => d[labelKey] && (d.photoUrl || d.image_url));

      const labelSet = new Set();
      const uniqueData = [];
      for (const item of allData) {
        const key = item[labelKey]?.toLowerCase();
        if (!labelSet.has(key)) {
          labelSet.add(key);
          uniqueData.push(item);
        }
      }

      const selected = uniqueData.sort(() => Math.random() - 0.5).slice(0, 5);

      const photos = selected.map((i, idx) => ({
        id: `img-${idx}`,
        uri: i.photoUrl || i.image_url,
        label: i[labelKey].toLowerCase(),
      }));

      const shuffledLabels = [...photos]
        .map(i => ({ id: `label-${i.id}`, label: i.label }))
        .sort(() => Math.random() - 0.5);

      setImages(photos);
      setLabels(shuffledLabels);
    };

    fetchData();
  }, [mode, i18n.language]);

  const speak = (text) => {
    Tts.stop();
    const spokenText = mode === 'library' ? t(`label_${text}`) : text;
    Tts.speak(spokenText, { language: i18n.language === 'tr' ? 'tr-TR' : 'en-US' });
  };

  const checkMatch = () => {
    let correct = 0;
    for (let i = 0; i < images.length; i++) {
      if (labels[i]?.label === images[i]?.label) correct++;
    }
    const calculatedScore = correct * 10;
    setScore(calculatedScore);
    saveResult(calculatedScore);
    setShowResult(true);
  };

  const saveResult = async (score) => {
    const uid = auth().currentUser?.uid;
    if (!uid) return;
    const feedback = score >= 40 ? 'perfectJob' : score >= 20 ? 'goodJob' : 'morePractice';

    try {
      await firestore()
        .collection('users')
        .doc(uid)
        .collection('game_results')
        .add({
          type: 'imageWordMatchDemo',
          mode,
          score,
          total: 50,
          feedback,
          date: firestore.FieldValue.serverTimestamp(),
        });
    } catch (err) {
      console.error('❌ Firestore kayıt hatası:', err);
    }
  };

  const restart = () => {
    setShowResult(false);
    setScore(0);
    setLabels([]);
    setImages([]);
  };

  if (showResult) {
    const feedback = score >= 40 ? 'perfectJob' : score >= 20 ? 'goodJob' : 'morePractice';

    return (
      <View style={styles.container}>
        <Text style={styles.title}>{t('gameOver')}</Text>
        <Text style={styles.scoreText}>{t('score')}: {score} / 50</Text>
        <Text style={styles.feedback}>{t(feedback)}</Text>
        <TouchableOpacity style={styles.returnButton} onPress={restart}>
          <Text style={styles.returnText}>{t('play_again')}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.returnButton} onPress={() => navigation.navigate('Games')}>
          <Text style={styles.returnText}>{t('backToGames')}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🧩 {t('imageWordMatchDemo')}</Text>
      <View style={styles.rowWrapper}>
        <View style={styles.leftColumn}>
          {images.map((item, index) => (
            <View key={index} style={styles.imageRow}>
              <Image source={{ uri: item.uri }} style={styles.image} />
            </View>
          ))}
        </View>

        <View style={styles.rightColumn}>
          <DraggableFlatList
            data={labels}
            onDragEnd={({ data }) => setLabels(data)}
            keyExtractor={item => item.id}
            renderItem={({ item, drag, isActive }) => (
              <TouchableOpacity
                style={[styles.labelBox, isActive && { opacity: 0.8 }]}
                onLongPress={drag}
              >
                <Text style={styles.labelText}>
                  { t(`label_${item.label}`) }
                </Text>
                <TouchableOpacity onPress={() => speak(item.label)}>
                  <Icon name="volume-high" size={20} color="#2d3436" />
                </TouchableOpacity>
              </TouchableOpacity>
            )}
          />
        </View>
      </View>

      <TouchableOpacity style={styles.checkButton} onPress={checkMatch}>
        <Text style={styles.checkText}>{t('check')}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#ecf0f1', justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 22, fontWeight: 'bold', textAlign: 'center', marginBottom: 20, color: '#2d3436' },
  rowWrapper: { flexDirection: 'row', flex: 1 },
  leftColumn: { width: width * 0.45, justifyContent: 'space-between' },
  rightColumn: { width: width * 0.45, marginLeft: 16 },
  imageRow: { marginBottom: 12 },
  image: { width: '100%', height: 100, borderRadius: 10 },
  labelBox: {
    backgroundColor: '#74b9ff',
    borderRadius: 10,
    padding: 12,
    marginVertical: 33,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  labelText: { color: 'white', fontWeight: 'bold', fontSize: 16 },
  checkButton: {
    marginTop: 20,
    backgroundColor: '#6c5ce7',
    padding: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  checkText: { color: 'white', fontSize: 16, fontWeight: 'bold' },
  scoreText: { fontSize: 20, marginTop: 10, color: '#0984e3', textAlign: 'center' },
  feedback: { fontSize: 18, marginTop: 10, color: '#636e72', textAlign: 'center' },
  returnButton: {
    marginTop: 20,
    backgroundColor: '#6c5ce7',
    padding: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  returnText: { color: 'white', fontSize: 16, fontWeight: 'bold' },
});