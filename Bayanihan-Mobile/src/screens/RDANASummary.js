import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, CommonActions } from '@react-navigation/native';
import { ref as databaseRef, push, serverTimestamp } from 'firebase/database';
import React, { useEffect, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, SafeAreaView, ScrollView, StatusBar, Text, TouchableOpacity, View } from 'react-native';
import { Dropdown } from 'react-native-element-dropdown';
import { database } from '../configuration/firebaseConfig';
import OperationCustomModal from '../components/OperationCustomModal';
import GlobalStyles from '../styles/GlobalStyles';
import styles from '../styles/RDANAStyles';
import Theme from '../constants/theme';
import { LinearGradient } from 'expo-linear-gradient';
import { logActivity, logSubmission } from '../components/logSubmission';
import { useAuth } from '../context/AuthContext';
import CustomModal from '../components/CustomModal';
import provinces from '../data/province.json';
import cities from '../data/city.json';
import barangays from '../data/barangay.json';

const RDANASummary = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { user } = useAuth();
  const { reportData: initialReportData = {}, affectedMunicipalities: initialMunicipalities = [], authoritiesAndOrganizations: initialAuthorities = [], affectedLocations: initialLocations = [], immediateNeeds: initialNeeds = [], initialResponse: initialResponseData = [], organizationName = user?.organization || 'Admin' } = route.params || {};
  const [reportData, setReportData] = useState(initialReportData);
  const [affectedMunicipalities, setAffectedMunicipalities] = useState(initialMunicipalities);
  const [authoritiesAndOrganizations, setAuthoritiesAndOrganizations] = useState(initialAuthorities);
  const [affectedLocations, setAffectedLocations] = useState(initialLocations);
  const [immediateNeeds, setImmediateNeeds] = useState(initialNeeds);
  const [initialResponse, setInitialResponse] = useState(initialResponseData);
  const [modalVisible, setModalVisible] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const windowHeight = Dimensions.get('window').height;
  const maxDropdownHeight = windowHeight * 0.3;

  const provinceOptions = provinces.map((p) => ({ label: p.province_name, value: p.province_name }));
  const [cityOptions, setCityOptions] = useState([]);
  const [barangayOptions, setBarangayOptions] = useState([]);
  const [affectedCityOptions, setAffectedCityOptions] = useState([]);
  const [affectedBarangayOptions, setAffectedBarangayOptions] = useState([]);

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
      if (!Array.isArray(affectedLocations)) {
        throw new Error('Invalid affected locations data received');
      }
      if (!Array.isArray(immediateNeeds)) {
        throw new Error('Invalid immediate needs data received');
      }
      if (!Array.isArray(initialResponse)) {
        throw new Error('Invalid initial response data received');
      }
      console.log(`[${new Date().toISOString()}] Received params:`, { reportData, affectedMunicipalities, authoritiesAndOrganizations, affectedLocations, immediateNeeds, initialResponse, organizationName });
    } catch (error) {
      console.error(`[${new Date().toISOString()}] Validation error:`, error.message);
      Alert.alert('Error', error.message);
      setErrorMessage(error.message);
      setModalVisible(true);
    }
  }, [reportData, affectedMunicipalities, authoritiesAndOrganizations, affectedLocations, immediateNeeds, initialResponse, organizationName]);

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

  useEffect(() => {
    if (reportData.Site_Location_Address_Province) {
      const selectedProvince = provinces.find((p) => p.province_name === reportData.Site_Location_Address_Province);
      const provinceCode = selectedProvince ? selectedProvince.province_code : '';
      const filteredCities = cities.filter((c) => c.province_code === provinceCode).map((c) => ({ label: c.city_name, value: c.city_name }));
      setCityOptions(filteredCities);
    }
    if (reportData.Site_Location_Address_City_Municipality) {
      const selectedCity = cities.find((c) => c.city_name === reportData.Site_Location_Address_City_Municipality);
      const cityCode = selectedCity ? selectedCity.city_code : '';
      const filteredBarangays = barangays.filter((b) => b.city_code === cityCode).map((b) => ({ label: b.brgy_name, value: b.brgy_name }));
      setBarangayOptions(filteredBarangays);
    }
    if (reportData.Locations_and_Areas_Affected_Province) {
      const selectedProvince = provinces.find((p) => p.province_name === reportData.Locations_and_Areas_Affected_Province);
      const provinceCode = selectedProvince ? selectedProvince.province_code : '';
      const filteredCities = cities.filter((c) => c.province_code === provinceCode).map((c) => ({ label: c.city_name, value: c.city_name }));
      setAffectedCityOptions(filteredCities);
    }
    if (reportData.Locations_and_Areas_Affected_City_Municipality) {
      const selectedCity = cities.find((c) => c.city_name === reportData.Locations_and_Areas_Affected_City_Municipality);
      const cityCode = selectedCity ? selectedCity.city_code : '';
      const filteredBarangays = barangays.filter((b) => b.city_code === cityCode).map((b) => ({ label: b.brgy_name, value: b.brgy_name }));
      setAffectedBarangayOptions(filteredBarangays);
    }
  }, [
    reportData.Site_Location_Address_Province,
    reportData.Site_Location_Address_City_Municipality,
    reportData.Locations_and_Areas_Affected_Province,
    reportData.Locations_and_Areas_Affected_City_Municipality,
  ]);

  const sanitizeKey = (key) => {
    return key
      .replace(/[.#$/[\]]/g, '_')
      .replace(/\s+/g, '_')
      .replace(/[^a-zA-Z0-9_]/g, '')
      .replace(/_+/g, '_');
  };

  const formatLabel = (key) => {
    return key
      .replace(/_/g, ' ')
      .replace(/([A-Z])/g, ' $1')
      .trim()
      .split(' ')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
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
      if (Object.keys(reportData).length === 0 || affectedMunicipalities.length === 0 || authoritiesAndOrganizations.length === 0 || affectedLocations.length === 0 || initialResponse.length === 0) {
        throw new Error('Incomplete form data');
      }
      if (!database) {
        throw new Error('Database reference is not available');
      }

      setIsSubmitting(true);
      console.log(`[${new Date().toISOString()}] Submitting RDANA report:`, reportData, affectedMunicipalities, authoritiesAndOrganizations, affectedLocations, immediateNeeds, initialResponse);

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
        ...(reportData.otherNeeds ? [{ item: reportData.otherNeeds, needed: true, qty: reportData.estQty || 'N/A' }] : []),
      ];

      const lifelines = [
        { structure: 'Residential Houses', status: reportData.residentialhousesStatus || 'N/A' },
        { structure: 'Transportation and Mobility', status: reportData.transportationandmobilityStatus || 'N/A' },
        { structure: 'Electricity, Power Grid', status: reportData.electricitypowergridStatus || 'N/A' },
        { structure: 'Communication Networks, Internet', status: reportData.communicationnetworksinternetStatus || 'N/A' },
        { structure: 'Hospitals, Rural Health Units', status: reportData.hospitalsruralhealthunitsStatus || 'N/A' },
        { structure: 'Water Supply System', status: reportData.watersupplysystemStatus || 'N/A' },
        { structure: 'Market, Business, Commercial Establishments', status: reportData.marketbusinessandcommercialestablishmentsStatus || 'N/A' },
        { structure: 'Others', status: reportData.othersStatus || 'N/A' },
      ].filter((item) => item.status !== 'N/A');

      const submission = {
        rdanaId: `RDANA-${Math.floor(100 + Math.random() * 900)}`,
        timestamp: serverTimestamp(),
        userUid: user.id,
        reportData: {
          profile: {
            province: reportData.Site_Location_Address_Province || '',
            city: reportData.Site_Location_Address_City_Municipality || '',
            barangay: reportData.Site_Location_Address_Barangay || '',
            infoDate: reportData.Date_of_Information_Gathered || '',
            infoTime: reportData.Time_of_Information_Gathered || '',
            authorities: authoritiesAndOrganizations,
            affectedLocations,
            disasterType: reportData.Type_of_Disaster || '',
            occurrenceDate: reportData.Date_of_Occurrence || '',
            occurrenceTime: reportData.Time_of_Occurrence || '',
            summary: reportData.summary || '',
          },
          disasterEffects: affectedMunicipalities,
          lifelines,
          checklist: needsChecklist,
          immediateNeeds,
          initialResponse,
        },
        status: 'Submitted',
      };

      const submittedRef = databaseRef(database, 'rdana/submitted');
      const newReportRef = push(submittedRef);
      const submissionId = newReportRef.key;
      await push(submittedRef, submission);

      const message = `New RDANA report "${reportData.Type_of_Disaster || 'N/A'}" submitted by ${reportData.Prepared_By || 'Unknown'} from ${organizationName} on ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })} at ${new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })} PST.`;
      await notifyAdmin(message, submissionId, reportData.Local_Authorities_Persons_Contacted_for_Information || 'Unknown', organizationName);

      await logActivity('Submitted an RDANA report', submissionId, user.id, organizationName);
      await logSubmission('rdana', submission, submissionId, organizationName, user.id);

      console.log(`[${new Date().toISOString()}] RDANA report submitted:`, submissionId);

      setReportData({});
      setAffectedMunicipalities([]);
      setAuthoritiesAndOrganizations([]);
      setAffectedLocations([]);
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
    console.log(`[${new Date().toISOString()}] Navigating back with data:`, reportData, affectedMunicipalities, authoritiesAndOrganizations, affectedLocations, immediateNeeds, initialResponse);
    navigation.navigate('RDANAScreen', { reportData, affectedMunicipalities, authoritiesAndOrganizations, affectedLocations, immediateNeeds, initialResponse, organizationName });
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
    <View key={index.toString()} style={[styles.summaryTableRow, { minWidth: 600 }]}>
      <Text style={[styles.summaryTableCell, { minWidth: 300 }]}>{item.authority || 'N/A'}</Text>
      <Text style={[styles.summaryTableCell, { minWidth: 300 }]}>{item.organization || 'N/A'}</Text>
    </View>
  );

  const renderLocationItem = (item, index) => (
    <View key={index.toString()} style={[styles.summaryTableRow, { minWidth: 600 }]}>
      <Text style={[styles.summaryTableCell, { minWidth: 200 }]}>{item.province || 'N/A'}</Text>
      <Text style={[styles.summaryTableCell, { minWidth: 200 }]}>{item.city || 'N/A'}</Text>
      <Text style={[styles.summaryTableCell, { minWidth: 200 }]}>{item.barangay || 'N/A'}</Text>
    </View>
  );

  const renderNeedItem = (item, index) => (
    <View key={index.toString()} style={[styles.summaryTableRow, { minWidth: 600 }]}>
      <Text style={[styles.summaryTableCell, { minWidth: 400 }]}>{item.need || 'N/A'}</Text>
      <Text style={[styles.summaryTableCell, { minWidth: 120 }]}>{item.qty || 'N/A'}</Text>
    </View>
  );

  const renderResponseItem = (item, index) => (
    <View key={index.toString()} style={[styles.summaryTableRow, { minWidth: 600 }]}>
      <Text style={[styles.summaryTableCell, { minWidth: 200 }]}>{item.group || 'N/A'}</Text>
      <Text style={[styles.summaryTableCell, { minWidth: 200 }]}>{item.assistance || 'N/A'}</Text>
      <Text style={[styles.summaryTableCell, { minWidth: 120 }]}>{item.families || 'N/A'}</Text>
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
              <View style={styles.fieldContainer}>
                <Text style={styles.label}>Province:</Text>
                <View style={[GlobalStyles.input, styles.pickerContainer]}>
                  <Dropdown
                    style={{ padding: 10, width: '100%', fontFamily: 'Poppins_Regular' }}
                    placeholderStyle={{ fontFamily: 'Poppins_Regular', color: Theme.colors.placeholderColor, fontSize: 14 }}
                    selectedTextStyle={{ fontFamily: 'Poppins_Regular', fontSize: 14, color: Theme.colors.black }}
                    itemTextStyle={{ fontFamily: 'Poppins_Regular', fontSize: 14, color: Theme.colors.black }}
                    itemContainerStyle={{ maxHeight: maxDropdownHeight }}
                    data={[{ label: 'Select Province', value: '' }, ...provinceOptions]}
                    labelField="label"
                    valueField="value"
                    placeholder="Select Province"
                    value={reportData.Site_Location_Address_Province || ''}
                    onChange={() => {}} // Read-only
                    containerStyle={{ maxHeight: maxDropdownHeight }}
                    disable={true}
                    renderRightIcon={() => (
                      <Ionicons name="chevron-down" size={20} color={Theme.colors.black} />
                    )}
                  />
                </View>
              </View>
              <View style={styles.fieldContainer}>
                <Text style={styles.label}>City/Municipality:</Text>
                <View style={[GlobalStyles.input, styles.pickerContainer]}>
                  <Dropdown
                    style={{ padding: 10, width: '100%', fontFamily: 'Poppins_Regular' }}
                    placeholderStyle={{ fontFamily: 'Poppins_Regular', color: Theme.colors.placeholderColor, fontSize: 14 }}
                    selectedTextStyle={{ fontFamily: 'Poppins_Regular', fontSize: 14, color: Theme.colors.black }}
                    itemTextStyle={{ fontFamily: 'Poppins_Regular', fontSize: 14, color: Theme.colors.black }}
                    itemContainerStyle={{ maxHeight: maxDropdownHeight }}
                    data={[{ label: 'Select City/Municipality', value: '' }, ...cityOptions]}
                    labelField="label"
                    valueField="value"
                    placeholder="Select City/Municipality"
                    value={reportData.Site_Location_Address_City_Municipality || ''}
                    onChange={() => {}} // Read-only
                    containerStyle={{ maxHeight: maxDropdownHeight }}
                    disable={true}
                    renderRightIcon={() => (
                      <Ionicons name="chevron-down" size={20} color={Theme.colors.black} />
                    )}
                  />
                </View>
              </View>
              <View style={styles.fieldContainer}>
                <Text style={styles.label}>Barangay:</Text>
                <View style={[GlobalStyles.input, styles.pickerContainer]}>
                  <Dropdown
                    style={{ padding: 10, width: '100%', fontFamily: 'Poppins_Regular' }}
                    placeholderStyle={{ fontFamily: 'Poppins_Regular', color: Theme.colors.placeholderColor, fontSize: 14 }}
                    selectedTextStyle={{ fontFamily: 'Poppins_Regular', fontSize: 14, color: Theme.colors.black }}
                    itemTextStyle={{ fontFamily: 'Poppins_Regular', fontSize: 14, color: Theme.colors.black }}
                    itemContainerStyle={{ maxHeight: maxDropdownHeight }}
                    data={[{ label: 'Select Barangay', value: '' }, ...barangayOptions]}
                    labelField="label"
                    valueField="value"
                    placeholder="Select Barangay"
                    value={reportData.Site_Location_Address_Barangay || ''}
                    onChange={() => {}} // Read-only
                    containerStyle={{ maxHeight: maxDropdownHeight }}
                    disable={true}
                    renderRightIcon={() => (
                      <Ionicons name="chevron-down" size={20} color={Theme.colors.black} />
                    )}
                  />
                </View>
              </View>
              <View style={styles.fieldContainer}>
                <Text style={styles.label}>Local Authorities/Persons Contacted:</Text>
                <Text style={styles.value}>{reportData.Local_Authorities_Persons_Contacted_for_Information || 'N/A'}</Text>
              </View>
              <View style={styles.fieldContainer}>
                <Text style={styles.label}>Date Information Gathered:</Text>
                <View style={[GlobalStyles.input, { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }]}>
                  <Text style={{ fontFamily: 'Poppins_Regular', color: reportData.Date_of_Information_Gathered ? Theme.colors.black : Theme.colors.placeholderColor }}>
                    {reportData.Date_of_Information_Gathered || 'N/A'}
                  </Text>
                  <Ionicons name="calendar-outline" size={20} color={Theme.colors.black} />
                </View>
              </View>
              <View style={styles.fieldContainer}>
                <Text style={styles.label}>Time Information Gathered:</Text>
                <View style={[GlobalStyles.input, { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }]}>
                  <Text style={{ fontFamily: 'Poppins_Regular', color: reportData.Time_of_Information_Gathered ? Theme.colors.black : Theme.colors.placeholderColor }}>
                    {reportData.Time_of_Information_Gathered || 'N/A'}
                  </Text>
                  <Ionicons name="time-outline" size={20} color={Theme.colors.black} />
                </View>
              </View>
              <View style={styles.fieldContainer}>
                <Text style={styles.label}>Name Organization Involved:</Text>
                <Text style={styles.value}>{reportData.Name_of_the_Organizations_Involved || 'N/A'}</Text>
              </View>
              {authoritiesAndOrganizations.length > 0 && (
                <View style={GlobalStyles.section}>
                  <Text style={styles.sectionSubtitle}>Authorities and Organizations</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator>
                    <View style={styles.summaryTable}>
                      <View style={[styles.summaryTableHeader, { minWidth: 600 }]}>
                        <Text style={[styles.summaryTableHeaderCell, { minWidth: 300 }]}>Authority</Text>
                        <Text style={[styles.summaryTableHeaderCell, { minWidth: 300 }]}>Organization</Text>
                      </View>
                      {authoritiesAndOrganizations.map((item, index) => renderAuthorityItem(item, index))}
                    </View>
                  </ScrollView>
                </View>
              )}
            </View>

            <View style={GlobalStyles.section}>
              <Text style={GlobalStyles.sectionTitle}>Modality</Text>
              <View style={styles.fieldContainer}>
                <Text style={styles.label}>Locations and Areas Affected Province:</Text>
                <View style={[GlobalStyles.input, styles.pickerContainer]}>
                  <Dropdown
                    style={{ padding: 10, width: '100%', fontFamily: 'Poppins_Regular' }}
                    placeholderStyle={{ fontFamily: 'Poppins_Regular', color: Theme.colors.placeholderColor, fontSize: 14 }}
                    selectedTextStyle={{ fontFamily: 'Poppins_Regular', fontSize: 14, color: Theme.colors.black }}
                    itemTextStyle={{ fontFamily: 'Poppins_Regular', fontSize: 14, color: Theme.colors.black }}
                    itemContainerStyle={{ maxHeight: maxDropdownHeight }}
                    data={[{ label: 'Select Province', value: '' }, ...provinceOptions]}
                    labelField="label"
                    valueField="value"
                    placeholder="Select Province"
                    value={reportData.Locations_and_Areas_Affected_Province || ''}
                    onChange={() => {}} // Read-only
                    containerStyle={{ maxHeight: maxDropdownHeight }}
                    disable={true}
                    renderRightIcon={() => (
                      <Ionicons name="chevron-down" size={20} color={Theme.colors.black} />
                    )}
                  />
                </View>
              </View>
              <View style={styles.fieldContainer}>
                <Text style={styles.label}>Locations and Areas Affected City/Municipality:</Text>
                <View style={[GlobalStyles.input, styles.pickerContainer]}>
                  <Dropdown
                    style={{ padding: 10, width: '100%', fontFamily: 'Poppins_Regular' }}
                    placeholderStyle={{ fontFamily: 'Poppins_Regular', color: Theme.colors.placeholderColor, fontSize: 14 }}
                    selectedTextStyle={{ fontFamily: 'Poppins_Regular', fontSize: 14, color: Theme.colors.black }}
                    itemTextStyle={{ fontFamily: 'Poppins_Regular', fontSize: 14, color: Theme.colors.black }}
                    itemContainerStyle={{ maxHeight: maxDropdownHeight }}
                    data={[{ label: 'Select City/Municipality', value: '' }, ...affectedCityOptions]}
                    labelField="label"
                    valueField="value"
                    placeholder="Select City/Municipality"
                    value={reportData.Locations_and_Areas_Affected_City_Municipality || ''}
                    onChange={() => {}} // Read-only
                    containerStyle={{ maxHeight: maxDropdownHeight }}
                    disable={true}
                    renderRightIcon={() => (
                      <Ionicons name="chevron-down" size={20} color={Theme.colors.black} />
                    )}
                  />
                </View>
              </View>
              <View style={styles.fieldContainer}>
                <Text style={styles.label}>Locations and Areas Affected Barangay:</Text>
                <View style={[GlobalStyles.input, styles.pickerContainer]}>
                  <Dropdown
                    style={{ padding: 10, width: '100%', fontFamily: 'Poppins_Regular' }}
                    placeholderStyle={{ fontFamily: 'Poppins_Regular', color: Theme.colors.placeholderColor, fontSize: 14 }}
                    selectedTextStyle={{ fontFamily: 'Poppins_Regular', fontSize: 14, color: Theme.colors.black }}
                    itemTextStyle={{ fontFamily: 'Poppins_Regular', fontSize: 14, color: Theme.colors.black }}
                    itemContainerStyle={{ maxHeight: maxDropdownHeight }}
                    data={[{ label: 'Select Barangay', value: '' }, ...affectedBarangayOptions]}
                    labelField="label"
                    valueField="value"
                    placeholder="Select Barangay"
                    value={reportData.Locations_and_Areas_Affected_Barangay || ''}
                    onChange={() => {}} // Read-only
                    containerStyle={{ maxHeight: maxDropdownHeight }}
                    disable={true}
                    renderRightIcon={() => (
                      <Ionicons name="chevron-down" size={20} color={Theme.colors.black} />
                    )}
                  />
                </View>
              </View>
              {affectedLocations.length > 0 && (
                <View style={GlobalStyles.section}>
                  <Text style={styles.sectionSubtitle}>Affected Locations</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator>
                    <View style={styles.summaryTable}>
                      <View style={[styles.summaryTableHeader, { minWidth: 600 }]}>
                        <Text style={[styles.summaryTableHeaderCell, { minWidth: 200 }]}>Province</Text>
                        <Text style={[styles.summaryTableHeaderCell, { minWidth: 200 }]}>City/Municipality</Text>
                        <Text style={[styles.summaryTableHeaderCell, { minWidth: 200 }]}>Barangay</Text>
                      </View>
                      {affectedLocations.map((item, index) => renderLocationItem(item, index))}
                    </View>
                  </ScrollView>
                </View>
              )}
              <View style={styles.fieldContainer}>
                <Text style={styles.label}>Type of Disaster:</Text>
                <View style={[GlobalStyles.input, styles.pickerContainer]}>
                  <Dropdown
                    style={{ padding: 10, width: '100%', fontFamily: 'Poppins_Regular' }}
                    placeholderStyle={{ fontFamily: 'Poppins_Regular', color: Theme.colors.placeholderColor, fontSize: 14 }}
                    selectedTextStyle={{ fontFamily: 'Poppins_Regular', fontSize: 14, color: Theme.colors.black }}
                    itemTextStyle={{ fontFamily: 'Poppins_Regular', fontSize: 14, color: Theme.colors.black }}
                    itemContainerStyle={{ maxHeight: maxDropdownHeight }}
                    data={[
                      { label: 'Select Type of Disaster', value: '' },
                      { label: 'Earthquake', value: 'Earthquake' },
                      { label: 'Typhoon', value: 'Typhoon' },
                      { label: 'Flood', value: 'Flood' },
                      { label: 'Landslide', value: 'Landslide' },
                      { label: 'Fire', value: 'Fire' },
                    ]}
                    labelField="label"
                    valueField="value"
                    placeholder="Select Type of Disaster"
                    value={reportData.Type_of_Disaster || ''}
                    onChange={() => {}} // Read-only
                    containerStyle={{ maxHeight: maxDropdownHeight }}
                    disable={true}
                    renderRightIcon={() => (
                      <Ionicons name="chevron-down" size={20} color={Theme.colors.black} />
                    )}
                  />
                </View>
              </View>
              <View style={styles.fieldContainer}>
                <Text style={styles.label}>Date of Occurrence:</Text>
                <View style={[GlobalStyles.input, { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }]}>
                  <Text style={{ fontFamily: 'Poppins_Regular', color: reportData.Date_of_Occurrence ? Theme.colors.black : Theme.colors.placeholderColor }}>
                    {reportData.Date_of_Occurrence || 'N/A'}
                  </Text>
                  <Ionicons name="calendar-outline" size={20} color={Theme.colors.black} />
                </View>
              </View>
              <View style={styles.fieldContainer}>
                <Text style={styles.label}>Time of Occurrence:</Text>
                <View style={[GlobalStyles.input, { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }]}>
                  <Text style={{ fontFamily: 'Poppins_Regular', color: reportData.Time_of_Occurrence ? Theme.colors.black : Theme.colors.placeholderColor }}>
                    {reportData.Time_of_Occurrence || 'N/A'}
                  </Text>
                  <Ionicons name="time-outline" size={20} color={Theme.colors.black} />
                </View>
              </View>
              <View style={styles.fieldContainer}>
                <Text style={styles.label}>Summary of Disaster Incident:</Text>
                <Text style={styles.value}>{reportData.summary || 'N/A'}</Text>
              </View>
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
                { key: 'reliefPacks', label: 'Relief Packs' },
                { key: 'hotMeals', label: 'Hot Meals' },
                { key: 'hygieneKits', label: 'Hygiene Kits' },
                { key: 'drinkingWater', label: 'Drinking Water' },
                { key: 'ricePacks', label: 'Rice Packs' },
              ].map(({ key, label }) => (
                <View key={label} style={styles.fieldContainer}>
                  <Text style={styles.label}>{formatLabel(label)}:</Text>
                  <Text style={styles.value}>{reportData[key] === 'Yes' ? 'Yes' : 'No'}</Text>
                </View>
              ))}
              {immediateNeeds.length > 0 && (
                <View style={GlobalStyles.section}>
                  <Text style={styles.sectionSubtitle}>Other Immediate Needs</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator>
                    <View style={styles.summaryTable}>
                      <View style={[styles.summaryTableHeader, { minWidth: 600 }]}>
                        <Text style={[styles.summaryTableHeaderCell, { minWidth: 400 }]}>Need</Text>
                        <Text style={[styles.summaryTableHeaderCell, { minWidth: 120 }]}>Quantity</Text>
                      </View>
                      {immediateNeeds.map((item, index) => renderNeedItem(item, index))}
                    </View>
                  </ScrollView>
                </View>
              )}
            </View>

            <View style={GlobalStyles.section}>
              <Text style={GlobalStyles.sectionTitle}>Initial Response Actions</Text>
              {initialResponse.length > 0 ? (
                <ScrollView horizontal showsHorizontalScrollIndicator>
                  <View style={styles.summaryTable}>
                    <View style={[styles.summaryTableHeader, { minWidth: 600 }]}>
                      <Text style={[styles.summaryTableHeaderCell, { minWidth: 200 }]}>Group</Text>
                      <Text style={[styles.summaryTableHeaderCell, { minWidth: 200 }]}>Assistance</Text>
                      <Text style={[styles.summaryTableHeaderCell, { minWidth: 120 }]}>Families</Text>
                    </View>
                    {initialResponse.map((item, index) => renderResponseItem(item, index))}
                  </View>
                </ScrollView>
              ) : (
                <>
                  <View style={styles.fieldContainer}>
                    <Text style={styles.label}>Response Groups Involved:</Text>
                    <Text style={styles.value}>{reportData.responseGroup || 'N/A'}</Text>
                  </View>
                  <View style={styles.fieldContainer}>
                    <Text style={styles.label}>Relief Assistance Deployed:</Text>
                    <Text style={styles.value}>{reportData.reliefDeployed || 'N/A'}</Text>
                  </View>
                  <View style={styles.fieldContainer}>
                    <Text style={styles.label}>Number of Families Served:</Text>
                    <Text style={styles.value}>{reportData.familiesServed || 'N/A'}</Text>
                  </View>
                </>
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