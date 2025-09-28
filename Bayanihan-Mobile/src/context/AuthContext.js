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

      try {
        if (currentUser) {
          // Refresh token to ensure valid session
          try {
            const idTokenResult = await currentUser.getIdTokenResult(true);
            console.log('AuthContext: Token refreshed, expires at:', new Date(idTokenResult.expirationTime));
          } catch (tokenError) {
            console.warn('AuthContext: Token refresh failed:', tokenError.message);
          }

          // Fetch user data from Realtime Database
          try {
            const userSnapshot = await get(ref(database, `users/${currentUser.uid}`));
            const userData = userSnapshot.val();
            if (userData) {
              userObject = {
                id: currentUser.uid,
                email: userData.email || currentUser.email || 'N/A',
                contactPerson: userData.contactPerson || `${userData.firstName || ''} ${userData.lastName || ''}`.trim() || 'Unknown',
                contactNumber: userData.mobile || 'N/A',
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
              userObject = {
                id: currentUser.uid,
                email: currentUser.email || 'N/A',
                contactPerson: 'Unknown',
                contactNumber: 'N/A',
                role: 'N/A',
                organization: 'Admin',
                organizationName: 'N/A',
                firstName: 'N/A',
                lastName: 'N/A',
                adminPosition: 'N/A',
              };
            }
          } catch (dbError) {
            console.error('AuthContext: Database read failed:', dbError.message, dbError.code);
            if (dbError.code === 'PERMISSION_DENIED') {
              console.warn('AuthContext: Permission denied, likely due to invalid token or security rules');
              userObject = {
                id: currentUser.uid,
                email: currentUser.email || 'N/A',
                contactPerson: 'Unknown',
                contactNumber: 'N/A',
                role: 'N/A',
                organization: 'Admin',
                organizationName: 'N/A',
                firstName: 'N/A',
                lastName: 'N/A',
                adminPosition: 'N/A',
              };
            } else {
              throw dbError; 
            }
          }

          await AsyncStorage.setItem('user_session', JSON.stringify(userObject));
          setUser(userObject);
          console.log('AuthContext: User set and session saved:', userObject.id);
        } else {
          const cachedUser = await AsyncStorage.getItem('user_session');
          if (cachedUser) {
            try {
              const parsedUser = JSON.parse(cachedUser);
              if (validateUserObject(parsedUser)) {
                console.log('AuthContext: Using cached user temporarily:', parsedUser.id);
                setUser(parsedUser);
                setTimeout(async () => {
                  if (!auth.currentUser) {
                    console.log('AuthContext: No Firebase user after delay, clearing session');
                    await AsyncStorage.removeItem('user_session');
                    await signOut(auth);
                    setUser(null);
                  } else {
                    console.log('AuthContext: Firebase user restored after delay:', auth.currentUser.uid);
                    try {
                      const userSnapshot = await get(ref(database, `users/${auth.currentUser.uid}`));
                      const userData = userSnapshot.val();
                      const restoredUser = userData
                        ? {
                            id: auth.currentUser.uid,
                            email: userData.email || auth.currentUser.email || 'N/A',
                            contactPerson: userData.contactPerson || `${userData.firstName || ''} ${userData.lastName || ''}`.trim() || 'Unknown',
                            contactNumber: userData.mobile || 'N/A',
                            role: userData.role || 'N/A',
                            organization: userData.organization || 'Admin',
                            organizationName: userData.organizationName || 'N/A',
                            firstName: userData.firstName || 'N/A',
                            lastName: userData.lastName || 'N/A',
                            adminPosition: userData.adminPosition || 'N/A',
                          }
                        : {
                            id: auth.currentUser.uid,
                            email: auth.currentUser.email || 'N/A',
                            contactPerson: 'Unknown',
                            contactNumber: 'N/A',
                            role: 'N/A',
                            organization: 'Admin',
                            organizationName: 'N/A',
                            firstName: 'N/A',
                            lastName: 'N/A',
                            adminPosition: 'N/A',
                            
                          };
                      await AsyncStorage.setItem('user_session', JSON.stringify(restoredUser));
                      setUser(restoredUser);
                      console.log('AuthContext: Restored user data:', restoredUser.id);
                    } catch (dbError) {
                      console.error('AuthContext: Failed to fetch restored user data:', dbError.message, dbError.code);
                      await AsyncStorage.removeItem('user_session');
                      await signOut(auth);
                      setUser(null);
                    }
                  }
                }, 10000); // 10-second delay for Android
              } else {
                console.warn('AuthContext: Invalid cached user data:', parsedUser);
                await AsyncStorage.removeItem('user_session');
                setUser(null);
              }
            } catch (parseError) {
              console.error('AuthContext: Failed to parse cached user:', parseError.message);
              await AsyncStorage.removeItem('user_session');
              setUser(null);
            }
          } else {
            console.log('AuthContext: No Firebase user or cached user');
            setUser(null);
            await AsyncStorage.removeItem('user_session');
          }
        }
      } catch (error) {
        console.error('AuthContext: Error processing auth state:', error.message, error.code);
        setUser(null);
        await AsyncStorage.removeItem('user_session');
        await signOut(auth);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!loading && user) {
      console.log('AuthContext: Auth state changed, final user:', user.id);
      console.log('AuthContext: Auth state changed, final user contact:', user.contactPerson || 'undefined');
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