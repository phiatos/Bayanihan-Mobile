import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, CommonActions } from '@react-navigation/native';
import { ref as databaseRef, push, get } from 'firebase/database';
import React, { useEffect, useState } from 'react';
import { Alert, Image, KeyboardAvoidingView, Platform, SafeAreaView, ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import * as FileSystem from 'expo-file-system';
import { auth, database } from '../configuration/firebaseConfig';
import Theme from '../constants/theme';
import CustomModal from '../components/CustomModal';
import GlobalStyles from '../styles/GlobalStyles';
import styles from '../styles/CallForDonationsStyles';
import { LinearGradient } from 'expo-linear-gradient';

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

  const getBase64Image = async (uri) => {
    if (!uri) { 
      console.warn('No image URI provided');
      Alert.alert('Warning', 'No image selected. Proceeding without an image.');
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
      console.log('Submitting donation with formData:', formData, 'and image URI:', image);
      let imageBase64 = '';
      if (image) {
        imageBase64 = await getBase64Image(image);
      } else {
        console.log('No image URI provided, proceeding without image');
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
        image: imageBase64 || '',
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
  };

  const handleBack = () => {
    console.log('Navigating back to CallForDonations with formData:', formData, 'and image:', image);
    navigation.navigate('CallforDonations', { formData, image });
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