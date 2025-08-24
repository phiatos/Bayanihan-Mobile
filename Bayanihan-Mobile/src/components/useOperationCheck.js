import { useEffect, useState } from 'react';
import { useNavigation } from '@react-navigation/native';
import { auth, database } from '../configuration/firebaseConfig';
import { ref as databaseRef, get, query, orderByChild, equalTo } from 'firebase/database';
import AsyncStorage from '@react-native-async-storage/async-storage';

const useOperationCheck = () => {
  const navigation = useNavigation();
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

  const showErrorModal = (title, message, redirectScreen = 'Volunteer Dashboard') => {
    setModalConfig({
      title,
      message,
      onConfirm: () => {
        setModalVisible(false);
        navigation.navigate(redirectScreen);
      },
      confirmText: 'OK',
      showCancel: false,
    });
    setModalVisible(true);
    setTimeout(() => {
      setModalVisible(false);
      navigation.navigate(redirectScreen);
    }, 3000);
  };

  useEffect(() => {
    const checkActiveOperations = async () => {
      const timeoutId = setTimeout(() => {
        showErrorModal('Loading Error', 'Operation timed out while fetching user data.');
      }, 10000);

      try {
        // Load organization name from AsyncStorage
        const storedOrg = await AsyncStorage.getItem('organizationName');
        if (storedOrg) {
          setOrganizationName(storedOrg);
        }

        const user = auth.currentUser;
        if (!user) {
          throw new Error('No authenticated user found');
        }

        const userRef = databaseRef(database, `users/${user.uid}`);
        const userSnapshot = await get(userRef);
        const userData = userSnapshot.val();

        if (!userData) {
          throw new Error('User data not found');
        }

        // Check for password reset requirement
        if (userData.password_needs_reset) {
          showErrorModal('Password Reset Required', 'For security reasons, please change your password.', 'Profile');
          return;
        }

        const userRole = userData.role;
        const orgName = userData.organization || userData.group || storedOrg || '[Unknown Organization]';
        setOrganizationName(orgName);
        await AsyncStorage.setItem('organizationName', orgName);

        if (userRole === 'AB ADMIN') {
          setCanSubmit(true);
        } else if (userRole === 'ABVN') {
          if (orgName === '[Unknown Organization]') {
            showErrorModal('Organization Error', 'Your account is not associated with an organization.');
            return;
          }

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
          } else {
            showErrorModal('No Active Operations', 'Your organization has no active operations. You cannot submit at this time.');
          }
        } else {
          showErrorModal('Permission Error', 'Your role does not permit submission.');
        }
      } catch (error) {
        showErrorModal('Error', `Failed to verify permissions: ${error.message}`);
      } finally {
        clearTimeout(timeoutId);
      }
    };

    const unsubscribeFocus = navigation.addListener('focus', checkActiveOperations);
    checkActiveOperations();

    return () => unsubscribeFocus();
  }, [navigation]);

  return { canSubmit, organizationName, modalVisible, setModalVisible, modalConfig, setModalConfig };
};

export default useOperationCheck;