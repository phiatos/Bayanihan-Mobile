import React, { useState, useRef } from 'react';
import { View, Text, TextInput, ScrollView, TouchableOpacity, Alert, FlatList, SafeAreaView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import RDANAStyles from '../styles/RDANAStyles';

const RDANAScreen = () => {
  const navigation = useNavigation();
  const [errors, setErrors] = useState({});
  const [reportData, setReportData] = useState({
    barangay: '',
    cityMunicipality: '',
    province: '',
    localAuthoritiesPersonsContacted: '',
    dateInformationGathered: '',
    timeInformationGathered: '',
    nameOrganizationsInvolved: '',
    locationsAreasAffectedBarangay: '',
    locationsAreasAffectedCityMunicipality: '',
    locationsAreasAffectedProvince: '',
    typeOfDisaster: '',
    dateOfOccurrence: '',
    timeOfOccurrence: '',
    summaryOfDisasterIncident: '',
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
    bridgesStatus: '',
    roadsStatus: '',
    buildingsStatus: '',
    hospitalsStatus: '',
    schoolsStatus: '',
    reliefPacks: '',
    hotMeals: '',
    hygieneKits: '',
    drinkingWater: '',
    ricePacks: '',
    otherImmediateNeeds: '',
    estimatedQuantity: '',
    responseGroupsInvolved: '',
    reliefAssistanceDeployed: '',
    numberOfFamiliesServed: '',
  });

  // States for dropdowns
  const [isDisasterDropdownVisible, setIsDisasterDropdownVisible] = useState(false);
  const [filteredDisasterTypes, setFilteredDisasterTypes] = useState([]);
  const [isStatusDropdownVisible, setIsStatusDropdownVisible] = useState({
    bridges: false,
    roads: false,
    buildings: false,
    hospitals: false,
    schools: false,
  });
  const [filteredStatuses, setFilteredStatuses] = useState([]);
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
    dateInformationGathered: new Date(),
    dateOfOccurrence: new Date(),
    timeInformationGathered: new Date(),
    timeOfOccurrence: new Date(),
  });

  // Predetermined options
  const disasterTypes = ['Earthquake', 'Typhoon', 'Flood', 'Landslide', 'Fire'];
  const statusOptions = ['Operational', 'Damaged', 'Destroyed', 'Inaccessible'];
  const needsOptions = ['Yes', 'No'];

  // Table data for affected municipalities
  const [affectedMunicipalities, setAffectedMunicipalities] = useState([]);

  // Required fields
  const requiredFields = [
    'barangay',
    'cityMunicipality',
    'province',
    'localAuthoritiesPersonsContacted',
    'dateInformationGathered',
    'timeInformationGathered',
    'locationsAreasAffectedBarangay',
    'locationsAreasAffectedCityMunicipality',
    'locationsAreasAffectedProvince',
    'typeOfDisaster',
    'dateOfOccurrence',
    'summaryOfDisasterIncident',
    'bridgesStatus',
    'bridgesStatus',
    'roadsStatus',
    'buildingsStatus',
    'hospitalsStatus',
    'schoolsStatus',
  ];

  // Helper function to capitalize first letter
  const capitalizeFirstLetter = (string) => {
    if (!string) return string;
    return string.charAt(0).toUpperCase() + string.slice(1);
  };

  // Helper functions for date and time formatting
  const formatDate = (date) => {
    if (!date) return '';
    return date.toISOString().split('T')[0]; // YYYY-MM-DD
  };

  const formatTime = (date) => {
    if (!date) return '';
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`; // HH:MM
  };

  // Validate form data
  const isFormValid = () => {
    return requiredFields.every((field) => {
      const value = reportData[field];
      return value !== null && typeof value === 'string' && value.trim() !== '';
    });
  };

  // Handle TextInput and picker changes
  const handleChange = (field, value) => {
    setReportData({ ...reportData, [field]: value });

    // Clear error if field has valid value
    if (value.trim() !== '') {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }

    // Filter disaster types
    if (field === 'typeOfDisaster') {
      if (value.trim() === '') {
        setFilteredDisasterTypes(disasterTypes);
        setIsDisasterDropdownVisible(false);
      } else {
        const filtered = disasterTypes.filter((type) =>
          type.toLowerCase().includes(value.toLowerCase())
        );
        setFilteredDisasterTypes(filtered);
        setIsDisasterDropdownVisible(true);
      }
    }

    // Filter status for lifelines
    if (['bridgesStatus', 'roadsStatus', 'buildingsStatus', 'hospitalsStatus', 'schoolsStatus'].includes(field)) {
      if (value.trim() === '') {
        setFilteredStatuses(statusOptions);
        setIsStatusDropdownVisible((prev) => ({ ...prev, [field]: false }));
      } else {
        const filtered = statusOptions.filter((status) =>
          status.toLowerCase().includes(value.toLowerCase())
        );
        setFilteredStatuses(filtered);
        setIsStatusDropdownVisible((prev) => ({ ...prev, [field]: true }));
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
    setReportData({ ...reportData, [field]: value });
  };

  // Handle disaster type selection
  const handleDisasterSelect = (type) => {
    setReportData({ ...reportData, typeOfDisaster: type });
    setIsDisasterDropdownVisible(false);
    setErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors.typeOfDisaster;
      return newErrors;
    });
    disasterInputRef.current.blur();
  };

  // Handle status selection
  const handleStatusSelect = (status, field) => {
    setReportData({ ...reportData, [field]: status });
    setIsStatusDropdownVisible((prev) => ({ ...prev, [field]: false }));
    setErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors[field];
      return newErrors;
    });
    statusInputRefs[field].current.blur();
  };

  // Handle dropdown focus
  const handleDisasterFocus = () => {
    setIsDisasterDropdownVisible(true);
    setFilteredDisasterTypes(disasterTypes);
  };

  const handleStatusFocus = (field) => {
    setIsStatusDropdownVisible((prev) => ({ ...prev, [field]: true }));
    setFilteredStatuses(statusOptions);
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

  // Add new city/municipality
  const handleAddMunicipality = () => {
    const { locationsAreasAffectedBarangay, locationsAreasAffectedCityMunicipality, locationsAreasAffectedProvince } = reportData;
    if (!locationsAreasAffectedBarangay || !locationsAreasAffectedCityMunicipality || !locationsAreasAffectedProvince) {
      const newErrors = {};
      if (!locationsAreasAffectedBarangay) newErrors.locationsAreasAffectedBarangay = 'Barangay is required';
      if (!locationsAreasAffectedCityMunicipality) newErrors.locationsAreasAffectedCityMunicipality = 'City/Municipality is required';
      if (!locationsAreasAffectedProvince) newErrors.locationsAreasAffectedProvince = 'Province is required';
      setErrors(newErrors);
      Alert.alert('Incomplete Fields', 'Please fill out all location fields before adding.');
      return;
    }
    const newMunicipality = {
      locationsAreasAffectedBarangay,
      locationsAreasAffectedCityMunicipality,
      locationsAreasAffectedProvince,
    };
    setAffectedMunicipalities([...affectedMunicipalities, newMunicipality]);
    Alert.alert('Municipality Saved', `Saved:\nBarangay: ${locationsAreasAffectedBarangay}\nCity: ${locationsAreasAffectedCityMunicipality}\nProvince: ${locationsAreasAffectedProvince}`);
    setReportData((prev) => ({
      ...prev,
      locationsAreasAffectedBarangay: '',
      locationsAreasAffectedCityMunicipality: '',
      locationsAreasAffectedProvince: '',
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
    navigation.navigate('RDANASummary', { reportData, affectedMunicipalities });
  };

  // Render label
  const renderLabel = (label, isRequired) => (
    <Text style={RDANAStyles.formTitle}>
      {label}
      {isRequired && <Text style={{ color: 'red' }}>*</Text>}
    </Text>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#FFF9F0' }}>
      <ScrollView contentContainerStyle={RDANAStyles.container}>
        <View style={RDANAStyles.header}>
          <TouchableOpacity
            onPress={() => navigation.openDrawer()}
            style={RDANAStyles.menuIcon}
          >
            <Ionicons name="menu" size={32} color="white" />
          </TouchableOpacity>
          <Text style={RDANAStyles.headerText}>RDANA</Text>
        </View>

        <View style={RDANAStyles.form}>
          {/* Profile of the Disaster */}
          <View style={RDANAStyles.section}>
            <Text style={RDANAStyles.sectionTitle}>Profile of the Disaster</Text>
            {renderLabel('Barangay', true)}
            <TextInput
              style={[RDANAStyles.input, errors.barangay && RDANAStyles.requiredInput]}
              placeholder="Enter Barangay"
              onChangeText={(val) => handleChange('barangay', val)}
              value={reportData.barangay}
            />
            {errors.barangay && <Text style={RDANAStyles.errorText}>{errors.barangay}</Text>}

            {renderLabel('City/Municipality', true)}
            <TextInput
              style={[RDANAStyles.input, errors.cityMunicipality && RDANAStyles.requiredInput]}
              placeholder="Enter City/Municipality"
              onChangeText={(val) => handleChange('cityMunicipality', val)}
              value={reportData.cityMunicipality}
            />
            {errors.cityMunicipality && <Text style={RDANAStyles.errorText}>{errors.cityMunicipality}</Text>}

            {renderLabel('Province', true)}
            <TextInput
              style={[RDANAStyles.input, errors.province && RDANAStyles.requiredInput]}
              placeholder="Enter Province"
              onChangeText={(val) => handleChange('province', val)}
              value={reportData.province}
            />
            {errors.province && <Text style={RDANAStyles.errorText}>{errors.province}</Text>}

            {renderLabel('Local Authorities/Persons Contacted', true)}
            <TextInput
              style={[RDANAStyles.input, errors.localAuthoritiesPersonsContacted && RDANAStyles.requiredInput]}
              placeholder="Enter Names"
              onChangeText={(val) => handleChange('localAuthoritiesPersonsContacted', val)}
              value={reportData.localAuthoritiesPersonsContacted}
            />
            {errors.localAuthoritiesPersonsContacted && <Text style={RDANAStyles.errorText}>{errors.localAuthoritiesPersonsContacted}</Text>}

            {renderLabel('Date of Information Gathered', true)}
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
            {errors.dateInformationGathered && <Text style={RDANAStyles.errorText}>{errors.dateInformationGathered}</Text>}

            {renderLabel('Time of Information Gathered', true)}
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
            {errors.timeInformationGathered && <Text style={RDANAStyles.errorText}>{errors.timeInformationGathered}</Text>}

            {renderLabel('Name of Organizations Involved', false)}
            <TextInput
              style={RDANAStyles.input}
              placeholder="Enter Organizations"
              onChangeText={(val) => handleChange('nameOrganizationsInvolved', val)}
              value={reportData.nameOrganizationsInvolved}
            />
          </View>

          {/* Modality */}
          <View style={RDANAStyles.section}>
            <Text style={RDANAStyles.sectionTitle}>Modality</Text>
            {renderLabel('Locations and Areas Affected (Barangay)', true)}
            <TextInput
              style={[RDANAStyles.input, errors.locationsAreasAffectedBarangay && RDANAStyles.requiredInput]}
              placeholder="Enter Barangay"
              onChangeText={(val) => handleChange('locationsAreasAffectedBarangay', val)}
              value={reportData.locationsAreasAffectedBarangay}
            />
            {errors.locationsAreasAffectedBarangay && <Text style={RDANAStyles.errorText}>{errors.locationsAreasAffectedBarangay}</Text>}

            {renderLabel('Locations and Areas Affected (City/Municipality)', true)}
            <TextInput
              style={[RDANAStyles.input, errors.locationsAreasAffectedCityMunicipality && RDANAStyles.requiredInput]}
              placeholder="Enter City/Municipality"
              onChangeText={(val) => handleChange('locationsAreasAffectedCityMunicipality', val)}
              value={reportData.locationsAreasAffectedCityMunicipality}
            />
            {errors.locationsAreasAffectedCityMunicipality && <Text style={RDANAStyles.errorText}>{errors.locationsAreasAffectedCityMunicipality}</Text>}

            {renderLabel('Locations and Areas Affected (Province)', true)}
            <TextInput
              style={[RDANAStyles.input, errors.locationsAreasAffectedProvince && RDANAStyles.requiredInput]}
              placeholder="Enter Province"
              onChangeText={(val) => handleChange('locationsAreasAffectedProvince', val)}
              value={reportData.locationsAreasAffectedProvince}
            />
            {errors.locationsAreasAffectedProvince && <Text style={RDANAStyles.errorText}>{errors.locationsAreasAffectedProvince}</Text>}
            {renderLabel('Type of Disaster', true)}
            <View style={{ position: 'relative' }}>
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
                <View style={RDANAStyles.dropdownContainer}>
                  <FlatList
                    data={filteredDisasterTypes}
                    keyExtractor={(item) => item}
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
            {errors.dateOfOccurrence && <Text style={RDANAStyles.errorText}>{errors.dateOfOccurrence}</Text>}

            {renderLabel('Time of Occurrence', false)}
            <TouchableOpacity
              style={[RDANAStyles.input, { flexDirection: 'row', alignItems: 'center' }]}
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

            {renderLabel('Summary of Disaster/Incident', true)}
            <TextInput
              style={[RDANAStyles.input, errors.summaryOfDisasterIncident && RDANAStyles.requiredInput, { height: 100 }]}
              placeholder="Enter Summary"
              multiline
              numberOfLines={4}
              onChangeText={(val) => handleChange('summaryOfDisasterIncident', val)}
              value={reportData.summaryOfDisasterIncident}
            />
            {errors.summaryOfDisasterIncident && <Text style={RDANAStyles.errorText}>{errors.summaryOfDisasterIncident}</Text>}
          </View>

          {/* Initial Effects */}
          <View style={RDANAStyles.section}>
            <Text style={RDANAStyles.sectionTitle}>Initial Effects</Text>
            <View style={RDANAStyles.addButtonContainer}>
              <TouchableOpacity
                style={RDANAStyles.addButton}
                onPress={handleAddMunicipality}
              >
                <Text style={RDANAStyles.addbuttonText}>New City/Municipality</Text>
              </TouchableOpacity>
            </View>

            {affectedMunicipalities.length > 0 && (
              <View style={{ marginTop: 20 }}>
                <Text style={RDANAStyles.addedItems}>Affected Municipalities:</Text>
                <View style={RDANAStyles.tableRow}>
                  <Text style={[RDANAStyles.tableHeader, { flex: 0.1 }]}>No.</Text>
                  <Text style={[RDANAStyles.tableHeader, { flex: 0.3 }]}>Barangay</Text>
                  <Text style={[RDANAStyles.tableHeader, { flex: 0.3 }]}>City</Text>
                  <Text style={[RDANAStyles.tableHeader, { flex: 0.3 }]}>Province</Text>
                </View>
                {affectedMunicipalities.map((item, index) => (
                  <View key={index} style={RDANAStyles.tableRow}>
                    <Text style={[RDANAStyles.tableCell, { flex: 0.1 }]}>{index + 1}</Text>
                    <Text style={[RDANAStyles.tableCell, { flex: 0.3 }]}>{item.locationsAreasAffectedBarangay}</Text>
                    <Text style={[RDANAStyles.tableCell, { flex: 0.3 }]}>{item.locationsAreasAffectedCityMunicipality}</Text>
                    <Text style={[RDANAStyles.tableCell, { flex: 0.3 }]}>{item.locationsAreasAffectedProvince}</Text>
                  </View>
                ))}
              </View>
            )}
            {renderLabel('Affected Municipalities/Communities', false)}
            <TextInput
              style={RDANAStyles.input}
              placeholder="Enter Municipalities/Communities"
              onChangeText={(val) => handleChange('affectedMunicipalitiesCommunities', val)}
              value={reportData.affectedMunicipalitiesCommunities}
            />

            {renderLabel('Total Population', false)}
            <TextInput
              style={RDANAStyles.input}
              placeholder="Enter Total Population"
              onChangeText={(val) => handleChange('totalPopulation', val)}
              value={reportData.totalPopulation}
              keyboardType="numeric"
            />

            {renderLabel('Affected Population', false)}
            <TextInput
              style={RDANAStyles.input}
              placeholder="Enter Affected Population"
              onChangeText={(val) => handleChange('affectedPopulation', val)}
              value={reportData.affectedPopulation}
              keyboardType="numeric"
            />

            {renderLabel('Deaths', false)}
            <TextInput
              style={RDANAStyles.input}
              placeholder="Enter Number of Deaths"
              onChangeText={(val) => handleChange('deaths', val)}
              value={reportData.deaths}
              keyboardType="numeric"
            />

            {renderLabel('Injured', false)}
            <TextInput
              style={RDANAStyles.input}
              placeholder="Enter Number of Injured"
              onChangeText={(val) => handleChange('injured', val)}
              value={reportData.injured}
              keyboardType="numeric"
            />

            {renderLabel('Missing', false)}
            <TextInput
              style={RDANAStyles.input}
              placeholder="Enter Number of Missing"
              onChangeText={(val) => handleChange('missing', val)}
              value={reportData.missing}
              keyboardType="numeric"
            />

            {renderLabel('Children', false)}
            <TextInput
              style={RDANAStyles.input}
              placeholder="Enter Number of Children"
              onChangeText={(val) => handleChange('children', val)}
              value={reportData.children}
              keyboardType="numeric"
            />

            {renderLabel('Women', false)}
            <TextInput
              style={RDANAStyles.input}
              placeholder="Enter Number of Women"
              onChangeText={(val) => handleChange('women', val)}
              value={reportData.women}
              keyboardType="numeric"
            />

            {renderLabel('Senior Citizens', false)}
            <TextInput
              style={RDANAStyles.input}
              placeholder="Enter Number of Senior Citizens"
              onChangeText={(val) => handleChange('seniorCitizens', val)}
              value={reportData.seniorCitizens}
              keyboardType="numeric"
            />

            {renderLabel('PWD', false)}
            <TextInput
              style={RDANAStyles.input}
              placeholder="Enter Number of PWD"
              onChangeText={(val) => handleChange('pwd', val)}
              value={reportData.pwd}
              keyboardType="numeric"
            />
          </View>

          {/* Status of Lifelines, Social Structure, and Critical Facilities */}
          <View style={RDANAStyles.section}>
            <Text style={RDANAStyles.sectionTitle}>Status of Lifelines, Social Structure, and Critical Facilities</Text>
            {['Bridges', 'Roads', 'Buildings', 'Hospitals', 'Schools'].map((item) => {
              const field = `${item.toLowerCase()}Status`;
              return (
                <View key={item}>
                  {renderLabel(item, false)}
                  <View style={{ position: 'relative' }}>
                    <TextInput
                      ref={statusInputRefs[item.toLowerCase()]}
                      style={[RDANAStyles.input, errors[field] && RDANAStyles.requiredInput]}
                      placeholder={`Select ${item} Status`}
                      onChangeText={(val) => handleChange(field, val)}
                      value={reportData[field]}
                      onFocus={() => handleStatusFocus(item.toLowerCase())}
                      onBlur={() => handleBlur(setIsStatusDropdownVisible, item.toLowerCase())}
                    />
                    {isStatusDropdownVisible[item.toLowerCase()] && filteredStatuses.length > 0 && (
                      <View style={RDANAStyles.dropdownContainer}>
                        <FlatList
                          data={filteredStatuses}
                          keyExtractor={(status) => status}
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

          {/* Initial Needs Assessment Checklist */}
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
                        onPress={() => handleNeedsSelect(field, reportData[field] === option ? '' : option)}
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
            <TextInput
              style={RDANAStyles.input}
              placeholder="Enter Items"
              onChangeText={(val) => handleChange('otherImmediateNeeds', val)}
              value={reportData.otherImmediateNeeds}
            />

            {renderLabel('Estimated Quantity', false)}
            <TextInput
              style={RDANAStyles.input}
              placeholder="Estimated No. of Families to Benefit"
              onChangeText={(val) => handleChange('estimatedQuantity', val)}
              value={reportData.estimatedQuantity}
              keyboardType="numeric"
            />
          </View>

          {/* Initial Response Actions */}
          <View style={RDANAStyles.section}>
            <Text style={RDANAStyles.sectionTitle}>Initial Response Actions</Text>
            {renderLabel('Response Groups Involved', false)}
            <TextInput
              style={RDANAStyles.input}
              placeholder="Enter Organization's Name"
              onChangeText={(val) => handleChange('responseGroupsInvolved', val)}
              value={reportData.responseGroupsInvolved}
            />

            {renderLabel('Relief Assistance Deployed', false)}
            <TextInput
              style={RDANAStyles.input}
              placeholder="Enter Relief Assistance"
              onChangeText={(val) => handleChange('reliefAssistanceDeployed', val)}
              value={reportData.reliefAssistanceDeployed}
            />

            {renderLabel('Number of Families Served', false)}
            <TextInput
              style={RDANAStyles.input}
              placeholder="Enter Number of Families"
              onChangeText={(val) => handleChange('numberOfFamiliesServed', val)}
              value={reportData.numberOfFamiliesServed}
              keyboardType="numeric"
            />
          </View>

          {/* Submit Button */}
          <TouchableOpacity style={RDANAStyles.button} onPress={handleSubmit}>
            <Text style={RDANAStyles.buttonText}>Proceed</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default RDANAScreen;