import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';

export default function MemoryMatchModeScreen({ navigation }) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>🧠 Hafıza Oyunu Modunu Seç</Text>

      <TouchableOpacity
        style={[styles.button, { backgroundColor: '#6c5ce7' }]}
        onPress={() => navigation.navigate('MemoryGame', { mode: 'library' })}
      >
        <Icon name="folder-open-outline" size={24} color="#fff" />
        <Text style={styles.buttonText}>📁 Kütüphane Modu</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.button, { backgroundColor: '#00b894' }]}
        onPress={() => navigation.navigate('MemoryGame', { mode: 'general' })}
      >
        <Icon name="earth-outline" size={24} color="#fff" />
        <Text style={styles.buttonText}>🌍 Genel Mod</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f1f2f6',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2d3436',
    marginBottom: 40,
    textAlign: 'center',
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
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
