import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useNavigation, useRoute } from '@react-navigation/native';
import { ref as databaseRef, get } from 'firebase/database';
import React, { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Platform,
  SafeAreaView,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Modal,
  KeyboardAvoidingView,
  StyleSheet,
  Dimensions,
} from 'react-native';
import * as Location from 'expo-location';
import WebView from 'react-native-webview';
import { auth, database } from '../configuration/firebaseConfig';
import GlobalStyles from '../styles/GlobalStyles';
import ReportSubmissionStyles from '../styles/ReportSubmissionStyles';

const { height, width } = Dimensions.get('window');

const ReportSubmissionScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const webViewRef = useRef(null);
  const scrollViewRef = useRef(null);

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
    hours = hours || 12; // Convert 0 to 12 for midnight/noon
    return `${hours.toString().padStart(2, '0')}:${minutes} ${ampm}`; // HH:MM AM/PM
  };

  // Initialize current date and time
  const currentDate = new Date();

  const [reportData, setReportData] = useState({
    reportID: '',
    areaOfOperation: '', // Stores coordinates as "lat,lng"
    calamityAndArea: '',
    dateOfReport: formatDate(currentDate),
    completionTimeOfIntervention: formatTime(currentDate),
    startingDateOfOperation: '',
    endingDateOfOperation: '',
    individualsOrFamilies: '',
    reliefPacks: '',
    hotMeals: '',
    water: '',
    volunteers: '',
    organizationsActivated: '',
    inKindValue: '',
    monetaryDonations: '',
  });

  const [showDatePicker, setShowDatePicker] = useState({
    dateOfReport: false,
    startingDateOfOperation: false,
    endingDateOfOperation: false,
  });
  const [showTimePicker, setShowTimePicker] = useState({
    completionTimeOfIntervention: false,
  });
  const [tempDate, setTempDate] = useState({
    dateOfReport: currentDate,
    startingDateOfOperation: new Date(),
    endingDateOfOperation: new Date(),
    completionTimeOfIntervention: currentDate,
  });
  const [errors, setErrors] = useState({});
  const [userUid, setUserUid] = useState(null);
  const [organizationName, setOrganizationName] = useState('Organization Name');
  const [showMapModal, setShowMapModal] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState({
    latitude: 14.5995, // Default to Manila, Philippines
    longitude: 120.9842,
  });
  const [mapError, setMapError] = useState(null);
  const [permissionStatus, setPermissionStatus] = useState(null);
  const [showPermissionModal, setShowPermissionModal] = useState(false);
  const [locationName, setLocationName] = useState(''); // For human-readable location

  const requiredFields = [
    'areaOfOperation',
    'calamityAndArea',
    'dateOfReport',
    'completionTimeOfIntervention',
    'startingDateOfOperation',
    'endingDateOfOperation',
    'individualsOrFamilies',
    'reliefPacks',
    'hotMeals',
    'water',
    'volunteers',
    'organizationsActivated',
    'inKindValue',
    'monetaryDonations',
  ];

  // Request location permission
  const requestLocationPermission = async () => {
    let { status } = await Location.requestForegroundPermissionsAsync();
    setPermissionStatus(status);
    if (status === 'granted') {
      try {
        let loc = await Location.getCurrentPositionAsync({});
        if (loc.coords.accuracy > 50) {
          Alert.alert('Low Accuracy', 'Your location accuracy is low. The pin might not be exact.');
        }
        setSelectedLocation({
          latitude: loc.coords.latitude,
          longitude: loc.coords.longitude,
        });
        setShowPermissionModal(false);
        setShowMapModal(true);
      } catch (error) {
        console.error('Location Error:', error);
        setMapError('Failed to get your location. Please try again.');
        setShowPermissionModal(false);
      }
    } else {
      setPermissionStatus('denied');
      setShowPermissionModal(true);
    }
  };

  // Handle permission retry
  const handleRetryPermission = async () => {
    setShowPermissionModal(false);
    await requestLocationPermission();
  };

  // Effect to handle navigation params and generate Report ID
  useEffect(() => {
    if (route.params?.reportData) {
      setReportData(route.params.reportData);
      if (route.params.reportData.dateOfReport) {
        setTempDate((prev) => ({ ...prev, dateOfReport: new Date(route.params.reportData.dateOfReport) }));
      }
      if (route.params.reportData.startingDateOfOperation) {
        setTempDate((prev) => ({
          ...prev,
          startingDateOfOperation: new Date(route.params.reportData.startingDateOfOperation),
        }));
      }
      if (route.params.reportData.endingDateOfOperation) {
        setTempDate((prev) => ({
          ...prev,
          endingDateOfOperation: new Date(route.params.reportData.endingDateOfOperation),
        }));
      }
      if (route.params.reportData.completionTimeOfIntervention) {
        const [timePart, ampmPart] = route.params.reportData.completionTimeOfIntervention.split(' ');
        let [hours, minutes] = timePart.split(':').map(Number);
        if (ampmPart === 'PM' && hours !== 12) hours += 12;
        if (ampmPart === 'AM' && hours === 12) hours = 0;
        const dummyDateForTime = new Date();
        dummyDateForTime.setHours(hours, minutes, 0, 0);
        setTempDate((prev) => ({ ...prev, completionTimeOfIntervention: dummyDateForTime }));
      }
      if (route.params.reportData.areaOfOperation) {
        const [lat, lng] = route.params.reportData.areaOfOperation.split(',').map(Number);
        if (lat && lng && !isNaN(lat) && !isNaN(lng)) {
          setSelectedLocation({
            latitude: lat,
            longitude: lng,
          });
          if (route.params.reportData.locationName) {
            setLocationName(route.params.reportData.locationName);
          } else {
            reverseGeocode(lat, lng);
          }
        } else {
          setErrors((prev) => ({
            ...prev,
            areaOfOperation: 'Invalid coordinates format',
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

    const unsubscribe = auth.onAuthStateChanged(
      (user) => {
        if (user) {
          setUserUid(user.uid);
          const userRef = databaseRef(database, `users/${user.uid}`);
          get(userRef)
            .then((snapshot) => {
              const userData = snapshot.val();
              if (userData && userData.group) {
                setOrganizationName(userData.group);
              } else {
                console.warn('No group found for user:', user.uid);
              }
            })
            .catch((error) => {
              console.error('Error fetching user data:', error.message);
              Alert.alert('Error', 'Failed to fetch user data: ' + error.message);
            });
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
  }, [navigation, route.params]);

  // Reverse geocode coordinates
  const reverseGeocode = async (latitude, longitude) => {
    try {
      const geocoded = await Location.reverseGeocodeAsync({ latitude, longitude });
      if (geocoded && geocoded.length > 0) {
        const address = geocoded[0];
        const info = `${address.name ? address.name + ', ' : ''}${address.street ? address.street + ', ' : ''}${address.city}${address.region ? ', ' + address.region : ''}${address.country ? ', ' + address.country : ''}`;
        setLocationName(info.replace(/, $/, '')); // Remove trailing comma
      } else {
        setLocationName(`${latitude.toFixed(6)}, ${longitude.toFixed(6)}`);
      }
    } catch (error) {
      console.error('Reverse geocode error:', error);
      setLocationName(`${latitude.toFixed(6)}, ${longitude.toFixed(6)}`);
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
      'individualsOrFamilies',
      'reliefPacks',
      'hotMeals',
      'water',
      'volunteers',
      'organizationsActivated',
      'inKindValue',
      'monetaryDonations',
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

  const handleMapPress = async (data) => {
    const { latitude, longitude, formattedAddress } = data;
    if (isNaN(latitude) || isNaN(longitude)) {
      setMapError('Invalid coordinates selected');
      return;
    }
    setSelectedLocation({
      latitude,
      longitude,
    });
    const locationString = `${latitude.toFixed(6)},${longitude.toFixed(6)}`;

    if (formattedAddress) {
      setLocationName(formattedAddress);
    } else {
      await reverseGeocode(latitude, longitude);
    }
    handleChange('areaOfOperation', locationString);
    setMapError(null);
  };

  const handleMapConfirm = () => {
    if (!reportData.areaOfOperation) {
      Alert.alert('No Location Selected', 'Please tap on the map to select a location before confirming.');
      return;
    }
    setShowMapModal(false);
  };

  const handleOpenMap = async () => {
    if (permissionStatus !== 'granted') {
      await requestLocationPermission();
    } else {
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
        'individualsOrFamilies',
        'reliefPacks',
        'hotMeals',
        'water',
        'volunteers',
        'organizationsActivated',
        'inKindValue',
        'monetaryDonations',
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

    if (reportData.areaOfOperation) {
      const [lat, lng] = reportData.areaOfOperation.split(',').map(Number);
      if (isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
        newErrors.areaOfOperation = 'Invalid coordinates format';
      }
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
    };

    navigation.navigate('ReportSummary', { reportData: serializedReportData, userUid, organizationName });
  };

  const renderLabel = (label, isRequired) => (
    <Text style={ReportSubmissionStyles.formTitle}>
      {label}
      {isRequired && <Text style={{ color: 'red' }}>*</Text>}
    </Text>
  );

  const mapHtml =
    permissionStatus === 'granted' && selectedLocation
      ? `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          #map { height: 100%; width: 100%; }
          html, body { height: 100%; margin: 0; padding: 0; }
          .gm-style-iw { max-width: 300px !important; }
          .gm-style-iw-d { overflow: auto !important; }
        </style>
        <script src="https://maps.googleapis.com/maps/api/js?key=AIzaSyBDtlY28p-MvLHRtxnjiibSAadSETvM3VU&libraries=places"></script>
      </head>
      <body>
        <div id="map"></div>
        <script>
          let map;
          let markers = [];
          let geocoder;

          function initMap() {
            try {
              const userLocation = { lat: ${selectedLocation.latitude}, lng: ${selectedLocation.longitude} };
              if (!userLocation.lat || !userLocation.lng) {
                throw new Error("Invalid user location");
              }
              map = new google.maps.Map(document.getElementById("map"), {
                center: userLocation,
                zoom: 16,
                mapTypeId: "roadmap",
              });

              geocoder = new google.maps.Geocoder();

              const userMarker = new google.maps.Marker({
                position: userLocation,
                map: map,
                title: "Current Location",
                icon: {
                  url: "http://maps.google.com/mapfiles/ms/icons/blue-dot.png",
                },
              });
              markers.push(userMarker);

              geocoder.geocode({ location: userLocation }, (results, status) => {
                let infoContent = status === "OK" && results[0] ? results[0].formatted_address : \`Lat: \${userLocation.lat}, Lng: \${userLocation.lng}\`;
                const userInfowindow = new google.maps.InfoWindow({
                  content: infoContent,
                });
                userMarker.addListener("click", () => {
                  userInfowindow.open(map, userMarker);
                });
                userInfowindow.open(map, userMarker);
              });

              map.addListener("click", (event) => {
                clearMarkers();
                const marker = new google.maps.Marker({
                  position: event.latLng,
                  map: map,
                  title: "Pinned Location",
                });
                markers.push(marker);

                geocoder.geocode({ location: event.latLng }, (results, status) => {
                  let infoContent = status === "OK" && results[0] ? results[0].formatted_address : \`Lat: \${event.latLng.lat()}, Lng: \${event.latLng.lng()}\`;
                  const infowindow = new google.maps.InfoWindow({
                    content: infoContent,
                  });
                  marker.addListener("click", () => {
                    infowindow.open(map, marker);
                  });
                  infowindow.open(map, marker);

                  try {
                    window.ReactNativeWebView.postMessage(JSON.stringify({
                      latitude: event.latLng.lat(),
                      longitude: event.latLng.lng(),
                      formattedAddress: status === "OK" && results[0] ? results[0].formatted_address : ""
                    }));
                  } catch (error) {
                    console.error("postMessage error:", error);
                  }
                });

                map.setCenter(event.latLng);
                map.setZoom(16);
              });
            } catch (error) {
              console.error("Map initialization error:", error);
              window.ReactNativeWebView.postMessage(JSON.stringify({
                error: "Failed to initialize map: " + error.message
              }));
            }
          }

          function clearMarkers() {
            markers.forEach(marker => marker.setMap(null));
            markers = [];
          }

          window.initMap = initMap;
        </script>
        <script src="https://maps.googleapis.com/maps/api/js?key=AIzaSyBDtlY28p-MvLHRtxnjiibSAadSETvM3VU&callback=initMap&libraries=places" async defer></script>
      </body>
      </html>
    `
      : null;

  return (
    <KeyboardAvoidingView
      style={ReportSubmissionStyles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : null}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 0}
    >
      <View style={GlobalStyles.headerContainer}>
        <TouchableOpacity onPress={() => navigation.openDrawer()} style={GlobalStyles.headerMenuIcon}>
          <Ionicons name="menu" size={32} color="white" />
        </TouchableOpacity>
        <Text style={GlobalStyles.headerTitle}>Reports Submission</Text>
      </View>

      <SafeAreaView style={{ flex: 1 }} edges={['left', 'right', 'bottom']}>
        <ScrollView
          ref={scrollViewRef}
          contentContainerStyle={ReportSubmissionStyles.scrollViewContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={ReportSubmissionStyles.form}>
            <View style={ReportSubmissionStyles.section}>
              <Text style={ReportSubmissionStyles.sectionTitle}>Basic Information</Text>
              {renderLabel('Report ID', true)}
              <TextInput
                style={[ReportSubmissionStyles.input, { backgroundColor: '#f0f0f0' }]}
                value={reportData.reportID}
                editable={false}
                selectTextOnFocus={false}
              />
              {renderLabel('Area of Operation', true)}
              <TextInput
                style={[ReportSubmissionStyles.input, errors.areaOfOperation && ReportSubmissionStyles.requiredInput]}
                placeholder="Select location on map"
                value={locationName || reportData.areaOfOperation}
                editable={false}
                selectTextOnFocus={false}
              />
              <TouchableOpacity
                style={[ReportSubmissionStyles.button, { backgroundColor: '#00BCD4', marginTop: 8 }]}
                onPress={handleOpenMap}
              >
                <Text style={ReportSubmissionStyles.buttonText}>📍 Pin Location</Text>
              </TouchableOpacity>
              {errors.areaOfOperation && <Text style={[ReportSubmissionStyles.errorText, { marginTop: 2 }]}>{errors.areaOfOperation}</Text>}
              {renderLabel('Date of Report', true)}
              <TouchableOpacity
                style={[ReportSubmissionStyles.input, errors.dateOfReport && ReportSubmissionStyles.requiredInput, { flexDirection: 'row', alignItems: 'center' }]}
                onPress={() => setShowDatePicker((prev) => ({ ...prev, dateOfReport: true }))}
              >
                <Text style={{ flex: 1, color: reportData.dateOfReport ? '#000' : '#999' }}>
                  {reportData.dateOfReport || 'YYYY-MM-DD'}
                </Text>
                <Ionicons name="calendar" size={24} color="#00BCD4" />
              </TouchableOpacity>
              {showDatePicker.dateOfReport && (
                <DateTimePicker
                  value={tempDate.dateOfReport}
                  mode="date"
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  onChange={(event, date) => handleDateChange('dateOfReport', event, date)}
                />
              )}
              {errors.dateOfReport && <Text style={[ReportSubmissionStyles.errorText, { marginTop: 2 }]}>{errors.dateOfReport}</Text>}
            </View>

            <View style={ReportSubmissionStyles.section}>
              <Text style={ReportSubmissionStyles.sectionTitle}>Relief Operations</Text>
              {renderLabel('Select Calamity & Area of Operation', true)}
              <TextInput
                style={[ReportSubmissionStyles.input, errors.calamityAndArea && ReportSubmissionStyles.requiredInput]}
                placeholder="Enter Calamity & Area"
                onChangeText={(val) => handleChange('calamityAndArea', val)}
                value={reportData.calamityAndArea}
                blurOnSubmit={true}
                onFocus={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
              />
              {errors.calamityAndArea && <Text style={[ReportSubmissionStyles.errorText, { marginTop: 2 }]}>{errors.calamityAndArea}</Text>}
              {renderLabel('Completion Time of Intervention', true)}
              <TouchableOpacity
                style={[ReportSubmissionStyles.input, errors.completionTimeOfIntervention && ReportSubmissionStyles.requiredInput, { flexDirection: 'row', alignItems: 'center' }]}
                onPress={() => setShowTimePicker((prev) => ({ ...prev, completionTimeOfIntervention: true }))}
              >
                <Text style={{ flex: 1, color: reportData.completionTimeOfIntervention ? '#000' : '#999' }}>
                  {reportData.completionTimeOfIntervention || 'HH:MM AM/PM'}
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
              {errors.completionTimeOfIntervention && (
                <Text style={[ReportSubmissionStyles.errorText, { marginTop: 2 }]}>{errors.completionTimeOfIntervention}</Text>
              )}
              {renderLabel('Starting Date of Operation', true)}
              <TouchableOpacity
                style={[ReportSubmissionStyles.input, errors.startingDateOfOperation && ReportSubmissionStyles.requiredInput, { flexDirection: 'row', alignItems: 'center' }]}
                onPress={() => setShowDatePicker((prev) => ({ ...prev, startingDateOfOperation: true }))}
              >
                <Text style={{ flex: 1, color: reportData.startingDateOfOperation ? '#000' : '#999' }}>
                  {reportData.startingDateOfOperation || 'YYYY-MM-DD'}
                </Text>
                <Ionicons name="calendar" size={24} color="#00BCD4" />
              </TouchableOpacity>
              {showDatePicker.startingDateOfOperation && (
                <DateTimePicker
                  value={tempDate.startingDateOfOperation}
                  mode="date"
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  onChange={(event, date) => handleDateChange('startingDateOfOperation', event, date)}
                />
              )}
              {errors.startingDateOfOperation && (
                <Text style={[ReportSubmissionStyles.errorText, { marginTop: 2 }]}>{errors.startingDateOfOperation}</Text>
              )}
              {renderLabel('Ending Date of Operation', true)}
              <TouchableOpacity
                style={[ReportSubmissionStyles.input, errors.endingDateOfOperation && ReportSubmissionStyles.requiredInput, { flexDirection: 'row', alignItems: 'center' }]}
                onPress={() => setShowDatePicker((prev) => ({ ...prev, endingDateOfOperation: true }))}
              >
                <Text style={{ flex: 1, color: reportData.endingDateOfOperation ? '#000' : '#999' }}>
                  {reportData.endingDateOfOperation || 'YYYY-MM-DD'}
                </Text>
                <Ionicons name="calendar" size={24} color="#00BCD4" />
              </TouchableOpacity>
              {showDatePicker.endingDateOfOperation && (
                <DateTimePicker
                  value={tempDate.endingDateOfOperation}
                  mode="date"
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  onChange={(event, date) => handleDateChange('endingDateOfOperation', event, date)}
                />
              )}
              {errors.endingDateOfOperation && (
                <Text style={[ReportSubmissionStyles.errorText, { marginTop: 2 }]}>{errors.endingDateOfOperation}</Text>
              )}
              {renderLabel('No. of Individuals or Families', true)}
              <TextInput
                style={[ReportSubmissionStyles.input, errors.individualsOrFamilies && ReportSubmissionStyles.requiredInput]}
                placeholder="Enter No. of Individuals or Families"
                onChangeText={(val) => handleChange('individualsOrFamilies', val)}
                value={reportData.individualsOrFamilies}
                keyboardType="numeric"
                blurOnSubmit={true}
                onFocus={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
              />
              {errors.individualsOrFamilies && (
                <Text style={[ReportSubmissionStyles.errorText, { marginTop: 2 }]}>{errors.individualsOrFamilies}</Text>
              )}
              {renderLabel('No. of Relief Packs', true)}
              <TextInput
                style={[ReportSubmissionStyles.input, errors.reliefPacks && ReportSubmissionStyles.requiredInput]}
                placeholder="Enter No. of Relief Packs"
                onChangeText={(val) => handleChange('reliefPacks', val)}
                value={reportData.reliefPacks}
                keyboardType="numeric"
                blurOnSubmit={true}
                onFocus={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
              />
              {errors.reliefPacks && <Text style={[ReportSubmissionStyles.errorText, { marginTop: 2 }]}>{errors.reliefPacks}</Text>}
              {renderLabel('No. of Hot Meals/Ready-to-eat Food', true)}
              <TextInput
                style={[ReportSubmissionStyles.input, errors.hotMeals && ReportSubmissionStyles.requiredInput]}
                placeholder="Enter No. of Hot Meals"
                onChangeText={(val) => handleChange('hotMeals', val)}
                value={reportData.hotMeals}
                keyboardType="numeric"
                blurOnSubmit={true}
                onFocus={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
              />
              {errors.hotMeals && <Text style={[ReportSubmissionStyles.errorText, { marginTop: 2 }]}>{errors.hotMeals}</Text>}
              {renderLabel('Liters of Water', true)}
              <TextInput
                style={[ReportSubmissionStyles.input, errors.water && ReportSubmissionStyles.requiredInput]}
                placeholder="Enter Liters of Water"
                onChangeText={(val) => handleChange('water', val)}
                value={reportData.water}
                keyboardType="numeric"
                blurOnSubmit={true}
                onFocus={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
              />
              {errors.water && <Text style={[ReportSubmissionStyles.errorText, { marginTop: 2 }]}>{errors.water}</Text>}
              {renderLabel('No. of Volunteers Mobilized', true)}
              <TextInput
                style={[ReportSubmissionStyles.input, errors.volunteers && ReportSubmissionStyles.requiredInput]}
                placeholder="Enter No. of Volunteers"
                onChangeText={(val) => handleChange('volunteers', val)}
                value={reportData.volunteers}
                keyboardType="numeric"
                blurOnSubmit={true}
                onFocus={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
              />
              {errors.volunteers && <Text style={[ReportSubmissionStyles.errorText, { marginTop: 2 }]}>{errors.volunteers}</Text>}
              {renderLabel('No. of Organizations Activated', true)}
              <TextInput
                style={[ReportSubmissionStyles.input, errors.organizationsActivated && ReportSubmissionStyles.requiredInput]}
                placeholder="Enter No. of Organizations"
                onChangeText={(val) => handleChange('organizationsActivated', val)}
                value={reportData.organizationsActivated}
                keyboardType="numeric"
                blurOnSubmit={true}
                onFocus={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
              />
              {errors.organizationsActivated && (
                <Text style={[ReportSubmissionStyles.errorText, { marginTop: 2 }]}>{errors.organizationsActivated}</Text>
              )}
              {renderLabel('Total Value of In-Kind Donations', true)}
              <TextInput
                style={[ReportSubmissionStyles.input, errors.inKindValue && ReportSubmissionStyles.requiredInput]}
                placeholder="Enter Value of In-Kind Donations"
                onChangeText={(val) => handleChange('inKindValue', val)}
                value={reportData.inKindValue}
                keyboardType="numeric"
                blurOnSubmit={true}
                onFocus={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
              />
              {errors.inKindValue && <Text style={[ReportSubmissionStyles.errorText, { marginTop: 2 }]}>{errors.inKindValue}</Text>}
              {renderLabel('Total Monetary Donations', true)}
              <TextInput
                style={[ReportSubmissionStyles.input, errors.monetaryDonations && ReportSubmissionStyles.requiredInput]}
                placeholder="Enter Total Monetary Donations"
                onChangeText={(val) => handleChange('monetaryDonations', val)}
                value={reportData.monetaryDonations}
                keyboardType="numeric"
                blurOnSubmit={true}
                onFocus={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
              />
              {errors.monetaryDonations && (
                <Text style={[ReportSubmissionStyles.errorText, { marginTop: 2 }]}>{errors.monetaryDonations}</Text>
              )}
            </View>
            <TouchableOpacity style={ReportSubmissionStyles.button} onPress={handleSubmit}>
              <Text style={ReportSubmissionStyles.buttonText}>Submit</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>

      {/* Map Modal */}
      <Modal visible={showMapModal} animationType="slide" onRequestClose={() => setShowMapModal(false)}>
        <View style={ReportSubmissionStyles.mapModalContainer}>
          {mapError ? (
            <View style={ReportSubmissionStyles.errorContainer}>
              <Text style={ReportSubmissionStyles.errorText}>{mapError}</Text>
              <TouchableOpacity
                style={[ReportSubmissionStyles.modalButton, { backgroundColor: '#FF4444' }]}
                onPress={() => {
                  setMapError(null);
                  setShowMapModal(false);
                }}
              >
                <Text style={ReportSubmissionStyles.modalButtonText}>Close</Text>
              </TouchableOpacity>
            </View>
          ) : mapHtml ? (
            <>
              <WebView
                ref={webViewRef}
                style={ReportSubmissionStyles.map}
                source={{ html: mapHtml }}
                originWhitelist={['*']}
                javaScriptEnabled={true}
                domStorageEnabled={true}
                onMessage={(event) => {
                  try {
                    const data = JSON.parse(event.nativeEvent.data);
                    if (data.error) {
                      console.error('WebView JavaScript Error:', data.error);
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
                  setMapError('Failed to load map. Please check your internet connection or API key.');
                }}
              />
              <View style={ReportSubmissionStyles.modalButtonContainer}>
                <TouchableOpacity
                  style={[ReportSubmissionStyles.modalButton, { backgroundColor: '#00BCD4', marginRight: 10 }]}
                  onPress={handleMapConfirm}
                >
                  <Text style={ReportSubmissionStyles.modalButtonText}>Confirm Location</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[ReportSubmissionStyles.modalButton, { backgroundColor: '#FF4444' }]}
                  onPress={() => setShowMapModal(false)}
                >
                  <Text style={ReportSubmissionStyles.modalButtonText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </>
          ) : (
            <View style={ReportSubmissionStyles.errorContainer}>
              <Text style={ReportSubmissionStyles.errorText}>Unable to load map. Please try again.</Text>
              <TouchableOpacity
                style={[ReportSubmissionStyles.modalButton, { backgroundColor: '#FF4444' }]}
                onPress={() => setShowMapModal(false)}
              >
                <Text style={ReportSubmissionStyles.modalButtonText}>Close</Text>
              </TouchableOpacity>
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
        <View style={ReportSubmissionStyles.permissionModalOverlay}>
          <View style={ReportSubmissionStyles.permissionModalContainer}>
            <Ionicons name="location" size={60} color="#00BCD4" />
            <Text style={ReportSubmissionStyles.permissionModalTitle}>Location Access Required</Text>
            <Text style={ReportSubmissionStyles.permissionModalText}>
              Please allow location access to pin a location on the map.
            </Text>
            <TouchableOpacity
              style={[ReportSubmissionStyles.modalButton, { backgroundColor: '#00BCD4', marginBottom: 10 }]}
              onPress={handleRetryPermission}
            >
              <Text style={ReportSubmissionStyles.modalButtonText}>Allow Location</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[ReportSubmissionStyles.modalButton, { backgroundColor: '#FF4444' }]}
              onPress={() => setShowPermissionModal(false)}
            >
              <Text style={ReportSubmissionStyles.modalButtonText}>No Thanks</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
};

export default ReportSubmissionScreen;