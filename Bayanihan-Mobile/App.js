import React, { useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import AuthStack from './src/navigation/AuthStack';
import AppStack from './src/navigation/AppStack';
import { useFonts } from 'expo-font';
import { AuthContext } from './src/context/AuthContext';

/**
 * @typedef {Object} USER
 * @property {string} id
 * @property {string} name
 * @property {string} email
 * @property {string} role
 */
function App() {
  const [user, setUser] = useState(undefined);
  const [fontsLoaded] = useFonts({
    Poppins_Regular: require('./assets/fonts/Poppins/Poppins-Regular.ttf'),
    Poppins_SemiBold: require('./assets/fonts/Poppins/Poppins-SemiBold.ttf'),
    Poppins_Bold: require('./assets/fonts/Poppins/Poppins-Bold.ttf'),
    Poppins_Medium: require('./assets/fonts/Poppins/Poppins-Medium.ttf'),
    Poppins_MediumItalic: require('./assets/fonts/Poppins/Poppins-MediumItalic.ttf'),
    Poppins_Italic: require('./assets/fonts/Poppins/Poppins-Italic.ttf'),

  });

  if (!fontsLoaded) return null;

  return (
    <AuthContext.Provider value={{ user, setUser }}>
      <NavigationContainer>
        {user ? <AppStack onSignOut={() => setUser(undefined)} /> : <AuthStack />}
      </NavigationContainer>
    </AuthContext.Provider>
  );
}
export default App;