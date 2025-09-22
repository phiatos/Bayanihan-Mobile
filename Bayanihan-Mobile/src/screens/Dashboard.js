import { Ionicons, MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import React, { useEffect, useState, useRef } from 'react';
import { ScrollView, Text, TouchableOpacity, View, StatusBar, Animated, Easing, ToastAndroid, Modal, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { auth, database } from '../configuration/firebaseConfig';
import { onValue, ref } from 'firebase/database';
import { useAuth } from '../context/AuthContext'; 
import styles from '../styles/DashboardStyles';
import GlobalStyles from '../styles/GlobalStyles';
import Theme from '../constants/theme';

const DashboardScreen = ({ navigation }) => {
  const { user } = useAuth(); 
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
  const [modalVisible, setModalVisible] = useState(false);
  const [hasShownModal, setHasShownModal] = useState(false);
  const [permissionStatus, setPermissionStatus] = useState(null);
  const [location, setLocation] = useState(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.85)).current;
  const slideAnim = useRef(new Animated.Value(Dimensions.get('window').height)).current;

  const startAnimation = () => {
    fadeAnim.setValue(0);
    scaleAnim.setValue(0.85);
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 700,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 700,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
    ]).start();
  };

  useEffect(() => {
    StatusBar.setBarStyle('dark-content');
    return () => {
      StatusBar.setBarStyle('light-content');
    };
  }, []);

  useEffect(() => {
    const checkModalStatus = async () => {
      try {
        const hasShown = await AsyncStorage.getItem('hasShownLocationModal');
        if (hasShown !== 'true' && !hasShownModal && !permissionStatus) {
          setModalVisible(true);
          setHasShownModal(true);
        }
      } catch (error) {
        console.error('Error checking modal status:', error);
      }
    };
    checkModalStatus();
  }, [hasShownModal, permissionStatus]);

  useEffect(() => {
    Animated.timing(slideAnim, {
      toValue: modalVisible ? 0 : Dimensions.get('window').height,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [modalVisible]);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      startAnimation();
    });
    return unsubscribe;
  }, [navigation]);

  useEffect(() => {
    if (!user) {
      ToastAndroid.show('Please sign in to access the dashboard.', ToastAndroid.BOTTOM);
      navigation.navigate('Login');
      return;
    }

    const userId = user.id;
    const role = user.role;
    const orgName = user.organization || '';

    setOrganizationName(orgName);
    setHeaderTitle(role === 'AB ADMIN' ? 'Admin Dashboard' : 'Volunteer Dashboard');

    const reportsRef = ref(database, 'reports/approved');
    const unsubscribeReports = onValue(
      reportsRef,
      (snapshot) => {
        let totalFoodPacks = 0;
        let totalHotMeals = 0;
        let totalWaterLiters = 0;
        let totalVolunteers = 0;
        let totalMonetaryDonations = 0;
        let totalInKindDonations = 0;

        const reports = snapshot.val();
        if (reports) {
          Object.values(reports).forEach((report) => {
            if (role === 'ABVN' && report.userUid !== userId) {
              return;
            }

            totalFoodPacks += parseFloat(report.NoOfFoodPacks || 0);
            totalHotMeals += parseFloat(report.NoOfHotMeals || 0);
            totalWaterLiters += parseFloat(report.LitersOfWater || 0);
            totalVolunteers += parseFloat(report.NoOfVolunteersMobilized || 0);
            totalMonetaryDonations += parseFloat(report.TotalMonetaryDonations || 0);
            totalInKindDonations += parseFloat(report.TotalValueOfInKindDonations || 0);
          });
        } else {
          return;
        }

        setMetrics([
          { label: 'No. of Food Packs', value: totalFoodPacks.toLocaleString(), icon: 'food-variant' },
          { label: 'No. of Hot Meals', value: totalHotMeals.toLocaleString(), icon: 'silverware-fork-knife' },
          { label: 'Liters of Water', value: totalWaterLiters.toLocaleString(), icon: 'water' },
          { label: 'Volunteers Mobilized', value: totalVolunteers.toLocaleString(), icon: 'account-group' },
          {
            label: 'Monetary Donations',
            value: `₱${totalMonetaryDonations.toLocaleString(undefined, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}`,
            icon: 'cash',
          },
          {
            label: 'In-Kind Donations',
            value: `₱${totalInKindDonations.toLocaleString(undefined, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}`,
            icon: 'gift',
          },
        ]);
      },
      (error) => {
        ToastAndroid.show('Failed to load dashboard data. Please try again later.', ToastAndroid.BOTTOM);
        setMetrics([
          { label: 'No. of Food Packs', value: '0', icon: 'food-variant' },
          { label: 'No. of Hot Meals', value: '0', icon: 'silverware-fork-knife' },
          { label: 'Liters of Water', value: '0', icon: 'water' },
          { label: 'Volunteers Mobilized', value: '0', icon: 'account-group' },
          { label: 'Total Amount Raised', value: '₱0.00 (Error)', icon: 'cash' },
          { label: 'In-Kind Donations', value: '₱0.00 (Error)', icon: 'gift' },
        ]);
      }
    );

    return () => {
      unsubscribeReports();
    };
  }, [user, navigation]);

  const handleRequestPermission = async () => {
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      setPermissionStatus(status);
      if (status === 'granted') {
        let loc = await Location.getCurrentPositionAsync({});
        if (loc.coords.accuracy > 50) {
          ToastAndroid.show('Your location accuracy is low. The pin may not be precise.', ToastAndroid.BOTTOM);
        }
        setLocation({
          latitude: loc.coords.latitude,
          longitude: loc.coords.longitude,
        });
        setModalVisible(false);
        await AsyncStorage.setItem('hasShownLocationModal', 'true');
      } else {
        setPermissionStatus('denied');
        setModalVisible(false);
        await AsyncStorage.setItem('hasShownLocationModal', 'true');
      }
    } catch (error) {
      console.error('Permission error:', error);
      ToastAndroid.show('Failed to request location permission. Please try again.', ToastAndroid.SHORT);
    }
  };

  const closeModal = () => {
    setPermissionStatus('denied');
    setModalVisible(false);
    AsyncStorage.setItem('hasShownLocationModal', 'true');
  };

  return (
    <LinearGradient
      colors={['rgba(250, 59, 154, 0.43)', '#FFF9F0']}
      start={{ x: 0.5, y: 1 }}
      end={{ x: 0.5, y: 0 }}
      style={styles.gradientContainer}
    >
      <SafeAreaView style={styles.container}>
        <View style={GlobalStyles.newheaderContainer}>
          <TouchableOpacity onPress={() => navigation.openDrawer()} style={styles.headerMenuIcon}>
            <Ionicons name="menu" size={32} color={Theme.colors.primary} />
          </TouchableOpacity>
          <Text style={[GlobalStyles.headerTitle, { color: Theme.colors.primary }]}>{headerTitle}</Text>
        </View>

        <ScrollView style={styles.scrollViewContent}>
          {organizationName ? (
            <Text style={styles.sectionTitle}>{organizationName}</Text>
          ) : (
            <View style={styles.noSectionTitle} />
          )}

          {metrics.map(({ label, value, icon }, idx) => (
            <Animated.View
              key={idx}
              style={{
                opacity: fadeAnim,
                transform: [{ scale: scaleAnim }],
              }}
            >
              <LinearGradient
                colors={['#13d5d5ff', '#23d7d7', '#6cececff']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.formCard}
              >
                <View intensity={25} tint="light" style={styles.metricGradientCard}>
                  <LinearGradient
                    colors={['rgba(255, 255, 255, 0.3)', 'transparent']}
                    style={[styles.innerShadowCommon, styles.topShadow]}
                    pointerEvents="none"
                  />
                  <LinearGradient
                    colors={['transparent', 'rgba(255, 255, 255, 0.3)']}
                    style={[styles.innerShadowCommon, styles.bottomShadow]}
                    pointerEvents="none"
                  />
                  <LinearGradient
                    colors={['rgba(255, 255, 255, 0.3)', 'transparent']}
                    style={[styles.innerShadowCommon, styles.leftShadow]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    pointerEvents="none"
                  />
                  <LinearGradient
                    colors={['transparent', 'rgba(255, 255, 255, 0.3)']}
                    style={[styles.innerShadowCommon, styles.rightShadow]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    pointerEvents="none"
                  />
                  <View style={styles.metricCard}>
                    <View style={styles.iconContainer}>
                      <MaterialCommunityIcons name={icon} size={28} color={Theme.colors.accentBlue} />
                    </View>
                    <View style={styles.metricInfo}>
                      <Text style={styles.metricLabel}>{label}</Text>
                      <Text style={[styles.metricValue, { fontFamily: 'Poppins-Bold' }]}>{value}</Text>
                    </View>
                  </View>
                </View>
              </LinearGradient>
            </Animated.View>
          ))}
        </ScrollView>

        <Modal
          animationType="none"
          transparent={true}
          visible={modalVisible}
          onRequestClose={closeModal}
        >
          <View style={styles.modalOverlay}>
            <Animated.View
              style={[
                styles.modalContainer,
                {
                  transform: [{ translateY: slideAnim }],
                },
              ]}
            >
              <MaterialIcons name="location-pin" size={84} style={{ color: '#EE5757' }} />
              <Text style={styles.permissionDeniedHeader}>Where Are You?</Text>
              <Text style={styles.permissionDeniedText}>
                Let Bayanihan access your location to show position on the map.
              </Text>
              <View style={styles.permissionButtons}>
                <TouchableOpacity style={styles.retryButton} onPress={handleRequestPermission}>
                  <Text style={styles.retryButtonText}>Allow Location Access</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.closeButton} onPress={closeModal}>
                  <Text style={styles.closeButtonText}>Not Now</Text>
                </TouchableOpacity>
              </View>
            </Animated.View>
          </View>
        </Modal>
      </SafeAreaView>
    </LinearGradient>
  );
};

export default DashboardScreen;