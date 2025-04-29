import React, { createContext, useEffect, useState } from 'react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth } from './firebase';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        await AsyncStorage.setItem('isLoggedIn', 'true');
      } else {
        setUser(null);
        await AsyncStorage.removeItem('isLoggedIn');
      }
      setInitializing(false);
    });

    return unsubscribe;
  }, []);

  const logout = async () => {
    await signOut(auth);
    await AsyncStorage.removeItem('isLoggedIn');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, initializing, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
