import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useNavigation, useRoute } from '@react-navigation/native';
import { auth, database } from '../configuration/firebaseConfig';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ref as databaseRef, get, query, orderByChild, equalTo, push, set } from 'firebase/database';
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
  ScrollView as RNScrollView,
} from 'react-native';
import { Dropdown } from 'react-native-element-dropdown';
import { ScrollView } from 'react-native-gesture-handler';
import GlobalStyles from '../styles/GlobalStyles';
import styles from '../styles/RDANAStyles';
import Theme from '../constants/theme';
import OperationCustomModal from '../components/OperationCustomModal';
import useOperationCheck from '../components/useOperationCheck';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import regions from '../data/region.json';
import provinces from '../data/province.json';
import cities from '../data/city.json';
import barangays from '../data/barangay.json';
import CustomModal from '../components/CustomModal';

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

const ProgressSteps = ({ sections, currentSection, setCurrentSection, scrollViewRef }) => {
  const handleStepPress = (index) => {
    setCurrentSection(index);
    scrollViewRef.current?.scrollTo({ y: index * Dimensions.get('window').height * 0.8, animated: true });
  };

  return (
    <View
      style={{
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        paddingVertical: 10,
        paddingHorizontal: 15,
        marginBottom: 10,
        backgroundColor: 'transparent',
      }}
    >
      {sections.map((section, index) => (
        <View
          key={index}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            flex: 1,
            minWidth: 50,
            justifyContent: 'center',
          }}
        >
          <TouchableOpacity onPress={() => handleStepPress(index)}>
            <View
              style={[styles.progressCircles,{
                backgroundColor: index <= currentSection ? Theme.colors.accent : '#E0E0E0',
              }]}
            >
              <Text
                style={[styles.progressNumbers,{color: index <= currentSection ? Theme.colors.lightBg : Theme.colors.black,}]}
              >
                {index + 1}
              </Text>
            </View>
            {index === currentSection && (
              <Text
                style={styles.progressStepsText}
              >
                {section}
              </Text>
            )}
          </TouchableOpacity>
          {index < sections.length - 1 && (
            <View
              style={{
                flex: 1,
                height: 2,
                backgroundColor: index < currentSection ? Theme.colors.accent : '#E0E0E0',
                marginHorizontal: 5,
              }}
            />
          )}
        </View>
      ))}
    </View>
  );
};

const RDANAScreen = ({ navigation }) => {
  const { user } = useAuth();
  const route = useRoute();
  const [errors, setErrors] = useState({});
  const inputContainerRefs = useRef({}).current;
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [deleteIndex, setDeleteIndex] = useState(null);
  const [deleteType, setDeleteType] = useState('');
  const { canSubmit, organizationName, modalVisible, setModalVisible, modalConfig, setModalConfig } = useOperationCheck();
  const insets = useSafeAreaInsets();
  const [currentSection, setCurrentSection] = useState(0);
  const scrollViewRef = useRef(null);

  const sections = ['Step 1', 'Step 2', 'Step 3', 'Step 4'];

  const requiredFieldsErrors = {
    Date_of_Information_Gathered: 'Please provide the date when information was gathered (within 24-48 hours of occurrence).',
    Date_of_Occurrence: 'Please specify the date of the disaster occurrence.',
    Local_Authorities_Persons_Contacted_for_Information: 'Please add at least one local authority or person contacted.',
    Locations_and_Areas_Affected: 'Please add at least one affected location.',
    Name_of_the_Organizations_Involved: 'Please add at least one organization involved.',
    Site_Location_Address_Province: 'Please select the site location province.',
    Site_Location_Address_City_Municipality: 'Please select the site location city or municipality.',
    Site_Location_Address_Barangay: 'Please select the site location barangay.',
    Time_of_Information_Gathered: 'Please provide the time when information was gathered (within 24-48 hours of occurrence).',
    Time_of_Occurrence: 'Please specify the time of the disaster occurrence.',
    Type_of_Disaster: 'Please select the type of disaster.',
    Affected_Municipalities: 'Please add at least one affected municipality.',
    responseGroup: 'Please add at least one response group.',
    reliefDeployed: 'Please add at least one relief assistance entry.',
    familiesServed: 'Please add at least one entry for families served.',
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
    Time_of_Information_Gathered: route.params?.reportData?.Time_of_Information_Gathered || '',
    Time_of_Occurrence: route.params?.reportData?.Time_of_Occurrence || '',
    Type_of_Disaster: route.params?.reportData?.Type_of_Disaster || '',
    summary: route.params?.reportData?.summary || '',
    Site_Location_Address_Province: route.params?.reportData?.Site_Location_Address_Province || '',
    Site_Location_Address_City_Municipality: route.params?.reportData?.Site_Location_Address_City_Municipality || '',
    Site_Location_Address_Barangay: route.params?.reportData?.Site_Location_Address_Barangay || '',
    Locations_and_Areas_Affected_Province: route.params?.reportData?.Locations_and_Areas_Affected_Province || '',
    Locations_and_Areas_Affected_City_Municipality: route.params?.reportData?.Locations_and_Areas_Affected_City_Municipality || '',
    Locations_and_Areas_Affected_Barangay: route.params?.reportData?.Locations_and_Areas_Affected_Barangay || '',
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
    otherNeeds: '',
    estQty: '',
    responseGroup: '',
    reliefDeployed: '',
    familiesServed: '',
  };
  const [reportData, setReportData] = useState(initialReportData);
  const [authoritiesAndOrganizations, setAuthoritiesAndOrganizations] = useState(route.params?.reportData?.authoritiesAndOrganizations || []);
  const [affectedLocations, setAffectedLocations] = useState(route.params?.reportData?.affectedLocations || []);
  const [affectedMunicipalities, setAffectedMunicipalities] = useState(route.params?.reportData?.affectedMunicipalities || []);
  const [immediateNeeds, setImmediateNeeds] = useState(route.params?.reportData?.immediateNeeds || []);
  const [initialResponse, setInitialResponse] = useState(route.params?.reportData?.initialResponse || []);

  const [checklist, setChecklist] = useState({
    reliefPacks: route.params?.reportData?.reliefPacks === 'Yes',
    hotMeals: route.params?.reportData?.hotMeals === 'Yes',
    hygieneKits: route.params?.reportData?.hygieneKits === 'Yes',
    drinkingWater: route.params?.reportData?.drinkingWater === 'Yes',
    ricePacks: route.params?.reportData?.ricePacks === 'Yes',
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
    { label: 'Select Type of Disaster', value: '' },
    { label: 'Earthquake', value: 'Earthquake' },
    { label: 'Typhoon', value: 'Typhoon' },
    { label: 'Flood', value: 'Flood' },
    { label: 'Landslide', value: 'Landslide' },
    { label: 'Fire', value: 'Fire' },
  ];

  const provinceOptions = provinces.map((province) => ({
    label: province.province_name,
    value: province.province_name,
  }));

  const getCityOptions = (provinceName) => {
    const selectedProvince = provinces.find((p) => p.province_name === provinceName);
    const provinceCode = selectedProvince ? selectedProvince.province_code : '';
    return cities
      .filter((city) => city.province_code === provinceCode)
      .map((city) => ({
        label: city.city_name,
        value: city.city_name,
      }));
  };

  const getBarangayOptions = (cityName) => {
    const selectedCity = cities.find((c) => c.city_name === cityName);
    const cityCode = selectedCity ? selectedCity.city_code : '';
    return barangays
      .filter((barangay) => barangay.city_code === cityCode)
      .map((barangay) => ({
        label: barangay.brgy_name,
        value: barangay.brgy_name,
      }));
  };

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
      field.includes('otherNeeds')
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

    if (field === 'Site_Location_Address_Province') {
      setReportData((prev) => ({
        ...prev,
        Site_Location_Address_City_Municipality: '',
        Site_Location_Address_Barangay: '',
        Locations_and_Areas_Affected_Province: value,
        Locations_and_Areas_Affected_City_Municipality: '',
        Locations_and_Areas_Affected_Barangay: '',
        community: '',
      }));
    }

    if (field === 'Site_Location_Address_City_Municipality') {
      setReportData((prev) => ({
        ...prev,
        Site_Location_Address_Barangay: '',
        community: '',
      }));
    }

    if (field === 'Locations_and_Areas_Affected_Province') {
      setReportData((prev) => ({
        ...prev,
        Locations_and_Areas_Affected_City_Municipality: '',
        Locations_and_Areas_Affected_Barangay: '',
      }));
    }

    if (field === 'Locations_and_Areas_Affected_City_Municipality') {
      setReportData((prev) => ({
        ...prev,
        Locations_and_Areas_Affected_Barangay: '',
      }));
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

  const handleDelete = (index, type) => {
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
    setDeleteType(type);
    setDeleteModalVisible(true);
  };

  const confirmDelete = () => {
    if (deleteIndex !== null && deleteType) {
      if (deleteType === 'authorityOrg') {
        setAuthoritiesAndOrganizations((prev) => prev.filter((_, i) => i !== deleteIndex));
      } else if (deleteType === 'affectedLocation') {
        setAffectedLocations((prev) => prev.filter((_, i) => i !== deleteIndex));
      } else if (deleteType === 'municipality') {
        setAffectedMunicipalities((prev) => prev.filter((_, i) => i !== deleteIndex));
      } else if (deleteType === 'immediateNeed') {
        setImmediateNeeds((prev) => prev.filter((_, i) => i !== deleteIndex));
      } else if (deleteType === 'initialResponse') {
        setInitialResponse((prev) => prev.filter((_, i) => i !== deleteIndex));
      }
      setDeleteModalVisible(false);
      setDeleteIndex(null);
      setDeleteType('');
    }
  };

  const cancelDelete = () => {
    setDeleteModalVisible(false);
    setDeleteIndex(null);
    setDeleteType('');
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
    if (!community || !community.trim()) newErrors.community = 'Please select an affected municipality.';
    if (!totalPop || !totalPop.trim()) newErrors.totalPop = 'Please provide the total population.';
    if (!affected || !affected.trim()) newErrors.affected = 'Please provide the number of affected population.';
    if (!deaths || !deaths.trim()) newErrors.deaths = 'Please enter the number of deaths.';
    if (!injured || !injured.trim()) newErrors.injured = 'Please enter the number of injured persons.';
    if (!missing || !missing.trim()) newErrors.missing = 'Please enter the number of missing persons.';
    if (!children || !children.trim()) newErrors.children = 'Please enter the number of affected children.';
    if (!women || !women.trim()) newErrors.women = 'Please enter the number of affected women.';
    if (!seniors || !seniors.trim()) newErrors.seniors = 'Please enter the number of affected senior citizens.';
    if (!pwd || !pwd.trim()) newErrors.pwd = 'Please enter the number of affected persons with disabilities.';

    const totalPopNum = parseInt(totalPop) || 0;
    const affectedNum = parseInt(affected) || 0;
    const deathsNum = parseInt(deaths) || 0;
    const injuredNum = parseInt(injured) || 0;
    const missingNum = parseInt(missing) || 0;
    const childrenNum = parseInt(children) || 0;
    const womenNum = parseInt(women) || 0;
    const seniorsNum = parseInt(seniors) || 0;
    const pwdNum = parseInt(pwd) || 0;

    if (affectedNum > totalPopNum) {
      newErrors.affected = 'Affected population cannot exceed total population.';
    }
    if ((deathsNum + injuredNum + missingNum) > affectedNum) {
      newErrors.casualties = 'Deaths + Injured + Missing cannot exceed affected population.';
    }
    if ((childrenNum + womenNum + seniorsNum + pwdNum) > affectedNum) {
      newErrors.demographics = 'Demographic groups cannot exceed affected population.';
    }
    if (totalPopNum === 0 && affectedNum > 0) {
      newErrors.totalPop = 'Total population is zero but affected people exist.';
    }

    return { isValid: Object.keys(newErrors).length === 0, newErrors };
  };

  const validateImmediateNeedsInputs = () => {
    const { otherNeeds, estQty } = reportData;
    const newErrors = {};
    if (!otherNeeds || !otherNeeds.trim()) newErrors.otherNeeds = 'Please enter the need.';
    if (!estQty || !estQty.trim()) newErrors.estQty = 'Please enter the estimated quantity.';
    return { isValid: Object.keys(newErrors).length === 0, newErrors };
  };

  const validateInitialResponseInputs = () => {
    const { responseGroup, reliefDeployed, familiesServed } = reportData;
    const newErrors = {};
    if (!responseGroup || !responseGroup.trim()) newErrors.responseGroup = 'Please enter the response group.';
    if (!reliefDeployed || !reliefDeployed.trim()) newErrors.reliefDeployed = 'Please enter the relief assistance.';
    if (!familiesServed || !familiesServed.trim()) newErrors.familiesServed = 'Please enter the number of families served.';
    return { isValid: Object.keys(newErrors).length === 0, newErrors };
  };

  const renderLabel = (label, isRequired) => (
    <Text style={GlobalStyles.formTitle}>
      {label}
      {isRequired && <Text style={{ color: 'red' }}>*</Text>}
    </Text>
  );

  const handleAddAuthorityOrOrganization = (type) => {
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

    const value = type === 'authority' ? reportData.Local_Authorities_Persons_Contacted_for_Information : reportData.Name_of_the_Organizations_Involved;
    if (!value || !value.trim()) {
      setErrors((prev) => ({
        ...prev,
        [type === 'authority' ? 'Local_Authorities_Persons_Contacted_for_Information' : 'Name_of_the_Organizations_Involved']: `Please enter a ${type}.`,
      }));
      return;
    }

    setAuthoritiesAndOrganizations((prev) => [
      ...prev,
      { authority: type === 'authority' ? value : '', organization: type === 'organization' ? value : '' },
    ]);
    setReportData((prev) => ({
      ...prev,
      [type === 'authority' ? 'Local_Authorities_Persons_Contacted_for_Information' : 'Name_of_the_Organizations_Involved']: '',
    }));
    setErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors[type === 'authority' ? 'Local_Authorities_Persons_Contacted_for_Information' : 'Name_of_the_Organizations_Involved'];
      return newErrors;
    });
    ToastAndroid.show(`${type === 'authority' ? 'Authority' : 'Organization'} added`, ToastAndroid.SHORT);
  };

  const handleAddAffectedLocation = () => {
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

    const { Locations_and_Areas_Affected_Province, Locations_and_Areas_Affected_City_Municipality, Locations_and_Areas_Affected_Barangay } = reportData;
    if (!Locations_and_Areas_Affected_Province || !Locations_and_Areas_Affected_City_Municipality || !Locations_and_Areas_Affected_Barangay) {
      setErrors((prev) => ({
        ...prev,
        Locations_and_Areas_Affected_Province: !Locations_and_Areas_Affected_Province ? 'Please select a province.' : prev.Locations_and_Areas_Affected_Province,
        Locations_and_Areas_Affected_City_Municipality: !Locations_and_Areas_Affected_City_Municipality ? 'Please select a city/municipality.' : prev.Locations_and_Areas_Affected_City_Municipality,
        Locations_and_Areas_Affected_Barangay: !Locations_and_Areas_Affected_Barangay ? 'Please select a barangay.' : prev.Locations_and_Areas_Affected_Barangay,
      }));
      return;
    }

    setAffectedLocations((prev) => [
      ...prev,
      {
        province: Locations_and_Areas_Affected_Province,
        city: Locations_and_Areas_Affected_City_Municipality,
        barangay: Locations_and_Areas_Affected_Barangay,
      },
    ]);
    setReportData((prev) => ({
      ...prev,
      Locations_and_Areas_Affected_City_Municipality: '',
      Locations_and_Areas_Affected_Barangay: '',
    }));
    setErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors.Locations_and_Areas_Affected_Province;
      delete newErrors.Locations_and_Areas_Affected_City_Municipality;
      delete newErrors.Locations_and_Areas_Affected_Barangay;
      return newErrors;
    });
    ToastAndroid.show('Location added', ToastAndroid.SHORT);
  };

  const handleAddMunicipality = () => {
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
      ToastAndroid.show('Please fill out all required fields correctly.', ToastAndroid.SHORT);
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
    ToastAndroid.show('Municipality added', ToastAndroid.SHORT);
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
      ['community', 'totalPop', 'affected', 'deaths', 'injured', 'missing', 'children', 'women', 'seniors', 'pwd'].forEach((field) => delete newErrors[field]);
      return newErrors;
    });
  };

  const handleAddImmediateNeed = () => {
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

    const { isValid, newErrors } = validateImmediateNeedsInputs();
    if (!isValid) {
      setErrors(newErrors);
      ToastAndroid.show('Please fill out all required fields.', ToastAndroid.SHORT);
      return;
    }

    setImmediateNeeds((prev) => [
      ...prev,
      { need: reportData.otherNeeds, qty: reportData.estQty },
    ]);
    setReportData((prev) => ({
      ...prev,
      otherNeeds: '',
      estQty: '',
    }));
    setErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors.otherNeeds;
      delete newErrors.estQty;
      return newErrors;
    });
    ToastAndroid.show('Need added', ToastAndroid.SHORT);
  };

  const handleAddInitialResponse = () => {
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

    const { isValid, newErrors } = validateInitialResponseInputs();
    if (!isValid) {
      setErrors(newErrors);
      ToastAndroid.show('Please fill out all required fields.', ToastAndroid.SHORT);
      return;
    }

    setInitialResponse((prev) => [
      ...prev,
      {
        group: reportData.responseGroup,
        assistance: reportData.reliefDeployed,
        families: reportData.familiesServed,
      },
    ]);
    setReportData((prev) => ({
      ...prev,
      responseGroup: '',
      reliefDeployed: '',
      familiesServed: '',
    }));
    setErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors.responseGroup;
      delete newErrors.reliefDeployed;
      delete newErrors.familiesServed;
      return newErrors;
    });
    ToastAndroid.show('Response added', ToastAndroid.SHORT);
  };

  const handleNavigation = (direction) => {
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

    let newSection = currentSection;
    if (direction === 'next' && currentSection < sections.length - 1) {
      const requiredFieldsForSection = {
        0: ['Site_Location_Address_Province', 'Site_Location_Address_City_Municipality', 'Site_Location_Address_Barangay', 'Date_of_Information_Gathered', 'Time_of_Information_Gathered', 'Type_of_Disaster', 'Date_of_Occurrence', 'Time_of_Occurrence'],
        1: [],
        2: [],
        3: [],
      }[currentSection];

      const newErrors = {};
      requiredFieldsForSection.forEach((field) => {
        if (!reportData[field] || reportData[field].trim() === '') {
          newErrors[field] = requiredFieldsErrors[field];
        }
      });

      if (currentSection === 0 && authoritiesAndOrganizations.length === 0) {
        newErrors.Local_Authorities_Persons_Contacted_for_Information = requiredFieldsErrors.Local_Authorities_Persons_Contacted_for_Information;
        newErrors.Name_of_the_Organizations_Involved = requiredFieldsErrors.Name_of_the_Organizations_Involved;
      }

      if (currentSection === 0 && affectedLocations.length === 0) {
        newErrors.Locations_and_Areas_Affected = requiredFieldsErrors.Locations_and_Areas_Affected;
      }

      if (currentSection === 1 && affectedMunicipalities.length === 0) {
        newErrors.Affected_Municipalities = requiredFieldsErrors.Affected_Municipalities;
      }

      if (currentSection === 3 && initialResponse.length === 0) {
        newErrors.responseGroup = requiredFieldsErrors.responseGroup;
        newErrors.reliefDeployed = requiredFieldsErrors.reliefDeployed;
        newErrors.familiesServed = requiredFieldsErrors.familiesServed;
      }

      if (Object.keys(newErrors).length > 0) {
        setErrors(newErrors);
        ToastAndroid.show('Please fill out all required fields.', ToastAndroid.SHORT);
        return;
      }

      newSection = currentSection + 1;
    } else if (direction === 'back' && currentSection > 0) {
      newSection = currentSection - 1;
    }
    setCurrentSection(newSection);
    scrollViewRef.current?.scrollTo({ y: newSection * Dimensions.get('window').height * 0.8, animated: true });
  };

  const generateUniqueId = async () => {
    let attempts = 0;
    const maxAttempts = 3;
    while (attempts < maxAttempts) {
      const randomNum = Math.floor(100 + Math.random() * 900);
      const customId = `RDANA-${randomNum}`;
      const snapshot = await get(query(databaseRef(database, 'rdana/submitted'), orderByChild('rdanaId'), equalTo(customId)));
      if (!snapshot.exists()) return customId;
      attempts++;
    }
    throw new Error('Unable to generate a unique RDANA ID.');
  };

  const handleSubmit = async () => {
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

    if (!user) {
      setModalConfig({
        title: 'Sign In Required',
        message: 'Please sign in to submit a report.',
        onConfirm: () => navigation.navigate('Login'),
        confirmText: 'OK',
      });
      setModalVisible(true);
      return;
    }

    const requiredFields = [
      'Date_of_Information_Gathered',
      'Date_of_Occurrence',
      'Site_Location_Address_Province',
      'Site_Location_Address_City_Municipality',
      'Site_Location_Address_Barangay',
      'Time_of_Information_Gathered',
      'Time_of_Occurrence',
      'Type_of_Disaster',
    ];

    const newErrors = {};
    requiredFields.forEach((field) => {
      if (!reportData[field] || reportData[field].trim() === '') {
        newErrors[field] = requiredFieldsErrors[field];
      }
    });

    if (authoritiesAndOrganizations.length === 0) {
      newErrors.Local_Authorities_Persons_Contacted_for_Information = requiredFieldsErrors.Local_Authorities_Persons_Contacted_for_Information;
      newErrors.Name_of_the_Organizations_Involved = requiredFieldsErrors.Name_of_the_Organizations_Involved;
    }

    if (affectedLocations.length === 0) {
      newErrors.Locations_and_Areas_Affected = requiredFieldsErrors.Locations_and_Areas_Affected;
    }

    if (affectedMunicipalities.length === 0) {
      newErrors.Affected_Municipalities = requiredFieldsErrors.Affected_Municipalities;
    }

    if (initialResponse.length === 0) {
      newErrors.responseGroup = requiredFieldsErrors.responseGroup;
      newErrors.reliefDeployed = requiredFieldsErrors.reliefDeployed;
      newErrors.familiesServed = requiredFieldsErrors.familiesServed;
    }

    if (!isWithin24To48Hours(
      parseDate(reportData.Date_of_Information_Gathered),
      parseTimeToDate(reportData.Time_of_Information_Gathered),
      parseDate(reportData.Date_of_Occurrence),
      parseTimeToDate(reportData.Time_of_Occurrence)
    )) {
      newErrors.Date_of_Information_Gathered = 'Information must be gathered within 24-48 hours of occurrence.';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      ToastAndroid.show('Please fill out all required fields correctly.', ToastAndroid.SHORT);
      return;
    }

    // Prepare submission object without submitting to Firebase
    const lifelines = [
      { structure: 'Residential Houses', status: reportData.residentialhousesStatus || 'N/A' },
      { structure: 'Transportation and Mobility', status: reportData.transportationandmobilityStatus || 'N/A' },
      { structure: 'Electricity, Power Grid', status: reportData.electricitypowergridStatus || 'N/A' },
      { structure: 'Communication Networks, Internet', status: reportData.communicationnetworksinternetStatus || 'N/A' },
      { structure: 'Hospitals, Rural Health Units', status: reportData.hospitalsruralhealthunitsStatus || 'N/A' },
      { structure: 'Water Supply System', status: reportData.watersupplysystemStatus || 'N/A' },
      { structure: 'Market, Business, and Commercial Establishments', status: reportData.marketbusinessandcommercialestablishmentsStatus || 'N/A' },
      { structure: 'Others', status: reportData.othersStatus || 'N/A' },
    ].filter((item) => item.status !== 'N/A');

    const submission = {
      rdanaId: '', // Will be generated in RDANASummary
      timestamp: Date.now(),
      userUid: user.uid,
      reportData: {
        profile: {
          province: reportData.Site_Location_Address_Province,
          city: reportData.Site_Location_Address_City_Municipality,
          barangay: reportData.Site_Location_Address_Barangay,
          infoDate: reportData.Date_of_Information_Gathered,
          infoTime: reportData.Time_of_Information_Gathered,
          authorities: authoritiesAndOrganizations,
          affectedLocations,
          disasterType: reportData.Type_of_Disaster,
          occurrenceDate: reportData.Date_of_Occurrence,
          occurrenceTime: reportData.Time_of_Occurrence,
          summary: reportData.summary,
        },
        disasterEffects: affectedMunicipalities,
        lifelines,
        checklist: Object.keys(checklist).filter((key) => checklist[key]).map((key) => ({
          label: key.replace(/([A-Z])/g, ' $1').replace(/^./, (str) => str.toUpperCase()),
          value: key,
        })),
        immediateNeeds,
        initialResponse,
      },
      status: 'Pending', // Mark as pending until submitted
    };

    // Navigate to RDANASummary with submission data
    navigation.navigate('RDANASummary', { submission });
  };

  const windowHeight = Dimensions.get('window').height;
  const maxDropdownHeight = windowHeight * 0.3;

  return (
    <SafeAreaView style={[GlobalStyles.container]}>
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
        style={{ flex: 1, marginTop: 100 }}
        keyboardVerticalOffset={0}
      >
        <ProgressSteps
          sections={sections}
          currentSection={currentSection}
          setCurrentSection={setCurrentSection}
          scrollViewRef={scrollViewRef}
        />

        <ScrollView
          ref={scrollViewRef}
          contentContainerStyle={[GlobalStyles.scrollViewContent]}
          scrollEnabled={true}
          keyboardShouldPersistTaps="handled"
        >
          {/* Step 1 */}
          <View style={[GlobalStyles.form, { display: currentSection === 0 ? 'flex' : 'none' }]}>
            <View style={GlobalStyles.section}>
              <Text style={styles.sectionTitle}>Profile of the Disaster</Text>
              {renderLabel('Site Location/Address (Province)', true)}
              <View ref={(ref) => (inputContainerRefs.Site_Location_Address_Province = ref)} style={[GlobalStyles.input, styles.pickerContainer, errors.Site_Location_Address_Province && GlobalStyles.inputError]}>
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
                  value={reportData.Site_Location_Address_Province}
                  onChange={(item) => handleChange('Site_Location_Address_Province', item.value)}
                  containerStyle={{ maxHeight: maxDropdownHeight }}
                  disable={!canSubmit}
                  renderRightIcon={() => (
                    <Ionicons name="chevron-down" size={20} color={Theme.colors.black} />
                  )}
                />
              </View>
              {errors.Site_Location_Address_Province && <Text style={GlobalStyles.errorText}>{errors.Site_Location_Address_Province}</Text>}

              {renderLabel('Site Location/Address (City/Municipality)', true)}
              <View ref={(ref) => (inputContainerRefs.Site_Location_Address_City_Municipality = ref)} style={[GlobalStyles.input, styles.pickerContainer, errors.Site_Location_Address_City_Municipality && GlobalStyles.inputError]}>
                <Dropdown
                  style={{ padding: 10, width: '100%', fontFamily: 'Poppins_Regular' }}
                  placeholderStyle={{ fontFamily: 'Poppins_Regular', color: Theme.colors.placeholderColor, fontSize: 14 }}
                  selectedTextStyle={{ fontFamily: 'Poppins_Regular', fontSize: 14, color: Theme.colors.black }}
                  itemTextStyle={{ fontFamily: 'Poppins_Regular', fontSize: 14, color: Theme.colors.black }}
                  itemContainerStyle={{ maxHeight: maxDropdownHeight }}
                  data={[{ label: 'Select City/Municipality', value: '' }, ...getCityOptions(reportData.Site_Location_Address_Province)]}
                  labelField="label"
                  valueField="value"
                  placeholder="Select City/Municipality"
                  value={reportData.Site_Location_Address_City_Municipality}
                  onChange={(item) => handleChange('Site_Location_Address_City_Municipality', item.value)}
                  containerStyle={{ maxHeight: maxDropdownHeight }}
                  disable={!canSubmit || !reportData.Site_Location_Address_Province}
                  renderRightIcon={() => (
                    <Ionicons name="chevron-down" size={20} color={Theme.colors.black} />
                  )}
                />
              </View>
              {errors.Site_Location_Address_City_Municipality && <Text style={GlobalStyles.errorText}>{errors.Site_Location_Address_City_Municipality}</Text>}

              {renderLabel('Site Location/Address (Barangay)', true)}
              <View ref={(ref) => (inputContainerRefs.Site_Location_Address_Barangay = ref)} style={[GlobalStyles.input, styles.pickerContainer, errors.Site_Location_Address_Barangay && GlobalStyles.inputError]}>
                <Dropdown
                  style={{ padding: 10, width: '100%', fontFamily: 'Poppins_Regular' }}
                  placeholderStyle={{ fontFamily: 'Poppins_Regular', color: Theme.colors.placeholderColor, fontSize: 14 }}
                  selectedTextStyle={{ fontFamily: 'Poppins_Regular', fontSize: 14, color: Theme.colors.black }}
                  itemTextStyle={{ fontFamily: 'Poppins_Regular', fontSize: 14, color: Theme.colors.black }}
                  itemContainerStyle={{ maxHeight: maxDropdownHeight }}
                  data={[{ label: 'Select Barangay', value: '' }, ...getBarangayOptions(reportData.Site_Location_Address_City_Municipality)]}
                  labelField="label"
                  valueField="value"
                  placeholder="Select Barangay"
                  value={reportData.Site_Location_Address_Barangay}
                  onChange={(item) => handleChange('Site_Location_Address_Barangay', item.value)}
                  containerStyle={{ maxHeight: maxDropdownHeight }}
                  disable={!canSubmit || !reportData.Site_Location_Address_City_Municipality}
                  renderRightIcon={() => (
                    <Ionicons name="chevron-down" size={20} color={Theme.colors.black} />
                  )}
                />
              </View>
              {errors.Site_Location_Address_Barangay && <Text style={GlobalStyles.errorText}>{errors.Site_Location_Address_Barangay}</Text>}

              {renderLabel('Date and Time Information was Gathered', true)}
               <View style={GlobalStyles.row}>
                <TouchableOpacity
                  style={[GlobalStyles.input, { flex: 1, marginBottom: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, errors.Date_of_Information_Gathered && GlobalStyles.inputError]}
                  onPress={() => canSubmit && setShowDatePicker((prev) => ({ ...prev, Date_of_Information_Gathered: true }))}
                >
                  <Text style={{ fontFamily: 'Poppins_Regular', color: reportData.Date_of_Information_Gathered ? Theme.colors.black : Theme.colors.placeholderColor }}>
                    {reportData.Date_of_Information_Gathered || 'Select Date'}
                  </Text>
                  <Ionicons name="calendar-outline" size={20} color={Theme.colors.black} />
                </TouchableOpacity>
                {showDatePicker.Date_of_Information_Gathered && (
                  <DateTimePicker
                    value={tempDate.Date_of_Information_Gathered || new Date()}
                    mode="date"
                    display="default"
                    onChange={(event, date) => handleDateChange('Date_of_Information_Gathered', event, date)}
                  />
                )}
                <TouchableOpacity
                  style={[GlobalStyles.input, { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, errors.Time_of_Information_Gathered && GlobalStyles.inputError]}
                  onPress={() => canSubmit && setShowTimePicker((prev) => ({ ...prev, Time_of_Information_Gathered: true }))}
                >
                  <Text style={{ fontFamily: 'Poppins_Regular', color: reportData.Time_of_Information_Gathered ? Theme.colors.black : Theme.colors.placeholderColor }}>
                    {reportData.Time_of_Information_Gathered || 'Select Time'}
                  </Text>
                  <Ionicons name="time-outline" size={20} color={Theme.colors.black} />
                </TouchableOpacity>
                {showTimePicker.Time_of_Information_Gathered && (
                  <DateTimePicker
                    value={tempDate.Time_of_Information_Gathered || new Date()}
                    mode="time"
                    display="default"
                    onChange={(event, time) => handleTimeChange('Time_of_Information_Gathered', event, time)}
                  />
                )}
              </View>
              {(errors.Date_of_Information_Gathered || errors.Time_of_Information_Gathered) && (
                <Text style={GlobalStyles.errorText}>{errors.Date_of_Information_Gathered || errors.Time_of_Information_Gathered}</Text>
              )}

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
              <TouchableOpacity
                style={[GlobalStyles.supplementaryButton, { marginTop: 10 }, !reportData.Local_Authorities_Persons_Contacted_for_Information && { opacity: 0.6 }]}
                onPress={() => handleAddAuthorityOrOrganization('authority')}
                disabled={!canSubmit || !reportData.Local_Authorities_Persons_Contacted_for_Information}
              >
                <Text style={GlobalStyles.supplementaryButtonText}>Add Authority</Text>
              </TouchableOpacity>
              {errors.Local_Authorities_Persons_Contacted_for_Information && <Text style={GlobalStyles.errorText}>{errors.Local_Authorities_Persons_Contacted_for_Information}</Text>}

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
              <TouchableOpacity
                style={[GlobalStyles.supplementaryButton, { marginTop: 10 }, !reportData.Name_of_the_Organizations_Involved && { opacity: 0.6 }]}
                onPress={() => handleAddAuthorityOrOrganization('organization')}
                disabled={!canSubmit || !reportData.Name_of_the_Organizations_Involved}
              >
                <Text style={GlobalStyles.supplementaryButtonText}>Add Organization</Text>
              </TouchableOpacity>
              {errors.Name_of_the_Organizations_Involved && <Text style={GlobalStyles.errorText}>{errors.Name_of_the_Organizations_Involved}</Text>}

             {authoritiesAndOrganizations.length > 0 && (
              <ScrollView horizontal showsHorizontalScrollIndicator={true}>
                <View style={styles.table}>
                  {/* Header Row */}
                  <View style={[styles.tableRow, { minWidth: 200, }]}>
                    <Text style={[styles.tableHeader, { minWidth: 200, borderTopLeftRadius: 10, textAlign: 'center' }]}>
                      AUTHORITIES/ PERSONS
                    </Text>
                    <Text style={[styles.tableHeader, { minWidth: 200, textAlign: 'center' }]}>
                      ORGANIZATIONS INVOLVED
                    </Text>
                    <Text style={[styles.tableHeader, { minWidth: 80, borderTopRightRadius: 10, textAlign: 'center' }]}>
                      ACTION
                    </Text>
                  </View>

                  {/* Data Rows */}
                  {authoritiesAndOrganizations.map((item, index) => (
                    <View key={index} style={[styles.tableRow, { minWidth: 300 }]}>
                      <Text style={[styles.tableCell, { minWidth: 200, textAlign: 'center' }]}>
                        {item.authority || ' '}
                      </Text>
                      <Text style={[styles.tableCell, { minWidth: 200, textAlign: 'center' }]}>
                        {item.organization || ' '}
                      </Text>
                      <TouchableOpacity
                        style={[styles.tableCell, { minWidth: 80, alignItems: 'center', textAlign: 'center' }]}
                        onPress={() => handleDelete(index, 'authorityOrg')}
                        disabled={!canSubmit}
                      >
                        <Ionicons name="trash" size={20} color="red" />
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              </ScrollView>
            )}

            </View>
            <View style={GlobalStyles.section}>
              <Text style={styles.sectionTitle}>Modality</Text>
              {renderLabel('Locations and Areas Affected (Province)', true)}
              <View ref={(ref) => (inputContainerRefs.Locations_and_Areas_Affected_Province = ref)} style={[GlobalStyles.input, styles.pickerContainer, errors.Locations_and_Areas_Affected_Province && GlobalStyles.inputError]}>
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
                  value={reportData.Locations_and_Areas_Affected_Province}
                  onChange={(item) => handleChange('Locations_and_Areas_Affected_Province', item.value)}
                  containerStyle={{ maxHeight: maxDropdownHeight }}
                  disable={!canSubmit}
                  renderRightIcon={() => (
                    <Ionicons name="chevron-down" size={20} color={Theme.colors.black} />
                  )}
                />
              </View>
              {errors.Locations_and_Areas_Affected_Province && <Text style={GlobalStyles.errorText}>{errors.Locations_and_Areas_Affected_Province}</Text>}

              {renderLabel('Locations and Areas Affected (City/Municipality)', true)}
              <View ref={(ref) => (inputContainerRefs.Locations_and_Areas_Affected_City_Municipality = ref)} style={[GlobalStyles.input, styles.pickerContainer, errors.Locations_and_Areas_Affected_City_Municipality && GlobalStyles.inputError]}>
                <Dropdown
                  style={{ padding: 10, width: '100%', fontFamily: 'Poppins_Regular' }}
                  placeholderStyle={{ fontFamily: 'Poppins_Regular', color: Theme.colors.placeholderColor, fontSize: 14 }}
                  selectedTextStyle={{ fontFamily: 'Poppins_Regular', fontSize: 14, color: Theme.colors.black }}
                  itemTextStyle={{ fontFamily: 'Poppins_Regular', fontSize: 14, color: Theme.colors.black }}
                  itemContainerStyle={{ maxHeight: maxDropdownHeight }}
                  data={[{ label: 'Select City/Municipality', value: '' }, ...getCityOptions(reportData.Locations_and_Areas_Affected_Province)]}
                  labelField="label"
                  valueField="value"
                  placeholder="Select City/Municipality"
                  value={reportData.Locations_and_Areas_Affected_City_Municipality}
                  onChange={(item) => handleChange('Locations_and_Areas_Affected_City_Municipality', item.value)}
                  containerStyle={{ maxHeight: maxDropdownHeight }}
                  disable={!canSubmit || !reportData.Locations_and_Areas_Affected_Province}
                  renderRightIcon={() => (
                    <Ionicons name="chevron-down" size={20} color={Theme.colors.black} />
                  )}
                />
              </View>
              {errors.Locations_and_Areas_Affected_City_Municipality && <Text style={GlobalStyles.errorText}>{errors.Locations_and_Areas_Affected_City_Municipality}</Text>}

              {renderLabel('Locations and Areas Affected (Barangay)', true)}
              <View ref={(ref) => (inputContainerRefs.Locations_and_Areas_Affected_Barangay = ref)} style={[GlobalStyles.input, styles.pickerContainer, errors.Locations_and_Areas_Affected_Barangay && GlobalStyles.inputError]}>
                <Dropdown
                  style={{ padding: 10, width: '100%', fontFamily: 'Poppins_Regular' }}
                  placeholderStyle={{ fontFamily: 'Poppins_Regular', color: Theme.colors.placeholderColor, fontSize: 14 }}
                  selectedTextStyle={{ fontFamily: 'Poppins_Regular', fontSize: 14, color: Theme.colors.black }}
                  itemTextStyle={{ fontFamily: 'Poppins_Regular', fontSize: 14, color: Theme.colors.black }}
                  itemContainerStyle={{ maxHeight: maxDropdownHeight }}
                  data={[{ label: 'Select Barangay', value: '' }, ...getBarangayOptions(reportData.Locations_and_Areas_Affected_City_Municipality)]}
                  labelField="label"
                  valueField="value"
                  placeholder="Select Barangay"
                  value={reportData.Locations_and_Areas_Affected_Barangay}
                  onChange={(item) => handleChange('Locations_and_Areas_Affected_Barangay', item.value)}
                  containerStyle={{ maxHeight: maxDropdownHeight }}
                  disable={!canSubmit || !reportData.Locations_and_Areas_Affected_City_Municipality}
                  renderRightIcon={() => (
                    <Ionicons name="chevron-down" size={20} color={Theme.colors.black} />
                  )}
                />
              </View>
              {errors.Locations_and_Areas_Affected_Barangay && <Text style={GlobalStyles.errorText}>{errors.Locations_and_Areas_Affected_Barangay}</Text>}

              <TouchableOpacity
                style={[GlobalStyles.supplementaryButton, { marginTop: 10 }, (!reportData.Locations_and_Areas_Affected_Province || !reportData.Locations_and_Areas_Affected_City_Municipality || !reportData.Locations_and_Areas_Affected_Barangay) && { opacity: 0.6 }]}
                onPress={handleAddAffectedLocation}
                disabled={!canSubmit || !reportData.Locations_and_Areas_Affected_Province || !reportData.Locations_and_Areas_Affected_City_Municipality || !reportData.Locations_and_Areas_Affected_Barangay}
              >
                <Text style={GlobalStyles.supplementaryButtonText}>Add Location</Text>
              </TouchableOpacity>
              {errors.Locations_and_Areas_Affected && <Text style={GlobalStyles.errorText}>{errors.Locations_and_Areas_Affected}</Text>}

             {affectedLocations.length > 0 && (
              <ScrollView horizontal showsHorizontalScrollIndicator={true}>
                <View style={styles.table}>
                  {/* Header Row */}
                  <View style={[styles.tableRow, { minWidth: 680 }]}>
                    <Text style={[styles.tableHeader, { minWidth: 200, borderTopLeftRadius: 10 }]}>
                      PROVINCE
                    </Text>
                    <Text style={[styles.tableHeader, { minWidth: 200 }]}>
                      CITY/MUNICIPALITY
                    </Text>
                    <Text style={[styles.tableHeader, { minWidth: 200 }]}>
                      BARANGAY
                    </Text>
                    <Text style={[styles.tableHeader, { minWidth: 80, borderTopRightRadius: 10 }]}>
                      ACTION
                    </Text>
                  </View>

                  {/* Data Rows */}
                  {affectedLocations.map((item, index) => (
                    <View key={index} style={[styles.tableRow, { minWidth: 680 }]}>
                      <Text style={[styles.tableCell, { minWidth: 200 }]}>
                        {item.province}
                      </Text>
                      <Text style={[styles.tableCell, { minWidth: 200 }]}>
                        {item.city}
                      </Text>
                      <Text style={[styles.tableCell, { minWidth: 200 }]}>
                        {item.barangay}
                      </Text>
                      <TouchableOpacity
                        style={[styles.tableCell, { minWidth: 80, alignItems: 'center' }]}
                        onPress={() => handleDelete(index, 'affectedLocation')}
                        disabled={!canSubmit}
                      >
                        <Ionicons name="trash" size={20} color="red" />
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              </ScrollView>
            )}

              {renderLabel('Type of Disaster', true)}
              <View
                style={[GlobalStyles.input, styles.pickerContainer, errors.Type_of_Disaster && GlobalStyles.inputError]}
                ref={(ref) => (inputContainerRefs.Type_of_Disaster = ref)}
              >
                <Dropdown
                  style={{ padding: 10, width: '100%', fontFamily: 'Poppins_Regular' }}
                  placeholderStyle={{ fontFamily: 'Poppins_Regular', color: Theme.colors.placeholderColor, fontSize: 14 }}
                  selectedTextStyle={{ fontFamily: 'Poppins_Regular', fontSize: 14, color: Theme.colors.black }}
                  itemTextStyle={{ fontFamily: 'Poppins_Regular', fontSize: 14, color: Theme.colors.black }}
                  itemContainerStyle={{ maxHeight: maxDropdownHeight }}
                  data={disasterTypes}
                  labelField="label"
                  valueField="value"
                  placeholder="Select Type of Disaster"
                  value={reportData.Type_of_Disaster}
                  onChange={(item) => handleChange('Type_of_Disaster', item.value)}
                  containerStyle={{ maxHeight: maxDropdownHeight }}
                  disable={!canSubmit}
                  renderRightIcon={() => (
                    <Ionicons name="chevron-down" size={20} color={Theme.colors.black} />
                  )}
                />
              </View>
              {errors.Type_of_Disaster && <Text style={GlobalStyles.errorText}>{errors.Type_of_Disaster}</Text>}

              {renderLabel('Date and Time of Occurrence', true)}
                <View style={GlobalStyles.row}>
                <TouchableOpacity
                  style={[GlobalStyles.input, { flex: 1, marginBottom: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, errors.Date_of_Occurrence && GlobalStyles.inputError]}
                  onPress={() => canSubmit && setShowDatePicker((prev) => ({ ...prev, Date_of_Occurrence: true }))}
                >
                  <Text style={{ fontFamily: 'Poppins_Regular', color: reportData.Date_of_Occurrence ? Theme.colors.black : Theme.colors.placeholderColor }}>
                    {reportData.Date_of_Occurrence || 'Select Date'}
                  </Text>
                  <Ionicons name="calendar-outline" size={20} color={Theme.colors.black} />
                </TouchableOpacity>
                {showDatePicker.Date_of_Occurrence && (
                  <DateTimePicker
                    value={tempDate.Date_of_Occurrence || new Date()}
                    mode="date"
                    display="default"
                    onChange={(event, date) => handleDateChange('Date_of_Occurrence', event, date)}
                  />
                )}
                <TouchableOpacity
                  style={[GlobalStyles.input, { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, errors.Time_of_Occurrence && GlobalStyles.inputError]}
                  onPress={() => canSubmit && setShowTimePicker((prev) => ({ ...prev, Time_of_Occurrence: true }))}
                >
                  <Text style={{ fontFamily: 'Poppins_Regular', color: reportData.Time_of_Occurrence ? Theme.colors.black : Theme.colors.placeholderColor }}>
                    {reportData.Time_of_Occurrence || 'Select Time'}
                  </Text>
                  <Ionicons name="time-outline" size={20} color={Theme.colors.black} />
                </TouchableOpacity>
                {showTimePicker.Time_of_Occurrence && (
                  <DateTimePicker
                    value={tempDate.Time_of_Occurrence || new Date()}
                    mode="time"
                    display="default"
                    onChange={(event, time) => handleTimeChange('Time_of_Occurrence', event, time)}
                  />
                )}
              </View>
              {(errors.Date_of_Occurrence || errors.Time_of_Occurrence) && (
                <Text style={GlobalStyles.errorText}>{errors.Date_of_Occurrence || errors.Time_of_Occurrence}</Text>
              )}

              {renderLabel('Summary of the Disaster', false)}
              <TextInput
                style={[GlobalStyles.textArea, errors.summary && GlobalStyles.inputError]}
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
          </View>

          {/* Step 2 */}
          <View style={[GlobalStyles.form, { display: currentSection === 1 ? 'flex' : 'none' }]}>
            <View style={GlobalStyles.section}>
              <Text style={styles.sectionTitle}>Initial Effects</Text>
              {renderLabel('Affected Municipalities/Communities', true)}
              <View ref={(ref) => (inputContainerRefs.community = ref)} style={[GlobalStyles.input, styles.pickerContainer, errors.community && GlobalStyles.inputError]}>
                <Dropdown
                  style={{ padding: 10, width: '100%', fontFamily: 'Poppins_Regular' }}
                  placeholderStyle={{ fontFamily: 'Poppins_Regular', color: Theme.colors.placeholderColor, fontSize: 14 }}
                  selectedTextStyle={{ fontFamily: 'Poppins_Regular', fontSize: 14, color: Theme.colors.black }}
                  itemTextStyle={{ fontFamily: 'Poppins_Regular', fontSize: 14, color: Theme.colors.black }}
                  itemContainerStyle={{ maxHeight: maxDropdownHeight }}
                  data={[{ label: 'Select Municipality', value: '' }, ...getCityOptions(reportData.Site_Location_Address_Province)]}
                  labelField="label"
                  valueField="value"
                  placeholder="Select Municipality"
                  value={reportData.community}
                  onChange={(item) => handleChange('community', item.value)}
                  containerStyle={{ maxHeight: maxDropdownHeight }}
                  disable={!canSubmit || !reportData.Site_Location_Address_Province}
                  renderRightIcon={() => (
                    <Ionicons name="chevron-down" size={20} color={Theme.colors.black} />
                  )}
                />
              </View>
              {errors.community && <Text style={GlobalStyles.errorText}>{errors.community}</Text>}

              {renderLabel('Total Population', true)}
              <TextInput
                style={[GlobalStyles.input, errors.totalPop && GlobalStyles.inputError]}
                placeholder="Enter Total Population"
                placeholderTextColor={Theme.colors.placeholderColor}
                keyboardType="numeric"
                onChangeText={(val) => handleChange('totalPop', val)}
                value={reportData.totalPop}
                editable={canSubmit}
              />
              {errors.totalPop && <Text style={GlobalStyles.errorText}>{errors.totalPop}</Text>}

              {renderLabel('Affected Population', true)}
              <TextInput
                style={[GlobalStyles.input, errors.affected && GlobalStyles.inputError]}
                placeholder="Enter Affected Population"
                placeholderTextColor={Theme.colors.placeholderColor}
                keyboardType="numeric"
                onChangeText={(val) => handleChange('affected', val)}
                value={reportData.affected}
                editable={canSubmit}
              />
              {errors.affected && <Text style={GlobalStyles.errorText}>{errors.affected}</Text>}

              {renderLabel('Number of Deaths', true)}
              <TextInput
                style={[GlobalStyles.input, errors.deaths && GlobalStyles.inputError]}
                placeholder="Enter Number of Deaths"
                placeholderTextColor={Theme.colors.placeholderColor}
                keyboardType="numeric"
                onChangeText={(val) => handleChange('deaths', val)}
                value={reportData.deaths}
                editable={canSubmit}
              />
              {errors.deaths && <Text style={GlobalStyles.errorText}>{errors.deaths}</Text>}

              {renderLabel('Number of Injured', true)}
              <TextInput
                style={[GlobalStyles.input, errors.injured && GlobalStyles.inputError]}
                placeholder="Enter Number of Injured"
                placeholderTextColor={Theme.colors.placeholderColor}
                keyboardType="numeric"
                onChangeText={(val) => handleChange('injured', val)}
                value={reportData.injured}
                editable={canSubmit}
              />
              {errors.injured && <Text style={GlobalStyles.errorText}>{errors.injured}</Text>}

              {renderLabel('Number of Missing', true)}
              <TextInput
                style={[GlobalStyles.input, errors.missing && GlobalStyles.inputError]}
                placeholder="Enter Number of Missing"
                placeholderTextColor={Theme.colors.placeholderColor}
                keyboardType="numeric"
                onChangeText={(val) => handleChange('missing', val)}
                value={reportData.missing}
                editable={canSubmit}
              />
              {errors.missing && <Text style={GlobalStyles.errorText}>{errors.missing}</Text>}

              {renderLabel('Number of Affected Children', true)}
              <TextInput
                style={[GlobalStyles.input, errors.children && GlobalStyles.inputError]}
                placeholder="Enter Number of Affected Children"
                placeholderTextColor={Theme.colors.placeholderColor}
                keyboardType="numeric"
                onChangeText={(val) => handleChange('children', val)}
                value={reportData.children}
                editable={canSubmit}
              />
              {errors.children && <Text style={GlobalStyles.errorText}>{errors.children}</Text>}

              {renderLabel('Number of Affected Women', true)}
              <TextInput
                style={[GlobalStyles.input, errors.women && GlobalStyles.inputError]}
                placeholder="Enter Number of Affected Women"
                placeholderTextColor={Theme.colors.placeholderColor}
                keyboardType="numeric"
                onChangeText={(val) => handleChange('women', val)}
                value={reportData.women}
                editable={canSubmit}
              />
              {errors.women && <Text style={GlobalStyles.errorText}>{errors.women}</Text>}

              {renderLabel('Number of Affected Senior Citizens', true)}
              <TextInput
                style={[GlobalStyles.input, errors.seniors && GlobalStyles.inputError]}
                placeholder="Enter Number of Affected Senior Citizens"
                placeholderTextColor={Theme.colors.placeholderColor}
                keyboardType="numeric"
                onChangeText={(val) => handleChange('seniors', val)}
                value={reportData.seniors}
                editable={canSubmit}
              />
              {errors.seniors && <Text style={GlobalStyles.errorText}>{errors.seniors}</Text>}

              {renderLabel('Number of Affected Persons with Disabilities', true)}
              <TextInput
                style={[GlobalStyles.input, errors.pwd && GlobalStyles.inputError]}
                placeholder="Enter Number of Affected PWD"
                placeholderTextColor={Theme.colors.placeholderColor}
                keyboardType="numeric"
                onChangeText={(val) => handleChange('pwd', val)}
                value={reportData.pwd}
                editable={canSubmit}
              />
              {errors.pwd && <Text style={GlobalStyles.errorText}>{errors.pwd}</Text>}

              {(errors.casualties || errors.demographics) && (
                <Text style={GlobalStyles.errorText}>{errors.casualties || errors.demographics}</Text>
              )}

              <TouchableOpacity
                style={[GlobalStyles.supplementaryButton, { marginTop: 10 }, (!reportData.community || !reportData.totalPop || !reportData.affected || !reportData.deaths || !reportData.injured || !reportData.missing || !reportData.children || !reportData.women || !reportData.seniors || !reportData.pwd) && { opacity: 0.6 }]}
                onPress={handleAddMunicipality}
                disabled={!canSubmit || !reportData.community || !reportData.totalPop || !reportData.affected || !reportData.deaths || !reportData.injured || !reportData.missing || !reportData.children || !reportData.women || !reportData.seniors || !reportData.pwd}
              >
                <Text style={GlobalStyles.supplementaryButtonText}>Add Municipality</Text>
              </TouchableOpacity>
              {errors.Affected_Municipalities && <Text style={GlobalStyles.errorText}>{errors.Affected_Municipalities}</Text>}

              {affectedMunicipalities.length > 0 && (
                <ScrollView horizontal showsHorizontalScrollIndicator={true}>
                  <View style={styles.table}>
                    <View style={[styles.tableRow, { minWidth: 1080 }]}>
                      <Text style={[styles.tableHeader, { minWidth: 200, borderTopLeftRadius: 10 }]}>MUNICIPALITY</Text>
                      <Text style={[styles.tableHeader, { minWidth: 100 }]}>TOTAL POP.</Text>
                      <Text style={[styles.tableHeader, { minWidth: 100 }]}>AFFECTED</Text>
                      <Text style={[styles.tableHeader, { minWidth: 100 }]}>DEATHS</Text>
                      <Text style={[styles.tableHeader, { minWidth: 100 }]}>INJURED</Text>
                      <Text style={[styles.tableHeader, { minWidth: 100 }]}>MISSING</Text>
                      <Text style={[styles.tableHeader, { minWidth: 100 }]}>CHILDREN</Text>
                      <Text style={[styles.tableHeader, { minWidth: 100 }]}>WOMEN</Text>
                      <Text style={[styles.tableHeader, { minWidth: 100 }]}>SENIORS</Text>
                      <Text style={[styles.tableHeader, { minWidth: 100 }]}>PWD</Text>
                      <Text style={[styles.tableHeader, { minWidth: 80, borderTopRightRadius: 10 }]}>ACTION</Text>
                    </View>
                    {affectedMunicipalities.map((item, index) => (
                      <View key={index} style={[styles.tableRow, { minWidth: 1080 }]}>
                        <Text style={[styles.tableCell, { minWidth: 200 }]}>{item.community}</Text>
                        <Text style={[styles.tableCell, { minWidth: 100 }]}>{item.totalPop}</Text>
                        <Text style={[styles.tableCell, { minWidth: 100 }]}>{item.affected}</Text>
                        <Text style={[styles.tableCell, { minWidth: 100 }]}>{item.deaths}</Text>
                        <Text style={[styles.tableCell, { minWidth: 100 }]}>{item.injured}</Text>
                        <Text style={[styles.tableCell, { minWidth: 100 }]}>{item.missing}</Text>
                        <Text style={[styles.tableCell, { minWidth: 100 }]}>{item.children}</Text>
                        <Text style={[styles.tableCell, { minWidth: 100 }]}>{item.women}</Text>
                        <Text style={[styles.tableCell, { minWidth: 100 }]}>{item.seniors}</Text>
                        <Text style={[styles.tableCell, { minWidth: 100 }]}>{item.pwd}</Text>
                        <TouchableOpacity
                          style={[styles.tableCell, { minWidth: 80, alignItems: 'center' }]}
                          onPress={() => handleDelete(index, 'municipality')}
                          disabled={!canSubmit}
                        >
                          <Ionicons name="trash" size={20} color="red" />
                        </TouchableOpacity>
                      </View>
                    ))}
                  </View>
                </ScrollView>
              )}
            </View>
          </View>

          {/* Step 3 */}
          <View style={[GlobalStyles.form, { display: currentSection === 2 ? 'flex' : 'none' }]}>
            <View style={GlobalStyles.section}>
              <Text style={styles.sectionTitle}>Status of Lifelines</Text>
              {Object.keys(LIFELINE_STATUS_OPTIONS).map((lifeline) => (
                <View key={lifeline}>
                  {renderLabel(lifeline, false)}
                  <View style={[GlobalStyles.input, styles.pickerContainer, errors[`${lifeline.toLowerCase().replace(/, /g, '').replace(/\s/g, '')}Status`] && GlobalStyles.inputError]}>
                    <Dropdown
                      style={{ padding: 10, width: '100%', fontFamily: 'Poppins_Regular' }}
                      placeholderStyle={{ fontFamily: 'Poppins_Regular', color: Theme.colors.placeholderColor, fontSize: 14 }}
                      selectedTextStyle={{ fontFamily: 'Poppins_Regular', fontSize: 14, color: Theme.colors.black }}
                      itemTextStyle={{ fontFamily: 'Poppins_Regular', fontSize: 14, color: Theme.colors.black }}
                      itemContainerStyle={{ maxHeight: maxDropdownHeight }}
                      data={LIFELINE_STATUS_OPTIONS[lifeline]}
                      labelField="label"
                      valueField="value"
                      placeholder={`Select ${lifeline} Status`}
                      value={reportData[`${lifeline.toLowerCase().replace(/, /g, '').replace(/\s/g, '')}Status`]}
                      onChange={(item) => handleChange(`${lifeline.toLowerCase().replace(/, /g, '').replace(/\s/g, '')}Status`, item.value)}
                      containerStyle={{ maxHeight: maxDropdownHeight }}
                      disable={!canSubmit}
                      renderRightIcon={() => (
                        <Ionicons name="chevron-down" size={20} color={Theme.colors.black} />
                      )}
                    />
                  </View>
                  {errors[`${lifeline.toLowerCase().replace(/, /g, '').replace(/\s/g, '')}Status`] && (
                    <Text style={GlobalStyles.errorText}>{errors[`${lifeline.toLowerCase().replace(/, /g, '').replace(/\s/g, '')}Status`]}</Text>
                  )}
                </View>
              ))}
            </View>
          </View>

          {/* Step 4 */}
          <View style={[GlobalStyles.form, { display: currentSection === 3 ? 'flex' : 'none' }]}>
            <View style={GlobalStyles.section}>
              <Text style={styles.sectionTitle}>Checklist of Immediate Needs</Text>
              <View style={styles.checklistContainer}>
                {Object.keys(checklist).map((key) => (
                  <TouchableOpacity
                    key={key}
                    style={[styles.checklistItem, checklist[key] && styles.checklistItemSelected]}
                    onPress={() => handleNeedsSelect(key)}
                    disabled={!canSubmit}
                  >
                    <Text style={[styles.checklistText, checklist[key] && styles.checklistTextSelected]}>
                      {key.replace(/([A-Z])/g, ' $1').replace(/^./, (str) => str.toUpperCase())}
                    </Text>
                    {checklist[key] && <Ionicons name="checkmark-circle" size={20} color={Theme.colors.accent} />}
                  </TouchableOpacity>
                ))}
              </View>

              {renderLabel('Other Immediate Needs', false)}
              <TextInput
                style={[GlobalStyles.input, errors.otherNeeds && GlobalStyles.inputError]}
                placeholder="Enter Other Needs"
                placeholderTextColor={Theme.colors.placeholderColor}
                onChangeText={(val) => handleChange('otherNeeds', val)}
                value={reportData.otherNeeds}
                editable={canSubmit}
              />
              {errors.otherNeeds && <Text style={GlobalStyles.errorText}>{errors.otherNeeds}</Text>}

              {renderLabel('Estimated Quantity', false)}
              <TextInput
                style={[GlobalStyles.input, errors.estQty && GlobalStyles.inputError]}
                placeholder="Enter Estimated Quantity"
                placeholderTextColor={Theme.colors.placeholderColor}
                keyboardType="numeric"
                onChangeText={(val) => handleChange('estQty', val)}
                value={reportData.estQty}
                editable={canSubmit}
              />
              {errors.estQty && <Text style={GlobalStyles.errorText}>{errors.estQty}</Text>}

              <TouchableOpacity
                style={[GlobalStyles.supplementaryButton, { marginTop: 10 }, (!reportData.otherNeeds || !reportData.estQty) && { opacity: 0.6 }]}
                onPress={handleAddImmediateNeed}
                disabled={!canSubmit || !reportData.otherNeeds || !reportData.estQty}
              >
                <Text style={GlobalStyles.supplementaryButtonText}>Add Need</Text>
              </TouchableOpacity>

              {immediateNeeds.length > 0 && (
                <ScrollView horizontal showsHorizontalScrollIndicator={true}>
                  <View style={styles.table}>
                    <View style={[styles.tableRow, { minWidth: 480 }]}>
                      <Text style={[styles.tableHeader, { minWidth: 200, borderTopLeftRadius: 10 }]}>NEED</Text>
                      <Text style={[styles.tableHeader, { minWidth: 200 }]}>QUANTITY</Text>
                      <Text style={[styles.tableHeader, { minWidth: 80, borderTopRightRadius: 10 }]}>ACTION</Text>
                    </View>
                    {immediateNeeds.map((item, index) => (
                      <View key={index} style={[styles.tableRow, { minWidth: 480 }]}>
                        <Text style={[styles.tableCell, { minWidth: 200 }]}>{item.need}</Text>
                        <Text style={[styles.tableCell, { minWidth: 200 }]}>{item.qty}</Text>
                        <TouchableOpacity
                          style={[styles.tableCell, { minWidth: 80, alignItems: 'center' }]}
                          onPress={() => handleDelete(index, 'immediateNeed')}
                          disabled={!canSubmit}
                        >
                          <Ionicons name="trash" size={20} color="red" />
                        </TouchableOpacity>
                      </View>
                    ))}
                  </View>
                </ScrollView>
              )}
            </View>

            <View style={GlobalStyles.section}>
              <Text style={styles.sectionTitle}>Initial Response</Text>
              {renderLabel('Response Group', true)}
              <TextInput
                style={[GlobalStyles.input, errors.responseGroup && GlobalStyles.inputError]}
                placeholder="Enter Response Group"
                placeholderTextColor={Theme.colors.placeholderColor}
                onChangeText={(val) => handleChange('responseGroup', val)}
                value={reportData.responseGroup}
                editable={canSubmit}
              />
              {errors.responseGroup && <Text style={GlobalStyles.errorText}>{errors.responseGroup}</Text>}

              {renderLabel('Relief Assistance Deployed', true)}
              <TextInput
                style={[GlobalStyles.input, errors.reliefDeployed && GlobalStyles.inputError]}
                placeholder="Enter Relief Assistance"
                placeholderTextColor={Theme.colors.placeholderColor}
                onChangeText={(val) => handleChange('reliefDeployed', val)}
                value={reportData.reliefDeployed}
                editable={canSubmit}
              />
              {errors.reliefDeployed && <Text style={GlobalStyles.errorText}>{errors.reliefDeployed}</Text>}

              {renderLabel('Number of Families Served', true)}
              <TextInput
                style={[GlobalStyles.input, errors.familiesServed && GlobalStyles.inputError]}
                placeholder="Enter Number of Families Served"
                placeholderTextColor={Theme.colors.placeholderColor}
                keyboardType="numeric"
                onChangeText={(val) => handleChange('familiesServed', val)}
                value={reportData.familiesServed}
                editable={canSubmit}
              />
              {errors.familiesServed && <Text style={GlobalStyles.errorText}>{errors.familiesServed}</Text>}

              <TouchableOpacity
                style={[GlobalStyles.supplementaryButton, { marginTop: 10 }, (!reportData.responseGroup || !reportData.reliefDeployed || !reportData.familiesServed) && { opacity: 0.6 }]}
                onPress={handleAddInitialResponse}
                disabled={!canSubmit || !reportData.responseGroup || !reportData.reliefDeployed || !reportData.familiesServed}
              >
                <Text style={GlobalStyles.supplementaryButtonText}>Add Response</Text>
              </TouchableOpacity>

              {initialResponse.length > 0 && (
                <ScrollView horizontal showsHorizontalScrollIndicator={true}>
                  <View style={styles.table}>
                    <View style={[styles.tableRow, { minWidth: 680 }]}>
                      <Text style={[styles.tableHeader, { minWidth: 200, borderTopLeftRadius: 10 }]}>RESPONSE GROUP</Text>
                      <Text style={[styles.tableHeader, { minWidth: 200 }]}>RELIEF ASSISTANCE</Text>
                      <Text style={[styles.tableHeader, { minWidth: 200 }]}>FAMILIES SERVED</Text>
                      <Text style={[styles.tableHeader, { minWidth: 80, borderTopRightRadius: 10 }]}>ACTION</Text>
                    </View>
                    {initialResponse.map((item, index) => (
                      <View key={index} style={[styles.tableRow, { minWidth: 680 }]}>
                        <Text style={[styles.tableCell, { minWidth: 200 }]}>{item.group}</Text>
                        <Text style={[styles.tableCell, { minWidth: 200 }]}>{item.assistance}</Text>
                        <Text style={[styles.tableCell, { minWidth: 200 }]}>{item.families}</Text>
                        <TouchableOpacity
                          style={[styles.tableCell, { minWidth: 80, alignItems: 'center' }]}
                          onPress={() => handleDelete(index, 'initialResponse')}
                          disabled={!canSubmit}
                        >
                          <Ionicons name="trash" size={20} color="red" />
                        </TouchableOpacity>
                      </View>
                    ))}
                  </View>
                </ScrollView>
              )}
            </View>
          </View>

          {/* Navigation Buttons */}
          <View style={[GlobalStyles.buttonContainer, { marginTop: 20, marginBottom: 20 }]}>
            {currentSection > 0 && (
              <TouchableOpacity
                style={[GlobalStyles.button, GlobalStyles.backButton]}
                onPress={() => handleNavigation('back')}
              >
                <Text style={GlobalStyles.buttonText}>Back</Text>
              </TouchableOpacity>
            )}
            {currentSection < sections.length - 1 ? (
              <TouchableOpacity
                style={[GlobalStyles.button, GlobalStyles.submitButton]}
                onPress={() => handleNavigation('next')}
              >
                <Text style={GlobalStyles.buttonText}>Next</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={[GlobalStyles.button, GlobalStyles.submitButton]}
                onPress={handleSubmit}
              >
                <Text style={GlobalStyles.buttonText}>Proceed</Text>
              </TouchableOpacity>
            )}
          </View>
        </ScrollView>

        {/* Delete Confirmation Modal */}
        <CustomModal
          visible={deleteModalVisible}
          title="Confirm Delete"
          message="Are you sure you want to delete this entry?"
          onConfirm={confirmDelete}
          onCancel={cancelDelete}
          confirmText="Delete"
          cancelText="Cancel"
        />

        {/* General Modal */}
        <OperationCustomModal
          visible={modalVisible}
          title={modalConfig.title}
          message={modalConfig.message}
          onConfirm={modalConfig.onConfirm}
          confirmText={modalConfig.confirmText}
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default RDANAScreen;