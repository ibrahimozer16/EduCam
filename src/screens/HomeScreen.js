import { useFocusEffect } from '@react-navigation/native';
import React, { useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, BackHandler, Alert } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useTranslation } from 'react-i18next';

const HomeScreen = ({ navigation }) => {
  const { t } = useTranslation();

  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        Alert.alert(t('exitAppTitle'), t('exitAppMessage'), [
          { text: t('cancel'), style: 'cancel' },
          { text: t('yes'), onPress: () => BackHandler.exitApp() },
        ]);
        return true;
      };

      const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
      return () => subscription.remove();
    }, [t])
  );

  return (
    <View style={styles.container}>
      {/* Üst Menü */}
      <View style={styles.header}>
        <TouchableOpacity>
          <Text>         </Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>EduCam</Text>
        <TouchableOpacity onPress={() => navigation.navigate('Profile')}>
          <Icon name="person-outline" size={30} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* İçerik */}
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.sectionTitle}>{t('home')}</Text>

        <View style={styles.cardContainer}>
          <TouchableOpacity style={styles.card} onPress={() => navigation.navigate('Camera')}>
            <Icon name="camera-outline" size={40} color="#fff" />
            <Text style={styles.cardText}>{t('camera')}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.card} onPress={() => navigation.navigate('Exams')}>
            <Icon name="book-outline" size={40} color="#fff" />
            <Text style={styles.cardText}>{t('exams')}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.cardContainer}>
          <TouchableOpacity style={styles.card} onPress={() => navigation.navigate('Library')}>
            <Icon name="folder-outline" size={40} color="#fff" />
            <Text style={styles.cardText}>{t('library')}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.card} onPress={() => navigation.navigate('Games')}>
            <Icon name="game-controller-outline" size={40} color="#fff" />
            <Text style={styles.cardText}>{t('games')}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.cardContainer}>
          <TouchableOpacity style={styles.card} onPress={() => navigation.navigate('Results')}>
            <Icon name="trophy-outline" size={40} color="#fff" />
            <Text style={styles.cardText}>{t('results')}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.card} onPress={() => navigation.navigate('Analytics')}>
            <Icon name="stats-chart-outline" size={40} color="#fff" />
            <Text style={styles.cardText}>{t('analytics')}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

export default HomeScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f8f8',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    backgroundColor: '#1e3a8a',
  },
  headerTitle: {
    color: '#fff',
    fontSize: 30,
    fontWeight: 'bold',
  },
  content: {
    padding: 20,
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 30,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#1e3a8a',
  },
  cardContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  card: {
    backgroundColor: '#2563eb',
    padding: 20,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    width: 140,
    margin: 10,
  },
  cardText: {
    color: '#fff',
    fontSize: 16,
    marginTop: 8,
  },
});
