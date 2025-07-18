
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useNavigation, useRoute } from '@react-navigation/native';
import React, { useRef, useState } from 'react';
import {
  Alert,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  StatusBar,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { ScrollView } from 'react-native-gesture-handler';
import GlobalStyles from '../styles/GlobalStyles';
import styles from '../styles/RDANAStyles';
import Theme from '../constants/theme';
import CustomModal from '../components/CustomModal';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Define the status options for each lifeline type
const LIFELINE_STATUS_OPTIONS = {
  'Residential Houses': [
    { label: 'Select from one of the following', value: '' },
    { label: 'Some houses are flooded/damaged.', value: 'Some houses are flooded/damaged.' },
    { label: 'Many houses are flooded/damaged.', value: 'Many houses are flooded/damaged.' },
    { label: 'An entire community is flooded/damaged.', value: 'An entire community is flooded/damaged.' },
  ],
  'Transportation and Mobility': [
    { label: 'Select from one of the following', value: '' },
    { label: 'Roads are clear of debris and/or flood; passable.', value: 'Roads are clear of debris and/or flood; passable.' },
    { label: 'Some roads are blocked by debris and/or flood.', value: 'Some roads are blocked by debris and/or flood.' },
    { label: 'Most roads are blocked by debris and/or flood; not passable.', value: 'Most roads are blocked by debris and/or flood; not passable.' },
  ],
  'Electricity, Power Grid': [
    { label: 'Select from one of the following', value: '' },
    { label: 'There is electricity.', value: 'There is electricity.' },
    { label: 'Some places do not have electricity.', value: 'Some places do not have electricity.' },
    { label: 'The entire area has no electricity.', value: 'The entire area has no electricity.' },
  ],
  'Communication Networks, Internet': [
    { label: 'Select from one of the following', value: '' },
    { label: 'Communication lines are up.', value: 'Communication lines are up.' },
    { label: 'There is intermittent signal available.', value: 'There is intermittent signal available.' },
    { label: 'Communication lines are down.', value: 'Communication lines are down.' },
  ],
  'Hospitals, Rural Health Units': [
    { label: 'Select from one of the following', value: '' },
    { label: 'Hospitals are open.', value: 'Hospitals are open.' },
    { label: 'Some hospitals are open.', value: 'Some hospitals are open.' },
    { label: 'No hospitals are open.', value: 'No hospitals are open.' },
  ],
  'Water Supply System': [
    { label: 'Select from one of the following', value: '' },
    { label: 'Clean water is available.', value: 'Clean water is available.' },
    { label: 'Only some locations have clean water.', value: 'Only some locations have clean water.' },
    { label: 'No clean water is available.', value: 'No clean water is available.' },
  ],
  'Market, Business, and Commercial Establishments': [
    { label: 'Select from one of the following', value: '' },
    { label: 'Establishments are open.', value: 'Establishments are open.' },
    { label: 'Some establishments are open.', value: 'Some establishments are open.' },
    { label: 'No establishments are open.', value: 'No establishments are open.' },
  ],
};

const RDANAScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const [errors, setErrors] = useState({});
  const inputContainerRefs = useRef({}).current;
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [deleteIndex, setDeleteIndex] = useState(null);
  const insets = useSafeAreaInsets();


  // Custom error messages for required fields
  const requiredFieldsErrors = {
    Date_of_Information_Gathered: 'Please provide the date when information was gathered.',
    Date_of_Occurrence: 'Please specify the date of the disaster occurrence.',
    Local_Authorities_Persons_Contacted_for_Information: 'Please list the local authorities or persons contacted.',
    Locations_and_Areas_Affected_Barangay: 'Please enter the affected barangay.',
    Locations_and_Areas_Affected_City_Municipality: 'Please enter the affected city or municipality.',
    Locations_and_Areas_Affected_Province: 'Please enter the affected province.',
    Name_of_the_Organizations_Involved: 'Please provide the name of the organization involved.',
    Site_Location_Address_Barangay: 'Please enter the site location barangay.',
    Site_Location_Address_City_Municipality: 'Please enter the site location city or municipality.',
    Site_Location_Address_Province: 'Please enter the site location province.',
    Time_of_Information_Gathered: 'Please provide the time when information was gathered.',
    Time_of_Occurrence: 'Please specify the time of the disaster occurrence.',
    Type_of_Disaster: 'Please select the type of disaster.',
    community: 'Please enter the affected municipality or community.',
    totalPop: 'Please provide the total population.',
    affected: 'Please provide the number of affected population.',
    deaths: 'Please enter the number of deaths.',
    injured: 'Please enter the number of injured persons.',
    missing: 'Please enter the number of missing persons.',
    children: 'Please enter the number of affected children.',
    women: 'Please enter the number of affected women.',
    seniors: 'Please enter the number of affected senior citizens.',
    pwd: 'Please enter the number of affected persons with disabilities.',
    responseGroup: 'Please specify the response groups involved.',
    reliefDeployed: 'Please detail the relief assistance deployed.',
    familiesServed: 'Please enter the number of families served.',
  };

  // Helper functions for formatting
  const formatDate = (date) => {
    if (!date || isNaN(date.getTime())) return '';
    return date.toISOString().split('T')[0]; // YYYY-MM-DD
  };

  const formatTime = (date) => {
    if (!date || isNaN(date.getTime())) return '';
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`; // HH:MM
  };

  const parseTimeToDate = (timeStr) => {
    if (!timeStr || !/^\d{2}:\d{2}$/.test(timeStr)) return new Date();
    const [hours, minutes] = timeStr.split(':').map(Number);
    const date = new Date();
    date.setHours(hours, minutes, 0, 0);
    return date;
  };

  const isValidDate = (dateStr) => {
    const date = new Date(dateStr);
    return dateStr && !isNaN(date.getTime());
  };

  // Current date and time
  const currentDateTime = new Date();

  // Initialize reportData with route params or defaults
  const initialReportData = {
    // Profile
    Date_of_Information_Gathered: route.params?.reportData?.Date_of_Information_Gathered || formatDate(currentDateTime),
    Date_of_Occurrence: route.params?.reportData?.Date_of_Occurrence || '',
    Local_Authorities_Persons_Contacted_for_Information: route.params?.reportData?.Local_Authorities_Persons_Contacted_for_Information || '',
    Locations_and_Areas_Affected_Barangay: route.params?.reportData?.Locations_and_Areas_Affected_Barangay || '',
    Locations_and_Areas_Affected_City_Municipality: route.params?.reportData?.Locations_and_Areas_Affected_City_Municipality || '',
    Locations_and_Areas_Affected_Province: route.params?.reportData?.Locations_and_Areas_Affected_Province || '',
    Name_of_the_Organizations_Involved: route.params?.reportData?.Name_of_the_Organizations_Involved || '',
    Site_Location_Address_Barangay: route.params?.reportData?.Site_Location_Address_Barangay || '',
    Site_Location_Address_City_Municipality: route.params?.reportData?.Site_Location_Address_City_Municipality || '',
    Site_Location_Address_Province: route.params?.reportData?.Site_Location_Address_Province || '',
    Time_of_Information_Gathered: route.params?.reportData?.Time_of_Information_Gathered || formatTime(currentDateTime),
    Time_of_Occurrence: route.params?.reportData?.Time_of_Occurrence || '',
    Type_of_Disaster: route.params?.reportData?.Type_of_Disaster || '',
    summary: route.params?.reportData?.summary || '',
    // Affected communities
    community: route.params?.reportData?.community || '',
    affected: route.params?.reportData?.affected || '',
    children: route.params?.reportData?.children || '',
    deaths: route.params?.reportData?.deaths || '',
    injured: route.params?.reportData?.injured || '',
    missing: route.params?.reportData?.missing || '',
    pwd: route.params?.reportData?.pwd || '',
    seniors: route.params?.reportData?.seniors || '',
    totalPop: route.params?.reportData?.totalPop || '',
    women: route.params?.reportData?.women || '',
    // Structure status
    residentialHousesStatus: route.params?.reportData?.residentialHousesStatus || '',
    transportationAndMobilityStatus: route.params?.reportData?.transportationAndMobilityStatus || '',
    electricityPowerGridStatus: route.params?.reportData?.electricityPowerGridStatus || '',
    communicationNetworksInternetStatus: route.params?.reportData?.communicationNetworksInternetStatus || '',
    hospitalsRuralHealthUnitsStatus: route.params?.reportData?.hospitalsRuralHealthUnitsStatus || '',
    waterSupplySystemStatus: route.params?.reportData?.waterSupplySystemStatus || '',
    marketBusinessAndCommercialEstablishmentsStatus: route.params?.reportData?.marketBusinessAndCommercialEstablishmentsStatus || '',
    othersStatus: route.params?.reportData?.othersStatus || '',
    // Initial needs
    reliefPacks: route.params?.reportData?.reliefPacks || 'No',
    hotMeals: route.params?.reportData?.hotMeals || 'No',
    hygieneKits: route.params?.reportData?.hygieneKits || 'No',
    drinkingWater: route.params?.reportData?.drinkingWater || 'No',
    ricePacks: route.params?.reportData?.ricePacks || 'No',
    otherNeeds: route.params?.reportData?.otherNeeds || '',
    estQty: route.params?.reportData?.estQty || '',
    // Initial response
    responseGroup: route.params?.reportData?.responseGroup || '',
    reliefDeployed: route.params?.reportData?.reliefDeployed || '',
    familiesServed: route.params?.reportData?.familiesServed || '',
  };
  const [reportData, setReportData] = useState(initialReportData);

  // State for checklist items
  const [checklist, setChecklist] = useState({
    reliefPacks: reportData.reliefPacks === 'Yes',
    hotMeals: reportData.hotMeals === 'Yes',
    hygieneKits: reportData.hygieneKits === 'Yes',
    drinkingWater: reportData.drinkingWater === 'Yes',
    ricePacks: reportData.ricePacks === 'Yes',
  });

  // States for date and time pickers
  const [showDatePicker, setShowDatePicker] = useState({
    Date_of_Information_Gathered: false,
    Date_of_Occurrence: false,
  });
  const [showTimePicker, setShowTimePicker] = useState({
    Time_of_Information_Gathered: false,
    Time_of_Occurrence: false,
  });
  const [tempDate, setTempDate] = useState({
    Date_of_Information_Gathered: isValidDate(initialReportData.Date_of_Information_Gathered)
      ? new Date(initialReportData.Date_of_Information_Gathered)
      : currentDateTime,
    Date_of_Occurrence: isValidDate(initialReportData.Date_of_Occurrence)
      ? new Date(initialReportData.Date_of_Occurrence)
      : new Date(),
    Time_of_Information_Gathered: initialReportData.Time_of_Information_Gathered && /^\d{2}:\d{2}$/.test(initialReportData.Time_of_Information_Gathered)
      ? parseTimeToDate(initialReportData.Time_of_Information_Gathered)
      : currentDateTime,
    Time_of_Occurrence: initialReportData.Time_of_Occurrence && /^\d{2}:\d{2}$/.test(initialReportData.Time_of_Occurrence)
      ? parseTimeToDate(initialReportData.Time_of_Occurrence)
      : new Date(),
  });

  // Predetermined options
  const disasterTypes = [
    { label: 'Select Disaster Type', value: '' },
    { label: 'Earthquake', value: 'Earthquake' },
    { label: 'Typhoon', value: 'Typhoon' },
    { label: 'Flood', value: 'Flood' },
    { label: 'Landslide', value: 'Landslide' },
    { label: 'Fire', value: 'Fire' },
  ];

  // Table data for affected municipalities
  const [affectedMunicipalities, setAffectedMunicipalities] = useState(route.params?.affectedMunicipalities || []);

  // Required fields (excluding municipality fields for Proceed validation)
  const requiredFields = [
    // Profile
    'Date_of_Unformation_Gathered',
    'Date_of_Occurrence',
    'Local_Authorities_Persons_Contacted_for_Information',
    'Locations_and_Areas_Affected_Barangay',
    'Locations_and_Areas_Affected_City_Municipality',
    'Locations_and_Areas_Affected_Province',
    'Name_of_the_Organizations_Involved',
    'Site_Location_Address_Barangay',
    'Site_Location_Address_City_Municipality',
    'Site_Location_Address_Province',
    'Time_of_Information_Gathered',
    'Time_of_Occurrence',
    'Type_of_Disaster',
    // Initial response
    'responseGroup',
    'reliefDeployed',
    'familiesServed',
  ];

  // Municipality fields for validation
  const municipalityFields = [
    'community',
    'totalPop',
    'affected',
    'deaths',
    'injured',
    'missing',
    'children',
    'women',
    'seniors',
    'pwd',
  ];

  // Helper function to capitalize first letter
  const capitalizeFirstLetter = (string) => {
    if (!string) return string;
    return string.charAt(0).toUpperCase() + string.slice(1);
  };

  // Handle TextInput and picker changes
  const handleChange = (field, value) => {
    setReportData((prev) => ({ ...prev, [field]: value }));

    if (value && value.trim() !== '') {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  // Handle date picker changes
  const handleDateChange = (field, event, selectedDate) => {
    setShowDatePicker((prev) => ({ ...prev, [field]: false }));
    if (selectedDate) {
      setTempDate((prev) => ({ ...prev, [field]: selectedDate }));
      const formattedDate = formatDate(selectedDate);
      handleChange(field, formattedDate);
    }
  };

  // Handle time picker changes
  const handleTimeChange = (field, event, selectedTime) => {
    setShowTimePicker((prev) => ({ ...prev, [field]: false }));
    if (selectedTime) {
      setTempDate((prev) => ({ ...prev, [field]: selectedTime }));
      const formattedTime = formatTime(selectedTime);
      handleChange(field, formattedTime);
    }
  };

  // Handle checklist selection for needs
  const handleNeedsSelect = (field) => {
    setChecklist((prev) => {
      const newChecklist = { ...prev, [field]: !prev[field] };
      const value = newChecklist[field] ? 'Yes' : 'No';
      setReportData((prevData) => ({ ...prevData, [field]: value }));
      return newChecklist;
    });
  };

  // Handle delete municipality
  const handleDelete = (index) => {
    setDeleteIndex(index);
    setDeleteModalVisible(true);
  };

  const confirmDelete = () => {
    if (deleteIndex !== null) {
      setAffectedMunicipalities((prev) => prev.filter((_, i) => i !== deleteIndex));
      setDeleteModalVisible(false);
      setDeleteIndex(null);
    }
  };

  const cancelDelete = () => {
    setDeleteModalVisible(false);
    setDeleteIndex(null);
  };

  // Validate municipality inputs
  const validateMunicipalityInputs = () => {
    const {
      community,
      totalPop,
      affected,
      deaths,
      injured,
      missing,
      children,
      women,
      seniors,
      pwd,
    } = reportData;

    const newErrors = {};
    if (community && !community.trim()) newErrors.community = requiredFieldsErrors.community;
    if (totalPop && !totalPop.trim()) newErrors.totalPop = requiredFieldsErrors.totalPop;
    if (affected && !affected.trim()) newErrors.affected = requiredFieldsErrors.affected;
    if (deaths && !deaths.trim()) newErrors.deaths = requiredFieldsErrors.deaths;
    if (injured && !injured.trim()) newErrors.injured = requiredFieldsErrors.injured;
    if (missing && !missing.trim()) newErrors.missing = requiredFieldsErrors.missing;
    if (children && !children.trim()) newErrors.children = requiredFieldsErrors.children;
    if (women && !women.trim()) newErrors.women = requiredFieldsErrors.women;
    if (seniors && !seniors.trim()) newErrors.seniors = requiredFieldsErrors.seniors;
    if (pwd && !pwd.trim()) newErrors.pwd = requiredFieldsErrors.pwd;

    return { isValid: Object.keys(newErrors).length === 0, newErrors };
  };

  // Render label with asterisk for required fields
  const renderLabel = (label, isRequired) => (
    <Text style={GlobalStyles.formTitle}>
      {label}
      {isRequired && <Text style={{ color: 'red' }}>*</Text>}
    </Text>
  );

  const windowHeight = Dimensions.get('window').height;

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
               style={{ flex: 1, marginTop: 80}}
               keyboardVerticalOffset={0}
             >
           <ScrollView
              contentContainerStyle={[styles.scrollViewContent]}
              scrollEnabled={true}
              keyboardShouldPersistTaps="handled"
            >
            <View style={GlobalStyles.form}>
              <View style={GlobalStyles.section}>
                <Text style={styles.sectionTitle}>Profile of the Disaster</Text>
                {renderLabel('Site Location/Address (Barangay)', true)}
                <View ref={(ref) => (inputContainerRefs.Site_Location_Address_Barangay = ref)}>
                  <TextInput
                    style={[GlobalStyles.input, errors.Site_Location_Address_Barangay && styles.requiredInput]}
                    placeholder="Enter Affected Barangay"
                    onChangeText={(val) => handleChange('Site_Location_Address_Barangay', val)}
                    value={reportData.Site_Location_Address_Barangay}
                  />
                </View>
                {errors.Site_Location_Address_Barangay && <Text style={styles.errorText}>{errors.Site_Location_Address_Barangay}</Text>}

                {renderLabel('Site Location/Address (City/Municipality)', true)}
                <View ref={(ref) => (inputContainerRefs.Site_Location_Address_City_Municipality = ref)}>
                  <TextInput
                    style={[GlobalStyles.input, errors.Site_Location_Address_City_Municipality && styles.requiredInput]}
                    placeholder="Enter Affected City/Municipality"
                    onChangeText={(val) => handleChange('Site_Location_Address_City_Municipality', val)}
                    value={reportData.Site_Location_Address_City_Municipality}
                  />
                </View>
                {errors.Site_Location_Address_City_Municipality && <Text style={styles.errorText}>{errors.Site_Location_Address_City_Municipality}</Text>}

                {renderLabel('Site Location/Address (Province)', true)}
                <View ref={(ref) => (inputContainerRefs.Site_Location_Address_Province = ref)}>
                  <TextInput
                    style={[GlobalStyles.input, errors.Site_Location_Address_Province && styles.requiredInput]}
                    placeholder="Enter Affected Province"
                    onChangeText={(val) => handleChange('Site_Location_Address_Province', val)}
                    value={reportData.Site_Location_Address_Province}
                  />
                </View>
                {errors.Site_Location_Address_Province && <Text style={styles.errorText}>{errors.Site_Location_Address_Province}</Text>}

                {renderLabel('Local Authorities/Persons Contacted', true)}
                <View ref={(ref) => (inputContainerRefs.Local_Authorities_Persons_Contacted_for_Information = ref)}>
                  <TextInput
                    style={[GlobalStyles.input, errors.Local_Authorities_Persons_Contacted_for_Information && styles.requiredInput]}
                    placeholder="Enter Names"
                    onChangeText={(val) => handleChange('Local_Authorities_Persons_Contacted_for_Information', val)}
                    value={reportData.Local_Authorities_Persons_Contacted_for_Information}
                  />
                </View>
                {errors.Local_Authorities_Persons_Contacted_for_Information && <Text style={styles.errorText}>{errors.Local_Authorities_Persons_Contacted_for_Information}</Text>}

                {renderLabel('Date of Information Gathered', true)}
                <View ref={(ref) => (inputContainerRefs.Date_of_Information_Gathered = ref)}>
                  <TouchableOpacity
                    style={[GlobalStyles.input, errors.Date_of_Information_Gathered && styles.requiredInput, { flexDirection: 'row', alignItems: 'center' }]}
                    onPress={() => setShowDatePicker((prev) => ({ ...prev, Date_of_Information_Gathered: true }))}
                  >
                    <Text style={{ flex: 1, color: reportData.Date_of_Information_Gathered ? '#000' : '#999' }}>
                      {reportData.Date_of_Information_Gathered || 'YYYY-MM-DD'}
                    </Text>
                    <Ionicons name="calendar" size={24} color="#00BCD4" />
                  </TouchableOpacity>
                  {showDatePicker.Date_of_Information_Gathered && (
                    <DateTimePicker
                      value={tempDate.Date_of_Information_Gathered}
                      mode="date"
                      display="default"
                      onChange={(event, date) => handleDateChange('Date_of_Information_Gathered', event, date)}
                    />
                  )}
                </View>
                {errors.Date_of_Information_Gathered && <Text style={styles.errorText}>{errors.Date_of_Information_Gathered}</Text>}

                {renderLabel('Time of Information Gathered', true)}
                <View ref={(ref) => (inputContainerRefs.Time_of_Information_Gathered = ref)}>
                  <TouchableOpacity
                    style={[GlobalStyles.input, errors.Time_of_Information_Gathered && styles.requiredInput, { flexDirection: 'row', alignItems: 'center' }]}
                    onPress={() => setShowTimePicker((prev) => ({ ...prev, Time_of_Information_Gathered: true }))}
                  >
                    <Text style={{ flex: 1, color: reportData.Time_of_Information_Gathered ? '#000' : '#999' }}>
                      {reportData.Time_of_Information_Gathered || 'HH:MM'}
                    </Text>
                    <Ionicons name="time" size={24} color="#00BCD4" />
                  </TouchableOpacity>
                  {showTimePicker.Time_of_Information_Gathered && (
                    <DateTimePicker
                      value={tempDate.Time_of_Information_Gathered}
                      mode="time"
                      display="default"
                      is24Hour={true}
                      onChange={(event, time) => handleTimeChange('Time_of_Information_Gathered', event, time)}
                    />
                  )}
                </View>
                {errors.Time_of_Information_Gathered && <Text style={styles.errorText}>{errors.Time_of_Information_Gathered}</Text>}

                {renderLabel('Name of Organization Involved', true)}
                <View ref={(ref) => (inputContainerRefs.Name_of_the_Organizations_Involved = ref)}>
                  <TextInput
                    style={[GlobalStyles.input, errors.Name_of_the_Organizations_Involved && styles.requiredInput]}
                    placeholder="Enter Name of Organization"
                    onChangeText={(val) => handleChange('Name_of_the_Organizations_Involved', val)}
                    value={reportData.Name_of_the_Organizations_Involved}
                  />
                </View>
                {errors.Name_of_the_Organizations_Involved && <Text style={styles.errorText}>{errors.Name_of_the_Organizations_Involved}</Text>}
              </View>

              <View style={GlobalStyles.section}>
                <Text style={styles.sectionTitle}>Modality</Text>
                {renderLabel('Locations and Areas Affected (Barangay)', true)}
                <View ref={(ref) => (inputContainerRefs.Locations_and_Areas_Affected_Barangay = ref)}>
                  <TextInput
                    style={[GlobalStyles.input, errors.Locations_and_Areas_Affected_Barangay && styles.requiredInput]}
                    placeholder="Enter Barangay"
                    onChangeText={(val) => handleChange('Locations_and_Areas_Affected_Barangay', val)}
                    value={reportData.Locations_and_Areas_Affected_Barangay}
                  />
                </View>
                {errors.Locations_and_Areas_Affected_Barangay && <Text style={styles.errorText}>{errors.Locations_and_Areas_Affected_Barangay}</Text>}

                {renderLabel('Locations and Areas Affected (City/Municipality)', true)}
                <View ref={(ref) => (inputContainerRefs.Locations_and_Areas_Affected_City_Municipality = ref)}>
                  <TextInput
                    style={[GlobalStyles.input, errors.Locations_and_Areas_Affected_City_Municipality && styles.requiredInput]}
                    placeholder="Enter City/Municipality"
                    onChangeText={(val) => handleChange('Locations_and_Areas_Affected_City_Municipality', val)}
                    value={reportData.Locations_and_Areas_Affected_City_Municipality}
                  />
                </View>
                {errors.Locations_and_Areas_Affected_City_Municipality && <Text style={styles.errorText}>{errors.Locations_and_Areas_Affected_City_Municipality}</Text>}

                {renderLabel('Locations and Areas Affected (Province)', true)}
                <View ref={(ref) => (inputContainerRefs.Locations_and_Areas_Affected_Province = ref)}>
                  <TextInput
                    style={[GlobalStyles.input, errors.Locations_and_Areas_Affected_Province && styles.requiredInput]}
                    placeholder="Enter Province"
                    onChangeText={(val) => handleChange('Locations_and_Areas_Affected_Province', val)}
                    value={reportData.Locations_and_Areas_Affected_Province}
                  />
                </View>
                {errors.Locations_and_Areas_Affected_Province && <Text style={styles.errorText}>{errors.Locations_and_Areas_Affected_Province}</Text>}

                {renderLabel('Type of Disaster', true)}
                <View
                  style={[GlobalStyles.input, styles.pickerContainer, errors.Type_of_Disaster && styles.requiredInput]}
                  ref={(ref) => (inputContainerRefs.Type_of_Disaster = ref)}
                >
                  <Picker
                    selectedValue={reportData.Type_of_Disaster}
                    onValueChange={(value) => handleChange('Type_of_Disaster', value)}
                    style={{
                      fontFamily: 'Poppins_Regular',
                      fontSize: 14,
                      color: reportData.Type_of_Disaster ? Theme.colors.black : '#999',
                      height: 68,
                      width: '100%',
                      textAlign: 'center',
                    }}
                    dropdownIconColor="#00BCD4"
                  >
                    {disasterTypes.map((option) => (
                      <Picker.Item
                        key={option.value}
                        label={option.label}
                        value={option.value}
                        style={{ fontFamily: 'Poppins_Regular', textAlign: 'center', fontSize: 14 }}
                      />
                    ))}
                  </Picker>
                </View>
                {errors.Type_of_Disaster && <Text style={styles.errorText}>{errors.Type_of_Disaster}</Text>}

                {renderLabel('Date of Occurrence', true)}
                <View ref={(ref) => (inputContainerRefs.Date_of_Occurrence = ref)}>
                  <TouchableOpacity
                    style={[GlobalStyles.input, errors.Date_of_Occurrence && styles.requiredInput, { flexDirection: 'row', alignItems: 'center' }]}
                    onPress={() => setShowDatePicker((prev) => ({ ...prev, Date_of_Occurrence: true }))}
                  >
                    <Text style={{ flex: 1, color: reportData.Date_of_Occurrence ? '#000' : '#999' }}>
                      {reportData.Date_of_Occurrence || 'YYYY-MM-DD'}
                    </Text>
                    <Ionicons name="calendar" size={24} color="#00BCD4" />
                  </TouchableOpacity>
                  {showDatePicker.Date_of_Occurrence && (
                    <DateTimePicker
                      value={tempDate.Date_of_Occurrence}
                      mode="date"
                      display="default"
                      onChange={(event, date) => handleDateChange('Date_of_Occurrence', event, date)}
                    />
                  )}
                </View>
                {errors.Date_of_Occurrence && <Text style={styles.errorText}>{errors.Date_of_Occurrence}</Text>}

                {renderLabel('Time of Occurrence', true)}
                <View ref={(ref) => (inputContainerRefs.Time_of_Occurrence = ref)}>
                  <TouchableOpacity
                    style={[GlobalStyles.input, errors.Time_of_Occurrence && styles.requiredInput, { flexDirection: 'row', alignItems: 'center' }]}
                    onPress={() => setShowTimePicker((prev) => ({ ...prev, Time_of_Occurrence: true }))}
                  >
                    <Text style={{ flex: 1, color: reportData.Time_of_Occurrence ? '#000' : '#999' }}>
                      {reportData.Time_of_Occurrence || 'HH:MM'}
                    </Text>
                    <Ionicons name="time" size={24} color="#00BCD4" />
                  </TouchableOpacity>
                  {showTimePicker.Time_of_Occurrence && (
                    <DateTimePicker
                      value={tempDate.Time_of_Occurrence}
                      mode="time"
                      display="default"
                      is24Hour={true}
                      onChange={(event, time) => handleTimeChange('Time_of_Occurrence', event, time)}
                    />
                  )}
                </View>
                {errors.Time_of_Occurrence && <Text style={styles.errorText}>{errors.Time_of_Occurrence}</Text>}

                {renderLabel('Summary of Disaster/Incident', false)}
                <TextInput
                  style={[GlobalStyles.input, { height: 100, textAlignVertical: 'top' }]}
                  placeholder="Enter Summary"
                  multiline
                  numberOfLines={4}
                  onChangeText={(val) => handleChange('summary', val)}
                  value={reportData.summary}
                />
                {errors.summary && <Text style={styles.errorText}>{errors.summary}</Text>}
              </View>

              <View style={GlobalStyles.section}>
                <Text style={styles.sectionTitle}>Initial Effects</Text>
                {affectedMunicipalities.length > 0 && (
                  <ScrollView horizontal showsHorizontalScrollIndicator={true}>
                    <View style={styles.table}>
                      <View style={[styles.tableRow, { minWidth: 1300}]}>
                        <Text style={[styles.tableHeader, { minWidth: 50, borderTopLeftRadius: 10 }]}>#</Text>
                        <Text style={[styles.tableHeader, { minWidth: 250, fontSize: 11 }]}>AFFECTED MUNICIPALITIES/COMMUNITIES</Text>
                        <Text style={[styles.tableHeader, { minWidth: 140 }]}>TOTAL POPULATION</Text>
                        <Text style={[styles.tableHeader, { minWidth: 170 }]}>AFFECTED POPULATION</Text>
                        <Text style={[styles.tableHeader, { minWidth: 80 }]}>DEATHS</Text>
                        <Text style={[styles.tableHeader, { minWidth: 80 }]}>INJURED</Text>
                        <Text style={[styles.tableHeader, { minWidth: 80 }]}>MISSING</Text>
                        <Text style={[styles.tableHeader, { minWidth: 80 }]}>CHILDREN</Text>
                        <Text style={[styles.tableHeader, { minWidth: 80 }]}>WOMEN</Text>
                        <Text style={[styles.tableHeader, { minWidth: 120 }]}>SENIOR CITIZENS</Text>
                        <Text style={[styles.tableHeader, { minWidth: 80 }]}>PWD</Text>
                        <Text style={[styles.tableHeader, { minWidth: 80, borderTopRightRadius: 10 }]}>ACTION</Text>
                      </View>
                      {affectedMunicipalities.map((item, index) => (
                        <View key={index} style={[styles.tableRow, { minWidth: 1300 }]}>
                          <Text style={[styles.tableCell, { minWidth: 50 }]}>{index + 1}</Text>
                          <Text style={[styles.tableCell, { minWidth: 250 }]}>{item.community || 'N/A'}</Text>
                          <Text style={[styles.tableCell, { minWidth: 140 }]}>{item.totalPop || 'N/A'}</Text>
                          <Text style={[styles.tableCell, { minWidth: 170 }]}>{item.affected || 'N/A'}</Text>
                          <Text style={[styles.tableCell, { minWidth: 80 }]}>{item.deaths || 'N/A'}</Text>
                          <Text style={[styles.tableCell, { minWidth: 80 }]}>{item.injured || 'N/A'}</Text>
                          <Text style={[styles.tableCell, { minWidth: 80 }]}>{item.missing || 'N/A'}</Text>
                          <Text style={[styles.tableCell, { minWidth: 80 }]}>{item.children || 'N/A'}</Text>
                          <Text style={[styles.tableCell, { minWidth: 80 }]}>{item.women || 'N/A'}</Text>
                          <Text style={[styles.tableCell, { minWidth: 120 }]}>{item.seniors || 'N/A'}</Text>
                          <Text style={[styles.tableCell, { minWidth: 80 }]}>{item.pwd || 'N/A'}</Text>
                          <TouchableOpacity
                            style={[styles.tableCell, { minWidth: 80, alignItems: 'center' }]}
                            onPress={() => handleDelete(index)}
                          >
                            <Ionicons name="trash" size={20} color="red" />
                          </TouchableOpacity>
                        </View>
                      ))}
                    </View>
                  </ScrollView>
                )}

                {renderLabel('Affected Municipalities/Communities', true)}
                <View ref={(ref) => (inputContainerRefs.community = ref)}>
                  <TextInput
                    style={[GlobalStyles.input, errors.community && styles.requiredInput]}
                    placeholder="Enter Municipalities/Communities"
                    onChangeText={(val) => handleChange('community', val)}
                    value={reportData.community}
                  />
                </View>
                {errors.community && <Text style={styles.errorText}>{errors.community}</Text>}

                {renderLabel('Total Population', true)}
                <View ref={(ref) => (inputContainerRefs.totalPop = ref)}>
                  <TextInput
                    style={[GlobalStyles.input, errors.totalPop && styles.requiredInput]}
                    placeholder="Enter Total Population"
                    onChangeText={(val) => handleChange('totalPop', val)}
                    value={reportData.totalPop}
                    keyboardType="numeric"
                  />
                </View>
                {errors.totalPop && <Text style={styles.errorText}>{errors.totalPop}</Text>}

                {renderLabel('Affected Population', true)}
                <View ref={(ref) => (inputContainerRefs.affected = ref)}>
                  <TextInput
                    style={[GlobalStyles.input, errors.affected && styles.requiredInput]}
                    placeholder="Enter Affected Population"
                    onChangeText={(val) => handleChange('affected', val)}
                    value={reportData.affected}
                    keyboardType="numeric"
                  />
                </View>
                {errors.affected && <Text style={styles.errorText}>{errors.affected}</Text>}

                {renderLabel('Deaths', true)}
                <View ref={(ref) => (inputContainerRefs.deaths = ref)}>
                  <TextInput
                    style={[GlobalStyles.input, errors.deaths && styles.requiredInput]}
                    placeholder="Enter Number of Deaths"
                    onChangeText={(val) => handleChange('deaths', val)}
                    value={reportData.deaths}
                    keyboardType="numeric"
                  />
                </View>
                {errors.deaths && <Text style={styles.errorText}>{errors.deaths}</Text>}

                {renderLabel('Injured', true)}
                <View ref={(ref) => (inputContainerRefs.injured = ref)}>
                  <TextInput
                    style={[GlobalStyles.input, errors.injured && styles.requiredInput]}
                    placeholder="Enter Number of Injured"
                    onChangeText={(val) => handleChange('injured', val)}
                    value={reportData.injured}
                    keyboardType="numeric"
                  />
                </View>
                {errors.injured && <Text style={styles.errorText}>{errors.injured}</Text>}

                {renderLabel('Missing', true)}
                <View ref={(ref) => (inputContainerRefs.missing = ref)}>
                  <TextInput
                    style={[GlobalStyles.input, errors.missing && styles.requiredInput]}
                    placeholder="Enter Number of Missing"
                    onChangeText={(val) => handleChange('missing', val)}
                    value={reportData.missing}
                    keyboardType="numeric"
                  />
                </View>
                {errors.missing && <Text style={styles.errorText}>{errors.missing}</Text>}

                {renderLabel('Children', true)}
                <View ref={(ref) => (inputContainerRefs.children = ref)}>
                  <TextInput
                    style={[GlobalStyles.input, errors.children && styles.requiredInput]}
                    placeholder="Enter Number of Children"
                    onChangeText={(val) => handleChange('children', val)}
                    value={reportData.children}
                    keyboardType="numeric"
                  />
                </View>
                {errors.children && <Text style={styles.errorText}>{errors.children}</Text>}

                {renderLabel('Women', true)}
                <View ref={(ref) => (inputContainerRefs.women = ref)}>
                  <TextInput
                    style={[GlobalStyles.input, errors.women && styles.requiredInput]}
                    placeholder="Enter Number of Women"
                    onChangeText={(val) => handleChange('women', val)}
                    value={reportData.women}
                    keyboardType="numeric"
                  />
                </View>
                {errors.women && <Text style={styles.errorText}>{errors.women}</Text>}

                {renderLabel('Senior Citizens', true)}
                <View ref={(ref) => (inputContainerRefs.seniors = ref)}>
                  <TextInput
                    style={[GlobalStyles.input, errors.seniors && styles.requiredInput]}
                    placeholder="Enter Number of Senior Citizens"
                    onChangeText={(val) => handleChange('seniors', val)}
                    value={reportData.seniors}
                    keyboardType="numeric"
                  />
                </View>
                {errors.seniors && <Text style={styles.errorText}>{errors.seniors}</Text>}

                {renderLabel('PWD', true)}
                <View ref={(ref) => (inputContainerRefs.pwd = ref)}>
                  <TextInput
                    style={[GlobalStyles.input, errors.pwd && styles.requiredInput]}
                    placeholder="Enter Number of PWD"
                    onChangeText={(val) => handleChange('pwd', val)}
                    value={reportData.pwd}
                    keyboardType="numeric"
                  />
                </View>
                {errors.pwd && <Text style={styles.errorText}>{errors.pwd}</Text>}

                  <View style={GlobalStyles.supplementaryButtonContainer}>
                  <TouchableOpacity style={GlobalStyles.supplementaryButton} onPress={() => {
                    const {
                      community,
                      totalPop,
                      affected,
                      deaths,
                      injured,
                      missing,
                      children,
                      women,
                      seniors,
                      pwd,
                    } = reportData;

                    const isMissingRequiredField =
                      !community ||
                      !totalPop ||
                      !affected ||
                      !deaths ||
                      !injured ||
                      !missing ||
                      !children ||
                      !women ||
                      !seniors ||
                      !pwd;

                    if (isMissingRequiredField) {
                      const newErrors = {};
                      if (!community) newErrors.community = requiredFieldsErrors.community;
                      if (!totalPop) newErrors.totalPop = requiredFieldsErrors.totalPop;
                      if (!affected) newErrors.affected = requiredFieldsErrors.affected;
                      if (!deaths) newErrors.deaths = requiredFieldsErrors.deaths;
                      if (!injured) newErrors.injured = requiredFieldsErrors.injured;
                      if (!missing) newErrors.missing = requiredFieldsErrors.missing;
                      if (!children) newErrors.children = requiredFieldsErrors.children;
                      if (!women) newErrors.women = requiredFieldsErrors.women;
                      if (!seniors) newErrors.seniors = requiredFieldsErrors.seniors;
                      if (!pwd) newErrors.pwd = requiredFieldsErrors.pwd;

                      setErrors(newErrors);
                        ToastAndroid.show('Please fill out all required fields before adding.',ToastAndroid.BOTTOM);
                      return;
                    }

                    const newMunicipality = {
                      community,
                      totalPop,
                      affected,
                      deaths,
                      injured,
                      missing,
                      children,
                      women,
                      seniors,
                      pwd,
                    };

                    setAffectedMunicipalities((prev) => [...prev, newMunicipality]);
                    Alert.alert(
                      'Municipality Saved',
                      `Saved:\nAffected Community: ${community}\nTotal Population: ${totalPop}\nAffected Population: ${affected}\nDeaths: ${deaths}\nInjured: ${injured}\nMissing: ${missing}\nChildren: ${children}\nWomen: ${women}\nSenior Citizens: ${seniors}\nPWD: ${pwd}`
                    );
                    setReportData((prev) => ({
                      ...prev,
                      community: '',
                      totalPop: '',
                      affected: '',
                      deaths: '',
                      injured: '',
                      missing: '',
                      children: '',
                      women: '',
                      seniors: '',
                      pwd: '',
                    }));
                    setErrors((prev) => {
                      const newErrors = { ...prev };
                      municipalityFields.forEach((field) => delete newErrors[field]);
                      return newErrors;
                    });
                  }}>
                    <Text style={GlobalStyles.supplementaryButtonText}>Add Row</Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={GlobalStyles.section}>
                <Text style={styles.sectionTitle}>
                  Status of Lifelines, Social Structure, and Critical Facilities (optional)
                </Text>
                {[
                  'Residential Houses',
                  'Transportation and Mobility',
                  'Electricity, Power Grid',
                  'Communication Networks, Internet',
                  'Hospitals, Rural Health Units',
                  'Water Supply System',
                  'Market, Business, and Commercial Establishments',
                ].map((item) => {
                  const field = `${item
                    .toLowerCase()
                    .replace(/[^a-z0-9]/g, '')}Status`;
                  const currentItemOptions = LIFELINE_STATUS_OPTIONS[item] || [];

                  return (
                    <View key={item}>
                      {renderLabel(item, false)}
                      <View
                        style={[GlobalStyles.input, styles.pickerContainer]}
                        ref={(ref) => (inputContainerRefs[field] = ref)}
                      >
                        <Picker
                          selectedValue={reportData[field]}
                          onValueChange={(value) => handleChange(field, value)}
                          style={{
                            fontFamily: 'Poppins_Regular',
                            fontSize: 14,
                            color: reportData[field] ? Theme.colors.black : '#999',
                            height: 68,
                            width: '100%',
                            textAlign: 'center',
                          }}
                          dropdownIconColor="#00BCD4"
                        >
                          {currentItemOptions.map((option) => (
                            <Picker.Item
                              key={option.value}
                              label={option.label}
                              value={option.value}
                              style={{ fontFamily: 'Poppins_Regular', textAlign: 'center', fontSize: 14 }}
                            />
                          ))}
                        </Picker>
                      </View>
                      {errors[field] && <Text style={styles.errorText}>{errors[field]}</Text>}
                    </View>
                  );
                })}
                {renderLabel('Others', false)}
                <TextInput
                  style={[GlobalStyles.input]}
                  placeholder="Input Here (Optional)"
                  onChangeText={(val) => handleChange('othersStatus', val)}
                  value={reportData.othersStatus}
                />
                {errors.othersStatus && <Text style={styles.errorText}>{errors.othersStatus}</Text>}
              </View>

              <View style={GlobalStyles.section}>
                <Text style={styles.sectionTitle}>Initial Needs Assessment Checklist (Optional)</Text>
                {[
                  { label: 'Relief Packs', field: 'reliefPacks' },
                  { label: 'Hot Meals', field: 'hotMeals' },
                  { label: 'Hygiene Kits', field: 'hygieneKits' },
                  { label: 'Drinking Water', field: 'drinkingWater' },
                  { label: 'Rice Packs', field: 'ricePacks' },
                ].map(({ label, field }) => (
                  <TouchableOpacity
                    key={field}
                    onPress={() => handleNeedsSelect(field)}
                    style={styles.checkboxContainer}
                  >
                    <View style={styles.checkboxBox}>
                      {checklist[field] && <Ionicons name="checkmark" style={styles.checkmark} />}
                    </View>
                    <Text style={styles.checkboxLabel}>{label}</Text>
                  </TouchableOpacity>
                ))}
                {renderLabel('Other Immediate Needs', false)}
                <TextInput
                  style={[GlobalStyles.input]}
                  placeholder="Enter Items"
                  onChangeText={(val) => handleChange('otherNeeds', val)}
                  value={reportData.otherNeeds}
                />
                {errors.otherNeeds && <Text style={styles.errorText}>{errors.otherNeeds}</Text>}
                {renderLabel('Estimated Quantity', false)}
                <TextInput
                  style={[GlobalStyles.input]}
                  placeholder="Estimated No. of Families to Benefit"
                  onChangeText={(val) => handleChange('estQty', val)}
                  value={reportData.estQty}
                  keyboardType="numeric"
                />
                {errors.estQty && <Text style={styles.errorText}>{errors.estQty}</Text>}
              </View>

              <View style={GlobalStyles.section}>
                <Text style={styles.sectionTitle}>Initial Response Actions</Text>
                {renderLabel('Response Groups Involved', true)}
                <View ref={(ref) => (inputContainerRefs.responseGroup = ref)}>
                  <TextInput
                    style={[GlobalStyles.input, errors.responseGroup && styles.requiredInput]}
                    placeholder="Enter Organization's Name"
                    onChangeText={(val) => handleChange('responseGroup', val)}
                    value={reportData.responseGroup}
                  />
                </View>
                {errors.responseGroup && <Text style={styles.errorText}>{errors.responseGroup}</Text>}

                {renderLabel('Relief Assistance Deployed', true)}
                <View ref={(ref) => (inputContainerRefs.reliefDeployed = ref)}>
                  <TextInput
                    style={[GlobalStyles.input, errors.reliefDeployed && styles.requiredInput]}
                    placeholder="Enter Relief Assistance"
                    onChangeText={(val) => handleChange('reliefDeployed', val)}
                    value={reportData.reliefDeployed}
                  />
                </View>
                {errors.reliefDeployed && <Text style={styles.errorText}>{errors.reliefDeployed}</Text>}

                {renderLabel('Number of Families Served', true)}
                <View ref={(ref) => (inputContainerRefs.familiesServed = ref)}>
                  <TextInput
                    style={[GlobalStyles.input, errors.familiesServed && styles.requiredInput]}
                    placeholder="Enter Number of Families"
                    onChangeText={(val) => handleChange('familiesServed', val)}
                    value={reportData.familiesServed}
                    keyboardType="numeric"
                  />
                </View>
                {errors.familiesServed && <Text style={styles.errorText}>{errors.familiesServed}</Text>}
              </View>

              <View style={{marginHorizontal: 15}}>
              <TouchableOpacity
                style={GlobalStyles.button}
                onPress={() => {
                  const newErrors = {};
                  requiredFields.forEach((field) => {
                    const value = reportData[field];
                    if (value === null || (typeof value === 'string' && value.trim() === '')) {
                      newErrors[field] = requiredFieldsErrors[field];
                    }
                  });

                  if (affectedMunicipalities.length === 0) {
                    const { isValid, newErrors: municipalityErrors } = validateMunicipalityInputs();
                    if (!isValid) {
                      setErrors({ ...newErrors, ...municipalityErrors });
                          ToastAndroid.show('Please add at least one municipality with all required fields.',ToastAndroid.BOTTOM);

                      return;
                    }
                  }

                  if (Object.keys(newErrors).length > 0) {
                    setErrors(newErrors);
                        ToastAndroid.show(`Please fill in required fields:\n${Object.values(newErrors).join('\n')}`,ToastAndroid.BOTTOM);
                    return;
                  }

                  let updatedMunicipalities = [...affectedMunicipalities];
                  const { isValid, newErrors: municipalityErrors } = validateMunicipalityInputs();
                  if (isValid && reportData.community.trim()) {
                    const newMunicipality = {
                      community: reportData.community,
                      totalPop: reportData.totalPop,
                      affected: reportData.affected,
                      deaths: reportData.deaths,
                      injured: reportData.injured,
                      missing: reportData.missing,
                      children: reportData.children,
                      women: reportData.women,
                      seniors: reportData.seniors,
                      pwd: reportData.pwd,
                    };
                    updatedMunicipalities = [...affectedMunicipalities, newMunicipality];
                    setAffectedMunicipalities(updatedMunicipalities);
                    setReportData((prev) => ({
                      ...prev,
                      community: '',
                      totalPop: '',
                      affected: '',
                      deaths: '',
                      injured: '',
                      missing: '',
                      children: '',
                      women: '',
                      seniors: '',
                      pwd: '',
                    }));
                  } else if (Object.keys(municipalityErrors).length > 0 && reportData.community.trim()) {
                    setErrors({ ...newErrors, ...municipalityErrors });
                  ToastAndroid.show(`Please complete all municipality fields:\n${Object.values(municipalityErrors).join('\n')}`,ToastAndroid.BOTTOM);
                    return;
                  }

                  console.log('Navigating to RDANASummary with reportData:', reportData);
                  console.log('Lifeline Status Fields:', {
                    residentialHousesStatus: reportData.residentialHousesStatus,
                    transportationAndMobilityStatus: reportData.transportationAndMobilityStatus,
                    electricityPowerGridStatus: reportData.electricityPowerGridStatus,
                    communicationNetworksInternetStatus: reportData.communicationNetworksInternetStatus,
                    hospitalsRuralHealthUnitsStatus: reportData.hospitalsRuralHealthUnitsStatus,
                    waterSupplySystemStatus: reportData.waterSupplySystemStatus,
                    marketBusinessAndCommercialEstablishmentsStatus: reportData.marketBusinessAndCommercialEstablishmentsStatus,
                  });
                  console.log('Affected Municipalities:', updatedMunicipalities);

                  const completeReportData = { ...reportData };
                  console.log('Navigating to RDANASummary with reportData:', reportData);
                  navigation.navigate('RDANASummary', { reportData: completeReportData, affectedMunicipalities: updatedMunicipalities });
                }}
              >
                <Text style={GlobalStyles.buttonText}>Proceed</Text>
              </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
          </KeyboardAvoidingView>

      <CustomModal
        visible={deleteModalVisible}
        title="Confirm Delete"
        message="Are you sure you want to delete this municipality?"
        onConfirm={confirmDelete}
        onCancel={cancelDelete}
        confirmText="Delete"
        cancelText="Cancel"
        showCancel={true}
      />
    </SafeAreaView>
  );
};

export default RDANAScreen;