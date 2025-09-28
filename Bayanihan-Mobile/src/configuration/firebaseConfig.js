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
    databaseURL: "https://bayanihan-new-472410-default-rtdb.asia-southeast1.firebasedatabase.app/"
  };

let app;
if (!getApps().length) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApp();
}

let auth;
try {
  if (!app.authInstance) {
    auth = initializeAuth(app, {
      persistence: getReactNativePersistence(AsyncStorage),
    });
    app.authInstance = auth; 
  } else {
    auth = getAuth(app);
  }
} catch (e) {
  auth = getAuth(app); 
}

const database = getDatabase(app);
const storage = getStorage(app, 'bayanihan-new-472410.firebasestorage.app');
const db = getFirestore(app);

export { app, auth, database, storage, db };
