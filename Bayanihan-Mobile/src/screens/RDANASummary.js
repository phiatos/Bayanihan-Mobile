import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation, useRoute, CommonActions } from '@react-navigation/native';
import { signInAnonymously } from 'firebase/auth';
import { ref as databaseRef, push, get, serverTimestamp, query, orderByChild, equalTo } from 'firebase/database';
import React, { useEffect, useState, useRef } from 'react';
import { Alert, KeyboardAvoidingView, Platform, SafeAreaView, ScrollView, StatusBar, Text, TouchableOpacity, View } from 'react-native';
import { auth, database } from '../configuration/firebaseConfig';
import CustomModal from '../components/CustomModal';
import GlobalStyles from '../styles/GlobalStyles';
import styles from '../styles/RDANAStyles';
import Theme from '../constants/theme';
import { LinearGradient } from 'expo-linear-gradient';

const RDANASummary = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const [reportData, setReportData] = useState(route.params?.reportData || {});
  const [affectedMunicipalities, setAffectedMunicipalities] = useState(route.params?.affectedMunicipalities || []);
  const [modalVisible, setModalVisible] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [userUid, setUserUid] = useState(null);
  const [organizationName, setOrganizationName] = useState('[Unknown Organization]');
  const [errorMessage, setErrorMessage] = useState(null);
  const [canSubmit, setCanSubmit] = useState(false);

  // Validate incoming data
  if (!reportData || typeof reportData !== 'object') {
    console.warn('Invalid reportData received:', reportData);
    Alert.alert('Error', 'Invalid report data. Please return and fill the form again.');
    return null;
  }

  if (!Array.isArray(affectedMunicipalities)) {
    console.warn('Invalid affectedMunicipalities received:', affectedMunicipalities);
    Alert.alert('Error', 'Invalid municipalities data.');
    return null;
  }

  // Helper function to sanitize keys for Firebase (preserve single underscores)
  const sanitizeKey = (key) => {
    return key
      .replace(/[.#$/[\]]/g, '_') // Replace invalid Firebase characters
      .replace(/\s+/g, '_') // Replace spaces with underscore
      .replace(/[^a-zA-Z0-9_]/g, '') // Remove other special characters
      .replace(/_+/g, '_'); // Collapse multiple underscores to single
  };

  // Format label for display
  const formatLabel = (key) => {
    return key
      .replace(/_/g, ' ') // Replace underscores with spaces
      .replace(/([A-Z])/g, ' $1') // Add space before capital letters
      .trim()
      .split(' ')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  };

  // Organization name and role-based submission check
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const storedOrg = await AsyncStorage.getItem('organizationName');
        if (storedOrg) {
          setOrganizationName(storedOrg);
          console.log('Organization name loaded from storage:', storedOrg);
        }

        const unsubscribe = auth.onAuthStateChanged(async (user) => {
          if (user) {
            setUserUid(user.uid);
            console.log('Logged-in user UID:', user.uid);
            const userRef = databaseRef(database, `users/${user.uid}`);
            const userSnapshot = await get(userRef);
            const userData = userSnapshot.val();

            if (!userData) {
              console.error('User data not found for UID:', user.uid);
              setErrorMessage('Your user profile is incomplete. Please contact support.');
              setModalVisible(true);
              navigation.navigate('Login');
              return;
            }

            // Password reset check
            if (userData.password_needs_reset) {
              setErrorMessage('For security reasons, please change your password.');
              setModalVisible(true);
              navigation.navigate('Profile');
              return;
            }

            const userRole = userData.role;
            const orgName = userData.organization || '[Unknown Organization]';
            setOrganizationName(orgName);
            await AsyncStorage.setItem('organizationName', orgName);
            console.log('User Role:', userRole, 'Organization:', orgName);

            // Role-based submission eligibility
            if (userRole === 'AB ADMIN') {
              console.log('AB ADMIN role detected. Submission allowed.');
              setCanSubmit(true);
            } else if (userRole === 'ABVN') {
              console.log('ABVN role detected. Checking organization activations.');
              if (orgName === '[Unknown Organization]') {
                console.warn('ABVN user has no organization assigned.');
                setErrorMessage('Your account is not associated with an organization.');
                setModalVisible(true);
                navigation.navigate('Volunteer Dashboard');
                return;
              }

              const activationsRef = query(
                databaseRef(database, 'activations'),
                orderByChild('organization'),
                equalTo(orgName)
              );
              const activationsSnapshot = await get(activationsRef);
              let hasActiveActivations = false;
              activationsSnapshot.forEach((childSnapshot) => {
                if (childSnapshot.val().status === 'active') {
                  hasActiveActivations = true;
                  return true; // Exit loop
                }
              });

              if (hasActiveActivations) {
                console.log(`Organization "${orgName}" has active operations. Submission allowed.`);
                setCanSubmit(true);
              } else {
                console.warn(`Organization "${orgName}" has no active operations. Submission disabled.`);
                setErrorMessage('Your organization has no active operations. You cannot submit reports at this time.');
                setModalVisible(true);
                navigation.navigate('Volunteer Dashboard');
                setCanSubmit(false);
              }
            } else {
              console.warn(`Unsupported role: ${userRole}. Submission disabled.`);
              setErrorMessage('Your role does not permit report submission.');
              setModalVisible(true);
              navigation.navigate('Volunteer Dashboard');
              setCanSubmit(false);
            }
          } else {
            console.warn('No user is logged in');
            setErrorMessage('User not authenticated. Please log in.');
            setModalVisible(true);
            navigation.navigate('Login');
          }
        }, (error) => {
          console.error('Auth state listener error:', error.message);
          setErrorMessage('Authentication error: ' + error.message);
          setModalVisible(true);
        });

        return () => unsubscribe();
      } catch (error) {
        console.error('Error in fetchUserData:', error.message);
        setErrorMessage('Failed to initialize user data: ' + error.message);
        setModalVisible(true);
      }
    };

    fetchUserData();
  }, []);

  // Debug organization name rendering
  useEffect(() => {
    console.log('Rendering with organizationName:', organizationName);
  }, [organizationName]);

  // Anonymous sign-in
  useEffect(() => {
    if (!auth.currentUser) {
      signInAnonymously(auth)
        .then((userCredential) => {
          console.log('User signed in anonymously:', userCredential.user.uid);
        })
        .catch((error) => {
          console.error('Anonymous login failed:', error.message);
          setErrorMessage(error.message);
          setModalVisible(true);
        });
    } else {
      console.log('Already authenticated:', auth.currentUser?.uid);
    }
  }, []);

  // Debug lifeline data in reportData
  useEffect(() => {
    console.log('Received reportData:', reportData);
    console.log('Lifeline data:', {
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

  const handleSubmit = async () => {
    setIsSubmitting(true);
    const user = auth.currentUser;
    if (!user) {
      console.error('No authenticated user found');
      setErrorMessage('User not authenticated. Please log in.');
      setModalVisible(true);
      setIsSubmitting(false);
      return;
    }
    console.log('Authenticated user UID:', user.uid);

    if (!canSubmit) {
      console.error('Submission not allowed due to role or inactive organization');
      setErrorMessage('Your organization is inactive or you lack permission to submit reports.');
      setModalVisible(true);
      setIsSubmitting(false);
      return;
    }

    if (Object.keys(reportData).length === 0 || affectedMunicipalities.length === 0) {
      console.log('Validation failed: Incomplete form data', { reportData, affectedMunicipalities });
      setErrorMessage('Form data is incomplete. Please ensure all fields are filled correctly.');
      setModalVisible(true);
      setIsSubmitting(false);
      return;
    }
    console.log('Form data validated successfully');

    // Priority needs
    const priorityNeeds = [];
    if (reportData.reliefPacks === 'Yes') priorityNeeds.push('Relief Packs');
    if (reportData.hotMeals === 'Yes') priorityNeeds.push('Hot Meals');
    if (reportData.hygieneKits === 'Yes') priorityNeeds.push('Hygiene Kits');
    if (reportData.drinkingWater === 'Yes') priorityNeeds.push('Drinking Water');
    if (reportData.ricePacks === 'Yes') priorityNeeds.push('Rice Packs');
    if (reportData.otherNeeds) priorityNeeds.push(reportData.otherNeeds);

    // Needs checklist (include all items, checked or unchecked)
    const needsChecklist = [
      { item: 'Relief Packs', needed: reportData.reliefPacks === 'Yes' },
      { item: 'Hot Meals', needed: reportData.hotMeals === 'Yes' },
      { item: 'Hygiene Kits', needed: reportData.hygieneKits === 'Yes' },
      { item: 'Drinking Water', needed: reportData.drinkingWater === 'Yes' },
      { item: 'Rice Packs', needed: reportData.ricePacks === 'Yes' },
      ...(reportData.otherNeeds ? [{ item: reportData.otherNeeds, needed: true }] : []),
    ];

    // Structure status (include all entries, use 'N/A' for empty)
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

    // Profile data (only specific fields)
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
    };

    // Align with expected Firebase data structure
    const reportDataForFirebase = {
      rdanaId: `RDANA-${Math.floor(100 + Math.random() * 900)}`,
      dateTime: new Date().toISOString(),
      rdanaGroup: organizationName,
      siteLocation: reportData.Site_Location_Address_Barangay || '',
      disasterType: reportData.Type_of_Disaster || '',
      effects: {
        affectedPopulation: affectedMunicipalities.reduce((sum, c) => sum + (parseInt(c.affected) || 0), 0).toString(),
        estQty: reportData.estQty || '',
        familiesServed: reportData.familiesServed || ''
      },
      needs: {
        priority: priorityNeeds
      },
      needsChecklist,
      profile,
      modality: {
        Locations_and_Areas_Affected: reportData.Locations_and_Areas_Affected_Barangay || '',
        Type_of_Disaster: reportData.Type_of_Disaster || '',
        Date_and_Time_of_Occurrence: `${reportData.Date_of_Occurrence || ''} ${reportData.Time_of_Occurrence || ''}`.trim()
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
        pwd: community.pwd || ''
      })),
      structureStatus,
      otherNeeds: reportData.otherNeeds || '',
      responseGroup: reportData.responseGroup || '',
      reliefDeployed: reportData.reliefDeployed || '',
      familiesServed: reportData.familiesServed || '',
      userUid: user.uid,
      status: 'Submitted',
      timestamp: serverTimestamp()
    };

    console.log('Prepared report data:', JSON.stringify(reportDataForFirebase, null, 2));

    try {
      const submittedRef = databaseRef(database, 'rdana/submitted');
      console.log('Writing to Firebase at path:', submittedRef.toString());

      const newReportRef = await push(submittedRef, reportDataForFirebase);
      console.log('Report successfully saved with key:', newReportRef.key);
      setErrorMessage(null);
      setModalVisible(true);
    } catch (error) {
      console.error('Error saving RDANA report to Firebase:', error);
      console.error('Error code:', error.code || 'N/A');
      console.error('Error message:', error.message);
      setErrorMessage(`Failed to submit RDANA report: ${error.message}`);
      setModalVisible(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirm = () => {
    console.log('Confirm button pressed, closing modal');
    setModalVisible(false);
    if (!errorMessage) {
      // Reset navigation stack to Volunteer Dashboard
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
    console.log('Cancel button pressed');
    setModalVisible(false);
    if (errorMessage) {
      navigation.navigate('Login');
    }
  };

  const handleBack = () => {
    navigation.navigate('RDANAScreen', { reportData, affectedMunicipalities });
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
          <Text style={[GlobalStyles.headerTitle, { color: Theme.colors.primary }]}>RDANA</Text>
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
            {/* Profile of the Disaster */}
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

            {/* Modality */}
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

            {/* Initial Effects */}
            <View style={GlobalStyles.section}>
              <Text style={GlobalStyles.sectionTitle}>Initial Effects</Text>
              <Text style={styles.sectionSubtitle}>Affected Municipalities</Text>
              {affectedMunicipalities.length > 0 ? (
                <ScrollView horizontal showsHorizontalScrollIndicator={true}>
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

            {/* Status of Lifelines */}
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

            {/* Initial Needs Assessment */}
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

            {/* Initial Response Actions */}
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
              <TouchableOpacity style={GlobalStyles.backButton} onPress={handleBack}>
                <Text style={GlobalStyles.backButtonText}>Back</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[GlobalStyles.submitButton, isSubmitting && { opacity: 0.6 }]}
                onPress={handleSubmit}
                disabled={isSubmitting || !canSubmit}
              >
                <Text style={GlobalStyles.submitButtonText}>{isSubmitting ? 'Submitting...' : 'Submit'}</Text>
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
                <Ionicons name="warning-outline" size={60} color="#FF0000" style={styles.modalIcon} />
                <Text style={styles.modalMessage}>{errorMessage}</Text>
              </>
            ) : (
              <>
                <Ionicons name="checkmark-circle" size={60} color="#00BCD4" style={styles.modalIcon} />
                <Text style={styles.modalMessage}>Report submitted successfully!</Text>
              </>
            )}
          </View>
        }
        onConfirm={handleConfirm}
        onCancel={handleCancel}
        confirmText={errorMessage ? 'Retry' : 'Proceed'}
        showCancel={errorMessage ? true : false}
      />
    </SafeAreaView>
  );
};

export default RDANASummary;