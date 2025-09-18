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

  const validateUserObject = (userObj) => {
    return userObj && typeof userObj === 'object' && userObj.id && userObj.email;
  };

  useEffect(() => {
    console.log('AuthContext: Setting up auth state listener');

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      console.log('AuthContext: onAuthStateChanged triggered, user:', currentUser ? currentUser.uid : 'null');
      let userObject = null;

      const refreshTokenWithRetry = async (maxRetries = 2, retryDelay = 1000) => {
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
          try {
            const idTokenResult = await currentUser.getIdTokenResult(true);
            console.log('AuthContext: Token refreshed, expires at:', new Date(idTokenResult.expirationTime));
            return true;
          } catch (tokenError) {
            console.error(`AuthContext: Token refresh attempt ${attempt}/${maxRetries} failed:`, tokenError.message);
            if (attempt < maxRetries) {
              await new Promise(resolve => setTimeout(resolve, retryDelay));
            }
          }
        }
        return false;
      };

      try {
        if (currentUser) {
          const tokenRefreshed = await refreshTokenWithRetry();
          if (!tokenRefreshed) {
            console.warn('AuthContext: Token refresh failed after retries, attempting to proceed with cached data');
          }

          try {
            const userSnapshot = await get(ref(database, `users/${currentUser.uid}`));
            const userData = userSnapshot.val();
            if (userData) {
              userObject = {
                id: currentUser.uid,
                contactPerson: userData.contactPerson || `${userData.firstName || ''} ${userData.lastName || ''}`.trim() || 'Unknown',
                email: currentUser.email || userData.email || 'N/A',
                role: userData.role || 'N/A',
                organization: userData.organization || 'Admin',
                organizationName: userData.organizationName || 'N/A',
                firstName: userData.firstName || 'N/A',
                lastName: userData.lastName || 'N/A',
                adminPosition: userData.adminPosition || 'N/A',
              };
              console.log('AuthContext: User data fetched from database:', userObject.id);
            } else {
              console.warn('AuthContext: No user data in database for:', currentUser.uid);
            }
          } catch (dbError) {
            console.error('AuthContext: Database read failed:', dbError.message);
            if (dbError.message.includes('PERMISSION_DENIED')) {
              console.warn('AuthContext: Permission denied, likely due to invalid auth token');
            }
          }
        }

        // Fallback to AsyncStorage
        const cachedUser = await AsyncStorage.getItem('user_session');
        if (cachedUser) {
          try {
            const parsedUser = JSON.parse(cachedUser);
            if (validateUserObject(parsedUser)) {
              console.log('AuthContext: Using cached user:', parsedUser.id);
              userObject = { ...parsedUser, email: parsedUser.email || currentUser?.email || 'N/A' };
            } else {
              console.warn('AuthContext: Invalid cached user data:', parsedUser);
              await AsyncStorage.removeItem('user_session');
            }
          } catch (parseError) {
            console.error('AuthContext: Failed to parse cached user:', parseError.message);
            await AsyncStorage.removeItem('user_session');
          }
        }

        if (userObject) {
          setUser(userObject);
          await AsyncStorage.setItem('user_session', JSON.stringify(userObject));
          console.log('AuthContext: User set and session saved:', userObject.id);
        } else if (currentUser) {
          console.warn('AuthContext: No valid user data or cached user, but Firebase user exists. Setting minimal user object.');
          userObject = {
            id: currentUser.uid,
            email: currentUser.email || 'N/A',
            contactPerson: 'Unknown',
            role: 'N/A',
            organization: 'Admin',
            organizationName: 'N/A',
            firstName: 'N/A',
            lastName: 'N/A',
            adminPosition: 'N/A',
          };
          setUser(userObject);
          await AsyncStorage.setItem('user_session', JSON.stringify(userObject));
        } else {
          console.log('AuthContext: No user data, no cached user, no Firebase user. Signing out.');
          await signOut(auth);
          setUser(null);
          await AsyncStorage.removeItem('user_session');
        }
      } catch (error) {
        console.error('AuthContext: Error processing auth state:', error.message);
        const cachedUser = await AsyncStorage.getItem('user_session');
        if (cachedUser) {
          try {
            const parsedUser = JSON.parse(cachedUser);
            if (validateUserObject(parsedUser)) {
              console.log('AuthContext: Error occurred, using cached user:', parsedUser.id);
              setUser(parsedUser);
            } else {
              console.warn('AuthContext: Invalid cached user data on error:', parsedUser);
              await AsyncStorage.removeItem('user_session');
              setUser(null);
            }
          } catch (parseError) {
            console.error('AuthContext: Failed to parse cached user on error:', parseError.message);
            await AsyncStorage.removeItem('user_session');
            setUser(null);
          }
        } else {
          console.log('AuthContext: Error occurred, no cached user. Signing out.');
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
      try {
        if (userData && validateUserObject(userData)) {
          setUser(userData);
          await AsyncStorage.setItem('user_session', JSON.stringify(userData));
          console.log('AuthContext: User session saved:', userData.id);
        } else {
          console.warn('AuthContext: Invalid user data, clearing session:', userData);
          setUser(null);
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
          <ActivityIndicator size={80} color={Theme.colors.primary} />
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