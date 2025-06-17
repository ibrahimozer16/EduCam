import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

export default function MatchByArrowModeScreen({ navigation }) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Eşleştirme Modunu Seç</Text>

      <TouchableOpacity
        style={[styles.button, { backgroundColor: '#6c5ce7' }]}
        onPress={() => navigation.navigate('ArrowGame', { mode: 'library' })}
      >
        <Text style={styles.buttonText}>📁 Kütüphane Modu</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.button, { backgroundColor: '#00b894' }]}
        onPress={() => navigation.navigate('ArrowGame', { mode: 'general' })}
      >
        <Text style={styles.buttonText}>🌍 Genel Mod</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f1f2f6', padding: 20 },
  title: { fontSize: 26, fontWeight: 'bold', marginBottom: 40, color: '#2d3436' },
  button: {
    width: '100%',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 20,
  },
  buttonText: { fontSize: 18, fontWeight: 'bold', color: '#fff' },
});
