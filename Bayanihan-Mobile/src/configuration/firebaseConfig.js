import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getDatabase } from 'firebase/database';
import { getAnalytics, isSupported } from 'firebase/analytics';

console.log('Initializing Firebase with config...');
console.log('Database URL:', 'https://bayanihan-5ce7e-default-rtdb.asia-southeast1.firebasedatabase.app');

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

const app = initializeApp(firebaseConfig);
console.log('Firebase app initialized:', app.name);

const auth = getAuth(app);
console.log('Auth initialized:', !!auth);

const database = getDatabase(app);
console.log('Database initialized:', !!database);

let analytics = null;
isSupported().then((supported) => {
  if (supported) {
    analytics = getAnalytics(app);
    console.log('Analytics initialized:', !!analytics);
  } else {
    console.log('Analytics not supported in this environment');
  }
});

export { app, auth, database, analytics };