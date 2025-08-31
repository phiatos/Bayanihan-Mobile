import { useEffect, useState } from 'react';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext'; // Import useAuth
import { database } from '../configuration/firebaseConfig';
import { ref as databaseRef, get, query, orderByChild, equalTo } from 'firebase/database';

const useOperationCheck = () => {
  const navigation = useNavigation();
  const { user } = useAuth(); // Get user from AuthContext
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
        if (!user) {
          throw new Error('No authenticated user found');
        }

        // User data from AuthContext
        const userRole = user.role;
        const orgName = user.organization || user.group || 'Admin';
        setOrganizationName(orgName);

        // Check for password reset requirement (if stored in user object)
        // Note: If password_needs_reset is stored in the database, fetch it separately
        const userRef = databaseRef(database, `users/${user.id}`);
        const userSnapshot = await get(userRef);
        const userData = userSnapshot.val();

        if (!userData) {
          throw new Error('User data not found');
        }

        if (userData.password_needs_reset) {
          showErrorModal('Password Reset Required', 'For security reasons, please change your password.', 'Profile');
          return;
        }

        if (userRole === 'AB ADMIN') {
          setCanSubmit(true);
        } else if (userRole === 'ABVN') {
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
  }, [navigation, user]); 

  return { canSubmit, organizationName, modalVisible, setModalVisible, modalConfig, setModalConfig };
};

export default useOperationCheck; 