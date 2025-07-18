import React, { useContext, useEffect } from 'react';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { signOut } from 'firebase/auth';
import { Alert, Platform } from 'react-native';
import { auth } from '../configuration/firebaseConfig';
import HomeScreen from '../screens/HomeScreen';
import ProfileScreen from '../screens/ProfileScreen';
import ReliefRequestScreen from '../screens/ReliefRequestScreen';
import ReliefSummary from '../screens/ReliefSummary';
import ReportSubmissionScreen from '../screens/ReportSubmissionScreen';
import ReportSummary from '../screens/ReportSummary';
import Theme from '../constants/theme';
import RDANAScreen from '../screens/RDANAScreen';
import RDANASummary from '../screens/RDANASummary';
import DashboardScreen from '../screens/Dashboard';
import CallForDonationsSummary from '../screens/CallForDonationsSummary';
import CallforDonations from '../screens/CallforDonations';
import CommunityBoard from '../screens/CommunityBoard';
import { AuthContext } from '../context/AuthContext';
import CustomDrawer from '../components/CustomDrawer';
import CreatePost from '../screens/Create Post';

const Drawer = createDrawerNavigator();
const Stack = createNativeStackNavigator();

// RDANA Stack
const RDANAStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="RDANAScreen" component={RDANAScreen} />
    <Stack.Screen name="RDANASummary" component={RDANASummary} />
  </Stack.Navigator>
);

// Call for Donations Stack
const CallforDonationsStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="CallforDonations" component={CallforDonations} />
    <Stack.Screen name="CallForDonationsSummary" component={CallForDonationsSummary} />
  </Stack.Navigator>
);

// Relief Request Stack
const RequestStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="ReliefRequest" component={ReliefRequestScreen} />
    <Stack.Screen name="ReliefSummary" component={ReliefSummary} />
  </Stack.Navigator>
);

// Report Submission Stack
const ReportStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="ReportSubmission" component={ReportSubmissionScreen} />
    <Stack.Screen name="ReportSummary" component={ReportSummary} />
  </Stack.Navigator>
);

// Community Board Stack 
const CommunityBoardStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="CommunityBoard" component={CommunityBoard} />
    <Stack.Screen name="CreatePost" component={CreatePost} />
  </Stack.Navigator>
);

const AppStack = () => {
  const { setUser } = useContext(AuthContext);

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      setUser(null);
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  const resetInactivityTimer = (navigation) => {
    let timeout;
    const INACTIVITY_TIME = 1000 * 60 * 60 * 24; // 24 hours
    const checkInactivity = () => {
      Alert.alert(
        'Are you still there?',
        "You've been inactive for a while. Do you want to continue?",
        [
          {
            text: 'Stay Logged In',
            onPress: () => resetInactivityTimer(navigation),
          },
          {
            text: 'Log Out',
            onPress: async () => {
              try {
                await signOut(auth);
                setUser(null);
                navigation.navigate('Login');
              } catch (error) {
                console.error(`[${new Date().toISOString()}] Error signing out:`, error);
              }
            },
          },
        ],
        { cancelable: false }
      );
    };

    if (Platform.OS !== 'web') {
      clearTimeout(timeout);
      timeout = setTimeout(checkInactivity, INACTIVITY_TIME);
    }

    return () => clearTimeout(timeout);
  };

  useEffect(() => {
    return resetInactivityTimer({ navigate: () => {} }); // Initial call, placeholder navigation
  }, []);

  return (
    <Drawer.Navigator
      drawerContent={(props) => <CustomDrawer {...props} onSignOut={handleSignOut} />}
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
      initialRouteName="Home"
    >
      <Drawer.Screen
        name="Home"
        component={HomeScreen}
        options={{
          drawerIcon: ({ color }) => (
            <Ionicons name="home" size={22} color={color} />
          ),
        }}
      />
      <Drawer.Screen
        name="Volunteer Dashboard"
        component={DashboardScreen}
        options={{
          drawerIcon: ({ color }) => (
            <Ionicons name="people" size={22} color={color} />
          ),
        }}
      />
      <Drawer.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          drawerIcon: ({ color }) => (
            <Ionicons name="person" size={22} color={color} />
          ),
        }}
      />
      <Drawer.Screen
        name="Community Board"
        component={CommunityBoardStack}
        options={{
          drawerIcon: ({ color }) => (
            <Ionicons name="newspaper" size={22} color={color} />
          ),
        }}
      />
      <Drawer.Screen
        name="RDANA"
        component={RDANAStack}
        options={{
          drawerIcon: ({ color }) => (
            <Ionicons name="clipboard" size={22} color={color} />
          ),
        }}
      />
      <Drawer.Screen
        name="Relief Request"
        component={RequestStack}
        options={{
          drawerIcon: ({ color }) => (
            <Ionicons name="cube" size={22} color={color} />
          ),
        }}
      />
      <Drawer.Screen
        name="Call for Donations"
        component={CallforDonationsStack}
        options={{
          drawerIcon: ({ color }) => (
            <Ionicons name="call" size={22} color={color} />
          ),
        }}
      />
      <Drawer.Screen
        name="Reports Submission"
        component={ReportStack}
        options={{
          drawerIcon: ({ color }) => (
            <Ionicons name="document" size={22} color={color} />
          ),
        }}
      />
    </Drawer.Navigator>
  );
};

export default AppStack;