import { FontAwesome5, FontAwesome6, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Picker } from '@react-native-picker/picker';
import { useNavigation, useRoute } from '@react-navigation/native';
import { ref as databaseRef, get, onValue, query, orderByChild, equalTo } from 'firebase/database';
import React, { useEffect, useRef, useState } from 'react';
import { Alert, Platform, SafeAreaView, ScrollView, Text, TextInput, TouchableOpacity, View, StyleSheet, Dimensions, KeyboardAvoidingView, Modal } from 'react-native';
import * as Location from 'expo-location';
import WebView from 'react-native-webview';
import { auth, database } from '../configuration/firebaseConfig';
import GlobalStyles from '../styles/GlobalStyles';
import RDANAStyles from '../styles/RDANAStyles';

const { height, width } = Dimensions.get('window');

const ReportSubmissionScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const webViewRef = useRef(null);
  

  // Helper functions for formatting
  const formatDate = (date) => {
    if (!date) return '';
    return date.toISOString().split('T')[0]; // YYYY-MM-DD
  };

  const formatTime = (date) => {
    if (!date) return '';
    let hours = date.getHours();
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours || 12;
    return `${hours.toString().padStart(2, '0')}:${minutes} ${ampm}`; // HH:MM AM/PM
  };

  // Initialize current date and time
  const currentDate = new Date();

  const [reportData, setReportData] = useState({
    reportID: '',
    AreaOfOperation: '',
    DateOfReport: formatDate(currentDate),
    calamityAreaDropdown: '',
    CalamityAreaId: '',
    completionTimeOfIntervention: formatTime(currentDate),
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
    DateOfReport: false,
    StartDate: false,
    EndDate: false,
  });
  const [showTimePicker, setShowTimePicker] = useState({
    completionTimeOfIntervention: false,
  });
  const [tempDate, setTempDate] = useState({
    DateOfReport: currentDate,
    StartDate: new Date(),
    EndDate: new Date(),
    completionTimeOfIntervention: currentDate,
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
    'calamityAreaDropdown',
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
        let loc = await Location.getCurrentPositionAsync({});
        if (loc.coords.accuracy > 50) {
          Alert.alert('Low Accuracy', 'Your location accuracy is low. The pin may not be precise.');
        }
        setLocation({
          latitude: loc.coords.latitude,
          longitude: loc.coords.longitude,
        });
        await reverseGeocode(loc.coords.latitude, loc.coords.longitude);
      } else {
        setPermissionStatus('denied');
        setShowPermissionModal(true);
      }
    } catch (error) {
      console.error('Permission error:', error);
      Alert.alert('Error', 'Failed to request location permission. Please try again.');
    }
  };

  // Fetch active activations
useEffect(() => {
  const unsubscribe = auth.onAuthStateChanged(
    async (user) => {
      if (user) {
        setUserUid(user.uid);
        console.log('Logged-in user UID:', user.uid);

        try {
          const userRef = databaseRef(database, `users/${user.uid}`);
          const userSnapshot = await get(userRef);
          const userData = userSnapshot.val();

          if (userData && userData.group) {
            setOrganizationName(userData.group);
            console.log('Volunteer group fetched from database for filtering:', userData.group);
          } else {
            console.warn('User data or group not found in database for UID:', user.uid);
            setOrganizationName('[Unknown Org]');
          }

          const activationsRef = databaseRef(database, 'activations');
          const activeQuery = query(activationsRef, orderByChild('status'), equalTo('active'));

          onValue(
            activeQuery,
            (snapshot) => {
              const activeActivations = [];
              snapshot.forEach((childSnapshot) => {
                const activation = { id: childSnapshot.key, ...childSnapshot.val() };
                if (organizationName && organizationName !== '[Unknown Org]') {
                  if (activation.organization === organizationName) {
                    activeActivations.push(activation);
                  }
                } else {
                  activeActivations.push(activation);
                }
              });
              setActiveActivations(activeActivations);
              console.log('Active activations fetched:', activeActivations);
            },
            (error) => {
              console.error('Error listening for active activations:', error);
              Alert.alert('Error', 'Failed to load active operations. Please try again.');
            }
          );
        } catch (error) {
          console.error('Error fetching user data:', error.message);
          Alert.alert('Error', 'Failed to fetch user group. Please try again.');
        }
      } else {
        console.warn('No user is logged in');
        navigation.navigate('Login');
      }
    },
    (error) => {
      console.error('Auth state listener error:', error.message);
      Alert.alert('Error', 'Authentication error: ' + error.message);
    }
  );

  return () => unsubscribe();
}, [navigation, organizationName]);

  // Effect to handle navigation params and generate Report ID
  useEffect(() => {
    if (route.params?.reportData) {
      setReportData(route.params.reportData);
      if (route.params.reportData.DateOfReport) {
        setTempDate(prev => ({ ...prev, DateOfReport: new Date(route.params.reportData.DateOfReport) }));
      }
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
      if (route.params?.reportData?.AreaOfOperation) {
        setLocationName(route.params.reportData.AreaOfOperation);
        const [lat, lng] = route.params.reportData.AreaOfOperation.includes(',')
          ? route.params.reportData.AreaOfOperation.split(',').map(Number)
          : [null, null];
        if (!isNaN(lat) && !isNaN(lng)) {
          setSelectedLocation({ latitude: lat, longitude: lng });
          reverseGeocode(lat, lng);
        } else {
          setLocationName(route.params.reportData.AreaOfOperation);
        }
      }
      if (route.params?.reportData?.CalamityAreaId) {
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
            calamityAreaDropdown: `${displayCalamity} (by ${savedActivation.organization})`,
            CalamityAreaId: savedActivation.id,
          }));
        }
      }
    } else {
      const generateReportID = () => {
        const randomNumbers = Math.floor(100000 + Math.random() * 900000);
        return `REPORTS-${randomNumbers}`;
      };
      setReportData((prev) => ({ ...prev, reportID: generateReportID() }));
    }
  }, [route.params, activeActivations]);

  // Function to reverse geocode coordinates to a human-readable address
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
        ]
          .filter(Boolean)
          .join(', ');
        setLocationName(fullAddress || 'Unknown Location');
        return fullAddress || 'Unknown Location';
      } else {
        setLocationName('Unknown Location');
        return 'Unknown Location';
      }
    } catch (error) {
      console.error('Reverse Geocoding Error:', error);
      setLocationName('Unknown Location');
      Alert.alert('Error', 'Failed to fetch location name. Using "Unknown Location" instead.');
      return 'Unknown Location';
    }
  };

  const capitalizeFirstLetter = (string) => {
    if (!string) return string;
    return string.charAt(0).toUpperCase() + string.slice(1);
  };

  const handleDateChange = (field, event, selectedDate) => {
    setShowDatePicker((prev) => ({ ...prev, [field]: false }));
    if (selectedDate) {
      setTempDate((prev) => ({ ...prev, [field]: selectedDate }));
      const formattedDate = formatDate(selectedDate);
      handleChange(field, formattedDate);
    }
  };

  const handleTimeChange = (field, event, selectedTime) => {
    setShowTimePicker((prev) => ({ ...prev, [field]: false }));
    if (selectedTime) {
      setTempDate((prev) => ({ ...prev, [field]: selectedTime }));
      const formattedTime = formatTime(selectedTime);
      handleChange(field, formattedTime);
    }
  };

  const handleChange = (field, value) => {
    setReportData({ ...reportData, [field]: value });

    if (value.trim() !== '') {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
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
    if (numericFields.includes(field) && value && !/^\d+$/.test(value)) {
      setErrors((prev) => ({
        ...prev,
        [field]: `${capitalizeFirstLetter(field.replace(/([A-Z])/g, ' $1').trim())} must be a positive number`,
      }));
    } else if (numericFields.includes(field) && value && parseInt(value) < 0) {
      setErrors((prev) => ({
        ...prev,
        [field]: `${capitalizeFirstLetter(field.replace(/([A-Z])/g, ' $1').trim())} cannot be negative`,
      }));
    }
  };

  const handleCalamityChange = (value) => {
    if (value === '') {
      setReportData((prev) => ({
        ...prev,
        calamityAreaDropdown: '',
        CalamityAreaId: '',
        AreaOfOperation: reportData.AreaOfOperation,
      }));
      setLocationName(reportData.AreaOfOperation);
    } else {
      const selectedActivation = activeActivations.find((activation) => activation.id === value);
      if (selectedActivation) {
        let displayCalamity = selectedActivation.calamityType;
        if (selectedActivation.calamityType === 'Typhoon' && selectedActivation.typhoonName) {
          displayCalamity += ` (${selectedActivation.typhoonName})`;
        }
        setReportData((prev) => ({
          ...prev,
          calamityAreaDropdown: `${displayCalamity} (by ${selectedActivation.organization})`,
          CalamityAreaId: selectedActivation.id,
          AreaOfOperation: selectedActivation.areaOfOperation || reportData.AreaOfOperation,
        }));
        setLocationName(selectedActivation.areaOfOperation || reportData.AreaOfOperation);
      }
    }
  };

  const handleMapPress = async (data) => {
    const { latitude, longitude, formattedAddress } = data;
    if (isNaN(latitude) || isNaN(longitude)) {
      setMapError('Invalid coordinates selected');
      return;
    }
    setSelectedLocation({ latitude, longitude });
    const address = formattedAddress || (await reverseGeocode(latitude, longitude));
    setLocationName(address);
    handleChange('AreaOfOperation', address);
    setMapError(null);
  };

  const handleMapConfirm = () => {
    if (!reportData.AreaOfOperation) {
      Alert.alert('No Location Selected', 'Please select a location on the map or search for an address before confirming.');
      return;
    }
    setShowMapModal(false);
  };

  const handleOpenMap = async () => {
    if (permissionStatus !== 'granted') {
      await handleRequestPermission();
    } else {
      setShowMapModal(true);
    }
  };

  const handleRetryPermission = async () => {
    await handleRequestPermission();
    setShowPermissionModal(false);
    if (permissionStatus === 'granted') {
      setShowMapModal(true);
    }
  };

  const handleSubmit = () => {
    const newErrors = {};

    requiredFields.forEach((field) => {
      const value = reportData[field];
      if (value === null || (typeof value === 'string' && value.trim() === '')) {
        const fieldName = field.replace(/([A-Z])/g, ' $1').trim();
        newErrors[field] = `${capitalizeFirstLetter(fieldName)} is required`;
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
      if (numericFields.includes(field) && value) {
        if (!/^\d+$/.test(value)) {
          const fieldName = field.replace(/([A-Z])/g, ' $1').trim();
          newErrors[field] = `${capitalizeFirstLetter(fieldName)} must be a positive number`;
        } else if (parseInt(value) < 0) {
          const fieldName = field.replace(/([A-Z])/g, ' $1').trim();
          newErrors[field] = `${capitalizeFirstLetter(fieldName)} cannot be negative`;
        }
      }
    });

    if (reportData.AreaOfOperation && reportData.AreaOfOperation === 'Unknown Location') {
      newErrors.AreaOfOperation = 'Please select a valid location';
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      Alert.alert(
        'Incomplete Data',
        `Please fill out the following:\n${Object.values(newErrors).join('\n')}`,
      );
      return;
    }

    const serializedReportData = {
      ...reportData,
      reportID: reportData.reportID || `REPORTS-${Math.floor(100000 + Math.random() * 900000)}`,
      locationName,
      coordinates: selectedLocation ? `${selectedLocation.latitude},${selectedLocation.longitude}` : null,
    };

    navigation.navigate('ReportSummary', { reportData: serializedReportData, userUid, organizationName });
  };

  const renderLabel = (label, isRequired) => (
    <Text style={RDANAStyles.formTitle}>
      {label}
      {isRequired && <Text style={{ color: 'red' }}>*</Text>}
    </Text>
  );

  const mapHtml = permissionStatus === 'granted' && location?.latitude && location?.longitude
    ? `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          #map { height: calc(100% - 50px); width: 100%; }
          html, body { height: 100%; margin: 0; padding: 0; }
          .gm-fullscreen-control { display: none !important; }
          #searched {
            position: absolute;
            top: 10px;
            left: 10px;
            right: 10px;
            z-index: 10;
            background: white;
            padding: 5px;
            border-radius: 4px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.2);
          }
          #search-input {
            width: 100%;
            padding: 8px;
            font-size: 16px;
            border: 1px solid #ccc;
            border-radius: 4px;
            box-sizing: border-box;
          }
        </style>
        <script src="https://maps.googleapis.com/maps/api/js?key=AIzaSyBDtlY28p-MvLHRtxnjiibSAadSETvM3VU&libraries=places"></script>
      </head>
      <body>
        <div id="searched">
          <input id="search-input" type="text" placeholder="Search for an address">
        </div>
        <div id="map"></div>
        <script>
          let map;
          let activationMarkers = [];
          let nonActivationMarkers = [];
          let geocoder;
          let singleInfoWindow;
          let currentInfoWindowMarker = null;
          let isInfoWindowClicked = false;

          function initMap() {
            try {
              const userLocation = { lat: ${location.latitude}, lng: ${location.longitude} };
              map = new google.maps.Map(document.getElementById("map"), {
                center: userLocation,
                zoom: 16,
                mapTypeId: "roadmap",
                mapTypeControl: false,
                streetViewControl: true,
                zoomControl: false,
                fullscreenControl: false,
              });

              geocoder = new google.maps.Geocoder();
              singleInfoWindow = new google.maps.InfoWindow();

              // Initialize Places Autocomplete
              const input = document.getElementById("search-input");
              const autocomplete = new google.maps.places.Autocomplete(input, {
                fields: ["formatted_address", "geometry"],
              });
              autocomplete.bindTo("bounds", map);

              autocomplete.addListener("place_changed", () => {
                const place = autocomplete.getPlace();
                if (!place.geometry || !place.geometry.location) {
                  window.ReactNativeWebView.postMessage(JSON.stringify({ error: "No details available for input: '" + place.name + "'" }));
                  return;
                }

                clearNonActivationMarkers();
                const marker = new google.maps.Marker({
                  position: place.geometry.location,
                  map: map,
                  title: place.formatted_address || "Pinned Location",
                });
                nonActivationMarkers.push(marker);

                singleInfoWindow.setContent(place.formatted_address || "Unknown Location");
                singleInfoWindow.open(map, marker);

                map.setCenter(place.geometry.location);
                map.setZoom(16);

                const locationData = {
                  latitude: place.geometry.location.lat(),
                  longitude: place.geometry.location.lng(),
                  formattedAddress: place.formatted_address || "Unknown Location",
                };
                window.ReactNativeWebView.postMessage(JSON.stringify(locationData));
              });

              // User location marker
              const userMarker = new google.maps.Marker({
                position: userLocation,
                map: map,
                title: "Your Location",
                icon: {
                  url: "http://maps.google.com/mapfiles/ms/icons/blue-dot.png",
                },
              });
              nonActivationMarkers.push(userMarker);

              geocoder.geocode({ location: userLocation }, (results, status) => {
                let infoContent = status === "OK" && results[0] ? results[0].formatted_address : "Unknown Location";
                const userInfoWindow = new google.maps.InfoWindow({
                  content: infoContent,
                });
                userMarker.addListener("click", () => {
                  userInfoWindow.open(map, userMarker);
                });
                userInfoWindow.open(map, userMarker);
              });

              // Map click handler
              map.addListener("click", (event) => {
                clearNonActivationMarkers();
                const marker = new google.maps.Marker({
                  position: event.latLng,
                  map: map,
                  title: "Pinned Location",
                });
                nonActivationMarkers.push(marker);

                geocoder.geocode({ location: event.latLng }, (results, status) => {
                  let infoContent = status === "OK" && results[0] ? results[0].formatted_address : "Unknown Location";
                  const infoWindow = new google.maps.InfoWindow({
                    content: infoContent,
                  });
                  marker.addListener("click", () => {
                    infoWindow.open(map, marker);
                  });
                  infoWindow.open(map, marker);

                  const locationData = {
                    latitude: event.latLng.lat(),
                    longitude: event.latLng.lng(),
                    formattedAddress: status === "OK" && results[0] ? results[0].formatted_address : "Unknown Location",
                  };
                  window.ReactNativeWebView.postMessage(JSON.stringify(locationData));
                });

                map.setCenter(event.latLng);
                map.setZoom(16);
              });
            } catch (error) {
              console.error("Map initialization error:", error);
              window.ReactNativeWebView.postMessage(JSON.stringify({ error: "Map initialization failed" }));
            }
          }

          function clearNonActivationMarkers() {
            nonActivationMarkers.forEach((marker) => marker.setMap(null));
            nonActivationMarkers = [];
          }

          window.initMap = initMap;
          initMap();
        </script>
      </body>
      </html>
    `
    : null;

  return (
    <View style={RDANAStyles.container}>
      <View style={GlobalStyles.headerContainer}>
        <TouchableOpacity onPress={() => navigation.openDrawer()} style={GlobalStyles.headerMenuIcon}>
          <Ionicons name="menu" size={32} color="white" />
        </TouchableOpacity>
        <Text style={GlobalStyles.headerTitle}>Reports Submission</Text>
      </View>

      <SafeAreaView style={{ flex: 1 }} edges={['left', 'right', 'bottom']}>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 20}
        >
          <ScrollView contentContainerStyle={RDANAStyles.scrollViewContent}>
            <View style={RDANAStyles.form}>
              <View style={RDANAStyles.section}>
                <Text style={RDANAStyles.sectionTitle}>Basic Information</Text>
                {renderLabel('Report ID', true)}
                <TextInput
                  style={[RDANAStyles.input, { backgroundColor: '#f0f0f0' }]}
                  value={reportData.reportID}
                  editable={false}
                  selectTextOnFocus={false}
                />
            
                {renderLabel('Area of Operation', true)}
                <TextInput
                  style={[RDANAStyles.input, errors.AreaOfOperation && RDANAStyles.requiredInput]}
                  placeholder="Select location on map or from dropdown"
                  value={locationName || reportData.AreaOfOperation}
                  onChangeText={(text) => {
                    setLocationName(text);
                    handleChange('AreaOfOperation', text);
                  }}
                  editable={true}
                />
                <TouchableOpacity
                  style={[RDANAStyles.button, { backgroundColor: '#00BCD4', marginTop: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }]}
                  onPress={handleOpenMap}
                >
                  <Ionicons name="pin" size={24} style={{color:"white"}} />
                  <Text style={RDANAStyles.buttonText}> Pin Location</Text>
                </TouchableOpacity>
                {errors.AreaOfOperation && <Text style={[RDANAStyles.errorText, { marginTop: 2 }]}>{errors.AreaOfOperation}</Text>}
                {renderLabel('Date of Report', true)}
                <TouchableOpacity
                  style={[RDANAStyles.input, errors.DateOfReport && RDANAStyles.requiredInput, { flexDirection: 'row', alignItems: 'center' }]}
                  onPress={() => setShowDatePicker((prev) => ({ ...prev, DateOfReport: true }))}
                >
                  <Text style={{ flex: 1, color: reportData.DateOfReport ? '#000' : '#999' }}>
                    {reportData.DateOfReport || 'YYYY-MM-DD'}
                  </Text>
                </TouchableOpacity>
                {showDatePicker.DateOfReport && (
                  <DateTimePicker
                    value={tempDate.DateOfReport}
                    mode="date"
                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                    onChange={(event, date) => handleDateChange('DateOfReport', event, date)}
                  />
                )}
                {errors.DateOfReport && <Text style={[RDANAStyles.errorText, { marginTop: 2 }]}>{errors.DateOfReport}</Text>}
              </View>

              <View style={RDANAStyles.section}>
                <Text style={RDANAStyles.sectionTitle}>Relief Operations</Text>
                {renderLabel('Select Calamity & Area of Operation', true)}
                <View style={[RDANAStyles.input, errors.calamityAreaDropdown && RDANAStyles.requiredInput, RDANAStyles.pickerContainer,{height:45, paddingVertical: 0, alignContent: 'center', justifyContent: 'center', paddingHorizontal: 0, }]}>
                  <Picker
                    selectedValue={reportData.CalamityAreaId}
                    onValueChange={(value) => handleCalamityChange(value)}
                    style={{ 
                            // flex: 1,
                            fontFamily: 'Poppins_Regular',
                            fontSize: 14,
                            height: 68, 
                            width: '100%', 
                            textAlign: 'center', 
                            color: reportData.CalamityAreaId ? '#000' : '#999'}}
                            dropdownIconColor="#00BCD4"
                  >
                    <Picker.Item label="Select an Active Operation" value=""  
                    style={{ fontFamily: 'Poppins_Regular', textAlign: 'center', fontSize: 14 }}/>
                    {activeActivations.map((activation) => {
                      let displayCalamity = activation.calamityType;
                      if (activation.calamityType === 'Typhoon' && activation.typhoonName) {
                        displayCalamity += ` (${activation.typhoonName})`;
                      }

                      // Provide a fallback for activation.organization
                      const organizationName = activation.organization || 'Unknown Organization'; 

                      return (
                        <Picker.Item
                          style={{fontFamily: 'Poppins_Regular', textAlign: 'center', fontSize: 14}}
                          key={activation.id}
                          label={`${displayCalamity} (by ${organizationName})`} // Use the new variable here
                          value={activation.id}
                        />
                      );
                    })}
                  </Picker>
                </View>
                {renderLabel('Completion Time of Intervention', true)}
                <TouchableOpacity
                  style={[RDANAStyles.input, errors.completionTimeOfIntervention && RDANAStyles.requiredInput, { flexDirection: 'row', alignItems: 'center' }]}
                  onPress={() => setShowTimePicker((prev) => ({ ...prev, completionTimeOfIntervention: true }))}
                >
                  <Text style={{ flex: 1, color: reportData.completionTimeOfIntervention ? '#000' : '#999' }}>
                    {reportData.completionTimeOfIntervention || 'HH:MM AM/PM'}
                  </Text>
                  <Ionicons name="time" size={24} style={{color:"#00BCD4"}} />
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
                {errors.completionTimeOfIntervention && <Text style={[RDANAStyles.errorText, { marginTop: 2 }]}>{errors.completionTimeOfIntervention}</Text>}
                {renderLabel('Starting Date of Operation', true)}
                <TouchableOpacity
                  style={[RDANAStyles.input, errors.StartDate && RDANAStyles.requiredInput, { flexDirection: 'row', alignItems: 'center' }]}
                  onPress={() => setShowDatePicker((prev) => ({ ...prev, StartDate: true }))}
                >
                  <Text style={{ flex: 1, color: reportData.StartDate ? '#000' : '#999' }}>
                    {reportData.StartDate || 'YYYY-MM-DD'}
                  </Text>
                  <Ionicons name="calendar" size={24} style={{color:"#00BCD4"}} />
                </TouchableOpacity>
                {showDatePicker.StartDate && (
                  <DateTimePicker
                    value={tempDate.StartDate}
                    mode="date"
                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                    onChange={(event, date) => handleDateChange('StartDate', event, date)}
                  />
                  )}
                {errors.StartDate && <Text style={[RDANAStyles.errorText, { marginTop: 2 }]}>{errors.StartDate}</Text>}
                {renderLabel('Ending Date of Operation', true)}
                <TouchableOpacity
                  style={[RDANAStyles.input, errors.EndDate && RDANAStyles.requiredInput, { flexDirection: 'row', alignItems: 'center' }]}
                  onPress={() => setShowDatePicker((prev) => ({ ...prev, EndDate: true }))}
                >
                  <Text style={{ flex: 1, color: reportData.EndDate ? '#000' : '#999' }}>
                    {reportData.EndDate || 'YYYY-MM-DD'}
                  </Text>
                  <Ionicons name="calendar" size={24} color="#00BCD4" />
                </TouchableOpacity>
                {showDatePicker.EndDate && (
                  <DateTimePicker
                    value={tempDate.EndDate}
                    mode="date"
                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                    onChange={(event, val) => handleDateChange('EndDate', event, val)}
                  />
                )}
                {errors.EndDate && <Text style={[RDANAStyles.errorText, { marginTop: 2 }]}>{errors.EndDate}</Text>}
                {renderLabel('No. of Individuals or Families', true)}
                <TextInput
                  style={[RDANAStyles.input, errors.NoOfIndividualsOrFamilies && RDANAStyles.requiredInput]}
                  placeholder="Enter No. of Individuals or Families"
                  onChangeText={(val) => handleChange('NoOfIndividualsOrFamilies', val)}
                  value={reportData.NoOfIndividualsOrFamilies}
                  keyboardType="numeric"
                />
                {errors.NoOfIndividualsOrFamilies && <Text style={[RDANAStyles.errorText, { marginTop: 2 }]}>{errors.NoOfIndividualsOrFamilies}</Text>}
                {renderLabel('No. of Relief Packs', true)}
                <TextInput
                  style={[RDANAStyles.input, errors.NoOfFoodPacks && RDANAStyles.requiredInput]}
                  placeholder="Enter No. of Relief Packs"
                  onChangeText={(val) => handleChange('NoOfFoodPacks', val)}
                  value={reportData.NoOfFoodPacks}
                  keyboardType="numeric"
                />
                {errors.NoOfFoodPacks && <Text style={[RDANAStyles.errorText, { marginTop: 2 }]}>{errors.NoOfFoodPacks}</Text>}
                {renderLabel('No. of Hot Meals/Ready-to-eat Food', true)}
                <TextInput
                  style={[RDANAStyles.input, errors.hotMeals && RDANAStyles.requiredInput]}
                  placeholder="Enter No. of Hot Meals"
                  onChangeText={(val) => handleChange('hotMeals', val)}
                  value={reportData.hotMeals}
                  keyboardType="numeric"
                />
                {errors.hotMeals && <Text style={[RDANAStyles.errorText, { marginTop: 2 }]}>{errors.hotMeals}</Text>}
                {renderLabel('Liters of Water', true)}
                <TextInput
                  style={[RDANAStyles.input, errors.LitersOfWater && RDANAStyles.requiredInput]}
                  placeholder="Enter Liters of Water"
                onChangeText={(val) => handleChange('LitersOfWater', val)}
                  value={reportData.LitersOfWater}
                  keyboardType="numeric"
                />
                {errors.LitersOfWater && <Text style={[RDANAStyles.errorText, { marginTop: 2 }]}>{errors.LitersOfWater}</Text>}
                {renderLabel('No. of Volunteers Mobilized', true)}
                <TextInput
                  style={[RDANAStyles.input, errors.NoOfVolunteersMobilized && RDANAStyles.requiredInput]}
                  placeholder="Enter No. of Volunteers"
                  onChangeText={(val) => handleChange('NoOfVolunteersMobilized', val)}
                  value={reportData.NoOfVolunteersMobilized}
                  keyboardType="numeric"
                />
                {errors.NoOfVolunteersMobilized && <Text style={[RDANAStyles.errorText, { marginTop: 2 }]}>{errors.NoOfVolunteersMobilized}</Text>}
                {renderLabel('No. of Organizations Activated', true)}
                <TextInput
                  style={[RDANAStyles.input, errors.NoOfOrganizationsActivated && RDANAStyles.requiredInput]}
                  placeholder="Enter No. of Organizations"
                  onChangeText={(val) => handleChange('NoOfOrganizationsActivated', val)}
                  value={reportData.NoOfOrganizationsActivated}
                  keyboardType="numeric"
                />
                {errors.NoOfOrganizationsActivated && <Text style={[RDANAStyles.errorText, { marginTop: 2 }]}>{errors.NoOfOrganizationsActivated}</Text>}
                {renderLabel('Total Value of In-Kind Donations', true)}
                <TextInput
                  style={[RDANAStyles.input, errors.TotalValueOfInKindDonations && RDANAStyles.requiredInput]}
                  placeholder="Enter Value of In-Kind Donations"
                  onChangeText={(val) => handleChange('TotalValueOfInKindDonations', val)}
                  value={reportData.TotalValueOfInKindDonations}
                  keyboardType="numeric"
                />
                {errors.TotalValueOfInKindDonations && <Text style={[RDANAStyles.errorText, { marginTop: 2 }]}>{errors.TotalValueOfInKindDonations}</Text>}
                {renderLabel('Total Monetary Donations', true)}
                <TextInput
                  style={[RDANAStyles.input, errors.TotalMonetaryDonations && RDANAStyles.requiredInput]}
                  placeholder="Enter Total Monetary Donations"
                  onChangeText={(val) => handleChange('TotalMonetaryDonations', val)}
                  value={reportData.TotalMonetaryDonations}
                  keyboardType="numeric"
                />
                {errors.TotalMonetaryDonations && <Text style={[RDANAStyles.errorText, { marginTop: 2 }]}>{errors.TotalMonetaryDonations}</Text>}
              </View>

              <View style={RDANAStyles.section}>
                <Text style={RDANAStyles.sectionTitle}>Additional Updates</Text>
                {renderLabel('Notes/Additional Information (Optional)', false)}
                <TextInput
                  style={[RDANAStyles.input, errors.NotesAdditionalInformation && RDANAStyles.requiredInput, { textAlignVertical: 'top', height: 100 }]}
                  placeholder="Enter Notes/Additional Information"
                  onChangeText={(val) => handleChange('NotesAdditionalInformation', val)}
                  value={reportData.NotesAdditionalInformation}
                  multiline
                  numberOfLines={4}
                />
                {errors.NotesAdditionalInformation && <Text style={[RDANAStyles.errorText, { marginTop: 2 }]}>{errors.NotesAdditionalInformation}</Text>}
              </View>

              <TouchableOpacity style={RDANAStyles.button} onPress={handleSubmit}>
                <Text style={RDANAStyles.buttonText}>Submit</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>

      {/* Map Modal */}
      <Modal
        visible={showMapModal}
        animationType="slide"
        onRequestClose={() => setShowMapModal(false)}
      >
        <View style={styles.modalContainer}>
          {mapError ? (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{mapError}</Text>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: '#FF4444' }]}
                onPress={() => {
                  setMapError(null);
                  setShowMapModal(false);
                }}
              >
                <Text style={styles.modalButtonText}>Close</Text>
              </TouchableOpacity>
            </View>
          ) : mapHtml ? (
            <>
              <WebView
                ref={webViewRef}
                style={styles.webView}
                source={{ html: mapHtml }}
                originWhitelist={['*']}
                onMessage={(event) => {
                  try {
                    const data = JSON.parse(event.nativeEvent.data);
                    if (data.error) {
                      setMapError(data.error);
                    } else if (data.latitude && data.longitude) {
                      handleMapPress(data);
                    } else {
                      console.error('Invalid message data:', data);
                      setMapError('Invalid location data received.');
                    }
                  } catch (error) {
                    console.error('WebView Message Error:', error);
                    setMapError('Failed to process location data.');
                  }
                }}
                onError={(syntheticEvent) => {
                  const { nativeEvent } = syntheticEvent;
                  console.error('WebView Error:', nativeEvent);
                  setMapError(
                    nativeEvent.description.includes('net::ERR_INTERNET_DISCONNECTED')
                      ? 'No internet connection. Please check your network and try again.'
                      : nativeEvent.description.includes('API key')
                      ? 'Invalid Google Maps API key. Please contact support.'
                      : 'Failed to load map. Please try again or check your API key.'
                  );
                }}
              />
              <View style={styles.modalButtonContainer}>
                <TouchableOpacity
                  style={[styles.modalButton, { backgroundColor: '#00BCD4', marginRight: 10 }]}
                  onPress={handleMapConfirm}
                >
                  <Text style={styles.modalButtonText}>Confirm Location</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalButton, { backgroundColor: '#FF4444' }]}
                  onPress={() => setShowMapModal(false)}
                >
                  <Text style={styles.modalButtonText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </>
          ) : (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>Waiting for location permission...</Text>
            </View>
          )}
        </View>
      </Modal>

      {/* Permission Modal */}
      <Modal
        visible={showPermissionModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowPermissionModal(false)}
      >
        <View style={styles.permissionModalOverlay}>
          <View style={styles.permissionModalContainer}>
            <Ionicons name="location" size={60} color="#00BCD4" />
            <Text style={styles.permissionModalTitle}>Location Access Required</Text>
            <Text style={styles.permissionModalText}>
              Please allow location access to pin a location on the map.
            </Text>
            <TouchableOpacity
              style={[styles.modalButton, { backgroundColor: '#00BCD4', marginBottom: 10 }]}
              onPress={handleRetryPermission}
            >
              <Text style={styles.modalButtonText}>Allow Location</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modalButton, { backgroundColor: '#FF4444' }]}
              onPress={() => setShowPermissionModal(false)}
            >
              <Text style={styles.modalButtonText}>No Thanks</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: 'white',
  },
  webView: {
    width: Dimensions.get('window').width,
    height: Dimensions.get('window').height * 0.8,
  },
  modalButtonContainer: {
    flexDirection: 'row',
    marginVertical: 10,
    justifyContent: 'center',
  },
  modalButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    color: 'red',
    textAlign: 'center',
    marginBottom: 20,
  },
  permissionModalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0,0.7)',
  },
  permissionModalContainer: {
    backgroundColor: 'white',
    padding: 25,
    borderRadius: 15,
    alignItems: 'center',
    width: '80%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
    elevation: 5,
  },
  permissionModalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#333',
    textAlign: 'center',
  },
  permissionModalText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 25,
  },
});

export default ReportSubmissionScreen;