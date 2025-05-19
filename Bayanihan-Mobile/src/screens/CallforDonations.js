// CallForDonationSubmissionScreen.js
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Platform,
  SafeAreaView,
  StyleSheet,
  KeyboardAvoidingView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';

const CallForDonationSubmissionScreen = () => {
  const navigation = useNavigation();
  const [donationDrive, setDonationDrive] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [contactNumber, setContactNumber] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [accountName, setAccountName] = useState('');
  const [donationImage, setDonationImage] = useState(null); // Could be a URI or base64
  const [province, setProvince] = useState('');
  const [cityMunicipality, setCityMunicipality] = useState('');
  const [barangay, setBarangay] = useState('');
  const [address, setAddress] = useState('');
  const [facebookLink, setFacebookLink] = useState('');
  const scrollViewRef = useRef(null); // Create a ref for the ScrollView
  const handleChooseImage = () => {
    // Implement image selection logic here (e.g., using ImagePicker)
    console.log('Choose Image pressed');
  };

  const handleAddCallForDonation = () => {
    const newDonation = {
      donationDrive,
      contactName,
      contactNumber,
      accountNumber,
      accountName,
      exactDropOffAddress: `${address}, ${barangay}, ${cityMunicipality}, ${province}`,
      facebookLink,
      // You'll likely want to manage a global state or pass this data
      // to the DonationListScreen in a more robust way.
    };
    console.log('New Donation:', newDonation);
    // For now, let's just log the data. In a real app, you'd:
    // 1. Store this data in a global state (Redux, Context)
    // 2. Navigate to the list screen and it would fetch/display this data.
    // 3. Potentially pass the new data directly to the list screen.

    // Reset form fields after adding
    setDonationDrive('');
    setContactPerson('');
    setContactNumber('');
    setAccountNumber('');
    setAccountName('');
    setDonationImage(null);
    setProvince('');
    setCityMunicipality('');
    setBarangay('');
    setAddress('');
    setFacebookLink('');
  };

  const goToDonationList = () => {
    navigation.navigate('DonationList');
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#FFF9F0' }}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 40 : 0} // Adjust offset if needed
      >
        {/* <ScrollView
          contentContainerStyle={styles.container}
          ref={scrollViewRef} // Attach the ref to the ScrollView
        > */}
          <View style={GlobalStyles.headerContainer}>
            <TouchableOpacity
              onPress={() => navigation.openDrawer()}
              style={styles.menuIcon}
            >
              <Ionicons name="menu" size={32} color="white" />
            </TouchableOpacity>
            <Text style={styles.headerText}>Reports Submission</Text>
          </View>


        <ScrollView style={styles.container}>
          <View style={styles.headerButtons}>
            <TouchableOpacity style={styles.viewDataButton} onPress={goToDonationList}>
              <Text style={styles.viewDataButtonText}>View All Data</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.title}>Call For Donation Submission</Text>

          <View style={styles.formContainer}>
            <TextInput
              style={styles.input}
              placeholder="Donation Drive"
              value={donationDrive}
              onChangeText={setDonationDrive}
            />
            <TextInput
              style={styles.input}
              placeholder="Contact Name"
              value={contactPerson}
              onChangeText={setContactPerson}
            />
            <TextInput
              style={styles.input}
              placeholder="Contact Number"
              value={contactNumber}
              onChangeText={setContactNumber}
              keyboardType="phone-pad"
            />
            <TextInput
              style={styles.input}
              placeholder="Account Number"
              value={accountNumber}
              onChangeText={setAccountNumber}
            />
            <TextInput
              style={styles.input}
              placeholder="Account Name"
              value={accountName}
              onChangeText={setAccountName}
            />

            <TouchableOpacity style={styles.uploadButton} onPress={handleChooseImage}>
              <Text>Upload Donation Image:</Text>
              <Text style={styles.chooseFileText}>Choose File No file chosen</Text>
              {/* Optionally display the selected image name or a preview */}
            </TouchableOpacity>

            <View style={styles.locationRow}>
              <TextInput
                style={[styles.input, styles.locationInput]}
                placeholder="Province"
                value={province}
                onChangeText={setProvince}
              />
              <TextInput
                style={[styles.input, styles.locationInput]}
                placeholder="City/Municipality"
                value={cityMunicipality}
                onChangeText={setCityMunicipality}
              />
              <TextInput
                style={[styles.input, styles.locationInput]}
                placeholder="Barangay"
                value={barangay}
                onChangeText={setBarangay}
              />
              <TextInput
                style={[styles.input, styles.locationInput, { flex: 1.5 }]}
                placeholder="(e.g 1234 Singkamas Street)"
                value={address}
                onChangeText={setAddress}
              />
            </View>

            <TextInput
              style={styles.input}
              placeholder="Facebook Link"
              value={facebookLink}
              onChangeText={setFacebookLink}
            />

            <TouchableOpacity style={styles.addDonationButton} onPress={handleAddCallForDonation}>
              <Text style={styles.addDonationButtonText}>Add Call for Donation</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 16,
    backgroundColor: '#fff',
  },
  headerButtons: {
    alignItems: 'flex-end',
    marginBottom: 10,
  },
  viewDataButton: {
    backgroundColor: '#007bff', // Blue button
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 5,
  },
  viewDataButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#e91e63', // Pink color
  },
  formContainer: {
    marginBottom: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
  },
  input: {
    height: 40,
    borderColor: '#ccc',
    borderWidth: 1,
    marginBottom: 12,
    paddingHorizontal: 8,
    borderRadius: 4,
  },
  uploadButton: {
    marginBottom: 12,
  },
  chooseFileText: {
    color: '#777',
    marginLeft: 8,
  },
  locationRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  locationInput: {
    flex: 1,
    marginRight: 8,
  },
  addDonationButton: {
    backgroundColor: '#4caf50', // Green color
    paddingVertical: 10,
    borderRadius: 4,
    alignItems: 'center',
  },
  addDonationButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});

export default CallForDonationSubmissionScreen;