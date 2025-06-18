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

export default function ImageMultipleChoiceMiniScreen({ navigation }) {
  const [questions, setQuestions] = useState([]);
  const [current, setCurrent] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [score, setScore] = useState(0);
  const [showResult, setShowResult] = useState(false);
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
        const questionsData = shuffled.map(correctItem => {
          const incorrectItems = filtered.filter(item => item.label_tr !== correctItem.label_tr);
          const options = shuffleArray([
            correctItem,
            ...shuffleArray(incorrectItems).slice(0, 5),
          ]);
          return {
            label: correctItem.label_tr,
            correctUri: correctItem.photoUrl || correctItem.image_url,
            options,
          };
        });

        setQuestions(questionsData);
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

        const total = questions.length * 10;
        const feedback = getFeedbackText(score);

        try {
          await firestore()
            .collection('users')
            .doc(uid)
            .collection('exam_results')
            .add({
              type: 'Resimli Mini Sınav',
              mode: 'mini',
              score: score,
              total: total,
              feedback: feedback,
              date: firestore.FieldValue.serverTimestamp(),
            });

          console.log('✅ Mini görsel şıklı sınav sonucu kaydedildi.');
        } catch (err) {
          console.error('❌ Firestore kayıt hatası:', err);
        }
      };

      saveResult();
    }
  }, [showResult, score, questions.length]);


  const shuffleArray = array => [...array].sort(() => Math.random() - 0.5);

  const speak = (text) => {
    Tts.stop();
    Tts.speak(text, { language: 'tr-TR' });
  };

  const getFeedbackText = (puan) => {
    if (puan >= 40) return 'Mükemmel!';
    if (puan >= 30) return 'İyi iş!';
    if (puan >= 20) return 'Fena değil, daha iyisini yapabilirsin.';
    return 'Geliştirmen gerek.';
  };

  const handleSelect = (selectedUri) => {
    const currentQuestion = questions[current];
    const isCorrect = selectedUri === currentQuestion.correctUri;

    if (selectedAnswers[current] !== undefined) return;

    setSelectedAnswers(prev => ({
      ...prev,
      [current]: { selectedUri, correct: isCorrect },
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
    const feedback = getFeedbackText(score);
    Tts.speak(feedback, { language: 'tr-TR' });

    return (
      <View style={styles.center}>
        <Text style={styles.resultText}>🎉 Mini Sınav Bitti!</Text>
        <Text style={styles.scoreText}>Puan: {score} / {questions.length * 10}</Text>
        <Text style={styles.feedbackText}>{feedback}</Text>

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
  const selected = selectedAnswers[current]?.selectedUri;

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Soru {current + 1} / {questions.length}</Text>

      <View style={styles.labelRow}>
        <Text style={styles.labelText}>{currentQuestion.label}</Text>
        <TouchableOpacity onPress={() => speak(currentQuestion.label)}>
          <Icon name="volume-high" size={24} color="#0984e3" />
        </TouchableOpacity>
      </View>

      <View style={styles.imageOptionsContainer}>
        {currentQuestion.options.map((opt, idx) => {
          const uri = opt.photoUrl || opt.image_url;
          const isSelected = selected === uri;
          const isCorrect = currentQuestion.correctUri === uri;
          const showColor = selected !== undefined;

          let borderColor = '#ccc';
          if (showColor) {
            if (isSelected && isCorrect) borderColor = '#00b894';
            else if (isSelected && !isCorrect) borderColor = '#d63031';
            else if (!isSelected && isCorrect) borderColor = '#00b894';
          }

          return (
            <TouchableOpacity
              key={idx}
              onPress={() => handleSelect(uri)}
              disabled={selected !== undefined}
              style={[styles.imageWrapper, { borderColor }]}
            >
              <Image
                source={{ uri }}
                style={styles.imageOption}
              />
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
  labelRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 10 },
  labelText: { fontSize: 20, fontWeight: 'bold', color: '#2d3436' },
  imageOptionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 10,
  },
  imageWrapper: {
    borderWidth: 3,
    borderRadius: 12,
    overflow: 'hidden',
    margin: 6,
  },
  imageOption: {
    width: 140,
    height: 140,
    resizeMode: 'cover',
  },
  navContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 30,
    paddingHorizontal: 20,
  },
  resultText: { fontSize: 24, fontWeight: 'bold', color: '#2d3436' },
  scoreText: { fontSize: 20, marginTop: 10, color: '#0984e3' },
  feedbackText: { fontSize: 18, marginTop: 10, color: '#636e72' },
  resultButtons: { marginTop: 30, gap: 15, width: '80%' },
  resultButton: { padding: 14, borderRadius: 10, alignItems: 'center' },
  resultButtonText: { color: 'white', fontSize: 16, fontWeight: 'bold' },
});
