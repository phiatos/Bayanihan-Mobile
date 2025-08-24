import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getDatabase } from 'firebase/database';
import { getStorage } from 'firebase/storage';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyDJxMv8GCaMvQT2QBW3CdzA3dV5X_T2KqQ",
  authDomain: "bayanihan-5ce7e.firebaseapp.com",
  databaseURL: "https://bayanihan-5ce7e-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "bayanihan-5ce7e",
  storageBucket: "bayanihan-5ce7e.firebasestorage.app",
  messagingSenderId: "593123849917",
  appId: "1:593123849917:web:eb85a63a536eeff78ce9d4",
  measurementId: "G-ZTQ9VXXVV0"
};

let app;
try {
  app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
  console.log('Firebase app initialized:', app.name);
} catch (error) {
  console.error('Firebase initialization failed:', error.message);
  throw error;
}

let auth, database, storage, db;
try {
  auth = getAuth(app);
  database = getDatabase(app);
  storage = getStorage(app, 'gs://bayanihan-5ce7e.firebasestorage.app');
  db = getFirestore(app);
  console.log('Firebase Auth:', !!auth);
  console.log('Firebase Database:', !!database);
  console.log('Firebase Storage:', !!storage);
  console.log('Firebase Storage Bucket:', storage._bucket.bucket);
  console.log('Firebase Firestore:', !!db);
  console.log('Firebase Auth, Database, Storage, and Firestore initialized successfully');
} catch (error) {
  console.error('Failed to initialize Firebase services:', error.message);
  throw error;
}

export { app, auth, database, storage, db };