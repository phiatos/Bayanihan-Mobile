import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';
import 'firebase/compat/database';
import React, { useEffect, useState } from 'react';
import { Alert, ScrollView, Text, TouchableOpacity, View, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';

import styles from '../styles/DashboardStyles';
import GlobalStyles from '../styles/GlobalStyles';
import Theme from '../constants/theme';
import { BlurView } from 'expo-blur';

if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

const auth = firebase.auth();
const database = firebase.database();

const DashboardScreen = ({ navigation }) => {
  const [metrics, setMetrics] = useState([
    { label: 'No. of Food Packs', value: '0', icon: 'food-variant' },
    { label: 'No. of Hot Meals', value: '0', icon: 'silverware-fork-knife' },
    { label: 'Liters of Water', value: '0', icon: 'water' },
    { label: 'Volunteers Mobilized', value: '0', icon: 'account-group' },
    { label: 'Total Amount Raised', value: '₱0', icon: 'cash' },
    { label: 'In-Kind Donations', value: '₱0', icon: 'gift' },
  ]);
  const [headerTitle, setHeaderTitle] = useState('Dashboard');
  const [organizationName, setOrganizationName] = useState('');

  useEffect(() => {
    StatusBar.setBarStyle('dark-content');

    // Cleanup: Reset to default style when component unmounts (optional, depending on app needs)
    return () => {
      StatusBar.setBarStyle('light-content');
    };
  }, []);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(user => {
      if (!user) {
        ToastAndroid.show('Please sign in to access the dashboard.', ToastAndroid.BOTTOM);
        return;
      }
      const userId = user.uid;

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
        const orgName = userData.organization || '';

        setOrganizationName(orgName);
        setHeaderTitle(role === "AB ADMIN" ? "Admin Dashboard" : "Volunteer Dashboard");

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
              label: 'Monetary Donations',
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

  return (
    <LinearGradient
             colors={['rgba(250, 59, 154, 0.43)', '#FFF9F0']}
             start={{ x: 0.5, y: 1 }} 
             end={{ x: 0.5, y: 0 }}   
             style={styles.gradientContainer}
           >
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={GlobalStyles.newheaderContainer}>
        <View style={styles.headerContent}>
          <TouchableOpacity
            onPress={() => navigation.openDrawer()}
            style={styles.headerMenuIcon}
          >
            <Ionicons name="menu" size={32} color={Theme.colors.primary} />
          </TouchableOpacity>
          <Text style={[GlobalStyles.headerTitle, { color: Theme.colors.primary }]}>{headerTitle}</Text>
        </View>
      </View>

        {/* Main Content */}
        <ScrollView style={styles.scrollViewContent}>
          {organizationName ? (
            <Text style={styles.sectionTitle}>{organizationName}</Text>
          ) : (
            <View style={styles.noSectionTitle} /> 
          )}

          {metrics.map(({ label, value, icon }, idx) => (
            <BlurView blurAmount={20} tint="light" style={styles.metricGradientCard } >
             <LinearGradient
                colors= {['rgba(251, 255, 255, 0.04)', 'rgba(192, 249, 254, 0.05)']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                useAngle
                angle={110}
                style={styles.formCard} >
            <View key={idx} style={styles.metricCard}>
              <View style={styles.iconContainer}>
                <MaterialCommunityIcons name={icon} size={28} color="#4A90E2" />
              </View>
              <View style={styles.metricInfo}>
                <Text style={styles.metricLabel}>
                  {label}
                </Text>
                <Text style={[styles.metricValue, { fontFamily: 'Poppins-Bold' }]}>
                  {value}
                </Text>
              </View>
               </View>
              </LinearGradient> 
              </BlurView>
          ))}
        </ScrollView>
     </SafeAreaView>
      </LinearGradient>
  );
};

export default DashboardScreen;