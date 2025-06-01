import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, CommonActions } from '@react-navigation/native';
import { ref as databaseRef, push, get } from 'firebase/database';
import React, { useState, useEffect } from 'react';
import { Alert, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { auth, database } from '../configuration/firebaseConfig';
import Theme from '../constants/theme';
import CustomModal from '../components/CustomModal';
import GlobalStyles from '../styles/GlobalStyles';
import RDANAStyles from '../styles/RDANAStyles';

const ReportSummary = () => {
  const route = useRoute();
  const [reportData, setReportData] = useState(route.params?.reportData || {});
  const { userUid } = route.params || {};
  const navigation = useNavigation();
  const [modalVisible, setModalVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const [organizationName, setOrganizationName] = useState('Loading...'); // Initialize with loading state

  // Fetch organization name from Firebase
  useEffect(() => {
    const fetchOrganizationName = async () => {
      if (!userUid) {
        console.warn('No user UID provided');
        setOrganizationName('Unknown Organization');
        return;
      }

      try {
        const userRef = databaseRef(database, `users/${userUid}`);
        const snapshot = await get(userRef);
        const userData = snapshot.val();
        if (userData && userData.organization) {
          setOrganizationName(userData.organization);
        } else {
          console.warn('No organization found for user:', userUid);
          setOrganizationName('Unknown Organization');
          Alert.alert('Warning', 'No organization found in your profile. Using default name.');
        }
      } catch (error) {
        console.error('Error fetching organization name:', error.message);
        setOrganizationName('Unknown Organization');
        Alert.alert('Error', 'Failed to fetch organization name: ' + error.message);
      }
    };

    fetchOrganizationName();
  }, [userUid]);

  const handleSubmit = async () => {
    if (!userUid) {
      console.error('No user UID available. Cannot submit report.');
      setErrorMessage('User not authenticated. Please log in again.');
      setModalVisible(true);
      return;
    }

    if (isLoading) return;
    setIsLoading(true);

    try {
      console.log('Database instance in ReportSummary:', database);
      if (!database || typeof databaseRef !== 'function') {
        throw new Error('Database reference is not available');
      }

      const newReport = {
        reportID: reportData.reportID || `RPT-${Date.now()}`,
        AreaOfOperation: reportData.AreaOfOperation || '',
        DateOfReport: reportData.DateOfReport || '',
        calamityAreaDropdown: reportData.calamityAreaDropdown || '',  
        completionTimeOfIntervention: reportData.completionTimeOfIntervention || '',
        startingDateOfOperation: reportData.startingDateOfOperation || '',
        EndDate: reportData.EndDate || '',
        NoOfIndividualsOrFamilies: parseInt(reportData.NoOfIndividualsOrFamilies) || 0,
        reliefPacks: parseInt(reportData.reliefPacks) || 0,
        NoOfHotMeals: parseInt(reportData.hotMeals) || 0,
        LitersOfWater: parseInt(reportData.LitersOfWater) || 0,
        NoOfVolunteersMobilized: parseInt(reportData.NoOfVolunteersMobilized) || 0,
        NoOfOrganizationsActivated: parseInt(reportData.NoOfOrganizationsActivated) || 0,
        TotalValueOfInKindDonations: parseInt(reportData.TotalValueOfInKindDonations) || 0,
        TotalMonetaryDonations: parseInt(reportData.TotalMonetaryDonations) || 0,
        notes: reportData.notes || '',
        status: 'Pending',
        userUid: userUid,
        timestamp: Date.now(),
        organization: organizationName, // Use fetched organizationName
        
      };

      // Save to reports/submitted subnode
      const reportRef = databaseRef(database, 'reports/submitted');
      await push(reportRef, newReport);
      console.log('Report saved successfully to reports/submitted');
      setErrorMessage(null);
      setModalVisible(true);
    } catch (error) {
      console.error('Error saving report:', error.message);
      setErrorMessage('Failed to save report: ' + error.message);
      setModalVisible(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirm = () => {
    setModalVisible(false);
    if (!errorMessage) {
      // SUCCESS: Reset the navigation stack and go to the Home screen
      navigation.dispatch(
        CommonActions.reset({
          index: 0,
          routes: [{ name: 'Home' }],
        })
      );
    } else {
      // ERROR: Navigate to ReportSubmission to allow retry
      navigation.navigate('ReportSubmission', { reportData });
    }
  };

  const handleCancel = () => {
    setModalVisible(false);
    if (errorMessage) {
      navigation.navigate('ReportSubmission', { reportData });
    }
  };

  const handleBack = () => {
    navigation.navigate('ReportSubmission', { reportData });
  };

  const formatLabel = (key) => {
    return key.replace(/([A-Z])/g, ' $1').toLowerCase();
  };

  const formatDateDisplay = (dateStr) => {
    if (!dateStr) return 'N/A';
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
      return dateStr;
    }
    const date = new Date(dateStr);
    return !isNaN(date) ? date.toLocaleDateString('en-GB') : 'N/A';
  };

  const formatTimeDisplay = (timeStr) => {
    if (!timeStr) return 'N/A';
    if (/(^([0-9]{1,2}):([0-9]{2})\s(AM|PM)$)/i.test(timeStr)) {
      return timeStr;
    }
    const date = new Date(`2000-01-01T${timeStr}`);
    if (!isNaN(date.getTime())) {
      return date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      });
    }
    if (timeStr.includes(':')) {
      return timeStr;
    }
    return 'N/A';
  };

  return (
    <View style={styles.container}>
          <View style={GlobalStyles.headerContainer}>
            <TouchableOpacity onPress={() => navigation.openDrawer()} style={GlobalStyles.headerMenuIcon}>
              <Ionicons name="menu" size={32} color="white" />
            </TouchableOpacity>
            <Text style={GlobalStyles.headerTitle}>Reports Submission</Text>
          </View>
    
        <Text style={styles.subheader}>{organizationName}</Text>
        <ScrollView contentContainerStyle={RDANAStyles.scrollViewContent}>
        <View style={styles.formContainer}>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Basic Information</Text>
            {['reportID', 'AreaOfOperation', 'DateOfReport'].map((field) => (
              <View key={field} style={styles.fieldContainer}>
                <Text style={styles.label}>{formatLabel(field)}</Text>
                <Text style={styles.value}>{reportData[field] || 'N/A'}</Text>
              </View>
            ))}
            
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Relief Operations</Text>
            {['calamityAreaDropdown','completionTimeOfIntervention', 'startingDateOfOperation', 'EndDate', 'NoOfIndividualsOrFamilies', 'LitersOfWater', 'NoOfVolunteersMobilized', 'NoOfOrganizationsActivated', 'TotalValueOfInKindDonations', 'TotalMonetaryDonations'].map((field) => (
              <View key={field} style={styles.fieldContainer}>
                <Text style={styles.label}>{formatLabel(field)}</Text>
                <Text style={styles.value}>{reportData[field] || 'None'}</Text>
              </View>
            ))}
          </View>
            
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Additional Updates</Text>
              <View style={styles.fieldContainer}>
                <Text style={styles.label}>Notes/Additional Information</Text>
                <Text style={styles.value}>{reportData.notes || 'None'}</Text>
              </View>
           
          </View>
        </View>

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={handleBack}
            disabled={isLoading}
          >
            <Text style={styles.backButtonText}>Back</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.submitButton}
            onPress={handleSubmit}
            disabled={isLoading}
          >
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
                  <Text style={styles.modalMessage}>Report submitted successfully!</Text>
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
    marginBottom: 10,
  },
  section: {
    marginVertical: 10,
    marginHorizontal: 15,
    borderWidth: 3,
    backgroundColor: '#FFF9F0',
    borderColor: '#4059A5',
    borderRadius: 10,
    padding: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 20,
    color: '#14AEBB',
    marginBottom: 10,
    fontFamily: 'Poppins_SemiBold',
  },
  fieldContainer: {
    marginBottom: 5,
  },
  label: {
    fontSize: 16,
    color: Theme.colors.primary,
    textTransform: 'capitalize',
    fontFamily: 'Poppins_Medium',
  },
  value: {
    fontSize: 14,
    color: Theme.colors.black,
    marginTop: 2,
    fontFamily: 'Poppins_Regular',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginHorizontal: 10,
    marginBottom: 40,
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

export default ReportSummary;