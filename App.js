import React, { useContext } from 'react';
import { View, Text } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { AuthProvider, AuthContext } from './src/firebase/AuthProvider';
import HomeScreen from './src/screens/HomeScreen';
import CameraScreen from './src/screens/CameraScreen';
import SettingScreen from './src/screens/SettingScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import ExamsScreen from './src/screens/ExamsScreen';
import LibraryScreen from './src/screens/LibraryScreen';
import GamesScreen from './src/screens/GamesScreen';
import LoginScreen from './src/screens/LoginScreen';
import RegisterScreen from './src/screens/RegisterScreen';
import Icon from 'react-native-vector-icons/Ionicons';
import GeneralQuizScreen from './src/screens/quizTypes/GeneralQuizScreen';
import MiniQuizScreen from './src/screens/quizTypes/MiniQuizScreen';
import PhotoWordGame from './src/screens/gameTypes/PhotoWordGame';
import ImageWordMatch from './src/screens/gameTypes/ImageWordMatch';
import PhotoWordGameModeScreen from './src/screens/gameTypes/PhotoWordGameModeScreen';
import ImageWordMatchScreen from './src/screens/gameTypes/ImageWordMatchScreen';
import ImageMultipleChoiceMiniScreen from './src/screens/quizTypes/ImageMultipleChoiceMiniScreen';
import ImageMultipleChoiceGeneralScreen from './src/screens/quizTypes/ImageMultipleChoiceGeneralScreen';
import MatchByArrowModeScreen from './src/screens/gameTypes/MatchByArrowModeScreen';
import ArrowMatchGame from './src/screens/gameTypes/ArrowMatchGame';
import MemoryMatchModeScreen from './src/screens/gameTypes/MemoryMatchModeScreen';
import MemoryMatchGame from './src/screens/gameTypes/MemoryMatchGame';
import AudioGuessModeScreen from './src/screens/gameTypes/AudioGuessModeScreen';
import AudioGuessGame from './src/screens/gameTypes/AudioGuessGame';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

const MainTabNavigator = () => (
  <Tab.Navigator
    initialRouteName='Home'
    screenOptions={({ route }) => ({
      tabBarIcon: ({ color, size }) => {
        let iconName;
        if (route.name === 'Camera') iconName = 'camera-outline';
        else if (route.name === 'Home') iconName = 'home-outline';
        else if (route.name === 'Settings') iconName = 'settings-outline';
        return <Icon name={iconName} size={size} color={color} />;
      },
      tabBarActiveTintColor: '#1e3a8a',
      tabBarInactiveTintColor: 'gray',
      tabBarStyle: { backgroundColor: '#fff', paddingBottom: 5 },
    })}
  >
    <Tab.Screen name="Camera" component={CameraScreen} />
    <Tab.Screen name="Home" component={HomeScreen} />
    <Tab.Screen name="Settings" component={SettingScreen} />
  </Tab.Navigator>
);

const AuthStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="Login" component={LoginScreen} />
    <Stack.Screen name="Register" component={RegisterScreen} />
  </Stack.Navigator>
);

const AppNavigator = () => {
  const { user, initializing } = useContext(AuthContext);

  if (initializing) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'white' }}>
        <Text style={{ fontSize: 18 }}>Yükleniyor...</Text>
      </View>
    )
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {user ? (
        <>
          <Stack.Screen name="Main" component={MainTabNavigator} />
          <Stack.Screen name="Profile" component={ProfileScreen} />
          <Stack.Screen name="Exams" component={ExamsScreen} />
          <Stack.Screen name="Library" component={LibraryScreen} />
          <Stack.Screen name="Games" component={GamesScreen} />
          <Stack.Screen name="GeneralQuiz" component={GeneralQuizScreen} />
          <Stack.Screen name="MiniQuiz" component={MiniQuizScreen} />
          <Stack.Screen name="ImageGeneralQuiz" component={ImageMultipleChoiceGeneralScreen} />
          <Stack.Screen name="ImageMiniQuiz" component={ImageMultipleChoiceMiniScreen} />
          <Stack.Screen name="PhotoWordMode" component={PhotoWordGameModeScreen} />
          <Stack.Screen name="PhotoWordGame" component={PhotoWordGame} />
          <Stack.Screen name="ImageWordMode" component={ImageWordMatchScreen} />
          <Stack.Screen name="ImageWord" component={ImageWordMatch} />
          <Stack.Screen name="ArrowGameMode" component={MatchByArrowModeScreen} />
          <Stack.Screen name="ArrowGame" component={ArrowMatchGame} />
          <Stack.Screen name="MemoryGameMode" component={MemoryMatchModeScreen} />
          <Stack.Screen name="MemoryGame" component={MemoryMatchGame} />
          <Stack.Screen name="AudioGuessGameMode" component={AudioGuessModeScreen} />
          <Stack.Screen name="AudioGuessGame" component={AudioGuessGame} />

        </>
      ) : (
        <Stack.Screen name="Auth" component={AuthStack} />
      )}
    </Stack.Navigator>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <NavigationContainer>
        <AppNavigator />
      </NavigationContainer>
    </AuthProvider>
  );
}
