import React, { useContext, useRef, useEffect } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import OnboardingScreen from '../screens/OnboardingScreen';
import LoginScreen from '../screens/LoginScreen';
import RecoveryScreen from '../screens/RecoveryScreen';
import AppStack from './AppStack';
import { AuthContext } from '../context/AuthContext';
// import LottieView from 'lottie-react-native';

const Stack = createNativeStackNavigator();

const AuthStack = () => {
  const { user } = useContext(AuthContext);

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {user ? (
        <Stack.Screen name="AppStack" component={AppStack} />
      ) : (
        <>
          <Stack.Screen name="Onboarding" component={OnboardingScreen} />
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="RecoveryScreen" component={RecoveryScreen} />
        </>
      )}
    </Stack.Navigator>
  );
};

export default AuthStack;