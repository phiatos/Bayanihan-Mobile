// src/navigation/AppStack.js
import React from 'react';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import HomeScreen from '../screens/HomeScreen';
import ProfileScreen from '../screens/ProfileScreen';
import ReliefRequestScreen from '../screens/ReliefRequestScreen';
import ReliefSummary from '../screens/ReliefSummary';
import ReportSubmissionScreen from '../screens/ReportSubmissionScreen';
import ReportSummary from '../screens/ReportSummary'; 
import CustomDrawer from '../components/CustomDrawer';
import Ionicons from '@expo/vector-icons/Ionicons';
import Theme from '../contants/theme';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import RDANAScreen from '../screens/RDANAScreen';

const Drawer = createDrawerNavigator();
const Stack = createNativeStackNavigator();

const RequestStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="ReliefRequest" component={ReliefRequestScreen} />
    <Stack.Screen name="ReliefSummary" component={ReliefSummary} />
  </Stack.Navigator>
);

const ReportStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="ReportSubmission" component={ReportSubmissionScreen} />
    <Stack.Screen name="ReportSummary" component={ReportSummary} />
  </Stack.Navigator>
);

const AppStack = ({ onSignOut }) => {
  return (
    <Drawer.Navigator
      drawerContent={(props) => <CustomDrawer {...props} onSignOut={onSignOut} />}
      screenOptions={{
        headerShown: false,
        drawerActiveBackgroundColor: 'white',
        drawerActiveTintColor: Theme.colors.accent,
        drawerInactiveTintColor: 'white',
        drawerLabelStyle: {
          marginLeft: 15,
          fontFamily: 'Poppins_Medium',
          fontSize: 13,
        },
        drawerStyle: {
          width: 270,
        },
      }}
    >
      <Drawer.Screen
        name="Home"
        component={HomeScreen}
        options={{
          drawerIcon: ({ color }) => (
            <Ionicons name="home-outline" size={22} color={color} />
          ),
        }}
      />
      <Drawer.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          drawerIcon: ({ color }) => (
            <Ionicons name="person-outline" size={22} color={color} />
          ),
        }}
      />
      <Drawer.Screen
        name="Relief Request"
        component={RequestStack}
        options={{
          drawerIcon: ({ color }) => (
            <Ionicons name="cube-outline" size={22} color={color} />
          ),
        }}
      />
      <Drawer.Screen
        name="Reports Submission"
        component={ReportStack}
        options={{
          drawerIcon: ({ color }) => (
            <Ionicons name="document-outline" size={22} color={color} />
          ),
        }}
      />
      <Drawer.Screen
        name="RDANA"
        component={RDANAScreen}
        options={{
          drawerIcon: ({ color }) => (
            <Ionicons name="clipboard-outline" size={22} color={color} />
          ),
        }}
      />
    </Drawer.Navigator>
  );
};

export default AppStack;