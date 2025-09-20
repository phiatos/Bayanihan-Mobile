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

const LoginScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const { setUser } = useContext(AuthContext);

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

  const checkEmailExists = async () => {
  try {
    const emailLower = email.toLowerCase();
    const emailRef = ref(database, `users/emailIndex/${emailLower}`);
    const snapshot = await get(emailRef);
    if (snapshot.exists()) {
      const uid = snapshot.val();  // UID as string
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
      console.log(`[${new Date().toISOString()}] Attempting login with:`, email);
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const updatedUser = userCredential.user;
      console.log(`[${new Date().toISOString()}] Login successful, user:`, updatedUser.uid);

      // Now that user is authenticated, fetch their specific data from DB (rules allow owner access)
      const userRef = ref(database, `users/${updatedUser.uid}`);
      const userSnapshot = await get(userRef);
      if (!userSnapshot.exists()) {
        // Edge case: Auth user exists but no DB record (e.g., incomplete signup)
        console.log(`[${new Date().toISOString()}] No DB record for user:`, updatedUser.uid);
        ToastAndroid.show('User account not fully set up. Please register again.', ToastAndroid.SHORT);
        await signOut(auth);
        return;
      }
      const userData = userSnapshot.val();
      console.log(`[${new Date().toISOString()}] User data fetched:`, userData);

      if (updatedUser.emailVerified && !userData.emailVerified) {
        await set(ref(database, `users/${updatedUser.uid}/emailVerified`), true);
        if (userData.isFirstLogin) {
          await set(ref(database, `users/${updatedUser.uid}/isFirstLogin`), false);
        }
        ToastAndroid.show('Email verified successfully!', ToastAndroid.SHORT);
      }

      const isAdmin = userData?.role === 'AB ADMIN';
      if (!isAdmin && !updatedUser.emailVerified) {
        const lastVerificationSent = userData.lastVerificationEmailSent || 0;
        const oneHour = 60 * 60 * 1000;
        const now = Date.now();
        if (now - lastVerificationSent < oneHour) {
          ToastAndroid.show(
            'Email not verified. Check inbox (and spam/junk).',
            ToastAndroid.SHORT
          );
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
          ToastAndroid.show(
            'Verification email sent. Check inbox (spam/junk).',
            ToastAndroid.SHORT
          );
          await signOut(auth);
          return;
        } catch (error) {
          console.error(`[${new Date().toISOString()}] Error sending verification email:`, error.message, error.code || 'N/A');
          if (error.code === 'auth/too-many-requests') {
            ToastAndroid.show(
              'Email not verified. Too many requests. Try later.',
              ToastAndroid.SHORT
            );
          } else {
            ToastAndroid.show('Verification failed: ' + error.message, ToastAndroid.SHORT);
          }
          await signOut(auth);
          return;
        }
      }

      if (userData.isFirstLogin) {
        await set(ref(database, `users/${updatedUser.uid}/isFirstLogin`), false);
      }

      setUser({ id: updatedUser.uid, email: updatedUser.email, ...userData });
      ToastAndroid.show('Login successful.', ToastAndroid.SHORT);
    } catch (error) {
      console.error(`[${new Date().toISOString()}] Auth error:`, error.code, error.message);
      if (error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
        ToastAndroid.show('Password incorrect', ToastAndroid.SHORT);
      } else if (error.code === 'auth/user-not-found') {
        ToastAndroid.show('Email not found.', ToastAndroid.SHORT);
      } else {
        ToastAndroid.show('Login failed: ' + error.message, ToastAndroid.SHORT);
      }
    } finally {
      setIsLoading(false);
      console.log(`[${new Date().toISOString()}] Login attempt completed, isLoading set to false`);
    }
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
    </SafeAreaView>
  );
};

export default LoginScreen;