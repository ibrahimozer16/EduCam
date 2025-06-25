import React, { useState, useEffect } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import Icon from 'react-native-vector-icons/Ionicons';
import { useTranslation } from 'react-i18next';

export default function PhotoWordGame({ route, navigation }) {
  const { t } = useTranslation();
  const { mode } = route.params;
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [shuffledLetters, setShuffledLetters] = useState([]);
  const [userInput, setUserInput] = useState('');
  const [score, setScore] = useState(0);
  const [showHint, setShowHint] = useState(false);
  const [usedLetters, setUsedLetters] = useState([]);
  const [showResult, setShowResult] = useState(false);
  const [answered, setAnswered] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);


  useEffect(() => {
    const fetchData = async () => {
      const uid = auth().currentUser?.uid;
      let query;

      if (mode === 'library') {
        query = firestore().collection('users').doc(uid).collection('recognized_items').where('label_en', '!=', '');
      } else {
        query = firestore().collection('general_quiz').where('label', '!=', '');
      }

      const snapshot = await query.get();
      const raw = snapshot.docs.map(doc => doc.data());

      const seen = new Set();
      const unique = [];

      for (const item of raw) {
        const key = mode === 'library'
          ? item.label_en?.trim().toLowerCase()
          : item.label?.trim().toLowerCase();

        if (key && !seen.has(key)) {
          seen.add(key);
          const translatedLabel = mode === 'library'
            ? t(`label_${key}`).toUpperCase()
            : t(`label_${key}`).toUpperCase();

          unique.push({
            photoUrl: item.photoUrl || item.image_url,
            originalKey: key,
            translatedLabel
          });
        }
      }

      const selected = unique.sort(() => Math.random() - 0.5).slice(0, 5);
      setQuestions(selected);
    };

    fetchData();
  }, [mode, t]);

  useEffect(() => {
    if (questions.length > 0) {
      const currentWord = questions[currentIndex].translatedLabel;
      const letters = currentWord.split('').sort(() => Math.random() - 0.5);
      setShuffledLetters(letters);
      setUserInput('');
      setShowHint(false);
      setUsedLetters([]);
    }
  }, [currentIndex, questions]);

  const handleLetterPress = (letter, index) => {
    if (usedLetters.includes(index)) return;
    setUserInput(prev => prev + letter);
    setUsedLetters(prev => [...prev, index]);
  };

  const handleCheck = () => {
    const correctWord = questions[currentIndex].translatedLabel;
    const userAnswer = userInput.toUpperCase();
    const expectedAnswer = correctWord.toUpperCase();

    const correct = userAnswer === expectedAnswer;
    setIsCorrect(correct);
    setAnswered(true);

    if (correct) {
      setScore(prev => prev + 10);
    }
  };

  const handleSkip = () => {
    if (currentIndex + 1 < questions.length) {
      setCurrentIndex(prev => prev + 1);
      setAnswered(false);
      setIsCorrect(false);
    } else {
      saveGameResult();
      setShowResult(true);
    }
  };

  const saveGameResult = async () => {
    const uid = auth().currentUser?.uid;
    if (!uid) return;

    try {
      await firestore().collection('users').doc(uid).collection('game_results').add({
        type: 'photoWordGame',
        mode,
        score,
        total: questions.length * 10,
        date: firestore.FieldValue.serverTimestamp(),
      });
    } catch (err) {
      console.error('❌ Oyun sonucu kaydedilemedi:', err);
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
    setShowHint(false);
    setShowResult(false);
  };

  if (questions.length === 0) {
    return <View style={styles.center}><Text>{t('loading')}</Text></View>;
  }

  if (showResult) {
    const feedback = score >= 40 ? 'perfectJob' : score >= 25 ? 'goodJob' : 'morePractice';
    return (
      <View style={styles.center}>
        <Text style={styles.resultText}>{t('gameOver')}</Text>
        <Text style={styles.scoreText}>{t('score')}: {score} / {questions.length * 10}</Text>
        <Text style={styles.feedback}>{t(feedback)}</Text>
        <TouchableOpacity onPress={restartGame} style={styles.returnButton}>
          <Text style={styles.returnText}>{t('play_again')}</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => navigation.navigate('Games')} style={styles.returnButton}>
          <Text style={styles.returnText}>{t('backToGames')}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const currentPhoto = questions[currentIndex].photoUrl;
  const correctWord = questions[currentIndex].translatedLabel;

  return (
    <View style={styles.container}>
      <Text style={styles.score}>{t('score')}: {score}</Text>
      <Image source={{ uri: currentPhoto }} style={styles.image} />
      <Text style={styles.input}>{userInput}</Text>

      <View style={styles.buttonRow}>
        <Text>         </Text>
        <View style={styles.lettersContainer}>
          {shuffledLetters.map((letter, idx) => (
            <TouchableOpacity
              key={idx}
              onPress={() => handleLetterPress(letter, idx)}
              style={[
                styles.letterButton, 
                usedLetters.includes(idx) && { backgroundColor: '#b2bec3' },
                answered && { backgroundColor: '#b2bec3' }
              ]}
              disabled={usedLetters.includes(idx) || answered}
            >
              <Text style={styles.letterText}>{letter}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <TouchableOpacity onPress={handleDelete}>
          <Icon name="backspace-outline" size={30} color="#d63031" />
        </TouchableOpacity>
      </View>

      <View style={styles.actions}>
        {!answered ? (
          <>
            <TouchableOpacity style={styles.checkButton} onPress={handleCheck}>
              <Text style={styles.checkText}>{t('check')}</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setShowHint(true)}>
              <Icon name="bulb-outline" size={30} color="#fdcb6e" />
            </TouchableOpacity>
          </>
        ) : (
          <TouchableOpacity style={styles.checkButton} onPress={handleSkip}>
            <Text style={styles.skipText}>{t('next_question')}</Text>
          </TouchableOpacity>
        )}
      </View>

      {!answered && (
        <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
          <Text style={styles.skipText}>{t('skip_this_question')}</Text>
        </TouchableOpacity>
      )}

      {showHint && <Text style={styles.hintText}>{t('hint')}: {correctWord[0]}</Text>}

      {answered && !isCorrect && (
        <Text style={styles.hintText}>
          {t('correct_answer')}: {correctWord}
        </Text>
      )}

    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 30, backgroundColor: '#dfe6e9' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  score: { fontSize: 18, fontWeight: 'bold', marginBottom: 10, color: '#056ED7FF' },
  image: { width: '100%', height: 200, resizeMode: 'contain', borderRadius: 10, marginTop: 30 },
  input: { fontSize: 22, marginVertical: 20, textAlign: 'center', letterSpacing: 4, color: 'black' },
  lettersContainer: {
    flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', marginVertical: 10, width: '80%'
  },
  letterButton: {
    backgroundColor: '#74b9ff', padding: 10, borderRadius: 8, margin: 5,
  },
  letterText: { fontSize: 18, color: 'white', fontWeight: 'bold' },
  buttonRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  actions: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 20,
  },
  checkButton: {
    backgroundColor: '#00cec9', paddingVertical: 10, paddingHorizontal: 20, borderRadius: 10,
  },
  checkText: { color: 'white', fontWeight: 'bold' },
  hintText: { marginTop: 10, fontSize: 16, fontStyle: 'italic', color: '#636e72' },
  skipButton: {
    backgroundColor: '#74b9ff',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginTop: 30,
    alignSelf: 'flex-end',
  },
  skipText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  resultText: { fontSize: 24, fontWeight: 'bold', color: '#2d3436' },
  scoreText: { fontSize: 20, marginTop: 10, color: '#0984e3' },
  feedback: { fontSize: 18, marginTop: 10, color: '#636e72' },
  returnButton: { marginTop: 20, backgroundColor: '#6c5ce7', padding: 14, borderRadius: 10 },
  returnText: { color: 'white', fontSize: 16, fontWeight: 'bold', textAlign: 'center' },
});
