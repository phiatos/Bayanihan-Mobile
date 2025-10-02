import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, CommonActions } from '@react-navigation/native';
import { ref as databaseRef, push, serverTimestamp, set, get } from 'firebase/database';
import React, { useEffect, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, SafeAreaView, ScrollView, StatusBar, Text, ToastAndroid, TouchableOpacity, View } from 'react-native';
import { database } from '../configuration/firebaseConfig';
import GlobalStyles from '../styles/GlobalStyles';
import styles from '../styles/RDANAStyles';
import Theme from '../constants/theme';
import { LinearGradient } from 'expo-linear-gradient';
import { logActivity, logSubmission } from '../components/logSubmission';
import { useAuth } from '../context/AuthContext';
import CustomModal from '../components/CustomModal';
import * as Location from 'expo-location';

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
    organizationName = user?.organization || 'Admin',
  } = route.params || {};
  const [reportData, setReportData] = useState(initialReportData);
  const [affectedMunicipalities, setAffectedMunicipalities] = useState(initialMunicipalities);
  const [authoritiesAndOrganizations, setAuthoritiesAndOrganizations] = useState(initialAuthorities);
  const [immediateNeeds, setImmediateNeeds] = useState(initialNeeds);
  const [initialResponse, setInitialResponse] = useState(initialResponses);
  const [modalVisible, setModalVisible] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);

  const formatDateForStorage = (dateStr) => {
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) {
        throw new Error('Invalid date format');
      }
      return date.toISOString();
    } catch (error) {
      console.error(`[${new Date().toISOString()}] Date formatting error:`, error.message);
      return null;
    }
  };

  const getCoordinates = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        return { latitude: 0, longitude: 0 };
      }
      const location = await Location.getCurrentPositionAsync({});
      return {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      };
    } catch (error) {
      console.error(`[${new Date().toISOString()}] Error getting location:`, error.message);
      return { latitude: 0, longitude: 0 };
    }
  };

const isValidString = (str) => /^[a-zA-ZñÑ0-9\s,.-]+$/.test(str?.trim());

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
  
    } catch (error) {
      console.error(`[${new Date().toISOString()}] Validation error:`, error.message);
      Alert.alert('Error', error.message);
      setErrorMessage(error.message);
      setModalVisible(true);
    }
  }, [reportData, affectedMunicipalities, authoritiesAndOrganizations, immediateNeeds, initialResponse, organizationName]);

  useEffect(() => {
    try {
      if (!user || !user.id) {
        throw new Error('No authenticated user found or missing user ID');
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

  const sanitizeKey = (key) => {
    return key
      .replace(/[.#$/[\]]/g, '_')
      .replace(/\s+/g, '_')
      .replace(/[^a-zA-Z0-9_]/g, '')
      .replace(/_+/g, '_');
  };

  const formatLargeNumber = (value) => {
    if (value === null || value === undefined || value === "") return "0";
    let num = Number(value.toString().replace(/^0+/, ""));
    if (isNaN(num)) return "0";
    if (num >= 1_000_000_000) return (num / 1_000_000_000).toFixed(1).replace(/\.0$/, "") + "B";
    if (num >= 1_000_000) return (num / 1_000_000).toFixed(1).replace(/\.0$/, "") + "M";
    if (num >= 1_000) return (num / 1_000).toFixed(1).replace(/\.0$/, "") + "k";
    return num.toString();
  };

  const notifyAdmin = async (message, disasterType, location, details, rdanaId, senderName, organization) => {
    try {
      const identifier = `rdana_${rdanaId}_${Date.now()}`;
      const key = push(databaseRef(database, 'notifications')).key;
      await set(databaseRef(database, `notifications/${key}`), {
        message,
        calamityType: disasterType || null,
        location: location || null,
        details: details || null,
        eventId: null,
        rdanaId,
        senderName,
        organization,
        identifier,
        timestamp: serverTimestamp(),
        read: false,
        type: "admin"
      });
    } catch (error) {
      console.error(`[${new Date().toISOString()}] Failed to notify admin:`, error.message);
    }
  };

  const generateUniqueId = async () => {
    let attempts = 0;
    const maxAttempts = 3;

    while (attempts < maxAttempts) {
      const randomNum = Math.floor(100 + Math.random() * 900);
      const customId = `RDANA-${randomNum}`;
      const snapshot = await get(databaseRef(database, `rdana/submitted/${customId}`));
      if (!snapshot.exists()) {
        return customId;
      }
      attempts++;
    }
    throw new Error('Unable to generate a unique RDANA ID after maximum attempts.');
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    if (!user || !user.id) {
      setErrorMessage('User not authenticated or missing ID. Please log in again.');
      setModalVisible(true);
      setIsSubmitting(false);
      return;
    }

    const { 
      Site_Location_Address_Province, 
      Site_Location_Address_City_Municipality, 
      Site_Location_Address_Barangay, 
      Type_of_Disaster, 
      Date_and_Time_of_Information_Gathered,
      Locations_and_Areas_Affected_Province,
      Locations_and_Areas_Affected_City_Municipality,
      Locations_and_Areas_Affected_Barangay
    } = reportData;

    if (!Site_Location_Address_Province?.trim() || !isValidString(Site_Location_Address_Province)) {
      ToastAndroid.show('Please enter a valid province.', ToastAndroid.SHORT);
      setIsSubmitting(false);
      return;
    }

    if (!Site_Location_Address_City_Municipality?.trim() || !isValidString(Site_Location_Address_City_Municipality)) {
      ToastAndroid.show('Please enter a valid city/municipality.', ToastAndroid.SHORT);
      setIsSubmitting(false);
      return;
    }

    if (!Site_Location_Address_Barangay?.trim() || !isValidString(Site_Location_Address_Barangay)) {
      ToastAndroid.show('Please enter a valid barangay.', ToastAndroid.SHORT);
      setIsSubmitting(false);
      return;
    }

    if (!Type_of_Disaster?.trim()) {
      ToastAndroid.show('Please select a disaster type.', ToastAndroid.SHORT);
      setIsSubmitting(false);
      return;
    }

    if (!Date_and_Time_of_Information_Gathered?.trim()) {
      setErrorMessage('Please enter the date and time of information gathered.');
      setModalVisible(true);
      setIsSubmitting(false);
      return;
    }

    const formattedInfoDate = formatDateForStorage(Date_and_Time_of_Information_Gathered);
    if (!formattedInfoDate) {
      setErrorMessage('Invalid format for Date and Time of Information Gathered. Please use a valid date format (e.g., MM/DD/YYYY HH:MM).');
      setModalVisible(true);
      setIsSubmitting(false);
      return;
    }

    const formattedOccurrenceDate = reportData.Date_and_Time_of_Occurrence?.trim() 
      ? formatDateForStorage(reportData.Date_and_Time_of_Occurrence)
      : null;
    if (reportData.Date_and_Time_of_Occurrence?.trim() && !formattedOccurrenceDate) {
      setErrorMessage('Invalid format for Date and Time of Occurrence. Please use a valid date format (e.g., MM/DD/YYYY HH:MM).');
      setModalVisible(true);
      setIsSubmitting(false);
      return;
    }

    if (affectedMunicipalities.length === 0) {
      setErrorMessage('Please add at least one affected municipality.');
      setModalVisible(true);
      setIsSubmitting(false);
      return;
    }

    try {
      const checklistLabels = {
        reliefPacks: "Relief Packs",
        hotMeals: "Hot Meals",
        hygieneKits: "Hygiene Kits",
        drinkingWater: "Drinking Water",
        ricePacks: "Rice Packs"
      };
      const checklist = Object.keys(checklistLabels)
        .filter(id => reportData[id] === 'Yes')
        .map(id => id);

      const lifelines = [
        { structure: 'Residential Houses', status: reportData.residentialhousesStatus || 'N/A' },
        { structure: 'Transportation and Mobility', status: reportData.transportationandmobilityStatus || 'N/A' },
        { structure: 'Electricity, Power Grid', status: reportData.electricitypowergridStatus || 'N/A' },
        { structure: 'Communication Networks, Internet', status: reportData.communicationnetworksinternetStatus || 'N/A' },
        { structure: 'Hospitals, Rural Health Units', status: reportData.hospitalsruralhealthunitsStatus || 'N/A' },
        { structure: 'Water Supply System', status: reportData.watersupplysystemStatus || 'N/A' },
        { structure: 'Market, Business, Commercial Establishments', status: reportData.marketbusinessandcommercialestablishmentsStatus || 'N/A' },
        { structure: 'Others', status: reportData.othersStatus || 'N/A' },
      ];

      const rdanaId = await generateUniqueId();
      const affectedLocations = [];
      const provinces = Locations_and_Areas_Affected_Province?.split(', ') || [];
      const cities = Locations_and_Areas_Affected_City_Municipality?.split(', ') || [];
      const barangays = Locations_and_Areas_Affected_Barangay?.split(', ') || [];

      const maxLength = Math.max(provinces.length, cities.length, barangays.length);
      for (let i = 0; i < maxLength; i++) {
        if (provinces[i] && cities[i] && barangays[i]) {
          affectedLocations.push({
            province: provinces[i].trim() || '',
            city: cities[i].trim() || '',
            barangay: barangays[i].trim() || ''
          });
        }
      }

      const newReport = {
        rdanaId,
        timestamp: serverTimestamp(),
        currentUserGroupName: organizationName,
        userUid: user.id,
        reportData: {
          profile: {
            province: Site_Location_Address_Province.trim() || '',
            city: Site_Location_Address_City_Municipality.trim() || '',
            barangay: Site_Location_Address_Barangay.trim() || '',
            infoDate: formattedInfoDate,
            authorities: authoritiesAndOrganizations.map(row => ({
              authority: row.authority?.trim() || '',
              organization: row.organization?.trim() || ''
            })),
            affectedLocations, 
            disasterType: Type_of_Disaster.trim() || '',
            occurrenceDate: formattedOccurrenceDate || '', 
            summary: reportData.summary?.trim() || ''
          },
          disasterEffects: affectedMunicipalities.map(row => [
            row.community?.trim() || '',
            Number(row.totalPop) || 0, 
            Number(row.affectedPopulation) || 0, 
            Number(row.deaths) || 0, 
            Number(row.injured) || 0, 
            Number(row.missing) || 0, 
            Number(row.children) || 0, 
            Number(row.women) || 0, 
            Number(row.seniors) || 0, 
            Number(row.pwd) || 0
          ]),
          lifelines,
          checklist,
          immediateNeeds: immediateNeeds.map(n => ({
            need: n.need?.trim() || '',
            qty: Number(n.qty) || 0  
          })),
          initialResponse: initialResponse.map(r => ({
            group: r.group?.trim() || '',
            assistance: r.assistance?.trim() || '',
            families: Number(r.families) || 0
          }))
        },
        status: 'Submitted'
      };


      const requestRef = push(databaseRef(database, 'rdana/submitted'));
      const userRequestRef = databaseRef(database, `users/${user.id}/rdana/${rdanaId}`);
      const message = `New RDANA report "${Type_of_Disaster || 'N/A'}" submitted by ${reportData.Prepared_By?.trim() || 'Unknown'} from ${organizationName} on ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })} at ${new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })} PST.`;
      const location = `${Site_Location_Address_Barangay || ''}, ${Site_Location_Address_City_Municipality || ''}, ${Site_Location_Address_Province || ''}`;
      const details = reportData.summary?.trim() || 'No summary provided';

      await Promise.all([
        set(requestRef, newReport).catch(error => {
          throw new Error(`Failed to save RDANA report: ${error.message}`);
        }),
        set(userRequestRef, newReport).catch(error => {
          throw new Error(`Failed to save user RDANA report: ${error.message}`);
        }),
        logActivity('Submitted an RDANA report', rdanaId, user.id, organizationName).catch(error => {
          throw new Error(`Failed to log activity: ${error.message}`);
        }),
        logSubmission('rdana/submitted', newReport, rdanaId, organizationName, user.id).catch(error => {
          throw new Error(`Failed to log submission: ${error.message}`);
        }),
        notifyAdmin(message, Type_of_Disaster || 'N/A', location, details, rdanaId, reportData.Prepared_By?.trim() || 'Unknown', organizationName).catch(error => {
          throw new Error(`Failed to notify admin: ${error.message}`);
        })
      ]);

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
    if (errorMessage) {
      navigation.navigate('RDANAScreen');
    }
  };

  const handleBack = () => {
    const affectedLocations = [];
    const provinces = reportData.Locations_and_Areas_Affected_Province?.split(', ') || [];
    const cities = reportData.Locations_and_Areas_Affected_City_Municipality?.split(', ') || [];
    const barangays = reportData.Locations_and_Areas_Affected_Barangay?.split(', ') || [];

    const maxLength = Math.max(provinces.length, cities.length, barangays.length);
    for (let i = 0; i < maxLength; i++) {
      if (provinces[i] && cities[i] && barangays[i]) {
        affectedLocations.push({
          province: provinces[i].trim() || '',
          city: cities[i].trim() || '',
          barangay: barangays[i].trim() || ''
        });
      }
    }

    navigation.navigate('RDANAScreen', { 
      reportData, 
      affectedMunicipalities, 
      authoritiesAndOrganizations, 
      immediateNeeds, 
      initialResponse, 
      affectedLocations,
      organizationName,
    });
  };

  const renderMunicipalityItem = (item, index) => (
    <View key={index.toString()} style={[styles.summaryTableRow, { minWidth: 1150 }]}>
      <Text style={[styles.summaryTableCell, { minWidth: 50 }]}>{index + 1}</Text>
      <Text style={[styles.summaryTableCell, { minWidth: 240 }]}>{item.community || 'N/A'}</Text>
      <Text style={[styles.summaryTableCell, { minWidth: 120 }]}>{formatLargeNumber(item.totalPop || 'N/A')}</Text>
      <Text style={[styles.summaryTableCell, { minWidth: 120 }]}>{formatLargeNumber(item.affectedPopulation || 'N/A')}</Text>
      <Text style={[styles.summaryTableCell, { minWidth: 80 }]}>{formatLargeNumber(item.deaths || 'N/A')}</Text>
      <Text style={[styles.summaryTableCell, { minWidth: 80 }]}>{formatLargeNumber(item.injured || 'N/A')}</Text>
      <Text style={[styles.summaryTableCell, { minWidth: 80 }]}>{formatLargeNumber(item.missing || 'N/A')}</Text>
      <Text style={[styles.summaryTableCell, { minWidth: 80 }]}>{formatLargeNumber(item.children || 'N/A')}</Text>
      <Text style={[styles.summaryTableCell, { minWidth: 80 }]}>{formatLargeNumber(item.women || 'N/A')}</Text>
      <Text style={[styles.summaryTableCell, { minWidth: 130 }]}>{formatLargeNumber(item.seniors || 'N/A')}</Text>
      <Text style={[styles.summaryTableCell, { minWidth: 80 }]}>{formatLargeNumber(item.pwd || 'N/A')}</Text>
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
      <Text style={[styles.summaryTableCell, { flex: 1 }]}>{formatLargeNumber(item.qty || 'N/A')}</Text>
    </View>
  );

  const renderResponseItem = (item, index) => (
    <View key={index.toString()} style={[styles.summaryTableRow, { minWidth: 600 }]}>
      <Text style={[styles.summaryTableCell, { flex: 1 }]}>{item.group || 'N/A'}</Text>
      <Text style={[styles.summaryTableCell, { flex: 1 }]}>{item.assistance || 'N/A'}</Text>
      <Text style={[styles.summaryTableCell, { flex: 1 }]}>{formatLargeNumber(item.families || 'N/A')}</Text>
    </View>
  );

  const formatLocationsForDisplay = () => {
    const provinces = reportData.Locations_and_Areas_Affected_Province?.split(', ') || [];
    const cities = reportData.Locations_and_Areas_Affected_City_Municipality?.split(', ') || [];
    const barangays = reportData.Locations_and_Areas_Affected_Barangay?.split(', ') || [];
    const locations = [];
    const maxLength = Math.max(provinces.length, cities.length, barangays.length);
    
    for (let i = 0; i < maxLength; i++) {
      const province = provinces[i]?.trim() || '';
      const city = cities[i]?.trim() || '';
      const barangay = barangays[i]?.trim() || '';
      if (province && city && barangay) {
        locations.push(`${barangay}/${city}/${province}`);
      }
    }
    return locations.length > 0 ? locations.join(', ') : 'N/A';
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
          <Text style={[GlobalStyles.headerTitle, { color: Theme.colors.primary }]}>RDANA</Text>
        </View>
      </LinearGradient>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1}}
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
                  <Text style={styles.value}>{reportData[key]?.trim() || 'N/A'}</Text>
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
                <Text style={styles.value}>{formatLocationsForDisplay()}</Text>
              </View>
              <Text style={styles.sectionSubtitle}>Disaster Details</Text>
              {[
                { key: 'Type_of_Disaster', label: 'Type of Disaster' },
                { key: 'Date_and_Time_of_Occurrence', label: 'Date and Time of Occurrence' },
                { key: 'summary', label: 'Summary' },
              ].map(({ key, label }) => (
                <View key={label} style={styles.fieldContainer}>
                  <Text style={styles.label}>{label}:</Text>
                  <Text style={styles.value}>{reportData[key]?.trim() || 'N/A'}</Text>
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
                  <Text style={styles.value}>{reportData[key]?.trim() || 'N/A'}</Text>
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
        title={errorMessage ? 'Error' : 'Report Submitted'}
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
                <Text style={GlobalStyles.modalMessage}>
                    Your RDANA report has been successfully submitted!
                </Text>
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