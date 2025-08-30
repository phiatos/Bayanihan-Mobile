import React, { createContext, useState, useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { database, auth } from '../configuration/firebaseConfig';
import { ref, get } from 'firebase/database';
import { onAuthStateChanged, sendEmailVerification, signOut } from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Theme from '../constants/theme';

export const AuthContext = createContext({
  user: null,
  setUser: () => {},
});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log('AuthContext: Setting up auth state listener');
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      console.log('AuthContext: onAuthStateChanged triggered, user:', currentUser ? currentUser.uid : 'null');
      try {
        if (currentUser) {
          const userSnapshot = await get(ref(database, `users/${currentUser.uid}`));
          const userData = userSnapshot.val();
          console.log('AuthContext: User data fetched:', userData);
          if (userData) {
            const isAdmin = userData?.role === 'AB ADMIN' || userData?.role === 'admin';
            if (!isAdmin && !currentUser.emailVerified) {
              const actionCodeSettings = {
                url: 'https://bayanihan-5ce7e.firebaseapp.com',
                handleCodeInApp: false,
              };
              await sendEmailVerification(currentUser, actionCodeSettings);
              await signOut(auth);
              setUser(null);
              await AsyncStorage.removeItem('user_session');
              console.log('AuthContext: Email not verified, user signed out');
            } else {
              const userObject = {
                id: currentUser.uid,
                contactPerson: userData.contactPerson || currentUser.displayName || 'Unknown',
                email: currentUser.email,
                role: userData.role,
                organization: userData.organization,
                firstName: userData.firstName,
                lastName: userData.lastName,
                adminPosition: userData.adminPosition,
              };
              setUser(userObject);
              await AsyncStorage.setItem('user_session', JSON.stringify(userObject));
              console.log('AuthContext: User set and session saved:', currentUser.uid);
            }
          } else {
            await signOut(auth);
            setUser(null);
            await AsyncStorage.removeItem('user_session');
            console.log('AuthContext: No user data in database, user signed out');
          }
        } else {
          setUser(null);
          await AsyncStorage.removeItem('user_session');
          console.log('AuthContext: No user logged in');
        }
      } catch (error) {
        console.error('AuthContext: Error fetching user data:', error.message);
        setUser(null);
        await AsyncStorage.removeItem('user_session');
      } finally {
        setLoading(false);
        console.log('AuthContext: Auth state changed, final user:', user ? user.id : 'null');
      }
    });

    return () => {
      console.log('AuthContext: Cleaning up auth state listener');
      unsubscribe();
    };
  }, []); // Remove `user` from dependencies to avoid re-running unnecessarily

  const authContextValue = {
    user,
    setUser: async (userData) => {
      setUser(userData);
      try {
        if (userData) {
          await AsyncStorage.setItem('user_session', JSON.stringify(userData));
        } else {
          await AsyncStorage.removeItem('user_session');
        }
      } catch (error) {
        console.error('AuthContext: Error saving session:', error.message);
      }
    },
  };

  return (
    <AuthContext.Provider value={authContextValue}>
      {loading ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size={50} color={Theme.colors.primary} />
        </View>
      ) : (
        children
      )}
    </AuthContext.Provider>
  );
};