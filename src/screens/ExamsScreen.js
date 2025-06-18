import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';

const quizTypes = [
  { id: '1', title: '🧩 Genel Sınav', screen: 'GeneralQuiz' },
  { id: '2', title: '🧩 Mini Sınav', screen: 'MiniQuiz' },
  { id: '3', title: '🧩 Resimli Genel Sınav', screen: 'ImageGeneralQuiz' },
  { id: '4', title: '🧩 Resimli Mini Sınav', screen: 'ImageMiniQuiz' },
];

export default function ExamsScreen({ navigation }) {
  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => navigation.navigate(item.screen)}>
      <Text style={styles.cardText}>{item.title}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.header}>📚 Quiz Türleri</Text>
      <FlatList
        data={quizTypes}
        renderItem={renderItem}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.list}
      />
      <TouchableOpacity style={styles.button} onPress={() => navigation.navigate('Main')}>
        <Icon name="arrow-back-circle-outline" size={30} color={'white'} />
        <Text style={styles.buttonText}>Anasayfaya Dön</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f6fa',
    padding: 20,
  },
  header: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#2d3436',
    alignSelf: 'center'
  },
  list: {
    gap: 16
  },
  card: {
    backgroundColor: '#74b9ff',
    padding: 16,
    borderRadius: 12,
    elevation: 4
  },
  cardText: {
    fontSize: 18,
    color: 'white',
    textAlign: 'center'
  },
  button: {
    backgroundColor: '#74b9ff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    justifyContent: 'center',
    elevation: 4,
  },
  buttonText: {
     fontSize: 18, 
     color: 'white',
  },
});
