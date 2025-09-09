import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useNavigation, useRoute } from '@react-navigation/native';
import { auth, database } from '../configuration/firebaseConfig';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ref as databaseRef, get, query, orderByChild, equalTo } from 'firebase/database';
import React, { useRef, useState, useEffect } from 'react';
import {
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  StatusBar,
  Text,
  TextInput,
  ToastAndroid,
  TouchableOpacity,
  View,
  Modal,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { ScrollView } from 'react-native-gesture-handler';
import GlobalStyles from '../styles/GlobalStyles';
import styles from '../styles/RDANAStyles';
import Theme from '../constants/theme';
import OperationCustomModal from '../components/OperationCustomModal';
import useOperationCheck from '../components/useOperationCheck';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext'; 


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

const RDANAScreen = ({navigation}) => {
    const { user } = useAuth(); 
  const route = useRoute();
  const [errors, setErrors] = useState({});
  const inputContainerRefs = useRef({}).current;
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [deleteIndex, setDeleteIndex] = useState(null);
  const [requiredFieldsModalVisible, setRequiredFieldsModalVisible] = useState(false);
  const { canSubmit, organizationName, modalVisible, setModalVisible, modalConfig, setModalConfig } = useOperationCheck();
  const insets = useSafeAreaInsets();

  const requiredFieldsErrors = {
    Date_of_Information_Gathered: 'Please provide the date when information was gathered (within 24-48 hours of occurrence).',
    Date_of_Occurrence: 'Please specify the date of the disaster occurrence.',
    Local_Authorities_Persons_Contacted_for_Information: 'Please list the local authorities or persons contacted.',
    Locations_and_Areas_Affected_Barangay: 'Please enter the affected barangay.',
    Locations_and_Areas_Affected_City_Municipality: 'Please enter the affected city or municipality.',
    Locations_and_Areas_Affected_Province: 'Please enter the affected province.',
    Name_of_the_Organizations_Involved: 'Please provide the name of the organization involved.',
    Site_Location_Address_Barangay: 'Please enter the site location barangay.',
    Site_Location_Address_City_Municipality: 'Please enter the site location city or municipality.',
    Site_Location_Address_Province: 'Please enter the site location province.',
    Time_of_Information_Gathered: 'Please provide the time when information was gathered (within 24-48 hours of occurrence).',
    Time_of_Occurrence: 'Please specify the time of the disaster occurrence.',
    Type_of_Disaster: 'Please select the type of disaster.',
    community: 'Please add at least one municipality.',
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

  const formatDate = (date) => {
    if (!date || isNaN(date.getTime())) return '';
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}-${month}-${year}`; 
  };

  const formatTime = (date) => {
    if (!date || isNaN(date.getTime())) return '';
    let hours = date.getHours();
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12 || 12; 
    return `${hours}:${minutes} ${ampm}`;
  };

  const parseDate = (dateStr) => {
    if (!dateStr || !/^\d{2}-\d{2}-\d{4}$/.test(dateStr)) return null;
    const [day, month, year] = dateStr.split('-').map(Number);
    return new Date(year, month - 1, day);
  };

  const parseTimeToDate = (timeStr) => {
    if (!timeStr || !/^\d{1,2}:\d{2}\s?(AM|PM)$/i.test(timeStr)) return null;
    const [time, ampm] = timeStr.split(' ');
    const [hours, minutes] = time.split(':').map(Number);
    let adjustedHours = hours;
    if (ampm.toUpperCase() === 'PM' && hours < 12) adjustedHours += 12;
    if (ampm.toUpperCase() === 'AM' && hours === 12) adjustedHours = 0;
    const date = new Date();
    date.setHours(adjustedHours, minutes, 0, 0);
    return date;
  };

  const isWithin24To48Hours = (gatheredDate, gatheredTime, occurrenceDate, occurrenceTime) => {
    if (!gatheredDate || !gatheredTime || !occurrenceDate || !occurrenceTime) return false;
    const gatheredDateTime = new Date(gatheredDate);
    gatheredDateTime.setHours(gatheredTime.getHours(), gatheredTime.getMinutes(), 0, 0);
    const occurrenceDateTime = new Date(occurrenceDate);
    occurrenceDateTime.setHours(occurrenceTime.getHours(), occurrenceTime.getMinutes(), 0, 0);
    const diffMs = gatheredDateTime - occurrenceDateTime;
    if (diffMs < 0) return false; 
    const diffHours = diffMs / (1000 * 60 * 60);
    return diffHours >= 24 && diffHours <= 48; 
  };

  const initialReportData = {
    Date_of_Information_Gathered: route.params?.reportData?.Date_of_Information_Gathered || '',
    Date_of_Occurrence: route.params?.reportData?.Date_of_Occurrence || '',
    Local_Authorities_Persons_Contacted_for_Information: route.params?.reportData?.Local_Authorities_Persons_Contacted_for_Information || '',
    Locations_and_Areas_Affected_Barangay: route.params?.reportData?.Locations_and_Areas_Affected_Barangay || '',
    Locations_and_Areas_Affected_City_Municipality: route.params?.reportData?.Locations_and_Areas_Affected_City_Municipality || '',
    Locations_and_Areas_Affected_Province: route.params?.reportData?.Locations_and_Areas_Affected_Province || '',
    Name_of_the_Organizations_Involved: route.params?.reportData?.Name_of_the_Organizations_Involved || '',
    Site_Location_Address_Barangay: route.params?.reportData?.Site_Location_Address_Barangay || '',
    Site_Location_Address_City_Municipality: route.params?.reportData?.Site_Location_Address_City_Municipality || '',
    Site_Location_Address_Province: route.params?.reportData?.Site_Location_Address_Province || '',
    Time_of_Information_Gathered: route.params?.reportData?.Time_of_Information_Gathered || '',
    Time_of_Occurrence: route.params?.reportData?.Time_of_Occurrence || '',
    Type_of_Disaster: route.params?.reportData?.Type_of_Disaster || '',
    summary: route.params?.reportData?.summary || '',
    community: '',
    affected: '',
    children: '',
    deaths: '',
    injured: '',
    missing: '',
    pwd: '',
    seniors: '',
    totalPop: '',
    women: '',
    residentialhousesStatus: route.params?.reportData?.residentialhousesStatus || '',
    transportationandmobilityStatus: route.params?.reportData?.transportationandmobilityStatus || '',
    electricitypowergridStatus: route.params?.reportData?.electricitypowergridStatus || '',
    communicationnetworksinternetStatus: route.params?.reportData?.communicationnetworksinternetStatus || '',
    hospitalsruralhealthunitsStatus: route.params?.reportData?.hospitalsruralhealthunitsStatus || '',
    watersupplysystemStatus: route.params?.reportData?.watersupplysystemStatus || '',
    marketbusinessandcommercialestablishmentsStatus: route.params?.reportData?.marketbusinessandcommercialestablishmentsStatus || '',
    othersStatus: route.params?.reportData?.othersStatus || '',
    reliefPacks: route.params?.reportData?.reliefPacks || 'No',
    hotMeals: route.params?.reportData?.hotMeals || 'No',
    hygieneKits: route.params?.reportData?.hygieneKits || 'No',
    drinkingWater: route.params?.reportData?.drinkingWater || 'No',
    ricePacks: route.params?.reportData?.ricePacks || 'No',
    otherNeeds: route.params?.reportData?.otherNeeds || '',
    estQty: route.params?.reportData?.estQty || '',
    responseGroup: route.params?.reportData?.responseGroup || '',
    reliefDeployed: route.params?.reportData?.reliefDeployed || '',
    familiesServed: route.params?.reportData?.familiesServed || '',
  };
  const [reportData, setReportData] = useState(initialReportData);

  const [checklist, setChecklist] = useState({
    reliefPacks: reportData.reliefPacks === 'Yes',
    hotMeals: reportData.hotMeals === 'Yes',
    hygieneKits: reportData.hygieneKits === 'Yes',
    drinkingWater: reportData.drinkingWater === 'Yes',
    ricePacks: reportData.ricePacks === 'Yes',
  });

  const [showDatePicker, setShowDatePicker] = useState({
    Date_of_Information_Gathered: false,
    Date_of_Occurrence: false,
  });
  const [showTimePicker, setShowTimePicker] = useState({
    Time_of_Information_Gathered: false,
    Time_of_Occurrence: false,
  });
  const [tempDate, setTempDate] = useState({
    Date_of_Information_Gathered: route.params?.reportData?.Date_of_Information_Gathered ? parseDate(route.params.reportData.Date_of_Information_Gathered) : null,
    Date_of_Occurrence: route.params?.reportData?.Date_of_Occurrence ? parseDate(route.params.reportData.Date_of_Occurrence) : null,
    Time_of_Information_Gathered: route.params?.reportData?.Time_of_Information_Gathered ? parseTimeToDate(route.params.reportData.Time_of_Information_Gathered) : null,
    Time_of_Occurrence: route.params?.reportData?.Time_of_Occurrence ? parseTimeToDate(route.params.reportData.Time_of_Occurrence) : null,
  });

  const disasterTypes = [
    { label: 'Type of Disaster', value: '' },
    { label: 'Earthquake', value: 'Earthquake' },
    { label: 'Typhoon', value: 'Typhoon' },
    { label: 'Flood', value: 'Flood' },
    { label: 'Landslide', value: 'Landslide' },
    { label: 'Fire', value: 'Fire' },
  ];

  const [affectedMunicipalities, setAffectedMunicipalities] = useState(route.params?.affectedMunicipalities || []);

  const requiredFields = [
    'Date_of_Information_Gathered',
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
    'responseGroup',
    'reliefDeployed',
    'familiesServed',
  ];

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

  const sanitizeInput = (value, field) => {
    let sanitized = value;
    if (field.includes('Barangay') || field.includes('community')) {
      sanitized = sanitized.replace(/[^a-zA-Z0-9\sñÑ,-]/g, '');
    } else if (
      field.includes('Name') ||
      field.includes('Organization') ||
      field.includes('City') ||
      field.includes('Municipality') ||
      field.includes('Province') ||
      field.includes('Relief') ||
      field.includes('responseGroup') ||
      field === 'otherNeeds'
    ) {
      sanitized = sanitized.replace(/[^a-zA-Z\sñÑ,-]/g, '');
    }
    return sanitized.charAt(0).toUpperCase() + sanitized.slice(1);
  };

  const handleChange = (field, value) => {
    if (!canSubmit) {
      setModalConfig({
        title: 'Permission Error',
        message: 'You do not have permission to submit reports.',
        onConfirm: () => setModalVisible(false),
        confirmText: 'OK',
      });
      setModalVisible(true);
      return;
    }

    let sanitizedValue = value;
    if (typeof value === 'string' && field !== 'Type_of_Disaster' && !field.includes('Date') && !field.includes('Time') && !field.includes('Status')) {
      sanitizedValue = sanitizeInput(value, field);
    }
    if (['totalPop', 'affected', 'deaths', 'injured', 'missing', 'children', 'women', 'seniors', 'pwd', 'estQty', 'familiesServed'].includes(field)) {
      sanitizedValue = value.replace(/[^0-9]/g, '');
      if (sanitizedValue && parseInt(sanitizedValue) < 0) sanitizedValue = '';
    }
    setReportData((prev) => ({ ...prev, [field]: sanitizedValue }));

    if (sanitizedValue && sanitizedValue.trim() !== '') {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const handleDateChange = (field, event, selectedDate) => {
    if (!canSubmit) {
      setModalConfig({
        title: 'Permission Error',
        message: 'You do not have permission to submit reports.',
        onConfirm: () => setModalVisible(false),
        confirmText: 'OK',
      });
      setModalVisible(true);
      return;
    }

    setShowDatePicker((prev) => ({ ...prev, [field]: false }));
    if (selectedDate) {
      setTempDate((prev) => ({ ...prev, [field]: selectedDate }));
      const formattedDate = formatDate(selectedDate);
      handleChange(field, formattedDate);
    }
  };

  const handleTimeChange = (field, event, selectedTime) => {
    if (!canSubmit) {
      setModalConfig({
        title: 'Permission Error',
        message: 'You do not have permission to submit reports.',
        onConfirm: () => setModalVisible(false),
        confirmText: 'OK',
      });
      setModalVisible(true);
      return;
    }

    setShowTimePicker((prev) => ({ ...prev, [field]: false }));
    if (selectedTime) {
      setTempDate((prev) => ({ ...prev, [field]: selectedTime }));
      const formattedTime = formatTime(selectedTime);
      handleChange(field, formattedTime);
    }
  };

  const handleNeedsSelect = (field) => {
    if (!canSubmit) {
      setModalConfig({
        title: 'Permission Error',
        message: 'You do not have permission to submit reports.',
        onConfirm: () => setModalVisible(false),
        confirmText: 'OK',
      });
      setModalVisible(true);
      return;
    }

    setChecklist((prev) => {
      const newChecklist = { ...prev, [field]: !prev[field] };
      const value = newChecklist[field] ? 'Yes' : 'No';
      setReportData((prevData) => ({ ...prevData, [field]: value }));
      return newChecklist;
    });
  };

  const handleDelete = (index) => {
    if (!canSubmit) {
      setModalConfig({
        title: 'Permission Error',
        message: 'You do not have permission to submit reports.',
        onConfirm: () => setModalVisible(false),
        confirmText: 'OK',
      });
      setModalVisible(true);
      return;
    }

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
    if (!community || !community.trim()) newErrors.community = requiredFieldsErrors.community;
    if (!totalPop || !totalPop.trim()) newErrors.totalPop = requiredFieldsErrors.totalPop;
    if (!affected || !affected.trim()) newErrors.affected = requiredFieldsErrors.affected;
    if (!deaths || !deaths.trim()) newErrors.deaths = requiredFieldsErrors.deaths;
    if (!injured || !injured.trim()) newErrors.injured = requiredFieldsErrors.injured;
    if (!missing || !missing.trim()) newErrors.missing = requiredFieldsErrors.missing;
    if (!children || !children.trim()) newErrors.children = requiredFieldsErrors.children;
    if (!women || !women.trim()) newErrors.women = requiredFieldsErrors.women;
    if (!seniors || !seniors.trim()) newErrors.seniors = requiredFieldsErrors.seniors;
    if (!pwd || !pwd.trim()) newErrors.pwd = requiredFieldsErrors.pwd;

    return { isValid: Object.keys(newErrors).length === 0, newErrors };
  };

  const renderLabel = (label, isRequired) => (
    <Text style={GlobalStyles.formTitle}>
      {label}
      {isRequired && <Text style={{ color: 'red' }}>*</Text>}
    </Text>
  );

  const windowHeight = Dimensions.get('window').height;

  return (
    <SafeAreaView style={[GlobalStyles.container]}>
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
          contentContainerStyle={[GlobalStyles.scrollViewContent]}
          scrollEnabled={true}
          keyboardShouldPersistTaps="handled"
        >
          <View style={GlobalStyles.form}>
            <View style={GlobalStyles.section}>
              <Text style={styles.sectionTitle}>Profile of the Disaster</Text>
              {renderLabel('Site Location/Address (Barangay)', true)}
              <View ref={(ref) => (inputContainerRefs.Site_Location_Address_Barangay = ref)}>
                <TextInput
                  style={[GlobalStyles.input, errors.Site_Location_Address_Barangay && GlobalStyles.inputError]}
                  placeholder="Enter Affected Barangay"
                  placeholderTextColor={Theme.colors.placeholderColor}
                  onChangeText={(val) => handleChange('Site_Location_Address_Barangay', val)}
                  value={reportData.Site_Location_Address_Barangay}
                  editable={canSubmit}
                />
              </View>
              {errors.Site_Location_Address_Barangay && <Text style={GlobalStyles.errorText}>{errors.Site_Location_Address_Barangay}</Text>}

              {renderLabel('Site Location/Address (City/Municipality)', true)}
              <View ref={(ref) => (inputContainerRefs.Site_Location_Address_City_Municipality = ref)}>
                <TextInput
                  style={[GlobalStyles.input, errors.Site_Location_Address_City_Municipality && GlobalStyles.inputError]}
                  placeholder="Enter Affected City/Municipality"
                  placeholderTextColor={Theme.colors.placeholderColor}
                  onChangeText={(val) => handleChange('Site_Location_Address_City_Municipality', val)}
                  value={reportData.Site_Location_Address_City_Municipality}
                  editable={canSubmit}
                />
              </View>
              {errors.Site_Location_Address_City_Municipality && <Text style={GlobalStyles.errorText}>{errors.Site_Location_Address_City_Municipality}</Text>}

              {renderLabel('Site Location/Address (Province)', true)}
              <View ref={(ref) => (inputContainerRefs.Site_Location_Address_Province = ref)}>
                <TextInput
                  style={[GlobalStyles.input, errors.Site_Location_Address_Province && GlobalStyles.inputError]}
                  placeholder="Enter Affected Province"
                  placeholderTextColor={Theme.colors.placeholderColor}
                  onChangeText={(val) => handleChange('Site_Location_Address_Province', val)}
                  value={reportData.Site_Location_Address_Province}
                  editable={canSubmit}
                />
              </View>
              {errors.Site_Location_Address_Province && <Text style={GlobalStyles.errorText}>{errors.Site_Location_Address_Province}</Text>}

              {renderLabel('Local Authorities/ Persons Contacted for Information', true)}
              <View ref={(ref) => (inputContainerRefs.Local_Authorities_Persons_Contacted_for_Information = ref)}>
                <TextInput
                  style={[GlobalStyles.input, errors.Local_Authorities_Persons_Contacted_for_Information && GlobalStyles.inputError]}
                  placeholder="Enter Name"
                  placeholderTextColor={Theme.colors.placeholderColor}
                  onChangeText={(val) => handleChange('Local_Authorities_Persons_Contacted_for_Information', val)}
                  value={reportData.Local_Authorities_Persons_Contacted_for_Information}
                  editable={canSubmit}
                />
              </View>
              {errors.Local_Authorities_Persons_Contacted_for_Information && <Text style={GlobalStyles.errorText}>{errors.Local_Authorities_Persons_Contacted_for_Information}</Text>}

              {renderLabel('Date of Information Gathered', true)}
              <View ref={(ref) => (inputContainerRefs.Date_of_Information_Gathered = ref)}>
                <TouchableOpacity
                  style={[GlobalStyles.input, errors.Date_of_Information_Gathered && GlobalStyles.inputError, { flexDirection: 'row', alignItems: 'center' }]}
                  onPress={() => canSubmit && setShowDatePicker((prev) => ({ ...prev, Date_of_Information_Gathered: true }))}
                >
                  <Text style={{ flex: 1, color: reportData.Date_of_Information_Gathered ? Theme.colors.black : Theme.colors.placeholderColor, fontFamily: 'Poppins_Regular'}}>
                    {reportData.Date_of_Information_Gathered || 'dd/mm/yyyy'}
                  </Text>
                  <Ionicons name="calendar" size={24} color="#00BCD4" />
                </TouchableOpacity>
                {showDatePicker.Date_of_Information_Gathered && canSubmit && (
                  <DateTimePicker
                    value={tempDate.Date_of_Information_Gathered || new Date()}
                    mode="date"
                    display="default"
                    onChange={(event, date) => handleDateChange('Date_of_Information_Gathered', event, date)}
                  />
                )}
              </View>
              {errors.Date_of_Information_Gathered && <Text style={GlobalStyles.errorText}>{errors.Date_of_Information_Gathered}</Text>}

              {renderLabel('Time of Information Gathered', true)}
              <View ref={(ref) => (inputContainerRefs.Time_of_Information_Gathered = ref)}>
                <TouchableOpacity
                  style={[GlobalStyles.input, errors.Time_of_Information_Gathered && GlobalStyles.inputError, { flexDirection: 'row', alignItems: 'center' }]}
                  onPress={() => canSubmit && setShowTimePicker((prev) => ({ ...prev, Time_of_Information_Gathered: true }))}
                >
                  <Text style={{ flex: 1, color: reportData.Time_of_Information_Gathered ? Theme.colors.black : Theme.colors.placeholderColor, fontFamily: 'Poppins_Regular' }}>
                    {reportData.Time_of_Information_Gathered || '--:-- --'}
                  </Text>
                  <Ionicons name="time" size={24} color="#00BCD4" />
                </TouchableOpacity>
                {showTimePicker.Time_of_Information_Gathered && canSubmit && (
                  <DateTimePicker
                    value={tempDate.Time_of_Information_Gathered || new Date()}
                    mode="time"
                    display="default"
                    is24Hour={false}
                    onChange={(event, time) => handleTimeChange('Time_of_Information_Gathered', event, time)}
                  />
                )}
              </View>
              {errors.Time_of_Information_Gathered && <Text style={GlobalStyles.errorText}>{errors.Time_of_Information_Gathered}</Text>}

              {renderLabel('Name of Organization Involved', true)}
              <View ref={(ref) => (inputContainerRefs.Name_of_the_Organizations_Involved = ref)}>
                <TextInput
                  style={[GlobalStyles.input, errors.Name_of_the_Organizations_Involved && GlobalStyles.inputError]}
                  placeholder="Enter Organization Name"
                  placeholderTextColor={Theme.colors.placeholderColor}
                  onChangeText={(val) => handleChange('Name_of_the_Organizations_Involved', val)}
                  value={reportData.Name_of_the_Organizations_Involved}
                  editable={canSubmit}
                />
              </View>
              {errors.Name_of_the_Organizations_Involved && <Text style={GlobalStyles.errorText}>{errors.Name_of_the_Organizations_Involved}</Text>}
            </View>

            <View style={GlobalStyles.section}>
              <Text style={styles.sectionTitle}>Modality</Text>
              {renderLabel('Locations and Areas Affected (Barangay)', true)}
              <View ref={(ref) => (inputContainerRefs.Locations_and_Areas_Affected_Barangay = ref)}>
                <TextInput
                  style={[GlobalStyles.input, errors.Locations_and_Areas_Affected_Barangay && GlobalStyles.inputError]}
                  placeholder="Enter Affected Barangay"
                  placeholderTextColor={Theme.colors.placeholderColor}
                  onChangeText={(val) => handleChange('Locations_and_Areas_Affected_Barangay', val)}
                  value={reportData.Locations_and_Areas_Affected_Barangay}
                  editable={canSubmit}
                />
              </View>
              {errors.Locations_and_Areas_Affected_Barangay && <Text style={GlobalStyles.errorText}>{errors.Locations_and_Areas_Affected_Barangay}</Text>}

              {renderLabel('Locations and Areas Affected (City/Municipality)', true)}
              <View ref={(ref) => (inputContainerRefs.Locations_and_Areas_Affected_City_Municipality = ref)}>
                <TextInput
                  style={[GlobalStyles.input, errors.Locations_and_Areas_Affected_City_Municipality && GlobalStyles.inputError]}
                  placeholder="Enter Affected City/Municipality"
                  placeholderTextColor={Theme.colors.placeholderColor}
                  onChangeText={(val) => handleChange('Locations_and_Areas_Affected_City_Municipality', val)}
                  value={reportData.Locations_and_Areas_Affected_City_Municipality}
                  editable={canSubmit}
                />
              </View>
              {errors.Locations_and_Areas_Affected_City_Municipality && <Text style={GlobalStyles.errorText}>{errors.Locations_and_Areas_Affected_City_Municipality}</Text>}

              {renderLabel('Locations and Areas Affected (Province)', true)}
              <View ref={(ref) => (inputContainerRefs.Locations_and_Areas_Affected_Province = ref)}>
                <TextInput
                  style={[GlobalStyles.input, errors.Locations_and_Areas_Affected_Province && GlobalStyles.inputError]}
                  placeholder="Enter Province"
                  placeholderTextColor={Theme.colors.placeholderColor}
                  onChangeText={(val) => handleChange('Locations_and_Areas_Affected_Province', val)}
                  value={reportData.Locations_and_Areas_Affected_Province}
                  editable={canSubmit}
                />
              </View>
              {errors.Locations_and_Areas_Affected_Province && <Text style={GlobalStyles.errorText}>{errors.Locations_and_Areas_Affected_Province}</Text>}

              {renderLabel('Type of Disaster', true)}
              <View
                style={[GlobalStyles.input, styles.pickerContainer, errors.Type_of_Disaster && GlobalStyles.inputError]}
                ref={(ref) => (inputContainerRefs.Type_of_Disaster = ref)}
              >
                <Picker
                  selectedValue={reportData.Type_of_Disaster}
                  onValueChange={(value) => handleChange('Type_of_Disaster', value)}
                  style={{
                    fontFamily: 'Poppins_Regular',
                    fontSize: 14,
                    color: reportData.Type_of_Disaster ? Theme.colors.black : Theme.colors.placeholderColor,
                    height: 68,
                    width: '100%',
                    textAlign: 'center',
                  }}
                  dropdownIconColor="#00BCD4"
                  enabled={canSubmit}
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
              {errors.Type_of_Disaster && <Text style={GlobalStyles.errorText}>{errors.Type_of_Disaster}</Text>}

              {renderLabel('Date of Occurrence', true)}
              <View ref={(ref) => (inputContainerRefs.Date_of_Occurrence = ref)}>
                <TouchableOpacity
                  style={[GlobalStyles.input, errors.Date_of_Occurrence && GlobalStyles.inputError, { flexDirection: 'row', alignItems: 'center' }]}
                  onPress={() => canSubmit && setShowDatePicker((prev) => ({ ...prev, Date_of_Occurrence: true }))}
                >
                  <Text style={{ flex: 1, color: reportData.Date_of_Occurrence ? Theme.colors.black : Theme.colors.placeholderColor, fontFamily: 'Poppins_Regular'}}>
                    {reportData.Date_of_Occurrence || 'dd/mm/yyyy'}
                  </Text>
                  <Ionicons name="calendar" size={24} color="#00BCD4" />
                </TouchableOpacity>
                {showDatePicker.Date_of_Occurrence && canSubmit && (
                  <DateTimePicker
                    value={tempDate.Date_of_Occurrence || new Date()}
                    mode="date"
                    display="default"
                    textColor={Theme.colors.black}
                    onChange={(event, date) => handleDateChange('Date_of_Occurrence', event, date)}
                  />
                )}
              </View>
              {errors.Date_of_Occurrence && <Text style={GlobalStyles.errorText}>{errors.Date_of_Occurrence}</Text>}

              {renderLabel('Time of Occurrence', true)}
              <View ref={(ref) => (inputContainerRefs.Time_of_Occurrence = ref)}>
                <TouchableOpacity
                  style={[GlobalStyles.input, errors.Time_of_Occurrence && GlobalStyles.inputError, { flexDirection: 'row', alignItems: 'center' }]}
                  onPress={() => canSubmit && setShowTimePicker((prev) => ({ ...prev, Time_of_Occurrence: true }))}
                >
                  <Text style={{ flex: 1, color: reportData.Time_of_Occurrence ? Theme.colors.black : Theme.colors.placeholderColor, fontFamily: 'Poppins_Regular'}}>
                    {reportData.Time_of_Occurrence || '--:-- --'}
                  </Text>
                  <Ionicons name="time" size={24} color="#00BCD4" />
                </TouchableOpacity>
                {showTimePicker.Time_of_Occurrence && canSubmit && (
                  <DateTimePicker
                    value={tempDate.Time_of_Occurrence || new Date()}
                    mode="time"
                    display="default"
                    is24Hour={false}
                    onChange={(event, time) => handleTimeChange('Time_of_Occurrence', event, time)}
                  />
                )}
              </View>
              {errors.Time_of_Occurrence && <Text style={GlobalStyles.errorText}>{errors.Time_of_Occurrence}</Text>}

              {renderLabel('Summary of Disaster/Incident (optional)', false)}
              <TextInput
                style={[GlobalStyles.input, { height: 100, textAlignVertical: 'top' }]}
                placeholder="Enter Summary"
                placeholderTextColor={Theme.colors.placeholderColor}
                multiline
                numberOfLines={4}
                onChangeText={(val) => handleChange('summary', val)}
                value={reportData.summary}
                editable={canSubmit}
              />
              {errors.summary && <Text style={GlobalStyles.errorText}>{errors.summary}</Text>}
            </View>

            <View style={GlobalStyles.section}>
              <Text style={styles.sectionTitle}>Initial Effects</Text>
              {affectedMunicipalities.length > 0 && (
                <ScrollView horizontal showsHorizontalScrollIndicator={true}>
                  <View style={styles.table}>
                    <View style={[styles.tableRow, { minWidth: 1300 }]}>
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
                          disabled={!canSubmit}
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
                  style={[GlobalStyles.input, errors.community && GlobalStyles.inputError]}
                  placeholder="Enter Municipalities/Communities"
                  placeholderTextColor={Theme.colors.placeholderColor}
                  onChangeText={(val) => handleChange('community', val)}
                  value={reportData.community}
                  editable={canSubmit}
                />
              </View>
              {errors.community && <Text style={GlobalStyles.errorText}>{errors.community}</Text>}

              {renderLabel('Total Population', true)}
              <View ref={(ref) => (inputContainerRefs.totalPop = ref)}>
                <TextInput
                  style={[GlobalStyles.input, errors.totalPop && GlobalStyles.inputError]}
                  placeholder="Enter Total Population"
                  placeholderTextColor={Theme.colors.placeholderColor}
                  onChangeText={(val) => handleChange('totalPop', val)}
                  value={reportData.totalPop}
                  keyboardType="numeric"
                  editable={canSubmit}
                />
              </View>
              {errors.totalPop && <Text style={GlobalStyles.errorText}>{errors.totalPop}</Text>}

              {renderLabel('Affected Population', true)}
              <View ref={(ref) => (inputContainerRefs.affected = ref)}>
                <TextInput
                  style={[GlobalStyles.input, errors.affected && GlobalStyles.inputError]}
                  placeholder="Enter Affected Population"
                  placeholderTextColor={Theme.colors.placeholderColor}
                  onChangeText={(val) => handleChange('affected', val)}
                  value={reportData.affected}
                  keyboardType="numeric"
                  editable={canSubmit}
                />
              </View>
              {errors.affected && <Text style={GlobalStyles.errorText}>{errors.affected}</Text>}

              {renderLabel('Deaths', true)}
              <View ref={(ref) => (inputContainerRefs.deaths = ref)}>
                <TextInput
                  style={[GlobalStyles.input, errors.deaths && GlobalStyles.inputError]}
                  placeholder="No. of Deaths"
                  placeholderTextColor={Theme.colors.placeholderColor}
                  onChangeText={(val) => handleChange('deaths', val)}
                  value={reportData.deaths}
                  keyboardType="numeric"
                  editable={canSubmit}
                />
              </View>
              {errors.deaths && <Text style={GlobalStyles.errorText}>{errors.deaths}</Text>}

              {renderLabel('Injured', true)}
              <View ref={(ref) => (inputContainerRefs.injured = ref)}>
                <TextInput
                  style={[GlobalStyles.input, errors.injured && GlobalStyles.inputError]}
                  placeholder="No. of Injured"
                  placeholderTextColor={Theme.colors.placeholderColor}
                  onChangeText={(val) => handleChange('injured', val)}
                  value={reportData.injured}
                  keyboardType="numeric"
                  editable={canSubmit}
                />
              </View>
              {errors.injured && <Text style={GlobalStyles.errorText}>{errors.injured}</Text>}

              {renderLabel('Missing', true)}
              <View ref={(ref) => (inputContainerRefs.missing = ref)}>
                <TextInput
                  style={[GlobalStyles.input, errors.missing && GlobalStyles.inputError]}
                  placeholder="No. of Missing"
                  placeholderTextColor={Theme.colors.placeholderColor}
                  onChangeText={(val) => handleChange('missing', val)}
                  value={reportData.missing}
                  keyboardType="numeric"
                  editable={canSubmit}
                />
              </View>
              {errors.missing && <Text style={GlobalStyles.errorText}>{errors.missing}</Text>}

              {renderLabel('Children', true)}
              <View ref={(ref) => (inputContainerRefs.children = ref)}>
                <TextInput
                  style={[GlobalStyles.input, errors.children && GlobalStyles.inputError]}
                  placeholder="No. of Children"
                  placeholderTextColor={Theme.colors.placeholderColor}
                  onChangeText={(val) => handleChange('children', val)}
                  value={reportData.children}
                  keyboardType="numeric"
                  editable={canSubmit}
                />
              </View>
              {errors.children && <Text style={GlobalStyles.errorText}>{errors.children}</Text>}

              {renderLabel('Women', true)}
              <View ref={(ref) => (inputContainerRefs.women = ref)}>
                <TextInput
                  style={[GlobalStyles.input, errors.women && GlobalStyles.inputError]}
                  placeholder="No. of Women"
                  placeholderTextColor={Theme.colors.placeholderColor}
                  onChangeText={(val) => handleChange('women', val)}
                  value={reportData.women}
                  keyboardType="numeric"
                  editable={canSubmit}
                />
              </View>
              {errors.women && <Text style={GlobalStyles.errorText}>{errors.women}</Text>}

              {renderLabel('Senior Citizens', true)}
              <View ref={(ref) => (inputContainerRefs.seniors = ref)}>
                <TextInput
                  style={[GlobalStyles.input, errors.seniors && GlobalStyles.inputError]}
                  placeholder="No. of Senior Citizens"
                  placeholderTextColor={Theme.colors.placeholderColor}
                  onChangeText={(val) => handleChange('seniors', val)}
                  value={reportData.seniors}
                  keyboardType="numeric"
                  editable={canSubmit}
                />
              </View>
              {errors.seniors && <Text style={GlobalStyles.errorText}>{errors.seniors}</Text>}

              {renderLabel('PWD', true)}
              <View ref={(ref) => (inputContainerRefs.pwd = ref)}>
                <TextInput
                  style={[GlobalStyles.input, errors.pwd && GlobalStyles.inputError]}
                  placeholder="No. of PWD"
                  placeholderTextColor={Theme.colors.placeholderColor}
                  onChangeText={(val) => handleChange('pwd', val)}
                  value={reportData.pwd}
                  keyboardType="numeric"
                  editable={canSubmit}
                />
              </View>
              {errors.pwd && <Text style={GlobalStyles.errorText}>{errors.pwd}</Text>}

              <View style={GlobalStyles.supplementaryButtonContainer}>
                <TouchableOpacity
                  style={[GlobalStyles.supplementaryButton, !canSubmit && { opacity: 0.6 }]}
                  onPress={() => {
                    if (!canSubmit) {
                      setModalConfig({
                        title: 'Permission Error',
                        message: 'You do not have permission to submit reports.',
                        onConfirm: () => setModalVisible(false),
                        confirmText: 'OK',
                      });
                      setModalVisible(true);
                      return;
                    }

                    const { isValid, newErrors } = validateMunicipalityInputs();
                    if (!isValid) {
                      setErrors(newErrors);
                      ToastAndroid.show('Please fill out the Initial Effects fields before adding an entry.', ToastAndroid.SHORT);
                      return;
                    }

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

                    setAffectedMunicipalities((prev) => [...prev, newMunicipality]);
                    ToastAndroid.show('Municipality Saved', ToastAndroid.SHORT);
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
                  }}
                  disabled={!canSubmit}
                >
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
                        enabled={canSubmit}
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
                    {errors[field] && <Text style={GlobalStyles.errorText}>{errors[field]}</Text>}
                  </View>
                );
              })}
              {renderLabel('Others', false)}
              <TextInput
                style={[GlobalStyles.input]}
                placeholder="Input Here (Optional)"
                placeholderTextColor={Theme.colors.placeholderColor}
                onChangeText={(val) => handleChange('othersStatus', val)}
                value={reportData.othersStatus}
                editable={canSubmit}
              />
              {errors.othersStatus && <Text style={GlobalStyles.errorText}>{errors.othersStatus}</Text>}
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
                  disabled={!canSubmit}
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
                placeholderTextColor={Theme.colors.placeholderColor}
                onChangeText={(val) => handleChange('otherNeeds', val)}
                value={reportData.otherNeeds}
                editable={canSubmit}
              />
              {errors.otherNeeds && <Text style={GlobalStyles.errorText}>{errors.otherNeeds}</Text>}
              {renderLabel('Estimated Quantity', false)}
              <TextInput
                style={[GlobalStyles.input]}
                placeholder="Estimated No. of Families to Benefit"
                placeholderTextColor={Theme.colors.placeholderColor}
                onChangeText={(val) => handleChange('estQty', val)}
                value={reportData.estQty}
                keyboardType="numeric"
                editable={canSubmit}
              />
              {errors.estQty && <Text style={GlobalStyles.errorText}>{errors.estQty}</Text>}
            </View>

            <View style={GlobalStyles.section}>
              <Text style={styles.sectionTitle}>Initial Response Actions</Text>
              {renderLabel('Response Groups Involved', true)}
              <View ref={(ref) => (inputContainerRefs.responseGroup = ref)}>
                <TextInput
                  style={[GlobalStyles.input, errors.responseGroup && GlobalStyles.inputError]}
                  placeholder="Enter Organization's Name"
                  placeholderTextColor={Theme.colors.placeholderColor}
                  onChangeText={(val) => handleChange('responseGroup', val)}
                  value={reportData.responseGroup}
                  editable={canSubmit}
                />
              </View>
              {errors.responseGroup && <Text style={GlobalStyles.errorText}>{errors.responseGroup}</Text>}

              {renderLabel('Relief Assistance Deployed', true)}
              <View ref={(ref) => (inputContainerRefs.reliefDeployed = ref)}>
                <TextInput
                  style={[GlobalStyles.input, errors.reliefDeployed && GlobalStyles.inputError]}
                  placeholder="Enter Relief Assistance"
                  placeholderTextColor={Theme.colors.placeholderColor}
                  onChangeText={(val) => handleChange('reliefDeployed', val)}
                  value={reportData.reliefDeployed}
                  editable={canSubmit}
                />
              </View>
              {errors.reliefDeployed && <Text style={GlobalStyles.errorText}>{errors.reliefDeployed}</Text>}

              {renderLabel('Number of Families Served', true)}
              <View ref={(ref) => (inputContainerRefs.familiesServed = ref)}>
                <TextInput
                  style={[GlobalStyles.input, errors.familiesServed && GlobalStyles.inputError]}
                  placeholder="Enter Number of Families"
                  placeholderTextColor={Theme.colors.placeholderColor}
                  onChangeText={(val) => handleChange('familiesServed', val)}
                  value={reportData.familiesServed}
                  keyboardType="numeric"
                  editable={canSubmit}
                />
              </View>
              {errors.familiesServed && <Text style={GlobalStyles.errorText}>{errors.familiesServed}</Text>}
            </View>

            <View style={{ marginHorizontal: 15 }}>
              <TouchableOpacity
                style={[GlobalStyles.button, !canSubmit && { opacity: 0.6 }]}
                onPress={() => {
                  if (!canSubmit) {
                    setModalConfig({
                      title: 'Permission Error',
                      message: 'You do not have permission to submit reports.',
                      onConfirm: () => setModalVisible(false),
                      confirmText: 'OK',
                    });
                    setModalVisible(true);
                    return;
                  }

                  const newErrors = {};
                  let allRequiredBlank = true;

                  requiredFields.forEach((field) => {
                    const value = reportData[field];
                    if (value === null || (typeof value === 'string' && value.trim() === '')) {
                      newErrors[field] = requiredFieldsErrors[field];
                    } else {
                      allRequiredBlank = false;
                    }
                  });

                  if (allRequiredBlank) {
                    setModalConfig({
                      title: 'Incomplete Data',
                      message: 'Please fill in required fields.',
                      onConfirm: () => setModalVisible(false),
                      confirmText: 'OK',
                    });
                    setModalVisible(true);
                    return;
                  }

                  if (affectedMunicipalities.length === 0) {
                    newErrors.community = 'Please add at least one municipality.';
                  }

                  const gatheredDate = parseDate(reportData.Date_of_Information_Gathered);
                  const gatheredTime = parseTimeToDate(reportData.Time_of_Information_Gathered);
                  const occurrenceDate = parseDate(reportData.Date_of_Occurrence);
                  const occurrenceTime = parseTimeToDate(reportData.Time_of_Occurrence);
                  if (gatheredDate && gatheredTime && occurrenceDate && occurrenceTime) {
                    if (!isWithin24To48Hours(gatheredDate, gatheredTime, occurrenceDate, occurrenceTime)) {
                      newErrors.Date_of_Information_Gathered = 'Date must be 24-48 hours after the occurrence.';
                      newErrors.Time_of_Information_Gathered = 'Time must be 24-48 hours after the occurrence.';
                      ToastAndroid.show('Date must be 24-48 hours after the occurrence.', ToastAndroid.SHORT);
                    }
                  }

                  if (Object.keys(newErrors).length > 0) {
                    setErrors(newErrors);
                    if (!allRequiredBlank) {
                      setModalConfig({
                        title: 'Incomplete Data',
                        message: `Please fill in the following:\n${Object.values(newErrors).join('\n')}`,
                        onConfirm: () => setModalVisible(false),
                        confirmText: 'OK',
                      });
                      setModalVisible(true);
                    }
                    return;
                  }

                  const completeReportData = Object.keys(reportData).reduce((acc, key) => {
                    if (!municipalityFields.includes(key)) {
                      acc[key] = reportData[key];
                    }
                    return acc;
                  }, {});

                  console.log('Navigating to RDANASummary with reportData:', completeReportData);
                  console.log('Lifeline Status Fields:', {
                    residentialhousesStatus: completeReportData.residentialhousesStatus,
                    transportationandmobilityStatus: completeReportData.transportationandmobilityStatus,
                    electricitypowergridStatus: completeReportData.electricitypowergridStatus,
                    communicationnetworksinternetStatus: completeReportData.communicationnetworksinternetStatus,
                    hospitalsruralhealthunitsStatus: completeReportData.hospitalsruralhealthunitsStatus,
                    watersupplysystemStatus: completeReportData.watersupplysystemStatus,
                    marketbusinessandcommercialestablishmentsStatus: completeReportData.marketbusinessandcommercialestablishmentsStatus,
                    othersStatus: completeReportData.othersStatus,
                  });
                  console.log('Affected Municipalities:', affectedMunicipalities);

                  navigation.navigate('RDANASummary', { reportData: completeReportData, affectedMunicipalities });
                }}
                disabled={!canSubmit}
              >
                <Text style={GlobalStyles.buttonText}>Proceed</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <OperationCustomModal
        visible={deleteModalVisible}
        title="Confirm Delete"
        message="Are you sure you want to delete this municipality?"
        onConfirm={confirmDelete}
        onCancel={cancelDelete}
        confirmText="Delete"
        cancelText="Cancel"
        showCancel={true}
      />
      <OperationCustomModal
        visible={modalVisible}
        title={modalConfig.title}
        message={modalConfig.message}
        onConfirm={modalConfig.onConfirm}
        confirmText={modalConfig.confirmText}
      />
    </SafeAreaView>
  );
};

export default RDANAScreen;