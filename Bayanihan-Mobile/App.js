import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import React, { useContext, useEffect, useState } from "react";
import LaunchScreen from "./components/LaunchScreen";
import RecoveryScreen from "./components/RecoveryScreen";
import LoginScreen from "./components/LoginScreen";



export default function App() {
 
    const TStack = createNativeStackNavigator();

  return (
  <NavigationContainer>
    <TStack.Navigator initialRouteName="LoginScreen">
      <TStack.Screen name ='RecoveryScreen' component={RecoveryScreen}/>
      
    </TStack.Navigator>
  </NavigationContainer>
  );
  
}

