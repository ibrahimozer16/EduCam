import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity, FlatList } from 'react-native';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import { useTranslation } from 'react-i18next';

export default function MemoryMatchGame({ route, navigation }) {
  const { mode } = route.params;
  const { t, i18n } = useTranslation();

  const [cards, setCards] = useState([]);
  const [flippedIds, setFlippedIds] = useState([]);
  const [matchedIds, setMatchedIds] = useState([]);
  const [moves, setMoves] = useState(0);
  const [showResult, setShowResult] = useState(false);
  const userId = auth().currentUser.uid;

  useEffect(() => {
    const fetchCards = async () => {
      const labelKey = mode === 'library' ? `label_en` : 'label';

      const query = mode === 'library'
        ? firestore().collection('users').doc(userId).collection('recognized_items').where(labelKey, '!=', '')
        : firestore().collection('general_quiz').where(labelKey, '!=', '');

      const snapshot = await query.get();
      const raw = snapshot.docs.map(doc => doc.data()).filter(item => item[labelKey] && (item.photoUrl || item.image_url));

      const uniqueMap = new Map();
      for (const item of raw) {
        const label = item[labelKey];
        if (!uniqueMap.has(label)) {
          uniqueMap.set(label, item);
        }
      }

      const uniqueItems = Array.from(uniqueMap.values()).sort(() => Math.random() - 0.5).slice(0, 6);
      const paired = uniqueItems.flatMap((item, index) => [
        { id: `${index}-1`, uri: item.photoUrl || item.image_url, label: item[labelKey] },
        { id: `${index}-2`, uri: item.photoUrl || item.image_url, label: item[labelKey] },
      ]);

      setCards(paired.sort(() => Math.random() - 0.5));
    };

    fetchCards();
  }, [mode, userId, i18n.language]);

  useEffect(() => {
    if (matchedIds.length > 0 && matchedIds.length === cards.length) {
      setTimeout(() => {
        saveResult();
        setShowResult(true);
      }, 600);
    }
  }, [matchedIds, cards.length, saveResult]);

  const handleFlip = (card) => {
    if (flippedIds.length === 2 || flippedIds.includes(card.id) || matchedIds.includes(card.id)) return;
    const newFlips = [...flippedIds, card.id];
    setFlippedIds(newFlips);

    if (newFlips.length === 2) {
      setMoves(m => m + 1);
      const [first, second] = newFlips.map(id => cards.find(c => c.id === id));
      if (first.label === second.label) {
        setMatchedIds(prev => [...prev, first.id, second.id]);
      }
      setTimeout(() => setFlippedIds([]), 800);
    }
  };

  const saveResult = useCallback(async () => {
    const uid = auth().currentUser?.uid;
    if (!uid) return;

    try {
      const feedbackKey = moves <= 8 ? 'perfect_memory' : moves <= 12 ? 'goodJob' : 'need_to_improve';
      await firestore()
        .collection('users')
        .doc(uid)
        .collection('game_results')
        .add({
          type: 'memoryGame',
          mode: mode,
          score: moves,
          feedback: feedbackKey,
          total: cards.length / 2,
          date: firestore.FieldValue.serverTimestamp(),
        });
    } catch (err) {
      console.error('❌ Firestore kayıt hatası:', err);
    }
  }, [mode, moves, cards.length]);

  const restartGame = () => {
    setMatchedIds([]);
    setFlippedIds([]);
    setMoves(0);
    setShowResult(false);
  };

  const renderItem = ({ item }) => {
    const isFlipped = flippedIds.includes(item.id) || matchedIds.includes(item.id);
    return (
      <TouchableOpacity
        onPress={() => handleFlip(item)}
        style={[styles.card, isFlipped && styles.cardFlipped]}
        disabled={isFlipped}
      >
        {isFlipped ? <Image source={{ uri: item.uri }} style={styles.image} /> : <View style={styles.hidden} />}
      </TouchableOpacity>
    );
  };

  if (showResult) {
    const feedback = moves <= 8 ? 'perfect_memory' : moves <= 12 ? 'goodJob' : 'need_to_improve';
    return (
      <View style={styles.center}>
        <Text style={styles.resultTitle}>{t('gameOver')}</Text>
        <Text style={styles.resultScore}>{t('moves_count')}: {moves}</Text>
        <Text style={styles.resultFeedback}>{t(feedback)}</Text>
        <TouchableOpacity style={styles.button} onPress={restartGame}>
          <Text style={styles.buttonText}>{t('play_again')}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.button} onPress={() => navigation.navigate('Games')}>
          <Text style={styles.buttonText}>{t('backToGames')}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🧠 {t('memoryGame')}</Text>
      <Text style={styles.moves}>{t('moves_count')}: {moves}</Text>
      <FlatList
        data={cards}
        numColumns={3}
        keyExtractor={item => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.grid}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f1f2f6', padding: 16 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#2d3436', textAlign: 'center', marginBottom: 10 },
  moves: { fontSize: 18, color: '#0984e3', textAlign: 'center', marginBottom: 10 },
  grid: { alignItems: 'center' },
  card: {
    width: 100,
    height: 100,
    margin: 6,
    backgroundColor: '#b2bec3',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center'
  },
  cardFlipped: { backgroundColor: '#fff' },
  image: { width: '100%', height: '100%', borderRadius: 10, resizeMode: 'cover' },
  hidden: { width: '100%', height: '100%', backgroundColor: '#b2bec3', borderRadius: 10 },

  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  resultTitle: { fontSize: 26, fontWeight: 'bold', color: '#2d3436' },
  resultScore: { fontSize: 20, marginTop: 10, color: '#0984e3' },
  resultFeedback: { fontSize: 18, marginTop: 10, color: '#636e72' },
  button: { marginTop: 20, backgroundColor: '#6c5ce7', padding: 14, borderRadius: 10 },
  buttonText: { color: 'white', fontSize: 16, fontWeight: 'bold', textAlign: 'center' },
});
