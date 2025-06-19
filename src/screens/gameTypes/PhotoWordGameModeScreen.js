import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useTranslation } from 'react-i18next';

export default function PhotoWordGameModeScreen({ navigation }) {
  const { t } = useTranslation();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{t('photo_word_game_mode')}</Text>

      <TouchableOpacity
        style={[styles.button, { backgroundColor: '#6c5ce7' }]}
        onPress={() => navigation.navigate('PhotoWordGame', { mode: 'library' })}
      >
        <Icon name="images-outline" size={24} color="#fff" />
        <Text style={styles.buttonText}>{t('libraryMode')}</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.button, { backgroundColor: '#00b894' }]}
        onPress={() => navigation.navigate('PhotoWordGame', { mode: 'general' })}
      >
        <Icon name="globe-outline" size={24} color="#fff" />
        <Text style={styles.buttonText}>{t('generalMode')}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f6fa',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#2d3436',
    marginBottom: 40,
    textAlign: 'center'
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 25,
    borderRadius: 12,
    marginVertical: 10,
    width: '100%',
    justifyContent: 'center',
    elevation: 3,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 10,
  },
});
