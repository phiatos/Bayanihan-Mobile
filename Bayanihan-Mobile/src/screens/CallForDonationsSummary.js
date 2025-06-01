import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { ref as databaseRef, push, get } from 'firebase/database';
import { getDownloadURL, ref as storageRef, uploadBytes } from 'firebase/storage';
import React, { useEffect, useState } from 'react';
import { Alert, Image, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { auth, database, storage } from '../configuration/firebaseConfig';
import Theme from '../constants/theme';
import CustomModal from '../components/CustomModal';
import GlobalStyles from '../styles/GlobalStyles';

const CallForDonationsSummary = () => {
  const route = useRoute();
  const { formData = {}, image = null } = route.params || {};
  const navigation = useNavigation();
  const [modalVisible, setModalVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [userUid, setUserUid] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);
  const [organizationName, setOrganizationName] = useState('Loading...');

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
            Alert.alert('Warning', 'No organization found in your profile. Using default name.');
          }
        } catch (error) {
          console.error('Error fetching organization name:', error.message);
          setOrganizationName('Unknown Organization');
          Alert.alert('Error', 'Failed to fetch organization name: ' + error.message);
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

  const uploadImageToFirebase = async (uri) => {
    if (!uri) {
      console.warn('No image URI provided for upload');
      return '';
    }
    try {
      console.log('Attempting to upload image with URI:', uri);
      // Validate URI format
      if (!uri.startsWith('file://') && !uri.startsWith('http')) {
        throw new Error('Invalid image URI format');
      }
      // Check if storage is initialized
      if (!storage) {
        throw new Error('Firebase Storage is not initialized');
      }
      // Verify authentication
      if (!auth.currentUser) {
        throw new Error('User is not authenticated');
      }
      const response = await fetch(uri);
      if (!response.ok) {
        throw new Error(`Failed to fetch image from URI: ${response.statusText}`);
      }
      const blob = await response.blob();
      const imageRef = storageRef(storage, `images/${Date.now()}.jpg`);
      await uploadBytes(imageRef, blob);
      const url = await getDownloadURL(imageRef);
      console.log('Image uploaded successfully:', url);
      return url;
    } catch (error) {
      console.error('Detailed error uploading image:', error);
      throw new Error(`Failed to upload image: ${error.message}`);
    }
  };

  const handleSubmit = async () => {
    if (!userUid) {
      console.error('No user UID available. Cannot submit donation.');
      setErrorMessage('User not authenticated. Please log in again.');
      setModalVisible(true);
      return;
    }

    if (isLoading) return;
    setIsLoading(true);

    try {
      console.log('Submitting donation with formData:', formData, 'and image:', image);
      let imageUrl = '';
      if (image) {
        imageUrl = await uploadImageToFirebase(image);
      } else {
        console.log('No image provided, proceeding without image');
      }

      const newDonation = {
        donationId: `DONATION-${Math.floor(100 + Math.random() * 900)}`,
        dateTime: new Date().toISOString(),
        donationDrive: formData.donationDrive || '',
        contact: {
          person: formData.contactPerson || '',
          number: formData.contactNumber || '',
        },
        account: {
          number: formData.accountNumber || '',
          name: formData.accountName || '',
        },
        address: {
          region: formData.region || 'N/A',
          province: formData.province || '',
          city: formData.city || '',
          barangay: formData.barangay || '',
          street: formData.street || '',
          fullAddress: `${formData.street || ''}, ${formData.barangay || ''}, ${formData.city || ''}, ${formData.province || ''}`.trim(),
        },
        facebookLink: formData.facebookLink || 'N/A',
        image: imageUrl || '',
        status: 'Pending',
        userUid: userUid,
        timestamp: Date.now(),
      };

      if (!database || typeof databaseRef !== 'function') {
        throw new Error('Database reference is not available');
      }

      const donationRef = databaseRef(database, 'callfordonation');
      await push(donationRef, newDonation);
      console.log('Donation saved successfully:', newDonation);
      setErrorMessage(null);
      setModalVisible(true);
    } catch (error) {
      console.error('Error saving donation:', error.message);
      setErrorMessage(`Failed to save donation: ${error.message}`);
      setModalVisible(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirm = () => {
    setModalVisible(false);
    navigation.navigate('Home');
  };

  const handleCancel = () => {
    setModalVisible(false);
  };

  const handleBack = () => {
    console.log('Navigating back to CallForDonations with formData:', formData, 'and image:', image);
    navigation.navigate('CallForDonations', { formData, image });
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#FFF9F0' }}>
      <View style={GlobalStyles.headerContainer}>
        <TouchableOpacity
          onPress={() => navigation.openDrawer()}
          style={GlobalStyles.headerMenuIcon}
        >
          <Ionicons name="menu" size={32} color="white" />
        </TouchableOpacity>
        <Text style={GlobalStyles.headerTitle}>Call for Donations</Text>
      </View>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.subheader}>{organizationName}</Text>
        <View style={styles.formContainer}>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Donation Details</Text>
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
                  {formData[field] || 'N/A'}
                </Text>
              </View>
            ))}
            <View style={styles.fieldContainer}>
              <Text style={styles.label}>Donation Image:</Text>
              {image ? (
                <Image
                  source={{ uri: image }}
                  style={styles.image}
                  resizeMode="cover"
                  onError={(e) => console.error('Image load error:', e.nativeEvent.error)}
                />
              ) : (
                <Text style={styles.value}>No image uploaded</Text>
              )}
            </View>
          </View>
        </View>
        <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.backButton} onPress={handleBack} disabled={isLoading}>
            <Text style={styles.backButtonText}>Back</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.submitButton} onPress={handleSubmit} disabled={isLoading}>
            <Text style={styles.submitButtonText}>{isLoading ? 'Submitting...' : 'Submit'}</Text>
          </TouchableOpacity>
        </View>

        <CustomModal
          visible={modalVisible}
          title={errorMessage ? 'Error' : 'Success!'}
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
                    Donation call submitted successfully!
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
      </ScrollView>
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

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFF9F0',
  },
  contentContainer: {
    paddingVertical: spacing.small,
    paddingBottom: spacing.xlarge * 2,
  },
  menuIcon: {
    position: 'absolute',
    left: 30,
    top: 50,
  },
  headerText: {
    color: Theme.colors.white,
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
  fieldContainer: {
    marginBottom: 10,
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
  image: {
    width: 200,
    height: 150,
    borderRadius: 10,
    marginTop: 5,
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

export default CallForDonationsSummary;