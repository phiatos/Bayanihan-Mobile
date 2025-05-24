import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import OnboardingScreen from '../screens/OnboardingScreen';
import LoginScreen from '../screens/LoginScreen';
import RecoveryScreen from '../screens/RecoveryScreen';

const Stack = createNativeStackNavigator();

const AuthStack = ({ onLogin }) => {
  return (
    <Stack.Navigator
      initialRouteName="Login"
      screenOptions={{ headerShown: false }}
    >
      <Stack.Screen name="Onboarding" component={OnboardingScreen} />
      <Stack.Screen name="Login">
        {(props) => <LoginScreen {...props} onLogin={onLogin} />}
      </Stack.Screen>
      <Stack.Screen name="RecoveryScreen" component={RecoveryScreen} />
    </Stack.Navigator>
  );
};

export default AuthStack;