import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity } from 'react-native';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import Icon from 'react-native-vector-icons/Ionicons';
import { useTranslation } from 'react-i18next';

export default function ResultsScreen({ navigation }) {
  const { t } = useTranslation();
  const [examResults, setExamResults] = useState([]);
  const [gameResults, setGameResults] = useState([]);

  useEffect(() => {
    const uid = auth().currentUser?.uid;

    const fetchResults = async () => {
      const examSnap = await firestore()
        .collection('users')
        .doc(uid)
        .collection('exam_results')
        .orderBy('date', 'desc')
        .get();

      const gameSnap = await firestore()
        .collection('users')
        .doc(uid)
        .collection('game_results')
        .orderBy('date', 'desc')
        .get();

      setExamResults(examSnap.docs.map(doc => doc.data()));
      setGameResults(gameSnap.docs.map(doc => doc.data()));
    };

    fetchResults();
  }, []);

  const renderResult = ({ item }) => (
    <View style={styles.resultBox}>
      <Text style={styles.type}>{t(`${item.type}`)}</Text>
      <Text style={styles.score}>
        {item.score}/{item.total}
      </Text>
      {item.feedback && <Text style={styles.feedback}>{t(`${item.feedback}`)}</Text>}
      <Text style={styles.date}>
        {new Date(item.date?.toDate()).toLocaleString()}
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Icon name="stats-chart-outline" size={40} color="#1e3a8a" />
        <Text style={styles.headerText}>{t('results')}</Text>
      </View>

      <View style={{ flex: 5 }}>
        <Text style={styles.title}>{t('examResults')}</Text>
        <FlatList
          data={examResults}
          keyExtractor={(_, i) => 'exam-' + i}
          renderItem={renderResult}
          ListEmptyComponent={<Text style={styles.empty}>{t('noResults')}</Text>}
          contentContainerStyle={{ paddingBottom: 10 }}
        />
      </View>

      <View style={{ flex: 6 }}>
        <Text style={styles.title}>{t('gameResults')}</Text>
        <FlatList
          data={gameResults}
          keyExtractor={(_, i) => 'game-' + i}
          renderItem={renderResult}
          ListEmptyComponent={<Text style={styles.empty}>{t('noResults')}</Text>}
          contentContainerStyle={{ paddingBottom: 10 }}
        />
      </View>

      <TouchableOpacity style={styles.button} onPress={() => navigation.navigate('Main')}>
        <Icon name="arrow-back-circle-outline" size={30} color={'white'} />
        <Text style={styles.buttonText}>{t('backToHome')}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#f5f6fa' },
  header: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  headerText: { fontSize: 40, color: '#1e3a8a' },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    paddingVertical: 10,
    color: '#1e3a8a',
  },
  resultBox: {
    backgroundColor: 'white',
    padding: 12,
    borderRadius: 10,
    marginBottom: 12,
    elevation: 2,
  },
  type: { fontSize: 16, fontWeight: 'bold', color: '#2d3436', },
  score: { fontSize: 16, color: '#0984e3' },
  feedback: {
    fontSize: 15,
    color: '#2d3436',
    marginTop: 4,
  },
  date: { fontSize: 14, color: '#636e72' },
  empty: { textAlign: 'center', marginVertical: 10, color: 'gray' },
  button: {
    backgroundColor: '#628FF1FF',
    padding: 12,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    justifyContent: 'center',
    position: 'absolute',
    bottom: 12,
    left: 16,
    right: 16,
  },
  buttonText: {
    fontSize: 18,
    color: 'white',
    textAlignVertical: 'center',
  },
});
