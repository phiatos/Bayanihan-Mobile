import React, { useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import AuthStack from './src/navigation/AuthStack';
import AppStack from './src/navigation/AppStack';
import { useFonts } from 'expo-font';

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // fonts
  const [fontsLoaded] = useFonts({
    Poppins_Regular: require('./assets/fonts/Poppins/Poppins-Regular.ttf'),  
    Poppins_SemiBold: require('./assets/fonts/Poppins/Poppins-SemiBold.ttf'),
    Poppins_Bold: require('./assets/fonts/Poppins/Poppins-Bold.ttf'),
    Poppins_Medium: require('./assets/fonts/Poppins/Poppins-Medium.ttf'),
  });

  if (!fontsLoaded) return null;

  return (
    <NavigationContainer>
      {isLoggedIn ? (
        <AppStack onSignOut={() => setIsLoggedIn(false)} />
      ) : (
        <AuthStack onLogin={() => setIsLoggedIn(true)} />
      )}
    </NavigationContainer>
  );
}

export default App;
