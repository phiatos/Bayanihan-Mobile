import 'react-native-gesture-handler';
import 'react-native-reanimated';
import 'core-js/stable/array/find-last';
import 'react-native-get-random-values';
import { v4 as uuidv4 } from 'uuid';
import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import AuthStack from './src/navigation/AuthStack';
import AppStack from './src/navigation/AppStack';
import { useFonts } from 'expo-font';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import * as SplashScreen from 'expo-splash-screen';
import * as NavigationBar from 'expo-navigation-bar';
import { StatusBar } from 'react-native';

SplashScreen.preventAutoHideAsync();

function Root() {
  const { user, loading } = useAuth();

  if (loading) return null; // Wait for auth state to resolve

  return (
    <NavigationContainer>
      {user ? <AppStack /> : <AuthStack />}
    </NavigationContainer>
  );
}

function App() {
  const [fontsLoaded] = useFonts({
    Poppins_Regular: require('./assets/fonts/Poppins/Poppins-Regular.ttf'),
    Poppins_SemiBold: require('./assets/fonts/Poppins/Poppins-SemiBold.ttf'),
    Poppins_Bold: require('./assets/fonts/Poppins/Poppins-Bold.ttf'),
    Poppins_Medium: require('./assets/fonts/Poppins/Poppins-Medium.ttf'),
    Poppins_MediumItalic: require('./assets/fonts/Poppins/Poppins-MediumItalic.ttf'),
    Poppins_Italic: require('./assets/fonts/Poppins/Poppins-Italic.ttf'),
  });
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (fontsLoaded) {
      setReady(true);
    }
  }, [fontsLoaded]);

  useEffect(() => {
    if (ready) {
      SplashScreen.hideAsync();
      NavigationBar.setBackgroundColorAsync('#00000000');
      NavigationBar.setButtonStyleAsync('dark');
    }
  }, [ready]);

  if (!ready) return null;

  return (
    <>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
      <AuthProvider>
        <Root />
      </AuthProvider>
    </>
  );
}

export default App;