import React, { useState, useEffect, useRef } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { Animated, Easing } from 'react-native';
import AuthStack from './src/navigation/AuthStack';
import AppStack from './src/navigation/AppStack';

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const fadeAnim = useRef(new Animated.Value(1)).current; // Animation value for opacity

  useEffect(() => {
    // Trigger animation when isLoggedIn changes
    fadeAnim.setValue(0); // Start with 0 opacity
    Animated.timing(fadeAnim, {
      toValue: 1, // Fade in to full opacity
      duration: 300, // Animation duration in ms
      easing: Easing.out(Easing.ease), // Smooth easing function
      useNativeDriver: true, // Use native driver for better performance
    }).start();
  }, [isLoggedIn]);

  const handleSignOut = () => {
    // Animate fade-out before changing state
    Animated.timing(fadeAnim, {
      toValue: 0, // Fade out
      duration: 300,
      easing: Easing.in(Easing.ease),
      useNativeDriver: true,
    }).start(() => {
      setIsLoggedIn(false); // Update state after animation completes
    });
  };

  return (
    <NavigationContainer>
      <Animated.View style={{ flex: 1, opacity: fadeAnim }}>
        {isLoggedIn ? (
          <AppStack onSignOut={handleSignOut} />
        ) : (
          <AuthStack onLogin={() => setIsLoggedIn(true)} />
        )}
      </Animated.View>
    </NavigationContainer>
  );
}

export default App;