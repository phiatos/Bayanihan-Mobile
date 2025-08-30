import { sendEmailVerification, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import React, { useContext, useState } from 'react';
import { KeyboardAvoidingView, Modal, Platform, Pressable, SafeAreaView, StyleSheet, Text, TextInput, ToastAndroid, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { auth } from '../configuration/firebaseConfig';
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
      console.log('Validation failed:', { emailError, passwordError });
      return;
    }

    if (isLoading) {
      console.log('Login is already in progress');
      return;
    }

    setIsLoading(true);
    try {
      console.log('Attempting login with auth:', !!auth);
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // AuthContext's onAuthStateChanged will handle user data fetching and session storage
      console.log('Login successful, user:', user.uid);

      // Navigation is handled by AuthContext and AuthStack
      ToastAndroid.show('Login successful.', ToastAndroid.SHORT);
    } catch (error) {
      console.error('Login error:', error.code, error.message);
      if (error.code === 'auth/invalid-credential') {
        ToastAndroid.show('Invalid email or password.', ToastAndroid.SHORT);
      } else if (error.code === 'auth/user-not-found') {
        ToastAndroid.show('Email not found.', ToastAndroid.SHORT);
      } else {
        ToastAndroid.show(`Error: ${error.message}`, ToastAndroid.LONG);
      }
    } finally {
      setIsLoading(false);
      console.log('Login attempt completed, isLoading set to false');
    }
  };

  return (
      <SafeAreaView style={[styles.container, { backgroundColor: Theme.colors.lightBg }]}>
        <KeyboardAvoidingView
          style={styles.subContainer}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
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
    // </LinearGradient>
  );
};

export default LoginScreen;