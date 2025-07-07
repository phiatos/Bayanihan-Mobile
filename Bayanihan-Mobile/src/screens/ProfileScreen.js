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
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  StyleSheet,
  Dimensions
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { auth } from '../configuration/firebaseConfig';
import Theme from '../constants/theme';
import { AuthContext } from '../context/AuthContext';
import GlobalStyles from '../styles/GlobalStyles';
import styles from '../styles/ProfileStyles';
import { KeyboardAvoidingView } from 'react-native';
import CustomModal from '../components/CustomModal'; // Adjust the import path as needed

const ProfileScreen = ({ navigation }) => {
  const { user } = useContext(AuthContext);
  const [profileData, setProfileData] = useState({
    organization: '',
    hq: '',
    contactPerson: '',
    email: '',
    mobile: '',
    role: '',
  });
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordStrength, setPasswordStrength] = useState({
    strength: '',
    barWidth: '0%',
    barColor: 'transparent',
    checks: {
      hasLength: false,
      hasUppercase: false,
      hasLowercase: false,
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
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const { height, width } = Dimensions.get('window');
  
  // State for custom modal
  const [customModal, setCustomModal] = useState({
    visible: false,
    title: '',
    message: null,
    onConfirm: () => {},
    confirmText: 'OK',
    showCancel: false,
  });

  const currentTermsVersion = 1;

  const closeModal = () => {
    setCustomModal({ ...customModal, visible: false });
  };

  // Local styles for modal content to match CustomModal's message style
  const localStyles = StyleSheet.create({
    message: {
      fontSize: 14,
      color: '#444',
      lineHeight: 24,
      fontFamily: 'Poppins_Regular',
      textAlign: 'center',
    },
    icon: {
      marginBottom: 15,
    },
  });

  useEffect(() => {
    const initializeProfile = async () => {
      if (!user?.id) {
        setLoading(false);
        setCustomModal({
          visible: true,
          title: 'Error',
          message: (
            <View style={{ alignItems: 'center' }}>
              <Ionicons name="alert-circle" size={60} color="#FF4D4D" style={localStyles.icon} />
              <Text style={localStyles.message}>No user logged in. Please log in again.</Text>
            </View>
          ),
          onConfirm: () => {
            closeModal();
            navigation.navigate('Login');
          },
          confirmText: 'OK',
          showCancel: false,
        });
        return;
      }

      try {
        const db = getDatabase();
        const userRef = ref(db, `users/${user.id}`);
        const snapshot = await get(userRef);
        if (snapshot.exists()) {
          const data = snapshot.val();
          // Combine address fields into a single hq string
          const addressFields = [
            data.address?.barangay,
            data.address?.city,
            data.address?.province,
            data.address?.region,
          ].filter(field => field && field !== 'N/A'); // Remove undefined or 'N/A' fields
          const hq = addressFields.length > 0 ? addressFields.join(', ') : 'N/A';

          setProfileData({
            organization: data.organization || 'N/A',
            hq: hq,
            contactPerson: data.contactPerson || user.contactPerson || 'N/A',
            email: data.email || user.email || 'N/A',
            mobile: data.mobile || 'N/A',
            role: data.role || 'N/A',
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
            setCustomModal({
              visible: true,
              title: 'Password Change Required',
              message: (
                <View style={{ alignItems: 'center' }}>
                  <Ionicons name="lock-closed" size={60} color="#FFD700" style={localStyles.icon} />
                  <Text style={localStyles.message}>
                    For security reasons, please change your password.
                  </Text>
                </View>
              ),
              onConfirm: closeModal,
              confirmText: 'Understood',
              showCancel: false,
            });
          } else {
            setIsNavigationBlocked(false);
          }
        } else {
          console.warn('No profile data found for user:', user.id);
          setCustomModal({
            visible: true,
            title: 'Warning',
            message: (
              <View style={{ alignItems: 'center' }}>
                <Ionicons name="warning" size={60} color="#FFD700" style={localStyles.icon} />
                <Text style={localStyles.message}>No profile data found. Please contact support.</Text>
              </View>
            ),
            onConfirm: closeModal,
            confirmText: 'OK',
            showCancel: false,
          });
        }
      } catch (error) {
        console.error('Error fetching profile data:', error);
        setCustomModal({
          visible: true,
          title: 'Error',
          message: (
            <View style={{ alignItems: 'center' }}>
              <Ionicons name="alert-circle" size={60} color="#FF4D4D" style={localStyles.icon} />
              <Text style={localStyles.message}>Failed to fetch profile data: {error.message}</Text>
            </View>
          ),
          onConfirm: closeModal,
          confirmText: 'OK',
          showCancel: false,
        });
      } finally {
        setLoading(false);
      }
    };

    initializeProfile();

    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (!currentUser) {
        setCustomModal({
          visible: true,
          title: 'Not Logged In',
          message: (
            <View style={{ alignItems: 'center' }}>
              <Ionicons name="alert-circle" size={60} color="#FF4D4D" style={localStyles.icon} />
              <Text style={localStyles.message}>Please log in to view your profile.</Text>
            </View>
          ),
          onConfirm: () => {
            closeModal();
            navigation.navigate('Login');
          },
          confirmText: 'OK',
          showCancel: false,
        });
      }
    });

    return () => unsubscribe();
  }, [user, navigation]);

  const handlePasswordInput = (password) => {
    setNewPassword(password);

    if (password.length === 0) {
      setShowPasswordStrength(false);
      setPasswordStrength({
        strength: '',
        barWidth: '0%',
        barColor: 'transparent',
        checks: {
          hasLength: false,
          hasUppercase: false,
          hasLowercase: false,
          hasNumber: false,
          hasSymbol: false,
        },
      });
      return;
    }

    setShowPasswordStrength(true);

    const hasLength = password.length >= 8;
    const hasUppercase = /[A-Z]/.test(password);
    const hasLowercase = /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSymbol = /[!@#$%^&*(),.?":{}|<>]/.test(password);
    const lengthScore = password.length >= 12 ? 2 : password.length >= 8 ? 1 : 0;

    const score = lengthScore + (hasUppercase ? 1 : 0) + (hasLowercase ? 1 : 0) +
      (hasNumber ? 1 : 0) + (hasSymbol ? 1 : 0);

    let strength = '';
    let barWidth = '0%';
    let barColor = 'red';

    if (score <= 2) {
      strength = 'Very Weak';
      barWidth = '20%';
      barColor = '#FF4D4D';
    } else if (score === 3) {
      strength = 'Weak';
      barWidth = '40%';
      barColor = '#FF8C00';
    } else if (score === 4) {
      strength = 'Medium';
      barWidth = '60%';
      barColor = '#FFD700';
    } else if (score === 5) {
      strength = 'Strong';
      barWidth = '80%';
      barColor = '#32CD32';
    } else if (score >= 6) {
      strength = 'Very Strong';
      barWidth = '100%';
      barColor = '#008000';
    }

    setPasswordStrength({
      strength,
      barWidth,
      barColor,
      checks: { hasLength, hasUppercase, hasLowercase, hasNumber, hasSymbol },
    });
  };

  const handleChangePassword = async () => {
    if (!user) {
      setCustomModal({
        visible: true,
        title: 'Not Logged In',
        message: (
          <View style={{ alignItems: 'center' }}>
            <Ionicons name="alert-circle" size={60} color="#FF4D4D" style={localStyles.icon} />
            <Text style={localStyles.message}>Please log in to change your password.</Text>
          </View>
        ),
        onConfirm: () => {
          closeModal();
          navigation.navigate('Login');
        },
        confirmText: 'OK',
        showCancel: false,
      });
      return;
    }

    if (!currentPassword || !newPassword || !confirmPassword) {
      setCustomModal({
        visible: true,
        title: 'Error',
        message: (
          <View style={{ alignItems: 'center' }}>
            <Ionicons name="alert-circle" size={60} color="#FF4D4D" style={localStyles.icon} />
            <Text style={localStyles.message}>Please fill in all password fields.</Text>
          </View>
        ),
        onConfirm: closeModal,
        confirmText: 'OK',
        showCancel: false,
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      setCustomModal({
        visible: true,
        title: 'Error',
        message: (
          <View style={{ alignItems: 'center' }}>
            <Ionicons name="alert-circle" size={60} color="#FF4D4D" style={localStyles.icon} />
            <Text style={localStyles.message}>New password and confirmation do not match.</Text>
          </View>
        ),
        onConfirm: closeModal,
        confirmText: 'OK',
        showCancel: false,
      });
      return;
    }

    const { hasLength, hasUppercase, hasLowercase, hasNumber, hasSymbol } = passwordStrength.checks;
    if (!hasLength || !hasUppercase || !hasLowercase || !hasNumber || !hasSymbol) {
      setCustomModal({
        visible: true,
        title: 'Weak Password',
        message: (
          <View style={{ alignItems: 'center' }}>
            <Ionicons name="alert-circle" size={60} color="#FF4D4D" style={localStyles.icon} />
            <Text style={localStyles.message}>
              Your new password must be at least 8 characters long and include an uppercase letter, a lowercase letter, a number, and a symbol.
            </Text>
          </View>
        ),
        onConfirm: closeModal,
        confirmText: 'OK',
        showCancel: false,
      });
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

      setCustomModal({
        visible: true,
        title: 'Success',
        message: (
          <View style={{ alignItems: 'center' }}>
            <Ionicons name="checkmark-circle" size={60} color="#00BCD4" style={localStyles.icon} />
            <Text style={localStyles.message}>Your password has been updated successfully.</Text>
          </View>
        ),
        onConfirm: () => {
          closeModal();
          setCurrentPassword('');
          setNewPassword('');
          setConfirmPassword('');
          setShowPasswordStrength(false);
          setPasswordNeedsReset(false);
          setIsNavigationBlocked(false);
        },
        confirmText: 'OK',
        showCancel: false,
      });
    } catch (error) {
      console.error('Password change error:', error);
      let errorMessage = 'Failed to change password. Please ensure your current password is correct.';
      if (error.code === 'auth/invalid-credential' || error.code === 'auth/wrong-password') {
        errorMessage = 'Incorrect current password or authentication issue.';
      } else if (error.code === 'auth/requires-recent-login') {
        errorMessage = 'For security, please log in again before changing your password.';
      }
      setCustomModal({
        visible: true,
        title: 'Error',
        message: (
          <View style={{ alignItems: 'center' }}>
            <Ionicons name="alert-circle" size={60} color="#FF4D4D" style={localStyles.icon} />
            <Text style={localStyles.message}>{errorMessage}</Text>
          </View>
        ),
        onConfirm: closeModal,
        confirmText: 'OK',
        showCancel: false,
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleAgreeTerms = async () => {
    if (!agreedTerms) {
      setCustomModal({
        visible: true,
        title: 'Error',
        message: (
          <View style={{ alignItems: 'center' }}>
            <Ionicons name="alert-circle" size={60} color="#FF4D4D" style={localStyles.icon} />
            <Text style={localStyles.message}>You must agree to the Terms and Conditions.</Text>
          </View>
        ),
        onConfirm: closeModal,
        confirmText: 'OK',
        showCancel: false,
      });
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
        setCustomModal({
          visible: true,
          title: 'Password Change Required',
          message: (
            <View style={{ alignItems: 'center' }}>
              <Ionicons name="lock-closed" size={60} color="#FFD700" style={localStyles.icon} />
              <Text style={localStyles.message}>
                Thank you for accepting the Terms and Conditions. For security reasons, please change your password now.
              </Text>
            </View>
          ),
          onConfirm: closeModal,
          confirmText: 'Understood',
          showCancel: false,
        });
      } else {
        setCustomModal({
          visible: true,
          title: 'Success',
          message: (
            <View style={{ alignItems: 'center' }}>
              <Ionicons name="checkmark-circle" size={60} color="#00BCD4" style={localStyles.icon} />
              <Text style={localStyles.message}>Thank you for accepting the Terms and Conditions.</Text>
            </View>
          ),
          onConfirm: closeModal,
          confirmText: 'OK',
          showCancel: false,
        });
      }
    } catch (error) {
      console.error('Error updating terms agreement:', error);
      setCustomModal({
        visible: true,
        title: 'Error',
        message: (
          <View style={{ alignItems: 'center' }}>
            <Ionicons name="alert-circle" size={60} color="#FF4D4D" style={localStyles.icon} />
            <Text style={localStyles.message}>Failed to record your agreement. Please try again.</Text>
          </View>
        ),
        onConfirm: closeModal,
        confirmText: 'OK',
        showCancel: false,
      });
    }
  };

  const handleOpenDrawer = () => {
    if (isNavigationBlocked) {
      setCustomModal({
        visible: true,
        title: 'Action Required',
        message: (
          <View style={{ alignItems: 'center' }}>
            <Ionicons name="alert-circle" size={60} color="#FF4D4D" style={localStyles.icon} />
            <Text style={localStyles.message}>
              You must complete the required actions (accept terms or change password) to navigate the application.
            </Text>
          </View>
        ),
        onConfirm: closeModal,
        confirmText: 'OK',
        showCancel: false,
      });
      return;
    }
    navigation.openDrawer();
  };

  if (loading) {
    return (
      <View style={GlobalStyles.container}>
        <ActivityIndicator size="large" color={Theme.colors.primary} />
        <Text style={styles.sectionTitle}>Loading Profile...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={GlobalStyles.container}>
      {/* Header */}
      <View style={GlobalStyles.newheaderContainer}>
        <View style={styles.headerContent}>
          <TouchableOpacity
            onPress={() => navigation.openDrawer()}
            style={styles.headerMenuIcon}
          >
            <Ionicons name="menu" size={32} color={Theme.colors.primary} />
          </TouchableOpacity>
          <Text style={GlobalStyles.headerTitle}>Profile</Text>
        </View>
      </View>

      <ScrollView style={styles.scrollViewContent}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
        >
          <ScrollView contentContainerStyle={styles.scrollViewContent}>
            {/* Volunteer Info */}
            {!termsModalVisible && !passwordNeedsReset && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Volunteer Group Information</Text>
                {[
                  ['Role:', profileData.role],
                  ['Organization Name:', profileData.organization],
                  ['Headquarters:', profileData.hq],
                  ['Contact Person:', profileData.contactPerson],
                  ['Email Address:', profileData.email],
                  ['Mobile Number:', profileData.mobile],
                ].map(([label, value], idx) => (
                  <View key={idx} style={styles.infoRow}>
                    <Text style={styles.label}>{label}</Text>
                    <View style={styles.outputContainer}>
                      <Text style={styles.output}>{value}</Text>
                    </View>
                  </View>
                ))}
              </View>
            )}

            {/* Terms and Conditions Modal */}
            {termsModalVisible && (
              <View style={styles.modalOverlay}>
                <View style={styles.modalContainer}>
                  <Text style={styles.modalTitle}>Terms and Conditions</Text>
                  <ScrollView style={styles.modalContent}>
                    <Text style={styles.modalText}>
                      Please read and accept the Terms and Conditions to continue using the app.
                      Lorem ipsum dolor sit amet, consectetur adipiscing elit...
                    </Text>
                  </ScrollView>
                  <View style={styles.checkboxContainer}>
                    <TouchableOpacity
                      onPress={() => setAgreedTerms(!agreedTerms)}
                      style={styles.checkbox}
                    >
                      {agreedTerms ? (
                        <Ionicons name="checkbox" size={24} color={Theme.colors.primary} />
                      ) : (
                        <Ionicons name="checkbox-outline" size={24} color={Theme.colors.primary} />
                      )}
                    </TouchableOpacity>
                    <Text style={styles.checkboxLabel}>
                      I agree to the Terms and Conditions
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={[styles.modalButton, !agreedTerms && { opacity: 0.5 }]}
                    onPress={handleAgreeTerms}
                    disabled={!agreedTerms}
                  >
                    <Text style={styles.modalButtonText}> Agree and Continue</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* Custom Modal for Alerts */}
            <CustomModal
              visible={customModal.visible}
              title={customModal.title}
              message={customModal.message}
              onConfirm={customModal.onConfirm}
              onCancel={closeModal}
              confirmText={customModal.confirmText}
              showCancel={customModal.showCancel}
            />

            {/* Change Password Section */}
            {(!termsModalVisible || passwordNeedsReset) && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>
                  Change Password
                </Text>

                {/* Current Password Input Field */}
                <View style={styles.passwordInputField}>
                  <TextInput
                    style={styles.input}
                    placeholder="Current Password"
                    value={currentPassword}
                    onChangeText={setCurrentPassword}
                    secureTextEntry={!showCurrentPassword}
                  />
                  <TouchableOpacity
                    onPress={() => setShowCurrentPassword(!showCurrentPassword)}
                    style={styles.passwordEyeIcon}
                  >
                    <Ionicons
                      name={showCurrentPassword ? 'eye-off' : 'eye'}
                      size={24}
                      color={Theme.colors.primary}
                    />
                  </TouchableOpacity>
                </View>

                {/* New Password Input Field */}
                <View style={styles.passwordInputField}>
                  <TextInput
                    style={styles.input}
                    placeholder="New Password"
                    value={newPassword}
                    onChangeText={handlePasswordInput}
                    secureTextEntry={!showNewPassword}
                  />
                  <TouchableOpacity
                    onPress={() => setShowNewPassword(!showNewPassword)}
                    style={styles.passwordEyeIcon}
                  >
                    <Ionicons
                      name={showNewPassword ? 'eye-off' : 'eye'}
                      size={24}
                      color={Theme.colors.primary}
                    />
                  </TouchableOpacity>
                </View>

                {/* Confirm Password Input Field */}
                <View style={styles.passwordInputField}>
                  <TextInput
                    style={styles.input}
                    placeholder="Confirm Password"
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    secureTextEntry={!showConfirmPassword}
                  />
                  <TouchableOpacity
                    onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                    style={styles.passwordEyeIcon}
                  >
                    <Ionicons
                      name={showConfirmPassword ? 'eye-off' : 'eye'}
                      size={24}
                      color={Theme.colors.primary}
                    />
                  </TouchableOpacity>
                </View>

                {/* Password Strength Indicator */}
                {showPasswordStrength && (
                  <View style={styles.strengthContainer}>
                    <Text style={[styles.strengthText, { fontFamily: 'Poppins-SemiBold' }]}>
                      Password Strength: {passwordStrength.strength}
                    </Text>
                    <View style={styles.strengthBarContainer}>
                      <View
                        style={[
                          styles.strengthBar,
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
                      ['A lowercase letter', passwordStrength.checks.hasLowercase],
                      ['A number', passwordStrength.checks.hasNumber],
                      ['A symbol (!@#$ etc.)', passwordStrength.checks.hasSymbol],
                    ].map(([text, passed], idx) => (
                      <Text
                        key={idx}
                        style={[
                          styles.checkText,
                          { fontFamily: 'Poppins-Regular', color: passed ? '#008000' : '#FF4D4D' },
                        ]}
                      >
                        {passed ? '✅' : '❌'} {text}
                      </Text>
                    ))}
                  </View>
                )}
              </View>
            )}

            {/* Submit Button */}
            {(!termsModalVisible || passwordNeedsReset) && (
              <View style={styles.submission}>
                <TouchableOpacity
                  style={[styles.button, submitting && { opacity: 0.5 }]}
                  onPress={handleChangePassword}
                  disabled={submitting}
                >
                  {submitting ? (
                    <ActivityIndicator color="white" />
                  ) : (
                    <Text style={styles.buttonText}>
                      Submit
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            )}
          </ScrollView>
        </KeyboardAvoidingView>
      </ScrollView>
    </SafeAreaView>
  );
};

export default ProfileScreen;