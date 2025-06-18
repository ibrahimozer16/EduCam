import { useFocusEffect } from '@react-navigation/native';
import React, { useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image, ScrollView, BackHandler, Alert } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';

const HomeScreen = ({navigation}) => {

    useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        Alert.alert('Çıkış', 'Uygulamadan çıkmak istiyor musunuz?', [
          { text: 'İptal', style: 'cancel' },
          { text: 'Evet', onPress: () => BackHandler.exitApp() },
        ]);
        return true; // Geri tuşu davranışını durdur
      };

      const subscription = BackHandler.addEventListener(
        'hardwareBackPress',
        onBackPress
      );

      return () => subscription.remove(); // ❗️ removeEventListener yerine .remove()
    }, [])
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

            {/* İçerik Alanı */}
            <ScrollView contentContainerStyle={styles.content}>
                <Text style={styles.sectionTitle}>Anasayfa</Text>

                {/* Hızlı Erişim Kartları */}
                <View style={styles.cardContainer}>
                    <TouchableOpacity style={styles.card} onPress={() => navigation.navigate('Camera')}>
                        <Icon name="camera-outline" size={40} color="#fff" />
                        <Text style={styles.cardText}>Kamera</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.card} onPress={() => navigation.navigate('Exams')}>
                        <Icon name="book-outline" size={40} color="#fff" />
                        <Text style={styles.cardText}>Sınavlar</Text>
                    </TouchableOpacity>
                </View>

                <View style={styles.cardContainer}>
                    <TouchableOpacity style={styles.card} onPress={() => navigation.navigate('Library')}>
                        <Icon name="folder-outline" size={40} color="#fff" />
                        <Text style={styles.cardText}>Kütüphane</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.card} onPress={() => navigation.navigate('Games')}>
                        <Icon name="game-controller-outline" size={40} color="#fff" />
                        <Text style={styles.cardText}>Oyunlar</Text>
                    </TouchableOpacity>
                </View>

                <View style={styles.cardContainer}>
                    <TouchableOpacity style={styles.card} onPress={() => navigation.navigate('Results')}>
                        <Icon name="stats-chart-outline" size={40} color="#fff" />
                        <Text style={styles.cardText}>Sonuçlar</Text>
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
    bottomNav: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        backgroundColor: '#1e3a8a',
        paddingVertical: 15,
    },
});
