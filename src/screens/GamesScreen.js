import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useTranslation } from 'react-i18next';

export default function GamesScreen({ navigation }) {
  const { t } = useTranslation();

  const games = [
    {
      id: '1',
      title: t('photoWordGame'),
      icon: 'image-outline',
      screen: 'PhotoWordMode',
    },
    {
      id: '2',
      title: t('memoryGame'),
      icon: 'grid-outline',
      screen: 'MemoryGameMode',
    },
    {
      id: '3',
      title: t('audioGuessGame'),
      icon: 'volume-high-outline',
      screen: 'AudioGuessGameMode',
    },
    {
      id: '4',
      title: t('matchTruthGame'),
      icon: 'help-circle-outline',
      screen: 'MatchTruthMode',
    },
    {
      id: '5',
      title: t('photoSpeechGame'),
      icon: 'mic-outline',
      screen: 'PhotoSpeechMode',
    },
    {
      id: '6',
      title: t('imageWordMatchDemo'),
      icon: 'swap-horizontal-outline',
      screen: 'ImageWordMode',
    },
    {
      id: '7',
      title: t('arrowMatchGameDemo'),
      icon: 'arrow-forward-outline',
      screen: 'ArrowGameMode',
    },
  ];

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
      <Text style={styles.header}>{t('gamesTitle')}</Text>
      <FlatList
        data={games}
        keyExtractor={item => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
      />
      <TouchableOpacity style={styles.button} onPress={() => navigation.navigate('Main')}>
        <Icon name="arrow-back-circle-outline" size={30} color={'#6c5ce7'} />
        <Text style={styles.buttonText}>{t('backToHome')}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f6fa', padding: 20 },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#2d3436',
    alignSelf: 'center'
  },
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
  button: {
    backgroundColor: '#dfe6e9',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    justifyContent: 'center'
  },
  buttonText: {
    fontSize: 18,
    color: '#2d3436',
  },
});
