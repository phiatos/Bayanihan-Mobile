import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation, CommonActions } from '@react-navigation/native';
import { get, push, ref, serverTimestamp, set } from 'firebase/database';
import React, { useEffect, useState } from 'react';
import { FlatList, StyleSheet, Text, TouchableOpacity, View, ScrollView, SafeAreaView, KeyboardAvoidingView, Platform, StatusBar } from 'react-native';
import { auth, database } from '../configuration/firebaseConfig';
import Theme from '../constants/theme';
import CustomModal from '../components/CustomModal';
import GlobalStyles from '../styles/GlobalStyles';
import styles from '../styles/ReliefRequestStyles';
import { LinearGradient } from 'expo-linear-gradient';

const ReliefSummary = ({ route, navigation }) => {
  const { reportData: initialReportData = {}, addedItems: initialItems = [] } = route.params || {};
  const [reportData, setReportData] = useState(initialReportData);
  const [addedItems, setAddedItems] = useState(initialItems);
  const [modalVisible, setModalVisible] = useState(false);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [userUid, setUserUid] = useState(null);
  const [organizationName, setOrganizationName] = useState('[Unknown Org]'); // Changed to organizationName
  const [errorMessage, setErrorMessage] = useState(null);

  useEffect(() => {
    const fetchOrganizationName = async () => {
      const storedOrg = await AsyncStorage.getItem('organizationName'); // Changed to organizationName
      if (storedOrg) {
        setOrganizationName(storedOrg);
        console.log('Organization name loaded from storage:', storedOrg);
      }

      console.log('Setting up auth state listener...');
      const unsubscribe = auth.onAuthStateChanged(
        (user) => {
          if (user) {
            setUserUid(user.uid);
            console.log('Logged-in user UID:', user.uid);
            const userRef = ref(database, `users/${user.uid}`);
            get(userRef)
              .then((snapshot) => {
                const userData = snapshot.val();
                if (userData && userData.organization) { // Changed to organization
                  setOrganizationName(userData.organization);
                  AsyncStorage.setItem('organizationName', userData.organization); // Changed to organizationName
                  console.log('Organization name fetched:', userData.organization);
                } else {
                  console.warn('User data or organization not found for UID:', user.uid);
                  setErrorMessage('Organization name not found. Please contact support.');
                  setModalVisible(true);
                }
              })
              .catch((error) => {
                console.error('Error fetching user data:', error.message);
                setErrorMessage('Failed to fetch user data: ' + error.message);
                setModalVisible(true);
              });
          } else {
            console.warn('No user is logged in');
            setErrorMessage('User not authenticated. Please log in.');
            setModalVisible(true);
          }
        },
        (error) => {
          console.error('Auth state listener error:', error.message);
          setErrorMessage('Authentication error: ' + error.message);
          setModalVisible(true);
        }
      );

      return () => unsubscribe();
    };

    fetchOrganizationName(); // Changed function name
  }, []);

  const handleSubmit = () => {
    if (!userUid) {
      console.error('No user UID available. Cannot submit request.');
      setErrorMessage('User not authenticated. Please log in again.');
      setModalVisible(true);
      return;
    }

    try {
      console.log('serverTimestamp:', serverTimestamp);
      const newRequest = {
        contactPerson: reportData.contactPerson,
        contactNumber: reportData.contactNumber,
        email: reportData.email,
        address: reportData.address,
        city: reportData.city,
        category: reportData.donationCategory,
        organizationName, // Changed to organizationName
        userUid,
        items: addedItems.map((item) => ({
          name: item.itemName,
          quantity: item.quantity,
          notes: item.notes || '',
          category: item.donationCategory || reportData.donationCategory,
        })),
        timestamp: serverTimestamp(),
      };

      console.log('Submitting request to Firebase:', newRequest);

      const requestRef = push(ref(database, 'requestRelief/requests'));
      const userRequestRef = ref(database, `users/${userUid}/requests/${requestRef.key}`);

      Promise.all([
        set(requestRef, newRequest),
        set(userRequestRef, newRequest),
      ])
        .then(() => {
          console.log('Data saved to Firebase successfully');
          setErrorMessage(null);
          setModalVisible(true);
        })
        .catch((error) => {
          console.error('Failed to save data to Firebase:', error.message);
          setErrorMessage('Failed to submit request: ' + error.message);
          setModalVisible(true);
        });
    } catch (error) {
      console.error('Error in handleSubmit:', error.message);
      setErrorMessage('Failed to submit request: ' + error.message);
      setModalVisible(true);
    }
  };

  const handleConfirm = () => {
    setModalVisible(false);
    if (!errorMessage) {
      navigation.dispatch(
        CommonActions.reset({
          index: 0,
          routes: [
            { name: 'Volunteer Dashboard' },
          ],
        })
      );
    } else {
      navigation.navigate('Login');
    }
  };

  const handleCancel = () => {
    setModalVisible(false);
    if (errorMessage) {
      navigation.navigate('Login');
    }
  };

  const handleDelete = (index) => {
    setItemToDelete(index);
    setDeleteModalVisible(true);
  };

  const confirmDelete = () => {
    setAddedItems((prevItems) => prevItems.filter((_, i) => i !== itemToDelete));
    setDeleteModalVisible(false);
    setItemToDelete(null);
  };

  const cancelDelete = () => {
    setDeleteModalVisible(false);
    setItemToDelete(null);
  };

  const handleBack = () => {
    navigation.navigate('ReliefRequest', { reportData, addedItems });
  };

  const renderItem = ({ item, index }) => (
    <View style={styles.summaryTableRow}>
      <Text style={styles.summaryTableCell}>{item.itemName || 'N/A'}</Text>
      <Text style={styles.summaryTableCell}>{item.quantity || '0'}</Text>
      <Text style={styles.summaryTableCell}>{item.notes || 'None'}</Text>
      <View style={styles.summaryTableCell}>
        <TouchableOpacity onPress={() => handleDelete(index)}>
          <Ionicons name="trash-outline" size={20} color="#FF0000" />
        </TouchableOpacity>
      </View>
    </View>
  );

  const formatLabel = (key) => key.replace(/([A-Z])/g, ' $1').toLowerCase();

  return (
    <SafeAreaView style={GlobalStyles.container}>
      <StatusBar barStyle="dark-content" translucent backgroundColor="transparent" />
      {/* Header */}
      <LinearGradient
        colors={['rgba(20, 174, 187, 0.4)', '#FFF9F0']}
        start={{ x: 1, y: 0.5 }}
        end={{ x: 1, y: 1 }}
        style={GlobalStyles.gradientContainer}
      >
        <View style={GlobalStyles.newheaderContainer}>
          <TouchableOpacity onPress={() => navigation.openDrawer()} style={GlobalStyles.headerMenuIcon}>
            <Ionicons name="menu" size={32} color={Theme.colors.primary} />
          </TouchableOpacity>
          <Text style={[GlobalStyles.headerTitle]}>Relief Request</Text>
        </View>
      </LinearGradient>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1, marginTop: 80 }}
        keyboardVerticalOffset={0}
      >
        <ScrollView
          contentContainerStyle={[styles.scrollViewContent]}
          scrollEnabled={true}
          keyboardShouldPersistTaps="handled"
        >
        <View style={GlobalStyles.form}>
          <Text style={GlobalStyles.subheader}>Summary</Text>
          <Text style={GlobalStyles.organizationName}>{organizationName}</Text>
          <View style={GlobalStyles.summarySection}>
            <Text style={GlobalStyles.summarySectionTitle}>Contact Information</Text>
                {['contactPerson', 'contactNumber', 'email', 'address', 'city', 'donationCategory'].map(
                  (field) => (
                    <View key={field} style={styles.fieldContainer}>
                      <Text style={styles.label}>{formatLabel(field)}:</Text>
                      <Text style={styles.value}>{reportData[field] || 'N/A'}</Text>
                    </View>
                  )
                )}
              </View>

              <View style={GlobalStyles.summarySection}>
                <Text style={GlobalStyles.summarySectionTitle}>Requested Items</Text>
                {addedItems.length === 0 ? (
                  <Text style={styles.value}>No items added yet.</Text>
                ) : (
                  <View style={styles.summaryTable}>
                    <View style={styles.summaryTableHeader}>
                      <Text style={styles.tableHeaderCell}>Item Name</Text>
                      <Text style={styles.tableHeaderCell}>Quantity</Text>
                      <Text style={styles.tableHeaderCell}>Notes</Text>
                      <Text style={styles.tableHeaderCell}>Actions</Text>
                    </View>
                    <FlatList
                      data={addedItems}
                      renderItem={renderItem}
                      keyExtractor={(item, index) => index.toString()}
                      scrollEnabled={false}
                    />
                  </View>
                )}
              </View>
               <View style={GlobalStyles.finalButtonContainer}>
              <TouchableOpacity style={GlobalStyles.backButton} onPress={handleBack}>
                <Text style={GlobalStyles.backButtonText}>Back</Text>
              </TouchableOpacity>
              <TouchableOpacity style={GlobalStyles.submitButton} onPress={handleSubmit}>
                <Text style={GlobalStyles.submitButtonText}>Submit</Text>
              </TouchableOpacity>
            </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>

      <CustomModal
        visible={modalVisible}
        title={errorMessage ? 'Error' : userUid ? 'Success!' : 'Authentication Error'}
        message={
          <View style={styles.modalContent}>
            {errorMessage ? (
              <>
                <Ionicons
                  name="warning-outline"
                  size={60}
                  color="#FF0000"
                  style={styles.modalIcon}
                />
                <Text style={styles.modalMessage}>{errorMessage}</Text>
              </>
            ) : userUid ? (
              <>
                <Ionicons
                  name="checkmark-circle"
                  size={60}
                  color={Theme.colors.primary}
                  style={styles.modalIcon}
                />
                <Text style={styles.modalMessage}>Report submitted successfully!</Text>
              </>
            ) : (
              <>
                <Ionicons
                  name="warning-outline"
                  size={60}
                  color="#FF0000"
                  style={styles.modalIcon}
                />
                <Text style={styles.modalMessage}>Please log in again.</Text>
              </>
            )}
          </View>
        }
        onConfirm={handleConfirm}
        onCancel={handleCancel}
        confirmText={errorMessage ? 'Retry' : userUid ? 'Proceed' : 'Login'}
        showCancel={false}
      />
      <CustomModal
        visible={deleteModalVisible}
        title="Confirm Deletion"
        message={
          <View style={styles.modalContent}>
            <Ionicons name="warning-outline" size={60} color="#FF0000" style={styles.modalIcon} />
            <Text style={styles.modalMessage}>Are you sure you want to delete this item?</Text>
          </View>
        }
        onConfirm={confirmDelete}
        onCancel={cancelDelete}
        confirmText="Delete"
        cancelText="Cancel"
        showCancel={true}
      />
    </SafeAreaView>
  );
};

export default ReliefSummary;