import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import Tts from 'react-native-tts';
import Icon from 'react-native-vector-icons/Ionicons';

export default function MatchTruthGame({ route, navigation }) {
  const { mode } = route.params;
  const [questions, setQuestions] = useState([]);
  const [current, setCurrent] = useState(0);
  const [score, setScore] = useState(0);
  const [answered, setAnswered] = useState({});
  const [showResult, setShowResult] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      const uid = auth().currentUser?.uid;
      const query = mode === 'library'
        ? firestore().collection('users').doc(uid).collection('recognized_items').where('label_tr', '!=', '')
        : firestore().collection('general_quiz').where('label_tr', '!=', '');

      const snapshot = await query.get();
      const raw = snapshot.docs.map(doc => doc.data()).filter(item => item.label_tr && (item.photoUrl || item.image_url));

      const uniqueLabels = new Set();
      const filtered = [];
      for (const item of raw) {
        if (!uniqueLabels.has(item.label_tr)) {
          uniqueLabels.add(item.label_tr);
          filtered.push(item);
        }
      }

      const shuffled = filtered.sort(() => Math.random() - 0.5).slice(0, 5);

      const questions = shuffled.map(item => {
        const useCorrect = Math.random() < 0.5;
        let spokenLabel = item.label_tr;

        if (!useCorrect) {
          const others = filtered.filter(i => i.label_tr !== item.label_tr);
          spokenLabel = others[Math.floor(Math.random() * others.length)]?.label_tr || item.label_tr;
        }

        return {
          image: item.photoUrl || item.image_url,
          correctLabel: item.label_tr,
          spokenLabel,
          isMatch: spokenLabel === item.label_tr,
        };
      });

      setQuestions(questions);
    };

    fetchData();
  }, [mode]);

  useEffect(() => {
    if (showResult) {
      saveResult();
    }
  }, [showResult, saveResult]);


  const saveResult = useCallback(async () => {
    const uid = auth().currentUser?.uid;
    if (!uid) return;

    try {
      await firestore()
        .collection('users')
        .doc(uid)
        .collection('game_results')
        .add({
          type: 'Doğru-Yanlış Oyunu',
          mode: mode,
          score: score,
          total: questions.length * 10,
          feedback: getFeedback(score),
          date: firestore.FieldValue.serverTimestamp(),
        });

      console.log('✅ Doğru-Yanlışı Ayır sonucu kaydedildi.');
    } catch (err) {
      console.error('❌ Firestore kayıt hatası:', err);
    }
  }, [mode, score, questions.length]);

  const getFeedback = (puan) => {
    if (puan >= 40) return '🎯 Mükemmel iş!';
    if (puan >= 25) return '👍 Gayet iyi!';
    return '🧠 Geliştirmen gerek.';
  };

  const speak = (text) => {
    Tts.stop();
    Tts.speak(text, { language: 'tr-TR' });
  };

  const handleAnswer = (userChoice) => {
    if (answered[current]) return;
    const isCorrect = userChoice === questions[current].isMatch;
    setAnswered(prev => ({ ...prev, [current]: { correct: isCorrect } }));
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
    let yorum = '';
    if (score >= 40) yorum = '🎯 Mükemmel iş!';
    else if (score >= 25) yorum = '👍 Gayet iyi!';
    else yorum = '🧠 Geliştirmen gerek.';

    return (
      <View style={styles.center}>
        <Text style={styles.resultText}>🎉 Oyun Bitti!</Text>
        <Text style={styles.scoreText}>Puan: {score} / {questions.length * 10}</Text>
        <Text style={styles.feedback}>{yorum}</Text>
        <TouchableOpacity onPress={() => navigation.navigate('Games')} style={styles.returnButton}>
          <Text style={styles.returnText}>Ana Sayfa</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const currentQ = questions[current];
  const userAnswer = answered[current];

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Soru {current + 1} / {questions.length}</Text>
      <Text style={styles.scoreText}>Puan: {score} / {questions.length * 10}</Text>

      <Image source={{ uri: currentQ.image }} style={styles.image} />

      <View style={styles.labelRow}>
        <Text style={styles.labelText}>{currentQ.spokenLabel}</Text>
        <TouchableOpacity onPress={() => speak(currentQ.spokenLabel)}>
          <Icon name="volume-high" size={24} color="#0984e3" />
        </TouchableOpacity>
      </View>

      <View style={styles.answerButtons}>
        <TouchableOpacity
          style={[
            styles.answerButton, 
            userAnswer && currentQ.isMatch && styles.correct,
            userAnswer && !currentQ.isMatch && styles.incorrect
          ]}
          onPress={() => handleAnswer(true)}
          disabled={!!userAnswer}
        >
          <Text style={styles.answerText}>✅ Doğru</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.answerButton, 
            userAnswer && !currentQ.isMatch && styles.correct,
            userAnswer && currentQ.isMatch && styles.incorrect
          ]}
          onPress={() => handleAnswer(false)}
          disabled={!!userAnswer}
        >
          <Text style={styles.answerText}>❌ Yanlış</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.navContainer}>
        <TouchableOpacity onPress={goBack} disabled={current === 0}>
          <Icon name="arrow-back-circle" size={40} color={current === 0 ? '#ccc' : '#6c5ce7'} />
        </TouchableOpacity>
        <TouchableOpacity onPress={goNext} disabled={!userAnswer}>
          <Icon name="arrow-forward-circle" size={40} color={!userAnswer ? '#ccc' : '#0984e3'} />
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#f5f6fa' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 10, textAlign: 'center' },
  image: { width: '100%', height: 200, resizeMode: 'contain', borderRadius: 12, marginVertical: 20 },
  labelRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 12 },
  labelText: { fontSize: 20, fontWeight: 'bold', color: '#2d3436' },
  answerButtons: { flexDirection: 'row', justifyContent: 'space-around', marginTop: 20 },
  answerButton: { padding: 16, borderRadius: 10, backgroundColor: '#dfe6e9', minWidth: 120, alignItems: 'center' },
  answerText: { fontSize: 18, fontWeight: 'bold', color: '#2d3436' },
  correct: { backgroundColor: '#00b894' },
  incorrect: { backgroundColor: '#d63031' },
  navContainer: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 30, paddingHorizontal: 20 },
  resultText: { fontSize: 24, fontWeight: 'bold', color: '#2d3436' },
  scoreText: { fontSize: 20, marginTop: 10, color: '#0984e3' },
  feedback: { fontSize: 18, marginTop: 10, color: '#636e72' },
  returnButton: { marginTop: 30, backgroundColor: '#6c5ce7', padding: 14, borderRadius: 10 },
  returnText: { color: 'white', fontSize: 16, fontWeight: 'bold' },
});
