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

export default function MiniQuizScreen({ navigation }) {
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
          .where('label_tr', '!=', '')
          .get();

        const raw = snapshot.docs
          .map(doc => doc.data())
          .filter(item => item.label_tr && item.label_tr.trim() !== '');

        const uniqueLabels = new Set();
        const filtered = [];
        for (const item of raw) {
          if (!uniqueLabels.has(item.label_tr)) {
            uniqueLabels.add(item.label_tr);
            filtered.push(item);
          }
        }

        const shuffled = shuffleArray(filtered).slice(0, 5);
        setQuestions(shuffled);

        const newMap = {};
        shuffled.forEach(q => {
          const others = filtered.map(item => item.label_tr).filter(label => label !== q.label_tr);
          const options = shuffleArray([q.label_tr, ...shuffleArray(others).slice(0, 3)]);
          newMap[q.label_tr] = options;
        });

        setOptionsMap(newMap);
      } catch (error) {
        console.log('Veri alınırken hata:', error);
      }
    };

    fetchQuestions();
  }, [userId]);

  useEffect(() => {
    if (showResult) {
      const saveResult = async () => {
        const uid = auth().currentUser?.uid;
        if (!uid) return;

        const max = questions.length * 10;
        const percentage = (score / max) * 100;
        let feedback = '';
        if (percentage >= 80) feedback = 'Mükemmel bir performans!';
        else if (percentage >= 60) feedback = 'Gayet iyi!';
        else if (percentage >= 30) feedback = 'Geliştirmen gerek!';
        else feedback = 'Daha çok çalışmalısın!';

        try {
          await firestore()
            .collection('users')
            .doc(uid)
            .collection('exam_results') // Sınavlar için
            .add({
              type: 'Mini Sınav',
              mode: 'library',
              score: score,
              total: max,
              feedback: feedback,
              date: firestore.FieldValue.serverTimestamp(),
            });

          console.log('✅ Mini quiz sonucu kaydedildi.');
        } catch (err) {
          console.error('❌ Firestore kayıt hatası:', err);
        }
      };

      saveResult();
    }
  }, [showResult, score, questions.length]);

  const shuffleArray = (array) => [...array].sort(() => Math.random() - 0.5);

  const speak = (text) => {
    Tts.stop();
    Tts.speak(text, { language: 'tr-TR' });
  };

  const handleSelect = (option) => {
    const currentQuestion = questions[current];
    const isCorrect = option === currentQuestion.label_tr;

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
    return <View style={styles.center}><Text>Yükleniyor...</Text></View>;
  }

  if (showResult) {
    const max = questions.length * 10;
    const percentage = (score / max) * 100;
    let feedback = '';
    if (percentage >= 80) feedback = 'Mükemmel bir performans!';
    else if (percentage >= 60) feedback = 'Gayet iyi!';
    else if (percentage >= 30) feedback = 'Geliştirmen gerek!';
    else feedback = 'Daha çok çalışmalısın!';

    speak(feedback);

    return (
      <View style={styles.center}>
        <Text style={styles.resultText}>🎉 Mini Sınav Bitti!</Text>
        <Text style={styles.scoreText}>Puan: {score} / {max}</Text>
        <Text style={styles.scoreText}>{feedback}</Text>

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
            <Text style={styles.resultButtonText}>🔁 Tekrar Dene</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.resultButton, { backgroundColor: '#6c5ce7' }]}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.resultButtonText}>🔙 Sınavlar Ekranına Dön</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const currentQuestion = questions[current];
  const options = optionsMap[currentQuestion.label_tr] || [];
  const selected = selectedAnswers[current]?.selected;

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Soru {current + 1} / {questions.length}</Text>
      <Image source={{ uri: currentQuestion.photoUrl }} style={styles.image} />

      <View style={styles.optionsContainer}>
        {options.map((option, index) => {
          const isSelected = selected === option;
          const isCorrect = currentQuestion.label_tr === option;
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
              <Text style={styles.optionText}>{option}</Text>
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
  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 10, textAlign: 'center' },
  image: { width: '100%', height: 200, resizeMode: 'contain', borderRadius: 12, backgroundColor: '#dfe6e9' },
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
