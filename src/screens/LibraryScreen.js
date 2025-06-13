import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Image,
} from 'react-native';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import storage from '@react-native-firebase/storage';
import { useFocusEffect } from '@react-navigation/native';

export default function LibraryScreen() {
  const [items, setItems] = useState([]);
  const [filteredItems, setFilteredItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState('');
  const [sortOrder, setSortOrder] = useState('default');

  const fetchItems = async () => {
    try {
      setLoading(true);
      const userId = auth().currentUser?.uid;
      if (!userId) throw new Error('Kullanıcı oturumu yok');

      const userCollection = firestore()
        .collection('users')
        .doc(userId)
        .collection('recognized_items');

      const snapshot = await userCollection.orderBy('timestamp', 'desc').get();

      const fetchedItems = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setItems(fetchedItems);
      setFilteredItems(fetchedItems);
    } catch (error) {
      console.error('📚 Veri çekme hatası:', error);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchItems();
    }, [])
  );

  const handleSearchAndSort = useCallback(() => {
    let updatedItems = [...items];

    if (searchText.trim()) {
      updatedItems = updatedItems.filter(item =>
        (item.label_tr || '').toLowerCase().includes(searchText.toLowerCase())
      );
    }

    if (sortOrder === 'asc') {
      updatedItems.sort((a, b) => (a.label_tr || '').localeCompare(b.label_tr || ''));
    } else if (sortOrder === 'desc') {
      updatedItems.sort((a, b) => (b.label_tr || '').localeCompare(a.label_tr || ''));
    }

    setFilteredItems(updatedItems);
  }, [items, searchText, sortOrder]);

  useEffect(() => {
    handleSearchAndSort();
  }, [searchText, sortOrder, items, handleSearchAndSort]);

  const renderItem = ({ item }) => (
    <View style={styles.card}>
      {item.photoUrl && (
        <Image
          source={{ uri: item.photoUrl }}
          style={{ width: '100%', height: 200, borderRadius: 8, marginBottom: 10 }}
          resizeMode="cover"
        />
      )}
      <Text style={styles.label}>{item.label_tr || item.label_en}</Text>
      <Text style={styles.confidence}>Doğruluk: {(item.confidence * 100).toFixed(2)}%</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      {loading ? (
        <ActivityIndicator size="large" color="#1e3a8a" style={{ marginTop: 30 }} />
      ) : (
        <>
          <TextInput
            style={styles.searchInput}
            placeholder="Ara..."
            placeholderTextColor="#ccc"
            value={searchText}
            onChangeText={setSearchText}
          />

          <View style={styles.sortButtons}>
            <TouchableOpacity
              style={[styles.sortButton, sortOrder === 'asc' && styles.activeSort]}
              onPress={() => setSortOrder('asc')}
            >
              <Text style={styles.sortText}>A-Z</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.sortButton, sortOrder === 'desc' && styles.activeSort]}
              onPress={() => setSortOrder('desc')}
            >
              <Text style={styles.sortText}>Z-A</Text>
            </TouchableOpacity>
          </View>

          <FlatList
            data={filteredItems}
            keyExtractor={item => item.id}
            renderItem={renderItem}
            contentContainerStyle={{ paddingBottom: 30 }}
          />
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f6fa', padding: 20 },
  searchInput: {
    backgroundColor: 'white',
    borderRadius: 8,
    paddingHorizontal: 15,
    fontSize: 16,
    marginBottom: 15,
    color: '#1e3a8a',
    height: 50,
  },
  sortButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 15,
  },
  sortButton: {
    backgroundColor: '#dfe6e9',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  activeSort: {
    backgroundColor: '#1e3a8a',
  },
  sortText: {
    color: '#1e3a8a',
    fontSize: 16,
    fontWeight: 'bold',
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    marginBottom: 10,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  label: { fontSize: 18, color: '#2d3436', fontWeight: 'bold', marginBottom: 5 },
  confidence: { fontSize: 14, color: '#636e72' },
});