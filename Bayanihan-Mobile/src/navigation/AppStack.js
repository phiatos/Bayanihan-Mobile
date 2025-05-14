import React from 'react';
import { createDrawerNavigator } from '@react-navigation/drawer';
import HomeScreen from '../screens/HomeScreen';
import ProfileScreen from '../screens/ProfileScreen';
import ReliefRequestScreen from '../screens/ReliefRequestScreen';
import ReportSubmissionScreen from '../screens/ReportSubmissionScreen';
import CustomDrawer from '../components/CustomDrawer';
import Ionicons from 'react-native-vector-icons/Ionicons';

const Drawer = createDrawerNavigator();

const AppStack = ({ onSignOut }) => {
  return (
    <Drawer.Navigator
      drawerContent={(props) => <CustomDrawer {...props} onSignOut={onSignOut} />}
      screenOptions={{
        headerShown: false,
        drawerActiveBackgroundColor: '#14AEBB',
        drawerActiveTintColor: '#fff',
        drawerInactiveTintColor: '#333',
        drawerLabelStyle: {
          marginLeft: 25,
          fontFamily: 'Poppins-Medium',
          fontSize: 15,
        },
      }}
    >
      <Drawer.Screen
        name='Home'
        component={HomeScreen}
        options={{
          drawerIcon: ({ color }) => (
            <Ionicons name='home-outline' size={22} color={color} />
          ),
        }}
      />
      <Drawer.Screen
        name='Profile'
        component={ProfileScreen}
        options={{
          drawerIcon: ({ color }) => (
            <Ionicons name='person-outline' size={22} color={color} />
          ),
        }}
      />
      <Drawer.Screen
        name='Relief Request'
        component={ReliefRequestScreen}
        options={{
          drawerIcon: ({ color }) => (
            <Ionicons name='cube-outline' size={22} color={color} />
          ),
        }}
      />
      <Drawer.Screen
        name='Reports Submission'
        component={ReportSubmissionScreen}
        options={{
          drawerIcon: ({ color }) => (
            <Ionicons name='document-outline' size={22} color={color} />
          ),
        }}
      />
    </Drawer.Navigator>
  );
};

export default AppStack;