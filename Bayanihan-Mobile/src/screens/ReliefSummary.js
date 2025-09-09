import { Ionicons } from '@expo/vector-icons';
import { useNavigation, CommonActions, useRoute } from '@react-navigation/native';
import { get, push, ref, set, serverTimestamp } from 'firebase/database';
import React, { useEffect, useState } from 'react';
import { FlatList, Text, TouchableOpacity, View, ScrollView, SafeAreaView, KeyboardAvoidingView, Platform, StatusBar } from 'react-native';
import { database } from '../configuration/firebaseConfig';
import Theme from '../constants/theme';
import OperationCustomModal from '../components/OperationCustomModal';
import GlobalStyles from '../styles/GlobalStyles';
import styles from '../styles/ReliefRequestStyles';
import { LinearGradient } from 'expo-linear-gradient';
import { logActivity, logSubmission } from '../components/logSubmission'; 
import { useAuth } from '../context/AuthContext';
  
const ReliefSummary = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { user } = useAuth();
  const { reportData: initialReportData = {}, addedItems: initialItems = [], organizationName = 'Admin' } = route.params || {};
  const [reportData, setReportData] = useState(initialReportData);
  const [addedItems, setAddedItems] = useState(initialItems);
  const [modalVisible, setModalVisible] = useState(false);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);

  useEffect(() => {
    if (!user) {
      console.warn('No user is logged in');
      setErrorMessage('User not authenticated. Please log in.');
      setModalVisible(true);
      setTimeout(() => {
        setModalVisible(false);
        navigation.navigate('Login');
      }, 3000);
      return;
    }
    console.log('Logged-in user ID:', user.id);
    console.log('Volunteer organization:', organizationName);
  }, [user, navigation, organizationName]);

  const notifyAdmin = async (message, requestRefKey, contactPerson, volunteerOrganization) => {
    try {
      const notificationRef = ref(database, 'notifications');
      await push(notificationRef, {
        message,
        requestRefKey,
        contactPerson,
        volunteerOrganization,
        timestamp: serverTimestamp(),
      });
      console.log('Admin notified successfully:', message);
    } catch (error) {
      console.error('Failed to notify admin:', error.message);
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    if (!user) {
      console.error('No user available. Cannot submit request.');
      setErrorMessage('User not authenticated. Please log in again.');
      setModalVisible(true);
      setIsSubmitting(false);
      return;
    }

    if (!organizationName || organizationName === 'Admin') {
      console.error('Organization name not available.');
      setErrorMessage('Organization name not loaded. Please try again.');
      setModalVisible(true);
      setIsSubmitting(false);
      return;
    }

    const contactPerson = reportData.contactPerson?.trim();
    const contactNumber = reportData.contactNumber?.trim();
    const email = reportData.email?.trim();
    const address = reportData.address?.trim();
    const city = reportData.city?.trim();
    const donationCategory = reportData.donationCategory;

    if (!contactPerson) {
      console.log('Validation failed: Contact person is empty');
      setErrorMessage('Please enter the contact person’s name.');
      setModalVisible(true);
      setIsSubmitting(false);
      return;
    }

    if (!contactNumber || !/^\d{10,}$/.test(contactNumber)) {
      console.log('Validation failed: Invalid contact number', { contactNumber });
      setErrorMessage('Please enter a valid contact number (at least 10 digits).');
      setModalVisible(true);
      setIsSubmitting(false);
      return;
    }

    if (!email || !/^[^\s@]+@[^\s@]+\.[^@\s]+$/.test(email)) {
      console.log('Validation failed: Invalid email', { email });
      setErrorMessage('Please enter a valid email address.');
      setModalVisible(true);
      setIsSubmitting(false);
      return;
    }

    if (!address) {
      console.log('Validation failed: Address is empty');
      setErrorMessage('Please enter the drop-off address.');
      setModalVisible(true);
      setIsSubmitting(false);
      return;
    }

    if (!city) {
      console.log('Validation failed: City is empty');
      setErrorMessage('Please enter the city.');
      setModalVisible(true);
      setIsSubmitting(false);
      return;
    }

    if (!donationCategory) {
      console.log('Validation failed: Donation category not selected');
      setErrorMessage('Please select a donation category.');
      setModalVisible(true);
      setIsSubmitting(false);
      return;
    }

    if (addedItems.length === 0) {
      console.log('Validation failed: No items added');
      setErrorMessage('Please add at least one item before proceeding.');
      setModalVisible(true);
      setIsSubmitting(false);
      return;
    }

    try {
      console.log('Preparing to submit request to Firebase');
      const newRequest = {
        contactPerson,
        contactNumber,
        email,
        address,
        city,
        category: donationCategory,
        volunteerOrganization: organizationName,
        userUid: user.id,
        items: addedItems.map((item) => ({
          name: item.itemName,
          quantity: item.quantity,
          notes: item.notes || '',
          category: item.donationCategory || donationCategory,
        })),
        timestamp: serverTimestamp(),
      };

      console.log('Submitting request to Firebase:', newRequest);
      const requestRef = push(ref(database, 'requestRelief/requests'));
      const submissionId = requestRef.key;
      const message = `New relief request submitted by ${contactPerson} from ${organizationName} for ${donationCategory} on ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })} at ${new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })} PST.`;
      await notifyAdmin(message, submissionId, contactPerson, organizationName);

      await Promise.all([
        set(requestRef, newRequest),
        logActivity('Submitted a Relief Request', submissionId, user.id, organizationName),
        logSubmission('requestRelief/requests', newRequest, submissionId, organizationName, user.id),  
      ]);
      console.log('Data saved to Firebase successfully');

      setReportData({});
      setAddedItems([]);

      setErrorMessage(null);
      setModalVisible(true);
    } catch (error) {
      console.error('Error in handleSubmit:', error.message);
      setErrorMessage('Failed to submit request: ' + error.message);
      setModalVisible(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirm = () => {
    setModalVisible(false);
    if (!errorMessage) {
      navigation.dispatch(
        CommonActions.reset({
          index: 0,
          routes: [{ name: 'Volunteer Dashboard' }],
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
    navigation.navigate('ReliefRequest', { reportData, addedItems, organizationName });
  };

  const renderItem = ({ item, index }) => (
    <View style={styles.summaryTableRow}>
      <Text style={[styles.summaryTableCell, { minWidth: 100 }]}>
        {item.itemName || 'N/A'}
      </Text>
      <Text style={[styles.summaryTableCell, { minWidth: 100 }]}>
        {item.quantity || '0'}
      </Text>
      <Text
        style={[styles.summaryTableCell, { minWidth: 150, flex: 1 }]}
        numberOfLines={100}
        ellipsizeMode="tail"
      >
        {item.notes || 'None'}
      </Text>
      <View style={[styles.summaryTableCell, { minWidth: 100 }]}>
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
          <Text style={[GlobalStyles.headerTitle, { color: Theme.colors.primary }]}>Relief Request</Text>
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
                <ScrollView horizontal showsHorizontalScrollIndicator={true}>
                  <View style={styles.summaryTable}>
                    <View style={styles.summaryTableRow}>
                      <View style={[styles.summaryTableHeader, { minWidth: 100, borderTopLeftRadius: 10 }]}>
                        <Text style={styles.summaryTableHeaderCell}>Item Name</Text>
                      </View>
                      <View style={[styles.summaryTableHeader, { minWidth: 100 }]}>
                        <Text style={styles.summaryTableHeaderCell}>Quantity</Text>
                      </View>
                      <View style={[styles.summaryTableHeader, { minWidth: 150, flex: 1 }]}>
                        <Text style={styles.summaryTableHeaderCell}>Notes</Text>
                      </View>
                      <View style={[styles.summaryTableHeader, { minWidth: 100, borderTopRightRadius: 10 }]}>
                        <Text style={styles.summaryTableHeaderCell}>Actions</Text>
                      </View>
                    </View>
                    <FlatList
                      data={addedItems}
                      renderItem={renderItem}
                      keyExtractor={(item, index) => index.toString()}
                      scrollEnabled={false}
                    />
                  </View>
                </ScrollView>
              )}
            </View>
            <View style={GlobalStyles.finalButtonContainer}>
              <TouchableOpacity style={GlobalStyles.backButton} onPress={handleBack}>
                <Text style={GlobalStyles.backButtonText}>Back</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[GlobalStyles.submitButton, isSubmitting && { opacity: 0.6 }]}
                onPress={handleSubmit}
                disabled={isSubmitting}
              >
                <Text style={GlobalStyles.submitButtonText}>{isSubmitting ? 'Submitting...' : 'Submit'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <OperationCustomModal
        visible={modalVisible}
        title={errorMessage ? 'Error' : 'Request Submitted'}
        message={
          <View style={GlobalStyles.modalContent}>
            {errorMessage ? (
              <>
                <Ionicons
                  name="warning-outline"
                  size={60}
                  color="#FF0000"
                  style={GlobalStyles.modalIcon}
                />
                <Text style={GlobalStyles.modalMessage}>{errorMessage}</Text>
              </>
            ) : (
              <>
                <Ionicons
                  name="checkmark-circle"
                  size={60}
                  color={Theme.colors.primary}
                  style={GlobalStyles.modalIcon}
                />
                <Text style={GlobalStyles.modalMessage}>Your relief request has been successfully submitted!</Text>
              </>
            )}
          </View>
        }
        onConfirm={handleConfirm}
        onCancel={handleCancel}
        confirmText={errorMessage ? 'Retry' : 'Proceed'}
        showCancel={errorMessage ? true : false}
      />
      <OperationCustomModal
        visible={deleteModalVisible}
        title="Confirm Deletion"
        message={
          <View style={GlobalStyles.modalContent}>
            <Ionicons name="warning-outline" size={60} color={Theme.colors.red} style={GlobalStyles.modalIcon} />
            <Text style={GlobalStyles.modalMessage}>Are you sure you want to delete this item?</Text>
          </View>
        }
        onConfirm={confirmDelete}
        onCancel={cancelDelete}
        confirmText="Delete"
        showCancel={true}
      />
    </SafeAreaView>
  );
};

export default ReliefSummary;