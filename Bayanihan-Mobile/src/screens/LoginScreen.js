import React, { useState, useContext } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  SafeAreaView,
  Text,
  TextInput,
  ToastAndroid,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { AuthContext } from '../context/AuthContext';
import { debounce } from 'lodash';
import Theme from '../constants/theme';
import { styles } from '../styles/LoginScreenStyles';
import { database } from '../configuration/firebaseConfig';
import bcrypt from 'react-native-bcrypt';

const LoginScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const { handleLogin } = useContext(AuthContext);

  const validateEmail = (emailValue) => {
    const newErrors = { ...errors };
    if (!emailValue) {
      newErrors.email = 'Email is required.';
      setErrors(newErrors);
      return false;
    }
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(emailValue)) {
      newErrors.email = 'Please enter a valid email address.';
      setErrors(newErrors);
      return false;
    }
    delete newErrors.email;
    setErrors(newErrors);
    return true;
  };

  const validatePassword = (passwordValue) => {
    const newErrors = { ...errors };
    if (!passwordValue) {
      newErrors.password = 'Password is required.';
      setErrors(newErrors);
      return false;
    }
    if (passwordValue.length < 8) {
      newErrors.password = 'Password must be at least 8 characters long.';
      setErrors(newErrors);
      return false;
    }
    delete newErrors.password;
    setErrors(newErrors);
    return true;
  };

  const checkDatabasePassword = async (email, password, retryCount = 0, maxRetries = 2) => {
    try {
      const usersSnapshot = await database()
        .ref('users')
        .orderByChild('email')
        .equalTo(email.toLowerCase())
        .once('value');

      if (!usersSnapshot.exists()) {
        return { valid: false, error: 'Email not found.' };
      }

      let passwordMatches = false;
      usersSnapshot.forEach((childSnapshot) => {
        const userData = childSnapshot.val();
        if (bcrypt.compareSync(password, userData.password)) { // Assumes password is hashed
          passwordMatches = true;
        }
      });

      if (!passwordMatches) {
        return { valid: false, error: 'Password does not match.' };
      }

      return { valid: true };
    } catch (error) {
      console.error('Database password check error:', error);
      if (retryCount < maxRetries && error.code === 'unavailable') {
        console.log(`Retrying database check (${retryCount + 1}/${maxRetries})...`);
        await new Promise(resolve => setTimeout(resolve, 1000));
        return checkDatabasePassword(email, password, retryCount + 1, maxRetries);
      }
      return { valid: false, error: `Database error: ${error.message}` };
    }
  };

  const onLogin = debounce(
    async () => {
      const isEmailValid = validateEmail(email);
      const isPasswordValid = validatePassword(password);

      if (!isEmailValid || !isPasswordValid) {
        return;
      }

      if (isLoading) return;

      setIsLoading(true);
      try {
        // Check password in Realtime Database
        const dbCheck = await checkDatabasePassword(email, password);
        if (!dbCheck.valid) {
          ToastAndroid.show(dbCheck.error, ToastAndroid.SHORT);
          setIsLoading(false);
          return;
        }

        // Proceed with Firebase Authentication
        await handleLogin(email, password);
        ToastAndroid.show('Login successful.', ToastAndroid.SHORT);
      } catch (error) {
        console.error('Login error:', error);
        if (error.code === 'auth/invalid-credential') {
          ToastAndroid.show('Invalid email or password', ToastAndroid.SHORT);
        } else if (error.code === 'auth/email-not-verified') {
          setModalVisible(true);
          ToastAndroid.show('Please verify your email to log in.', ToastAndroid.LONG);
        } else {
          ToastAndroid.show(`Error: ${error.message}`, ToastAndroid.LONG);
        }
      } finally {
        setIsLoading(false);
      }
    },
    1000,
    { leading: true, trailing: false }
  );

  return (
    <LinearGradient
      colors={['rgba(250, 59, 154, 0.43)', '#FFF9F0']}
      start={{ x: 0.5, y: 1 }}
      end={{ x: 0.5, y: 0 }}
      style={styles.gradientContainer}
    >
      <SafeAreaView style={styles.container}>
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
              <Text style={styles.welcomeText}>Welcome Back!</Text>
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Email:</Text>
                <TextInput
                  style={[styles.input, errors.email && styles.inputError]}
                  placeholder="Enter Email"
                  keyboardType="email-address"
                  value={email}
                  onChangeText={(text) => {
                    setEmail(text);
                    validateEmail(text);
                  }}
                  autoCapitalize="none"
                />
                {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}
              </View>
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Password</Text>
                <View style={styles.passwordContainer}>
                  <TextInput
                    style={[styles.input, styles.passwordInput, errors.password && styles.inputError]}
                    placeholder="Enter Password"
                    secureTextEntry={!showPassword}
                    value={password}
                    onChangeText={(text) => {
                      setPassword(text);
                      validatePassword(text);
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
                {errors.password && <Text style={styles.errorText}>{errors.password}</Text>}
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
                onPress={onLogin}
                disabled={isLoading}
              >
                <Text style={styles.buttonText}>{isLoading ? 'Loading...' : 'Log in'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
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