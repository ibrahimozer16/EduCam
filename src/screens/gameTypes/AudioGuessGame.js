// AudioGuessGame.js (i18n uyarlanmış hali)
import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import Icon from 'react-native-vector-icons/Ionicons';
import Tts from 'react-native-tts';
import { useTranslation } from 'react-i18next';

export default function AudioGuessGame({ route, navigation }) {
  const { mode } = route.params;
  const { t, i18n } = useTranslation();

  const [questions, setQuestions] = useState([]);
  const [current, setCurrent] = useState(0);
  const [score, setScore] = useState(0);
  const [answers, setAnswers] = useState({});
  const [showResult, setShowResult] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      const uid = auth().currentUser?.uid;
      const labelKey = mode === 'library' ? `label_en` : 'label';

      let query = mode === 'library'
        ? firestore().collection('users').doc(uid).collection('recognized_items').where(labelKey, '!=', '')
        : firestore().collection('general_quiz').where(labelKey, '!=', '');

      const snapshot = await query.get();
      const raw = snapshot.docs.map(doc => doc.data()).filter(item => item[labelKey] && (item.photoUrl || item.image_url));

      const uniqueLabels = new Set();
      const filtered = [];
      for (const item of raw) {
        if (!uniqueLabels.has(item[labelKey])) {
          uniqueLabels.add(item[labelKey]);
          filtered.push(item);
        }
      }

      const shuffled = shuffleArray(filtered).slice(0, 5);
      const questionData = shuffled.map(correct => {
        const wrongs = filtered.filter(i => i[labelKey] !== correct[labelKey]);
        const options = shuffleArray([correct, ...shuffleArray(wrongs).slice(0, 3)]);
        return {
          label: correct[labelKey],
          correctUri: correct.photoUrl || correct.image_url,
          options,
        };
      });

      setQuestions(questionData);
    };

    fetchData();
  }, [mode, i18n.language]);

  const getFeedback = useCallback((puan) => {
    if (puan >= 40) return 'perfectJob';
    if (puan >= 25) return 'goodJob';
    return t('morePractice');
  }, [t]);

  const saveResult = useCallback(async () => {
    const uid = auth().currentUser?.uid;
    if (!uid) return;

    try {
      await firestore()
        .collection('users')
        .doc(uid)
        .collection('game_results')
        .add({
          type: 'audioGuessGame',
          mode: mode,
          score: score,
          total: questions.length * 10,
          feedback: getFeedback(score),
          date: firestore.FieldValue.serverTimestamp(),
        });

      console.log('✅ Sesli Tahmin sonucu kaydedildi.');
    } catch (err) {
      console.error('❌ Firestore kayıt hatası:', err);
    }
  }, [mode, score, questions.length, getFeedback]);

  useEffect(() => {
    if (showResult) {
      saveResult();
    }
  }, [showResult, saveResult]);

  const shuffleArray = arr => [...arr].sort(() => Math.random() - 0.5);

  const speak = (text) => {
    const langMap = {
      tr: 'tr-TR',
      en: 'en-US',
      es: 'es-ES',
      zh: 'zh-CN',
    };
    const langCode = langMap[i18n.language] || 'en-US';
    Tts.stop();
    Tts.speak(text, { language: langCode });
  };

  const handleSelect = (uri) => {
    const currentQ = questions[current];
    if (answers[current]) return;

    const isCorrect = uri === currentQ.correctUri;

    setAnswers(prev => ({
      ...prev,
      [current]: { selected: uri, correct: isCorrect },
    }));

    if (isCorrect) {
      setScore(prev => prev + 10);
    }
  };

  const goNext = () => {
    if (current + 1 >= questions.length) setShowResult(true);
    else setCurrent(prev => prev + 1);
  };

  const goBack = () => {
    if (current > 0) setCurrent(prev => prev - 1);
  };

  if (questions.length === 0) {
    return <View style={styles.center}><Text>{t('loading')}</Text></View>;
  }

  if (showResult) {
    return (
      <View style={styles.center}>
        <Text style={styles.resultText}>{t('gameOver')}</Text>
        <Text style={styles.scoreText}>{t('score')}: {score} / {questions.length * 10}</Text>
        <Text style={styles.feedback}>{t(getFeedback(score))}</Text>

        <View style={styles.resultButtons}>
          <TouchableOpacity style={[styles.resultButton, { backgroundColor: '#00cec9' }]} onPress={() => navigation.navigate('Games')}>
            <Text style={styles.resultButtonText}>{t('backToGames')}</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const currentQ = questions[current];
  const correct = currentQ.correctUri;
  const selected = answers[current]?.selected;

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>{t('question', { index: current + 1, total: questions.length })}</Text>
      <Text style={styles.scoreText}>{t('score')} {score} / {questions.length * 10}</Text>
      <Text style={styles.info}>{t('listenInstruction')}</Text>
      <View style={styles.labelRow}>
        <TouchableOpacity onPress={() => speak(t(`label_${currentQ.label}`))}>
          <Icon name="volume-high" size={40} color="#0984e3" />
        </TouchableOpacity>
      </View>

      <View style={styles.imageOptionsContainer}>
        {currentQ.options.map((opt, idx) => {
          const uri = opt.photoUrl || opt.image_url;
          const isSelected = selected === uri;
          const isCorrect = uri === correct;
          const answered = selected !== undefined;

          let borderColor = '#ccc';
          if (answered) {
            if (isSelected && isCorrect) borderColor = '#00b894';
            else if (isSelected && !isCorrect) borderColor = '#d63031';
            else if (!isSelected && isCorrect) borderColor = '#00b894';
          }

          return (
            <TouchableOpacity
              key={idx}
              onPress={() => handleSelect(uri)}
              disabled={answered}
              style={[styles.imageWrapper, { borderColor }]}
            >
              <Image source={{ uri }} style={styles.imageOption} />
            </TouchableOpacity>
          );
        })}
      </View>

      <View style={styles.navContainer}>
        <TouchableOpacity onPress={goBack} disabled={current === 0}>
          <Icon name="arrow-back-circle" size={42} color={current === 0 ? '#ccc' : '#6c5ce7'} />
        </TouchableOpacity>

        <TouchableOpacity onPress={goNext} disabled={!answers[current]}>
          <Icon name="arrow-forward-circle" size={42} color={!answers[current] ? '#ccc' : '#0984e3'} />
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#f5f6fa' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 10, textAlign: 'center', color: '#0984e3' },
  info: { fontSize: 20, alignSelf: 'center', justifyContent: 'center', marginVertical: 15, color: '#0984e3' },
  labelRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 12 },
  labelText: { fontSize: 20, fontWeight: 'bold', color: '#2d3436' },
  imageOptionsContainer: {
    flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 12, marginTop: 10,
  },
  imageWrapper: { borderWidth: 3, borderRadius: 12, overflow: 'hidden', margin: 6 },
  imageOption: { width: 135, height: 135, resizeMode: 'cover' },
  navContainer: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 30, paddingHorizontal: 20 },
  resultText: { fontSize: 24, fontWeight: 'bold', color: '#2d3436' },
  scoreText: { fontSize: 20, marginTop: 10, color: '#0984e3' },
  feedback: { fontSize: 18, marginTop: 10, color: '#636e72' },
  resultButtons: { marginTop: 30, gap: 15, width: '80%' },
  resultButton: { padding: 14, borderRadius: 10, alignItems: 'center' },
  resultButtonText: { color: 'white', fontSize: 16, fontWeight: 'bold' },
});