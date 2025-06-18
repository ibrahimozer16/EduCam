import React, { useEffect, useState } from 'react';
import { View, Text, Image, StyleSheet, Dimensions, Alert, TouchableOpacity } from 'react-native';
import DraggableFlatList from 'react-native-draggable-flatlist';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import Tts from 'react-native-tts';
import Icon from 'react-native-vector-icons/Ionicons';

const { width } = Dimensions.get('window');

export default function ImageWordMatchScreen({ route }) {
  const { mode } = route.params;
  const [items, setItems] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      const query = mode === 'library'
        ? firestore().collection('users').doc(auth().currentUser.uid).collection('recognized_items').where('label_tr', '!=', '')
        : firestore().collection('general_quiz').where('label_tr', '!=', '');
      const snapshot = await query.get();

      const selected = snapshot.docs
        .map(doc => doc.data())
        .filter(i => i.label_tr && (i.photoUrl || i.image_url))
        .sort(() => Math.random() - 0.5)
        .slice(0, 5);

      const formatted = selected.map((i, idx) => ({
        id: `item-${idx}`,
        label: i.label_tr,
        uri: i.photoUrl || i.image_url,
        correctLabel: i.label_tr,
      })).sort(() => Math.random() - 0.5);

      setItems(formatted);
    };

    fetchData();
  }, [mode]);

  const getFeedback = (puan) => {
    if (puan === 50) return '🎯 Mükemmel eşleştirme!';
    if (puan >= 30) return '👍 Gayet başarılı!';
    return '🧠 Daha dikkatli olmalısın.';
  };

  const saveResult = async (puan) => {
    const uid = auth().currentUser?.uid;
    if (!uid) return;

    try {
      await firestore()
        .collection('users')
        .doc(uid)
        .collection('game_results')
        .add({
          type: 'Görsel-Kelime Eşleştirme Oyunu',
          mode: mode,
          score: puan,
          total: 50,
          feedback: getFeedback(puan),
          date: firestore.FieldValue.serverTimestamp(),
        });

      console.log('✅ Görsel-Kelime eşleştirme sonucu kaydedildi.');
    } catch (err) {
      console.error('❌ Firestore kayıt hatası:', err);
    }
  };


  const speak = t => {
    Tts.stop();
    Tts.speak(t, { language: 'tr-TR' });
  };

  const checkMatch = () => {
    const correctCount = items.filter(it => it.label === it.correctLabel).length;
    const score = correctCount * 10;
    const isPerfect = correctCount === items.length;

    items.forEach(it => speak(it.label));

    saveResult(score); // sonucu Firestore'a kaydet

    Alert.alert(
      isPerfect ? 'Tebrikler!' : 'Sonuçlar',
      `${isPerfect ? 'Hepsi doğru!' : `Doğru eşleşme sayısı: ${correctCount}`} \nPuan: ${score} / 50`,
    );
  };


  const renderItem = ({ item, drag, isActive }) => (
    <View style={[styles.row, isActive && { opacity: 0.8 }]}>
      <Image source={{ uri: item.uri }} style={styles.image} />
      <TouchableOpacity onLongPress={drag} disabled={isActive} style={styles.dropZone}>
        <View style={styles.innerDropZone}>
          <Text style={styles.dropText}>{item.label}</Text>
        </View>
        <TouchableOpacity onPress={() => speak(item.label)}>
          <Icon name="volume-high" size={22} color="#0984e3" />
        </TouchableOpacity>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🎯 Görsel-Kelime Eşleştirme</Text>
      <DraggableFlatList
        data={items}
        keyExtractor={it => it.id}
        renderItem={renderItem}
        onDragEnd={({ data }) => setItems(data)}
      />
      <TouchableOpacity style={styles.checkButton} onPress={checkMatch}>
        <Text style={styles.checkText}>Eşleştirmeyi Kontrol Et</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex:1, padding:16, backgroundColor:'#ecf0f1' },
  title: { fontSize:24,fontWeight:'bold',color:'#2d3436',textAlign:'center',marginBottom:16 },
  row: { flexDirection:'row',alignItems:'center',backgroundColor:'#dfe6e9',borderRadius:12,padding:10,marginBottom:12,justifyContent:'space-between' },
  image: { width:width*0.35, height:100, borderRadius:12, resizeMode:'cover' },
  dropZone: { flexDirection:'row',alignItems:'center',backgroundColor:'#b2bec3',borderRadius:10,padding:8,width:width*0.5,justifyContent:'space-between' },
  innerDropZone: { backgroundColor:'#74b9ff', padding:10, borderRadius:8, flex:1, marginRight:8 },
  dropText: { fontSize:18,fontWeight:'bold',color:'#fff',textAlign:'center' },
  checkButton: { backgroundColor:'#6c5ce7',marginTop:20,paddingVertical:14,paddingHorizontal:30,borderRadius:10,alignSelf:'center' },
  checkText: { fontSize:18,fontWeight:'bold',color:'#fff' },
});
