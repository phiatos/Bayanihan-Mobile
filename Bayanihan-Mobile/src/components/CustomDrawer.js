import React, { useContext, useState, useEffect } from 'react';
import { View, Text, Image, TouchableOpacity, Alert } from 'react-native';
import { DrawerContentScrollView, DrawerItemList } from '@react-navigation/drawer';
import Ionicons from '@expo/vector-icons/Ionicons';
import { getDatabase, ref, get } from 'firebase/database';
import styles from '../styles/CustomDrawerStyles';
import Theme from '../constants/theme';
import { signOut } from 'firebase/auth';
import { auth } from '../configuration/firebaseConfig';
import { AuthContext } from '../context/AuthContext';
import CustomModal from './CustomModal';

const CustomDrawer = (props) => {
  const { onSignOut, navigation } = props;
  const { user } = useContext(AuthContext);
  const [modalVisible, setModalVisible] = useState(false);
  const [errorModal, setErrorModal] = useState({ visible: false, message: '' });
  const [profileData, setProfileData] = useState({ profilePicture: '' });

  const organizationName = user?.organization || null;
  const role = user?.role || 'N/A';
  const adminPosition = user?.adminPosition || 'N/A';

  useEffect(() => {
    const fetchProfilePicture = async () => {
      if (!user?.id || !auth.currentUser?.uid) {
        console.warn(`[${new Date().toISOString()}] No user ID available for fetching profile picture`);
        setProfileData({ profilePicture: '' });
        return;
      }

      try {
        const db = getDatabase();
        const userRef = ref(db, `users/${auth.currentUser.uid}`);
        const snapshot = await get(userRef);
        if (snapshot.exists()) {
          const data = snapshot.val();
          setProfileData({ profilePicture: data.profilePicture || '' });
        } else {
          console.warn(`[${new Date().toISOString()}] No user document found for UID: ${auth.currentUser.uid}`);
          setProfileData({ profilePicture: '' });
        }
      } catch (error) {
        console.error(`[${new Date().toISOString()}] Error fetching profile picture:`, error.message, error.code || 'N/A');
        setErrorModal({
          visible: true,
          message: `Failed to load profile picture: ${error.message}`,
        });
        setProfileData({ profilePicture: '' });
      }
    };

    fetchProfilePicture();
  }, [user]);

  const handleShowLogoutModal = () => {
    setModalVisible(true);
  };

  const handleConfirmLogout = async () => {
    setModalVisible(false);
    try {
      await signOut(auth);
      onSignOut();
    } catch (error) {
      console.error('Sign out error:', error.message);
      setErrorModal({
        visible: true,
        message: `Failed to sign out: ${error.message}`,
      });
    }
  };

  const getUserName = () => {
    if (user?.contactPerson) {
      return user.contactPerson;
    }
    if (user?.firstName || user?.lastName) {
      return `${user.firstName || ''} ${user.lastName || ''}`.trim();
    }
    return 'Unknown';
  };

  const getDisplayText = () => {
    if (!user) {
      return <Text style={styles.organization}>Loading...</Text>;
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
        <TouchableOpacity 
          onPress={() => navigation.navigate("Profile")} 
          style={styles.userHeader}
        >
          {profileData.profilePicture ? (
            <Image
              source={{ uri: profileData.profilePicture }}
              style={styles.profileImage}
            />
          ) : (
           <Image
            source={require('../../assets/images/user_logo.png')}
            style={styles.profileImage}
          />
          )}
          <View style={styles.header}>
            <View style={styles.organization}>
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
      <CustomModal
        visible={errorModal.visible}
        title="Error"
        message={
          <View style={styles.modalContent}>
            <Ionicons name="alert-circle" size={60} color="red" style={styles.icon} />
            <Text style={styles.modalMessage}>{errorModal.message}</Text>
          </View>
        }
        onConfirm={() => setErrorModal({ visible: false, message: '' })}
        confirmText="OK"
        showCancel={false}
      />
    </View>
  );
};

export default CustomDrawer;