// Genel Quiz: Fotoğrafa Göre Şık Seçme (Geliştirilmiş)
import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet, ScrollView } from 'react-native';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import Icon from 'react-native-vector-icons/Ionicons';
import Tts from 'react-native-tts';

export default function ImageMultipleChoiceGeneralScreen({ navigation }) {
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

      const data = snapshot.docs
        .map(doc => doc.data())
        .filter(item => item.label_tr && item.label_tr.trim() !== '');

      const uniqueLabels = [...new Set(data.map(item => item.label_tr))];
      const selectedLabels = shuffleArray(uniqueLabels).slice(0, 10);
      const selectedQuestions = selectedLabels.map(label => {
        const q = data.find(item => item.label_tr === label);
        return q;
      });

      setQuestions(selectedQuestions);

      const newMap = {};
      selectedQuestions.forEach(q => {
        const others = data.filter(item => item.label_tr !== q.label_tr);
        const images = shuffleArray([q, ...shuffleArray(others).slice(0, 3)]);
        newMap[q.label_tr] = images;
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

      // Feedback mesajını doğrudan burada belirleyelim
      let feedback = '';
      if (score >= 80) feedback = '🌟 Mükemmel!';
      else if (score >= 60) feedback = '👍 İyi iş!';
      else if (score >= 30) feedback = '🔄 Geliştirmen gerek!';
      else feedback = '😅 Daha çok çalışmalısın!';

      try {
        await firestore()
          .collection('users')
          .doc(uid)
          .collection('exam_results')
          .add({
            type: 'Resimli Genel Sınav',
            mode: 'general',
            score: score,
            total: total,
            feedback: feedback,
            date: firestore.FieldValue.serverTimestamp(),
          });

        console.log('✅ Görsel şık seçme sınav sonucu kaydedildi.');
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
    const isCorrect = option.label_tr === currentQuestion.label_tr;

    if (selectedAnswers[current] !== undefined) return;

    setSelectedAnswers(prev => ({
      ...prev,
      [current]: { selected: option.label_tr, correct: isCorrect }
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

  const getFeedbackMessage = () => {
    if (score >= 80) return '🌟 Mükemmel!';
    if (score >= 60) return '👍 İyi iş!';
    if (score >= 30) return '🔄 Geliştirmen gerek!';
    return '😅 Daha çok çalışmalısın!';
  };

  if (questions.length === 0) {
    return <View style={styles.center}><Text>Yükleniyor...</Text></View>;
  }

  if (showResult) {
    return (
      <View style={styles.center}>
        <Text style={styles.resultText}>🎉 Sınav Bitti!</Text>
        <Text style={styles.scoreText}>Puan: {score} / {questions.length * 10}</Text>
        <Text style={styles.feedback}>{getFeedbackMessage()}</Text>
        <TouchableOpacity onPress={() => speak(getFeedbackMessage())}>
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
      <View style={styles.labelRow}>
        <Text style={styles.title}>Soru {current + 1} / {questions.length}</Text>
        <View style={styles.labelContainer}>
          <Text style={styles.labelText}>{currentQuestion.label_tr}</Text>
          <TouchableOpacity onPress={() => speak(currentQuestion.label_tr)}>
            <Icon name="volume-high" size={26} color="#0984e3" />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.optionsContainer}>
        {options.map((option, index) => {
          const isSelected = selected === option.label_tr;
          const isCorrect = option.label_tr === currentQuestion.label_tr;
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
  title: { fontSize: 20, fontWeight: 'bold', marginBottom: 10, textAlign: 'center' },
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
