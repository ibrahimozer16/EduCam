import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Image, ScrollView } from 'react-native';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';

export default function ArrowMatchGame({ route }) {
  const { mode } = route.params;
  const [images, setImages] = useState([]);
  const [labels, setLabels] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const collectionRef =
          mode === 'library'
            ? firestore().collection('users').doc(auth().currentUser.uid).collection('recognized_items')
            : firestore().collection('general_quiz');

        const snapshot = await collectionRef.where('label_tr', '!=', '').get();

        const data = snapshot.docs
          .map(doc => doc.data())
          .filter(item => item.label_tr && (item.photoUrl || item.image_url));

        const shuffled = data.sort(() => Math.random() - 0.5).slice(0, 5);

        setImages(shuffled.map((item, index) => ({
          id: `img-${index}`,
          label: item.label_tr,
          uri: item.photoUrl || item.image_url,
        })));

        setLabels(shuffled
          .map(item => item.label_tr)
          .sort(() => Math.random() - 0.5)
        );
      } catch (error) {
        console.log('Veri çekilirken hata:', error);
      }
    };

    fetchData();
  }, [mode]);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>🔗 Ok ile Eşleştirme Oyunu</Text>

      <View style={styles.row}>
        <View style={styles.column}>
          {images.map((img, index) => (
            <View key={img.id} style={styles.itemBox}>
              <Image source={{ uri: img.uri }} style={styles.image} />
            </View>
          ))}
        </View>

        <View style={styles.column}>
          {labels.map((label, index) => (
            <View key={index} style={styles.itemBox}>
              <Text style={styles.label}>{label}</Text>
            </View>
          ))}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, backgroundColor: '#ecf0f1' },
  title: { fontSize: 22, fontWeight: 'bold', textAlign: 'center', marginBottom: 20 },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  column: { flex: 1, alignItems: 'center' },
  itemBox: { marginBottom: 20, alignItems: 'center' },
  image: { width: 100, height: 100, borderRadius: 10 },
  label: { fontSize: 18, fontWeight: 'bold', color: '#2d3436' },
});
