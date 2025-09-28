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
    console.log(`useOperationCheck: showErrorModal: ${title} - ${message}`);
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
        // Normalize organization name for comparison
        const orgName = (currentUser.organization || currentUser.group || 'Admin').trim().toLowerCase();
        setOrganizationName(currentUser.organization || currentUser.group || 'Admin');
        console.log('useOperationCheck: userRole=', userRole, 'orgName=', orgName);

        const userRef = databaseRef(database, `users/${currentUser.id}`);
        let userData = null;
        try {
          const userSnapshot = await get(userRef);
          userData = userSnapshot.val();
        } catch (error) {
          console.warn('useOperationCheck: Failed to fetch user data:', error.message, error.code || 'N/A');
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
              databaseRef(database, 'activations/'),
              orderByChild('organization'),
              equalTo(currentUser.organization || currentUser.group || 'Admin')
            );
            const activationsSnapshot = await get(activationsRef);
            console.log('useOperationCheck: Query executed for organization:', currentUser.organization || currentUser.group || 'Admin');
            console.log('useOperationCheck: Activations snapshot exists:', activationsSnapshot.exists());

            let hasActiveActivations = false;
            if (activationsSnapshot.exists()) {
              const activations = [];
              activationsSnapshot.forEach((childSnapshot) => {
                const activation = childSnapshot.val();
                activations.push({ id: childSnapshot.key, ...activation });
                console.log('useOperationCheck: Activation found:', {
                  id: childSnapshot.key,
                  organization: activation.organization,
                  status: activation.status,
                });
                if (activation.status === 'active') {
                  hasActiveActivations = true;
                }
              });
              console.log('useOperationCheck: All activations:', activations);
            } else {
              console.log('useOperationCheck: No activations found for organization:', currentUser.organization || currentUser.group || 'Admin');
            }

            if (hasActiveActivations) {
              setCanSubmit(true);
              console.log('useOperationCheck: Active operations found, canSubmit=true');
            } else {
              // Try partial match for organization name
              const allActivationsRef = databaseRef(database, 'activations/currentActivations');
              const allActivationsSnapshot = await get(allActivationsRef);
              let fallbackActive = false;
              if (allActivationsSnapshot.exists()) {
                allActivationsSnapshot.forEach((childSnapshot) => {
                  const activation = childSnapshot.val();
                  const activationOrg = (activation.organization || '').trim().toLowerCase();
                  if (activationOrg.includes(orgName) && activation.status === 'active') {
                    console.log('useOperationCheck: Fallback match found:', {
                      id: childSnapshot.key,
                      organization: activation.organization,
                      status: activation.status,
                    });
                    fallbackActive = true;
                  }
                });
              }

              if (fallbackActive) {
                setCanSubmit(true);
                console.log('useOperationCheck: Fallback active operations found, canSubmit=true');
              } else {
                showErrorModal(
                  'No Active Operations',
                  'Your organization has no active operations. You cannot submit at this time.',
                  'Volunteer Dashboard'
                );
              }
            }
          } catch (error) {
            console.warn('useOperationCheck: Failed to fetch activations:', error.message, error.code || 'N/A');
            showErrorModal(
              'Error',
              'Failed to verify active operations. Please try again later.',
              'Volunteer Dashboard'
            );
          }
        } else {
          showErrorModal('Permission Error', 'Your role does not permit submission.', 'Volunteer Dashboard');
        }
      } catch (error) {
        console.error('useOperationCheck: Error checking operations:', error.message, error.code || 'N/A');
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