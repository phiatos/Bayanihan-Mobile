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
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import GlobalStyles from '../styles/GlobalStyles';
import RDANAStyles from '../styles/RDANAStyles';
import { ScrollView } from 'react-native-gesture-handler';
import Theme from '../constants/theme';

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
    // profile
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

    // affected communities
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

    // 


    residentialHousesStatus: route.params?.reportData?.residentialHousesStatus || '',
    transportationAndMobilityStatus: route.params?.reportData?.transportationAndMobilityStatus || '',
    electricityPowerGridStatus: route.params?.reportData?.electricityPowerGridStatus || '',
    communicationNetworksInternetStatus: route.params?.reportData?.communicationNetworksInternetStatus || '',
    hospitalsRuralHealthUnitsStatus: route.params?.reportData?.hospitalsRuralHealthUnitsStatus || '',
    waterSupplySystemStatus: route.params?.reportData?.waterSupplySystemStatus || '',
    marketBusinessAndCommercialEstablishmentsStatus: route.params?.reportData?.marketBusinessAndCommercialEstablishmentsStatus || '',
    othersStatus: route.params?.reportData?.othersStatus || '',
    reliefPacks: route.params?.reportData?.reliefPacks || 'False',
    hotMeals: route.params?.reportData?.hotMeals || 'False',
    hygieneKits: route.params?.reportData?.hygieneKits || 'False',
    drinkingWater: route.params?.reportData?.drinkingWater || 'False',
    ricePacks: route.params?.reportData?.ricePacks || 'False',
    otherImmediateNeeds: route.params?.reportData?.otherImmediateNeeds || '',
    estimatedQuantity: route.params?.reportData?.estimatedQuantity || '',
    responseGroupsInvolved: route.params?.reportData?.responseGroupsInvolved || '',
    reliefAssistanceDeployed: route.params?.reportData?.reliefAssistanceDeployed || '',
    numberOfFamiliesServed: route.params?.reportData?.numberOfFamiliesServed || '',
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

  // States for dropdowns
  const [isDisasterDropdownVisible, setIsDisasterDropdownVisible] = useState(false);
  const [filteredDisasterTypes, setFilteredDisasterTypes] = useState(disasterTypes);
  const disasterInputRef = useRef(null);

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
  const disasterTypes = ['Earthquake', 'Typhoon', 'Flood', 'Landslide', 'Fire'];

  // Table data for affected municipalities
  const [affectedMunicipalities, setAffectedMunicipalities] = useState(route.params?.affectedMunicipalities || []);

  // Required fields
  const requiredFields = [
    // profile
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
    // Initial effects
    'affected',
    'children',
    'community',
    'deaths',
    'injured',
    'missing',
    'pwd',
    'seniors',
    'totalPop',
    'women',
    // initial response
    'reliefDeployed',
    'responseGroup',
    'familiesServed',
  ];

  // Helper function to capitalize first letter
  const capitalizeFirstLetter = (string) => {
    if (!string) return string;
    return string.charAt(0).toUpperCase() + string.slice(1);
  };

  // Scroll to input
  const scrollToInput = (field) => {
    inputContainerRefs[field]?.measure((x, y, width, height, pageX, pageY) => {
      // Implement custom scrolling if needed
    });
  };

  // Handle TextInput and picker changes
  const handleChange = (field, value) => {
    setReportData((prev) => ({ ...prev, [field]: value }));

    if (value.trim() !== '') {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }

    if (field === 'Type_of_Disaster') {
      if (value.trim() === '') {
        setFilteredDisasterTypes(disasterTypes);
        setIsDisasterDropdownVisible(true);
      } else {
        const filtered = disasterTypes.filter((type) =>
          type.toLowerCase().includes(value.toLowerCase())
        );
        setFilteredDisasterTypes(filtered);
        setIsDisasterDropdownVisible(true);
      }
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

  // Handle disaster type selection
  const handleDisasterSelect = (type) => {
    setReportData((prev) => ({ ...prev, Type_of_Disaster: type }));
    setIsDisasterDropdownVisible(false);
    setErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors.Type_of_Disaster;
      return newErrors;
    });
    disasterInputRef.current?.blur();
  };

  // Render label with asterisk for required fields
  const renderLabel = (label, isRequired) => (
    <Text style={RDANAStyles.formTitle}>
      {label}
      {isRequired && <Text style={{ color: 'red' }}>*</Text>}
    </Text>
  );

  const windowHeight = Dimensions.get('window').height;

  return (
    <View style={RDANAStyles.container}>
      <View style={GlobalStyles.headerContainer}>
        <TouchableOpacity
          onPress={() => navigation.openDrawer()}
          style={GlobalStyles.headerMenuIcon}
        >
          <Ionicons name="menu" size={32} color="white" />
        </TouchableOpacity>
        <Text style={GlobalStyles.headerTitle}>RDANA</Text>
      </View>

      <SafeAreaView style={{ flex: 1 }} edges={['left', 'right', 'bottom']}>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 20}
        >
          <ScrollView style={RDANAStyles.scrollViewContent}>
            <View style={RDANAStyles.form}>
              <View style={RDANAStyles.section}>
                <Text style={RDANAStyles.sectionTitle}>Profile of the Disaster</Text>
                {renderLabel('Site Location/Address (Barangay)', true)}
                <View ref={(ref) => (inputContainerRefs.Site_Location_Address_Barangay = ref)}>
                  <TextInput
                    style={[RDANAStyles.input, errors.Site_Location_Address_Barangay && RDANAStyles.requiredInput]}
                    placeholder="Enter Affected Barangay"
                    onChangeText={(val) => handleChange('Site_Location_Address_Barangay', val)}
                    value={reportData.Site_Location_Address_Barangay}
                    onFocus={() => scrollToInput('Site_Location_Address_Barangay')}
                  />
                </View>
                {errors.Site_Location_Address_Barangay && <Text style={RDANAStyles.errorText}>{errors.Site_Location_Address_Barangay}</Text>}

                {renderLabel('Site Location/Address (City/Municipality)', true)}
                <View ref={(ref) => (inputContainerRefs.Site_Location_Address_City_Municipality = ref)}>
                  <TextInput
                    style={[RDANAStyles.input, errors.Site_Location_Address_City_Municipality && RDANAStyles.requiredInput]}
                    placeholder="Enter Affected City/Municipality"
                    onChangeText={(val) => handleChange('Site_Location_Address_City_Municipality', val)}
                    value={reportData.Site_Location_Address_City_Municipality}
                    onFocus={() => scrollToInput('Site_Location_Address_City_Municipality')}
                  />
                </View>
                {errors.Site_Location_Address_City_Municipality && <Text style={RDANAStyles.errorText}>{errors.Site_Location_Address_City_Municipality}</Text>}

                {renderLabel('Site Location/Address (Province)', true)}
                <View ref={(ref) => (inputContainerRefs.Site_Location_Address_Province = ref)}>
                  <TextInput
                    style={[RDANAStyles.input, errors.Site_Location_Address_Province && RDANAStyles.requiredInput]}
                    placeholder="Enter Affected Province"
                    onChangeText={(val) => handleChange('Site_Location_Address_Province', val)}
                    value={reportData.Site_Location_Address_Province}
                    onFocus={() => scrollToInput('Site_Location_Address_Province')}
                  />
                </View>
                {errors.Site_Location_Address_Province && <Text style={RDANAStyles.errorText}>{errors.Site_Location_Address_Province}</Text>}

                {renderLabel('Local Authorities/Persons Contacted', true)}
                <View ref={(ref) => (inputContainerRefs.Local_Authorities_Persons_Contacted_for_Information = ref)}>
                  <TextInput
                    style={[RDANAStyles.input, errors.Local_Authorities_Persons_Contacted_for_Information && RDANAStyles.requiredInput]}
                    placeholder="Enter Names"
                    onChangeText={(val) => handleChange('Local_Authorities_Persons_Contacted_for_Information', val)}
                    value={reportData.Local_Authorities_Persons_Contacted_for_Information}
                    onFocus={() => scrollToInput('Local_Authorities_Persons_Contacted_for_Information')}
                  />
                </View>
                {errors.Local_Authorities_Persons_Contacted_for_Information && <Text style={RDANAStyles.errorText}>{errors.Local_Authorities_Persons_Contacted_for_Information}</Text>}

                {renderLabel('Date of Information Gathered', true)}
                <View ref={(ref) => (inputContainerRefs.Date_of_Information_Gathered = ref)}>
                  <TouchableOpacity
                    style={[RDANAStyles.input, errors.Date_of_Information_Gathered && RDANAStyles.requiredInput, { flexDirection: 'row', alignItems: 'center' }]}
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
                {errors.Date_of_Information_Gathered && <Text style={RDANAStyles.errorText}>{errors.Date_of_Information_Gathered}</Text>}

                {renderLabel('Time of Information Gathered', true)}
                <View ref={(ref) => (inputContainerRefs.Time_of_Information_Gathered = ref)}>
                  <TouchableOpacity
                    style={[RDANAStyles.input, errors.Time_of_Information_Gathered && RDANAStyles.requiredInput, { flexDirection: 'row', alignItems: 'center' }]}
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
                {errors.Time_of_Information_Gathered && <Text style={RDANAStyles.errorText}>{errors.Time_of_Information_Gathered}</Text>}

                {renderLabel('Name of Organization Involved', true)}
                <View ref={(ref) => (inputContainerRefs.Name_of_the_Organizations_Involved = ref)}>
                  <TextInput
                    style={[RDANAStyles.input, errors.Name_of_the_Organizations_Involved && RDANAStyles.requiredInput]}
                    placeholder="Enter Name of Organization"
                    onChangeText={(val) => handleChange('Name_of_the_Organizations_Involved', val)}
                    value={reportData.Name_of_the_Organizations_Involved}
                    onFocus={() => scrollToInput('Name_of_the_Organizations_Involved')}
                  />
                </View>
                {errors.Name_of_the_Organizations_Involved && <Text style={RDANAStyles.errorText}>{errors.Name_of_the_Organizations_Involved}</Text>}
              </View>

              <View style={RDANAStyles.section}>
                <Text style={RDANAStyles.sectionTitle}>Modality</Text>
                {renderLabel('Locations and Areas Affected (Barangay)', true)}
                <View ref={(ref) => (inputContainerRefs.Locations_and_Areas_Affected_Barangay = ref)}>
                  <TextInput
                    style={[RDANAStyles.input, errors.Locations_and_Areas_Affected_Barangay && RDANAStyles.requiredInput]}
                    placeholder="Enter Barangay"
                    onChangeText={(val) => handleChange('Locations_and_Areas_Affected_Barangay', val)}
                    value={reportData.Locations_and_Areas_Affected_Barangay}
                    onFocus={() => scrollToInput('Locations_and_Areas_Affected_Barangay')}
                  />
                </View>
                {errors.Locations_and_Areas_Affected_Barangay && <Text style={RDANAStyles.errorText}>{errors.Locations_and_Areas_Affected_Barangay}</Text>}

                {renderLabel('Locations and Areas Affected (City/Municipality)', true)}
                <View ref={(ref) => (inputContainerRefs.Locations_and_Areas_Affected_City_Municipality = ref)}>
                  <TextInput
                    style={[RDANAStyles.input, errors.Locations_and_Areas_Affected_City_Municipality && RDANAStyles.requiredInput]}
                    placeholder="Enter City/Municipality"
                    onChangeText={(val) => handleChange('Locations_and_Areas_Affected_City_Municipality', val)}
                    value={reportData.Locations_and_Areas_Affected_City_Municipality}
                    onFocus={() => scrollToInput('Locations_and_Areas_Affected_City_Municipality')}
                  />
                </View>
                {errors.Locations_and_Areas_Affected_City_Municipality && <Text style={RDANAStyles.errorText}>{errors.Locations_and_Areas_Affected_City_Municipality}</Text>}

                {renderLabel('Locations and Areas Affected (Province)', true)}
                <View ref={(ref) => (inputContainerRefs.Locations_and_Areas_Affected_Province = ref)}>
                  <TextInput
                    style={[RDANAStyles.input, errors.Locations_and_Areas_Affected_Province && RDANAStyles.requiredInput]}
                    placeholder="Enter Province"
                    onChangeText={(val) => handleChange('Locations_and_Areas_Affected_Province', val)}
                    value={reportData.Locations_and_Areas_Affected_Province}
                    onFocus={() => scrollToInput('Locations_and_Areas_Affected_Province')}
                  />
                </View>
                {errors.Locations_and_Areas_Affected_Province && <Text style={RDANAStyles.errorText}>{errors.Locations_and_Areas_Affected_Province}</Text>}

                {renderLabel('Type of Disaster', true)}
                <View style={{ position: 'relative', zIndex: 2000 }} ref={(ref) => (inputContainerRefs.Type_of_Disaster = ref)}>
                  <TextInput
                    ref={disasterInputRef}
                    style={[RDANAStyles.input, errors.Type_of_Disaster && RDANAStyles.requiredInput]}
                    placeholder="Select Disaster Type"
                    onChangeText={(val) => handleChange('Type_of_Disaster', val)}
                    value={reportData.Type_of_Disaster}
                    onFocus={() => {
                      setIsDisasterDropdownVisible(true);
                      setFilteredDisasterTypes(disasterTypes);
                      scrollToInput('typeOfType_of_DisasterDisaster');
                    }}
                    onBlur={() => setTimeout(() => setIsDisasterDropdownVisible(false), 200)}
                  />
                  {isDisasterDropdownVisible && filteredDisasterTypes.length > 0 && (
                    <View style={[RDANAStyles.dropdownContainer, { maxHeight: windowHeight * 0.3, zIndex: 3000 }]}>
                      <FlatList
                        data={filteredDisasterTypes}
                        keyExtractor={(item) => item}
                        nestedScrollEnabled
                        renderItem={({ item }) => (
                          <TouchableOpacity
                            style={RDANAStyles.dropdownItem}
                            onPress={() => handleDisasterSelect(item)}
                          >
                            <Text style={RDANAStyles.dropdownItemText}>{item}</Text>
                          </TouchableOpacity>
                        )}
                      />
                    </View>
                  )}
                </View>
                {errors.Type_of_Disaster && <Text style={RDANAStyles.errorText}>{errors.Type_of_Disaster}</Text>}

                {renderLabel('Date of Occurrence', true)}
                <View ref={(ref) => (inputContainerRefs.Date_of_Occurrence = ref)}>
                  <TouchableOpacity
                    style={[RDANAStyles.input, errors.Date_of_Occurrence && RDANAStyles.requiredInput, { flexDirection: 'row', alignItems: 'center' }]}
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
                {errors.Date_of_Occurrence && <Text style={RDANAStyles.errorText}>{errors.Date_of_Occurrence}</Text>}

                {renderLabel('Time of Occurrence', true)}
                <View ref={(ref) => (inputContainerRefs.Time_of_Occurrence = ref)}>
                  <TouchableOpacity
                    style={[RDANAStyles.input, errors.Time_of_Occurrence && RDANAStyles.requiredInput, { flexDirection: 'row', alignItems: 'center' }]}
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
                {errors.Time_of_Occurrence && <Text style={RDANAStyles.errorText}>{errors.Time_of_Occurrence}</Text>}

                {renderLabel('Summary of Disaster/Incident', false)}
                <View ref={(ref) => (inputContainerRefs.summary = ref)}>
                  <TextInput
                    style={[RDANAStyles.input, { height: 100, textAlignVertical: 'top' }]}
                    placeholder="Enter Summary"
                    multiline
                    numberOfLines={4}
                    onChangeText={(val) => handleChange('summary', val)}
                    value={reportData.summary}
                    onFocus={() => scrollToInput('summary')}
                  />
                </View>
                {errors.summary && <Text style={RDANAStyles.errorText}>{errors.summary}</Text>}
              </View>

              <View style={RDANAStyles.section}>
                <Text style={RDANAStyles.sectionTitle}>Initial Effects</Text>
                <View style={RDANAStyles.addButtonContainer}>
                  <TouchableOpacity style={RDANAStyles.addButton} onPress={() => {
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
                      if (!community) newErrors.community = 'Affected Municipality/Community is required';
                      if (!totalPop) newErrors.totalPop = 'Total Population is required';
                      if (!affected) newErrors.affected = 'Affected Population is required';
                      if (!deaths) newErrors.deaths = 'Number of deaths is required';
                      if (!injured) newErrors.injured = 'Number of injured is required';
                      if (!missing) newErrors.missing = 'Number of missing persons is required';
                      if (!children) newErrors.children = 'Number of affected children is required';
                      if (!women) newErrors.women = 'Number of affected women is required';
                      if (!seniors) newErrors.seniors = 'Number of affected senior citizens is required';
                      if (!pwd) newErrors.pwd = 'Number of affected PWDs is required';

                      setErrors(newErrors);
                      Alert.alert('Incomplete Fields', 'Please fill out all required fields before adding.');
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
                  }}>
                    <Text style={RDANAStyles.addbuttonText}>New City/Municipality</Text>
                  </TouchableOpacity>
                </View>
                {affectedMunicipalities.length > 0 && (
                  <View style={RDANAStyles.table}>
                    <View>
                      <View style={[RDANAStyles.tableRow, { minWidth: 600 }]}>
                        <Text style={[RDANAStyles.tableHeader, { flex: 0.3, minWidth: 280 }]}>Affected Municipalities/Communities</Text>
                        <Text style={[RDANAStyles.tableHeader, { flex: 0.3, minWidth: 150 }]}>Total Population</Text>
                        <Text style={[RDANAStyles.tableHeader, { flex: 0.3, minWidth: 160 }]}>Affected Population</Text>
                        <Text style={[RDANAStyles.tableHeader, { flex: 0.3, minWidth: 100 }]}>Deaths</Text>
                        <Text style={[RDANAStyles.tableHeader, { flex: 0.3, minWidth: 100 }]}>Injured</Text>
                        <Text style={[RDANAStyles.tableHeader, { flex: 0.3, minWidth: 100 }]}>Missing</Text>
                        <Text style={[RDANAStyles.tableHeader, { flex: 0.3, minWidth: 100 }]}>Children</Text>
                        <Text style={[RDANAStyles.tableHeader, { flex: 0.3, minWidth: 80 }]}>Women</Text>
                        <Text style={[RDANAStyles.tableHeader, { flex: 0.3, minWidth: 130 }]}>Senior Citizens</Text>
                        <Text style={[RDANAStyles.tableHeader, { flex: 0.3, minWidth: 100 }]}>PWD</Text>
                      </View>
                      {affectedMunicipalities.map((item, index) => (
                        <View key={index} style={[RDANAStyles.tableRow, { minWidth: 600 }]}>
                          <Text style={[RDANAStyles.tableCell, { flex: 0.3, minWidth: 280 }]}>{item.community || 'N/A'}</Text>
                          <Text style={[RDANAStyles.tableCell, { flex: 0.3, minWidth: 150 }]}>{item.totalPop || 'N/A'}</Text>
                          <Text style={[RDANAStyles.tableCell, { flex: 0.3, minWidth: 160 }]}>{item.affected || 'N/A'}</Text>
                          <Text style={[RDANAStyles.tableCell, { flex: 0.3, minWidth: 100 }]}>{item.deaths || 'N/A'}</Text>
                          <Text style={[RDANAStyles.tableCell, { flex: 0.3, minWidth: 100 }]}>{item.injured || 'N/A'}</Text>
                          <Text style={[RDANAStyles.tableCell, { flex: 0.3, minWidth: 100 }]}>{item.missing || 'N/A'}</Text>
                          <Text style={[RDANAStyles.tableCell, { flex: 0.3, minWidth: 100 }]}>{item.children || 'N/A'}</Text>
                          <Text style={[RDANAStyles.tableCell, { flex: 0.3, minWidth: 80 }]}>{item.women || 'N/A'}</Text>
                          <Text style={[RDANAStyles.tableCell, { flex: 0.3, minWidth: 130 }]}>{item.seniors || 'N/A'}</Text>
                          <Text style={[RDANAStyles.tableCell, { flex: 0.3, minWidth: 100 }]}>{item.pwd || 'N/A'}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                )}

                {renderLabel('Affected Municipalities/Communities', true)}
                <View ref={(ref) => (inputContainerRefs.community = ref)}>
                  <TextInput
                    style={[RDANAStyles.input, errors.community && RDANAStyles.requiredInput]}
                    placeholder="Enter Municipalities/Communities"
                    onChangeText={(val) => handleChange('community', val)}
                    value={reportData.community}
                    onFocus={() => scrollToInput('community')}
                  />
                </View>
                {errors.community && <Text style={RDANAStyles.errorText}>{errors.community}</Text>}

                {renderLabel('Total Population', true)}
                <View ref={(ref) => (inputContainerRefs.totalPop = ref)}>
                  <TextInput
                    style={[RDANAStyles.input, errors.totalPop && RDANAStyles.requiredInput]}
                    placeholder="Enter Total Population"
                    onChangeText={(val) => handleChange('totalPop', val)}
                    value={reportData.totalPop}
                    keyboardType="numeric"
                    onFocus={() => scrollToInput('totalPop')}
                  />
                </View>
                {errors.totalPop && <Text style={RDANAStyles.errorText}>{errors.totalPop}</Text>}

                {renderLabel('Affected Population', true)}
                <View ref={(ref) => (inputContainerRefs.affected = ref)}>
                  <TextInput
                    style={[RDANAStyles.input, errors.affected && RDANAStyles.requiredInput]}
                    placeholder="Enter Affected Population"
                    onChangeText={(val) => handleChange('affected', val)}
                    value={reportData.affected}
                    keyboardType="numeric"
                    onFocus={() => scrollToInput('affected')}
                  />
                </View>
                {errors.affected && <Text style={RDANAStyles.errorText}>{errors.affected}</Text>}

                {renderLabel('Deaths', true)}
                <View ref={(ref) => (inputContainerRefs.deaths = ref)}>
                  <TextInput
                    style={[RDANAStyles.input, errors.deaths && RDANAStyles.requiredInput]}
                    placeholder="Enter Number of Deaths"
                    onChangeText={(val) => handleChange('deaths', val)}
                    value={reportData.deaths}
                    keyboardType="numeric"
                    onFocus={() => scrollToInput('deaths')}
                  />
                </View>
                {errors.deaths && <Text style={RDANAStyles.errorText}>{errors.deaths}</Text>}

                {renderLabel('Injured', true)}
                <View ref={(ref) => (inputContainerRefs.injured = ref)}>
                  <TextInput
                    style={[RDANAStyles.input, errors.injured && RDANAStyles.requiredInput]}
                    placeholder="Enter Number of Injured"
                    onChangeText={(val) => handleChange('injured', val)}
                    value={reportData.injured}
                    keyboardType="numeric"
                    onFocus={() => scrollToInput('injured')}
                  />
                </View>
                {errors.injured && <Text style={RDANAStyles.errorText}>{errors.injured}</Text>}

                {renderLabel('Missing', true)}
                <View ref={(ref) => (inputContainerRefs.missing = ref)}>
                  <TextInput
                    style={[RDANAStyles.input, errors.missing && RDANAStyles.requiredInput]}
                    placeholder="Enter Number of Missing"
                    onChangeText={(val) => handleChange('missing', val)}
                    value={reportData.missing}
                    keyboardType="numeric"
                    onFocus={() => scrollToInput('missing')}
                  />
                </View>
                {errors.missing && <Text style={RDANAStyles.errorText}>{errors.missing}</Text>}

                {renderLabel('Children', true)}
                <View ref={(ref) => (inputContainerRefs.children = ref)}>
                  <TextInput
                    style={[RDANAStyles.input, errors.children && RDANAStyles.requiredInput]}
                    placeholder="Enter Number of Children"
                    onChangeText={(val) => handleChange('children', val)}
                    value={reportData.children}
                    keyboardType="numeric"
                    onFocus={() => scrollToInput('children')}
                  />
                </View>
                {errors.children && <Text style={RDANAStyles.errorText}>{errors.children}</Text>}

                {renderLabel('Women', true)}
                <View ref={(ref) => (inputContainerRefs.women = ref)}>
                  <TextInput
                    style={[RDANAStyles.input, errors.women && RDANAStyles.requiredInput]}
                    placeholder="Enter Number of Women"
                    onChangeText={(val) => handleChange('women', val)}
                    value={reportData.women}
                    keyboardType="numeric"
                    onFocus={() => scrollToInput('women')}
                  />
                </View>
                {errors.women && <Text style={RDANAStyles.errorText}>{errors.women}</Text>}

                {renderLabel('Senior Citizens', true)}
                <View ref={(ref) => (inputContainerRefs.seniors = ref)}>
                  <TextInput
                    style={[RDANAStyles.input, errors.seniors && RDANAStyles.requiredInput]}
                    placeholder="Enter Number of Senior Citizens"
                    onChangeText={(val) => handleChange('seniors', val)}
                    value={reportData.seniors}
                    keyboardType="numeric"
                    onFocus={() => scrollToInput('seniors')}
                  />
                </View>
                {errors.seniors && <Text style={RDANAStyles.errorText}>{errors.seniors}</Text>}

                {renderLabel('PWD', true)}
                <View ref={(ref) => (inputContainerRefs.pwd = ref)}>
                  <TextInput
                    style={[RDANAStyles.input, errors.pwd && RDANAStyles.requiredInput]}
                    placeholder="Enter Number of PWD"
                    onChangeText={(val) => handleChange('pwd', val)}
                    value={reportData.pwd}
                    keyboardType="numeric"
                    onFocus={() => scrollToInput('pwd')}
                  />
                </View>
                {errors.pwd && <Text style={RDANAStyles.errorText}>{errors.pwd}</Text>}
              </View>

              <View style={RDANAStyles.section}>
                <Text style={RDANAStyles.sectionTitle}>
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
                        style={[
                          RDANAStyles.input,
                          RDANAStyles.pickerContainer,
                        ]}
                        ref={(ref) => (inputContainerRefs[field] = ref)}
                      >
                        <Picker
                          selectedValue={reportData[field]}
                          onValueChange={(value) => handleChange(field, value)}
                          style={{
                            flex: 1,
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
                      {errors[field] && <Text style={RDANAStyles.errorText}>{errors[field]}</Text>}
                    </View>
                  );
                })}
                {renderLabel('Others', false)}
                <View ref={(ref) => (inputContainerRefs.othersStatus = ref)}>
                  <TextInput
                    style={[RDANAStyles.input]}
                    placeholder="Input Here (Optional)"
                    onChangeText={(val) => handleChange('othersStatus', val)}
                    value={reportData.othersStatus}
                    onFocus={() => scrollToInput('othersStatus')}
                  />
                </View>
                {errors.othersStatus && <Text style={RDANAStyles.errorText}>{errors.othersStatus}</Text>}
              </View>

              <View style={RDANAStyles.section}>
                <Text style={RDANAStyles.sectionTitle}>Initial Needs Assessment Checklist (Optional)</Text>
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
                    style={RDANAStyles.checkboxContainer}
                  >
                    <View style={RDANAStyles.checkboxBox}>
                      {checklist[field] && <Ionicons name="checkmark" style={RDANAStyles.checkmark} />}
                    </View>
                    <Text style={RDANAStyles.checkboxLabel}>{label}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <View style={RDANAStyles.section}>
                <Text style={RDANAStyles.sectionTitle}>Initial Response Actions</Text>
                {renderLabel('Response Groups Involved', false)}
                <View ref={(ref) => (inputContainerRefs.responseGroupsInvolved = ref)}>
                  <TextInput
                    style={RDANAStyles.input}
                    placeholder="Enter Organization's Name"
                    onChangeText={(val) => handleChange('responseGroupsInvolved', val)}
                    value={reportData.responseGroupsInvolved}
                    onFocus={() => scrollToInput('responseGroupsInvolved')}
                  />
                </View>

                {renderLabel('Relief Assistance Deployed', false)}
                <View ref={(ref) => (inputContainerRefs.reliefAssistanceDeployed = ref)}>
                  <TextInput
                    style={RDANAStyles.input}
                    placeholder="Enter Relief Assistance"
                    onChangeText={(val) => handleChange('reliefAssistanceDeployed', val)}
                    value={reportData.reliefAssistanceDeployed}
                    onFocus={() => scrollToInput('reliefAssistanceDeployed')}
                  />
                </View>

                {renderLabel('Number of Families Served', false)}
                <View ref={(ref) => (inputContainerRefs.numberOfFamiliesServed = ref)}>
                  <TextInput
                    style={RDANAStyles.input}
                    placeholder="Enter Number of Families"
                    onChangeText={(val) => handleChange('numberOfFamiliesServed', val)}
                    value={reportData.numberOfFamiliesServed}
                    keyboardType="numeric"
                    onFocus={() => scrollToInput('numberOfFamiliesServed')}
                  />
                </View>
              </View>

              <TouchableOpacity
                style={RDANAStyles.button}
                onPress={() => {
                  const newErrors = {};
                  requiredFields.forEach((field) => {
                    const value = reportData[field];
                    if (value === null || (typeof value === 'string' && value.trim() === '')) {
                      const fieldName = field.replace(/([A-Z])/g, ' $1').trim();
                      newErrors[field] = `${capitalizeFirstLetter(fieldName)} is required`;
                    }
                  });
                  setErrors(newErrors);
                  if (Object.keys(newErrors).length > 0) {
                    Alert.alert('Incomplete Data', `Please fill in required fields:\n${Object.values(newErrors).join('\n')}`);
                    return;
                  }

                  const completeReportData = { ...reportData };
                  navigation.navigate('RDANASummary', { reportData: completeReportData, affectedMunicipalities });
                }}
              >
                <Text style={RDANAStyles.buttonText}>Proceed</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
};

export default RDANAScreen;