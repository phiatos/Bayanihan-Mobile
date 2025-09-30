import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, CommonActions } from '@react-navigation/native';
import { ref as databaseRef, push, get, serverTimestamp } from 'firebase/database';
import React, { useState, useEffect } from 'react';
import { KeyboardAvoidingView, Platform, SafeAreaView, ScrollView, StatusBar, Text, ToastAndroid, TouchableOpacity, View } from 'react-native';
import { database } from '../configuration/firebaseConfig';
import Theme from '../constants/theme';
import CustomModal from '../components/CustomModal';
import GlobalStyles from '../styles/GlobalStyles';
import styles from '../styles/ReportSubmissionStyles';
import { LinearGradient } from 'expo-linear-gradient';
import { logActivity, logSubmission } from '../components/logSubmission'; 
import { useAuth } from '../context/AuthContext';

const ReportSummary = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const { user } = useAuth();
  const { reportData: initialReportData = {}, organizationName: orgNameFromParams } = route.params || {};
  const [reportData, setReportData] = useState(initialReportData);
  const [organizationName, setOrganizationName] = useState(orgNameFromParams || 'Loading...');
  const [modalVisible, setModalVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const [isSubmitted, setIsSubmitted] = useState(false);

  useEffect(() => {
    try {
      if (!user) {
        throw new Error('No authenticated user found');
      }
    } catch (error) {
      console.error(`[${new Date().toISOString()}] Authentication error:`, error.message);
      setErrorMessage('User not authenticated. Please log in.');
      setModalVisible(true);
      setTimeout(() => {
        setModalVisible(false);
        navigation.navigate('Login');
      }, 3000);
    }
  }, [user, navigation]);

  useEffect(() => {
    const fetchOrganizationName = async () => {
      try {
        if (orgNameFromParams) {
          setOrganizationName(orgNameFromParams);
          return;
        }
        if (!user?.id) {
          throw new Error('No authenticated user ID available');
        }

        const userRef = databaseRef(database, `users/${user.id}`);
        const snapshot = await get(userRef);
        const userData = snapshot.val();

        if (userData?.organization) {
          setOrganizationName(userData.organization);
        } else {
          throw new Error('No organization found in user profile');
        }
      } catch (error) {
        console.error(`[${new Date().toISOString()}] Error fetching organization name:`, error.message);
        setOrganizationName(''); 
        ToastAndroid.show(`Failed to fetch organization name: ${error.message}`, ToastAndroid.BOTTOM);
      }
    };

    fetchOrganizationName();
  }, [user, orgNameFromParams]);

  useEffect(() => {
    if (isSubmitted) {
      return;
    }

    try {
      if (!reportData || Object.keys(reportData).length === 0) {
        throw new Error('Invalid or empty report data');
      }
    } catch (error) {
      console.error(`[${new Date().toISOString()}] Validation error:`, error.message);
      setErrorMessage(error.message);
      setModalVisible(true);
    }
  }, [reportData, isSubmitted]);

  const formatLabel = (key) => {
    let label = key.replace(/([A-Z])/g, ' $1').trim();
    if (['no of individuals or families', 'no of food packs', 'no of hot meals', 'no of volunteers mobilized', 'no of organizations activated'].includes(label.toLowerCase())) {
      label = label.replace(/no /i, 'No. ');
    }
    return label
      .split(' ')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const formatDateDisplay = (dateStr) => {
    if (!dateStr) return 'N/A';
    if (/^\d{2}-\d{2}-\d{4}$/.test(dateStr)) return dateStr;
    const date = new Date(dateStr);
    return !isNaN(date) ? date.toLocaleDateString('en-GB') : 'N/A';
  };

  const formatTimeDisplay = (timeStr) => {
    if (!timeStr) return 'N/A';
    if (/(^([0-9]{1,2}):([0-9]{2})\s(AM|PM)$)/i.test(timeStr)) return timeStr;
    const date = new Date(`2000-01-01T${timeStr}`);
    if (!isNaN(date.getTime())) {
      return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
    }
    return timeStr.includes(':') ? timeStr : 'N/A';
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
      if (isLoading) {
        console.warn(`[${new Date().toISOString()}] Submission already in progress`);
        return;
      }
      if (!user?.id) {
        throw new Error('No authenticated user found');
      }
      if (!database) {
        throw new Error('Database reference is not available');
      }
      if (!reportData || Object.keys(reportData).length === 0) {
        throw new Error('Incomplete report data');
      }
      if (!organizationName || organizationName === 'Loading...') {
        throw new Error('Organization name not loaded');
      }

      setIsLoading(true);
      const CalamityName = reportData.CalamityName || 'Unknown Calamity';
      const CalamityType = reportData.CalamityType || 'Unknown Type';
      const calamityArea = `${CalamityType} - ${CalamityName} (by ${organizationName})`;

      const newReport = {
        reportID: reportData.reportID || `REPORTS-${Math.floor(100000 + Math.random() * 900000)}`,
        AreaOfOperation: reportData.AreaOfOperation || '',
        DateOfReport: reportData.DateOfReport || '',
        CalamityName,
        CalamityType,
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
        userUid: user.id,
        VolunteerGroupName: organizationName,
        timestamp: serverTimestamp(),
        // coordinates: reportData.coordinates || null,
      };

      const reportRef = databaseRef(database, 'reports/verification');
      const newReportRef = push(reportRef);
      const submissionId = newReportRef.key;

      await push(reportRef, newReport);
      const message = `New report submitted by ${reportData.contactPerson || 'Admin'} from ${organizationName} for ${CalamityName} on ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })} at ${new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })} PST.`;
      await notifyAdmin(message, submissionId, reportData.contactPerson || 'Admin', organizationName);

      await logActivity('Submitted a report', submissionId, user.id, organizationName);
      await logSubmission('reports', newReport, submissionId, organizationName, user.id);

      setIsSubmitted(true);
      setReportData({});
      setErrorMessage(null);
      setModalVisible(true);
    } catch (error) {
      console.error(`[${new Date().toISOString()}] Error saving report:`, error.message, error.code || 'N/A');
      setErrorMessage(`Failed to save report: ${error.message} (${error.code || 'N/A'})`);
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
    navigation.navigate('ReportSubmission', { reportData });
  };

  const handleBack = () => {
    navigation.navigate('ReportSubmission', { reportData });
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
          <Text style={[GlobalStyles.headerTitle, { color: Theme.colors.primary }]}>Reports Submission</Text>
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
              <Text style={GlobalStyles.summarySectionTitle}>Basic Information</Text>
              {['reportID', 'AreaOfOperation', 'DateOfReport'].map((field) => (
                <View key={field} style={styles.fieldContainer}>
                  <Text style={styles.label}>{formatLabel(field)}:</Text>
                  <Text style={styles.value}>{field === 'DateOfReport' ? formatDateDisplay(reportData[field]) : reportData[field] || 'N/A'}</Text>
                </View>
              ))}
            </View>

            <View style={GlobalStyles.summarySection}>
              <Text style={GlobalStyles.summarySectionTitle}>Relief Operations</Text>
              {[
                'calamityArea',
                'completionTimeOfIntervention',
                'StartDate',
                'EndDate',
                'NoOfIndividualsOrFamilies',
                'NoOfFoodPacks',
                'hotMeals',
                'LitersOfWater',
                'NoOfVolunteersMobilized',
                'NoOfOrganizationsActivated',
                'TotalValueOfInKindDonations',
                'TotalMonetaryDonations',
              ].map((field) => (
                <View key={field} style={styles.fieldContainer}>
                  <Text style={styles.label}>{formatLabel(field)}:</Text>
                  <Text style={styles.value}>
                    {reportData[field]
                      ? field === 'completionTimeOfIntervention'
                        ? formatTimeDisplay(reportData[field])
                        : ['StartDate', 'EndDate'].includes(field)
                          ? formatDateDisplay(reportData[field])
                          : reportData[field]
                      : 'N/A'}
                  </Text>
                </View>
              ))}
            </View>

            <View style={GlobalStyles.summarySection}>
              <Text style={GlobalStyles.summarySectionTitle}>Additional Updates</Text>
              <View style={styles.fieldContainer}>
                <Text style={styles.label}>{formatLabel('NotesAdditionalInformation')}:</Text>
                <Text style={styles.value}>{reportData.NotesAdditionalInformation || 'None'}</Text>
              </View>
            </View>

            <View style={GlobalStyles.finalButtonContainer}>
              <TouchableOpacity style={GlobalStyles.backButton} onPress={handleBack} disabled={isLoading}>
                <Text style={GlobalStyles.backButtonText}>Back</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[GlobalStyles.submitButton, isLoading && { opacity: 0.6 }]}
                onPress={handleSubmit}
                disabled={isLoading}
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
                <Text style={GlobalStyles.modalMessage}>Your report has been successfully submitted!</Text>
              </>
            )}
          </View>
        }
        onConfirm={handleConfirm}
        onCancel={handleCancel}
        confirmText={errorMessage ? 'Retry' : 'Proceed'}
        showCancel={errorMessage}
      />
    </SafeAreaView>
  );
};

export default ReportSummary;