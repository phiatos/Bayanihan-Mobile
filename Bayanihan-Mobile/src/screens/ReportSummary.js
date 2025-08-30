import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, CommonActions } from '@react-navigation/native';
import { ref as databaseRef, push, get, serverTimestamp } from 'firebase/database';
import React, { useState, useEffect } from 'react';
import { KeyboardAvoidingView, Platform, SafeAreaView, ScrollView, StatusBar, Text, ToastAndroid, TouchableOpacity, View } from 'react-native';
import { auth, database } from '../configuration/firebaseConfig';
import Theme from '../constants/theme';
import CustomModal from '../components/CustomModal';
import GlobalStyles from '../styles/GlobalStyles';
import styles from '../styles/ReportSubmissionStyles';
import { LinearGradient } from 'expo-linear-gradient';
import { logActivity } from '../components/logActivity';
import { logSubmission } from '../components/logSubmission';

const ReportSummary = () => {
  const route = useRoute();
  const [reportData, setReportData] = useState(route.params?.reportData || {});
  const { userUid, organizationName: orgNameFromParams } = route.params || {};
  const navigation = useNavigation();
  const [modalVisible, setModalVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const [organizationName, setOrganizationName] = useState(orgNameFromParams || 'Loading...');

  // Fetch organization name from Firebase if not provided in route params
  useEffect(() => {
    const fetchOrganizationName = async () => {
      if (orgNameFromParams) {
        setOrganizationName(orgNameFromParams);
        return;
      }
      if (!userUid) {
        console.warn('No user UID provided');
        setOrganizationName('');
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
          setOrganizationName('');
          ToastAndroid.show('No organization found in your profile. Using default name.', ToastAndroid.BOTTOM);
        }
      } catch (error) {
        console.error('Error fetching organization name:', error.message);
        setOrganizationName('');
        ToastAndroid.show('Failed to fetch organization name: ' + error.message, ToastAndroid.BOTTOM);
      }
    };

    fetchOrganizationName();
  }, [userUid, orgNameFromParams]);

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
    if (!userUid) {
      console.error('No user UID available. Cannot submit report.');
      setErrorMessage('User not authenticated. Please log in again.');
      setModalVisible(true);
      return;
    }

    if (isLoading) return;
    setIsLoading(true);

    try {
      if (!database) {
        throw new Error('Database reference is not available');
      }

      // Use CalamityType and CalamityName from reportData
      const CalamityName = reportData.CalamityName || 'Unknown Calamity';
      const CalamityType = reportData.CalamityType || 'Unknown Type';
      const calamityArea = `${CalamityType} - ${CalamityName} (by ${organizationName})`;

      const newReport = {
        reportID: reportData.reportID || `REPORTS-${Math.floor(100000 + Math.random() * 900000)}`,
        AreaOfOperation: reportData.AreaOfOperation || '',
        DateOfReport: reportData.DateOfReport || '',
        CalamityName: CalamityName,
        CalamityType: CalamityType,
        TimeOfIntervention: reportData.completionTimeOfIntervention || reportData.TimeOfIntervention || '',
        StartDate: reportData.StartDate || '',
        EndDate: reportData.EndDate || '',
        NoOfIndividualsOrFamilies: parseInt(reportData.NoOfIndividualsOrFamilies) || 0,
        NoOfFoodPacks: parseInt(reportData.NoOfFoodPacks) || 0,
        NoOfHotMeals: parseInt(reportData.hotMeals) || 0,
        LitersOfWater: parseInt(reportData.LitersOfWater) || 0,
        NoOfVolunteersMobilized: parseInt(reportData.NoOfVolunteersMobilized) || 0,
        NoOfOrganizationsActivated: parseInt(reportData.NoOfOrganizationsActivated) || 0,
        TotalValueOfInKindDonations: parseInt(reportData.TotalValueOfInKindDonations) || 0,
        TotalMonetaryDonations: parseInt(reportData.TotalMonetaryDonations) || 0,
        NotesAdditionalInformation: reportData.NotesAdditionalInformation || 'No additional notes',
        status: 'Pending',
        userUid: userUid,
        VolunteerGroupName: organizationName || 'Not Assigned',
        timestamp: serverTimestamp(),
        organization: organizationName,
        coordinates: reportData.coordinates || null,
      };

      const reportRef = databaseRef(database, 'reports/verification');
      const newReportRef = push(reportRef);
      const submissionId = newReportRef.key;

      // Notify admin with detailed message using CalamityName
      const message = `New report submitted by ${reportData.contactPerson || 'Unknown'} from ${organizationName} for ${CalamityName} on ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })} at ${new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })} PST.`;
      await notifyAdmin(message, submissionId, reportData.contactPerson, organizationName);

      // Save to reports/verification
      await push(reportRef, newReport);

      // Also save to reports/submitted for logging
      await push(databaseRef(database, 'reports/submitted'), newReport);

      await logActivity('Submitted a report', submissionId);
      await logSubmission('reports/submitted', newReport, submissionId);
      console.log('Report saved successfully to Firebase');

      // Reset form data
      setReportData({});

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

  const handleCancel  = () => {
    setModalVisible(false);
    navigation.navigate('ReportSubmission', { reportData });
  };

  const handleBack = () => {
    navigation.navigate('ReportSubmission', { reportData });
  };

  const handleSuccessConfirm = () => {
          setModalVisible(true);
    navigation.dispatch(
      CommonActions.reset({
        index: 0,
        routes: [{ name: 'Volunteer Dashboard' }],
      })
    );
  };


  const formatLabel = (key) => {
    let label = key.replace(/([A-Z])/g, ' $1').trim();
    // Add period after "no" in specific fields
    if (['no of individuals or families', 'no of food packs', 'no of hot meals', 'no of volunteers mobilized', 'no of organizations activated'].includes(label.toLowerCase())) {
      label = label.replace(/no /i, 'No. ');
    }
    // Capitalize first letter of each word
    return label.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };

  const formatDateDisplay = (dateStr) => {
    if (!dateStr) return 'N/A';
    if (/^\d{2}-\d{2}-\d{4}$/.test(dateStr)) {
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
          <Text style={[GlobalStyles.headerTitle, { color: Theme.colors.primary }]}>Reports Submission</Text>
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
              <Text style={GlobalStyles.summarySectionTitle}>Basic Information</Text>
              {['reportID', 'AreaOfOperation', 'DateOfReport',].map((field) => (
                <View key={field} style={styles.fieldContainer}>
                  <Text style={styles.label}>{formatLabel(field)}</Text>
                  <Text style={styles.value}>{reportData[field] || 'N/A'}</Text>
                </View>
              ))}
            </View>

            <View style={GlobalStyles.summarySection}>
              <Text style={GlobalStyles.summarySectionTitle}>Relief Operations</Text>
              {['calamityArea', 'completionTimeOfIntervention', 'StartDate', 'EndDate', 'NoOfIndividualsOrFamilies', 'NoOfFoodPacks', 'hotMeals', 'LitersOfWater', 'NoOfVolunteersMobilized', 'NoOfOrganizationsActivated', 'TotalValueOfInKindDonations', 'TotalMonetaryDonations'].map((field) => (
                <View key={field} style={styles.fieldContainer}>
                  <Text style={styles.label}>{formatLabel(field)}</Text>
                  <Text style={styles.value}>
                    {reportData[field]
                      ? (field === 'completionTimeOfIntervention'
                          ? formatTimeDisplay(reportData[field])
                          : ['StartDate', 'EndDate'].includes(field)
                            ? formatDateDisplay(reportData[field])
                            : reportData[field])
                      : 'N/A'}
                  </Text>
                </View>
              ))}
            </View>

            <View style={GlobalStyles.summarySection}>
              <Text style={GlobalStyles.summarySectionTitle}>Additional Updates</Text>
              <View style={styles.fieldContainer}>
                <Text style={styles.label}>{formatLabel('NotesAdditionalInformation')}</Text>
                <Text style={styles.value}>{reportData.NotesAdditionalInformation || 'None'}</Text>
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
                <Text style={styles.modalMessage}>Your report has been successfully submitted!</Text>
              </>
            )}
          </View>
        }
        onConfirm={handleSuccessConfirm}
        onCancel={handleCancel}
        confirmText={errorMessage ? 'Retry' : 'Proceed'}
        showCancel={false}
      />
    </SafeAreaView>
  );
};

export default ReportSummary;