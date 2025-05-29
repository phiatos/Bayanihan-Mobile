import { Ionicons } from '@expo/vector-icons';
import {
  EmailAuthProvider,
  onAuthStateChanged,
  reauthenticateWithCredential,
  updatePassword,
} from 'firebase/auth';
import { get, getDatabase, ref, update } from 'firebase/database';
import React, { useContext, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { auth } from '../configuration/firebaseConfig';
import Theme from '../constants/theme'; // Ensure Theme is imported
import { AuthContext } from '../context/AuthContext';
import GlobalStyles from '../styles/GlobalStyles';
import ProfileStyles from '../styles/ProfileStyles';

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
  const [passwordStrength, setPasswordStrength] = useState({
    strength: '',
    barWidth: '0%',
    barColor: 'red',
    checks: {
      hasLength: false,
      hasUppercase: false,
      hasNumber: false,
      hasSymbol: false,
    },
  });
  const [showPasswordStrength, setShowPasswordStrength] = useState(false);
  const [agreedTerms, setAgreedTerms] = useState(false);
  const [termsModalVisible, setTermsModalVisible] = useState(false);
  const [passwordNeedsReset, setPasswordNeedsReset] = useState(false);
  const [isNavigationBlocked, setIsNavigationBlocked] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const currentTermsVersion = 1;

  useEffect(() => {
    const initializeProfile = async () => {
      if (!user?.id) {
        setLoading(false);
        Alert.alert('Error', 'No user logged in. Please log in again.', [
          { text: 'OK', onPress: () => navigation.navigate('Login') },
        ]);
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

          const userAgreedVersion = data.terms_agreed_version || 0;
          const termsPending = userAgreedVersion < currentTermsVersion;
          const needsPasswordReset = data.password_needs_reset || false;

          if (termsPending) {
            setTermsModalVisible(true);
            setIsNavigationBlocked(true);
          } else if (needsPasswordReset) {
            setPasswordNeedsReset(true);
            setIsNavigationBlocked(true);
            Alert.alert(
              'Password Change Required',
              'For security reasons, please change your password.',
              [{ text: 'Understood' }]
            );
          } else {
            setIsNavigationBlocked(false);
          }
        } else {
          console.warn('No profile data found for user:', user.id);
          Alert.alert('Warning', 'No profile data found. Please contact support.');
        }
      } catch (error) {
        console.error('Error fetching profile data:', error);
        Alert.alert('Error', 'Failed to fetch profile data: ' + error.message);
      } finally {
        setLoading(false);
      }
    };

    initializeProfile();

    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (!currentUser) {
        Alert.alert('Not Logged In', 'Please log in to view your profile.', [
          { text: 'OK', onPress: () => navigation.navigate('Login') },
        ]);
      }
    });

    return () => unsubscribe();
  }, [user, navigation]);

  const handlePasswordInput = (password) => {
    setNewPassword(password);

    if (password.length === 0) {
      setShowPasswordStrength(false);
      return;
    }

    setShowPasswordStrength(true);

    const hasLength = password.length >= 8;
    const hasUppercase = /[A-Z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSymbol = /[^A-Za-z0-9]/.test(password);

    const passedChecks = [hasLength, hasUppercase, hasNumber, hasSymbol].filter(Boolean).length;
    let strength = '';
    let barWidth = '0%';
    let barColor = 'red';

    if (passedChecks <= 1) {
      strength = 'Weak';
      barWidth = '25%';
      barColor = 'red';
    } else if (passedChecks === 2) {
      strength = 'Medium';
      barWidth = '50%';
      barColor = 'orange';
    } else if (passedChecks === 3) {
      strength = 'Good';
      barWidth = '75%';
      barColor = 'yellowgreen';
    } else if (passedChecks === 4) {
      strength = 'Strong';
      barWidth = '100%';
      barColor = 'green';
    }

    setPasswordStrength({
      strength,
      barWidth,
      barColor,
      checks: { hasLength, hasUppercase, hasNumber, hasSymbol },
    });
  };

  const handleChangePassword = async () => {
    if (!user) {
      Alert.alert('Not Logged In', 'Please log in to change your password.', [
        { text: 'OK', onPress: () => navigation.navigate('Login') },
      ]);
      return;
    }

    if (!currentPassword || !newPassword || !confirmPassword) {
      Alert.alert('Error', 'Please fill in all password fields.');
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert('Error', 'New password and confirmation do not match.');
      return;
    }

    const { hasLength, hasUppercase, hasNumber, hasSymbol } = passwordStrength.checks;
    if (!hasLength || !hasUppercase || !hasNumber || !hasSymbol) {
      Alert.alert(
        'Weak Password',
        'Your new password does not meet the complexity requirements. Please ensure it has at least 8 characters, one uppercase letter, one number, and one symbol.'
      );
      return;
    }

    setSubmitting(true);

    try {
      const userEmail = user.email || profileData.email;
      if (!userEmail) {
        throw new Error('No email associated with this user for re-authentication.');
      }

      const credential = EmailAuthProvider.credential(userEmail, currentPassword);
      await reauthenticateWithCredential(auth.currentUser, credential);

      await updatePassword(auth.currentUser, newPassword);

      const db = getDatabase();
      await update(ref(db, `users/${user.id}`), {
        lastPasswordChange: new Date().toISOString(),
        password_needs_reset: false,
      });

      Alert.alert('Success', 'Your password has been updated successfully.', [
        {
          text: 'OK',
          onPress: () => {
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
            setShowPasswordStrength(false);
            setPasswordNeedsReset(false);
            setIsNavigationBlocked(false);
          },
        },
      ]);
    } catch (error) {
      console.error('Password change error:', error);
      let errorMessage = 'Failed to change password. Please ensure your current password is correct.';
      if (error.code === 'auth/invalid-credential' || error.code === 'auth/wrong-password') {
        errorMessage = 'Incorrect current password or authentication issue.';
      } else if (error.code === 'auth/requires-recent-login') {
        errorMessage = 'For security, please log in again before changing your password.';
      }
      Alert.alert('Error', errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const handleAgreeTerms = async () => {
    if (!agreedTerms) {
      Alert.alert('Error', 'You must agree to the Terms and Conditions.');
      return;
    }

    try {
      const db = getDatabase();
      await update(ref(db, `users/${user.id}`), {
        terms_agreed_version: currentTermsVersion,
        terms_agreed_at: new Date().toISOString(),
        isFirstLogin: false,
        termsAccepted: true,
      });

      setTermsModalVisible(false);
      setIsNavigationBlocked(false);

      const snapshot = await get(ref(db, `users/${user.id}`));
      const userData = snapshot.val();
      const needsPasswordReset = userData.password_needs_reset || false;

      if (needsPasswordReset) {
        setPasswordNeedsReset(true);
        setIsNavigationBlocked(true);
        Alert.alert(
          'Password Change Required',
          'Thank you for accepting the Terms and Conditions. For security reasons, please change your password now.',
          [{ text: 'Understood' }]
        );
      } else {
        Alert.alert('Success', 'Thank you for accepting the Terms and Conditions.', [
          { text: 'OK' },
        ]);
      }
    } catch (error) {
      console.error('Error updating terms agreement:', error);
      Alert.alert('Error', 'Failed to record your agreement. Please try again.');
    }
  };

  const handleOpenDrawer = () => {
    if (isNavigationBlocked) {
      Alert.alert(
        'Action Required',
        'You must complete the required actions (accept terms or change password) to navigate the application.'
      );
      return;
    }
    navigation.openDrawer();
  };

  if (loading) {
    return (
      <View style={ProfileStyles.container}>
        <Text style={ProfileStyles.sectionTitle}>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={ProfileStyles.container}>
      {/* Header */}
      <View style={GlobalStyles.headerContainer}>
        <TouchableOpacity onPress={handleOpenDrawer} style={GlobalStyles.headerMenuIcon}>
          <Ionicons name="menu" size={32} color="white" />
        </TouchableOpacity>
        <Text style={GlobalStyles.headerTitle}>Profile</Text>
      </View>

      <SafeAreaView style={{ flex: 1 }} edges={['left', 'right', 'bottom']}>
        <ScrollView contentContainerStyle={ProfileStyles.scrollViewContent}>
          {/* Volunteer Info */}
          {!termsModalVisible && !passwordNeedsReset && (
            <View style={ProfileStyles.section}>
              <Text style={ProfileStyles.sectionTitle}>Volunteer Group Information</Text>
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
                    <Text style={ProfileStyles.output}>{value}</Text>
                  </View>
                </View>
              ))}
              <View style={ProfileStyles.infoRow}>
                <Text style={ProfileStyles.label}>Area of Operation:</Text>
                <View style={ProfileStyles.outputContainer}>
                  {profileData.areaOfOperation.length > 0 ? (
                    profileData.areaOfOperation.map((area, i) => (
                      <Text key={i} style={ProfileStyles.output}>{`${i + 1}. ${area}`}</Text>
                    ))
                  ) : (
                    <Text style={ProfileStyles.output}>N/A</Text>
                  )}
                </View>
              </View>
            </View>
          )}

          {/* Terms and Conditions Modal */}
          {termsModalVisible && (
            <View style={ProfileStyles.modalOverlay}>
              <View style={ProfileStyles.modalContainer}>
                <Text style={ProfileStyles.modalTitle}>Terms and Conditions</Text>
                <ScrollView style={ProfileStyles.modalContent}>
                  <Text style={ProfileStyles.modalText}>
                    Please read and accept the Terms and Conditions to continue using the app.
                    Lorem ipsum dolor sit amet, consectetur adipiscing elit...
                  </Text>
                </ScrollView>
                <View style={ProfileStyles.checkboxContainer}>
                  <TouchableOpacity
                    onPress={() => setAgreedTerms(!agreedTerms)}
                    style={ProfileStyles.checkbox}
                  >
                    {agreedTerms ? (
                      <Ionicons name="checkbox" size={24} color={Theme.colors.primary} />
                    ) : (
                      <Ionicons name="checkbox-outline" size={24} color={Theme.colors.primary} />
                    )}
                  </TouchableOpacity>
                  <Text style={ProfileStyles.checkboxLabel}>
                    I agree to the Terms and Conditions
                  </Text>
                </View>
                <TouchableOpacity
                  style={[ProfileStyles.modalButton, !agreedTerms && { opacity: 0.5 }]}
                  onPress={handleAgreeTerms}
                  disabled={!agreedTerms}
                >
                  <Text style={ProfileStyles.modalButtonText}>Agree and Continue</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Change Password */}
          {(!termsModalVisible || passwordNeedsReset) && (
            <View style={ProfileStyles.section}>
              <Text style={[ProfileStyles.sectionTitle, { fontFamily: 'Poppins-Bold' }]}>
                Change Password
              </Text>
              {[
                ['Current Password', currentPassword, setCurrentPassword],
                ['New Password', newPassword, setNewPassword, handlePasswordInput],
                ['Confirm Password', confirmPassword, setConfirmPassword],
              ].map(([placeholder, value, setter, onChange], idx) => (
                <TextInput
                  key={idx}
                  style={[ProfileStyles.input, { fontFamily: 'Poppins-Medium' }]}
                  placeholder={placeholder}
                  value={value}
                  onChangeText={onChange || setter}
                  secureTextEntry
                />
              ))}

              {/* Password Strength Indicator */}
              {showPasswordStrength && (
                <View style={ProfileStyles.strengthContainer}>
                  <Text style={ProfileStyles.strengthText}>
                    Strength: {passwordStrength.strength}
                  </Text>
                  <View style={ProfileStyles.strengthBarContainer}>
                    <View
                      style={[
                        ProfileStyles.strengthBar,
                        {
                          width: passwordStrength.barWidth,
                          backgroundColor: passwordStrength.barColor,
                        },
                      ]}
                    />
                  </View>
                  {[
                    ['At least 8 characters', passwordStrength.checks.hasLength],
                    ['An uppercase letter', passwordStrength.checks.hasUppercase],
                    ['A number', passwordStrength.checks.hasNumber],
                    ['A symbol (!@#$ etc.)', passwordStrength.checks.hasSymbol],
                  ].map(([text, passed], idx) => (
                    <Text key={idx} style={ProfileStyles.checkText}>
                      {passed ? '✅' : '❌'} {text}
                    </Text>
                  ))}
                </View>
              )}
            </View>
          )}

          {/* Submit Button */}
          {(!termsModalVisible || passwordNeedsReset) && (
            <View style={ProfileStyles.submission}>
              <TouchableOpacity
                style={[ProfileStyles.button, submitting && { opacity: 0.5 }]}
                onPress={handleChangePassword}
                disabled={submitting}
              >
                {submitting ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text style={[ProfileStyles.buttonText, { fontFamily: 'Poppins-Bold' }]}>
                    Submit
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
};

export default ProfileScreen;