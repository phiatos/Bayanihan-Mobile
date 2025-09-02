import { signInWithEmailAndPassword, sendEmailVerification, signOut } from 'firebase/auth';
import React, { useContext, useState } from 'react';
import { KeyboardAvoidingView, Platform, TouchableOpacity, SafeAreaView, Text, TextInput, ToastAndroid, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { auth, database } from '../configuration/firebaseConfig';
import { AuthContext } from '../context/AuthContext';
import Theme from '../constants/theme';
import { styles } from '../styles/LoginScreenStyles';
import GlobalStyles from '../styles/GlobalStyles';
import { ref, get, set } from 'firebase/database';
import OperationCustomModal from '../components/OperationCustomModal';

const LoginScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [modalMessage, setModalMessage] = useState('');
  const { setUser } = useContext(AuthContext);

  const showToast = (message, duration = ToastAndroid.SHORT) => {
    ToastAndroid.show(message, duration);
  };

  const validateInputs = () => {
    let isValid = true;

    if (!email) {
      setEmailError('Email is required');
      isValid = false;
    } else {
      setEmailError('');
    }

    if (!password) {
      setPasswordError('Password is required');
      isValid = false;
    } else if (password.length < 8) {
      setPasswordError('Password must be at least 8 characters long');
      isValid = false;
    } else {
      setPasswordError('');
    }

    return isValid;
  };

  const handleLogin = async () => {
    if (!validateInputs()) {
      console.log(`[${new Date().toISOString()}] Validation failed:`, { emailError, passwordError });
      return;
    }

    if (isLoading) {
      console.log(`[${new Date().toISOString()}] Login is already in progress`);
      return;
    }

    setIsLoading(true);
    try {
      console.log(`[${new Date().toISOString()}] Attempting login with auth:`, !!auth);
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const updatedUser = userCredential.user;
      console.log(`[${new Date().toISOString()}] Login successful, user:`, updatedUser.uid);

      const userRef = ref(database, `users/${updatedUser.uid}`);
      const userSnapshot = await get(userRef);
      const userData = userSnapshot.exists() ? userSnapshot.val() : {};
      console.log(`[${new Date().toISOString()}] User data fetched:`, userData);

      if (updatedUser.emailVerified && !userData.emailVerified) {
        await set(ref(database, `users/${updatedUser.uid}/emailVerified`), true);
        if (userData.isFirstLogin) {
          await set(ref(database, `users/${updatedUser.uid}/isFirstLogin`), false);
        }
        showToast('Your email has been successfully verified upon login!', ToastAndroid.SHORT);
      }

      const isAdmin = userData?.role === 'AB ADMIN';
      if (!isAdmin && !updatedUser.emailVerified) {
        const lastVerificationSent = userData.lastVerificationEmailSent || 0;
        const oneHour = 60 * 60 * 1000; 
        const now = Date.now();
        if (now - lastVerificationSent < oneHour) {
          setModalMessage(
            userData.isFirstLogin
              ? 'Welcome! Your email address is not verified. A verification email was recently sent to your email address. Please check your inbox (and spam/junk folder) to verify your email and try logging in again.'
              : 'Your email address is not verified. A verification email was recently sent. Please check your inbox (and spam/junk folder) to verify your email and try logging in again.'
          );
          setModalVisible(true);
          await signOut(auth);
          return;
        }

        try {
          const actionCodeSettings = {
            url: 'https://www.angat-bayanihan.com/pages/login.html',
            handleCodeInApp: true,
          };
          await sendEmailVerification(updatedUser, actionCodeSettings);
          await set(ref(database, `users/${updatedUser.uid}/lastVerificationEmailSent`), now);
          setModalMessage(
            userData.isFirstLogin
              ? 'Welcome! Your email address is not verified. A verification email has been sent to your email address. Please verify your email to proceed with login (check spam/junk folder).'
              : 'Your email address is not verified. A new verification email has been sent to your email address. Please verify your email to proceed with login (check spam/junk folder).'
          );
          setModalVisible(true);
          await signOut(auth);
          return;
        } catch (error) {
          console.error(`[${new Date().toISOString()}] Error sending verification email:`, error.message, error.code || 'N/A');
          if (error.code === 'auth/too-many-requests') {
            setModalMessage(
              userData.isFirstLogin
                ? 'Welcome! Your email address is not verified. We couldn’t send a new verification email due to too many requests. Please try again later or check your inbox (and spam/junk folder) for a previous email.'
                : 'Your email address is not verified. We couldn’t send a new verification email due to too many requests. Please try again later or check your inbox (and spam/junk folder) for a previous email.'
            );
          } else {
            setModalMessage(`Failed to send verification email: ${error.message}`);
          }
          setModalVisible(true);
          await signOut(auth);
          return;
        }
      }

      if (userData.isFirstLogin) {
        await set(ref(database, `users/${updatedUser.uid}/isFirstLogin`), false);
      }
      showToast('Login successful.', ToastAndroid.SHORT);
    } catch (error) {
      console.error(`[${new Date().toISOString()}] Error:`, error.code, error.message);
      if (error.code === 'auth/invalid-credential') {
        setModalMessage('Invalid email or password.');
      } else if (error.code === 'auth/user-not-found') {
        setModalMessage('Email not found.');
      } else {
        setModalMessage(error.message);
      }
      setModalVisible(true);
    } finally {
      setIsLoading(false);
      console.log(`[${new Date().toISOString()}] Login attempt completed, isLoading set to false`);
    }
  };

  const handleModalConfirm = () => {
    setModalVisible(false);
    setModalMessage('');
    setEmail('');
    setPassword('');
  };

  const handleModalCancel = () => {
    setModalVisible(false);
    setModalMessage('');
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: Theme.colors.lightBg }]}>
      <KeyboardAvoidingView
        style={styles.subContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <TouchableOpacity
          onPress={() => navigation.navigate('Onboarding')}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={26} color="#14AFBC" />
        </TouchableOpacity>

        <View style={styles.formContainer}>
          <View style={styles.contentContainer}>
            <Text style={styles.welcomeText}>Login</Text>
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Email:</Text>
              <TextInput
                style={[styles.input, emailError && GlobalStyles.inputError]}
                placeholder="Enter Email"
                keyboardType="email-address"
                value={email}
                onChangeText={(text) => {
                  setEmail(text);
                  setEmailError('');
                }}
                autoCapitalize="none"
              />
              {emailError ? <Text style={GlobalStyles.errorText}>{emailError}</Text> : null}
            </View>
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Password</Text>
              <View style={styles.passwordContainer}>
                <TextInput
                  style={[styles.input, styles.passwordInput, passwordError && GlobalStyles.inputError]}
                  placeholder="Enter Password"
                  secureTextEntry={!showPassword}
                  value={password}
                  onChangeText={(text) => {
                    setPassword(text);
                    setPasswordError('');
                  }}
                />
                <TouchableOpacity
                  style={styles.eyeIcon}
                  onPress={() => setShowPassword(!showPassword)}
                >
                  <Ionicons
                    name={showPassword ? 'eye-off' : 'eye'}
                    size={24}
                    color={Theme.colors.primary}
                  />
                </TouchableOpacity>
              </View>
              {passwordError ? <Text style={GlobalStyles.errorText}>{passwordError}</Text> : null}
              <TouchableOpacity
                style={styles.recoverButton}
                onPress={() => navigation.navigate('RecoveryScreen')}
                disabled={isLoading}
              >
                <Text style={styles.recoverText}>Forgot Password</Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity
              style={[styles.button, isLoading && styles.disabledButton]}
              onPress={handleLogin}
              disabled={isLoading}
            >
              <Text style={styles.buttonText}>{isLoading ? 'Loading...' : 'Log in'}</Text>
            </TouchableOpacity>
          </View>
        </View>
        <View style={styles.termsContainer}>
          <Text style={styles.termsText}>
            By continuing, you agree to the Terms and Conditions and Privacy Policy.
          </Text>
        </View>
      </KeyboardAvoidingView>

      <OperationCustomModal
        visible={modalVisible}
        title={modalMessage.includes('not verified') ? 'Email Verification Required' : 'Error'}
        message={
          <View style={GlobalStyles.modalContent}>
            <Ionicons
              name={modalMessage.includes('not verified') ? 'mail-outline' : 'warning-outline'}
              size={60}
              color={modalMessage.includes('not verified') ? Theme.colors.primary : Theme.colors.red}
              style={GlobalStyles.modalIcon}
            />
            <Text style={GlobalStyles.modalMessage}>{modalMessage}</Text>
          </View>
        }
        onConfirm={handleModalConfirm}
        onCancel={handleModalCancel}
        confirmText={modalMessage.includes('not verified') ? 'OK' : 'Retry'}
        showCancel={modalMessage.includes('not verified') ? false : true}
      />
    </SafeAreaView>
  );
};

export default LoginScreen;