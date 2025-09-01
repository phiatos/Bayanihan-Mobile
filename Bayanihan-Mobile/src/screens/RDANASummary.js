import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, CommonActions } from '@react-navigation/native';
import { ref as databaseRef, push, serverTimestamp } from 'firebase/database';
import React, { useEffect, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, SafeAreaView, ScrollView, StatusBar, Text, TouchableOpacity, View } from 'react-native';
import { database } from '../configuration/firebaseConfig';
import OperationCustomModal from '../components/OperationCustomModal';
import GlobalStyles from '../styles/GlobalStyles';
import styles from '../styles/RDANAStyles';
import Theme from '../constants/theme';
import { LinearGradient } from 'expo-linear-gradient';
import {logActivity, logSubmission } from '../components/logSubmission';
import { useAuth } from '../context/AuthContext';
import CustomModal from '../components/CustomModal';

const RDANASummary = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { user } = useAuth();
  const { reportData: initialReportData = {}, affectedMunicipalities: initialMunicipalities = [], organizationName = 'Admin' } = route.params || {};
  const [reportData, setReportData] = useState(initialReportData);
  const [affectedMunicipalities, setAffectedMunicipalities] = useState(initialMunicipalities);
  const [modalVisible, setModalVisible] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);

  // Validate incoming data
  useEffect(() => {
    try {
      if (!reportData || typeof reportData !== 'object') {
        throw new Error('Invalid report data received');
      }
      if (!Array.isArray(affectedMunicipalities)) {
        throw new Error('Invalid municipalities data received');
      }
      console.log(`[${new Date().toISOString()}] Received params:`, { reportData, affectedMunicipalities, organizationName });
    } catch (error) {
      console.error(`[${new Date().toISOString()}] Validation error:`, error.message);
      Alert.alert('Error', error.message);
      setErrorMessage(error.message);
      setModalVisible(true);
    }
  }, [reportData, affectedMunicipalities, organizationName]);

  // Validate user authentication
  useEffect(() => {
    try {
      if (!user) {
        throw new Error('No authenticated user found');
      }
      console.log(`[${new Date().toISOString()}] Logged-in user ID:`, user.id);
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

  // Debug lifeline data
  useEffect(() => {
    console.log(`[${new Date().toISOString()}] Lifeline data:`, {
      residentialHousesStatus: reportData.residentialhousesStatus,
      transportationAndMobilityStatus: reportData.transportationandmobilityStatus,
      electricityPowerGridStatus: reportData.electricitypowergridStatus,
      communicationNetworksInternetStatus: reportData.communicationnetworksinternetStatus,
      hospitalsRuralHealthUnitsStatus: reportData.hospitalsruralhealthunitsStatus,
      waterSupplySystemStatus: reportData.watersupplysystemStatus,
      marketBusinessAndCommercialEstablishmentsStatus: reportData.marketbusinessandcommercialestablishmentsStatus,
      othersStatus: reportData.othersStatus,
    });
  }, [reportData]);

  // Sanitize keys for Firebase
  const sanitizeKey = (key) => {
    return key
      .replace(/[.#$/[\]]/g, '_')
      .replace(/\s+/g, '_')
      .replace(/[^a-zA-Z0-9_]/g, '')
      .replace(/_+/g, '_');
  };

  // Format label for display
  const formatLabel = (key) => {
    return key
      .replace(/_/g, ' ')
      .replace(/([A-Z])/g, ' $1')
      .trim()
      .split(' ')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  };

  // Notify admin
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
      console.log(`[${new Date().toISOString()}] Admin notified:`, message);
    } catch (error) {
      console.error(`[${new Date().toISOString()}] Failed to notify admin:`, error.message);
    }
  };

  // Handle submission
  const handleSubmit = async () => {
    try {
      if (isSubmitting) {
        console.warn(`[${new Date().toISOString()}] Submission already in progress`);
        return;
      }
      if (!user) {
        throw new Error('No authenticated user found');
      }
      if (Object.keys(reportData).length === 0 || affectedMunicipalities.length === 0) {
        throw new Error('Incomplete form data');
      }
      if (!database) {
        throw new Error('Database reference is not available');
      }

      setIsSubmitting(true);
      console.log(`[${new Date().toISOString()}] Submitting RDANA report:`, reportData, affectedMunicipalities);

      // Prepare data structures
      const priorityNeeds = [];
      if (reportData.reliefPacks === 'Yes') priorityNeeds.push('Relief Packs');
      if (reportData.hotMeals === 'Yes') priorityNeeds.push('Hot Meals');
      if (reportData.hygieneKits === 'Yes') priorityNeeds.push('Hygiene Kits');
      if (reportData.drinkingWater === 'Yes') priorityNeeds.push('Drinking Water');
      if (reportData.ricePacks === 'Yes') priorityNeeds.push('Rice Packs');
      if (reportData.otherNeeds) priorityNeeds.push(reportData.otherNeeds);

      const needsChecklist = [
        { item: 'Relief Packs', needed: reportData.reliefPacks === 'Yes' },
        { item: 'Hot Meals', needed: reportData.hotMeals === 'Yes' },
        { item: 'Hygiene Kits', needed: reportData.hygieneKits === 'Yes' },
        { item: 'Drinking Water', needed: reportData.drinkingWater === 'Yes' },
        { item: 'Rice Packs', needed: reportData.ricePacks === 'Yes' },
        ...(reportData.otherNeeds ? [{ item: reportData.otherNeeds, needed: true }] : []),
      ];

      const structureStatus = [
        { structure: 'Residential Houses', status: reportData.residentialhousesStatus || 'N/A' },
        { structure: 'Transportation and Mobility', status: reportData.transportationandmobilityStatus || 'N/A' },
        { structure: 'Electricity, Power Grid', status: reportData.electricitypowergridStatus || 'N/A' },
        { structure: 'Communication Networks', status: reportData.communicationnetworksinternetStatus || 'N/A' },
        { structure: 'Hospitals, Rural Health Units', status: reportData.hospitalsruralhealthunitsStatus || 'N/A' },
        { structure: 'Water Supply System', status: reportData.watersupplysystemStatus || 'N/A' },
        { structure: 'Market, Business, Commercial Establishments', status: reportData.marketbusinessandcommercialestablishmentsStatus || 'N/A' },
        { structure: 'Others', status: reportData.othersStatus || 'N/A' },
      ];

      const profile = {
        Site_Location_Address_Barangay: reportData.Site_Location_Address_Barangay || '',
        Site_Location_Address_City_Municipality: reportData.Site_Location_Address_City_Municipality || '',
        Site_Location_Address_Province: reportData.Site_Location_Address_Province || '',
        Time_of_Information_Gathered: reportData.Time_of_Information_Gathered || '',
        Time_of_Occurrence: reportData.Time_of_Occurrence || '',
        Type_of_Disaster: reportData.Type_of_Disaster || '',
        Date_of_Information_Gathered: reportData.Date_of_Information_Gathered || '',
        Date_of_Occurrence: reportData.Date_of_Occurrence || '',
        Local_Authorities_Persons_Contacted_for_Information: reportData.Local_Authorities_Persons_Contacted_for_Information || '',
        Name_of_the_Organizations_Involved: reportData.Name_of_the_Organizations_Involved || '',
        Locations_and_Areas_Affected_Barangay: reportData.Locations_and_Areas_Affected_Barangay || '',
        Locations_and_Areas_Affected_City_Municipality: reportData.Locations_and_Areas_Affected_City_Municipality || '',
        Locations_and_Areas_Affected_Province: reportData.Locations_and_Areas_Affected_Province || '',
      };

      const reportDataForFirebase = {
        rdanaId: `RDANA-${Math.floor(100 + Math.random() * 900)}`,
        dateTime: new Date().toISOString(),
        rdanaGroup: organizationName,
        siteLocation: reportData.Site_Location_Address_Barangay || '',
        disasterType: reportData.Type_of_Disaster || '',
        effects: {
          affectedPopulation: affectedMunicipalities.reduce((sum, c) => sum + (parseInt(c.affected) || 0), 0).toString(),
          estQty: reportData.estQty || '',
          familiesServed: reportData.familiesServed || '',
        },
        needs: {
          priority: priorityNeeds,
        },
        needsChecklist,
        profile,
        modality: {
          Locations_and_Areas_Affected: reportData.Locations_and_Areas_Affected_Barangay || '',
          Type_of_Disaster: reportData.Type_of_Disaster || '',
          Date_and_Time_of_Occurrence: `${reportData.Date_of_Occurrence || ''} ${reportData.Time_of_Occurrence || ''}`.trim(),
        },
        summary: reportData.summary || '',
        affectedCommunities: affectedMunicipalities.map((community) => ({
          community: community.community || '',
          totalPop: community.totalPop || '',
          affected: community.affected || '',
          deaths: community.deaths || '',
          injured: community.injured || '',
          missing: community.missing || '',
          children: community.children || '',
          women: community.women || '',
          seniors: community.seniors || '',
          pwd: community.pwd || '',
        })),
        structureStatus,
        otherNeeds: reportData.otherNeeds || '',
        responseGroup: reportData.responseGroup || '',
        reliefDeployed: reportData.reliefDeployed || '',
        familiesServed: reportData.familiesServed || '',
        userUid: user.id,
        status: 'Submitted',
        timestamp: serverTimestamp(),
      };

      const submittedRef = databaseRef(database, 'rdana/submitted');
      const newReportRef = push(submittedRef);
      const submissionId = newReportRef.key;
      await push(submittedRef, reportDataForFirebase);

      const message = `New RDANA report "${reportData.Type_of_Disaster || 'N/A'}" submitted by ${reportData.Prepared_By || 'Unknown'} from ${organizationName} on ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })} at ${new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })} PST.`;
      await notifyAdmin(message, submissionId, reportData.Local_Authorities_Persons_Contacted_for_Information || 'Unknown', organizationName);

      await logActivity(user.id, 'Submitted an RDANA report', submissionId);
      await logSubmission('rdana', reportDataForFirebase, submissionId, organizationName);

      console.log(`[${new Date().toISOString()}] RDANA report submitted:`, submissionId);

      setReportData({});
      setAffectedMunicipalities([]);
      setErrorMessage(null);
      setModalVisible(true);
    } catch (error) {
      console.error(`[${new Date().toISOString()}] Error saving RDANA report:`, error.message, error.code || 'N/A');
      setErrorMessage(`Failed to submit RDANA report: ${error.message} (${error.code || 'N/A'})`);
      setModalVisible(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle modal confirmation
  const handleConfirm = () => {
    console.log(`[${new Date().toISOString()}] Confirm button pressed`);
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

  // Handle modal cancellation
  const handleCancel = () => {
    console.log(`[${new Date().toISOString()}] Cancel button pressed`);
    setModalVisible(false);
    if (errorMessage) {
      navigation.navigate('Login');
    }
  };

  // Handle back navigation
  const handleBack = () => {
    console.log(`[${new Date().toISOString()}] Navigating back with data:`, reportData, affectedMunicipalities);
    navigation.navigate('RDANAScreen', { reportData, affectedMunicipalities, organizationName });
  };

  // Render municipality item
  const renderMunicipalityItem = (item, index) => (
    <View key={index.toString()} style={[styles.summaryTableRow, { minWidth: 1150 }]}>
      <Text style={[styles.summaryTableCell, { minWidth: 50 }]}>{index + 1}</Text>
      <Text style={[styles.summaryTableCell, { minWidth: 240 }]}>{item.community || 'N/A'}</Text>
      <Text style={[styles.summaryTableCell, { minWidth: 120 }]}>{item.totalPop || 'N/A'}</Text>
      <Text style={[styles.summaryTableCell, { minWidth: 120 }]}>{item.affected || 'N/A'}</Text>
      <Text style={[styles.summaryTableCell, { minWidth: 80 }]}>{item.deaths || 'N/A'}</Text>
      <Text style={[styles.summaryTableCell, { minWidth: 80 }]}>{item.injured || 'N/A'}</Text>
      <Text style={[styles.summaryTableCell, { minWidth: 80 }]}>{item.missing || 'N/A'}</Text>
      <Text style={[styles.summaryTableCell, { minWidth: 80 }]}>{item.children || 'N/A'}</Text>
      <Text style={[styles.summaryTableCell, { minWidth: 80 }]}>{item.women || 'N/A'}</Text>
      <Text style={[styles.summaryTableCell, { minWidth: 130 }]}>{item.seniors || 'N/A'}</Text>
      <Text style={[styles.summaryTableCell, { minWidth: 80 }]}>{item.pwd || 'N/A'}</Text>
    </View>
  );

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
          <Text style={[GlobalStyles.headerTitle, { color: Theme.colors.primary }]}>RDANA</Text>
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
            <View style={GlobalStyles.section}>
              <Text style={GlobalStyles.sectionTitle}>Profile of the Disaster</Text>
              {[
                { key: 'Site_Location_Address_Barangay', label: 'barangay' },
                { key: 'Site_Location_Address_City_Municipality', label: 'cityMunicipality' },
                { key: 'Site_Location_Address_Province', label: 'province' },
                { key: 'Local_Authorities_Persons_Contacted_for_Information', label: 'localAuthoritiesPersonsContacted' },
                { key: 'Date_of_Information_Gathered', label: 'dateInformationGathered' },
                { key: 'Time_of_Information_Gathered', label: 'timeInformationGathered' },
                { key: 'Name_of_the_Organizations_Involved', label: 'nameOrganizationInvolved' },
              ].map(({ key, label }) => (
                <View key={label} style={styles.fieldContainer}>
                  <Text style={styles.label}>{formatLabel(label)}:</Text>
                  <Text style={styles.value}>{reportData[key] || 'N/A'}</Text>
                </View>
              ))}
            </View>

            <View style={GlobalStyles.section}>
              <Text style={GlobalStyles.sectionTitle}>Modality</Text>
              {[
                { key: 'Locations_and_Areas_Affected_Barangay', label: 'locationsAreasAffectedBarangay' },
                { key: 'Locations_and_Areas_Affected_City_Municipality', label: 'locationsAreasAffectedCityMunicipality' },
                { key: 'Locations_and_Areas_Affected_Province', label: 'locationsAreasAffectedProvince' },
                { key: 'Type_of_Disaster', label: 'typeOfDisaster' },
                { key: 'Date_of_Occurrence', label: 'dateOfOccurrence' },
                { key: 'Time_of_Occurrence', label: 'timeOfOccurrence' },
                { key: 'summary', label: 'summaryOfDisasterIncident' },
              ].map(({ key, label }) => (
                <View key={label} style={styles.fieldContainer}>
                  <Text style={styles.label}>{formatLabel(label)}:</Text>
                  <Text style={styles.value}>{reportData[key] || 'N/A'}</Text>
                </View>
              ))}
            </View>

            <View style={GlobalStyles.section}>
              <Text style={GlobalStyles.sectionTitle}>Initial Effects</Text>
              <Text style={styles.sectionSubtitle}>Affected Municipalities</Text>
              {affectedMunicipalities.length > 0 ? (
                <ScrollView horizontal showsHorizontalScrollIndicator>
                  <View style={styles.summaryTable}>
                    <View style={[styles.summaryTableHeader, { minWidth: 1150 }]}>
                      <Text style={[styles.summaryTableHeaderCell, { minWidth: 50 }]}>#</Text>
                      <Text style={[styles.summaryTableHeaderCell, { minWidth: 240 }]}>Affected Municipalities/Communities</Text>
                      <Text style={[styles.summaryTableHeaderCell, { minWidth: 120 }]}>Total Population</Text>
                      <Text style={[styles.summaryTableHeaderCell, { minWidth: 120 }]}>Affected Population</Text>
                      <Text style={[styles.summaryTableHeaderCell, { minWidth: 80 }]}>Deaths</Text>
                      <Text style={[styles.summaryTableHeaderCell, { minWidth: 80 }]}>Injured</Text>
                      <Text style={[styles.summaryTableHeaderCell, { minWidth: 80 }]}>Missing</Text>
                      <Text style={[styles.summaryTableHeaderCell, { minWidth: 80 }]}>Children</Text>
                      <Text style={[styles.summaryTableHeaderCell, { minWidth: 80 }]}>Women</Text>
                      <Text style={[styles.summaryTableHeaderCell, { minWidth: 130 }]}>Senior Citizens</Text>
                      <Text style={[styles.summaryTableHeaderCell, { minWidth: 80 }]}>PWD</Text>
                    </View>
                    {affectedMunicipalities.map((item, index) => renderMunicipalityItem(item, index))}
                  </View>
                </ScrollView>
              ) : (
                <Text style={styles.value}>No municipalities added.</Text>
              )}
            </View>

            <View style={GlobalStyles.section}>
              <Text style={GlobalStyles.sectionTitle}>Status of Lifelines, Social Structure, and Critical Facilities</Text>
              {[
                { key: 'residentialhousesStatus', label: 'Residential Houses' },
                { key: 'transportationandmobilityStatus', label: 'Transportation and Mobility' },
                { key: 'electricitypowergridStatus', label: 'Electricity, Power Grid' },
                { key: 'communicationnetworksinternetStatus', label: 'Communication Networks, Internet' },
                { key: 'hospitalsruralhealthunitsStatus', label: 'Hospitals, Rural Health Units' },
                { key: 'watersupplysystemStatus', label: 'Water Supply System' },
                { key: 'marketbusinessandcommercialestablishmentsStatus', label: 'Market, Business, Commercial Establishments' },
                { key: 'othersStatus', label: 'Others' },
              ].map(({ key, label }) => (
                <View key={key} style={styles.fieldContainer}>
                  <Text style={styles.label}>{label}:</Text>
                  <Text style={styles.value}>{reportData[key] || 'N/A'}</Text>
                </View>
              ))}
            </View>

            <View style={GlobalStyles.section}>
              <Text style={GlobalStyles.sectionTitle}>Initial Needs Assessment Checklist</Text>
              {[
                { key: 'reliefPacks', label: 'reliefPacks' },
                { key: 'hotMeals', label: 'hotMeals' },
                { key: 'hygieneKits', label: 'hygieneKits' },
                { key: 'drinkingWater', label: 'drinkingWater' },
                { key: 'ricePacks', label: 'ricePacks' },
                { key: 'otherNeeds', label: 'otherImmediateNeeds' },
                { key: 'estQty', label: 'estimatedQuantity' },
              ].map(({ key, label }) => (
                <View key={label} style={styles.fieldContainer}>
                  <Text style={styles.label}>{formatLabel(label)}:</Text>
                  <Text style={styles.value}>
                    {key === 'otherNeeds' || key === 'estQty' ? reportData[key] || 'N/A' : reportData[key] === 'Yes' ? 'Yes' : 'No'}
                  </Text>
                </View>
              ))}
            </View>

            <View style={GlobalStyles.section}>
              <Text style={GlobalStyles.sectionTitle}>Initial Response Actions</Text>
              {[
                { key: 'responseGroup', label: 'responseGroupsInvolved' },
                { key: 'reliefDeployed', label: 'reliefAssistanceDeployed' },
                { key: 'familiesServed', label: 'numberOfFamiliesServed' },
              ].map(({ key, label }) => (
                <View key={label} style={styles.fieldContainer}>
                  <Text style={styles.label}>{formatLabel(label)}:</Text>
                  <Text style={styles.value}>{reportData[key] || 'N/A'}</Text>
                </View>
              ))}
            </View>

            <View style={GlobalStyles.finalButtonContainer}>
              <TouchableOpacity style={GlobalStyles.backButton} onPress={handleBack} disabled={isSubmitting}>
                <Text style={GlobalStyles.backButtonText}>Back</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[GlobalStyles.submitButton, isSubmitting && { opacity: 0.6 }]}
                onPress={handleSubmit}
                disabled={isSubmitting}
              >
                <Text style={GlobalStyles.submitButtonText}>{isSubmitting ? 'Submitting...' : 'Submit'}</Text>
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
                <Text style={GlobalStyles.modalMessage}>Your RDANA report has been successfully submitted!</Text>
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

export default RDANASummary;