import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation, CommonActions } from '@react-navigation/native';
import { get, push, ref, serverTimestamp, set } from 'firebase/database';
import React, { useEffect, useState } from 'react';
import { FlatList, StyleSheet, Text, TouchableOpacity, View, ScrollView, SafeAreaView, KeyboardAvoidingView, Platform } from 'react-native';
import { auth, database } from '../configuration/firebaseConfig';
import Theme from '../constants/theme';
import CustomModal from '../components/CustomModal';
import GlobalStyles from '../styles/GlobalStyles';

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
    <View style={styles.tableRow}>
      <Text style={styles.tableCell}>{item.itemName || 'N/A'}</Text>
      <Text style={styles.tableCell}>{item.quantity || '0'}</Text>
      <Text style={styles.tableCell}>{item.notes || 'None'}</Text>
      <View style={styles.tableCell}>
        <TouchableOpacity onPress={() => handleDelete(index)}>
          <Ionicons name="trash-outline" size={20} color="#FF0000" />
        </TouchableOpacity>
      </View>
    </View>
  );

  const formatLabel = (key) => key.replace(/([A-Z])/g, ' $1').toLowerCase();

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={GlobalStyles.headerContainer}>
        <TouchableOpacity onPress={() => navigation.openDrawer()} style={GlobalStyles.headerMenuIcon}>
          <Ionicons name="menu" size={32} color="white" />
        </TouchableOpacity>
        <Text style={GlobalStyles.headerTitle}>Relief Request Summary</Text> {/* Updated header title for clarity */}
      </View>
      <Text style={styles.subheader}>{organizationName}</Text> {/* Changed to organizationName */}
      <SafeAreaView style={{ flex: 1 }} edges={['left', 'right', 'bottom']}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
        >
          <ScrollView contentContainerStyle={styles.scrollViewContent}>
            <View style={styles.formContainer}>
              <View style={styles.section}>
                {['contactPerson', 'contactNumber', 'email', 'address', 'city', 'donationCategory'].map(
                  (field) => (
                    <View key={field} style={styles.fieldContainer}>
                      <Text style={styles.label}>{formatLabel(field)}:</Text>
                      <Text style={styles.value}>{reportData[field] || 'N/A'}</Text>
                    </View>
                  )
                )}
              </View>

              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Requested Items</Text>
                {addedItems.length === 0 ? (
                  <Text style={styles.value}>No items added yet.</Text>
                ) : (
                  <View style={styles.table}>
                    <View style={styles.tableHeader}>
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
            </View>

            <View style={styles.buttonContainer}>
              <TouchableOpacity style={styles.backButton} onPress={handleBack}>
                <Text style={styles.backButtonText}>Back</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
                <Text style={styles.submitButtonText}>Submit</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>

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
    </View>
  );
};

const spacing = {
  xsmall: 5,
  small: 10,
  medium: 15,
  large: 20,
  xlarge: 30,
};

const borderRadius = {
  small: 4,
  medium: 8,
  large: 10,
  xlarge: 20,
};

const borderWidth = {
  thin: 1,
  medium: 2,
  thick: 3,
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.colors.lightBg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Theme.colors.primary,
    paddingHorizontal: 10,
    width: '100%',
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    height: 92,
    paddingTop: 40,
    position: 'relative',
    elevation: 10,
  },
  menuIcon: {
    position: 'absolute',
    left: 30,
    top: 50,
  },
  headerText: {
    color: 'white',
    fontSize: 20,
    fontFamily: 'Poppins_Regular',
    textAlign: 'center',
  },
  subheader: {
    fontSize: 16,
    color: '#3D52A0',
    textAlign: 'center',
    marginVertical: 10,
    fontFamily: 'Poppins_Regular',
  },
  formContainer: {
    marginBottom: 20,
  },
  section: {
    marginVertical: 10,
    marginHorizontal: 15,
    borderWidth: 3,
    backgroundColor: '#FFF9F0',
    borderColor: Theme.colors.primary,
    borderRadius: 10,
    padding: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 20,
    marginBottom: 10,
    color: '#14AEBB',
    fontFamily: 'Poppins_Bold',
  },
  label: {
    fontSize: 14,
    color: Theme.colors.primary,
    textTransform: 'capitalize',
    fontFamily: 'Poppins_SemiBold',
  },
  value: {
    fontSize: 14,
    color: '#000000',
    marginTop: 2,
    fontFamily: 'Poppins_Regular',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginHorizontal: 10,
    marginBottom: 20,
    height: 45,
  },
  backButton: {
    borderWidth: 1.5,
    borderColor: '#4059A5',
    borderRadius: 12,
    justifyContent: 'center',
    paddingHorizontal: 25,
    paddingVertical: 0,
    alignItems: 'center',
    marginRight: 10,
    backgroundColor: '#FFFFFF',
  },
  backButtonText: {
    color: '#4059A5',
    fontSize: 16,
    fontFamily: 'Poppins_Medium',
  },
  scrollViewContent: {
    paddingVertical: spacing.small,
  },
  submitButton: {
    flex: 1,
    backgroundColor: '#14AEBB',
    borderRadius: 12,
    justifyContent: 'center',
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    paddingTop: 5,
    fontFamily: 'Poppins_SemiBold',
    textAlign: 'center',
  },
  table: {
    borderWidth: 1,
    borderColor: '#4059A5',
    borderRadius: 5,
    overflow: 'hidden',
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: 'hsla(225, 44.10%, 44.90%, 0.23)',
    borderBottomWidth: 1,
    borderColor: '#4059A5',
    paddingVertical: 8,
    paddingHorizontal: 5,
  },
  tableHeaderCell: {
    flex: 1,
    textAlign: 'center',
    color: Theme.colors.black,
    fontFamily: 'Poppins_SemiBold',
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 10,
    paddingHorizontal: 5,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  tableCell: {
    flex: 1,
    textAlign: 'center',
    fontSize: 14,
    color: Theme.colors.black,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    alignItems: 'center',
    width: '100%',
    justifyContent: 'center',
  },
  modalIcon: {
    marginBottom: 15,
  },
  modalMessage: {
    fontSize: 14,
    color: '#444',
    lineHeight: 24,
    fontFamily: 'Poppins_Regular',
    textAlign: 'center',
  },
});

export default ReliefSummary;