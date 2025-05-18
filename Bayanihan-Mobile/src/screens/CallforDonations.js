import React, { useState, useEffect } from 'react';
import { Text, View, TextInput, TouchableOpacity, ScrollView} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';
import * as Font from 'expo-font';
import ProfileStyles from '../styles/ProfileStyles';
import GlobalStyles from '../styles/GlobalStyles';
import { Ionicons } from '@expo/vector-icons';

const CallforDonations = ({ navigation }) => {
  
  return (
    <View style={ProfileStyles.container}>

      {/* Header - Use GlobalStyles for header properties */}
      <View style={GlobalStyles.headerContainer}>
        <TouchableOpacity
          onPress={() => navigation.openDrawer()}
          style={GlobalStyles.headerMenuIcon}
        >
          <Ionicons name="menu" size={32} color="white" />
        </TouchableOpacity>
        <Text style={GlobalStyles.headerTitle}>Call for Donation</Text>
      </View>

      <SafeAreaView style={{ flex: 1 }} edges={['left', 'right', 'bottom']}>
        <ScrollView contentContainerStyle={ProfileStyles.scrollViewContent}>

        
        </ScrollView>
      </SafeAreaView>
    </View>
  );
};

export default CallforDonations;