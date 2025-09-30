import { signInWithEmailAndPassword, sendEmailVerification, signOut, setPersistence, getReactNativePersistence } from 'firebase/auth';
import React, { useContext, useState } from 'react';
import { KeyboardAvoidingView, Platform, TouchableOpacity, SafeAreaView, Text, TextInput, ToastAndroid, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { auth, database } from '../configuration/firebaseConfig';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthContext } from '../context/AuthContext';
import Theme from '../constants/theme';
import { styles } from '../styles/LoginScreenStyles';
import GlobalStyles from '../styles/GlobalStyles';
import { ref, get, set } from 'firebase/database';

const clearError = (setErrorFunction) => {
  setErrorFunction('');
};

const displayError = (setErrorFunction, message) => {
  setErrorFunction(message);
};

const validateEmail = (email, setEmailError) => {
  if (!email) {
    displayError(setEmailError, 'Email is required.');
    return false;
  }
  clearError(setEmailError);
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailPattern.test(email)) {
    displayError(setEmailError, 'Please enter a valid email address.');
    return false;
  }
  return true;
};

const validatePassword = (password, setPasswordError) => {
  if (!password) {
    displayError(setPasswordError, 'Password is required.');
    return false;
  }
  clearError(setPasswordError);
  if (password.length < 8) {
    displayError(setPasswordError, 'Password must be at least 8 characters long.');
    return false;
  }
  return true;
};

const LoginScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const { setUser } = useContext(AuthContext);

  const checkEmailExists = async () => {
    try {
      const emailLower = email.toLowerCase();
      const emailRef = ref(database, `users/emailIndex/${emailLower}`);
      const snapshot = await get(emailRef);
      if (snapshot.exists()) {
        const uid = snapshot.val();
        const userRef = ref(database, `users/${uid}`);
        const userSnapshot = await get(userRef);
        if (userSnapshot.exists()) {
          return { uid, userData: userSnapshot.val() };
        }
      }
      return null;
    } catch (error) {
      console.error('Error checking email:', error);
      return null;
    }
  };

  const handleLogin = async () => {
    const isEmailValid = validateEmail(email, setEmailError);
    const isPasswordValid = validatePassword(password, setPasswordError);

    if (!isEmailValid || !isPasswordValid) {
      return;
    }

    if (isLoading) {
      return;
    }

    setIsLoading(true);
    try {
      await setPersistence(auth, getReactNativePersistence(AsyncStorage));
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const updatedUser = userCredential.user;

      const userRef = ref(database, `users/${updatedUser.uid}`);
      const userSnapshot = await get(userRef);
      if (!userSnapshot.exists()) {
        ToastAndroid.show('User account not fully set up. Please register again.', ToastAndroid.SHORT);
        await signOut(auth);
        navigation.reset({
          index: 0,
          routes: [{ name: 'Login' }],
        });
        return;
      }
      const userData = userSnapshot.val();

      const isAdmin = userData?.role === 'AB ADMIN';
      if (!isAdmin && !updatedUser.emailVerified) {
        const lastVerificationSent = userData.lastVerificationEmailSent || 0;
        const oneHour = 60 * 60 * 1000;
        const now = Date.now();
        if (now - lastVerificationSent < oneHour) {
          ToastAndroid.show(
            'Verification email sent. Check inbox (and spam/junk).',
            ToastAndroid.SHORT
          );
          await signOut(auth);
          navigation.reset({
            index: 0,
            routes: [{ name: 'Login' }],
          });
          return;
        }

        try {
          const actionCodeSettings = {
            url: 'https://www.angat-bayanihan.com/pages/login.html',
            handleCodeInApp: true,
          };
          await sendEmailVerification(updatedUser, actionCodeSettings);
          await set(ref(database, `users/${updatedUser.uid}/lastVerificationEmailSent`), now);
          ToastAndroid.show(
            'Verification email sent. Check inbox (spam/junk).',
            ToastAndroid.SHORT
          );
          await signOut(auth);
          navigation.reset({
            index: 0,
            routes: [{ name: 'Login' }],
          });
          return;
        } catch (error) {
          console.error(`[${new Date().toISOString()}] Error sending verification email:`, error.message, error.code || 'N/A');
          if (error.code === 'auth/too-many-requests') {
            ToastAndroid.show(
              'Too many requests. Try again later.',
              ToastAndroid.SHORT
            );
          } else {
            ToastAndroid.show('Verification failed: ' + error.message, ToastAndroid.SHORT);
          }
          await signOut(auth);
          navigation.reset({
            index: 0,
            routes: [{ name: 'Login' }],
          });
          return;
        }
      }

      if (updatedUser.emailVerified && !userData.emailVerified) {
        await set(ref(database, `users/${updatedUser.uid}/emailVerified`), true);
        if (userData.isFirstLogin) {
          await set(ref(database, `users/${updatedUser.uid}/isFirstLogin`), false);
        }
        ToastAndroid.show('Email verified successfully!', ToastAndroid.SHORT);
      }

      if (userData.isFirstLogin) {
        await set(ref(database, `users/${updatedUser.uid}/isFirstLogin`), false);
      }

      setUser({ id: updatedUser.uid, email: updatedUser.email, ...userData });
      ToastAndroid.show('Login successful.', ToastAndroid.SHORT);
    } catch (error) {
      console.error(`[${new Date().toISOString()}] Auth error:`, error.code, error.message);
      if (error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
        displayError(setPasswordError, 'Password incorrect');
        return;
      } else if (error.code === 'auth/user-not-found') {
        displayError(setEmailError, 'Email not found.');
        return;
      } else {
        ToastAndroid.show('Login failed: ' + error.message, ToastAndroid.SHORT);
        return;
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: Theme.colors.lightBg }]}>
      <KeyboardAvoidingView
        style={styles.subContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <TouchableOpacity
          onPress={() => navigation.navigate('Onboarding')}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={26} color={Theme.colors.primary} />
        </TouchableOpacity>

        <View style={styles.formContainer}>
          <View style={styles.contentContainer}>
            <Text style={styles.welcomeText}>Login</Text>
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Email:</Text>
              <TextInput
                style={[styles.input, emailError && GlobalStyles.inputError]}
                placeholder="Enter Email"
                 placeholderTextColor={Platform.select({
                    ios: Theme.colors.placeholder || '#777777ff',
                    android: Theme.colors.placeholder || '#777777ff',
                  })}
                keyboardType="email-address"
                value={email}
                onChangeText={(text) => {
                  setEmail(text);
                  clearError(setEmailError);
                }}
                onFocus={() => clearError(setEmailError)}
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
                  placeholderTextColor={Platform.select({
                    ios: Theme.colors.placeholder || '#777777ff',
                    android: Theme.colors.placeholder || '#777777ff',
                  })}
                  secureTextEntry={!showPassword}
                  value={password}
                  onChangeText={(text) => {
                    setPassword(text);
                    clearError(setPasswordError);
                  }}
                  onFocus={() => clearError(setPasswordError)}
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
    </SafeAreaView>
  );
};

export default LoginScreen;