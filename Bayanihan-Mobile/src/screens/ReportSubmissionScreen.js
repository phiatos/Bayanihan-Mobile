import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useNavigation, useRoute } from '@react-navigation/native';
import * as Location from 'expo-location';
import { ref as databaseRef, get } from 'firebase/database';
import React, { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Dimensions,
  FlatList,
  Modal,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import WebView from 'react-native-webview';
import { auth, database } from '../configuration/firebaseConfig';
import GlobalStyles from '../styles/GlobalStyles';
import RDANAStyles from '../styles/RDANAStyles';

const { height, width } = Dimensions.get('window');

const ReportSubmissionScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const webViewRef = useRef(null);

  // Helper functions at the top
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
    areaOfOperation: '',
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
  const [locationName, setLocationName] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);

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

  const handleRetryPermission = async () => {
    setShowPermissionModal(false);
    await requestLocationPermission();
  };

  const reverseGeocode = async (latitude, longitude) => {
    try {
      const geocodedLocation = await Location.reverseGeocodeAsync({ latitude, longitude });
      if (geocodedLocation && geocodedLocation.length > 0) {
        const address = geocodedLocation[0];
        const fullAddress = `${address.name ? address.name + ', ' : ''}${
          address.street ? address.street + ', ' : ''
        }${address.city ? address.city + ', ' : ''}${address.region ? address.region + ', ' : ''}${
          address.country ? address.country : ''
        }`;
        setLocationName(fullAddress.replace(/, $/, ''));
      } else {
        setLocationName(`${latitude.toFixed(6)}, ${longitude.toFixed(6)}`);
      }
    } catch (error) {
      console.error('Error reverse geocoding:', error);
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
    setSuggestions([]); // Clear suggestions after selection
  };

  const handleMapConfirm = () => {
    if (!reportData.areaOfOperation) {
      Alert.alert('No Location Selected', 'Please tap on the map or select a location from the search suggestions.');
      return;
    }
    setShowMapModal(false);
    setSuggestions([]); // Clear suggestions when closing modal
  };

  const handleOpenMap = async () => {
    if (permissionStatus !== 'granted') {
      await requestLocationPermission();
    } else {
      setShowMapModal(true);
    }
  };

  const handleSearch = () => {
    if (searchQuery.trim()) {
      const jsCode = `
        if (window.searchPlaces) {
          window.searchPlaces(${JSON.stringify(searchQuery)});
        }
        true;
      `;
      webViewRef.current?.injectJavaScript(jsCode);
    } else {
      setSuggestions([]); // Clear suggestions if query is empty
    }
  };

  const handleSuggestionSelect = (placeId) => {
    const jsCode = `
      if (window.selectPlace) {
        window.selectPlace(${JSON.stringify(placeId)});
      }
      true;
    `;
    webViewRef.current?.injectJavaScript(jsCode);
    setSearchQuery(''); // Clear search input after selection
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
      Alert.alert('Incomplete Data', `Please fill out the following:\n${Object.values(newErrors).join('\n')}`);
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
    <Text style={RDANAStyles.formTitle}>
      {label}
      {isRequired && <Text style={{ color: 'red' }}>*</Text>}
    </Text>
  );

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

  const mapHtml = permissionStatus === 'granted' && selectedLocation
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
          let autocompleteService;
          let placeService;

          function initMap() {
            const userLocation = { lat: ${selectedLocation.latitude}, lng: ${selectedLocation.longitude} };
            map = new google.maps.Map(document.getElementById("map"), {
              center: userLocation,
              zoom: 16,
              mapTypeId: "roadmap",
            });

            geocoder = new google.maps.Geocoder();
            autocompleteService = new google.maps.places.AutocompleteService();
            placeService = new google.maps.places.PlacesService(map);

            // Initial marker for current location
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

              const clickedLocation = { lat: event.latLng.lat(), lng: event.latLng.lng() };

              const marker = new google.maps.Marker({
                position: clickedLocation,
                map: map,
                title: "Pinned Location",
              });
              markers.push(marker);

              geocoder.geocode({ location: clickedLocation }, (results, status) => {
                let formattedAddress = "";
                let infoContent = \`Lat: \${clickedLocation.lat.toFixed(6)}, Lng: \${clickedLocation.lng.toFixed(6)}\`;

                if (status === "OK" && results[0]) {
                  formattedAddress = results[0].formatted_address;
                  infoContent = formattedAddress;
                }

                const infowindow = new google.maps.InfoWindow({
                  content: infoContent,
                });
                marker.addListener("click", () => {
                  infowindow.open(map, marker);
                });
                infowindow.open(map, marker);

                try {
                  window.ReactNativeWebView.postMessage(JSON.stringify({
                    latitude: clickedLocation.lat,
                    longitude: clickedLocation.lng,
                    formattedAddress: formattedAddress
                  }));
                } catch (error) {
                  console.error("postMessage error:", error);
                }
              });

              map.setCenter(event.latLng);
              map.setZoom(16);
            });

            window.searchPlaces = function(query) {
              if (!query) {
                window.ReactNativeWebView.postMessage(JSON.stringify({ suggestions: [] }));
                return;
              }
              autocompleteService.getPlacePredictions(
                { 
                  input: query, 
                  types: ['geocode'],
                  componentRestrictions: { country: 'ph' }
                },
                (predictions, status) => {
                  if (status !== google.maps.places.PlacesServiceStatus.OK || !predictions) {
                    window.ReactNativeWebView.postMessage(JSON.stringify({ suggestions: [], error: "No results found" }));
                    return;
                  }
                  const suggestions = predictions.map(prediction => ({
                    placeId: prediction.place_id,
                    description: prediction.description
                  }));
                  try {
                    window.ReactNativeWebView.postMessage(JSON.stringify({ suggestions }));
                  } catch (error) {
                    console.error("postMessage error:", error);
                  }
                }
              );
            };

            window.selectPlace = function(placeId) {
              placeService.getDetails(
                { placeId: placeId, fields: ['geometry', 'formatted_address'] },
                (place, detailStatus) => {
                  if (detailStatus !== google.maps.places.PlacesServiceStatus.OK || !place.geometry) {
                    window.ReactNativeWebView.postMessage(JSON.stringify({ error: "Failed to fetch place details" }));
                    return;
                  }
                  clearMarkers();
                  const location = {
                    lat: place.geometry.location.lat(),
                    lng: place.geometry.location.lng(),
                  };
                  const marker = new google.maps.Marker({
                    position: location,
                    map: map,
                    title: place.formatted_address || "Selected Location",
                  });
                  markers.push(marker);
                  const infowindow = new google.maps.InfoWindow({
                    content: place.formatted_address || \`Lat: \${location.lat.toFixed(6)}, Lng: \${location.lng.toFixed(6)}\`,
                  });
                  marker.addListener("click", () => {
                    infowindow.open(map, marker);
                  });
                  infowindow.open(map, marker);
                  map.setCenter(location);
                  map.setZoom(16);
                  try {
                    window.ReactNativeWebView.postMessage(JSON.stringify({
                      latitude: location.lat,
                      longitude: location.lng,
                      formattedAddress: place.formatted_address || ""
                    }));
                  } catch (error) {
                    console.error("postMessage error:", error);
                  }
                }
              );
            };
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
    <View style={RDANAStyles.container}>
      <View style={GlobalStyles.headerContainer}>
        <TouchableOpacity onPress={() => navigation.openDrawer()} style={GlobalStyles.headerMenuIcon}>
          <Ionicons name="menu" size={32} color="white" />
        </TouchableOpacity>
        <Text style={GlobalStyles.headerTitle}>Reports Submission</Text>
      </View>

      <SafeAreaView style={{ flex: 1 }} edges={['left', 'right', 'bottom']}>
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
                style={[RDANAStyles.input, errors.areaOfOperation && RDANAStyles.requiredInput]}
                placeholder="Select location on map"
                value={locationName || reportData.areaOfOperation}
                editable={false}
                selectTextOnFocus={false}
              />
              <TouchableOpacity
                style={[RDANAStyles.button, { backgroundColor: '#00BCD4', marginTop: 8 }]}
                onPress={handleOpenMap}
              >
                <Text style={RDANAStyles.buttonText}>📍 Pin Location</Text>
              </TouchableOpacity>
              {errors.areaOfOperation && <Text style={[RDANAStyles.errorText, { marginTop: 2 }]}>{errors.areaOfOperation}</Text>}
              {renderLabel('Date of Report', true)}
              <TouchableOpacity
                style={[RDANAStyles.input, errors.dateOfReport && RDANAStyles.requiredInput, { flexDirection: 'row', alignItems: 'center' }]}
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
              {errors.dateOfReport && <Text style={[RDANAStyles.errorText, { marginTop: 2 }]}>{errors.dateOfReport}</Text>}
            </View>

            <View style={RDANAStyles.section}>
              <Text style={RDANAStyles.sectionTitle}>Relief Operations</Text>
              {renderLabel('Select Calamity & Area of Operation', true)}
              <TextInput
                style={[RDANAStyles.input, errors.calamityAndArea && RDANAStyles.requiredInput]}
                placeholder="Enter Calamity & Area"
                onChangeText={(val) => handleChange('calamityAndArea', val)}
                value={reportData.calamityAndArea}
              />
              {errors.calamityAndArea && <Text style={[RDANAStyles.errorText, { marginTop: 2 }]}>{errors.calamityAndArea}</Text>}
              {renderLabel('Completion Time of Intervention', true)}
              <TouchableOpacity
                style={[RDANAStyles.input, errors.completionTimeOfIntervention && RDANAStyles.requiredInput, { flexDirection: 'row', alignItems: 'center' }]}
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
                <Text style={[RDANAStyles.errorText, { marginTop: 2 }]}>{errors.completionTimeOfIntervention}</Text>
              )}
              {renderLabel('Starting Date of Operation', true)}
              <TouchableOpacity
                style={[RDANAStyles.input, errors.startingDateOfOperation && RDANAStyles.requiredInput, { flexDirection: 'row', alignItems: 'center' }]}
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
                <Text style={[RDANAStyles.errorText, { marginTop: 2 }]}>{errors.startingDateOfOperation}</Text>
              )}
              {renderLabel('Ending Date of Operation', true)}
              <TouchableOpacity
                style={[RDANAStyles.input, errors.endingDateOfOperation && RDANAStyles.requiredInput, { flexDirection: 'row', alignItems: 'center' }]}
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
                <Text style={[RDANAStyles.errorText, { marginTop: 2 }]}>{errors.endingDateOfOperation}</Text>
              )}
              {renderLabel('No. of Individuals or Families', true)}
              <TextInput
                style={[RDANAStyles.input, errors.individualsOrFamilies && RDANAStyles.requiredInput]}
                placeholder="Enter No. of Individuals or Families"
                onChangeText={(val) => handleChange('individualsOrFamilies', val)}
                value={reportData.individualsOrFamilies}
                keyboardType="numeric"
              />
              {errors.individualsOrFamilies && (
                <Text style={[RDANAStyles.errorText, { marginTop: 2 }]}>{errors.individualsOrFamilies}</Text>
              )}
              {renderLabel('No. of Relief Packs', true)}
              <TextInput
                style={[RDANAStyles.input, errors.reliefPacks && RDANAStyles.requiredInput]}
                placeholder="Enter No. of Relief Packs"
                onChangeText={(val) => handleChange('reliefPacks', val)}
                value={reportData.reliefPacks}
                keyboardType="numeric"
              />
              {errors.reliefPacks && <Text style={[RDANAStyles.errorText, { marginTop: 2 }]}>{errors.reliefPacks}</Text>}
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
                style={[RDANAStyles.input, errors.water && RDANAStyles.requiredInput]}
                placeholder="Enter Liters of Water"
                onChangeText={(val) => handleChange('water', val)}
                value={reportData.water}
                keyboardType="numeric"
              />
              {errors.water && <Text style={[RDANAStyles.errorText, { marginTop: 2 }]}>{errors.water}</Text>}
              {renderLabel('No. of Volunteers Mobilized', true)}
              <TextInput
                style={[RDANAStyles.input, errors.volunteers && RDANAStyles.requiredInput]}
                placeholder="Enter No. of Volunteers"
                onChangeText={(val) => handleChange('volunteers', val)}
                value={reportData.volunteers}
                keyboardType="numeric"
              />
              {errors.volunteers && <Text style={[RDANAStyles.errorText, { marginTop: 2 }]}>{errors.volunteers}</Text>}
              {renderLabel('No. of Organizations Activated', true)}
              <TextInput
                style={[RDANAStyles.input, errors.organizationsActivated && RDANAStyles.requiredInput]}
                placeholder="Enter No. of Organizations"
                onChangeText={(val) => handleChange('organizationsActivated', val)}
                value={reportData.organizationsActivated}
                keyboardType="numeric"
              />
              {errors.organizationsActivated && (
                <Text style={[RDANAStyles.errorText, { marginTop: 2 }]}>{errors.organizationsActivated}</Text>
              )}
              {renderLabel('Total Value of In-Kind Donations', true)}
              <TextInput
                style={[RDANAStyles.input, errors.inKindValue && RDANAStyles.requiredInput]}
                placeholder="Enter Value of In-Kind Donations"
                onChangeText={(val) => handleChange('inKindValue', val)}
                value={reportData.inKindValue}
                keyboardType="numeric"
              />
              {errors.inKindValue && <Text style={[RDANAStyles.errorText, { marginTop: 2 }]}>{errors.inKindValue}</Text>}
              {renderLabel('Total Monetary Donations', true)}
              <TextInput
                style={[RDANAStyles.input, errors.monetaryDonations && RDANAStyles.requiredInput]}
                placeholder="Enter Total Monetary Donations"
                onChangeText={(val) => handleChange('monetaryDonations', val)}
                value={reportData.monetaryDonations}
                keyboardType="numeric"
              />
              {errors.monetaryDonations && (
                <Text style={[RDANAStyles.errorText, { marginTop: 2 }]}>{errors.monetaryDonations}</Text>
              )}
            </View>
            <TouchableOpacity style={RDANAStyles.button} onPress={handleSubmit}>
              <Text style={RDANAStyles.buttonText}>Submit</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>

      <Modal visible={showMapModal} animationType="slide" onRequestClose={() => setShowMapModal(false)}>
        <View style={styles.mapModalContainer}>
          {mapError ? (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{mapError}</Text>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: '#FF4444' }]}
                onPress={() => {
                  setMapError(null);
                  setShowMapModal(false);
                  setSuggestions([]);
                }}
              >
                <Text style={styles.modalButtonText}>Close</Text>
              </TouchableOpacity>
            </View>
          ) : mapHtml ? (
            <>
              <View style={styles.searchContainer}>
                <TextInput
                  style={styles.searchInput}
                  placeholder="Search for a location in the Philippines"
                  value={searchQuery}
                  onChangeText={(text) => {
                    setSearchQuery(text);
                    handleSearch();
                  }}
                  returnKeyType="search"
                />
                <TouchableOpacity onPress={handleSearch} style={styles.searchButton}>
                  <Ionicons name="search" size={24} color="#00BCD4" />
                </TouchableOpacity>
              </View>
              {suggestions.length > 0 && (
                <FlatList
                  style={styles.suggestionsList}
                  data={suggestions}
                  keyExtractor={(item) => item.placeId}
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      style={styles.suggestionItem}
                      onPress={() => handleSuggestionSelect(item.placeId)}
                    >
                      <Text style={styles.suggestionText}>{item.description}</Text>
                    </TouchableOpacity>
                  )}
                />
              )}
              <WebView
                ref={webViewRef}
                style={[styles.map, { height: suggestions.length > 0 ? height * 0.6 : height * 0.8 }]}
                source={{ html: mapHtml }}
                originWhitelist={['*']}
                onMessage={(event) => {
                  try {
                    const data = JSON.parse(event.nativeEvent.data);
                    if (data.suggestions) {
                      setSuggestions(data.suggestions);
                      if (data.error) {
                        setMapError(data.error);
                      }
                    } else if (data.latitude && data.longitude) {
                      handleMapPress(data);
                    } else if (data.error) {
                      setMapError(data.error);
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
              <View style={styles.modalButtonContainer}>
                <TouchableOpacity
                  style={[styles.modalButton, { backgroundColor: '#00BCD4', marginRight: 10 }]}
                  onPress={handleMapConfirm}
                >
                  <Text style={styles.modalButtonText}>Confirm Location</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalButton, { backgroundColor: '#FF4444' }]}
                  onPress={() => {
                    setShowMapModal(false);
                    setSuggestions([]);
                  }}
                >
                  <Text style={styles.modalButtonText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </>
          ) : (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>Initializing map...</Text>
            </View>
          )}
        </View>
      </Modal>

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
  mapModalContainer: {
    flex: 1,
    backgroundColor: 'white',
  },
  map: {
    width: width,
    borderRadius: 10,
    overflow: 'hidden',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    margin: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ccc',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  searchInput: {
    flex: 1,
    height: 40,
    paddingHorizontal: 10,
    fontSize: 16,
  },
  searchButton: {
    padding: 10,
  },
  suggestionsList: {
    maxHeight: 150,
    marginHorizontal: 10,
    backgroundColor: 'white',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ccc',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  suggestionItem: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  suggestionText: {
    fontSize: 16,
    color: '#333',
  },
  modalButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginVertical: 10,
  },
  modalButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
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
    backgroundColor: 'rgba(0,0,0,0.7)',
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
    shadowRadius: 4,
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