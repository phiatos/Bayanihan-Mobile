import React, { createContext, useContext, useState, useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { database, auth } from '../configuration/firebaseConfig';
import { ref, get } from 'firebase/database';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Theme from '../constants/theme';

export const AuthContext = createContext({
  user: null,
  setUser: () => {},
  loading: true,
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
          await currentUser.getIdToken(true);
          const userSnapshot = await get(ref(database, `users/${currentUser.uid}`));
          const userData = userSnapshot.val();

          if (userData) {
            const userObject = {
              id: currentUser.uid,
              contactPerson: userData.contactPerson || `${userData.firstName} ${userData.lastName || ''}`.trim(),
              email: currentUser.email,
              role: userData.role,
              organization: userData.organization || 'Admin',
              organizationName: userData.organizationName,
              firstName: userData.firstName,
              lastName: userData.lastName,
              adminPosition: userData.adminPosition,
            };
            setUser(userObject);
            await AsyncStorage.setItem('user_session', JSON.stringify(userObject));
            console.log('AuthContext: User set and session saved:', currentUser.uid);
          } else {
            const cachedUser = await AsyncStorage.getItem('user_session');
            if (cachedUser) {
              console.log('AuthContext: No user data in database, using cached user:', JSON.parse(cachedUser).id);
              setUser(JSON.parse(cachedUser));
            } else {
              console.warn('AuthContext: No user data in database and no cached user, signing out');
              await signOut(auth);
              setUser(null);
              await AsyncStorage.removeItem('user_session');
            }
          }
        } else {
          const cachedUser = await AsyncStorage.getItem('user_session');
          if (cachedUser) {
            console.log('AuthContext: No Firebase user, using cached user:', JSON.parse(cachedUser).id);
            setUser(JSON.parse(cachedUser));
          } else {
            setUser(null);
            await AsyncStorage.removeItem('user_session');
            console.log('AuthContext: No user logged in and no cached user');
          }
        }
      } catch (error) {
        console.error('AuthContext: Error processing auth state:', error.message);
        if (error.code === 'auth/network-request-failed') {
          const cachedUser = await AsyncStorage.getItem('user_session');
          if (cachedUser) {
            console.log('AuthContext: Network error, using cached user:', JSON.parse(cachedUser).id);
            setUser(JSON.parse(cachedUser));
          } else {
            setUser(null);
            await AsyncStorage.removeItem('user_session');
          }
        } else {
          await signOut(auth);
          setUser(null);
          await AsyncStorage.removeItem('user_session');
        }
      } finally {
        setLoading(false);
      }
    });

    return () => {
      console.log('AuthContext: Cleaning up auth state listener');
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!loading) {
      console.log('AuthContext: Auth state changed, final user:', user ? user.id : 'null');
      console.log('AuthContext: Auth state changed, final user contact:', user ? user.contactPerson : 'null');
    }
  }, [user, loading]);

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
    loading,
  };

  return (
    <AuthContext.Provider value={authContextValue}>
      {loading ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size={100} color={Theme.colors.primary} />
        </View>
      ) : (
        children
      )}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};