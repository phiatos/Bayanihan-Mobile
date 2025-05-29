import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { ref as databaseRef, push } from 'firebase/database';
import { getDownloadURL, ref as storageRef, uploadBytes } from 'firebase/storage';
import React, { useEffect, useState } from 'react';
import { Image, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { auth, database, storage } from '../configuration/firebaseConfig';
import Theme from '../constants/theme';
import CustomModal from '../navigation/CustomModal';

const CallForDonationsSummary = () => {
  const route = useRoute();
  const { formData = {}, donationImage = null } = route.params || {};
  const navigation = useNavigation();
  const [modalVisible, setModalVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [userUid, setUserUid] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);
  const [organizationName, setOrganizationName] = useState('[Organization Name]');

  useEffect(() => {
    console.log('Database instance in CallForDonationsSummary:', database);
    console.log('Storage instance in CallForDonationsSummary:', storage);
    console.log('Auth instance in CallForDonationsSummary:', auth);

    const unsubscribe = auth.onAuthStateChanged(
      (user) => {
        if (user) {
          setUserUid(user.uid);
          console.log('Logged-in user UID:', user.uid);
          if (database && typeof databaseRef === 'function') {
            const userRef = databaseRef(database, `users/${user.uid}`);
            databaseRef(userRef).once('value')
              .then((snapshot) => {
                const userData = snapshot.val();
                if (userData && userData.group) {
                  setOrganizationName(userData.group);
                }
              })
              .catch((error) => {
                console.error('Error fetching user data:', error.message);
              });
          } else {
            console.warn('Database reference not available for fetching user data');
          }
        } else {
          console.warn('No user is logged in');
          setErrorMessage('Please log in to submit a donation.');
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
  }, []);

  const formatLabel = (key) => {
    return key
      .replace(/([A-Z])/g, ' $1')
      .trim()
      .replace(/^./, (str) => str.toUpperCase());
  };

  const uploadImageToFirebase = async (uri) => {
    try {
      const response = await fetch(uri);
      const blob = await response.blob();
      const imageRef = storageRef(storage, `donationImages/${Date.now()}.jpg`);
      await uploadBytes(imageRef, blob);
      const url = await getDownloadURL(imageRef);
      console.log('Image uploaded successfully:', url);
      return url;
    } catch (error) {
      console.error('Error uploading image:', error.message);
      throw new Error('Failed to upload image: ' + error.message);
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
      let imageUrl = '';
      if (donationImage) {
        imageUrl = await uploadImageToFirebase(donationImage);
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
          street: formData.address || '',
          fullAddress: `${formData.address}, ${formData.barangay}, ${formData.city}, ${formData.province}`,
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
      console.log('Donation saved successfully');
      setErrorMessage(null);
      setModalVisible(true);
    } catch (error) {
      console.error('Error saving donation:', error.message);
      setErrorMessage('Failed to save donation: ' + error.message);
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
    navigation.navigate('CallforDonations', { formData, donationImage }); // Matches old code's route name
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#FFF9F0' }}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.openDrawer()}
            style={styles.menuIcon}
          >
            <Ionicons name="menu" size={32} color="white" />
          </TouchableOpacity>
          <Text style={styles.headerText}>Call for Donations</Text>
        </View>
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
              'address',
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
              {donationImage ? (
                <Image
                  source={{ uri: donationImage }}
                  style={styles.image}
                  resizeMode="cover"
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
                    color="#4059A5"
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

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFF9F0',
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