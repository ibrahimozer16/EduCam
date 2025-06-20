import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet, ScrollView } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import Tts from 'react-native-tts';

export default function GeneralQuizScreen({ navigation }) {
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
        .where('label_tr', '!=', '')
        .get();

      const allData = snapshot.docs
        .map(doc => doc.data())
        .filter((item, index, self) =>
          index === self.findIndex(t => t.label_tr === item.label_tr)
        );

      const shuffledData = shuffleArray(allData).slice(0, 10);
      setQuestions(shuffledData);

      const newMap = {};
      shuffledData.forEach(q => {
        const others = allData.map(item => item.label_tr).filter(label => label !== q.label_tr);
        const options = shuffleArray([q.label_tr, ...shuffleArray(others).slice(0, 3)]);
        newMap[q.label_tr] = options;
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

        const feedback = getFeedback(score, questions.length * 10);

        try {
          await firestore()
            .collection('users')
            .doc(uid)
            .collection('exam_results')
            .add({
              type: 'Genel Sınav',
              score: score,
              total: questions.length * 10,
              feedback: feedback,
              mode: 'general',
              date: firestore.FieldValue.serverTimestamp(),
            });

          console.log('✅ Sınav sonucu ve yorum kaydedildi');
        } catch (err) {
          console.error('❌ Firestore kayıt hatası:', err);
        }
      };

      saveResult();
    }
  }, [showResult, questions.length, score]);

  const shuffleArray = (array) => {
    return [...array].sort(() => Math.random() - 0.5);
  };

  const handleSelect = (option) => {
    const currentQuestion = questions[current];
    const isCorrect = option === currentQuestion.label_tr;

    if (selectedAnswers[current] !== undefined) return;

    setSelectedAnswers(prev => ({
      ...prev,
      [current]: { selected: option, correct: isCorrect }
    }));

    if (isCorrect) setScore(prev => prev + 10);
  };

  const goNext = () => {
    if (current + 1 >= questions.length) {
      setShowResult(true);
    } else {
      setCurrent(prev => prev + 1);
    }
  };

  const goBack = () => {
    if (current > 0) {
      setCurrent(prev => prev - 1);
    }
  };

  const speak = (text) => {
    Tts.stop();
    Tts.speak(text, { language: 'tr-TR' });
  };

  const getFeedback = (score, total) => {
    const percent = (score / total) * 100;
    if (percent >= 80) return 'Mükemmel bir performans!';
    if (percent >= 60) return 'Gayet iyi, biraz daha çalış!';
    return 'Geliştirmen gerekiyor, tekrar dene!';
  };

  if (questions.length === 0) {
    return (
      <View style={styles.center}>
        <Text>Yükleniyor...</Text>
      </View>
    );
  }


  if (showResult) {
    const feedback = getFeedback(score, questions.length * 10);
    Tts.stop();
    Tts.speak(feedback, { language: 'tr-TR' });

    return (
      <View style={styles.center}>
        <Text style={styles.resultText}>🎉 Sınav Bitti!</Text>
        <Text style={styles.scoreText}>Toplam Puan: {score} / {questions.length * 10}</Text>
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
      <Image source={{ uri: currentQuestion.image_url }} style={styles.image} />

      <TouchableOpacity
        style={styles.soundButton}
        onPress={() => speak(currentQuestion.label_tr)}
      >
        <Icon name="volume-high" size={30} color="#6c5ce7" />
      </TouchableOpacity>

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
        <TouchableOpacity
          onPress={goNext}
          disabled={selected === undefined}
        >
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
  container: { flex: 1, padding: 20, backgroundColor: '#f1f2f6' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 10, textAlign: 'center' },
  image: { width: '100%', height: 200, resizeMode: 'contain', borderRadius: 12, backgroundColor: '#dfe6e9' },
  soundButton: { alignItems: 'center', marginTop: 10 },
  optionsContainer: { marginTop: 20 },
  optionButton: {
    padding: 14,
    marginVertical: 6,
    borderRadius: 10,
    alignItems: 'center',
    elevation: 2,
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
  resultButtons: {
    marginTop: 30,
    gap: 15,
    width: '80%',
  },
  resultButton: {
    padding: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  resultButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});