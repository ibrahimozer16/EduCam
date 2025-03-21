import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { NavigationContainer } from '@react-navigation/native';
import LoginScreen from './screens/LoginScreen';
import RegisterScreen from './screens/RegisterScreen';
import HomeScreen from './screens/HomeScreen';
import ProfileScreen from './screens/ProfileScreen';
import CameraScreen from './screens/CameraScreen';
import SettingScreen from './screens/SettingScreen';
import ExamsScreen from './screens/ExamsScreen';
import LibraryScreen from './screens/LibraryScreen';
import GamesScreen from './screens/GamesScreen';
import Icon from 'react-native-vector-icons/Ionicons';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

const MainTabNavigator = () => {
  return (
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
}

const AppNavigator = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {/* Kullanıcı giriş yapmadıysa önce Login/Register göster */}
      {/* <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} /> */}

      {/* Giriş yapıldıysa Ana Sayfaya yönlendir */}
      <Stack.Screen name="Main" component={MainTabNavigator} />
      <Stack.Screen name="Profile" component={ProfileScreen} />
      <Stack.Screen name="Exams" component={ExamsScreen} />
      <Stack.Screen name="Library" component={LibraryScreen} />
      <Stack.Screen name="Games" component={GamesScreen} />
    </Stack.Navigator>
  );
};

const App = () => {
  return (
    <NavigationContainer>
      <AppNavigator />
    </NavigationContainer>
  );
};

export default App;
