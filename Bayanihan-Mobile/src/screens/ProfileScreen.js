import React, { useState, useEffect } from 'react';
import { Text, View, TextInput, TouchableOpacity, ScrollView} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';
import * as Font from 'expo-font';
import ProfileStyles from '../styles/ProfileStyles';
import GlobalStyles from '../styles/GlobalStyles';
import { Ionicons } from '@expo/vector-icons';

const ProfileScreen = ({ navigation }) => {
  const [fontsLoaded, setFontsLoaded] = useState(false);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [agreedTerms, setAgreedTerms] = useState(false);
  const [agreedConsent, setAgreedConsent] = useState(false);

  useEffect(() => {
    (async () => {
      await Font.loadAsync({
        'Poppins-MediumItalic': require('../../assets/fonts/Poppins/Poppins-MediumItalic.ttf'),
        'Poppins-Bold': require('../../assets/fonts/Poppins/Poppins-Bold.ttf'),
        'Poppins-Medium': require('../../assets/fonts/Poppins/Poppins-Medium.ttf'),
        'Poppins_SemiBold': require('../../assets/fonts/Poppins/Poppins-SemiBold.ttf'), // Make sure this is loaded!
        'Poppins_Regular': require('../../assets/fonts/Poppins/Poppins-Regular.ttf'), // Make sure this is loaded!
      });
      setFontsLoaded(true);
    })();
  }, []);

  if (!fontsLoaded) {
    return null; // Optional: add a spinner here
  }

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
        <Text style={GlobalStyles.headerTitle}>Profile</Text>
      </View>

      <SafeAreaView style={{ flex: 1 }} edges={['left', 'right', 'bottom']}> {/* Remove 'top' edge */}
        <ScrollView contentContainerStyle={ProfileStyles.scrollViewContent}> {/* New style for content padding */}

          {/* Volunteer Info */}
          <View style={ProfileStyles.section}>
            <Text style={[ProfileStyles.sectionTitle, { fontFamily: 'Poppins-Bold' }]}>
              Volunteer Group Information
            </Text>

            {[
              ['Organization Name:', 'ABVN Team A'],
              ['HQ:', 'Naga City, Camarines Sur'],
              ['Contact Person:', 'John Doe'],
              ['Email Address:', 'johnDoe@gmail.com'],
              ['Mobile Number:', '0999 999 9999'],
            ].map(([label, value], idx) => (
              <View key={idx} style={ProfileStyles.infoRow}>
                <Text style={[ProfileStyles.label, { fontFamily: 'Poppins-MediumItalic' }]}>{label}</Text>
                <Text style={[ProfileStyles.output, { fontFamily: 'Poppins-Medium' }]}>{value}</Text>
              </View>
            ))}

            <View style={ProfileStyles.infoRow}>
              <Text style={[ProfileStyles.label, { fontFamily: 'Poppins-MediumItalic' }]}>Area of Operation:</Text>
              <View style={ProfileStyles.outputContainer}>
                {['Sorsogon', 'Camarines Norte', 'Camarines Sur', 'Albay', 'Masbate', 'Catanduanes', 'Quezon Province'].map((area, i) => (
                  <Text key={i} style={[ProfileStyles.output, { fontFamily: 'Poppins-Medium' }]}>
                    {`${i + 1}. ${area}`}
                  </Text>
                ))}
              </View>
            </View>
          </View>

          {/* Change Password */}
          <View style={ProfileStyles.section}>
            <Text style={[ProfileStyles.sectionTitle, { fontFamily: 'Poppins-Bold' }]}>
              Change Password
            </Text>

            {[['Temporary Password', currentPassword, setCurrentPassword],
              ['New Password', newPassword, setNewPassword],
              ['Confirm Password', confirmPassword, setConfirmPassword],
            ].map(([placeholder, value, setter], idx) => (
              <TextInput
                key={idx}
                style={[ProfileStyles.input, { fontFamily: 'Poppins-Medium' }]}
                placeholder={placeholder}
                value={value}
                onChangeText={setter}
                secureTextEntry
              />
            ))}
          </View>

          {/* Checkboxes & Button */}
          <View style={ProfileStyles.submission}>
            <TouchableOpacity onPress={() => setAgreedTerms(!agreedTerms)} style={ProfileStyles.checkboxContainer}>
              <View style={ProfileStyles.checkboxBox}>
                {agreedTerms && <Icon name="check" style={ProfileStyles.checkmark} />}
              </View>
              <Text style={[ProfileStyles.checkboxLabel, { fontFamily: 'Poppins-MediumItalic' }]}>
                I agree to the terms and privacy policy
              </Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => setAgreedConsent(!agreedConsent)} style={ProfileStyles.checkboxContainer}>
              <View style={ProfileStyles.checkboxBox}>
                {agreedConsent && <Icon name="check" style={ProfileStyles.checkmark} />}
              </View>
              <Text style={[ProfileStyles.checkboxLabel, { fontFamily: 'Poppins-MediumItalic' }]}>
                I consent to Bayanihan collecting and storing my data for disaster response purposes
              </Text>
            </TouchableOpacity>

            <TouchableOpacity style={ProfileStyles.button}>
              <Text style={[ProfileStyles.buttonText, { fontFamily: 'Poppins-Bold' }]}>Next</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
};

export default ProfileScreen;