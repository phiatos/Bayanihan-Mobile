import React, { useContext, useState, useEffect } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { DrawerContentScrollView, DrawerItemList } from '@react-navigation/drawer';
import Ionicons from '@expo/vector-icons/Ionicons';
import { MaterialIcons } from '@expo/vector-icons';
import styles from '../styles/CustomDrawerStyles';
import Theme from '../constants/theme';
import { signOut } from 'firebase/auth';
import { auth, db } from '../configuration/firebaseConfig';
import { doc, getDoc } from 'firebase/firestore';
import { AuthContext } from '../context/AuthContext';
import CustomModal from './CustomModal';

const CustomDrawer = (props) => {
  const { onSignOut, navigation } = props; // Use navigation from props
  const { user } = useContext(AuthContext);
  const [modalVisible, setModalVisible] = useState(false);
  const [organizationName, setOrganizationName] = useState('Loading...');
  const [isLoading, setIsLoading] = useState(true);

  // Redirect to login if no user
  useEffect(() => {
    if (!user && !isLoading) {
      console.warn('No authenticated user, redirecting to login');
      Alert.alert('Authentication Required', 'Please log in to continue.');
      navigation.navigate('Login'); // Use props.navigation
    }
  }, [user, isLoading, navigation]);

  // Fetch organization name from Firestore
  useEffect(() => {
    const fetchOrganizationName = async (retryCount = 0, maxRetries = 2) => {
      setIsLoading(true);
      console.log('AuthContext user:', user);
      if (!user?.uid) {
        console.warn('No user UID available');
        setOrganizationName('Unknown Organization');
        setIsLoading(false);
        return;
      }

      if (!db) {
        console.error('Firestore db instance is not initialized');
        setOrganizationName('Unknown Organization');
        Alert.alert('Error', 'Firestore database is not properly initialized.');
        setIsLoading(false);
        return;
      }

      try {
        console.log('Fetching user document for UID:', user.uid);
        const userRef = doc(db, 'users', user.uid);
        const userDoc = await getDoc(userRef);

        if (userDoc.exists()) {
          const userData = userDoc.data();
          console.log('User data fetched:', userData);
          if (userData.organization) {
            setOrganizationName(userData.organization);
          } else {
            console.warn('No organization field found in user document:', user.uid);
            setOrganizationName('Unknown Organization');
            Alert.alert('Warning', 'No organization found in your profile.');
          }
        } else {
          console.warn('No user document found for UID:', user.uid);
          setOrganizationName('Unknown Organization');
          Alert.alert('Warning', 'No user profile found in database.');
        }
      } catch (error) {
        console.error('Error fetching organization name:', error.message, error.code);
        if (retryCount < maxRetries && error.code === 'unavailable') {
          console.log(`Retrying fetch (${retryCount + 1}/${maxRetries})...`);
          setTimeout(() => fetchOrganizationName(retryCount + 1, maxRetries), 1000);
        } else {
          setOrganizationName('Unknown Organization');
          Alert.alert('Error', `Failed to fetch organization name: ${error.message}`);
        }
      } finally {
        setIsLoading(false);
      }
    };

    if (user?.uid) {
      fetchOrganizationName();
    } else {
      setIsLoading(false);
    }
  }, [user?.uid]);

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

  const handleCancelLogout = () => {
    setModalVisible(false);
  };

  return (
    <View style={styles.container}>
      <DrawerContentScrollView
        {...props}
        contentContainerStyle={styles.drawerScroll}
      >
        <View style={styles.userHeader}>
          <Image
            source={require('../../assets/images/user.jpg')}
            style={styles.profileImage}
          />
          <View style={styles.header}>
            <View style={styles.userRoleContainer}>
              <Text style={styles.userRole}>{user?.role || 'Unknown Role'}</Text>
            </View>
            <Text style={styles.userName}>{user?.contactPerson || 'Unknown User'}</Text>
            {/* <View style={combinedStyles.organizationContainer}>
              {isLoading ? (
                <ActivityIndicator size="small" color={Theme.colors.grey} />
              ) : (
                <Text style={combinedStyles.organization}>{organizationName}</Text>
              )}
            </View> */}
          </View>
        </View>
        <View style={styles.drawerListContainer}>
          <DrawerItemList {...props} />
        </View>
      </DrawerContentScrollView>

      <View style={styles.footer}>
        <TouchableOpacity onPress={() => {}} style={styles.footerButton}>
          {/* <View style={styles.footerButtonContent}>
            <MaterialIcons name="info" size={22} style={{ color: Theme.colors.white }} />
            <Text style={styles.footerButtonText}>Help</Text>
          </View> */}
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
        confirmText="Yes, Log Out"
        cancelText="Cancel"
        showCancel={true}
      />
    </View>
  );
};

const localStyles = StyleSheet.create({
  organization: {
    fontSize: 14,
    color: Theme.colors.grey,
    marginTop: 4,
  },
  organizationContainer: {
    marginTop: 4,
    minHeight: 20,
  },
});

const combinedStyles = { ...styles, ...localStyles };

export default CustomDrawer;