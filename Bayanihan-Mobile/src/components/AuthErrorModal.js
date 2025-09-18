import React, { useEffect } from 'react';
import { Alert } from 'react-native';
import { signOut } from 'firebase/auth';

const AuthErrorModal = ({
  auth,
  onSignOut,
  navigation,
  setModalConfig,
  setModalVisible,
  setIsLoading,
  setLoadingError,
}) => {
  useEffect(() => {
    const handleAuthError = () => {
      console.warn('No user is logged in');
      setLoadingError('No authenticated user found');

      setModalConfig({
        title: 'Error',
        message: 'Please log in to submit reports',
        confirmText: 'OK',
        onConfirm: async () => {
          setModalVisible(false);
          try {
            await signOut(auth);
            onSignOut();
            navigation.navigate('Login');
          } catch (error) {
            console.error('Sign out error:', error.message);
            Alert.alert('Error', 'Failed to sign out: ' + error.message);
          }
        },
      });

      setModalVisible(true);

      const timeoutId = setTimeout(() => {
        setModalVisible(false);
        navigation.navigate('Login');
      }, 3000);

      return () => clearTimeout(timeoutId);
    };

    handleAuthError();
    setIsLoading(false);
  }, []);

  return null; 
};

export default AuthErrorModal;
