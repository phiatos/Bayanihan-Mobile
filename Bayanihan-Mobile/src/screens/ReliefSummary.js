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
import CustomModal from '../components/CustomModal';

const ReliefSummary = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { user } = useAuth();
  const { reportData: initialReportData = {}, addedItems: initialItems = [], organizationName = user?.organization || 'Admin', urgent = false } = route.params || {};
  const [reportData, setReportData] = useState(initialReportData);
  const [addedItems, setAddedItems] = useState(initialItems);
  const [modalVisible, setModalVisible] = useState(false);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);

  useEffect(() => {
    if (!user) {
      setErrorMessage('User not authenticated. Please log in.');
      setModalVisible(true);
      setTimeout(() => {
        setModalVisible(false);
        navigation.navigate('Login');
      }, 3000);
      return;
    }
  }, [user, navigation]);

  const notifyAdmin = async (message, calamityType, location, details, reliefrequestId, senderName, organization) => {
    try {
      const identifier = `request_${reliefrequestId}_${Date.now()}`;
      const key = push(ref(database, 'notifications')).key;
      await set(ref(database, `notifications/${key}`), {
        message: message + (urgent ? ' [URGENT]' : ''),
        calamityType: calamityType || null,
        location: location || null,
        details: details || null,
        eventId: null,
        reliefrequestId,
        senderName,
        organization,
        identifier,
        timestamp: serverTimestamp(),
        read: false,
        type: 'admin',
        priority: urgent ? 'high' : 'normal',
      });
    } catch (error) {
      console.error('Failed to notify admin:', error.message);
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    if (!user) {
      setErrorMessage('User not authenticated. Please log in again.');
      setModalVisible(true);
      setIsSubmitting(false);
      return;
    }

    const { contactPerson, contactNumber, email, address, category } = reportData;
    const { formattedAddress, latitude, longitude } = address || {};

    if (!contactPerson?.trim()) {
      setErrorMessage('Please enter the contact person’s name.');
      setModalVisible(true);
      setIsSubmitting(false);
      return;
    }

    if (!contactNumber?.trim() || !/^[0-9]{11}$/.test(contactNumber)) {
      setErrorMessage('Please enter a valid contact number (exactly 11 digits).');
      setModalVisible(true);
      setIsSubmitting(false);
      return;
    }

    if (!email?.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setErrorMessage('Please enter a valid email address.');
      setModalVisible(true);
      setIsSubmitting(false);
      return;
    }

    if (!formattedAddress?.trim()) {
      setErrorMessage('Please enter the drop-off address.');
      setModalVisible(true);
      setIsSubmitting(false);
      return;
    }

    if (!category) {
      setErrorMessage('Please select a request category.');
      setModalVisible(true);
      setIsSubmitting(false);
      return;
    }

    if (addedItems.length === 0) {
      setErrorMessage('Please add at least one item before proceeding.');
      setModalVisible(true);
      setIsSubmitting(false);
      return;
    }

    try {
      const today = new Date();
      let expirationDays;

      const expirationRules = {
        "rice": { urgent: 3, nonUrgent: 7 },
        "canned goods": { urgent: 4, nonUrgent: 10 },
        "water bottles": { urgent: 2, nonUrgent: 5 },
        "blankets": { urgent: 5, nonUrgent: 14 },
        "medicine kits": { urgent: 2, nonUrgent: 5 },
        "hygiene packs": { urgent: 3, nonUrgent: 7 },
        "others": { urgent: 4, nonUrgent: 10 }
      };

      const rule = expirationRules[category.toLowerCase()] || expirationRules["others"];
      expirationDays = urgent ? rule.urgent : rule.nonUrgent;

      const expirationDate = new Date();
      expirationDate.setDate(today.getDate() + expirationDays);

      const newRequest = {
        contactPerson: contactPerson.trim(),
        contactNumber: contactNumber.trim(),
        email: email.trim(),
        category,
        volunteerOrganization: organizationName,
        userUid: user.id,
        address: {
          formattedAddress: formattedAddress.trim(),
          latitude: Number(latitude) || null,
          longitude: Number(longitude) || null
        },
        assistance: addedItems.map(item => ({
          ...item,
          quantity: Number(item.quantity)
        })),
        remaining: addedItems.map(item => ({
          ...item,
          quantity: Number(item.quantity)
        })),
        timestamp: serverTimestamp(),
        donationDate: new Date().toISOString(),
        status: "Pending",
        matchedDonations: 0,
        matchedDonationIds: [],
        assignedVolunteers: [],
        urgent,
        expirationDate: expirationDate.toISOString() 
      };

      const requestRef = push(ref(database, 'requestRelief/requests'));
      const reliefrequestId = requestRef.key;
      const userRequestRef = ref(database, `users/${user.id}/requests/${reliefrequestId}`);
      const message = `New relief request submitted by ${contactPerson} from ${organizationName} for ${category}${urgent ? ' (URGENT)' : ''}..`;

      await Promise.all([
        set(requestRef, newRequest),
        set(userRequestRef, newRequest),
        logActivity('Submitted a Relief Request', reliefrequestId, user.id, organizationName),
        logSubmission('requestRelief/requests', newRequest, reliefrequestId, organizationName, user.id),
        notifyAdmin(message, null, null, null, reliefrequestId, contactPerson, organizationName),
      ]);

      setReportData({});
      setAddedItems([]);
      setErrorMessage(null);
      setModalVisible(true);
    } catch (error) {
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
    navigation.navigate('ReliefRequest', { reportData, addedItems, organizationName, urgent });
  };

  const renderItem = ({ item, index }) => (
    <View style={styles.summaryTableRow}>
      <Text style={[styles.summaryTableCell, { minWidth: 100 }]}>{item.name || 'N/A'}</Text>
      <Text style={[styles.summaryTableCell, { minWidth: 100 }]}>{item.quantity || '0'}</Text>
      <Text
        style={[styles.summaryTableCell, { minWidth: 150, flex: 1 }]}
        numberOfLines={100}
        ellipsizeMode="tail"
      >
        {item.notes || 'N/A'}
      </Text>
      <View style={[styles.summaryTableCell, { minWidth: 100 }]}>
        <TouchableOpacity onPress={() => handleDelete(index)}>
          <Ionicons name="trash-outline" size={20} color="#FF0000" />
        </TouchableOpacity>
      </View>
    </View>
  );

  const formatLabel = (key) => {
    if (key === 'address') return 'Drop-off Address';
    return key.replace(/([A-Z])/g, ' $1').replace(/^./, (str) => str.toUpperCase());
  };

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
        style={{ flex: 1}}
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
              {['contactPerson', 'contactNumber', 'email', 'address', 'category'].map((field) => (
                <View key={field} style={styles.fieldContainer}>
                  <Text style={styles.label}>{formatLabel(field)}:</Text>
                  <Text style={styles.value}>
                    {field === 'address' ? reportData[field]?.formattedAddress || 'N/A' : reportData[field] || 'N/A'}
                  </Text>
                </View>
              ))}
              <Text style={styles.label}>Urgent:</Text>
              <Text style={[styles.value, urgent && { color: '#FF0000', fontWeight: 'bold' }]}>
                {urgent ? 'Yes' : 'No'}
              </Text>
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

      <CustomModal
        visible={modalVisible}
        title={errorMessage ? 'Error' : 'Request Submitted'}
        message={
          <View style={GlobalStyles.modalContent}>
            {errorMessage ? (
              <>
                <Ionicons name="warning-outline" size={60} color="#FF0000" style={GlobalStyles.modalIcon} />
                <Text style={GlobalStyles.modalMessage}>{errorMessage}</Text>
              </>
            ) : (
              <>
                <Ionicons name="checkmark-circle" size={60} color={Theme.colors.primary} style={GlobalStyles.modalIcon} />
                <Text style={GlobalStyles.modalMessage}>Your relief request has been successfully submitted{urgent ? ' as urgent' : ''}!!</Text>
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