import React, { useState, useEffect } from 'react';
import { Text, View, TextInput, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import * as Font from 'expo-font';
import ProfileStyles from '../styles/ProfileStyles';

const ProfileScreen = () => {
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
      });
      setFontsLoaded(true);
    })();
  }, []);

  if (!fontsLoaded) {
    return null; // Optional: add loading indicator
  }

  const toggleTermsCheckbox = () => setAgreedTerms(!agreedTerms);
  const toggleConsentCheckbox = () => setAgreedConsent(!agreedConsent);

  return (
    <ScrollView style={ProfileStyles.container}>
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text style={[ProfileStyles.header, { fontFamily: 'Poppins-Bold' }]}>Profile</Text>

        <View style={ProfileStyles.section}>
          <Text style={[ProfileStyles.sectionTitle, { fontFamily: 'Poppins-Medium' }]}>Volunteer Group Information</Text>

          <View style={ProfileStyles.infoRow}>
            <Text style={[ProfileStyles.label, { fontFamily: 'Poppins-MediumItalic' }]}>Organization Name:</Text>
            <Text style={[ProfileStyles.output, { fontFamily: 'Poppins-Medium' }]}>ABVN Team A</Text>
          </View>

          <View style={ProfileStyles.infoRow}>
            <Text style={[ProfileStyles.label, { fontFamily: 'Poppins-MediumItalic' }]}>HQ:</Text>
            <Text style={[ProfileStyles.output, { fontFamily: 'Poppins-Medium' }]}>Naga City, Camarines Sur</Text>
          </View>

          <View style={ProfileStyles.infoRow}>
            <Text style={[ProfileStyles.label, { fontFamily: 'Poppins-MediumItalic' }]}>Contact Person:</Text>
            <Text style={[ProfileStyles.output, { fontFamily: 'Poppins-Medium' }]}>John Doe</Text>
          </View>

          <View style={ProfileStyles.infoRow}>
            <Text style={[ProfileStyles.label, { fontFamily: 'Poppins-MediumItalic' }]}>Email Address:</Text>
            <Text style={[ProfileStyles.output, { fontFamily: 'Poppins-Medium' }]}>johnDoe@gmail.com</Text>
          </View>

          <View style={ProfileStyles.infoRow}>
            <Text style={[ProfileStyles.label, { fontFamily: 'Poppins-MediumItalic' }]}>Mobile Number:</Text>
            <Text style={[ProfileStyles.output, { fontFamily: 'Poppins-Medium' }]}>0999 999 9999</Text>
          </View>

          <View style={ProfileStyles.infoRow}>
            <Text style={[ProfileStyles.label, { fontFamily: 'Poppins-MediumItalic' }]}>Area of Operation:</Text>
            <View style={ProfileStyles.outputContainer}>
              <Text style={[ProfileStyles.output, { fontFamily: 'Poppins-Medium' }]}>1. Sorsogon</Text>
              <Text style={[ProfileStyles.output, { fontFamily: 'Poppins-Medium' }]}>2. Camarines Norte</Text>
              <Text style={[ProfileStyles.output, { fontFamily: 'Poppins-Medium' }]}>3. Camarines Sur</Text>
              <Text style={[ProfileStyles.output, { fontFamily: 'Poppins-Medium' }]}>4. Albay</Text>
            </View>
          </View>
        </View>

        <View style={ProfileStyles.section}>
          <Text style={[ProfileStyles.sectionTitle, { fontFamily: 'Poppins-Bold' }]}>Change Password</Text>

          <TextInput
            style={[ProfileStyles.input, { fontFamily: 'Poppins-Medium' }]}
            placeholder="Temporary Password"
            value={currentPassword}
            onChangeText={setCurrentPassword}
            secureTextEntry
          />
          <TextInput
            style={[ProfileStyles.input, { fontFamily: 'Poppins-Medium' }]}
            placeholder="New Password"
            value={newPassword}
            onChangeText={setNewPassword}
            secureTextEntry
          />
          <TextInput
            style={[ProfileStyles.input, { fontFamily: 'Poppins-Medium' }]}
            placeholder="Confirm Password"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
          />
        </View>

        <View style={ProfileStyles.submission}>
          <TouchableOpacity onPress={toggleTermsCheckbox} style={ProfileStyles.checkboxContainer}>
            <View style={ProfileStyles.checkboxBox}>
              {agreedTerms && <Icon name="check" style={ProfileStyles.checkmark} />}
            </View>
            <Text style={[ProfileStyles.checkboxLabel, { fontFamily: 'Poppins-MediumItalic' }]}>I agree to the terms and privacy policy</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={toggleConsentCheckbox} style={ProfileStyles.checkboxContainer}>
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
      </View>
    </ScrollView>
  );
};

export default ProfileScreen;
