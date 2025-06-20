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
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import { useFocusEffect } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Ionicons';
import Tts from 'react-native-tts';
import { useTranslation } from 'react-i18next';

export default function LibraryScreen({ navigation }) {
  const { t, i18n } = useTranslation();
  const [items, setItems] = useState([]);
  const [filteredItems, setFilteredItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState('');
  const [sortOrder, setSortOrder] = useState('default');

  const fetchItems = async () => {
    try {
      setLoading(true);
      const userId = auth().currentUser?.uid;
      if (!userId) throw new Error('No user session');

      const userCollection = firestore()
        .collection('users')
        .doc(userId)
        .collection('recognized_items');

      const snapshot = await userCollection.orderBy('timestamp', 'desc').get();

      const fetchedItems = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setItems(fetchedItems);
      setFilteredItems(fetchedItems);
    } catch (error) {
      console.error('Fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchItems();
    }, [])
  );

  const speak = text => {
    Tts.stop();
    Tts.speak(text, { language: i18n.language });
  };

  const handleSearchAndSort = useCallback(() => {
    let updatedItems = [...items];

    if (searchText.trim()) {
      updatedItems = updatedItems.filter(item =>
        (item[`label_${i18n.language}`] || '').toLowerCase().includes(searchText.toLowerCase())
      );
    }

    if (sortOrder === 'asc') {
      updatedItems.sort((a, b) =>
        (a[`label_${i18n.language}`] || '').localeCompare(b[`label_${i18n.language}`] || '')
      );
    } else if (sortOrder === 'desc') {
      updatedItems.sort((a, b) =>
        (b[`label_${i18n.language}`] || '').localeCompare(a[`label_${i18n.language}`] || '')
      );
    }

    setFilteredItems(updatedItems);
  }, [items, searchText, sortOrder, i18n.language]);

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
      <View style={styles.labelRow}>
        <Text style={styles.label}>{item[`label_${i18n.language}`] || item.label_en}</Text>
        <TouchableOpacity onPress={() => speak(item[`label_${i18n.language}`] || item.label_en)}>
          <Icon name="volume-high" size={22} color="#0984e3" />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {loading ? (
        <ActivityIndicator size="large" color="#1e3a8a" style={{ marginTop: 30 }} />
      ) : (
        <>
          <Text style={styles.headText}>{t('library')}</Text>
          <TextInput
            style={styles.searchInput}
            placeholder={t('searchPlaceholder') + '...'}
            placeholderTextColor="#ccc"
            value={searchText}
            onChangeText={setSearchText}
          />

          <View style={styles.sortButtons}>
            <TouchableOpacity
              style={[styles.sortButton, sortOrder === 'asc' && styles.activeSort]}
              onPress={() => setSortOrder('asc')}
            >
              <Text style={styles.sortText}>{t('sortAZ')}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.sortButton, sortOrder === 'desc' && styles.activeSort]}
              onPress={() => setSortOrder('desc')}
            >
              <Text style={styles.sortText}>{t('sortZA')}</Text>
            </TouchableOpacity>
          </View>

          <FlatList
            data={filteredItems}
            keyExtractor={item => item.id}
            renderItem={renderItem}
            contentContainerStyle={{ paddingBottom: 30 }}
          />
          <TouchableOpacity style={styles.button} onPress={() => navigation.navigate('Main')}>
            <Icon name="arrow-back-circle-outline" size={24} color={'#1e3a8a'} />
            <Text style={styles.buttonText}>{t('backToHome')}</Text>
          </TouchableOpacity>
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
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  button: {
    backgroundColor: '#dfe6e9',
    padding: 16,
    borderRadius: 12,
    marginVertical: 5,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    justifyContent: 'center',
  },
  buttonText: {
    fontSize: 18,
    color: '#1e3a8a',
  },
  headText: {
    fontSize: 30,
    color: '#1e3a8a',
    alignSelf: 'center',
    justifyContent: 'center',
    marginBottom: 15,
  }
});
