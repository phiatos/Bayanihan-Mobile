import React, { useContext, useState } from 'react';
import { View, Text, Image, TouchableOpacity, Alert } from 'react-native';
import { DrawerContentScrollView, DrawerItemList } from '@react-navigation/drawer';
import Ionicons from '@expo/vector-icons/Ionicons';
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

  const organizationName = user?.organization || null;
  const role = user?.role || 'N/A';
  const adminPosition = user?.adminPosition || 'N/A';
  const contactPerson = user?.contactPerson || null;
  const firstName = user?.firstName || null;
  const lastName = user?.lastName || null;

  const handleShowLogoutModal = () => {
    setModalVisible(true);
  };

  const handleConfirmLogout = async () => {
    setModalVisible(false);
    try {
      await signOut(auth);
      onSignOut();
        navigation.navigate("AuthStack", { screen: "Login" });
    } catch (error) {
      console.error('Sign out error:', error.message);
      Alert.alert('Error', 'Failed to sign out: ' + error.message);
    }
  };

  const getUserName = () => {
    if (contactPerson) {
      return contactPerson;
    }
    if (firstName || lastName) {
      return `${firstName || ''} ${lastName || ''}`.trim();
    }
    return 'Unknown User';
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
        <TouchableOpacity onPress={() => navigation.navigate("Profile")} style={styles.userHeader}>
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
      <CustomModal
        visible={errorModal.visible}
        title="Error"
        message={errorModal.message}
        onConfirm={() => setErrorModal({ visible: false, message: '' })}
        confirmText="OK"
        showCancel={false}
      />
    </View>
  );
};

export default CustomDrawer;