import { sendEmailVerification, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { get, ref } from 'firebase/database';
import { debounce } from 'lodash';
import React, { useCallback, useContext, useState } from 'react';
import { KeyboardAvoidingView, Modal, Pressable, SafeAreaView, StyleSheet, Text, TextInput, ToastAndroid, TouchableOpacity, View } from 'react-native';
import { Ionicons } from 'react-native-vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { auth, database } from '../configuration/firebaseConfig';
import { AuthContext } from '../context/AuthContext';
import Theme from '../constants/theme';
import { styles } from '../styles/LoginScreenStyles';

const LoginScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { setUser } = useContext(AuthContext);

  const handleLogin = useCallback(
  debounce(
    async () => {
      if (!email || !password) {
        ToastAndroid.show('Please enter email and password', ToastAndroid.SHORT);
        return;
      }

      if (isLoading) return;

      setIsLoading(true);
      try {
        console.log('Attempting login with auth:', !!auth);
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        // Fetch user data from Realtime Database
        const userSnapshot = await get(ref(database, `users/${user.uid}`));
        const userData = userSnapshot.val();

        if (!userData) {
          await signOut(auth); // Sign out if no user data exists
          ToastAndroid.show('Contact Support: No account registered in the system.', ToastAndroid.LONG);
          return;
        }

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
          ToastAndroid.show('Invalid email or password', ToastAndroid.SHORT);
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
    >-
    <SafeAreaView  style={styles.container}>
      <KeyboardAvoidingView style={styles.subContainer}>
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
        <Ionicons name="arrow-back" size={28} color="#14AFBC" />
      </TouchableOpacity>
      
      <View blurType="light" blurAmount={80} intensity={50} borderRadius={15} style={styles.formContainer}>
      <View style={styles.contentContainer}>
        <Text style={styles.welcomeText}>Welcome Back!</Text>
      <View style={styles.inputContainer}>
        <Text style={styles.label}>Email:</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter Email"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
        />
      </View>
      <View style={styles.inputContainer}>
        <Text style={styles.label}>Password</Text>
        <View style={styles.passwordContainer}>
          <TextInput
            style={[styles.input, styles.passwordInput]}
            placeholder="Enter Password"
            secureTextEntry={!showPassword}
            value={password}
            onChangeText={setPassword}
          />
          <TouchableOpacity
            style={styles.eyeIcon}
            onPress={() => setShowPassword(!showPassword)}
          >
            <Ionicons
              name={showPassword ? "eye-off" : "eye"}
              size={24}
              color= {Theme.colors.primary}
            />
          </TouchableOpacity>
        </View>
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