import React, { useState, useEffect } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import Icon from 'react-native-vector-icons/Ionicons';

export default function PhotoWordGame({ route, navigation }) {
  const { mode } = route.params;
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [shuffledLetters, setShuffledLetters] = useState([]);
  const [userInput, setUserInput] = useState('');
  const [score, setScore] = useState(0);
  const [showHint, setShowHint] = useState(false);
  const [usedLetters, setUsedLetters] = useState([]);


  useEffect(() => {
    const fetchData = async () => {
      let query;
      if (mode === 'library') {
        const uid = auth().currentUser.uid;
        query = firestore()
          .collection('users')
          .doc(uid)
          .collection('recognized_items')
          .where('label_tr', '!=', '');
      } else {
        query = firestore().collection('general_quiz').where('label_tr', '!=', '');
      }

      const snapshot = await query.get();
      const data = snapshot.docs.map(doc => doc.data());
      const shuffled = data.sort(() => Math.random() - 0.5).slice(0, 5);
      setQuestions(shuffled);
    };

    fetchData();
  }, [mode]);

  useEffect(() => {
    if (questions.length > 0) {
      const currentWord = questions[currentIndex].label_tr;
      const letters = currentWord.split('').sort(() => Math.random() - 0.5);
      setShuffledLetters(letters);
      setUserInput('');
      setShowHint(false);
      setUsedLetters([]);
    }
  }, [currentIndex, questions]);

  const handleLetterPress = (letter, index) => {
    if (usedLetters.includes(index)) return; // aynı index tekrar kullanılmasın

    setUserInput(prev => prev + letter);
    setUsedLetters(prev => [...prev, index]); // sadece index'i takip et
  };


  const handleCheck = () => {
    const correctWord = questions[currentIndex].label_tr;
    if (userInput.toLowerCase() === correctWord.toLowerCase()) {
      setScore(prev => prev + 10);
      if (currentIndex + 1 < questions.length) {
        setCurrentIndex(prev => prev + 1);
      } else {
        Alert.alert('Tebrikler!', `Oyun bitti. Toplam Puan: ${score + 10}`, [
          { text: 'Tekrar Oyna', onPress: () => restartGame() },
          { text: 'Geri Dön', onPress: () => navigation.goBack() },
        ]);
      }
    } else {
      Alert.alert('Yanlış', 'Lütfen tekrar deneyin.');
    }
  };

  const handleDelete = () => {
    if (userInput.length === 0) return;

    const lastUsedIndex = usedLetters[usedLetters.length - 1];
    setUsedLetters(prev => prev.slice(0, -1));
    setUserInput(prev => prev.slice(0, -1));
  };

  const restartGame = () => {
    setCurrentIndex(0);
    setScore(0);
    setUsedLetters([]);
  };

  if (questions.length === 0) {
    return <View style={styles.center}><Text>Yükleniyor...</Text></View>;
  }

  const currentQuestion = questions[currentIndex];
  const currentPhoto = currentQuestion.photoUrl || currentQuestion.image_url;
  const correctWord = questions[currentIndex].label_tr;

  return (
    <View style={styles.container}>
      <Text style={styles.score}>Puan: {score}</Text>
      <Image source={{ uri: currentPhoto }} style={styles.image} />
      <Text style={styles.input}>{userInput}</Text>

      <View style={styles.lettersContainer}>
        {shuffledLetters.map((letter, idx) => (
            <TouchableOpacity
                key={idx}
                onPress={() => handleLetterPress(letter, idx)}
                style={[
                styles.letterButton,
                usedLetters.includes(idx) && { backgroundColor: '#b2bec3' }
                ]}
                disabled={usedLetters.includes(idx)}
            >
                <Text style={styles.letterText}>{letter}</Text>
            </TouchableOpacity>
        ))}
      </View>

      <View style={styles.actions}>
        <TouchableOpacity style={styles.checkButton} onPress={handleCheck}>
            <Text style={styles.checkText}>Kontrol Et</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={handleDelete}>
            <Icon name="backspace-outline" size={30} color="#d63031" />
        </TouchableOpacity>

        <TouchableOpacity onPress={() => setShowHint(true)}>
            <Icon name="bulb-outline" size={30} color="#fdcb6e" />
        </TouchableOpacity>
      </View>

      {showHint && <Text style={styles.hintText}>İpucu: {correctWord[0]}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#dfe6e9' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  score: { fontSize: 18, fontWeight: 'bold', marginBottom: 10 },
  image: { width: '100%', height: 200, resizeMode: 'contain', borderRadius: 10 },
  input: { fontSize: 22, marginVertical: 20, textAlign: 'center', letterSpacing: 4 },
  lettersContainer: {
    flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', marginVertical: 10,
  },
  letterButton: {
    backgroundColor: '#74b9ff', padding: 10, borderRadius: 8, margin: 5,
  },
  letterText: { fontSize: 18, color: 'white', fontWeight: 'bold' },
  actions: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 20,
  },
  checkButton: {
    backgroundColor: '#00cec9', paddingVertical: 10, paddingHorizontal: 20, borderRadius: 10,
  },
  checkText: { color: 'white', fontWeight: 'bold' },
  hintText: { marginTop: 10, fontSize: 16, fontStyle: 'italic', color: '#636e72' },
});
