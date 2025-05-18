import React, { useState, useEffect } from 'react';
import { Text, View, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as Font from 'expo-font';

import DashboardStyles from '../styles/DashboardStyles';
import GlobalStyles from '../styles/GlobalStyles';

const DashboardScreen = ({ navigation }) => {
  const [fontsLoaded, setFontsLoaded] = useState(false);

  useEffect(() => {
    (async () => {
      await Font.loadAsync({
        'Poppins-MediumItalic': require('../../assets/fonts/Poppins/Poppins-MediumItalic.ttf'),
        'Poppins-Bold': require('../../assets/fonts/Poppins/Poppins-Bold.ttf'),
        'Poppins-Medium': require('../../assets/fonts/Poppins/Poppins-Medium.ttf'),
        'Poppins_SemiBold': require('../../assets/fonts/Poppins/Poppins-SemiBold.ttf'),
        'Poppins_Regular': require('../../assets/fonts/Poppins/Poppins-Regular.ttf'),
      });
      setFontsLoaded(true);
    })();
  }, []);

  if (!fontsLoaded) {
    return null;
  }

  const metrics = [
    { label: 'No. of Food Packs', value: '0', icon: 'food-variant' },
    { label: 'No. of Hot Meals', value: '0', icon: 'silverware-fork-knife' },
    { label: 'Liters of Water', value: '0', icon: 'water' },
    { label: 'Volunteers Mobilized', value: '0', icon: 'account-group' },
    { label: 'Total Amount Raised', value: '₱0', icon: 'cash' },
    { label: 'In-Kind Donations', value: '₱0', icon: 'gift' },
  ];

  return (
    <View style={DashboardStyles.container}>
      {/* Header */}
      <View style={GlobalStyles.headerContainer}>
        <TouchableOpacity
          onPress={() => navigation.openDrawer()}
          style={GlobalStyles.headerMenuIcon}
        >
          <Ionicons name="menu" size={32} color="white" />
        </TouchableOpacity>
        <Text style={GlobalStyles.headerTitle}>Dashboard</Text>
      </View>

      <SafeAreaView style={{ flex: 1 }} edges={['left', 'right', 'bottom']}>
        <ScrollView contentContainerStyle={DashboardStyles.scrollViewContent}>
          <Text style={[DashboardStyles.sectionTitle, { fontFamily: 'Poppins-Bold' }]}>
            Volunteer Group Metrics
          </Text>

          {metrics.map(({ label, value, icon }, idx) => (
            <View key={idx} style={DashboardStyles.metricCard}>
              <View style={DashboardStyles.iconContainer}>
                <MaterialCommunityIcons name={icon} size={28} color="#4A90E2" />
              </View>
              <View style={DashboardStyles.metricInfo}>
                <Text style={[DashboardStyles.metricLabel, { fontFamily: 'Poppins-MediumItalic' }]}>
                  {label}
                </Text>
                <Text style={[DashboardStyles.metricValue, { fontFamily: 'Poppins-Bold' }]}>
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
