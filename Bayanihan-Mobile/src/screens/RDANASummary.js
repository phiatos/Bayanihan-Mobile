import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, CommonActions } from '@react-navigation/native';
import { ref as databaseRef, push, serverTimestamp } from 'firebase/database';
import React, { useEffect, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, SafeAreaView, ScrollView, StatusBar, Text, TouchableOpacity, View } from 'react-native';
import { database } from '../configuration/firebaseConfig';
import GlobalStyles from '../styles/GlobalStyles';
import styles from '../styles/RDANAStyles';
import Theme from '../constants/theme';
import { LinearGradient } from 'expo-linear-gradient';
import { logActivity, logSubmission } from '../components/logSubmission';
import { useAuth } from '../context/AuthContext';
import CustomModal from '../components/CustomModal';

const RDANASummary = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { user } = useAuth();
  const { 
    reportData: initialReportData = {}, 
    affectedMunicipalities: initialMunicipalities = [], 
    authoritiesAndOrganizations: initialAuthorities = [], 
    immediateNeeds: initialNeeds = [], 
    initialResponse: initialResponses = [], 
    organizationName = user?.organization || 'Admin' 
  } = route.params || {};
  const [reportData, setReportData] = useState(initialReportData);
  const [affectedMunicipalities, setAffectedMunicipalities] = useState(initialMunicipalities);
  const [authoritiesAndOrganizations, setAuthoritiesAndOrganizations] = useState(initialAuthorities);
  const [immediateNeeds, setImmediateNeeds] = useState(initialNeeds);
  const [initialResponse, setInitialResponse] = useState(initialResponses);
  const [modalVisible, setModalVisible] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);

  useEffect(() => {
    try {
      if (!reportData || typeof reportData !== 'object') {
        throw new Error('Invalid report data received');
      }
      if (!Array.isArray(affectedMunicipalities)) {
        throw new Error('Invalid municipalities data received');
      }
      if (!Array.isArray(authoritiesAndOrganizations)) {
        throw new Error('Invalid authorities data received');
      }
      if (!Array.isArray(immediateNeeds)) {
        throw new Error('Invalid immediate needs data received');
      }
      if (!Array.isArray(initialResponse)) {
        throw new Error('Invalid initial response data received');
      }
      console.log(`[${new Date().toISOString()}] Received params:`, { reportData, affectedMunicipalities, authoritiesAndOrganizations, immediateNeeds, initialResponse, organizationName });
    } catch (error) {
      console.error(`[${new Date().toISOString()}] Validation error:`, error.message);
      Alert.alert('Error', error.message);
      setErrorMessage(error.message);
      setModalVisible(true);
    }
  }, [reportData, affectedMunicipalities, authoritiesAndOrganizations, immediateNeeds, initialResponse, organizationName]);

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

  const sanitizeKey = (key) => {
    return key
      .replace(/[.#$/[\]]/g, '_')
      .replace(/\s+/g, '_')
      .replace(/[^a-zA-Z0-9_]/g, '')
      .replace(/_+/g, '_');
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
      console.log(`[${new Date().toISOString()}] Admin notified:`, message);
    } catch (error) {
      console.error(`[${new Date().toISOString()}] Failed to notify admin:`, error.message);
    }
  };

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
      console.log(`[${new Date().toISOString()}] Submitting RDANA report:`, reportData, affectedMunicipalities, authoritiesAndOrganizations, immediateNeeds, initialResponse);

      const priorityNeeds = [];
      if (reportData.reliefPacks === 'Yes') priorityNeeds.push('Relief Packs');
      if (reportData.hotMeals === 'Yes') priorityNeeds.push('Hot Meals');
      if (reportData.hygieneKits === 'Yes') priorityNeeds.push('Hygiene Kits');
      if (reportData.drinkingWater === 'Yes') priorityNeeds.push('Drinking Water');
      if (reportData.ricePacks === 'Yes') priorityNeeds.push('Rice Packs');
      if (immediateNeeds.length > 0) priorityNeeds.push(...immediateNeeds.map(n => n.need));

      const needsChecklist = [
        { item: 'Relief Packs', needed: reportData.reliefPacks === 'Yes' },
        { item: 'Hot Meals', needed: reportData.hotMeals === 'Yes' },
        { item: 'Hygiene Kits', needed: reportData.hygieneKits === 'Yes' },
        { item: 'Drinking Water', needed: reportData.drinkingWater === 'Yes' },
        { item: 'Rice Packs', needed: reportData.ricePacks === 'Yes' },
        ...immediateNeeds.map(n => ({ item: n.need, needed: true })),
      ];

      const structureStatus = [
        { structure: 'Residential Houses', status: reportData.residentialhousesStatus || 'N/A' },
        { structure: 'Transportation and Mobility', status: reportData.transportationandmobilityStatus || 'N/A' },
        { structure: 'Electricity, Power Grid', status: reportData.electricitypowergridStatus || 'N/A' },
        { structure: 'Communication Networks, Internet', status: reportData.communicationnetworksinternetStatus || 'N/A' },
        { structure: 'Hospitals, Rural Health Units', status: reportData.hospitalsruralhealthunitsStatus || 'N/A' },
        { structure: 'Water Supply System', status: reportData.watersupplysystemStatus || 'N/A' },
        { structure: 'Market, Business, Commercial Establishments', status: reportData.marketbusinessandcommercialestablishmentsStatus || 'N/A' },
        { structure: 'Others', status: reportData.othersStatus || 'N/A' },
      ];

      const profile = {
        Site_Location_Address_Barangay: reportData.Site_Location_Address_Barangay || '',
        Site_Location_Address_City_Municipality: reportData.Site_Location_Address_City_Municipality || '',
        Site_Location_Address_Province: reportData.Site_Location_Address_Province || '',
        Date_and_Time_of_Information_Gathered: reportData.Date_and_Time_of_Information_Gathered || '',
        Date_and_Time_of_Occurrence: reportData.Date_and_Time_of_Occurrence || '',
        Type_of_Disaster: reportData.Type_of_Disaster || '',
        Local_Authorities_Persons_Contacted_for_Information: authoritiesAndOrganizations.map(a => a.authority).join(', ') || '',
        Name_of_the_Organizations_Involved: authoritiesAndOrganizations.map(a => a.organization).join(', ') || '',
        Locations_and_Areas_Affected: reportData.Locations_and_Areas_Affected || '',
      };

      const reportDataForFirebase = {
        rdanaId: `RDANA-${Math.floor(100 + Math.random() * 900)}`,
        dateTime: new Date().toISOString(),
        rdanaGroup: organizationName,
        siteLocation: reportData.Site_Location_Address_Barangay || '',
        disasterType: reportData.Type_of_Disaster || '',
        effects: {
          affectedPopulation: affectedMunicipalities.reduce((sum, c) => sum + (parseInt(c.affected) || 0), 0).toString(),
          estQty: immediateNeeds.map(n => n.qty).join(', ') || '',
        },
        needs: {
          priority: priorityNeeds,
        },
        needsChecklist,
        profile,
        modality: {
          Locations_and_Areas_Affected: reportData.Locations_and_Areas_Affected || '',
          Type_of_Disaster: reportData.Type_of_Disaster || '',
          Date_and_Time_of_Occurrence: reportData.Date_and_Time_of_Occurrence || '',
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
        otherNeeds: immediateNeeds.map(n => n.need).join(', ') || '',
        responseGroup: initialResponse.map(r => r.group).join(', ') || '',
        reliefDeployed: initialResponse.map(r => r.assistance).join(', ') || '',
        familiesServed: initialResponse.map(r => r.families).join(', ') || '',
        userUid: user.id,
        status: 'Submitted',
        timestamp: serverTimestamp(),
      };

      const submittedRef = databaseRef(database, 'rdana/submitted');
      const newReportRef = push(submittedRef);
      const submissionId = newReportRef.key;
      await push(submittedRef, reportDataForFirebase);

      const message = `New RDANA report "${reportData.Type_of_Disaster || 'N/A'}" submitted by ${reportData.Prepared_By || 'Unknown'} from ${organizationName} on ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })} at ${new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })} PST.`;
      await notifyAdmin(message, submissionId, authoritiesAndOrganizations.map(a => a.authority).join(', ') || 'Unknown', organizationName);

      await logActivity('Submitted an RDANA report', submissionId, user.id, organizationName);
      await logSubmission('rdana', reportDataForFirebase, submissionId, organizationName, user.id);

      console.log(`[${new Date().toISOString()}] RDANA report submitted:`, submissionId);

      setReportData({});
      setAffectedMunicipalities([]);
      setAuthoritiesAndOrganizations([]);
      setImmediateNeeds([]);
      setInitialResponse([]);
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

  const handleCancel = () => {
    console.log(`[${new Date().toISOString()}] Cancel button pressed`);
    setModalVisible(false);
    if (errorMessage) {
      navigation.navigate('Login');
    }
  };

  const handleBack = () => {
    console.log(`[${new Date().toISOString()}] Navigating back with data:`, reportData, affectedMunicipalities, authoritiesAndOrganizations, immediateNeeds, initialResponse);
    navigation.navigate('RDANAWizardScreen', { 
      reportData, 
      affectedMunicipalities, 
      authoritiesAndOrganizations, 
      immediateNeeds, 
      initialResponse, 
      organizationName 
    });
  };

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

  const renderAuthorityItem = (item, index) => (
    <View key={index.toString()} style={[styles.summaryTableRow, { minWidth: 400 }]}>
      <Text style={[styles.summaryTableCell, { flex: 1 }]}>{item.authority || 'N/A'}</Text>
      <Text style={[styles.summaryTableCell, { flex: 1 }]}>{item.organization || 'N/A'}</Text>
    </View>
  );

  const renderNeedItem = (item, index) => (
    <View key={index.toString()} style={[styles.summaryTableRow, { minWidth: 400 }]}>
      <Text style={[styles.summaryTableCell, { flex: 1 }]}>{item.need || 'N/A'}</Text>
      <Text style={[styles.summaryTableCell, { flex: 1 }]}>{item.qty || 'N/A'}</Text>
    </View>
  );

  const renderResponseItem = (item, index) => (
    <View key={index.toString()} style={[styles.summaryTableRow, { minWidth: 600 }]}>
      <Text style={[styles.summaryTableCell, { flex: 1 }]}>{item.group || 'N/A'}</Text>
      <Text style={[styles.summaryTableCell, { flex: 1 }]}>{item.assistance || 'N/A'}</Text>
      <Text style={[styles.summaryTableCell, { flex: 1 }]}>{item.families || 'N/A'}</Text>
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
              <Text style={GlobalStyles.sectionTitle}>I. Profile of the Disaster</Text>
              {[
                { key: 'Site_Location_Address_Province', label: 'Site Location/ Address (Province)' },
                { key: 'Site_Location_Address_City_Municipality', label: 'Site Location Address (City/Municipality)' },
                { key: 'Site_Location_Address_Barangay', label: 'Site Location Address Barangay' },
                { key: 'Date_and_Time_of_Information_Gathered', label: 'Date and Time of Information Gathered' },
              ].map(({ key, label }) => (
                <View key={label} style={styles.fieldContainer}>
                  <Text style={styles.label}>{label}:</Text>
                  <Text style={styles.value}>{reportData[key] || 'N/A'}</Text>
                </View>
              ))}
              <Text style={GlobalStyles.sectionTitle}>Authorities & Organizations</Text>
              {authoritiesAndOrganizations.length > 0 ? (
                <ScrollView horizontal showsHorizontalScrollIndicator>
                  <View style={styles.summaryTable}>
                    <View style={[styles.summaryTableHeader, { minWidth: 400 }]}>
                      <Text style={[styles.summaryTableHeaderCell, { flex: 1, borderRightWidth: 1, borderRightColor: Theme.colors.primary }]}>Authorities</Text>
                      <Text style={[styles.summaryTableHeaderCell, { flex: 1 }]}>Organizations</Text>
                    </View>
                    {authoritiesAndOrganizations.map((item, index) => renderAuthorityItem(item, index))}
                  </View>
                </ScrollView>
              ) : (
                <Text style={styles.value}>No authorities or organizations added.</Text>
              )}
            </View>

            <View style={GlobalStyles.section}>
              <Text style={GlobalStyles.sectionTitle}>II. Modality</Text>
              <View style={styles.fieldContainer}>
                <Text style={styles.label}>Locations and Areas Affected:</Text>
                <Text style={styles.value}>{reportData.Locations_and_Areas_Affected || 'N/A'}</Text>
              </View>
              <Text style={styles.sectionSubtitle}>Disaster Details</Text>
              {[
                { key: 'Type_of_Disaster', label: 'Type of Disaster' },
                { key: 'Date_and_Time_of_Occurrence', label: 'Date and Time of Occurrence' },
                { key: 'summary', label: 'Summary' },
              ].map(({ key, label }) => (
                <View key={label} style={styles.fieldContainer}>
                  <Text style={styles.label}>{label}:</Text>
                  <Text style={styles.value}>{reportData[key] || 'N/A'}</Text>
                </View>
              ))}
            </View>

            <View style={GlobalStyles.section}>
              <Text style={GlobalStyles.sectionTitle}>III. Initial Effects</Text>
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
              <Text style={GlobalStyles.sectionTitle}>IV. Status of Lifelines, Social Structure, and Critical Facilities</Text>
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
              <Text style={GlobalStyles.sectionTitle}>V. Initial Needs Assessment Checklist</Text>
              {[
                { key: 'reliefPacks', label: 'Relief Packs' },
                { key: 'hotMeals', label: 'Hot Meals' },
                { key: 'hygieneKits', label: 'Hygiene Kits' },
                { key: 'drinkingWater', label: 'Drinking Water' },
                { key: 'ricePacks', label: 'Rice Packs' },
              ].map(({ key, label }) => (
                <View key={label} style={styles.fieldContainer}>
                  <Text style={styles.label}>{label}:</Text>
                  <Text style={styles.value}>{reportData[key] === 'Yes' ? 'Yes' : 'No'}</Text>
                </View>
              ))}
              {immediateNeeds.length > 0 && (
                <ScrollView horizontal showsHorizontalScrollIndicator>
                  <View style={styles.summaryTable}>
                    <View style={[styles.summaryTableHeader, { minWidth: 400 }]}>
                      <Text style={[styles.summaryTableHeaderCell, { flex: 1 }]}>Other Immediate Needs</Text>
                      <Text style={[styles.summaryTableHeaderCell, { flex: 1 }]}>Estimated Quantity</Text>
                    </View>
                    {immediateNeeds.map((item, index) => renderNeedItem(item, index))}
                  </View>
                </ScrollView>
              )}
            </View>

            <View style={GlobalStyles.section}>
              <Text style={GlobalStyles.sectionTitle}>VI. Initial Response Actions</Text>
              {initialResponse.length > 0 ? (
                <ScrollView horizontal showsHorizontalScrollIndicator>
                  <View style={styles.summaryTable}>
                    <View style={[styles.summaryTableHeader, { minWidth: 600 }]}>
                      <Text style={[styles.summaryTableHeaderCell, { flex: 1 }]}>Response Groups Involved</Text>
                      <Text style={[styles.summaryTableHeaderCell, { flex: 1 }]}>Relief Assistance Deployed</Text>
                      <Text style={[styles.summaryTableHeaderCell, { flex: 1 }]}>Number of Families Served</Text>
                    </View>
                    {initialResponse.map((item, index) => renderResponseItem(item, index))}
                  </View>
                </ScrollView>
              ) : (
                <Text style={styles.value}>No response actions added.</Text>
              )}
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