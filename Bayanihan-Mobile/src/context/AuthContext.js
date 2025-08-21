import React, { createContext, useState, useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { auth } from '../configuration/firebaseConfig';
import { onAuthStateChanged } from 'firebase/auth';

export const AuthContext = createContext({
  user: null,
  setUser: () => {},
});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

useEffect(() => {
  const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
    try {
      if (!currentUser) {
        setUser(null);
        return;
      }

      const userSnapshot = await get(ref(database, `users/${currentUser.uid}`));
      const userData = userSnapshot.val();

      if (userData) {
        setUser({
          id: currentUser.uid,
          email: currentUser.email,
          role: userData.role,
          ...userData,
        });
      } else {
        setUser(null);
      }
    } catch (err) {
      console.error(err);
      setUser(null); // fallback
    } finally {
      setLoading(false); // <-- this is critical
    }
  });

  return unsubscribe;
}, []);


return (
  <AuthContext.Provider value={{ user, setUser }}>
    {loading ? (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#000" />
      </View>
    ) : (
      children
    )}
  </AuthContext.Provider>
);

};