import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Picker } from '@react-native-picker/picker';
import { useNavigation, useRoute } from '@react-navigation/native';
import { ref as databaseRef, get, onValue, query, orderByChild, equalTo } from 'firebase/database';
import React, { useEffect, useState } from 'react';
import { Alert, Platform, SafeAreaView, ScrollView, Text, TextInput, TouchableOpacity, View, StyleSheet, Modal, StatusBar, ToastAndroid } from 'react-native';
import * as Location from 'expo-location';
import MapView, { Marker } from 'react-native-maps';
import { auth, database } from '../configuration/firebaseConfig';
import GlobalStyles from '../styles/GlobalStyles';
import styles from '../styles/ReportSubmissionStyles';
import { LinearGradient } from 'expo-linear-gradient';
import Theme from '../constants/theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { height } = Dimensions.get('window');

const ReportSubmissionScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const insets = useSafeAreaInsets();

  // Formatters
  const formatDate = (date) => {
    if (!date) return '';
    const d = new Date(date);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}-${month}-${year}`;
  };

  const formatTime = (date) => {
    if (!date) return '';
    let hours = date.getHours();
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const ampm = hours >= 12 ? 'pm' : 'am';
    hours = hours % 12 || 12;
    return `${hours.toString().padStart(2, '0')}:${minutes} ${ampm}`;
  };

  // State
  const currentDate = new Date();
  const [reportData, setReportData] = useState({
    reportID: `REPORTS-${Math.floor(1000000000 + Math.random() * 9000000000)}`,
    AreaOfOperation: '',
    DateOfReport: formatDate(currentDate),
    calamityArea: '',
    CalamityAreaId: '',
    completionTimeOfIntervention: '',
    StartDate: '',
    EndDate: '',
    NoOfIndividualsOrFamilies: '',
    NoOfFoodPacks: '',
    hotMeals: '',
    LitersOfWater: '',
    NoOfVolunteersMobilized: '',
    NoOfOrganizationsActivated: '',
    TotalValueOfInKindDonations: '',
    TotalMonetaryDonations: '',
    NotesAdditionalInformation: '',
  });

  const [showDatePicker, setShowDatePicker] = useState({
    StartDate: false,
    EndDate: false,
  });
  const [showTimePicker, setShowTimePicker] = useState({
    completionTimeOfIntervention: false,
  });
  const [tempDate, setTempDate] = useState({
    StartDate: new Date(),
    EndDate: new Date(),
    completionTimeOfIntervention: new Date(),
  });
  const [errors, setErrors] = useState({});
  const [userUid, setUserUid] = useState(null);
  const [organizationName, setOrganizationName] = useState('[Unknown Org]');
  const [showMapModal, setShowMapModal] = useState(false);
  const [location, setLocation] = useState(null);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [mapError, setMapError] = useState(null);
  const [permissionStatus, setPermissionStatus] = useState(null);
  const [showPermissionModal, setShowPermissionModal] = useState(false);
  const [locationName, setLocationName] = useState('');
  const [activeActivations, setActiveActivations] = useState([]);

  const requiredFields = [
    'AreaOfOperation',
    'DateOfReport',
    'calamityArea',
    'completionTimeOfIntervention',
    'StartDate',
    'EndDate',
    'NoOfIndividualsOrFamilies',
    'NoOfFoodPacks',
    'hotMeals',
    'LitersOfWater',
    'NoOfVolunteersMobilized',
    'NoOfOrganizationsActivated',
    'TotalValueOfInKindDonations',
    'TotalMonetaryDonations',
  ];

  // Request location permission
  const handleRequestPermission = async () => {
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      setPermissionStatus(status);
      if (status === 'granted') {
        let loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
        const userLocation = {
          latitude: loc.coords.latitude,
          longitude: loc.coords.longitude,
        };
        setLocation(userLocation);
        const address = await reverseGeocode(userLocation.latitude, userLocation.longitude);
        setLocationName(address);
        setShowMapModal(true);
      } else {
        setShowPermissionModal(true);
      }
    } catch (error) {
      console.error('Permission error:', error);
      setMapError('Failed to request location permission. Please try again.');
      setShowPermissionModal(true);
    }
  };

  // Reverse geocode
  const reverseGeocode = async (latitude, longitude) => {
    try {
      const geocodedLocation = await Location.reverseGeocodeAsync({ latitude, longitude });
      if (geocodedLocation && geocodedLocation.length > 0) {
        const address = geocodedLocation[0];
        const fullAddress = [
          address.name,
          address.street,
          address.city,
          address.region,
          address.country,
        ].filter(Boolean).join(', ');
        return fullAddress || `${latitude}, ${longitude}`;
      }
      return `${latitude}, ${longitude}`;
    } catch (error) {
      console.error('Reverse Geocoding Error:', error);
      ToastAndroid.show('Failed to fetch location name.', ToastAndroid.BOTTOM);
      return `${latitude}, ${longitude}`;
    }
  };

  // Fetch active activations
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        setUserUid(user.uid);
        try {
          const userRef = databaseRef(database, `users/${user.uid}`);
          const userSnapshot = await get(userRef);
          const userData = userSnapshot.val();
          if (userData && userData.group) {
            setOrganizationName(userData.group);
          }

          const activationsRef = databaseRef(database, 'activations');
          const activeQuery = query(activationsRef, orderByChild('status'), equalTo('active'));
          onValue(activeQuery, (snapshot) => {
            const activeActivations = [];
            snapshot.forEach((childSnapshot) => {
              const activation = { id: childSnapshot.key, ...childSnapshot.val() };
              if (organizationName !== '[Unknown Org]' && activation.organization === organizationName) {
                activeActivations.push(activation);
              } else if (organizationName === '[Unknown Org]') {
                activeActivations.push(activation);
              }
            });
            setActiveActivations(activeActivations);
          });
        } catch (error) {
          console.error('Error fetching user data:', error);
          ToastAndroid.show('Failed to fetch user data.', ToastAndroid.BOTTOM);
        }
      } else {
        navigation.navigate('Login');
      }
    });
    return () => unsubscribe();
  }, [navigation, organizationName]);

  // Handle route params
  useEffect(() => {
    if (route.params?.reportData) {
      setReportData(route.params.reportData);
      if (route.params.reportData.StartDate) {
        setTempDate(prev => ({ ...prev, StartDate: new Date(route.params.reportData.StartDate) }));
      }
      if (route.params.reportData.EndDate) {
        setTempDate(prev => ({ ...prev, EndDate: new Date(route.params.reportData.EndDate) }));
      }
      if (route.params.reportData.completionTimeOfIntervention) {
        const [timePart, ampmPart] = route.params.reportData.completionTimeOfIntervention.split(' ');
        let [hours, minutes] = timePart.split(':').map(Number);
        if (ampmPart === 'PM' && hours !== 12) hours += 12;
        if (ampmPart === 'AM' && hours === 12) hours = 0;
        const dummyDateForTime = new Date();
        dummyDateForTime.setHours(hours, minutes, 0, 0);
        setTempDate(prev => ({ ...prev, completionTimeOfIntervention: dummyDateForTime }));
      }
      if (route.params.reportData.AreaOfOperation) {
        setLocationName(route.params.reportData.AreaOfOperation);
        const [lat, lng] = route.params.reportData.AreaOfOperation.includes(',')
          ? route.params.reportData.AreaOfOperation.split(',').map(Number)
          : [null, null];
        if (!isNaN(lat) && !isNaN(lng)) {
          setSelectedLocation({ latitude: lat, longitude: lng });
          reverseGeocode(lat, lng);
        }
      }
      if (route.params.reportData.CalamityAreaId) {
        const savedActivation = activeActivations.find(
          (activation) => activation.id === route.params.reportData.CalamityAreaId
        );
        if (savedActivation) {
          let displayCalamity = savedActivation.calamityType;
          if (savedActivation.calamityType === 'Typhoon' && savedActivation.typhoonName) {
            displayCalamity += ` (${savedActivation.typhoonName})`;
          }
          setReportData(prev => ({
            ...prev,
            calamityArea: `${displayCalamity} (by ${savedActivation.organization})`,
            CalamityAreaId: savedActivation.id,
          }));
          setErrors(prev => ({ ...prev, calamityArea: undefined }));
        }
      }
    }
  }, [route.params, activeActivations]);

  // Date and time handlers
  const handleDateChange = (field, event, selectedDate) => {
    setShowDatePicker(prev => ({ ...prev, [field]: false }));
    if (selectedDate) {
      setTempDate(prev => ({ ...prev, [field]: selectedDate }));
      const formattedDate = formatDate(selectedDate);
      handleChange(field, formattedDate);
    }
  };

  const handleTimeChange = (field, event, selectedTime) => {
    setShowTimePicker(prev => ({ ...prev, [field]: false }));
    if (selectedTime) {
      setTempDate(prev => ({ ...prev, [field]: selectedTime }));
      const formattedTime = formatTime(selectedTime);
      handleChange(field, formattedTime);
    }
  };

  // Input change handler
  const handleChange = (field, value) => {
    setReportData(prev => ({ ...prev, [field]: value }));
    setErrors(prev => {
      const newErrors = { ...prev };
      if (value.trim() !== '') {
        delete newErrors[field];
      }
      const numericFields = [
        'NoOfIndividualsOrFamilies',
        'NoOfFoodPacks',
        'hotMeals',
        'LitersOfWater',
        'NoOfVolunteersMobilized',
        'NoOfOrganizationsActivated',
        'TotalValueOfInKindDonations',
        'TotalMonetaryDonations',
      ];
      if (numericFields.includes(field)) {
        if (value && !/^\d+$/.test(value)) {
          newErrors[field] = 'Must be a positive number';
        } else if (value && parseInt(value) < 0) {
          newErrors[field] = 'Must be a positive number';
        } else {
          delete newErrors[field];
        }
      }
      return newErrors;
    });
  };

  // Calamity change handler
  const handleCalamityChange = (value) => {
    if (value === '') {
      setReportData(prev => ({
        ...prev,
        calamityArea: '',
        CalamityAreaId: '',
      }));
      setErrors(prev => ({ ...prev, calamityArea: 'Select Calamity is required' }));
    } else {
      const selectedActivation = activeActivations.find(activation => activation.id === value);
      if (selectedActivation) {
        let displayCalamity = selectedActivation.calamityType;
        if (selectedActivation.calamityType === 'Typhoon' && selectedActivation.typhoonName) {
          displayCalamity += ` (${selectedActivation.typhoonName})`;
        }
        setReportData(prev => ({
          ...prev,
          calamityArea: `${displayCalamity} (by ${selectedActivation.organization})`,
          CalamityAreaId: selectedActivation.id,
        }));
        setErrors(prev => ({ ...prev, calamityArea: undefined }));
      }
    }
  };

  // Map press handler
  const handleMapPress = async (event) => {
    const { latitude, longitude } = event.nativeEvent.coordinate;
    setSelectedLocation({ latitude, longitude });
    const address = await reverseGeocode(latitude, longitude);
    setLocationName(address);
    handleChange('AreaOfOperation', address);
    setErrors(prev => ({ ...prev, AreaOfOperation: undefined }));
  };

  // Map confirm handler
  const handleMapConfirm = () => {
    if (!reportData.AreaOfOperation || reportData.AreaOfOperation === 'Unknown Location') {
      ToastAndroid.show('Please select a valid location on the map.', ToastAndroid.BOTTOM);
      setErrors(prev => ({ ...prev, AreaOfOperation: 'Please select a valid location' }));
      return;
    }
    setShowMapModal(false);
  };

  // Open map handler
  const handleOpenMap = async () => {
    if (permissionStatus !== 'granted') {
      await handleRequestPermission();
    } else if (location) {
      setShowMapModal(true);
    } else {
      setMapError('Location unavailable. Please try again.');
      await handleRequestPermission();
    }
  };

  // Retry permission handler
  const handleRetryPermission = async () => {
    await handleRequestPermission();
    setShowPermissionModal(false);
  };

  // Form submission handler
  const handleSubmit = () => {
    const newErrors = {};

    // Check for blank required fields
    requiredFields.forEach(field => {
      const value = reportData[field];
      if (value === null || (typeof value === 'string' && value.trim() === '')) {
        newErrors[field] = `${field.replace(/([A-Z])/g, ' $1').trim()} is required`;
      }
    });

    // Check for negative numbers
    const numericFields = [
      'NoOfIndividualsOrFamilies',
      'NoOfFoodPacks',
      'hotMeals',
      'LitersOfWater',
      'NoOfVolunteersMobilized',
      'NoOfOrganizationsActivated',
      'TotalValueOfInKindDonations',
      'TotalMonetaryDonations',
    ];
    numericFields.forEach(field => {
      const value = reportData[field];
      if (value && (!/^\d+$/.test(value) || parseInt(value) < 0)) {
        newErrors[field] = 'Must be a positive number';
      }
    });

    // Check for Unknown Location
    if (reportData.AreaOfOperation === 'Unknown Location') {
      newErrors.AreaOfOperation = 'Please select a valid location';
    }

    // Check date validity
    if (reportData.StartDate && reportData.EndDate) {
      const startDate = new Date(reportData.StartDate.split('-').reverse().join('-'));
      const endDate = new Date(reportData.EndDate.split('-').reverse().join('-'));
      if (endDate < startDate) {
        newErrors.EndDate = 'Ending Date of Operation must not be earlier than Starting Date';
      }
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      Alert.alert('Missing Required Fields', Object.values(newErrors).join('\n'));
      return;
    }

    navigation.navigate('ReportSummary', {
      reportData: {
        ...reportData,
        locationName,
        coordinates: selectedLocation ? `${selectedLocation.latitude},${selectedLocation.longitude}` : null,
      },
      userUid,
      organizationName,
    });
  };

  // Render label
  const renderLabel = (label, isRequired) => (
    <Text style={GlobalStyles.formTitle}>
      {label}
      {isRequired && <Text style={{ color: 'red' }}>*</Text>}
    </Text>
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
          <Text style={[GlobalStyles.headerTitle, { color: Theme.colors.primary }]}>Reports Submission</Text>
        </View>
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.scrollViewContent} keyboardShouldPersistTaps="handled">
        <View style={GlobalStyles.form}>
          <View style={GlobalStyles.section}>
            <Text style={GlobalStyles.sectionTitle}>Basic Information</Text>
            {renderLabel('Report ID', true)}
            <TextInput
              style={[GlobalStyles.input, { backgroundColor: '#f0f0f0' }]}
              value={reportData.reportID}
              editable={false}
            />
            {renderLabel('Area of Operation', true)}
            <TextInput
              style={[GlobalStyles.input, errors.AreaOfOperation && GlobalStyles.inputError]}
              placeholder="e.g. Purok 2, Brgy. Maligaya, Rosario"
              value={locationName || reportData.AreaOfOperation}
              onChangeText={(text) => {
                setLocationName(text);
                handleChange('AreaOfOperation', text);
              }}
            />
            <TouchableOpacity style={styles.openMap} onPress={handleOpenMap}>
              <MaterialIcons name="pin-drop" size={28} color="white" />
              <Text style={styles.openMapText}>Pin Location</Text>
            </TouchableOpacity>
            {errors.AreaOfOperation && <Text style={GlobalStyles.errorText}>{errors.AreaOfOperation}</Text>}
            {renderLabel('Date of Report', true)}
            <View style={[GlobalStyles.input, errors.DateOfReport && GlobalStyles.inputError, { flexDirection: 'row', alignItems: 'center' }]}>
              <Text style={{ flex: 1, color: reportData.DateOfReport ? '#000' : '#999' }}>
                {reportData.DateOfReport || 'dd-mm-yyyy'}
              </Text>
            </View>
            {errors.DateOfReport && <Text style={GlobalStyles.errorText}>{errors.DateOfReport}</Text>}
          </View>

          <View style={GlobalStyles.section}>
            <Text style={GlobalStyles.sectionTitle}>Relief Operations</Text>
            {renderLabel('Select Calamity', true)}
            <View style={[GlobalStyles.input, errors.calamityArea && GlobalStyles.inputError, { height: 45 }]}>
              <Picker
                selectedValue={reportData.CalamityAreaId}
                onValueChange={handleCalamityChange}
                style={{ fontFamily: 'Poppins_Regular', fontSize: 14, color: reportData.CalamityAreaId ? '#000' : '#999' }}
              >
                <Picker.Item label="Select an Active Operation" value="" />
                {activeActivations.map(activation => {
                  let displayCalamity = activation.calamityType;
                  if (activation.calamityType === 'Typhoon' && activation.typhoonName) {
                    displayCalamity += ` (${activation.typhoonName})`;
                  }
                  return (
                    <Picker.Item
                      key={activation.id}
                      label={`${displayCalamity} (by ${activation.organization})`}
                      value={activation.id}
                    />
                  );
                })}
              </Picker>
            </View>
            {errors.calamityArea && <Text style={GlobalStyles.errorText}>{errors.calamityArea}</Text>}
            {renderLabel('Completion Time of Intervention', true)}
            <TouchableOpacity
              style={[GlobalStyles.input, errors.completionTimeOfIntervention && GlobalStyles.inputError, { flexDirection: 'row', alignItems: 'center' }]}
              onPress={() => setShowTimePicker(prev => ({ ...prev, completionTimeOfIntervention: true }))}
            >
              <Text style={{ flex: 1, color: reportData.completionTimeOfIntervention ? '#000' : '#999' }}>
                {reportData.completionTimeOfIntervention || '--:-- --'}
              </Text>
              <Ionicons name="time" size={24} color="#00BCD4" />
            </TouchableOpacity>
            {showTimePicker.completionTimeOfIntervention && (
              <DateTimePicker
                value={tempDate.completionTimeOfIntervention}
                mode="time"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                is24Hour={false}
                onChange={(event, time) => handleTimeChange('completionTimeOfIntervention', event, time)}
              />
            )}
            {errors.completionTimeOfIntervention && <Text style={GlobalStyles.errorText}>{errors.completionTimeOfIntervention}</Text>}
            {renderLabel('Starting Date of Operation', true)}
            <TouchableOpacity
              style={[GlobalStyles.input, errors.StartDate && GlobalStyles.inputError, { flexDirection: 'row', alignItems: 'center' }]}
              onPress={() => setShowDatePicker(prev => ({ ...prev, StartDate: true }))}
            >
              <Text style={{ flex: 1, color: reportData.StartDate ? '#000' : '#999' }}>
                {reportData.StartDate || 'dd-mm-yyyy'}
              </Text>
              <Ionicons name="calendar" size={24} color="#00BCD4" />
            </TouchableOpacity>
            {showDatePicker.StartDate && (
              <DateTimePicker
                value={tempDate.StartDate}
                mode="date"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={(event, date) => handleDateChange('StartDate', event, date)}
              />
            )}
            {errors.StartDate && <Text style={GlobalStyles.errorText}>{errors.StartDate}</Text>}
            {renderLabel('Ending Date of Operation', true)}
            <TouchableOpacity
              style={[GlobalStyles.input, errors.EndDate && GlobalStyles.inputError, { flexDirection: 'row', alignItems: 'center' }]}
              onPress={() => setShowDatePicker(prev => ({ ...prev, EndDate: true }))}
            >
              <Text style={{ flex: 1, color: reportData.EndDate ? '#000' : '#999' }}>
                {reportData.EndDate || 'dd-mm-yyyy'}
              </Text>
              <Ionicons name="calendar" size={24} color="#00BCD4" />
            </TouchableOpacity>
            {showDatePicker.EndDate && (
              <DateTimePicker
                value={tempDate.EndDate}
                mode="date"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={(event, date) => handleDateChange('EndDate', event, date)}
              />
            )}
            {errors.EndDate && <Text style={GlobalStyles.errorText}>{errors.EndDate}</Text>}
            {renderLabel('No. of Individuals or Families', true)}
            <TextInput
              style={[GlobalStyles.input, errors.NoOfIndividualsOrFamilies && GlobalStyles.inputError]}
              placeholder="No. of Individuals or Families"
              onChangeText={val => handleChange('NoOfIndividualsOrFamilies', val)}
              value={reportData.NoOfIndividualsOrFamilies}
              keyboardType="numeric"
            />
            {errors.NoOfIndividualsOrFamilies && <Text style={GlobalStyles.errorText}>{errors.NoOfIndividualsOrFamilies}</Text>}
            {renderLabel('No. of Relief Packs', true)}
            <TextInput
              style={[GlobalStyles.input, errors.NoOfFoodPacks && GlobalStyles.inputError]}
              placeholder="No. of Food Packs"
              onChangeText={val => handleChange('NoOfFoodPacks', val)}
              value={reportData.NoOfFoodPacks}
              keyboardType="numeric"
            />
            {errors.NoOfFoodPacks && <Text style={GlobalStyles.errorText}>{errors.NoOfFoodPacks}</Text>}
            {renderLabel('No. of Hot Meals/Ready-to-eat Food', true)}
            <TextInput
              style={[GlobalStyles.input, errors.hotMeals && GlobalStyles.inputError]}
              placeholder="No. of Hot Meals"
              onChangeText={val => handleChange('hotMeals', val)}
              value={reportData.hotMeals}
              keyboardType="numeric"
            />
            {errors.hotMeals && <Text style={GlobalStyles.errorText}>{errors.hotMeals}</Text>}
            {renderLabel('Liters of Water', true)}
            <TextInput
              style={[GlobalStyles.input, errors.LitersOfWater && GlobalStyles.inputError]}
              placeholder="Liters of Water"
              onChangeText={val => handleChange('LitersOfWater', val)}
              value={reportData.LitersOfWater}
              keyboardType="numeric"
            />
            {errors.LitersOfWater && <Text style={GlobalStyles.errorText}>{errors.LitersOfWater}</Text>}
            {renderLabel('No. of Volunteers Mobilized', true)}
            <TextInput
              style={[GlobalStyles.input, errors.NoOfVolunteersMobilized && GlobalStyles.inputError]}
              placeholder="No. of Volunteers Mobilized"
              onChangeText={val => handleChange('NoOfVolunteersMobilized', val)}
              value={reportData.NoOfVolunteersMobilized}
              keyboardType="numeric"
            />
            {errors.NoOfVolunteersMobilized && <Text style={GlobalStyles.errorText}>{errors.NoOfVolunteersMobilized}</Text>}
            {renderLabel('No. of Organizations Activated', true)}
            <TextInput
              style={[GlobalStyles.input, errors.NoOfOrganizationsActivated && GlobalStyles.inputError]}
              placeholder="No. of Organizations Activated"
              onChangeText={val => handleChange('NoOfOrganizationsActivated', val)}
              value={reportData.NoOfOrganizationsActivated}
              keyboardType="numeric"
            />
            {errors.NoOfOrganizationsActivated && <Text style={GlobalStyles.errorText}>{errors.NoOfOrganizationsActivated}</Text>}
            {renderLabel('Total Value of In-Kind Donations', true)}
            <TextInput
              style={[GlobalStyles.input, errors.TotalValueOfInKindDonations && GlobalStyles.inputError]}
              placeholder="Total Value of In-Kind Donations"
              onChangeText={val => handleChange('TotalValueOfInKindDonations', val)}
              value={reportData.TotalValueOfInKindDonations}
              keyboardType="numeric"
            />
            {errors.TotalValueOfInKindDonations && <Text style={GlobalStyles.errorText}>{errors.TotalValueOfInKindDonations}</Text>}
            {renderLabel('Total Monetary Donations', true)}
            <TextInput
              style={[GlobalStyles.input, errors.TotalMonetaryDonations && GlobalStyles.inputError]}
              placeholder="Total Monetary Donations"
              onChangeText={val => handleChange('TotalMonetaryDonations', val)}
              value={reportData.TotalMonetaryDonations}
              keyboardType="numeric"
            />
            {errors.TotalMonetaryDonations && <Text style={GlobalStyles.errorText}>{errors.TotalMonetaryDonations}</Text>}
          </View>

          <View style={GlobalStyles.section}>
            <Text style={GlobalStyles.sectionTitle}>Additional Updates</Text>
            {renderLabel('Notes/Additional Information (Optional)', false)}
            <TextInput
              style={[GlobalStyles.input, { textAlignVertical: 'top', height: 100 }]}
              placeholder="Enter Notes/Additional Information"
              onChangeText={val => handleChange('NotesAdditionalInformation', val)}
              value={reportData.NotesAdditionalInformation}
              multiline
              numberOfLines={4}
            />
          </View>

          <TouchableOpacity style={[GlobalStyles.button, { marginHorizontal: 10 }]} onPress={handleSubmit}>
            <Text style={GlobalStyles.buttonText}>Proceed</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Map Modal */}
      <Modal visible={showMapModal} animationType="slide" onRequestClose={() => setShowMapModal(false)}>
        <View style={{ flex: 1 }}>
          {mapError ? (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
              <Text style={{ color: '#ff4444', fontSize: 18, textAlign: 'center', marginBottom: 20 }}>{mapError}</Text>
              <TouchableOpacity
                style={{ backgroundColor: '#FF4444', padding: 10, borderRadius: 5 }}
                onPress={() => setShowMapModal(false)}
              >
                <Text style={{ color: '#fff', fontSize: 16, fontWeight: 'bold' }}>Close</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <MapView
              style={{ flex: 1 }}
              initialRegion={{
                latitude: location?.latitude || 14.5995,
                longitude: location?.longitude || 120.9842,
                latitudeDelta: 0.01,
                longitudeDelta: 0.01,
              }}
              onPress={handleMapPress}
              showsUserLocation={true}
            >
              {selectedLocation && (
                <Marker
                  coordinate={selectedLocation}
                  title={locationName || 'Pinned Location'}
                />
              )}
            </MapView>
          )}
          <View style={styles.modalButtonContainer}>
            <TouchableOpacity style={styles.modalButton} onPress={handleMapConfirm}>
              <Text style={styles.modalButtonText}>Confirm Location</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.modalButtonCancel} onPress={() => setShowMapModal(false)}>
              <Text style={[styles.modalButtonText, { color: Theme.colors.primary }]}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Permission Modal */}
      <Modal visible={showPermissionModal} animationType="slide" transparent={true}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <View style={{ backgroundColor: '#fff', padding: 20, borderRadius: 10, alignItems: 'center', width: '80%' }}>
            <Ionicons name="location" size={60} color="#00BCD4" />
            <Text style={{ fontSize: 20, fontWeight: 'bold', marginVertical: 10 }}>Location Access Required</Text>
            <Text style={{ fontSize: 16, textAlign: 'center', marginBottom: 20 }}>
              Please allow location access to pin a location on the map.
            </Text>
            <TouchableOpacity
              style={{ backgroundColor: '#00BCD4', padding: 10, borderRadius: 5, marginBottom: 10 }}
              onPress={handleRetryPermission}
            >
              <Text style={{ color: '#fff', fontSize: 16, fontWeight: 'bold' }}>Allow Location</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={{ backgroundColor: '#FF4444', padding: 10, borderRadius: 5 }}
              onPress={() => setShowPermissionModal(false)}
            >
              <Text style={{ color: '#fff', fontSize: 16, fontWeight: 'bold' }}>No Thanks</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

export default ReportSubmissionScreen;