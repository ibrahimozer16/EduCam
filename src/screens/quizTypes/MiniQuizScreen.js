import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
  ScrollView,
} from 'react-native';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import Icon from 'react-native-vector-icons/Ionicons';
import Tts from 'react-native-tts';
import { useTranslation } from 'react-i18next';

export default function MiniQuizScreen({ navigation }) {
  const { t, i18n } = useTranslation();
  const [questions, setQuestions] = useState([]);
  const [current, setCurrent] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [score, setScore] = useState(0);
  const [showResult, setShowResult] = useState(false);
  const [optionsMap, setOptionsMap] = useState({});
  const userId = auth().currentUser.uid;

  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        const snapshot = await firestore()
          .collection(`users/${userId}/recognized_items`)
          .where(`label_en`, '!=', '')
          .get();

        const raw = snapshot.docs.map(doc => doc.data());

        const uniqueLabels = new Set();
        const filtered = [];
        for (const item of raw) {
          const key = item[`label_en`];
          if (key && !uniqueLabels.has(key)) {
            uniqueLabels.add(key);
            filtered.push(item);
          }
        }

        const shuffled = shuffleArray(filtered).slice(0, 5);
        setQuestions(shuffled);

        const newMap = {};
        shuffled.forEach(q => {
          const correctLabel = q[`label_en`];
          const others = filtered
            .map(item => item[`label_en`])
            .filter(label => label !== correctLabel);
          const options = shuffleArray([correctLabel, ...shuffleArray(others).slice(0, 3)]);
          newMap[correctLabel] = options;
        });

        setOptionsMap(newMap);
      } catch (error) {
        console.log('Veri alınırken hata:', error);
      }
    };

    fetchQuestions();
  }, [userId, i18n.language]);

  useEffect(() => {
    if (showResult) {
      const saveResult = async () => {
        const uid = auth().currentUser?.uid;
        if (!uid) return;

        const max = questions.length * 10;
        const percentage = (score / max) * 100;

        let feedback = '';
        if (percentage >= 80) feedback = 'perfectJob';
        else if (percentage >= 60) feedback = 'goodJob';
        else feedback = 'morePractice';

        try {
          await firestore()
            .collection('users')
            .doc(uid)
            .collection('exam_results')
            .add({
              type: 'miniQuiz',
              mode: 'library',
              score,
              total: max,
              feedback,
              date: firestore.FieldValue.serverTimestamp(),
            });

          console.log('✅ Mini quiz sonucu kaydedildi.');
        } catch (err) {
          console.error('❌ Firestore kayıt hatası:', err);
        }

        Tts.stop();
        Tts.speak(feedback, { language: getLocaleCode(i18n.language) });
      };

      saveResult();
    }
  }, [showResult, score, questions.length, i18n.language, t]);

  const shuffleArray = array => [...array].sort(() => Math.random() - 0.5);

  const getLocaleCode = lang => {
    switch (lang) {
      case 'tr': return 'tr-TR';
      case 'en': return 'en-US';
      case 'es': return 'es-ES';
      case 'zh': return 'zh-CN';
      default: return 'en-US';
    }
  };

  const speak = (text) => {
    Tts.stop();
    Tts.speak(text, { language: getLocaleCode(i18n.language) });
  };

  const handleSelect = (option) => {
    const currentQuestion = questions[current];
    const correct = currentQuestion[`label_en`];
    const isCorrect = option === correct;

    if (selectedAnswers[current] !== undefined) return;

    setSelectedAnswers(prev => ({
      ...prev,
      [current]: { selected: option, correct: isCorrect },
    }));

    if (isCorrect) setScore(prev => prev + 10);
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
    const max = questions.length * 10;
    const feedback = score >= 0 ? (score / max) >= 0.8 ? 'perfectJob' : (score / max) >= 0.6 ? 'goodJob' : 'morePractice' : '';

    return (
      <View style={styles.center}>
        <Text style={styles.resultText}>{t('gameOver')}</Text>
        <Text style={styles.scoreText}>{t('game_completed', { score })}</Text>
        <Text style={styles.scoreText}>{t(feedback)}</Text>

        <View style={styles.resultButtons}>
          <TouchableOpacity
            style={[styles.resultButton, { backgroundColor: '#00cec9' }]}
            onPress={() => {
              setCurrent(0);
              setSelectedAnswers({});
              setScore(0);
              setShowResult(false);
              setQuestions(shuffleArray(questions));
            }}
          >
            <Text style={styles.resultButtonText}>{t('play_again')}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.resultButton, { backgroundColor: '#6c5ce7' }]}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.resultButtonText}>{t('backToHome')}</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const currentQuestion = questions[current];
  const currentLabel = currentQuestion[`label_en`];
  const options = optionsMap[currentLabel] || [];
  const selected = selectedAnswers[current]?.selected;

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>{t('question', { index: current + 1, total: questions.length })}</Text>
      <Image source={{ uri: currentQuestion.photoUrl }} style={styles.image} />

      <TouchableOpacity
        style={styles.soundButton}
        onPress={() => speak(currentLabel)}
      >
        <Icon name="volume-high" size={30} color="#6c5ce7" />
      </TouchableOpacity>

      <View style={styles.optionsContainer}>
        {options.map((option, index) => {
          const isSelected = selected === option;
          const isCorrect = currentLabel === option;
          const showColor = selected !== undefined;

          let backgroundColor = '#dfe6e9';
          if (showColor) {
            if (isSelected && isCorrect) backgroundColor = '#00b894';
            else if (isSelected && !isCorrect) backgroundColor = '#d63031';
            else if (!isSelected && isCorrect) backgroundColor = '#00b894';
          }

          return (
            <TouchableOpacity
              key={index}
              style={[styles.optionButton, { backgroundColor }]}
              onPress={() => handleSelect(option)}
              disabled={selected !== undefined}
            >
              <Text style={styles.optionText}>{t(`label_${option}`) || option}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <View style={styles.navContainer}>
        <TouchableOpacity onPress={goBack} disabled={current === 0}>
          <Icon name="arrow-back-circle" size={40} color={current === 0 ? '#ccc' : '#6c5ce7'} />
        </TouchableOpacity>
        <TouchableOpacity onPress={goNext} disabled={selected === undefined}>
          <Icon
            name={current + 1 === questions.length ? 'checkmark-circle' : 'arrow-forward-circle'}
            size={40}
            color={selected === undefined ? '#ccc' : '#0984e3'}
          />
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#f5f6fa' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 10, textAlign: 'center', color: '#6c5ce7' },
  image: { width: '100%', height: 200, resizeMode: 'contain', borderRadius: 12, backgroundColor: '#dfe6e9' },
  soundButton: { alignItems: 'center', marginTop: 10 },
  optionsContainer: { marginTop: 20 },
  optionButton: {
    padding: 14,
    marginVertical: 6,
    borderRadius: 10,
    alignItems: 'center',
  },
  optionText: { fontSize: 16, color: '#2d3436' },
  navContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 30,
    paddingHorizontal: 20,
  },
  resultText: { fontSize: 24, fontWeight: 'bold', color: '#2d3436' },
  scoreText: { fontSize: 20, marginTop: 10, color: '#0984e3' },
  resultButtons: { marginTop: 30, gap: 15, width: '80%' },
  resultButton: { padding: 14, borderRadius: 10, alignItems: 'center' },
  resultButtonText: { color: 'white', fontSize: 16, fontWeight: 'bold' },
});
