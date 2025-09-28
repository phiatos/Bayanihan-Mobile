import { useEffect, useState } from 'react';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { database } from '../configuration/firebaseConfig';
import { ref as databaseRef, get, query, orderByChild, equalTo } from 'firebase/database';
import AsyncStorage from '@react-native-async-storage/async-storage';

const useOperationCheck = () => {
  const navigation = useNavigation();
  const { user } = useAuth();
  const [canSubmit, setCanSubmit] = useState(false);
  const [organizationName, setOrganizationName] = useState(null);
  const [modalConfig, setModalConfig] = useState({
    title: '',
    message: '',
    onConfirm: () => {},
    confirmText: 'OK',
    showCancel: false,
  });
  const [modalVisible, setModalVisible] = useState(false);

  const showErrorModal = (title, message, redirectScreen = null) => {
    console.log(`showErrorModal: ${title}`);
    setModalConfig({
      title,
      message,
      onConfirm: () => {
        setModalVisible(false);
        if (redirectScreen) {
          navigation.navigate(redirectScreen);
        }
      },
      confirmText: 'OK',
      showCancel: false,
    });
    setModalVisible(true);
  };

  useEffect(() => {
    const checkActiveOperations = async () => {
      const timeoutId = setTimeout(() => {
        showErrorModal('Loading Error', 'Operation timed out while fetching user data.');
      }, 10000);

      try {
        let currentUser = user;
        if (!currentUser) {
          const cachedUser = await AsyncStorage.getItem('user_session');
          if (cachedUser) {
            console.log('useOperationCheck: No user in AuthContext, using cached user:', JSON.parse(cachedUser).id);
            currentUser = JSON.parse(cachedUser);
          } else {
            console.log('useOperationCheck: No authenticated user or cached user found');
            showErrorModal('Authentication Error', 'Please log in to continue.', 'Login');
            return;
          }
        }

        const userRole = currentUser.role;
        const orgName = currentUser.organization || currentUser.group || 'Admin';
        setOrganizationName(orgName);
        console.log('useOperationCheck: userRole=', userRole, 'orgName=', orgName);

        const userRef = databaseRef(database, `users/${currentUser.id}`);
        let userData = null;
        try {
          const userSnapshot = await get(userRef);
          userData = userSnapshot.val();
        } catch (error) {
          console.warn('useOperationCheck: Failed to fetch user data:', error.message);
          userData = currentUser;
        }

        if (!userData) {
          console.warn('useOperationCheck: No user data in database, using cached data');
          userData = currentUser; 
        }

        if (userData.password_needs_reset) {
          showErrorModal('Password Reset Required', 'For security reasons, please change your password.', 'Profile');
          return;
        }

        if (userRole === 'AB ADMIN') {
          setCanSubmit(true);
          console.log('useOperationCheck: AB ADMIN role, canSubmit=true');
        } else if (userRole === 'ABVN') {
          try {
            const activationsRef = query(
              databaseRef(database, 'activations'),
              orderByChild('organization'),
              equalTo(orgName)
            );
            const activationsSnapshot = await get(activationsRef);
            let hasActiveActivations = false;
            activationsSnapshot.forEach((childSnapshot) => {
              if (childSnapshot.val().status === 'active') {
                hasActiveActivations = true;
                return true;
              }
            });

            if (hasActiveActivations) {
              setCanSubmit(true);
              console.log('useOperationCheck: Active operations found, canSubmit=true');
            } else {
              showErrorModal('No Active Operations', 'Your organization has no active operations. You cannot submit at this time.', 'Volunteer Dashboard');
            }
          } catch (error) {
            console.warn('useOperationCheck: Failed to fetch activations:', error.message);
            showErrorModal('Error', 'Failed to verify active operations. Please try again later.', 'Volunteer Dashboard');
          }
        } else {
          showErrorModal('Permission Error', 'Your role does not permit submission.', 'Volunteer Dashboard');
        }
      } catch (error) {
        console.error('useOperationCheck: Error checking operations:', error.message);
        showErrorModal('Error', `Failed to verify permissions: ${error.message}`, 'Volunteer Dashboard');
      } finally {
        clearTimeout(timeoutId);
      }
    };

    const unsubscribeFocus = navigation.addListener('focus', checkActiveOperations);
    checkActiveOperations();

    return () => unsubscribeFocus();
  }, [navigation, user]);

  return { canSubmit, organizationName, modalVisible, setModalVisible, modalConfig, setModalConfig };
};

export default useOperationCheck;