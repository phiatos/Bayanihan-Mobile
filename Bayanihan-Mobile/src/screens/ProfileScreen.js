import React, { useState, useEffect, useContext } from 'react';
import { Text, View, TextInput, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { Ionicons } from '@expo/vector-icons';
import ProfileStyles from '../styles/ProfileStyles';
import GlobalStyles from '../styles/GlobalStyles';
import { AuthContext } from '../context/AuthContext';
import { getDatabase, ref, get } from 'firebase/database';

const ProfileScreen = ({ navigation }) => {
  const { user } = useContext(AuthContext);
  const [profileData, setProfileData] = useState({
    organization: '',
    hq: '',
    contactPerson: '',
    email: '',
    mobile: '',
    areaOfOperation: [],
  });
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [agreedTerms, setAgreedTerms] = useState(false);
  const [agreedConsent, setAgreedConsent] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfileData = async () => {
      if (!user?.id) {
        setLoading(false);
        return;
      }

      try {
        const db = getDatabase();
        const userRef = ref(db, `users/${user.id}`);
        const snapshot = await get(userRef);
        if (snapshot.exists()) {
          const data = snapshot.val();
          setProfileData({
            organization: data.organization || 'N/A',
            hq: data.hq || 'N/A',
            contactPerson: data.contactPerson || user.contactPerson || 'N/A',
            email: data.email || user.email || 'N/A',
            mobile: data.mobile || 'N/A',
            areaOfOperation: data.areaOfOperation || [],
          });
        } else {
          console.warn('No profile data found for user:', user.id);
        }
      } catch (error) {
        console.error('Error fetching profile data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProfileData();
  }, [user]);

  if (loading) {
    return (
      <View style={ProfileStyles.container}>
        <Text style={ProfileStyles.sectionTitle}>
          Loading...
        </Text>
      </View>
    );
  }

  return (
    <View style={ProfileStyles.container}>
      {/* Header */}
      <View style={GlobalStyles.headerContainer}>
        <TouchableOpacity
          onPress={() => navigation.openDrawer()}
          style={GlobalStyles.headerMenuIcon}
        >
          <Ionicons name="menu" size={32} color="white" />
        </TouchableOpacity>
        <Text style={GlobalStyles.headerTitle}>Profile</Text>
      </View>

      <SafeAreaView style={{ flex: 1 }} edges={['left', 'right', 'bottom']}>
        <ScrollView contentContainerStyle={ProfileStyles.scrollViewContent}>
          {/* Volunteer Info */}
          <View style={ProfileStyles.section}>
            <Text style={ProfileStyles.sectionTitle}>
              Volunteer Group Information
            </Text>

            {[
              ['Organization Name:', profileData.organization],
              ['HQ:', profileData.hq],
              ['Contact Person:', profileData.contactPerson],
              ['Email Address:', profileData.email],
              ['Mobile Number:', profileData.mobile],
            ].map(([label, value], idx) => (
              <View key={idx} style={ProfileStyles.infoRow}>
                <Text style={ProfileStyles.label}>{label}</Text>
                <View style={ProfileStyles.outputContainer}>
                <Text style={ProfileStyles.output}>{value}</Text></View>
              </View>
            ))}

            <View style={ProfileStyles.infoRow}>
              <Text style={ProfileStyles.label}>Area of Operation:</Text>
              <View style={ProfileStyles.outputContainer}>
                {profileData.areaOfOperation.length > 0 ? (
                  profileData.areaOfOperation.map((area, i) => (
                    <Text key={i} style={ProfileStyles.output}>
                      {`${i + 1}. ${area}`}
                    </Text>
                  ))
                ) : (
                  <Text style={ProfileStyles.output}>N/A</Text>
                )}
              </View>
            </View>
          </View>

          {/* Change Password */}
          <View style={ProfileStyles.section}>
            <Text style={[ProfileStyles.sectionTitle, { fontFamily: 'Poppins-Bold' }]}>
              Change Password
            </Text>

            {[
              ['Temporary Password', currentPassword, setCurrentPassword],
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

          {/* Submit Button */}
          <View style={ProfileStyles.submission}>
            
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