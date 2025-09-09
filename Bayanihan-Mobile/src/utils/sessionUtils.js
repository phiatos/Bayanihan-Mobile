import AsyncStorage from '@react-native-async-storage/async-storage';
import { auth } from '../configuration/firebaseConfig';

export const checkAuthState = async () => {
  console.log(`[${new Date().toISOString()}] Checking Firebase Auth state, currentUser:`, auth.currentUser);
  return new Promise((resolve) => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      console.log(`[${new Date().toISOString()}] onAuthStateChanged in checkAuthState:`, user ? user.uid : 'No user');
      if (user) {
        try {
          const token = await AsyncStorage.getItem('userToken');
          console.log(`[${new Date().toISOString()}] Retrieved userToken from AsyncStorage:`, token ? 'Present' : 'Not found');
          resolve(user);
        } catch (error) {
          console.error(`[${new Date().toISOString()}] Error accessing AsyncStorage:`, error.message);
          resolve(null);
        }
      } else {
        console.log(`[${new Date().toISOString()}] No authenticated user found`);
        resolve(null);
      }
      unsubscribe();
    }, (error) => {
      console.error(`[${new Date().toISOString()}] onAuthStateChanged error in checkAuthState:`, error.message);
      resolve(null);
      unsubscribe();
    });
  });
};