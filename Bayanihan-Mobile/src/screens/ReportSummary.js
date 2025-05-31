import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, CommonActions } from '@react-navigation/native'; // Import CommonActions
import { ref as databaseRef, push } from 'firebase/database';
import React, { useState } from 'react';
import { SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { database } from '../configuration/firebaseConfig';
import Theme from '../constants/theme';
import CustomModal from '../components/CustomModal';

const ReportSummary = () => {
  const route = useRoute();
  // Use state to manage reportData so it can be passed back if needed
  const [reportData, setReportData] = useState(route.params?.reportData || {});
  const { userUid, organizationName = '[Organization Name]' } = route.params || {};
  const navigation = useNavigation();
  const [modalVisible, setModalVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);

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
        timeOfIntervention: reportData.timeOfIntervention || '',
        submittedBy: reportData.submittedBy || '',
        dateOfReport: reportData.dateOfReport || '',
        operationDate: reportData.operationDate || '',
        families: parseInt(reportData.families) || 0,
        foodPacks: parseInt(reportData.foodPacks) || 0,
        hotMeals: parseInt(reportData.hotMeals) || 0,
        water: parseInt(reportData.water) || 0,
        volunteers: parseInt(reportData.volunteers) || 0,
        amountRaised: parseInt(reportData.amountRaised) || 0,
        inKindValue: parseInt(reportData.inKindValue) || 0,
        urgentNeeds: reportData.urgentNeeds || '',
        remarks: reportData.remarks || '',
        status: 'Pending',
        userUid: userUid,
        timestamp: Date.now(),
        organization: organizationName,
      };

      // Save to reports/submitted subnode
      const reportRef = databaseRef(database, 'reports/submitted');
      await push(reportRef, newReport);
      console.log('Report saved successfully to reports/submitted');
      setErrorMessage(null); // Clear any previous error
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
          routes: [
            { name: 'Home' }, // Assuming 'Home' is the name of your dashboard/main screen
          ],
        })
      );
    } else {
      // ERROR: Navigate to Login or stay on current screen
      // For now, we'll navigate back to ReportSubmission to allow retry if error
      navigation.navigate('ReportSubmission', { reportData });
    }
  };

  const handleCancel = () => {
    setModalVisible(false);
    // If there was an error and user cancels, they might want to correct it.
    // So, we navigate back to ReportSubmission.
    if (errorMessage) {
      navigation.navigate('ReportSubmission', { reportData });
    }
    // If no error, just close modal and stay on summary.
  };

  const handleBack = () => {
    // Navigate back to ReportSubmission and pass the current reportData
    navigation.navigate('ReportSubmission', { reportData });
  };

  const formatLabel = (key) => {
    return key.replace(/([A-Z])/g, ' $1').toLowerCase();
  };

  const formatDateDisplay = (dateStr) => {
    if (!dateStr) return 'N/A';
    // If the format is YYYY-MM-DD, just return it.
    if(/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
        return dateStr;
    }
    // Otherwise, try to parse it
    const date = new Date(dateStr);
    return !isNaN(date) ? date.toLocaleDateString('en-GB') : 'N/A';
  };

  const formatTimeDisplay = (timeStr) => {
    if (!timeStr) return 'N/A';
    // If the format is already HH:MM AM/PM, just return it.
    if (/(^([0-9]{1,2}):([0-9]{2})\s(AM|PM)$)/i.test(timeStr)) {
        return timeStr;
    }
    // Otherwise, try to parse it (assuming it's a parsable date string with time)
    const date = new Date(`2000-01-01T${timeStr}`); // Create a dummy date for parsing time
    if (!isNaN(date.getTime())) {
        return date.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true,
        });
    }
    // As a fallback, return the original string if it looks like a time but parsing failed
    if (timeStr.includes(':')) {
        return timeStr;
    }
    return 'N/A';
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
      <ScrollView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.menuIcon} onPress={() => navigation.openDrawer()}>
            <Ionicons name="menu" size={28} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerText}>Reports Summary</Text>
        </View>
        <Text style={styles.subheader}>{organizationName}</Text>

        <View style={styles.formContainer}>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Basic Information</Text>
            {['reportID', 'submittedBy'].map((field) => (
              <View key={field} style={styles.fieldContainer}>
                <Text style={styles.label}>{formatLabel(field)}</Text>
                <Text style={styles.value}>{reportData[field] || 'N/A'}</Text>
              </View>
            ))}
            <View style={styles.fieldContainer}>
              <Text style={styles.label}>Time of Intervention</Text>
              <Text style={styles.value}>{formatTimeDisplay(reportData.timeOfIntervention)}</Text>
            </View>
            <View style={styles.fieldContainer}>
              <Text style={styles.label}>Date of Report</Text>
              <Text style={styles.value}>{formatDateDisplay(reportData.dateOfReport)}</Text>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Relief Operations</Text>
            {['operationDate', 'families', 'foodPacks', 'hotMeals', 'water', 'volunteers', 'amountRaised', 'inKindValue'].map((field) => (
              <View key={field} style={styles.fieldContainer}>
                <Text style={styles.label}>{formatLabel(field)}</Text>
                <Text style={styles.value}>
                  {field === 'operationDate' ? formatDateDisplay(reportData[field]) : reportData[field] || 'N/A'}
                </Text>
              </View>
            ))}
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Additional Updates</Text>
            {['urgentNeeds', 'remarks'].map((field) => (
              <View key={field} style={styles.fieldContainer}>
                <Text style={styles.label}>{formatLabel(field)}</Text>
                <Text style={styles.value}>{reportData[field] || 'None'}</Text>
              </View>
            ))}
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
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    flex: 1,
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