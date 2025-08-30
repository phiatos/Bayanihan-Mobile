import { useState, useEffect } from 'react';
import { get, ref as databaseRef } from 'firebase/database';
import { database } from '../configuration/firebaseConfig';
import { checkAuthState } from '../utils/sessionUtils';

const useOperationCheck = () => {
  const [canSubmit, setCanSubmit] = useState(false);
  const [organizationName, setOrganizationName] = useState('[Unknown Organization]');
  const [modalVisible, setModalVisible] = useState(false);
  const [modalConfig, setModalConfig] = useState({ title: '', message: '', onConfirm: () => {}, confirmText: 'OK' });
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const checkUserPermissions = async () => {
      setIsChecking(true);
      console.log(`[${new Date().toISOString()}] Starting permission check`);
      const user = await checkAuthState();

      if (!user) {
        console.warn(`[${new Date().toISOString()}] No user found, cannot submit`);
        setCanSubmit(false);
        setIsChecking(false);
        // Navigation to Login should be handled by the component, not here
        return;
      }

      try {
        const userRef = databaseRef(database, `users/${user.uid}`);
        const userSnapshot = await get(userRef);
        const userData = userSnapshot.val();

        if (!userData) {
          console.error(`[${new Date().toISOString()}] User data not found for UID:`, user.uid);
          setModalConfig({
            title: 'Error',
            message: 'Your user profile is incomplete. Please contact support.',
            onConfirm: () => setModalVisible(false),
            confirmText: 'OK',
          });
          setModalVisible(true);
          setCanSubmit(false);
          setIsChecking(false);
          return;
        }

        if (userData.password_needs_reset) {
          console.warn(`[${new Date().toISOString()}] Password reset required for UID:`, user.uid);
          setModalConfig({
            title: 'Password Reset Required',
            message: 'For security reasons, please change your password.',
            onConfirm: () => setModalVisible(false),
            confirmText: 'OK',
          });
          setModalVisible(true);
          setCanSubmit(false);
          setIsChecking(false);
          return;
        }

        const hasPermission = userData.role === 'AB ADMIN' || userData.role === 'ABVN';
        setCanSubmit(hasPermission);
        setOrganizationName(userData.organization || '[Unknown Organization]');
        console.log(`[${new Date().toISOString()}] Permission check complete: canSubmit=${hasPermission}, organization=${userData.organization || '[Unknown Organization]'}`);
        setIsChecking(false);
      } catch (error) {
        console.error(`[${new Date().toISOString()}] Error checking permissions:`, error.message);
        setModalConfig({
          title: 'Error',
          message: `Failed to check permissions: ${error.message}`,
          onConfirm: () => setModalVisible(false),
          confirmText: 'OK',
        });
        setModalVisible(true);
        setCanSubmit(false);
        setIsChecking(false);
      }
    };

    checkUserPermissions();
  }, []);

  return { canSubmit, organizationName, modalVisible, setModalVisible, modalConfig, setModalConfig, isChecking };
};

export default useOperationCheck;