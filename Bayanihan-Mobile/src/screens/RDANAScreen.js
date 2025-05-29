import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  Alert,
  FlatList,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import RDANAStyles from '../styles/RDANAStyles';
import GlobalStyles from '../styles/GlobalStyles';

const RDANAScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const [errors, setErrors] = useState({});
  const scrollViewRef = useRef(null);
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
    barangay: route.params?.reportData?.barangay || '',
    cityMunicipality: route.params?.reportData?.cityMunicipality || '',
    province: route.params?.reportData?.province || '',
    localAuthoritiesPersonsContacted: route.params?.reportData?.localAuthoritiesPersonsContacted || '',
    dateInformationGathered: route.params?.reportData?.dateInformationGathered || formatDate(currentDateTime),
    timeInformationGathered: route.params?.reportData?.timeInformationGathered || formatTime(currentDateTime),
    nameOrganizationInvolved: route.params?.reportData?.nameOrganizationInvolved || '',
    locationsAreasAffectedBarangay: route.params?.reportData?.locationsAreasAffectedBarangay || '',
    locationsAreasAffectedCityMunicipality: route.params?.reportData?.locationsAreasAffectedCityMunicipality || '',
    locationsAreasAffectedProvince: route.params?.reportData?.locationsAreasAffectedProvince || '',
    typeOfDisaster: route.params?.reportData?.typeOfDisaster || '',
    dateOfOccurrence: route.params?.reportData?.dateOfOccurrence || '',
    timeOfOccurrence: route.params?.reportData?.timeOfOccurrence || '',
    summaryOfDisasterIncident: route.params?.reportData?.summaryOfDisasterIncident || '',
    affectedMunicipalitiesCommunities: route.params?.reportData?.affectedMunicipalitiesCommunities || '',
    totalPopulation: route.params?.reportData?.totalPopulation || '',
    affectedPopulation: route.params?.reportData?.affectedPopulation || '',
    deaths: route.params?.reportData?.deaths || '',
    injured: route.params?.reportData?.injured || '',
    missing: route.params?.reportData?.missing || '',
    children: route.params?.reportData?.children || '',
    women: route.params?.reportData?.women || '',
    seniorCitizens: route.params?.reportData?.seniorCitizens || '',
    pwd: route.params?.reportData?.pwd || '',
    bridgesStatus: route.params?.reportData?.bridgesStatus || '',
    roadsStatus: route.params?.reportData?.roadsStatus || '',
    buildingsStatus: route.params?.reportData?.buildingsStatus || '',
    hospitalsStatus: route.params?.reportData?.hospitalsStatus || '',
    schoolsStatus: route.params?.reportData?.schoolsStatus || '',
    reliefPacks: route.params?.reportData?.reliefPacks || '',
    hotMeals: route.params?.reportData?.hotMeals || '',
    hygieneKits: route.params?.reportData?.hygieneKits || '',
    drinkingWater: route.params?.reportData?.drinkingWater || '',
    ricePacks: route.params?.reportData?.ricePacks || '',
    otherImmediateNeeds: route.params?.reportData?.otherImmediateNeeds || '',
    estimatedQuantity: route.params?.reportData?.estimatedQuantity || '',
    responseGroupsInvolved: route.params?.reportData?.responseGroupsInvolved || '',
    reliefAssistanceDeployed: route.params?.reportData?.reliefAssistanceDeployed || '',
    numberOfFamiliesServed: route.params?.reportData?.numberOfFamiliesServed || '',
  };
  const [reportData, setReportData] = useState(initialReportData);

  // States for dropdowns
  const [isDisasterDropdownVisible, setIsDisasterDropdownVisible] = useState(false);
  const [filteredDisasterTypes, setFilteredDisasterTypes] = useState(disasterTypes);
  const [isStatusDropdownVisible, setIsStatusDropdownVisible] = useState({
    bridges: false,
    roads: false,
    buildings: false,
    hospitals: false,
    schools: false,
  });
  const [filteredStatuses, setFilteredStatuses] = useState(statusOptions);
  const disasterInputRef = useRef(null);
  const statusInputRefs = {
    bridges: useRef(null),
    roads: useRef(null),
    buildings: useRef(null),
    hospitals: useRef(null),
    schools: useRef(null),
  };

  // States for date and time pickers
  const [showDatePicker, setShowDatePicker] = useState({
    dateInformationGathered: false,
    dateOfOccurrence: false,
  });
  const [showTimePicker, setShowTimePicker] = useState({
    timeInformationGathered: false,
    timeOfOccurrence: false,
  });
  const [tempDate, setTempDate] = useState({
    dateInformationGathered: isValidDate(initialReportData.dateInformationGathered)
      ? new Date(initialReportData.dateInformationGathered)
      : currentDateTime,
    dateOfOccurrence: isValidDate(initialReportData.dateOfOccurrence)
      ? new Date(initialReportData.dateOfOccurrence)
      : new Date(),
    timeInformationGathered: initialReportData.timeInformationGathered && /^\d{2}:\d{2}$/.test(initialReportData.timeInformationGathered)
      ? parseTimeToDate(initialReportData.timeInformationGathered)
      : currentDateTime,
    timeOfOccurrence: initialReportData.timeOfOccurrence && /^\d{2}:\d{2}$/.test(initialReportData.timeOfOccurrence)
      ? parseTimeToDate(initialReportData.timeOfOccurrence)
      : new Date(),
  });

  // Predetermined options
  const disasterTypes = ['Earthquake', 'Typhoon', 'Flood', 'Landslide', 'Fire'];
  const statusOptions = ['Operational', 'Damaged', 'Destroyed', 'Inaccessible'];
  const needsOptions = ['Yes', 'No'];

  // Table data for affected municipalities
  const [affectedMunicipalities, setAffectedMunicipalities] = useState(route.params?.affectedMunicipalities || []);

  // Required fields
  const requiredFields = [
    'barangay',
    'cityMunicipality',
    'province',
    'localAuthoritiesPersonsContacted',
    'nameOrganizationInvolved',
    'dateInformationGathered',
    'timeInformationGathered',
    'locationsAreasAffectedBarangay',
    'locationsAreasAffectedCityMunicipality',
    'locationsAreasAffectedProvince',
    'typeOfDisaster',
    'dateOfOccurrence',
    'timeOfOccurrence',
  ];

  // Helper function to capitalize first letter
  const capitalizeFirstLetter = (string) => {
    if (!string) return string;
    return string.charAt(0).toUpperCase() + string.slice(1);
  };

  // Scroll to input
  const scrollToInput = (field) => {
    if (inputContainerRefs[field] && scrollViewRef.current) {
      inputContainerRefs[field].measureLayout(
        scrollViewRef.current,
        (x, y, width, height) => {
          scrollViewRef.current.scrollTo({ y: y - 50, animated: true });
        },
        () => {}
      );
    }
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

    if (field === 'typeOfDisaster') {
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

    if (['bridgesStatus', 'roadsStatus', 'buildingsStatus', 'hospitalsStatus', 'schoolsStatus'].includes(field)) {
      if (value.trim() === '') {
        setFilteredStatuses(statusOptions);
        setIsStatusDropdownVisible((prev) => ({ ...prev, [field.replace('Status', '').toLowerCase()]: true }));
      } else {
        const filtered = statusOptions.filter((status) =>
          status.toLowerCase().includes(value.toLowerCase())
        );
        setFilteredStatuses(filtered);
        setIsStatusDropdownVisible((prev) => ({ ...prev, [field.replace('Status', '').toLowerCase()]: true }));
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
  const handleNeedsSelect = (field, value) => {
    setReportData((prev) => ({ ...prev, [field]: value }));
  };

  // Handle disaster type selection
  const handleDisasterSelect = (type) => {
    setReportData((prev) => ({ ...prev, typeOfDisaster: type }));
    setIsDisasterDropdownVisible(false);
    setErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors.typeOfDisaster;
      return newErrors;
    });
    disasterInputRef.current?.blur();
  };

  // Handle status selection
  const handleStatusSelect = (status, field) => {
    setReportData((prev) => ({ ...prev, [field]: status }));
    const refKey = field.replace('Status', '').toLowerCase();
    setIsStatusDropdownVisible((prev) => ({ ...prev, [refKey]: false }));
    setErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors[field];
      return newErrors;
    });
    statusInputRefs[refKey]?.current?.blur();
  };

  // Handle dropdown focus
  const handleDisasterFocus = () => {
    setIsDisasterDropdownVisible(true);
    setFilteredDisasterTypes(disasterTypes);
    scrollToInput('typeOfDisaster');
  };

  const handleStatusFocus = (field) => {
    setIsStatusDropdownVisible((prev) => ({ ...prev, [field]: true }));
    setFilteredStatuses(statusOptions);
    scrollToInput(`${field}Status`);
  };

  // Handle blur
  const handleBlur = (setDropdownVisible, key) => {
    setTimeout(() => {
      if (key) {
        setDropdownVisible((prev) => ({ ...prev, [key]: false }));
      } else {
        setDropdownVisible(false);
      }
    }, 200);
  };

  // New city/municipality
  const handleAddMunicipality = () => {
    const {
      affectedMunicipalitiesCommunities,
      totalPopulation,
      affectedPopulation,
      deaths,
      injured,
      missing,
      children,
      women,
      seniorCitizens,
      pwd,
    } = reportData;

    const isMissingRequiredField =
      !affectedMunicipalitiesCommunities ||
      !totalPopulation ||
      !affectedPopulation ||
      !deaths ||
      !injured ||
      !missing ||
      !children ||
      !women ||
      !seniorCitizens ||
      !pwd;

    if (isMissingRequiredField) {
      const newErrors = {};
      if (!affectedMunicipalitiesCommunities) newErrors.affectedMunicipalitiesCommunities = 'Affected Municipality/Community is required';
      if (!totalPopulation) newErrors.totalPopulation = 'Total Population is required';
      if (!affectedPopulation) newErrors.affectedPopulation = 'Affected Population is required';
      if (!deaths) newErrors.deaths = 'Number of deaths is required';
      if (!injured) newErrors.injured = 'Number of injured is required';
      if (!missing) newErrors.missing = 'Number of missing persons is required';
      if (!children) newErrors.children = 'Number of affected children is required';
      if (!women) newErrors.women = 'Number of affected women is required';
      if (!seniorCitizens) newErrors.seniorCitizens = 'Number of affected senior citizens is required';
      if (!pwd) newErrors.pwd = 'Number of affected PWDs is required';

      setErrors(newErrors);
      Alert.alert('Incomplete Fields', 'Please fill out all required fields before adding.');
      return;
    }

    const newMunicipality = {
      affectedMunicipalitiesCommunities,
      totalPopulation,
      affectedPopulation,
      deaths,
      injured,
      missing,
      children,
      women,
      seniorCitizens,
      pwd,
    };

    setAffectedMunicipalities((prev) => [...prev, newMunicipality]);

    Alert.alert(
      'Municipality Saved',
      `Saved:\nAffected Community: ${affectedMunicipalitiesCommunities}\nTotal Population: ${totalPopulation}\nAffected Population: ${affectedPopulation}\nDeaths: ${deaths}\nInjured: ${injured}\nMissing: ${missing}\nChildren: ${children}\nWomen: ${women}\nSenior Citizens: ${seniorCitizens}\nPWD: ${pwd}`
    );

    setReportData((prev) => ({
      ...prev,
      affectedMunicipalitiesCommunities: '',
      totalPopulation: '',
      affectedPopulation: '',
      deaths: '',
      injured: '',
      missing: '',
      children: '',
      women: '',
      seniorCitizens: '',
      pwd: '',
    }));
  };

  // Handle form submission
  const handleSubmit = () => {
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

    // Ensure Yes/No fields are included
    const completeReportData = {
      ...reportData,
      reliefPacks: reportData.reliefPacks || 'No',
      hotMeals: reportData.hotMeals || 'No',
      hygieneKits: reportData.hygieneKits || 'No',
      drinkingWater: reportData.drinkingWater || 'No',
      ricePacks: reportData.ricePacks || 'No',
    };

    navigation.navigate('RDANASummary', { reportData: completeReportData, affectedMunicipalities });
  };

  // Render label with asterisk for required fields
  const renderLabel = (label, isRequired) => (
    <Text style={RDANAStyles.formTitle}>
      {label}
      {isRequired && <Text style={{ color: 'red' }}>*</Text>}
    </Text>
  );

  const windowHeight = Dimensions.get('window').height;
  const maxDropdownHeight = windowHeight * 0.3;

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
          <ScrollView
            ref={scrollViewRef}
            contentContainerStyle={RDANAStyles.scrollViewContent}
            keyboardShouldPersistTaps="handled"
          >
            <View style={RDANAStyles.form}>
              <View style={RDANAStyles.section}>
                <Text style={RDANAStyles.sectionTitle}>Profile of the Disaster</Text>
                {renderLabel('Barangay', true)}
                <View ref={(ref) => (inputContainerRefs.barangay = ref)}>
                  <TextInput
                    style={[RDANAStyles.input, errors.barangay && RDANAStyles.requiredInput]}
                    placeholder="Enter Barangay"
                    onChangeText={(val) => handleChange('barangay', val)}
                    value={reportData.barangay}
                    onFocus={() => scrollToInput('barangay')}
                  />
                </View>
                {errors.barangay && <Text style={RDANAStyles.errorText}>{errors.barangay}</Text>}

                {renderLabel('City/Municipality', true)}
                <View ref={(ref) => (inputContainerRefs.cityMunicipality = ref)}>
                  <TextInput
                    style={[RDANAStyles.input, errors.cityMunicipality && RDANAStyles.requiredInput]}
                    placeholder="Enter City/Municipality"
                    onChangeText={(val) => handleChange('cityMunicipality', val)}
                    value={reportData.cityMunicipality}
                    onFocus={() => scrollToInput('cityMunicipality')}
                  />
                </View>
                {errors.cityMunicipality && <Text style={RDANAStyles.errorText}>{errors.cityMunicipality}</Text>}

                {renderLabel('Province', true)}
                <View ref={(ref) => (inputContainerRefs.province = ref)}>
                  <TextInput
                    style={[RDANAStyles.input, errors.province && RDANAStyles.requiredInput]}
                    placeholder="Enter Province"
                    onChangeText={(val) => handleChange('province', val)}
                    value={reportData.province}
                    onFocus={() => scrollToInput('province')}
                  />
                </View>
                {errors.province && <Text style={RDANAStyles.errorText}>{errors.province}</Text>}

                {renderLabel('Local Authorities/Persons Contacted', true)}
                <View ref={(ref) => (inputContainerRefs.localAuthoritiesPersonsContacted = ref)}>
                  <TextInput
                    style={[RDANAStyles.input, errors.localAuthoritiesPersonsContacted && RDANAStyles.requiredInput]}
                    placeholder="Enter Names"
                    onChangeText={(val) => handleChange('localAuthoritiesPersonsContacted', val)}
                    value={reportData.localAuthoritiesPersonsContacted}
                    onFocus={() => scrollToInput('localAuthoritiesPersonsContacted')}
                  />
                </View>
                {errors.localAuthoritiesPersonsContacted && <Text style={RDANAStyles.errorText}>{errors.localAuthoritiesPersonsContacted}</Text>}

                {renderLabel('Date of Information Gathered', true)}
                <View ref={(ref) => (inputContainerRefs.dateInformationGathered = ref)}>
                  <TouchableOpacity
                    style={[RDANAStyles.input, errors.dateInformationGathered && RDANAStyles.requiredInput, { flexDirection: 'row', alignItems: 'center' }]}
                    onPress={() => setShowDatePicker((prev) => ({ ...prev, dateInformationGathered: true }))}
                  >
                    <Text style={{ flex: 1, color: reportData.dateInformationGathered ? '#000' : '#999' }}>
                      {reportData.dateInformationGathered || 'YYYY-MM-DD'}
                    </Text>
                    <Ionicons name="calendar" size={24} color="#00BCD4" />
                  </TouchableOpacity>
                  {showDatePicker.dateInformationGathered && (
                    <DateTimePicker
                      value={tempDate.dateInformationGathered}
                      mode="date"
                      display="default"
                      onChange={(event, date) => handleDateChange('dateInformationGathered', event, date)}
                    />
                  )}
                </View>
                {errors.dateInformationGathered && <Text style={RDANAStyles.errorText}>{errors.dateInformationGathered}</Text>}

                {renderLabel('Time of Information Gathered', true)}
                <View ref={(ref) => (inputContainerRefs.timeInformationGathered = ref)}>
                  <TouchableOpacity
                    style={[RDANAStyles.input, errors.timeInformationGathered && RDANAStyles.requiredInput, { flexDirection: 'row', alignItems: 'center' }]}
                    onPress={() => setShowTimePicker((prev) => ({ ...prev, timeInformationGathered: true }))}
                  >
                    <Text style={{ flex: 1, color: reportData.timeInformationGathered ? '#000' : '#999' }}>
                      {reportData.timeInformationGathered || 'HH:MM'}
                    </Text>
                    <Ionicons name="time" size={24} color="#00BCD4" />
                  </TouchableOpacity>
                  {showTimePicker.timeInformationGathered && (
                    <DateTimePicker
                      value={tempDate.timeInformationGathered}
                      mode="time"
                      display="default"
                      is24Hour={true}
                      onChange={(event, time) => handleTimeChange('timeInformationGathered', event, time)}
                    />
                  )}
                </View>
                {errors.timeInformationGathered && <Text style={RDANAStyles.errorText}>{errors.timeInformationGathered}</Text>}

                {renderLabel('Name of Organization Involved', true)}
                <View ref={(ref) => (inputContainerRefs.nameOrganizationInvolved = ref)}>
                  <TextInput
                    style={[RDANAStyles.input, errors.nameOrganizationInvolved && RDANAStyles.requiredInput]}
                    placeholder="Enter Name of Organization"
                    onChangeText={(val) => handleChange('nameOrganizationInvolved', val)}
                    value={reportData.nameOrganizationInvolved}
                    onFocus={() => scrollToInput('nameOrganizationInvolved')}
                  />
                </View>
                {errors.nameOrganizationInvolved && <Text style={RDANAStyles.errorText}>{errors.nameOrganizationInvolved}</Text>}
              </View>

              <View style={RDANAStyles.section}>
                <Text style={RDANAStyles.sectionTitle}>Modality</Text>
                {renderLabel('Locations and Areas Affected (Barangay)', true)}
                <View ref={(ref) => (inputContainerRefs.locationsAreasAffectedBarangay = ref)}>
                  <TextInput
                    style={[RDANAStyles.input, errors.locationsAreasAffectedBarangay && RDANAStyles.requiredInput]}
                    placeholder="Enter Barangay"
                    onChangeText={(val) => handleChange('locationsAreasAffectedBarangay', val)}
                    value={reportData.locationsAreasAffectedBarangay}
                    onFocus={() => scrollToInput('locationsAreasAffectedBarangay')}
                  />
                </View>
                {errors.locationsAreasAffectedBarangay && <Text style={RDANAStyles.errorText}>{errors.locationsAreasAffectedBarangay}</Text>}

                {renderLabel('Locations and Areas Affected (City/Municipality)', true)}
                <View ref={(ref) => (inputContainerRefs.locationsAreasAffectedCityMunicipality = ref)}>
                  <TextInput
                    style={[RDANAStyles.input, errors.locationsAreasAffectedCityMunicipality && RDANAStyles.requiredInput]}
                    placeholder="Enter City/Municipality"
                    onChangeText={(val) => handleChange('locationsAreasAffectedCityMunicipality', val)}
                    value={reportData.locationsAreasAffectedCityMunicipality}
                    onFocus={() => scrollToInput('locationsAreasAffectedCityMunicipality')}
                  />
                </View>
                {errors.locationsAreasAffectedCityMunicipality && <Text style={RDANAStyles.errorText}>{errors.locationsAreasAffectedCityMunicipality}</Text>}

                {renderLabel('Locations and Areas Affected (Province)', true)}
                <View ref={(ref) => (inputContainerRefs.locationsAreasAffectedProvince = ref)}>
                  <TextInput
                    style={[RDANAStyles.input, errors.locationsAreasAffectedProvince && RDANAStyles.requiredInput]}
                    placeholder="Enter Province"
                    onChangeText={(val) => handleChange('locationsAreasAffectedProvince', val)}
                    value={reportData.locationsAreasAffectedProvince}
                    onFocus={() => scrollToInput('locationsAreasAffectedProvince')}
                  />
                </View>
                {errors.locationsAreasAffectedProvince && <Text style={RDANAStyles.errorText}>{errors.locationsAreasAffectedProvince}</Text>}

                {renderLabel('Type of Disaster', true)}
                <View style={{ position: 'relative', zIndex: 2000 }} ref={(ref) => (inputContainerRefs.typeOfDisaster = ref)}>
                  <TextInput
                    ref={disasterInputRef}
                    style={[RDANAStyles.input, errors.typeOfDisaster && RDANAStyles.requiredInput]}
                    placeholder="Select Disaster Type"
                    onChangeText={(val) => handleChange('typeOfDisaster', val)}
                    value={reportData.typeOfDisaster}
                    onFocus={handleDisasterFocus}
                    onBlur={() => handleBlur(setIsDisasterDropdownVisible)}
                  />
                  {isDisasterDropdownVisible && filteredDisasterTypes.length > 0 && (
                    <View style={[RDANAStyles.dropdownContainer, { maxHeight: maxDropdownHeight, zIndex: 3000 }]}>
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
                {errors.typeOfDisaster && <Text style={RDANAStyles.errorText}>{errors.typeOfDisaster}</Text>}

                {renderLabel('Date of Occurrence', true)}
                <View ref={(ref) => (inputContainerRefs.dateOfOccurrence = ref)}>
                  <TouchableOpacity
                    style={[RDANAStyles.input, errors.dateOfOccurrence && RDANAStyles.requiredInput, { flexDirection: 'row', alignItems: 'center' }]}
                    onPress={() => setShowDatePicker((prev) => ({ ...prev, dateOfOccurrence: true }))}
                  >
                    <Text style={{ flex: 1, color: reportData.dateOfOccurrence ? '#000' : '#999' }}>
                      {reportData.dateOfOccurrence || 'YYYY-MM-DD'}
                    </Text>
                    <Ionicons name="calendar" size={24} color="#00BCD4" />
                  </TouchableOpacity>
                  {showDatePicker.dateOfOccurrence && (
                    <DateTimePicker
                      value={tempDate.dateOfOccurrence}
                      mode="date"
                      display="default"
                      onChange={(event, date) => handleDateChange('dateOfOccurrence', event, date)}
                    />
                  )}
                </View>
                {errors.dateOfOccurrence && <Text style={RDANAStyles.errorText}>{errors.dateOfOccurrence}</Text>}

                {renderLabel('Time of Occurrence', true)}
                <View ref={(ref) => (inputContainerRefs.timeOfOccurrence = ref)}>
                  <TouchableOpacity
                    style={[RDANAStyles.input, errors.timeOfOccurrence && RDANAStyles.requiredInput, { flexDirection: 'row', alignItems: 'center' }]}
                    onPress={() => setShowTimePicker((prev) => ({ ...prev, timeOfOccurrence: true }))}
                  >
                    <Text style={{ flex: 1, color: reportData.timeOfOccurrence ? '#000' : '#999' }}>
                      {reportData.timeOfOccurrence || 'HH:MM'}
                    </Text>
                    <Ionicons name="time" size={24} color="#00BCD4" />
                  </TouchableOpacity>
                  {showTimePicker.timeOfOccurrence && (
                    <DateTimePicker
                      value={tempDate.timeOfOccurrence}
                      mode="time"
                      display="default"
                      is24Hour={true}
                      onChange={(event, time) => handleTimeChange('timeOfOccurrence', event, time)}
                    />
                  )}
                </View>
                {errors.timeOfOccurrence && <Text style={RDANAStyles.errorText}>{errors.timeOfOccurrence}</Text>}

                {renderLabel('Summary of Disaster/Incident', false)}
                <View ref={(ref) => (inputContainerRefs.summaryOfDisasterIncident = ref)}>
                  <TextInput
                    style={[RDANAStyles.input, { height: 100 }]}
                    placeholder="Enter Summary"
                    multiline
                    numberOfLines={4}
                    onChangeText={(val) => handleChange('summaryOfDisasterIncident', val)}
                    value={reportData.summaryOfDisasterIncident}
                    onFocus={() => scrollToInput('summaryOfDisasterIncident')}
                  />
                </View>
                {errors.summaryOfDisasterIncident && <Text style={RDANAStyles.errorText}>{errors.summaryOfDisasterIncident}</Text>}
              </View>

              <View style={RDANAStyles.section}>
                <Text style={RDANAStyles.sectionTitle}>Initial Effects</Text>
                <View style={RDANAStyles.addButtonContainer}>
                  <TouchableOpacity style={RDANAStyles.addButton} onPress={handleAddMunicipality}>
                    <Text style={RDANAStyles.addbuttonText}>New City/Municipality</Text>
                  </TouchableOpacity>
                </View>

                {affectedMunicipalities.length > 0 && (
                  <View style={RDANAStyles.table}>
                    <ScrollView horizontal showsHorizontalScrollIndicator={true}>
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
                            <Text style={[RDANAStyles.tableCell, { flex: 0.3, minWidth: 280 }]}>{item.affectedMunicipalitiesCommunities || 'N/A'}</Text>
                            <Text style={[RDANAStyles.tableCell, { flex: 0.3, minWidth: 150 }]}>{item.totalPopulation || 'N/A'}</Text>
                            <Text style={[RDANAStyles.tableCell, { flex: 0.3, minWidth: 160 }]}>{item.affectedPopulation || 'N/A'}</Text>
                            <Text style={[RDANAStyles.tableCell, { flex: 0.3, minWidth: 100 }]}>{item.deaths || 'N/A'}</Text>
                            <Text style={[RDANAStyles.tableCell, { flex: 0.3, minWidth: 100 }]}>{item.injured || 'N/A'}</Text>
                            <Text style={[RDANAStyles.tableCell, { flex: 0.3, minWidth: 100 }]}>{item.missing || 'N/A'}</Text>
                            <Text style={[RDANAStyles.tableCell, { flex: 0.3, minWidth: 100 }]}>{item.children || 'N/A'}</Text>
                            <Text style={[RDANAStyles.tableCell, { flex: 0.3, minWidth: 80 }]}>{item.women || 'N/A'}</Text>
                            <Text style={[RDANAStyles.tableCell, { flex: 0.3, minWidth: 130 }]}>{item.seniorCitizens || 'N/A'}</Text>
                            <Text style={[RDANAStyles.tableCell, { flex: 0.3, minWidth: 100 }]}>{item.pwd || 'N/A'}</Text>
                          </View>
                        ))}
                      </View>
                    </ScrollView>
                  </View>
                )}

                {renderLabel('Affected Municipalities/Communities', true)}
                <View ref={(ref) => (inputContainerRefs.affectedMunicipalitiesCommunities = ref)}>
                  <TextInput
                    style={[RDANAStyles.input, errors.affectedMunicipalitiesCommunities && RDANAStyles.requiredInput]}
                    placeholder="Enter Municipalities/Communities"
                    onChangeText={(val) => handleChange('affectedMunicipalitiesCommunities', val)}
                    value={reportData.affectedMunicipalitiesCommunities}
                    onFocus={() => scrollToInput('affectedMunicipalitiesCommunities')}
                  />
                </View>
                {errors.affectedMunicipalitiesCommunities && <Text style={RDANAStyles.errorText}>{errors.affectedMunicipalitiesCommunities}</Text>}

                {renderLabel('Total Population', true)}
                <View ref={(ref) => (inputContainerRefs.totalPopulation = ref)}>
                  <TextInput
                    style={[RDANAStyles.input, errors.totalPopulation && RDANAStyles.requiredInput]}
                    placeholder="Enter Total Population"
                    onChangeText={(val) => handleChange('totalPopulation', val)}
                    value={reportData.totalPopulation}
                    keyboardType="numeric"
                    onFocus={() => scrollToInput('totalPopulation')}
                  />
                </View>
                {errors.totalPopulation && <Text style={RDANAStyles.errorText}>{errors.totalPopulation}</Text>}

                {renderLabel('Affected Population', true)}
                <View ref={(ref) => (inputContainerRefs.affectedPopulation = ref)}>
                  <TextInput
                    style={[RDANAStyles.input, errors.affectedPopulation && RDANAStyles.requiredInput]}
                    placeholder="Enter Affected Population"
                    onChangeText={(val) => handleChange('affectedPopulation', val)}
                    value={reportData.affectedPopulation}
                    keyboardType="numeric"
                    onFocus={() => scrollToInput('affectedPopulation')}
                  />
                </View>
                {errors.affectedPopulation && <Text style={RDANAStyles.errorText}>{errors.affectedPopulation}</Text>}

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
                <View ref={(ref) => (inputContainerRefs.seniorCitizens = ref)}>
                  <TextInput
                    style={[RDANAStyles.input, errors.seniorCitizens && RDANAStyles.requiredInput]}
                    placeholder="Enter Number of Senior Citizens"
                    onChangeText={(val) => handleChange('seniorCitizens', val)}
                    value={reportData.seniorCitizens}
                    keyboardType="numeric"
                    onFocus={() => scrollToInput('seniorCitizens')}
                  />
                </View>
                {errors.seniorCitizens && <Text style={RDANAStyles.errorText}>{errors.seniorCitizens}</Text>}

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

              <View style={[RDANAStyles.section, { zIndex: 1000 }]}>
                <Text style={RDANAStyles.sectionTitle}>Status of Lifelines, Social Structure, and Critical Facilities</Text>
                {['Bridges', 'Roads', 'Buildings', 'Hospitals', 'Schools'].map((item) => {
                  const field = `${item.toLowerCase()}Status`;
                  const refKey = item.toLowerCase();
                  return (
                    <View key={item}>
                      {renderLabel(item, false)}
                      <View style={{ position: 'relative', zIndex: 1500 }} ref={(ref) => (inputContainerRefs[field] = ref)}>
                        <TextInput
                          ref={statusInputRefs[refKey]}
                          style={[RDANAStyles.input, errors[field] && RDANAStyles.requiredInput]}
                          placeholder={`Select ${item} Status`}
                          onChangeText={(val) => handleChange(field, val)}
                          value={reportData[field]}
                          onFocus={() => handleStatusFocus(refKey)}
                          onBlur={() => handleBlur(setIsStatusDropdownVisible, refKey)}
                        />
                        {isStatusDropdownVisible[refKey] && filteredStatuses.length > 0 && (
                          <View style={[RDANAStyles.dropdownContainer, { maxHeight: maxDropdownHeight, zIndex: 2000 }]}>
                            <FlatList
                              data={filteredStatuses}
                              keyExtractor={(status) => status}
                              nestedScrollEnabled
                              renderItem={({ item: status }) => (
                                <TouchableOpacity
                                  style={RDANAStyles.dropdownItem}
                                  onPress={() => handleStatusSelect(status, field)}
                                >
                                  <Text style={RDANAStyles.dropdownItemText}>{status}</Text>
                                </TouchableOpacity>
                              )}
                            />
                          </View>
                        )}
                      </View>
                      {errors[field] && <Text style={RDANAStyles.errorText}>{errors[field]}</Text>}
                    </View>
                  );
                })}
              </View>

              <View style={RDANAStyles.section}>
                <Text style={RDANAStyles.sectionTitle}>Initial Needs Assessment Checklist</Text>
                {['Relief Packs', 'Hot Meals', 'Hygiene Kits', 'Drinking Water', 'Rice Packs'].map((item) => {
                  const field = item.toLowerCase().replace(/\s/g, '');
                  return (
                    <View key={item} style={{ marginBottom: 10 }}>
                      {renderLabel(item, false)}
                      <View style={{ flexDirection: 'row', justifyContent: 'flex-start' }}>
                        {needsOptions.map((option) => (
                          <TouchableOpacity
                            key={option}
                            style={[
                              RDANAStyles.addButton,
                              {
                                backgroundColor: reportData[field] === option ? '#00BCD4' : '#E0E0E0',
                                marginRight: 10,
                                paddingHorizontal: 15,
                                paddingVertical: 8,
                              },
                            ]}
                            onPress={() => handleNeedsSelect(field, option)}
                          >
                            <Text style={[RDANAStyles.addbuttonText, { color: reportData[field] === option ? 'white' : '#333' }]}>
                              {option}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </View>
                  );
                })}

                {renderLabel('Other Immediate Needs', false)}
                <View ref={(ref) => (inputContainerRefs.otherImmediateNeeds = ref)}>
                  <TextInput
                    style={RDANAStyles.input}
                    placeholder="Enter Items"
                    onChangeText={(val) => handleChange('otherImmediateNeeds', val)}
                    value={reportData.otherImmediateNeeds}
                    onFocus={() => scrollToInput('otherImmediateNeeds')}
                  />
                </View>

                {renderLabel('Estimated Quantity', false)}
                <View ref={(ref) => (inputContainerRefs.estimatedQuantity = ref)}>
                  <TextInput
                    style={RDANAStyles.input}
                    placeholder="Estimated No. of Families to Benefit"
                    onChangeText={(val) => handleChange('estimatedQuantity', val)}
                    value={reportData.estimatedQuantity}
                    keyboardType="numeric"
                    onFocus={() => scrollToInput('estimatedQuantity')}
                  />
                </View>
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

              <TouchableOpacity style={RDANAStyles.button} onPress={handleSubmit}>
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