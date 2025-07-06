import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as Font from 'expo-font';
import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';
import 'firebase/compat/database';
import React, { useEffect, useState } from 'react';
import { Alert, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import styles from '../styles/DashboardStyles';
import GlobalStyles from '../styles/GlobalStyles';
import Theme from '../constants/theme';


if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

const auth = firebase.auth();
const database = firebase.database();

const DashboardScreen = ({ navigation }) => {
  const [fontsLoaded, setFontsLoaded] = useState(false);
  const [metrics, setMetrics] = useState([
    { label: 'No. of Food Packs', value: '0', icon: 'food-variant' },
    { label: 'No. of Hot Meals', value: '0', icon: 'silverware-fork-knife' },
    { label: 'Liters of Water', value: '0', icon: 'water' },
    { label: 'Volunteers Mobilized', value: '0', icon: 'account-group' },
    { label: 'Total Amount Raised', value: '₱0', icon: 'cash' },
    { label: 'In-Kind Donations', value: '₱0', icon: 'gift' },
  ]);
  const [headerTitle, setHeaderTitle] = useState('Dashboard');
  const [organizationName, setOrganizationName] = useState(''); // New state for organization name

  useEffect(() => {
    (async () => {
      try {
        await Font.loadAsync({
          'Poppins-MediumItalic': require('../../assets/fonts/Poppins/Poppins-MediumItalic.ttf'),
          'Poppins-Bold': require('../../assets/fonts/Poppins/Poppins-Bold.ttf'),
          'Poppins-Medium': require('../../assets/fonts/Poppins/Poppins-Medium.ttf'),
          'Poppins_SemiBold': require('../../assets/fonts/Poppins/Poppins-SemiBold.ttf'),
          'Poppins_Regular': require('../../assets/fonts/Poppins/Poppins-Regular.ttf'),
        });
        setFontsLoaded(true);
      } catch (error) {
        console.error('Font loading error:', error);
        ToastAndroid.show('Failed to load fonts. Please restart the app.',ToastAndroid.BOTTOM);
      }
    })();
  }, []);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(user => {
      if (!user) {
        ToastAndroid.show('Please sign in to access the dashboard.',ToastAndroid.BOTTOM);
        return;
      }
      const userId = user.uid;

      // Fetch user data (role and organization name)
      database.ref(`users/${userId}`).once('value', snapshot => {
        const userData = snapshot.val();
        if (!userData || !userData.role) {
          Alert.alert(
            "User Data Missing",
            "User role not found. Please contact an administrator.",
            [{ text: "OK", onPress: () => navigation.navigate('Login') }]
          );
          return;
        }

        const role = userData.role;
        const orgName = userData.organization|| ''; // Fetch organization name

        setOrganizationName(orgName); // Set organization name
        setHeaderTitle(role === "AB ADMIN" ? "Admin Dashboard" : "Volunteer Dashboard");

        // Fetch approved reports and aggregate data
        database.ref("reports/approved").on('value', snapshot => {
          let totalFoodPacks = 0;
          let totalHotMeals = 0;
          let totalWaterLiters = 0;
          let totalVolunteers = 0;
          let totalMonetaryDonations = 0;
          let totalInKindDonations = 0;

          const reports = snapshot.val();
          if (reports) {
            Object.values(reports).forEach(report => {
              if (role === "ABVN" && report.userUid !== userId) {
                console.log(`Skipping report for ABVN - userUid (${report.userUid}) does not match current user (${userId})`);
                return;
              }

              totalFoodPacks += parseFloat(report.NoOfFoodPacks || 0);
              totalHotMeals += parseFloat(report.NoOfHotMeals || 0);
              totalWaterLiters += parseFloat(report.LitersOfWater || 0);
              totalVolunteers += parseFloat(report.NoOfVolunteersMobilized || 0);
              totalMonetaryDonations += parseFloat(report.TotalMonetaryDonations || 0);
              totalInKindDonations += parseFloat(report.TotalValueOfInKindDonations || 0);
            });

            console.log(`Totals for ${role} (UID: ${userId}) - Food Packs: ${totalFoodPacks}, Hot Meals: ${totalHotMeals}, Water Liters: ${totalWaterLiters}, Volunteers: ${totalVolunteers}, Monetary Donations: ${totalMonetaryDonations}, In-Kind Donations: ${totalInKindDonations}`);
          } else {
            console.log("No approved reports found for this user.");
          }

          setMetrics([
            { label: 'No. of Food Packs', value: totalFoodPacks.toLocaleString(), icon: 'food-variant' },
            { label: 'No. of Hot Meals', value: totalHotMeals.toLocaleString(), icon: 'silverware-fork-knife' },
            { label: 'Liters of Water', value: totalWaterLiters.toLocaleString(), icon: 'water' },
            { label: 'Volunteers Mobilized', value: totalVolunteers.toLocaleString(), icon: 'account-group' },
            {
              label: 'Total Amount Raised',
              value: `₱${totalMonetaryDonations.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
              icon: 'cash',
            },
            {
              label: 'In-Kind Donations',
              value: `₱${totalInKindDonations.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
              icon: 'gift',
            },
          ]);
        }, error => {
          console.error("Error fetching approved reports:", error);
          Alert.alert("Error", "Failed to load dashboard data. Please try again later.");
          setMetrics([
            { label: 'No. of Food Packs', value: '0', icon: 'food-variant' },
            { label: 'No. of Hot Meals', value: '0', icon: 'silverware-fork-knife' },
            { label: 'Liters of Water', value: '0', icon: 'water' },
            { label: 'Volunteers Mobilized', value: '0', icon: 'account-group' },
            { label: 'Total Amount Raised', value: '₱0.00 (Error)', icon: 'cash' },
            { label: 'In-Kind Donations', value: '₱0.00 (Error)', icon: 'gift' },
          ]);
        });
      }, error => {
        console.error("Error fetching user data:", error);
        Alert.alert("Error", "Failed to load user data. Please try again later.");
      });
    });

    return () => {
      unsubscribe();
      database.ref("reports/approved").off();
    };
  }, [navigation]);

  if (!fontsLoaded) {
    return null;
  }

  return (
    <View style={GlobalStyles.container}>
      <View style={styles.headerContainer}>
         <View style={styles.headerContent}>
        <TouchableOpacity
          onPress={() => navigation.openDrawer()}
          style={styles.headerMenuIcon}
        >
          <Ionicons name="menu" size={32} color={Theme.colors.primary} />
        </TouchableOpacity>
        <Text style={[GlobalStyles.headerTitle, {color:Theme.colors.primary}]}>{headerTitle}</Text>
        </View>
      </View>

      <SafeAreaView style={{ flex: 1 }} edges={['left', 'right', 'bottom']}>
        <ScrollView style={styles.scrollViewContent}>
          <Text style={[styles.sectionTitle, { fontFamily: 'Poppins-Bold' }]}>
            {organizationName}
          </Text>

          {metrics.map(({ label, value, icon }, idx) => (
            <View key={idx} style={styles.metricCard}>
              <View style={styles.iconContainer}>
                <MaterialCommunityIcons name={icon} size={28} color="#4A90E2" />
              </View>
              <View style={styles.metricInfo}>
                <Text style={[styles.metricLabel, { fontFamily: 'Poppins-MediumItalic' }]}>
                  {label}
                </Text>
                <Text style={[styles.metricValue, { fontFamily: 'Poppins-Bold' }]}>
                  {value}
                </Text>
              </View>
            </View>
          ))}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
};

export default DashboardScreen;