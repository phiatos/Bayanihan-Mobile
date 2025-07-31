import React, { useContext, useState, useEffect } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { DrawerContentScrollView, DrawerItemList } from '@react-navigation/drawer';
import Ionicons from '@expo/vector-icons/Ionicons';
import { MaterialIcons } from '@expo/vector-icons';
import styles from '../styles/CustomDrawerStyles';
import Theme from '../constants/theme';
import { signOut } from 'firebase/auth';
import { auth } from '../configuration/firebaseConfig';
import { getDatabase, ref, get } from 'firebase/database';
import { AuthContext } from '../context/AuthContext';
import CustomModal from './CustomModal';

const CustomDrawer = (props) => {
  const { onSignOut, navigation } = props; 
  const { user } = useContext(AuthContext);
  const [modalVisible, setModalVisible] = useState(false);
  const [errorModal, setErrorModal] = useState({ visible: false, message: '' });
  const [organizationName, setOrganizationName] = useState(null);
  const [role, setRole] = useState('N/A');
  const [adminPosition, setAdminPosition] = useState('N/A');
  const [contactPerson, setContactPerson] = useState(null);
  const [firstName, setFirstName] = useState(null);
  const [lastName, setLastName] = useState(null);
  const [isLoading, setIsLoading] = useState(true);


  useEffect(() => {
      const fetchUserData = async (retryCount = 0, maxRetries = 2) => {
      setIsLoading(true);
      if (!user?.id) {
        console.warn('No user ID available');
        setErrorModal({
          visible: true,
          message: 'No user ID available. Please log in again.',
        });
        setOrganizationName(null);
        setRole('N/A');
        setAdminPosition('N/A');
        setContactPerson(null);
        setFirstName(null);
        setLastName(null);
        setIsLoading(false);
        return;
      }

      try {
      const db = getDatabase();
        const userRef = ref(db, `users/${user.id}`);
        const snapshot = await get(userRef);

        if (snapshot.exists()) {
          const userData = snapshot.val();
          setOrganizationName(userData.organization || null);
          setRole(userData.role || 'N/A');
          setAdminPosition(userData.adminPosition || 'N/A');
          setContactPerson(userData.contactPerson || null);
          setFirstName(userData.firstName || null);
          setLastName(userData.lastName || null);
        } else {
          console.warn('No user document found for ID:', user.id);
          setErrorModal({
            visible: true,
            message: 'No user profile found in database.',
          });
          setOrganizationName(null);
          setRole('N/A');
          setAdminPosition('N/A');
          setContactPerson(null);
          setFirstName(null);
          setLastName(null);
        }
      } catch (error) {
        console.error('Error fetching user data:', error.message, error.code);
        if (retryCount < maxRetries && error.code === 'unavailable') {
          console.log(`Retrying fetch (${retryCount + 1}/${maxRetries})...`);
          setTimeout(() => fetchUserData(retryCount + 1, maxRetries), 1000); 
        } else {
          setErrorModal({
            visible: true,
            message: `Failed to fetch user data: ${error.message}`,
          });
          setOrganizationName(null);
          setRole('N/A');
          setAdminPosition('N/A');
          setContactPerson(null);
          setFirstName(null);
          setLastName(null);
        }
      } finally {
        setIsLoading(false);
      }
    };

    if (user?.id) {
      fetchUserData();
    } else {
      setIsLoading(false);
    }
  }, [user?.id]);

  const handleShowLogoutModal = () => {
    setModalVisible(true);
  };

  const handleConfirmLogout = async () => {
    setModalVisible(false);
    try {
      await signOut(auth);
      onSignOut();
      navigation.navigate('Login'); // Use props.navigation
    } catch (error) {
      console.error('Sign out error:', error.message);
      Alert.alert('Error', 'Failed to sign out: ' + error.message);
    }
  };

   // Determine user name display: contactPerson or firstName + lastName
  const getUserName = () => {
    if (contactPerson) {
      return contactPerson;
    }
    if (firstName || lastName) {
      return `${firstName || ''} ${lastName || ''}`.trim();
    }
    return 'Unknown User';
  };

  // Determine display text: organization for ABVN, or adminPosition for ADMIN
  const getDisplayText = () => {
    if (isLoading) {
      return <ActivityIndicator size="small" color={Theme.colors.grey} />;
    }
    if (role === 'ABVN' && organizationName) {
      return <Text style={styles.organization}>{organizationName}</Text>;
    }
    if (role === 'AB ADMIN' && adminPosition !== 'N/A') {
      return <Text style={styles.organization}>{`ADMIN (${adminPosition.toUpperCase()})`}</Text>;
    }
    if (role === 'AB ADMIN') {
      return <Text style={styles.organization}>ADMIN</Text>;
    }
    return <Text style={styles.organization}>{role}</Text>;
  };

  const handleCancelLogout = () => {
    setModalVisible(false);
  };

  return (
    <View style={styles.container}>
      <DrawerContentScrollView
        {...props}
        contentContainerStyle={styles.drawerScroll}
      >
        <TouchableOpacity onPress={()=>navigation.navigate("Profile")} style={styles.userHeader}>
          <Image
            source={require('../../assets/images/user.jpg')}
            style={styles.profileImage}
          />
          <View style={styles.header}>
                <View style={styles.organizationContainer}>
              {getDisplayText()}
              </View>
            <Text style={styles.userName}>{getUserName()}</Text>
          </View>
        </TouchableOpacity>
        <View style={styles.drawerListContainer}>
          <DrawerItemList {...props} />
        </View>
      </DrawerContentScrollView>

      <View style={styles.footer}>
        <TouchableOpacity onPress={() => {}} style={styles.footerButton}>
        </TouchableOpacity>
        <TouchableOpacity onPress={handleShowLogoutModal} style={styles.footerButton}>
          <View style={styles.footerButtonContent}>
            <Ionicons name="exit-outline" size={22} style={{ color: Theme.colors.white }} />
            <Text style={styles.footerButtonText}>Log Out</Text>
          </View>
        </TouchableOpacity>
      </View>

      <CustomModal
        visible={modalVisible}
        title="Are you sure you want to log out?"
        message={
          <View style={styles.modalContent}>
            <Ionicons name="warning" size={60} color="red" style={styles.icon} />
            <Text style={styles.modalMessage}>You will need to log in again to access your account.</Text>
          </View>
        }
        onConfirm={handleConfirmLogout}
        onCancel={handleCancelLogout}
        confirmText="Log Out"
        cancelText="Cancel"
        showCancel={true}
      />
    </View>
  );
};

export default CustomDrawer;