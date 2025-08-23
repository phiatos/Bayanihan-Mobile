import React, { useContext, useEffect } from 'react';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { signOut } from 'firebase/auth';
import { Alert, Platform } from 'react-native';
import { auth, database } from '../configuration/firebaseConfig';
import { ref as databaseRef, get, query, orderByChild, equalTo } from 'firebase/database';
import AsyncStorage from '@react-native-async-storage/async-storage';
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
import CreatePost from '../screens/CreatePost';
import TransactionScreen from '../screens/TransactionScreen';
import TransactionDetailsScreen from '../screens/TransactionDetailsScreen';

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

// Transaction Stack
const TransactionStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="TransactionScreen" component={TransactionScreen} />
    <Stack.Screen name="TransactionDetailsScreen" component={TransactionDetailsScreen} />
  </Stack.Navigator>
);

const AppStack = () => {
  const { setUser } = useContext(AuthContext);

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      setUser(null);
    } catch (error) {
      console.error(`[${new Date().toISOString()}] Sign out error:`, error);
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
                navigation.replace('Login'); // Use replace to prevent back navigation
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

  // Navigation interceptor for active operation check
  const checkActiveOperation = async (navigation, targetScreen) => {
    try {
      const user = auth.currentUser;
      if (!user) {
        console.warn('No user is logged in');
        Alert.alert('Error', 'User not authenticated. Please log in.', [
          { text: 'OK', onPress: () => navigation.replace('Login') },
        ], { cancelable: false });
        return false;
      }

      console.log('Logged-in user UID:', user.uid);
      const userRef = databaseRef(database, `users/${user.uid}`);
      const userSnapshot = await get(userRef);
      const userData = userSnapshot.val();

      if (!userData) {
        console.error('User data not found for UID:', user.uid);
        Alert.alert('Error', 'Your user profile is incomplete. Please contact support.', [
          { text: 'OK', onPress: () => navigation.replace('Volunteer Dashboard') },
        ], { cancelable: false });
        return false;
      }

      // Check for password reset requirement
      if (userData.password_needs_reset) {
        Alert.alert('Error', 'For security reasons, please change your password.', [
          { text: 'OK', onPress: () => navigation.replace('Profile') },
        ], { cancelable: false });
        return false;
      }

      const userRole = userData.role;
      const orgName = userData.organization || '[Unknown Organization]';
      await AsyncStorage.setItem('organizationName', orgName);
      console.log('User Role:', userRole, 'Organization:', orgName);

      // Define screens that require active operation check
      const restrictedScreens = [
        'RDANA',
        'Relief Request',
        'Call for Donations',
        'Reports Submission',
      ];

      // Allow navigation to non-restricted screens or for AB ADMIN
      if (!restrictedScreens.includes(targetScreen) || userRole === 'AB ADMIN') {
        console.log(`Navigation to ${targetScreen} allowed. Role: ${userRole}`);
        return true;
      }

      // For ABVN, check active operations
      if (userRole === 'ABVN') {
        if (orgName === '[Unknown Organization]') {
          console.warn('ABVN user has no organization assigned.');
          Alert.alert('Error', 'Your account is not associated with an organization.', [
            { text: 'OK', onPress: () => navigation.replace('Volunteer Dashboard') },
          ], { cancelable: false });
          return false;
        }

        const activationsRef = query(
          databaseRef(database, 'activations'),
          orderByChild('organization'),
          equalTo(orgName)
        );
        const activationsSnapshot = await get(activationsRef);
        let hasActiveActivations = false;
        activationsSnapshot.forEach((childSnapshot) => {
          if (childSnapshot.val().status === 'active') {
            hasActiveActivations = true;
            return true; // Exit loop
          }
        });

        if (hasActiveActivations) {
          console.log(`Organization "${orgName}" has active operations. Navigation to ${targetScreen} allowed.`);
          return true;
        } else {
          console.warn(`Organization "${orgName}" has no active operations. Navigation to ${targetScreen} blocked.`);
          Alert.alert('Error', 'Your organization has no active operations. You cannot access this feature at this time.', [
            { text: 'OK', onPress: () => navigation.replace('Volunteer Dashboard') },
          ], { cancelable: false });
          return false;
        }
      }

      console.warn(`Unsupported role: ${userRole}. Navigation to ${targetScreen} blocked.`);
      Alert.alert('Error', 'Your role does not permit access to this feature.', [
        { text: 'OK', onPress: () => navigation.replace('Volunteer Dashboard') },
      ], { cancelable: false });
      return false;
    } catch (error) {
      console.error(`[${new Date().toISOString()}] Error in checkActiveOperation:`, error.message);
      Alert.alert('Error', 'Failed to verify permissions: ' + error.message, [
        { text: 'OK', onPress: () => navigation.replace('Volunteer Dashboard') },
      ], { cancelable: false });
      return false;
    }
  };

  useEffect(() => {
    // Set up inactivity timer
    return resetInactivityTimer({ navigate: () => {} });
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
      initialRouteName="Volunteer Dashboard"
      useLegacyImplementation={false}
      screenListeners={{
        beforeRemove: ({ data: { action }, preventDefault, target }) => {
          // Handle navigation actions (e.g., drawer selection)
          if (action.type === 'NAVIGATE') {
            const targetScreen = action.payload.name;

            // Perform active operation check asynchronously
            checkActiveOperation(({ navigate }) => navigate(targetScreen), targetScreen).then((canNavigate) => {
              if (!canNavigate) {
                preventDefault(); // Prevent navigation to the target screen
              }
            });

            // Prevent navigation immediately to allow async check to complete
            preventDefault();
          }
        },
      }}
    >
      <Drawer.Screen
        name="Disaster Map"
        component={HomeScreen}
        options={{
          drawerIcon: ({ color }) => (
            <Ionicons name="map" size={22} color={color} />
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
        name="Call for Donations"
        component={CallforDonationsStack}
        options={{
          drawerIcon: ({ color }) => (
            <Ionicons name="call" size={22} color={color} />
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
        name="Reports Submission"
        component={ReportStack}
        options={{
          drawerIcon: ({ color }) => (
            <Ionicons name="document" size={22} color={color} />
          ),
        }}
      />
      <Drawer.Screen
        name="Transactions History"
        component={TransactionStack}
        options={{
          drawerIcon: ({ color }) => (
            <Ionicons name="file-tray-stacked" size={22} color={color} />
          ),
        }}
      />
    </Drawer.Navigator>
  );
};

export default AppStack;