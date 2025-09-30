import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, CommonActions } from '@react-navigation/native';
import { ref as databaseRef, push, get, serverTimestamp } from 'firebase/database';
import React, { useEffect, useState } from 'react';
import { Image, KeyboardAvoidingView, Platform, SafeAreaView, ScrollView, StatusBar, ToastAndroid, TouchableOpacity, View, Text } from 'react-native';
import * as FileSystem from 'expo-file-system';
import { database } from '../configuration/firebaseConfig';
import { useAuth } from '../context/AuthContext';
import Theme from '../constants/theme';
import CustomModal from '../components/CustomModal';
import GlobalStyles from '../styles/GlobalStyles';
import styles from '../styles/CallForDonationsStyles';
import { LinearGradient } from 'expo-linear-gradient';
import { logActivity, logSubmission } from '../components/logSubmission';
import useOperationCheck from '../components/useOperationCheck';
import OperationCustomModal from '../components/OperationCustomModal';

const CallForDonationsSummary = () => {
  const route = useRoute();
  const { formData = {}, image = null } = route.params || {};
  const navigation = useNavigation();
  const { user } = useAuth();
  const { canSubmit, organizationName, modalVisible: opModalVisible, setModalVisible: setOpModalVisible, modalConfig: opModalConfig } = useOperationCheck();
  const [modalVisible, setModalVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const [formDataState, setFormDataState] = useState(formData);
  const [imageState, setImageState] = useState(image);

  useEffect(() => {
    const validateUser = async () => {
      try {
        if (!user) {
          throw new Error('No authenticated user found');
        }

        const userRef = databaseRef(database, `users/${user.id}`);
        const snapshot = await get(userRef);
        const userData = snapshot.val();

        if (userData?.password_needs_reset) {
          throw new Error('Password reset required');
        }
      } catch (error) {
        console.error(`[${new Date().toISOString()}] Error validating user:`, error.message);
        setErrorMessage(error.message === 'Password reset required' ? 'Please change your password.' : 'Failed to load user data.');
        setModalVisible(true);
        if (error.message === 'Password reset required') {
          navigation.navigate('Profile');
        }
      }
    };

    validateUser();
  }, [user, navigation]);

  const formatLabel = (key) => {
    return key === 'facebookLink'
      ? 'Facebook Link'
      : key
          .replace(/([A-Z])/g, ' $1')
          .trim()
          .replace(/^./, (str) => str.toUpperCase());
  };

  const getBase64Image = async (uri) => {
    if (!uri) {
      ToastAndroid.show('No image selected. Proceeding without an image.', ToastAndroid.BOTTOM);
      return '';
    }

    try {
      const base64 = await FileSystem.readAsStringAsync(uri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      const mimeType = uri.endsWith('.png') ? 'image/png' : 'image/jpeg';
      return `data:${mimeType};base64,${base64}`;
    } catch (error) {
      console.error(`[${new Date().toISOString()}] Failed to convert image to Base64:`, error.message);
      throw new Error(`Failed to process image: ${error.message}`);
    }
  };

  const notifyAdmin = async (message, requestRefKey, contactPerson, volunteerOrganization) => {
    try {
      if (!message || !requestRefKey || !contactPerson || !volunteerOrganization) {
        throw new Error('Missing required notification parameters');
      }

      const notificationRef = databaseRef(database, 'notifications');
      await push(notificationRef, {
        message,
        requestRefKey,
        contactPerson,
        volunteerOrganization,
        timestamp: serverTimestamp(),
      });

    } catch (error) {
      console.error(`[${new Date().toISOString()}] Failed to notify admin:`, error.message);
    }
  };

  const handleSubmit = async () => {
    try {
      if (!canSubmit) {
        setOpModalVisible(true);
        return;
      }

      if (!user) {
        throw new Error('No authenticated user found');
      }

      if (isLoading) {
        return;
      }

      setIsLoading(true);

      if (!database) {
        throw new Error('Database reference is not available');
      }

      const imageBase64 = imageState ? await getBase64Image(imageState) : '';

      const newDonation = {
        donationId: `DONATION-${Math.floor(100 + Math.random() * 900)}`,
        dateTime: new Date().toISOString(),
        donationDrive: formDataState.donationDrive || '',
        contact: {
          person: formDataState.contactPerson || '',
          number: formDataState.contactNumber || '',
        },
        account: {
          number: formDataState.accountNumber || '',
          name: formDataState.accountName || '',
        },
        address: {
          region: formDataState.region || 'N/A',
          province: formDataState.province || '',
          city: formDataState.city || '',
          barangay: formDataState.barangay || '',
          street: formDataState.street || '',
          fullAddress: `${formDataState.street || ''}, ${formDataState.barangay || ''}, ${formDataState.city || ''}, ${formDataState.province || ''}`.trim(),
        },
        facebookLink: formDataState.facebookLink || 'N/A',
        image: imageBase64,
        status: 'Pending',
        userUid: user.id,
        organization: organizationName, 
        timestamp: serverTimestamp(),
      };

      const donationRef = databaseRef(database, 'callfordonation');
      const newDonationRef = push(donationRef);
      const submissionId = newDonationRef.key;

      await push(donationRef, newDonation);

      const message = `New donation request submitted by ${formDataState.contactPerson || 'Admin'} from ${organizationName} for ${formDataState.donationDrive || 'Donation Drive'} on ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })} at ${new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })} PST.`;
      await notifyAdmin(message, submissionId, formDataState.contactPerson, organizationName);

      await logActivity('Submitted a donation', submissionId, user.id, organizationName);
      await logSubmission('callfordonation', newDonation, submissionId, organizationName, user.id);


      setFormDataState({});
      setImageState(null);
      setErrorMessage(null);
      setModalVisible(true);
    } catch (error) {
      console.error(`[${new Date().toISOString()}] Error saving donation:`, error.message, error.code || 'N/A');
      setErrorMessage(`Failed to save donation: ${error.message} (${error.code || 'N/A'})`);
      setModalVisible(true);
    } finally {
      setIsLoading(false);
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
  };

  const handleBack = () => {
    navigation.navigate('CallforDonations', { formData: formDataState, image: imageState });
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
          <Text style={GlobalStyles.headerTitle}>Call for Donations</Text>
        </View>
      </LinearGradient>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1, marginTop: 80 }}
        keyboardVerticalOffset={0}
      >
        <ScrollView
          contentContainerStyle={styles.scrollViewContent}
          scrollEnabled
          keyboardShouldPersistTaps="handled"
        >
          <View style={GlobalStyles.form}>
            <Text style={GlobalStyles.subheader}>Summary</Text>
            <Text style={GlobalStyles.organizationName}>{organizationName}</Text>
            <View style={GlobalStyles.summarySection}>
              <Text style={GlobalStyles.summarySectionTitle}>Donation Details</Text>
              {[
                'donationDrive',
                'contactPerson',
                'contactNumber',
                'accountNumber',
                'accountName',
                'province',
                'city',
                'barangay',
                'street',
                'facebookLink',
              ].map((field) => (
                <View key={field} style={styles.fieldContainer}>
                  <Text style={styles.label}>{formatLabel(field)}:</Text>
                  <Text style={styles.value}>{formDataState[field] || 'N/A'}</Text>
                </View>
              ))}
              <View style={styles.fieldContainer}>
                <Text style={styles.label}>Donation Image:</Text>
                {imageState ? (
                  <Image
                    source={{ uri: imageState }}
                    style={GlobalStyles.image}
                    resizeMode="contain"
                    onError={(e) => console.error(`[${new Date().toISOString()}] Image load error:`, e.nativeEvent.error)}
                  />
                ) : (
                  <Text style={styles.value}>No image uploaded</Text>
                )}
              </View>
            </View>
            <View style={GlobalStyles.finalButtonContainer}>
              <TouchableOpacity style={GlobalStyles.backButton} onPress={handleBack} disabled={isLoading}>
                <Text style={GlobalStyles.backButtonText}>Back</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[GlobalStyles.submitButton, !canSubmit && { opacity: 0.6 }]}
                onPress={handleSubmit}
                disabled={isLoading || !canSubmit}
              >
                <Text style={GlobalStyles.submitButtonText}>{isLoading ? 'Submitting...' : 'Submit'}</Text>
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
                <Ionicons name="warning-outline" size={60} color={Theme.colors.red} style={GlobalStyles.modalIcon} />
                <Text style={GlobalStyles.modalMessage}>{errorMessage}</Text>
              </>
            ) : (
              <>
                <Ionicons name="checkmark-circle" size={60} color={Theme.colors.primary} style={GlobalStyles.modalIcon} />
                <Text style={GlobalStyles.modalMessage}>Your donation request has been successfully submitted!</Text>
              </>
            )}
          </View>
        }
        onConfirm={handleConfirm}
        onCancel={handleCancel}
        confirmText={errorMessage ? 'Retry' : 'Proceed'}
        showCancel={false}
      />

      <CustomModal
        visible={opModalVisible}
        title={opModalConfig.title}
        message={opModalConfig.message}
        onConfirm={opModalConfig.onConfirm}
        confirmText={opModalConfig.confirmText}
        showCancel={opModalConfig.showCancel}
      />
    </SafeAreaView>
  );
};

export default CallForDonationsSummary;