import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity, Alert, FlatList } from 'react-native';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';

export default function MemoryMatchGame({ route, navigation }) {
  const { mode } = route.params;
  const [cards, setCards] = useState([]);
  const [flippedIds, setFlippedIds] = useState([]);
  const [matchedIds, setMatchedIds] = useState([]);
  const [moves, setMoves] = useState(0);
  const userId = auth().currentUser.uid;

  useEffect(() => {
    const fetchCards = async () => {
      const query = mode === 'library'
        ? firestore().collection('users').doc(userId).collection('recognized_items').where('label_tr', '!=', '')
        : firestore().collection('general_quiz').where('label_tr', '!=', '');

      const snapshot = await query.get();
      const raw = snapshot.docs.map(doc => doc.data()).filter(item => item.label_tr && (item.photoUrl || item.image_url));

      // Duplicate filtering by label
      const uniqueMap = new Map();
      for (const item of raw) {
        if (!uniqueMap.has(item.label_tr)) {
          uniqueMap.set(item.label_tr, item);
        }
      }
      const uniqueItems = Array.from(uniqueMap.values()).sort(() => Math.random() - 0.5).slice(0, 6);

      const paired = uniqueItems.flatMap((item, index) => [
        { id: `${index}-1`, uri: item.photoUrl || item.image_url, label: item.label_tr },
        { id: `${index}-2`, uri: item.photoUrl || item.image_url, label: item.label_tr },
      ]);

      setCards(paired.sort(() => Math.random() - 0.5));
    };

    fetchCards();
  }, [mode, userId]);

  useEffect(() => {
    if (matchedIds.length > 0 && matchedIds.length === cards.length) {
      setTimeout(() => {
        let message = '';
        if (moves <= 8) message = '🎯 Mükemmel hafıza!';
        else if (moves <= 12) message = '👍 İyi iş çıkardın!';
        else message = '🧠 Hafızanı geliştirmen gerek.';

        saveResult();
        Alert.alert('🎉 Tebrikler!', `${message}\nToplam hamle: ${moves}`, [
          { text: 'Ana Sayfa', onPress: () => navigation.navigate('Games')},
        ]);
      }, 600);
    }
  }, [matchedIds, cards.length, moves, navigation, saveResult]);

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
      await firestore()
        .collection('users')
        .doc(uid)
        .collection('game_results')
        .add({
          type: 'Hafıza Oyunu',
          mode: mode,
          score: moves,
          total: cards.length / 2,
          date: firestore.FieldValue.serverTimestamp(),
        });

      console.log('✅ Hafıza oyunu sonucu kaydedildi.');
    } catch (err) {
      console.error('❌ Firestore kayıt hatası:', err);
    }
  }, [mode, moves, cards.length]);



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

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🧠 Hafıza Oyunu</Text>
      <Text style={styles.moves}>Hamle Sayısı: {moves}</Text>
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
});
