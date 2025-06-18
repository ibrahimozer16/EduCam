import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
} from 'react-native';
import Voice from '@react-native-voice/voice';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import Icon from 'react-native-vector-icons/Ionicons';

export default function PhotoSpeechGame({ route, navigation }) {
  const { mode } = route.params;
  const [questions, setQuestions] = useState([]);
  const [current, setCurrent] = useState(0);
  const [recognizedText, setRecognizedText] = useState('');
  const [listening, setListening] = useState(false);
  const [score, setScore] = useState(0);
  const [showResult, setShowResult] = useState(false);

  useEffect(() => {
    Voice.onSpeechResults = e => {
      const text = e.value[0];
      setRecognizedText(text);
      checkAnswer(text);
      setListening(false);
    };
    Voice.onSpeechError = e => {
      console.log('Voice error:', e);
      setListening(false);
    };
    return () => Voice.destroy().then(Voice.removeAllListeners);
  }, [checkAnswer]);

  useEffect(() => {
    const fetchData = async () => {
      const uid = auth().currentUser?.uid;
      const query = mode === 'library'
        ? firestore().collection('users').doc(uid).collection('recognized_items').where('label_tr', '!=', '')
        : firestore().collection('general_quiz').where('label_tr', '!=', '');

      const snapshot = await query.get();
      const all = snapshot.docs.map(doc => doc.data()).filter(d => d.label_tr && (d.photoUrl || d.image_url));

      const labels = new Set();
      const unique = [];
      for (const item of all) {
        if (!labels.has(item.label_tr)) {
          labels.add(item.label_tr);
          unique.push(item);
        }
      }

      const shuffled = unique.sort(() => Math.random() - 0.5).slice(0, 5);
      const formatted = shuffled.map(q => ({
        label: q.label_tr,
        uri: q.photoUrl || q.image_url,
      }));

      setQuestions(formatted);
    };

    fetchData();
  }, [mode]);

  useEffect(() => {
    if (showResult) {
      saveResult();
    }
  }, [showResult, saveResult]);


  const startListening = async () => {
    setRecognizedText('');
    try {
      setListening(true);
      await Voice.start('tr-TR');
    } catch (e) {
      console.error('Voice start error:', e);
    }
  };

  const saveResult = useCallback(async () => {
    const uid = auth().currentUser?.uid;
    if (!uid) return;

    try {
      await firestore()
        .collection('users')
        .doc(uid)
        .collection('game_results')
        .add({
          type: 'Fotoğrafa Sesli Yanıt Oyunu',
          mode: mode,
          score: score,
          total: questions.length * 10,
          feedback: getFeedback(score),
          date: firestore.FieldValue.serverTimestamp(),
        });

      console.log('✅ Fotoğrafa Sesli Yanıt sonucu kaydedildi.');
    } catch (err) {
      console.error('❌ Firestore kayıt hatası:', err);
    }
  }, [mode, score, questions.length]);

  const checkAnswer = useCallback((spoken) => {
    const expected = questions[current].label.toLowerCase();
    if (spoken.toLowerCase().includes(expected)) {
        setScore(prev => prev + 10);
        Alert.alert('✅ Doğru!', `Cevap: ${spoken}`);
    } else {
        Alert.alert('❌ Yanlış', `Söylediğin: ${spoken}`);
    }
  }, [current, questions]);


  const goNext = () => {
    if (current + 1 >= questions.length) {
      setShowResult(true);
    } else {
      setCurrent(prev => prev + 1);
      setRecognizedText('');
    }
  };

  const getFeedback = (puan) => {
    if (puan >= 40) return '🎯 Harika!';
    if (puan >= 25) return '👍 Fena değil!';
    return '🧠 Geliştirmen gerek.';
  };

  if (questions.length === 0) {
    return <View style={styles.center}><Text>Yükleniyor...</Text></View>;
  }

  if (showResult) {
    let yorum = '';
    if (score >= 40) yorum = '🎯 Harika!';
    else if (score >= 25) yorum = '👍 Fena değil!';
    else yorum = '🧠 Geliştirmen gerek.';

    return (
      <View style={styles.center}>
        <Text style={styles.resultTitle}>🎉 Oyun Bitti!</Text>
        <Text style={styles.score}>Puan: {score} / {questions.length * 10}</Text>
        <Text style={styles.feedback}>{yorum}</Text>
        <TouchableOpacity style={styles.button} onPress={() => navigation.goBack()}>
          <Text style={styles.buttonText}>Ana Sayfa</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const currentQ = questions[current];

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Soru {current + 1} / {questions.length}</Text>

      <Image source={{ uri: currentQ.uri }} style={styles.image} />

      <TouchableOpacity style={styles.voiceButton} onPress={startListening} disabled={listening}>
        <Icon name="mic-circle" size={60} color={listening ? '#ccc' : '#6c5ce7'} />
      </TouchableOpacity>

      {recognizedText !== '' && (
        <Text style={styles.recognizedText}>📢 Söylediğin: {recognizedText}</Text>
      )}

      <TouchableOpacity style={styles.nextButton} onPress={goNext} disabled={recognizedText === ''}>
        <Text style={styles.nextButtonText}>Sonraki</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f6fa', padding: 20 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 22, fontWeight: 'bold', textAlign: 'center', marginBottom: 10 },
  image: { width: '100%', height: 250, borderRadius: 12, resizeMode: 'contain', marginBottom: 20 },
  voiceButton: { alignItems: 'center', marginBottom: 20 },
  recognizedText: { fontSize: 18, textAlign: 'center', color: '#2d3436', marginBottom: 10 },
  nextButton: {
    backgroundColor: '#00cec9',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  nextButtonText: { color: 'white', fontSize: 18, fontWeight: 'bold' },
  resultTitle: { fontSize: 24, fontWeight: 'bold', color: '#2d3436' },
  score: { fontSize: 20, marginTop: 10, color: '#0984e3' },
  feedback: { fontSize: 18, marginTop: 10, color: '#636e72', textAlign: 'center' },
  button: { marginTop: 30, backgroundColor: '#6c5ce7', padding: 14, borderRadius: 10 },
  buttonText: { color: 'white', fontSize: 16, fontWeight: 'bold' },
});
