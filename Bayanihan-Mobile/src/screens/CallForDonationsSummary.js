import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image,SafeAreaView, StyleSheet } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import CustomModal from '../navigation/CustomModal';
import Theme from '../constants/theme';

const CallForDonationsSummary = () => {
  const route = useRoute();
  const { formData = {}, donationImage = null } = route.params || {};
  const navigation = useNavigation();
  const [modalVisible, setModalVisible] = useState(false);

  const formatLabel = (key) => {
    return key
      .replace(/([A-Z])/g, ' $1')
      .trim()
      .replace(/^./, (str) => str.toUpperCase());
  };

  const handleSubmit = () => {
    setModalVisible(true);
  };

  const handleConfirm = () => {
    setModalVisible(false);
    navigation.navigate('Home');
  };

  const handleCancel = () => {
    setModalVisible(false);
  };

  const handleBack = () => {
    navigation.navigate('CallforDonations', { formData, donationImage });
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
      <Text style={styles.subheader}>[Organization Name]</Text>
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
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <Text style={styles.backButtonText}>Back</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
          <Text style={styles.submitButtonText}>Submit</Text>
        </TouchableOpacity>
      </View>

      <CustomModal
        visible={modalVisible}
        title="Success!"
        message={
          <View style={styles.modalContent}>
            <Ionicons
              name="checkmark-circle"
              size={60}
              color="#4059A5"
              style={styles.modalIcon}
            />
            <Text style={styles.modalMessage}>
              Donation call submitted successfully!
            </Text>
          </View>
        }
        onConfirm={handleConfirm}
        onCancel={handleCancel}
        confirmText="Proceed"
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