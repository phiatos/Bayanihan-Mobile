import React, { useContext, useState, useCallback } from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View, SafeAreaView, ToastAndroid } from 'react-native';
import { Ionicons } from 'react-native-vector-icons';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { get, ref } from 'firebase/database';
import { auth, database } from '../configuration/firebaseConfig';
import { AuthContext } from '../context/AuthContext';
import { debounce } from 'lodash';

const LoginScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { setUser } = useContext(AuthContext);

  const handleLogin = useCallback(
    debounce(async () => {
      if (!email || !password) {
        ToastAndroid.show('Please enter email and password', ToastAndroid.BOTTOM);
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

        // If no user data exists, show toast and stop
        if (!userData) {
          ToastAndroid.show('Contact Support: No account registered in the system.', ToastAndroid.BOTTOM);
          setIsLoading(false);
          return;
        }

        setUser({
          id: user.uid,
          contactPerson: userData.contactPerson || user.displayName, 
          email: user.email,
          role: userData.role,
        });

        ToastAndroid.show('Login successful.', ToastAndroid.BOTTOM);
        navigation.navigate('Home')
      } catch (error) {
        setIsLoading(false);
        if (error.code === 'auth/invalid-credential') {
          ToastAndroid.show('Invalid email or password', ToastAndroid.BOTTOM);
        } else {
          ToastAndroid.show(`Error: ${error.message}`, ToastAndroid.BOTTOM);
          console.error('Login error:', error);
        }
      } finally {
        setIsLoading(false);
      }
    }, 1000, { leading: true, trailing: false }),
    [email, password, isLoading, auth, database, setUser]
  );

  return (
    <SafeAreaView style={styles.container}>
      <TouchableOpacity
          onPress={() => navigation.navigate('Onboarding')}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={28} color="#14AFBC" />
        </TouchableOpacity>
      <View style={styles.header}>
        
        <Text style={styles.title}>Welcome Back!</Text>
      </View>
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
        <Text style={styles.label}>
         Password
        </Text>
        <TextInput
          style={styles.input}
          placeholder="Enter Password"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />
        <TouchableOpacity
          style={styles.recoverButton}
          onPress={() => navigation.navigate('RecoveryScreen')}
          disabled={isLoading}
        >
          <Text style={styles.recoverText}>Recover Access</Text>
        </TouchableOpacity>
      </View>
      <TouchableOpacity
        style={[styles.button, isLoading && styles.disabledButton]}
        onPress={handleLogin}
        disabled={isLoading}
      >
        <Text style={styles.buttonText}>{isLoading ? 'Loading...' : 'Log in'}</Text>
      </TouchableOpacity>
      <Text style={styles.termsText}>
        By continuing, you agree to the Terms and Conditions and Privacy Policy.
      </Text>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'flex-start',
    alignItems: 'center',
    backgroundColor: '#FFF9F0',
    padding: 26,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 60,
    width: '100%',
    position: 'relative',
  },
  backButton: {
    position: 'absolute',
    zIndex: 1,
    left: 10,
    top: 25,
    padding: 10,
    paddingTop: 25,
  },
  title: {
    fontSize: 26,
    color: '#14AFBC',
    textAlign: 'center',
    width: '100%',
    paddingTop: 20,
    fontFamily: 'Poppins_Medium',
  },
  inputContainer: {
    width: 300,
    marginBottom: 15,
  },
  label: {
    fontSize: 14,
    fontFamily: 'Poppins_Bold',
    color: '#333',
    marginBottom: 5,
    alignSelf: 'flex-start',
  },
  input: {
    height: 50,
    borderColor: '#ccc',
    borderWidth: 2,
    borderRadius: 10,
    paddingLeft: 10,
    fontSize: 15,
    color: '#444',
    backgroundColor: '#fff',
    fontFamily: 'Poppins_Regular',
  },
  button: {
    backgroundColor: '#14AFBC',
    paddingVertical: 20,
    width: 300,
    paddingHorizontal: 30,
    borderRadius: 15,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 5,
  },
  disabledButton: {
    backgroundColor: '#A1D8D9',
  },
  buttonText: {
    textAlign: 'center',
    color: '#fff',
    fontFamily: 'Poppins_Regular',
    fontSize: 16,
  },
  recoverButton: {
    marginTop: 10,
    marginBottom: 10,
    alignSelf: 'flex-end',
  },
  recoverText: {
    color: '#FB3B9A',
    fontSize: 14,
    textDecorationLine: 'underline',
    fontFamily: 'Poppins_Regular',
  },
  termsText: {
    textAlign: 'center',
    width: '100%',
    lineHeight: 22,
    fontSize: 12,
    color: '#444',
    fontFamily: 'Poppins_Regular',
    marginTop: 250
  },
  errorText: {
    color: 'red',
    fontSize: 12,
    marginTop: 5,
  },
});

export default LoginScreen;