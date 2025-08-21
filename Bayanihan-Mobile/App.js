import React, { useEffect, useCallback, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import AuthStack from './src/navigation/AuthStack';
import AppStack from './src/navigation/AppStack';
import { useFonts } from 'expo-font';
import { AuthContext } from './src/context/AuthContext';
import * as SplashScreen from 'expo-splash-screen';
import 'react-native-reanimated';
import 'react-native-gesture-handler';
import * as NavigationBar from 'expo-navigation-bar';

SplashScreen.preventAutoHideAsync();

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

  const [ready, setReady] = useState(false);

  useEffect(() => {
  const prepareApp = async () => {
    try {
      await SplashScreen.preventAutoHideAsync();

      if (fontsLoaded) setReady(true);

      // optional: small delay to avoid instant flicker
      await new Promise((res) => setTimeout(res, 100));
    } catch (e) {
      console.warn(e);
    } finally {
      await SplashScreen.hideAsync(); // always hide splash eventually
    }
  };

  prepareApp();
}, [fontsLoaded]);

if (!ready) {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <ActivityIndicator size="large" color="#000" />
    </View>
  );
}


  return (
    <AuthContext.Provider value={{ user, setUser }}>
      <NavigationContainer>
        {user ? (
          <AppStack onSignOut={() => setUser(undefined)} />
        ) : (
          <AuthStack />
        )}
      </NavigationContainer>
    </AuthContext.Provider>
  );
}

export default App;
