import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
} from 'react-native';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import Icon from 'react-native-vector-icons/Ionicons';
import Tts from 'react-native-tts';

export default function AudioGuessGame({ route, navigation }) {
  const { mode } = route.params;
  const [questions, setQuestions] = useState([]);
  const [current, setCurrent] = useState(0);
  const [score, setScore] = useState(0);
  const [selected, setSelected] = useState(null);
  const [showResult, setShowResult] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      const uid = auth().currentUser?.uid;
      let query = mode === 'library'
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

      const shuffled = shuffleArray(filtered).slice(0, 5);
      const questionData = shuffled.map(correct => {
        const wrongs = filtered.filter(i => i.label_tr !== correct.label_tr);
        const options = shuffleArray([
          correct,
          ...shuffleArray(wrongs).slice(0, 3),
        ]);
        return {
          label: correct.label_tr,
          correctUri: correct.photoUrl || correct.image_url,
          options,
        };
      });

      setQuestions(questionData);
    };

    fetchData();
  }, [mode]);

  const shuffleArray = (arr) => [...arr].sort(() => Math.random() - 0.5);

  const speak = (text) => {
    Tts.stop();
    Tts.speak(text, { language: 'tr-TR' });
  };

  const handleSelect = (uri) => {
    const currentQ = questions[current];
    setSelected(uri);
    if (uri === currentQ.correctUri) setScore(prev => prev + 10);
  };

  const goNext = () => {
    if (current + 1 >= questions.length) setShowResult(true);
    else {
      setCurrent(prev => prev + 1);
      setSelected(null);
    }
  };

  if (questions.length === 0) {
    return <View style={styles.center}><Text>Yükleniyor...</Text></View>;
  }

  if (showResult) {
    let yorum = '';
    if (score >= 40) yorum = '🎯 Mükemmel iş!';
    else if (score >= 25) yorum = '👍 Gayet iyi!';
    else yorum = '🧠 Daha fazla pratik yapmalısın.';

    return (
      <View style={styles.center}>
        <Text style={styles.resultText}>🎉 Oyun Bitti!</Text>
        <Text style={styles.scoreText}>Puan: {score} / {questions.length * 10}</Text>
        <Text style={styles.feedback}>{yorum}</Text>

        <View style={styles.resultButtons}>
          <TouchableOpacity style={[styles.resultButton, { backgroundColor: '#00cec9' }]} onPress={() => navigation.goBack()}>
            <Text style={styles.resultButtonText}>Ana Sayfaya Dön</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const currentQ = questions[current];
  const correct = currentQ.correctUri;

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Soru {current + 1} / {questions.length}</Text>

      <View style={styles.labelRow}>
        <Text style={styles.labelText}>{currentQ.label}</Text>
        <TouchableOpacity onPress={() => speak(currentQ.label)}>
          <Icon name="volume-high" size={24} color="#0984e3" />
        </TouchableOpacity>
      </View>

      <View style={styles.imageOptionsContainer}>
        {currentQ.options.map((opt, idx) => {
          const uri = opt.photoUrl || opt.image_url;
          const isSelected = selected === uri;
          const isCorrect = uri === correct;

          let borderColor = '#ccc';
          if (selected !== null) {
            if (isSelected && isCorrect) borderColor = '#00b894';
            else if (isSelected && !isCorrect) borderColor = '#d63031';
            else if (!isSelected && isCorrect) borderColor = '#00b894';
          }

          return (
            <TouchableOpacity
              key={idx}
              onPress={() => handleSelect(uri)}
              disabled={selected !== null}
              style={[styles.imageWrapper, { borderColor }]}
            >
              <Image source={{ uri }} style={styles.imageOption} />
            </TouchableOpacity>
          );
        })}
      </View>

      <View style={styles.navContainer}>
        <TouchableOpacity
          onPress={goNext}
          disabled={selected === null}
        >
          <Icon name="arrow-forward-circle" size={42} color={selected === null ? '#ccc' : '#0984e3'} />
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#f5f6fa' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 10, textAlign: 'center' },
  labelRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 12 },
  labelText: { fontSize: 20, fontWeight: 'bold', color: '#2d3436' },
  imageOptionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 12,
    marginTop: 10,
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
    justifyContent: 'center',
    marginTop: 30,
  },
  resultText: { fontSize: 24, fontWeight: 'bold', color: '#2d3436' },
  scoreText: { fontSize: 20, marginTop: 10, color: '#0984e3' },
  feedback: { fontSize: 18, marginTop: 10, color: '#636e72' },
  resultButtons: { marginTop: 30, gap: 15, width: '80%' },
  resultButton: { padding: 14, borderRadius: 10, alignItems: 'center' },
  resultButtonText: { color: 'white', fontSize: 16, fontWeight: 'bold' },
});
