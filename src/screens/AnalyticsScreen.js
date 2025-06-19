import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Dimensions, ScrollView, TouchableOpacity } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import Icon from 'react-native-vector-icons/Ionicons';
import { useTranslation } from 'react-i18next';

const screenWidth = Dimensions.get('window').width;
const colors = ['#6c5ce7', '#00b894', '#e17055', '#0984e3', '#fd79a8'];

export default function AnalyticsScreen({ navigation }) {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('game');
  const [dataByType, setDataByType] = useState({});

  useEffect(() => {
    const fetchData = async () => {
      const uid = auth().currentUser?.uid;
      if (!uid) return;

      const collection = activeTab === 'game' ? 'game_results' : 'exam_results';
      const snapshot = await firestore()
        .collection('users')
        .doc(uid)
        .collection(collection)
        .orderBy('date')
        .get();

      const rawData = {};
      snapshot.forEach(doc => {
        const item = doc.data();
        if (!rawData[item.type]) rawData[item.type] = [];
        rawData[item.type].push(item);
      });

      setDataByType(rawData);
    };

    fetchData();
  }, [activeTab]);

  const renderChart = (type, index) => {
    const typeData = dataByType[type];
    if (!typeData) return null;

    const scores = typeData.map(entry => entry.score);
    const labels = typeData.map((_, i) => `#${i + 1}`);

    return (
      <View key={type} style={styles.chartContainer}>
        <Text style={styles.chartTitle}>{type}</Text>
        <LineChart
          data={{
            labels,
            datasets: [{ data: scores }],
          }}
          width={screenWidth - 32}
          height={200}
          chartConfig={{
            backgroundGradientFrom: '#fff',
            backgroundGradientTo: '#fff',
            color: () => colors[index % colors.length],
            labelColor: () => '#2d3436',
            propsForDots: {
              r: '4',
              strokeWidth: '2',
              stroke: '#2d3436',
            },
          }}
          bezier
          style={styles.chart}
        />
      </View>
    );
  };

  return (
    <View style={styles.wrapper}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.toggleContainer}>
          <TouchableOpacity
            style={[styles.toggle, activeTab === 'game' && styles.activeToggle]}
            onPress={() => setActiveTab('game')}
          >
            <Text style={[styles.toggleText, activeTab === 'game' && styles.activeToggleText]}>{t('games')}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.toggle, activeTab === 'exam' && styles.activeToggle]}
            onPress={() => setActiveTab('exam')}
          >
            <Text style={[styles.toggleText, activeTab === 'exam' && styles.activeToggleText]}>{t('exams')}</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.header}>{activeTab === 'game' ? t('gameResults') : t('examResults')}</Text>

        {Object.keys(dataByType).map((type, idx) => renderChart(type, idx))}
      </ScrollView>

      <TouchableOpacity style={styles.button} onPress={() => navigation.navigate('Main')}>
        <Icon name="arrow-back-circle-outline" size={30} color={'#6c5ce7'} />
        <Text style={styles.buttonText}>{t('backToHome')}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: '#f5f6fa',
  },
  container: {
    padding: 16,
    paddingBottom: 80,
  },
  toggleContainer: {
    flexDirection: 'row',
    alignSelf: 'center',
    backgroundColor: '#dfe6e9',
    borderRadius: 25,
    marginBottom: 16,
  },
  toggle: {
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 25,
  },
  toggleText: {
    fontWeight: 'bold',
    color: '#636e72',
  },
  activeToggle: {
    backgroundColor: '#6c5ce7',
  },
  activeToggleText: {
    color: '#fff',
  },
  header: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2d3436',
    textAlign: 'center',
    marginBottom: 16,
  },
  chartContainer: {
    backgroundColor: '#ecf0f1',
    borderRadius: 12,
    padding: 10,
    marginBottom: 24,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 6,
    color: '#2d3436',
    textAlign: 'center',
  },
  chart: {
    borderRadius: 12,
    marginRight: 20,
  },
  button: {
    backgroundColor: '#ecf0f1',
    padding: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    justifyContent: 'center',
    position: 'absolute',
    bottom: 12,
    left: 16,
    right: 16,
    borderWidth: 1,
    borderColor: '#6c5ce7',
  },
  buttonText: {
    fontSize: 18,
    color: '#2d3436',
  },
});
