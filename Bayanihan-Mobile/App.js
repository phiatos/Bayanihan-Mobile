import { GestureHandlerRootView } from 'react-native-gesture-handler'; 
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import React from "react";
import { View, StyleSheet } from "react-native";
import LaunchScreen from "./components/LaunchScreen";
import RecoveryScreen from "./components/RecoveryScreen";
import LoginScreen from "./components/LoginScreen";
import ReportSubmission from "./components/Reports/ReportSubmission";
import ReportSummary from "./components/Reports/ReportSummary";
import { SidebarProvider, useSidebar } from "./components/Sidebar/SidebarContext";
import Sidebar from "./components/Sidebar/Sidebar";
import { TouchableWithoutFeedback } from "react-native-gesture-handler";
import ReliefRequest from './components/Reliefs/ReliefRequest';
import Profile from './components/Profile';
import ReliefSummary from './components/Reliefs/ReliefSummary';
import { useFonts } from 'expo-font';



const TStack = createNativeStackNavigator();

const AppLayout = () => {
  const { showSidebar, closeSidebar } = useSidebar();

  // fonts
    const [fontsLoaded] = useFonts({
    Poppins_Regular: require('./assets/fonts/Poppins/Poppins-Regular.ttf'),  
    Poppins_SemiBold: require('./assets/fonts/Poppins/Poppins-SemiBold.ttf'),
    Poppins_Bold: require('./assets/fonts/Poppins/Poppins-Bold.ttf'),
    Poppins_Medium: require('./assets/fonts/Poppins/Poppins-Medium.ttf'),

  });
    if (!fontsLoaded) return null; 


  return (
    <View style={styles.container}>
      {showSidebar && (
        <>
          <TouchableWithoutFeedback onPress={closeSidebar}>
            <View style={styles.overlay} />
          </TouchableWithoutFeedback>

          <Sidebar />
        </>
      )}
      
      <View style={styles.content}>
        <TStack.Navigator
          initialRouteName="LaunchScreen"
          screenOptions={{ headerShown: false }}
        >
          <TStack.Screen name="RecoveryScreen" component={RecoveryScreen} />
          <TStack.Screen name="LoginScreen" component={LoginScreen} />
          <TStack.Screen name="LaunchScreen" component={LaunchScreen} />
          <TStack.Screen name="ReportSubmission" component={ReportSubmission} />
          <TStack.Screen name="ReportSummary" component={ReportSummary} />
          <TStack.Screen name="ReliefRequest" component={ReliefRequest} />
          <TStack.Screen name="ReliefSummary" component={ReliefSummary} />
         <TStack.Screen name="Profile" component={Profile} />

        </TStack.Navigator>
      </View>
    </View>
  );
};

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <NavigationContainer>
        <SidebarProvider>
          <AppLayout />
        </SidebarProvider>
      </NavigationContainer>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: "row",
  },
  content: {
    flex: 1,
  },
overlay: {
  position: "absolute",
  top: 0,
  bottom: 0,
  left: 0,
  right: 0,
  backgroundColor: "transparent",
  zIndex: 90, // lower than Sidebar's 100
},
});
