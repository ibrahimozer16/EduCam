import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet, ScrollView } from 'react-native';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import Icon from 'react-native-vector-icons/Ionicons';
import Tts from 'react-native-tts';
import { useTranslation } from 'react-i18next';

export default function ImageMultipleChoiceGeneralScreen({ navigation }) {
  const { t, i18n } = useTranslation();
  const [questions, setQuestions] = useState([]);
  const [current, setCurrent] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [score, setScore] = useState(0);
  const [showResult, setShowResult] = useState(false);
  const [optionsMap, setOptionsMap] = useState({});

  useEffect(() => {
    const fetchQuestions = async () => {
      const snapshot = await firestore()
        .collection('general_quiz')
        .where('label', '!=', '')
        .get();

      const data = snapshot.docs.map(doc => doc.data()).filter(item => item.label);

      const uniqueLabels = [...new Set(data.map(item => item.label))];
      const selectedLabels = shuffleArray(uniqueLabels).slice(0, 10);
      const selectedQuestions = selectedLabels
        .map(label => data.find(item => item.label === label))
        .filter(Boolean);

      setQuestions(selectedQuestions);

      const newMap = {};
      selectedQuestions.forEach(q => {
        const key = q.label;
        const others = data.filter(item => item.label !== key);
        const images = shuffleArray([q, ...shuffleArray(others).slice(0, 3)]);
        newMap[key] = images;
      });

      setOptionsMap(newMap);
    };

    fetchQuestions();
  }, []);

  useEffect(() => {
    if (showResult) {
      const saveResult = async () => {
        const uid = auth().currentUser?.uid;
        if (!uid) return;

        const total = questions.length * 10;
        const feedback = getFeedback(score, total);

        try {
          await firestore()
            .collection('users')
            .doc(uid)
            .collection('exam_results')
            .add({
              type: 'imageGeneralQuiz',
              mode: 'general',
              score,
              total,
              feedback,
              date: firestore.FieldValue.serverTimestamp(),
            });
        } catch (err) {
          console.error('❌ Firestore kayıt hatası:', err);
        }

        Tts.stop();
        Tts.speak(feedback, { language: getLocaleCode(i18n.language) });
      };

      saveResult();
    }
  }, [showResult, score, questions.length, i18n.language, t, getFeedback]);

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
    const localized = t(`label_${text}`) || text;
    Tts.stop();
    Tts.speak(localized, { language: getLocaleCode(i18n.language) });
  };

  const handleSelect = (option) => {
    const currentQuestion = questions[current];
    const key = currentQuestion.label;
    const isCorrect = option.label === key;

    if (selectedAnswers[current] !== undefined) return;

    setSelectedAnswers(prev => ({
      ...prev,
      [current]: { selected: option.label, correct: isCorrect },
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

  const getFeedback = useCallback((score, total) => {
    const percent = (score / total) * 100;
    if (percent >= 80) return 'perfectJob';
    if (percent >= 60) return 'goodJob';
    return t('morePractice');
  }, [t]);

  if (questions.length === 0) {
    return <View style={styles.center}><Text>{t('loading')}</Text></View>;
  }

  if (showResult) {
    const feedback = getFeedback(score, questions.length * 10);

    return (
      <View style={styles.center}>
        <Text style={styles.resultText}>{t('gameOver')}</Text>
        <Text style={styles.scoreText}>{t('game_completed', { score })}</Text>
        <Text style={styles.feedback}>{t(feedback)}</Text>

        <TouchableOpacity onPress={() => speak(t(feedback))}>
          <Icon name="volume-high" size={28} color="#0984e3" />
        </TouchableOpacity>

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
  const labelKey = currentQuestion.label;
  const options = optionsMap[labelKey] || [];
  const selected = selectedAnswers[current]?.selected;

  return (
    <ScrollView style={styles.container}>
      <View style={styles.labelRow}>
        <Text style={styles.title}>{t('question', { index: current + 1, total: questions.length })}</Text>
        <View style={styles.labelContainer}>
          <Text style={styles.labelText}>{t(`label_${labelKey}`) || labelKey}</Text>
          <TouchableOpacity onPress={() => speak(labelKey)}>
            <Icon name="volume-high" size={26} color="#0984e3" />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.optionsContainer}>
        {options.map((option, index) => {
          const optionLabel = option.label;
          const isSelected = selected === optionLabel;
          const isCorrect = optionLabel === labelKey;
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
              style={[styles.optionImageWrapper, { backgroundColor }]}
              onPress={() => handleSelect(option)}
              disabled={selected !== undefined}
            >
              <Image source={{ uri: option.photoUrl || option.image_url }} style={styles.optionImage} />
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
  container: { flex: 1, padding: 20, backgroundColor: '#ecf0f1' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  labelRow: { marginBottom: 12 },
  title: { fontSize: 20, fontWeight: 'bold', marginBottom: 10, textAlign: 'center', color: '#0984e3' },
  labelContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
  labelText: { fontSize: 22, fontWeight: 'bold', color: '#2d3436' },
  optionsContainer: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-around', gap: 12 },
  optionImageWrapper: {
    width: '45%',
    borderRadius: 10,
    padding: 8,
    marginVertical: 6,
    alignItems: 'center',
    elevation: 2,
  },
  optionImage: {
    width: '100%',
    height: 120,
    resizeMode: 'cover',
    borderRadius: 10,
  },
  navContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 30,
    paddingHorizontal: 20,
  },
  resultText: { fontSize: 24, fontWeight: 'bold', color: '#2d3436' },
  scoreText: { fontSize: 20, marginTop: 10, color: '#0984e3' },
  feedback: { fontSize: 18, marginVertical: 12, textAlign: 'center', color: '#636e72' },
  resultButtons: { marginTop: 30, gap: 15, width: '80%' },
  resultButton: { padding: 14, borderRadius: 10, alignItems: 'center' },
  resultButtonText: { color: 'white', fontSize: 16, fontWeight: 'bold' },
});
