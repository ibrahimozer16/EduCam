import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';

const games = [
  {
    id: '1',
    title: 'Fotoğraftan Kelime Tahmini',
    icon: 'image-outline',
    screen: 'PhotoWordMode',
  },
  {
    id: '2',
    title: 'Görsel-Kelime Eşleştirme',
    icon: 'swap-horizontal-outline',
    screen: 'ImageWordMatch',
  },
  // ileri oyunlar eklenebilir
];

export default function GamesScreen({navigation}) {

  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => navigation.navigate(item.screen)}
    >
      <Icon name={item.icon} size={30} color="#6c5ce7" />
      <Text style={styles.cardText}>{item.title}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.header}>🕹️ Oyunlar</Text>
      <FlatList
        data={games}
        keyExtractor={item => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f6fa', padding: 20 },
  header: { fontSize: 24, fontWeight: 'bold', marginBottom: 20, color: '#2d3436' },
  list: { paddingBottom: 20 },
  card: {
    backgroundColor: '#dfe6e9',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  cardText: { fontSize: 18, color: '#2d3436' },
});
