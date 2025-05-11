import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import ProfileStyles from '../styles/ProfileStyles';
import { useSidebar } from './Sidebar/SidebarContext';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { ScrollView } from 'react-native-gesture-handler';


const Profile = () => {
    const { toggleSidebar } = useSidebar();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // checkbox
  const [agreedTerms, setAgreedTerms] = useState(false);
const [agreedConsent, setAgreedConsent] = useState(false);
  const toggleTermsCheckbox = () => {
  setAgreedTerms(!agreedTerms);
};

const toggleConsentCheckbox = () => {
  setAgreedConsent(!agreedConsent);
};

// Next 
// const handleSubmit = () => {
//     navigation.navigate('Profile');
// }

  return (
    <ScrollView style={ProfileStyles.container}>
    <View >
      <TouchableOpacity  onPress={toggleSidebar} style={ProfileStyles.menu}>
              <Icon name="menu" size={24} color="#FFFFFF" />
            </TouchableOpacity>
            <Text style={ProfileStyles.header}>Profile</Text>
      
      <View style={ProfileStyles.section}>
        <Text style={ProfileStyles.sectionTitle}>Volunteer Group Information</Text>
        <View style={ProfileStyles.infoRow}>
          <Text style={ProfileStyles.label}>Organization Name: </Text>
          <Text style={ProfileStyles.output}>ABVN Team A</Text>
        </View>
        <View style={ProfileStyles.infoRow}>
          <Text style={ProfileStyles.label}>HQ: </Text>
          <Text style={ProfileStyles.output}>Naga City, Camarines Sur</Text>
        </View>
        <View style={ProfileStyles.infoRow}>
          <Text style={ProfileStyles.label}>Contact Person: </Text>
          <Text style={ProfileStyles.output}>John Doe</Text>
        </View>
        <View style={ProfileStyles.infoRow}>
          <Text style={ProfileStyles.label}>Email Address: </Text>
          <Text style={ProfileStyles.output}>johnDoe@gmail.com</Text>
        </View>
        <View style={ProfileStyles.infoRow}>
          <Text style={ProfileStyles.label}>Mobile Number: </Text>
          <Text style={ProfileStyles.output}>0999 999 9999</Text>
        </View>
        <View style={ProfileStyles.infoRow}>
          <Text style={ProfileStyles.label}>Area of Operation: </Text>
          <View>
            <Text style={ProfileStyles.output}>1. Sorsogon</Text>
            <Text style={ProfileStyles.output}>2. Camarines Norte</Text>
            <Text style={ProfileStyles.output}>3. Camarines Sur</Text>
            <Text style={ProfileStyles.output}>4. Albay</Text>
          </View>
           </View>
      </View>

      <View style={ProfileStyles.section}>
        <Text style={ProfileStyles.sectionTitle}>Change password</Text>
        <TextInput
          style={ProfileStyles.input}
          placeholder="Temporary Password"
          value={currentPassword}
          onChangeText={setCurrentPassword}
          secureTextEntry
        />
        <TextInput
          style={ProfileStyles.input}
          placeholder="New Password"
          value={newPassword}
          onChangeText={setNewPassword}
          secureTextEntry
        />
        <TextInput
          style={ProfileStyles.input}
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
        <Text style={ProfileStyles.checkboxLabel}>I agree to the terms and privacy policy</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={toggleConsentCheckbox} style={ProfileStyles.checkboxContainer}>
        <View style={ProfileStyles.checkboxBox}>
         {agreedConsent && <Icon name="check" style={ProfileStyles.checkmark} />}
        </View>
        <Text style={ProfileStyles.checkboxLabel}>I consent to Bayanihan collecting and storing my data for disaster response purposes</Text>
      </TouchableOpacity>

        <TouchableOpacity style={ProfileStyles.button} >
                <Text style={ProfileStyles.buttonText}>Next</Text>
          </TouchableOpacity>
          </View>
    </View>
    </ScrollView>
  );
};


export default Profile;