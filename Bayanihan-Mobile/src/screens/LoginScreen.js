import { sendEmailVerification, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { get, ref } from 'firebase/database';
import { debounce } from 'lodash';
import React, { useCallback, useContext, useState } from 'react';
import { KeyboardAvoidingView, Modal, Platform, Pressable, SafeAreaView, StyleSheet, Text, TextInput, ToastAndroid, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { auth, database } from '../configuration/firebaseConfig';
import { AuthContext } from '../context/AuthContext';
import Theme from '../constants/theme';
import { styles } from '../styles/LoginScreenStyles';
import GlobalStyles from '../styles/GlobalStyles';


const LoginScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const { setUser } = useContext(AuthContext);

  const validateInputs = () => {
    let isValid = true;
    
    // Check if email is empty
    if (!email) {
      setEmailError('Email is required');
      isValid = false;
    } else {
      setEmailError('');
    }

    // Check if password is empty or too short
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
      // Query the users node to find if email exists
      const usersRef = ref(database, 'users');
      const snapshot = await get(usersRef);
      if (snapshot.exists()) {
        const users = snapshot.val();
        // Check if any user has the provided email
        const userId = Object.keys(users).find(uid => users[uid].email === email);
        return userId ? { uid: userId, userData: users[userId] } : null;
      }
      return null;
    } catch (error) {
      console.error('Error checking email:', error);
      return null;
    }
  };

  const handleLogin = useCallback(
    debounce(
      async () => {
        if (!validateInputs()) {
          return;
        }

        if (isLoading) return;

        setIsLoading(true);
        try {
          // First, check if email exists in database
          const emailCheck = await checkEmailExists();
          
          if (!emailCheck) {
            ToastAndroid.show('Email not found.', ToastAndroid.SHORT);
            return;
          }

          // Proceed with authentication
          console.log('Attempting login with auth:', !!auth);
          const userCredential = await signInWithEmailAndPassword(auth, email, password);
          const user = userCredential.user;
          const userData = emailCheck.userData;

          // Check for email verification (skipped for admins)
          const isAdmin = userData?.role === 'AB ADMIN' || userData?.role === 'admin';
          if (!isAdmin && !user.emailVerified) {
            const actionCodeSettings = {
              url: 'https://bayanihan-5ce7e.firebaseapp.com',
              handleCodeInApp: false,
            };
            await sendEmailVerification(user, actionCodeSettings);
            await signOut(auth);
            setModalVisible(true);
            ToastAndroid.show('Please verify your email to log in.', ToastAndroid.LONG);
            return;
          }

          // Set user in AuthContext to trigger navigation to AppStack
          setUser({
            id: user.uid,
            contactPerson: userData.contactPerson || user.displayName || 'Unknown',
            email: user.email,
            role: userData.role,
          });

          ToastAndroid.show('Login successful.', ToastAndroid.SHORT);
        } catch (error) {
          if (error.code === 'auth/invalid-credential') {
            ToastAndroid.show('Password does not match.', ToastAndroid.SHORT);
          } else {
            ToastAndroid.show(`Error: ${error.message}`, ToastAndroid.LONG);
            console.error('Login error:', error);
          }
        } finally {
          setIsLoading(false);
        }
      },
      1000,
      { leading: true, trailing: false }
    ),
    [email, password, isLoading, auth, database, setUser]
  );

  return (
    <LinearGradient
      colors={['rgba(250, 59, 154, 0.43)', '#FFF9F0']}
      start={{ x: 0.5, y: 1 }}
      end={{ x: 0.5, y: 0 }}
      style={styles.gradientContainer}
    >
      <SafeAreaView style={styles.container}>
        <View style={styles.subContainer} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <Modal
            animationType="slide"
            transparent={true}
            visible={modalVisible}
            onRequestClose={() => setModalVisible(false)}
          >
            <View style={styles.modalOverlay}>
              <View style={styles.modalView}>
                <Text style={styles.modalText}>
                  Your email address is not verified. A verification email has been sent to your email address. Please verify your email to proceed with login (check spam/junk folder).
                </Text>
                <Pressable
                  style={styles.modalButton}
                  onPress={() => setModalVisible(false)}
                >
                  <Text style={styles.modalButtonText}>OK</Text>
                </Pressable>
              </View>
            </View>
          </Modal>

          <TouchableOpacity
            onPress={() => navigation.navigate('Onboarding')}
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={26} color="#14AFBC" />
          </TouchableOpacity>

          <View style={styles.formContainer}>
            <View style={styles.contentContainer}>
              <Text style={styles.welcomeText}>Welcome Back!</Text>
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
        </View>
        <View style={styles.termsContainer}>
          <Text style={styles.termsText}>
            By continuing, you agree to the Terms and Conditions and Privacy Policy.
          </Text>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
};

export default LoginScreen;