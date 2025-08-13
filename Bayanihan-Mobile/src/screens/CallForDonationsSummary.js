import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, CommonActions } from '@react-navigation/native';
import { ref as databaseRef, push, get, serverTimestamp } from 'firebase/database';
import React, { useEffect, useState } from 'react';
import { Image, KeyboardAvoidingView, Platform, SafeAreaView, ScrollView, StatusBar, StyleSheet, ToastAndroid, TouchableOpacity, View, Text } from 'react-native';
import * as FileSystem from 'expo-file-system';
import { auth, database } from '../configuration/firebaseConfig';
import Theme from '../constants/theme';
import CustomModal from '../components/CustomModal';
import GlobalStyles from '../styles/GlobalStyles';
import styles from '../styles/CallForDonationsStyles';
import { LinearGradient } from 'expo-linear-gradient';
import { logActivity } from '../components/logActivity';
import { logSubmission } from '../components/logSubmission';

const CallForDonationsSummary = () => {
  const route = useRoute();
  const { formData = {}, image = null } = route.params || {};
  const navigation = useNavigation();
  const [modalVisible, setModalVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [userUid, setUserUid] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);
  const [organizationName, setOrganizationName] = useState('Loading...');
  const [formDataState, setFormDataState] = useState(formData);
  const [imageState, setImageState] = useState(image);

  useEffect(() => {
    console.log('Received params in CallForDonationsSummary:', { formData, image });
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        setUserUid(user.uid);
        console.log('Logged-in user UID:', user.uid);
        try {
          const userRef = databaseRef(database, `users/${user.uid}`);
          const snapshot = await get(userRef);
          const userData = snapshot.val();
          if (userData && userData.organization) {
            setOrganizationName(userData.organization);
          } else {
            console.warn('No organization found for user:', user.uid);
            setOrganizationName('Unknown Organization');
            ToastAndroid.show('No organization found in your profile. Using default name.', ToastAndroid.BOTTOM);
          }
        } catch (error) {
          console.error('Error fetching organization name:', error.message);
          setOrganizationName('Unknown Organization');
          ToastAndroid.show('Failed to fetch organization name: ' + error.message, ToastAndroid.BOTTOM);
        }
      } else {
        console.warn('No user is logged in');
        setErrorMessage('Please log in to submit a donation.');
        setModalVisible(true);
      }
    }, (error) => {
      console.error('Auth state listener error:', error.message);
      setErrorMessage('Authentication error: ' + error.message);
      setModalVisible(true);
    });

    return () => unsubscribe();
  }, []);

  const formatLabel = (key) => {
    return (
      (key === 'facebookLink' ? 'Facebook Link' : key)
        .replace(/([A-Z])/g, ' $1')
        .trim()
        .replace(/^./, (str) => str.toUpperCase())
    );
  };

  const getBase64Image = async (uri) => {
    if (!uri) {
      console.warn('No image URI provided');
      ToastAndroid.show('No image selected. Proceeding without an image.', ToastAndroid.BOTTOM);
      return '';
    }
    try {
      console.log('Converting image to Base64:', uri);
      const base64 = await FileSystem.readAsStringAsync(uri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      const mimeType = uri.endsWith('.png') ? 'image/png' : 'image/jpeg';
      return `data:${mimeType};base64,${base64}`;
    } catch (error) {
      console.error('Failed to convert image to Base64:', error, error.message, error.stack);
      setErrorMessage(`Failed to process image: ${error.message}`);
      setModalVisible(true);
      throw error;
    }
  };

  const notifyAdmin = async (message, requestRefKey, contactPerson, volunteerOrganization) => {
    try {
      const notificationRef = databaseRef(database, 'notifications');
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
    if (!auth.currentUser) {
      console.error('No authenticated user found');
      setErrorMessage('Please log in to submit a donation.');
      setModalVisible(true);
      return;
    }
    if (!userUid) {
      console.error('No user UID available. Cannot submit donation.');
      setErrorMessage('User not authenticated. Please log in again.');
      setModalVisible(true);
      return;
    }
    if (isLoading) return;
    setIsLoading(true);

    try {
      console.log('Submitting donation with formData:', formDataState, 'and image URI:', imageState);
      console.log('Database object:', database);
      let imageBase64 = '';
      if (imageState) {
        imageBase64 = await getBase64Image(imageState);
      } else {
        console.log('No image URI provided, proceeding without image');
      }

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
        image: imageBase64 || '',
        status: 'Pending',
        userUid: userUid,
        timestamp: serverTimestamp(),
      };

      console.log('New donation object:', newDonation);
      if (!database) {
        throw new Error('Database reference is not available');
      }

      console.log('Creating database reference for callfordonation');
      const donationRef = databaseRef(database, 'callfordonation');
      const newDonationRef = push(donationRef);
      const submissionId = newDonationRef.key;
      await push(donationRef, newDonation);

      // Notify admin
      const message = `New donation request submitted by ${formDataState.contactPerson || 'Unknown'} from ${organizationName} for ${formDataState.donationDrive || 'Donation Drive'} on ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })} at ${new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })} PST.`;
      await notifyAdmin(message, submissionId, formDataState.contactPerson, organizationName);

      await logActivity('Submitted a donation', submissionId);
      await logSubmission('callfordonation', newDonation, submissionId);
      console.log('Donation saved successfully:', newDonation);

      // Reset form data and image
      setFormDataState({});
      setImageState(null);

      setErrorMessage(null);
      setModalVisible(true);
    } catch (error) {
      console.error('Error saving donation:', error.message, error.code, error.stack);
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
    console.log('Navigating back to CallForDonations with formData:', formDataState, 'and image:', imageState);
    navigation.navigate('CallforDonations', { formData: formDataState, image: imageState });
  };

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
          <Text style={[GlobalStyles.headerTitle]}>Call for Donations </Text>
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
                  <Text style={styles.value}>
                    {formDataState[field] || 'N/A'}
                  </Text>
                </View>
              ))}
              <View style={styles.fieldContainer}>
                <Text style={styles.label}>Donation Image:</Text>
                {imageState ? (
                  <Image
                    source={{ uri: imageState }}
                    style={styles.image}
                    resizeMode="cover"
                    onError={(e) => console.error('Image load error:', e.nativeEvent.error)}
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
              <TouchableOpacity style={GlobalStyles.submitButton} onPress={handleSubmit} disabled={isLoading}>
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
            ) : (
              <>
                <Ionicons
                  name="checkmark-circle"
                  size={60}
                  color={Theme.colors.primary}
                  style={styles.modalIcon}
                />
                <Text style={styles.modalMessage}>
                  Your donation request has been successfully submitted!
                </Text>
              </>
            )}
          </View>
        }
        onConfirm={handleConfirm}
        onCancel={handleCancel}
        confirmText={errorMessage ? 'Retry' : 'Proceed'}
        showCancel={false}
      />
    </SafeAreaView>
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

export default CallForDonationsSummary;