import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { signInAnonymously } from 'firebase/auth';
import { push, ref, serverTimestamp } from 'firebase/database';
import React, { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { auth, database } from '../configuration/firebaseConfig';
import CustomModal from '../components/CustomModal';

const RDANASummary = () => {
  const { reportData = {}, affectedMunicipalities = [] } = useRoute().params || {};
  const navigation = useNavigation();
  const [modalVisible, setModalVisible] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Automatically sign in anonymously if no user is authenticated
  useEffect(() => {
    if (!auth.currentUser) {
      signInAnonymously(auth)
        .then(userCredential => {
          console.log('User signed in anonymously:', userCredential.user.uid);
        })
        .catch(error => {
          console.error('Anonymous login failed:', error.message);
          Alert.alert('Authentication Failed', `Failed to sign in: ${error.message}`);
        });
    }
  }, []);

  const formatLabel = (key) => {
    return key
      .replace(/([A-Z])/g, ' $1')
      .trim()
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  };

  const sanitizeKey = (key) => {
    return key
      .replace(/[.#$/[\]]/g, '_')
      .replace(/\s+/g, '_')
      .replace(/[^a-zA-Z0-9_]/g, '');
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);

    // Step 1: Verify authenticated user
    const user = auth.currentUser;
    if (!user) {
      console.log('No authenticated user found');
      Alert.alert('Authentication Required', 'Please sign in to submit a report.');
      navigation.navigate('Login');
      setIsSubmitting(false);
      return;
    }
    console.log('Authenticated user UID:', user.uid);

    // Step 2: Validate form data
    if (!reportData || Object.keys(reportData).length === 0 || !affectedMunicipalities || affectedMunicipalities.length === 0) {
      console.log('Validation failed: Incomplete form data', { reportData, affectedMunicipalities });
      Alert.alert('Submission Failed', 'Form data is incomplete. Please ensure all fields are filled correctly.');
      setIsSubmitting(false);
      return;
    }
    console.log('Form data validated successfully');

    // Step 3: Prepare report data
    const sanitizedProfileData = {};
    Object.keys(reportData).forEach((key) => {
      sanitizedProfileData[sanitizeKey(formatLabel(key))] = reportData[key] || 'N/A';
    });

    const priorityNeeds = [];
    if (reportData.reliefPacks === 'Yes') priorityNeeds.push('Relief Packs');
    if (reportData.hotMeals === 'Yes') priorityNeeds.push('Hot Meals');
    if (reportData.hygieneKits === 'Yes') priorityNeeds.push('Hygiene Kits');
    if (reportData.drinkingWater === 'Yes') priorityNeeds.push('Drinking Water');
    if (reportData.ricePacks === 'Yes') priorityNeeds.push('Rice Packs');

    const needsChecklist = [
      { item: 'Relief Packs', needed: reportData.reliefPacks === 'Yes' },
      { item: 'Hot Meals', needed: reportData.hotMeals === 'Yes' },
      { item: 'Hygiene Kits', needed: reportData.hygieneKits === 'Yes' },
      { item: 'Drinking Water', needed: reportData.drinkingWater === 'Yes' },
      { item: 'Rice Packs', needed: reportData.ricePacks === 'Yes' },
    ];

    const reportDataForFirebase = {
      rdanaId: `RDANA-${Math.floor(100 + Math.random() * 900)}`,
      dateTime: new Date().toISOString(),
      siteLocation: reportData.barangay || 'N/A',
      disasterType: reportData.typeOfDisaster || 'N/A',
      effects: { affectedPopulation: affectedMunicipalities.reduce((sum, c) => sum + (parseInt(c.affectedPopulation) || 0), 0) },
      needs: {
        priority: priorityNeeds,
      },
      profile: sanitizedProfileData,
      modality: {
        Locations_and_Areas_Affected: reportData.locationsAreasAffectedBarangay || 'N/A',
        Type_of_Disaster: reportData.typeOfDisaster || 'N/A',
        Date_and_Time_of_Occurrence: `${reportData.dateOfOccurrence || ''} ${reportData.timeOfOccurrence || ''}`,
      },
      summary: reportData.summaryOfDisasterIncident || '',
      affectedCommunities: affectedMunicipalities.map((community) => ({
        community: community.affectedMunicipalitiesCommunities || '',
        totalPop: community.totalPopulation || '0',
        affected: community.affectedPopulation || '0',
        deaths: community.deaths || '0',
        injured: community.injured || '0',
        missing: community.missing || '0',
        children: community.children || '0',
        women: community.women || '0',
        seniors: community.seniorCitizens || '0',
        pwd: community.pwd || '0',
      })),
      structureStatus: [
        { structure: 'Bridges', status: reportData.bridgesStatus || 'N/A' },
        { structure: 'Roads', status: reportData.roadsStatus || 'N/A' },
        { structure: 'Buildings', status: reportData.buildingsStatus || 'N/A' },
        { structure: 'Hospitals', status: reportData.hospitalsStatus || 'N/A' },
        { structure: 'Schools', status: reportData.schoolsStatus || 'N/A' },
      ],
      needsChecklist: needsChecklist,
      otherNeeds: reportData.otherImmediateNeeds || 'N/A',
      estQty: reportData.estimatedQuantity || 'N/A',
      responseGroup: reportData.responseGroupsInvolved || 'N/A',
      reliefDeployed: reportData.reliefAssistanceDeployed || 'N/A',
      familiesServed: reportData.numberOfFamiliesServed || 'N/A',
      userUid: user.uid,
      status: 'Submitted',
      timestamp: serverTimestamp(),
    };

    console.log('Prepared report data:', JSON.stringify(reportDataForFirebase, null, 2));

    // Step 4: Attempt to write to Firebase
    try {
      const submittedRef = ref(database, 'rdana/submitted');
      console.log('Writing to Firebase at path:', submittedRef.toString());

      const pushPromise = push(submittedRef, reportDataForFirebase);
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Database write timed out after 10 seconds')), 10000);
      });

      const newReportRef = await Promise.race([pushPromise, timeoutPromise]);
      console.log('Report successfully saved with key:', newReportRef.key);
      setModalVisible(true);
    } catch (error) {
      console.error('Error saving RDANA report to Firebase:', error);
      console.error('Error code:', error.code || 'N/A');
      console.error('Error message:', error.message);
      Alert.alert('Submission Failed', `Failed to submit RDANA report: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirm = () => {
    console.log('Confirm button pressed, closing modal and navigating to Home');
    setModalVisible(false);
    navigation.navigate('Home');
    console.log('Navigation to Home initiated');
  };

  const handleCancel = () => {
    console.log('Cancel button pressed (should not appear due to showCancel=false)');
    setModalVisible(false);
  };

  const handleBack = () => {
    navigation.navigate('RDANAScreen', { reportData, affectedMunicipalities });
  };

  const renderMunicipalityItem = (item, index) => (
    <View key={index.toString()} style={[styles.tableRow, { minWidth: 1150 }]}>
      <Text style={[styles.tableCell, { minWidth: 50 }]}>{index + 1}</Text>
      <Text style={[styles.tableCell, { minWidth: 200 }]}>{item.affectedMunicipalitiesCommunities || 'N/A'}</Text>
      <Text style={[styles.tableCell, { minWidth: 120 }]}>{item.totalPopulation || 'N/A'}</Text>
      <Text style={[styles.tableCell, { minWidth: 120 }]}>{item.affectedPopulation || 'N/A'}</Text>
      <Text style={[styles.tableCell, { minWidth: 80 }]}>{item.deaths || 'N/A'}</Text>
      <Text style={[styles.tableCell, { minWidth: 80 }]}>{item.injured || 'N/A'}</Text>
      <Text style={[styles.tableCell, { minWidth: 80 }]}>{item.missing || 'N/A'}</Text>
      <Text style={[styles.tableCell, { minWidth: 80 }]}>{item.children || 'N/A'}</Text>
      <Text style={[styles.tableCell, { minWidth: 80 }]}>{item.women || 'N/A'}</Text>
      <Text style={[styles.tableCell, { minWidth: 120 }]}>{item.seniorCitizens || 'N/A'}</Text>
      <Text style={[styles.tableCell, { minWidth: 80 }]}>{item.pwd || 'N/A'}</Text>
    </View>
  );

  // Determine the organization name to display
  const organizationName = reportData.nameOrganizationInvolved || 'Unknown Organization';

  return (
    <View style={{ flex: 1 }}>
      <ScrollView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.menuIcon} onPress={() => navigation.openDrawer()}>
            <Ionicons name="menu" size={32} color="white" />
          </TouchableOpacity>
          <Text style={styles.headerText}>RDANA Summary</Text>
        </View>
        <Text style={styles.subheader}>{organizationName}</Text>
        <View style={styles.formContainer}>
          {/* Profile of the Disaster */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Profile of the Disaster</Text>
            {[
              'barangay',
              'cityMunicipality',
              'province',
              'localAuthoritiesPersonsContacted',
              'dateInformationGathered',
              'timeInformationGathered',
              'nameOrganizationInvolved',
            ].map((field) => (
              <View key={field} style={styles.fieldContainer}>
                <Text style={styles.label}>{formatLabel(field)}:</Text>
                <Text style={styles.value}>{reportData[field] || 'N/A'}</Text>
              </View>
            ))}
          </View>

          {/* Modality */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Modality</Text>
            {[
              'locationsAreasAffectedBarangay',
              'locationsAreasAffectedCityMunicipality',
              'locationsAreasAffectedProvince',
              'typeOfDisaster',
              'dateOfOccurrence',
              'timeOfOccurrence',
              'summaryOfDisasterIncident',
            ].map((field) => (
              <View key={field} style={styles.fieldContainer}>
                <Text style={styles.label}>{formatLabel(field)}:</Text>
                <Text style={styles.value}>{reportData[field] || 'N/A'}</Text>
              </View>
            ))}
          </View>

          {/* Initial Effects */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Initial Effects</Text>
            <Text style={styles.sectionSubtitle}>Affected Municipalities</Text>
            {affectedMunicipalities.length > 0 ? (
              <ScrollView horizontal showsHorizontalScrollIndicator={true}>
                <View style={styles.table}>
                  <View style={[styles.tableHeader, { minWidth: 1150 }]}>
                    <Text style={[styles.tableHeaderCell, { minWidth: 200 }]}>Affected Municipalities/Communities</Text>
                    <Text style={[styles.tableHeaderCell, { minWidth: 120 }]}>Total Population</Text>
                    <Text style={[styles.tableHeaderCell, { minWidth: 120 }]}>Affected Population</Text>
                    <Text style={[styles.tableHeaderCell, { minWidth: 80 }]}>Deaths</Text>
                    <Text style={[styles.tableHeaderCell, { minWidth: 80 }]}>Injured</Text>
                    <Text style={[styles.tableHeaderCell, { minWidth: 80 }]}>Missing</Text>
                    <Text style={[styles.tableHeaderCell, { minWidth: 80 }]}>Children</Text>
                    <Text style={[styles.tableHeaderCell, { minWidth: 80 }]}>Women</Text>
                    <Text style={[styles.tableHeaderCell, { minWidth: 120 }]}>Senior Citizens</Text>
                    <Text style={[styles.tableHeaderCell, { minWidth: 80 }]}>PWD</Text>
                  </View>
                  {affectedMunicipalities.map((item, index) => renderMunicipalityItem(item, index))}
                </View>
              </ScrollView>
            ) : (
              <Text style={styles.value}>No municipalities added.</Text>
            )}
          </View>

          {/* Status of Lifelines */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Status of Lifelines, Social Structure, and Critical Facilities</Text>
            {[
              'bridgesStatus',
              'roadsStatus',
              'buildingsStatus',
              'hospitalsStatus',
              'schoolsStatus',
            ].map((field) => (
              <View key={field} style={styles.fieldContainer}>
                <Text style={styles.label}>{formatLabel(field)}:</Text>
                <Text style={styles.value}>{reportData[field] || 'N/A'}</Text>
              </View>
            ))}
          </View>

          {/* Initial Needs Assessment */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Initial Needs Assessment Checklist</Text>
            {[
              'reliefPacks',
              'hotMeals',
              'hygieneKits',
              'drinkingWater',
              'ricePacks',
              'otherImmediateNeeds',
              'estimatedQuantity',
            ].map((field) => (
              <View key={field} style={styles.fieldContainer}>
                <Text style={styles.label}>{formatLabel(field)}:</Text>
                <Text style={styles.value}>{reportData[field] || 'No'}</Text>
              </View>
            ))}
          </View>

          {/* Initial Response Actions */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Initial Response Actions</Text>
            {[
              'responseGroupsInvolved',
              'reliefAssistanceDeployed',
              'numberOfFamiliesServed',
            ].map((field) => (
              <View key={field} style={styles.fieldContainer}>
                <Text style={styles.label}>{formatLabel(field)}:</Text>
                <Text style={styles.value}>{reportData[field] || 'N/A'}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.backButton} onPress={handleBack}>
            <Text style={styles.backButtonText}>Back</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.submitButton, isSubmitting && { opacity: 0.6 }]}
            onPress={handleSubmit}
            disabled={isSubmitting}
          >
            <Text style={styles.submitButtonText}>{isSubmitting ? 'Submitting...' : 'Submit'}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
      <CustomModal
        visible={modalVisible}
        title="Success!"
        message={
          <View style={styles.modalContent}>
            <Ionicons name="checkmark-circle" size={60} color="#00BCD4" style={styles.modalIcon} />
            <Text style={styles.modalMessage}>Report submitted successfully!</Text>
          </View>
        }
        onConfirm={handleConfirm}
        onCancel={handleCancel}
        confirmText="Proceed"
        showCancel={false}
      />
    </View>
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
    backgroundColor: '#00BCD4',
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
    marginBottom: 20,
  },
  section: {
    marginVertical: 10,
    marginHorizontal: 15,
    borderWidth: 3,
    backgroundColor: '#FFF9F0',
    borderColor: '#00BCD4',
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
    color: '#00BCD4',
    fontFamily: 'Poppins_Bold',
  },
  sectionSubtitle: {
    fontSize: 16,
    marginBottom: 10,
    color: '#00BCD4',
    fontFamily: 'Poppins_SemiBold',
  },
  fieldContainer: {
    marginBottom: 10,
  },
  label: {
    fontSize: 14,
    color: '#00BCD4',
    fontFamily: 'Poppins_SemiBold',
  },
  value: {
    fontSize: 14,
    color: '#000000',
    marginTop: 2,
    fontFamily: 'Poppins_Regular',
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
    backgroundColor: '#00BCD4',
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
  table: {
    borderWidth: 1,
    borderColor: '#4059A5',
    borderRadius: 5,
    overflow: 'hidden',
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: 'rgba(64, 89, 165, 0.23)',
    borderBottomWidth: 1,
    borderColor: '#4059A5',
    paddingVertical: 8,
    paddingHorizontal: 5,
  },
  tableHeaderCell: {
    textAlign: 'center',
    color: '#000000',
    fontFamily: 'Poppins_SemiBold',
    fontSize: 12,
    paddingHorizontal: 5,
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 10,
    paddingHorizontal: 5,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  tableCell: {
    textAlign: 'center',
    fontSize: 12,
    color: '#000000',
    fontFamily: 'Poppins_Regular',
    paddingHorizontal: 5,
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

export default RDANASummary;