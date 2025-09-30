import { initializeApp, getApps, getApp } from 'firebase/app';
import { initializeAuth, getReactNativePersistence, getAuth } from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getDatabase } from 'firebase/database';
import { getStorage } from 'firebase/storage';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
 apiKey: "AIzaSyBkmXOJvnlBtzkjNyR6wyd9BgGM0BhN0L8",
    authDomain: "bayanihan-new-472410.firebaseapp.com",
    projectId: "bayanihan-new-472410",
    storageBucket: "bayanihan-new-472410.firebasestorage.app",
    messagingSenderId: "995982574131",
    appId: "1:995982574131:web:3d45e358fad330c276d946",
    measurementId: "G-CEVPTQZM9C",
    databaseURL: "https://bayanihan-new-472410-default-rtdb.asia-southeast1.firebasedatabase.app/"};

async function testAsyncStorage() {
  try {
    await AsyncStorage.setItem('test_key', 'test_value');
    const value = await AsyncStorage.getItem('test_key');
    await AsyncStorage.removeItem('test_key');
  } catch (error) {
    console.error('Firebase: AsyncStorage test failed:', error.message, error.code);
  }
}
testAsyncStorage();

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

let auth;
try {
  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage),
  });
} catch (error) {
  if (error.code === 'auth/already-initialized') {
    auth = getAuth(app);
  } else {
    console.error('Firebase: Error initializing auth:', {
      message: error.message,
      code: error.code,
      stack: error.stack,
    });
    auth = getAuth(app);
    console.warn('Firebase: Using default auth without persistence');
  }
}

const database = getDatabase(app);
const storage = getStorage(app, 'bayanihan-new-472410.firebasestorage.app');
const db = getFirestore(app);

export { app, auth, database, storage, db };