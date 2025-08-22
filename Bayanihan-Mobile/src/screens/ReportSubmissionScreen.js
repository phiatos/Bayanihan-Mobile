
import { Ionicons, Feather, MaterialIcons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Picker } from '@react-native-picker/picker';
import { useNavigation, useRoute } from '@react-navigation/native';
import { ref as databaseRef, get, onValue, query, orderByChild, equalTo } from 'firebase/database';
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Alert, Platform, SafeAreaView, ScrollView, Text, TextInput, TouchableOpacity, View, StyleSheet, Dimensions, KeyboardAvoidingView, Modal, StatusBar, ToastAndroid, FlatList, Animated } from 'react-native';
import * as Location from 'expo-location';
import WebView from 'react-native-webview';
import { auth, database } from '../configuration/firebaseConfig';
import GlobalStyles from '../styles/GlobalStyles';
import styles from '../styles/ReportSubmissionStyles';
import { LinearGradient } from 'expo-linear-gradient';
import Theme from '../constants/theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { height, width } = Dimensions.get('window');

const ReportSubmissionScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const webViewRef = useRef(null);
  const insets = useSafeAreaInsets();
  const searchAnim = useRef(new Animated.Value(0)).current;
  const [searchBarVisible, setSearchBarVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);

  // Helper functions for formatting
  const formatDate = (date) => {
    if (!date) return '';
    const d = new Date(date);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0'); // Months are 0-based
    const year = d.getFullYear();
    return `${day}-${month}-${year}`;
  };

  const formatTime = (date) => {
    if (!date) return '';
    let hours = date.getHours();
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const ampm = hours >= 12 ? 'pm' : 'am';
    hours = hours % 12;
    hours = hours || 12;
    return `${hours.toString().padStart(2, '0')}:${minutes} ${ampm}`; // HH:MM AM/PM
  };

  // Initialize current date
  const currentDate = new Date();

  const [reportData, setReportData] = useState({
    reportID: '',
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
  const [mapType, setMapType] = useState('hybrid');

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
        let loc = await Location.getCurrentPositionAsync({});
        if (loc.coords.accuracy > 50) {
          ToastAndroid.show('Your location accuracy is low. The pin may not be precise.', ToastAndroid.BOTTOM);
        }
        setLocation({
          latitude: loc.coords.latitude,
          longitude: loc.coords.longitude,
        });
        await reverseGeocode(loc.coords.latitude, loc.coords.longitude);
        setShowMapModal(true);
      } else {
        setPermissionStatus('denied');
        setShowPermissionModal(true);
      }
    } catch (error) {
      console.error('Permission error:', error);
      setMapError('Failed to request location permission. Please try again.');
      setShowPermissionModal(true);
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
                ToastAndroid.show('Failed to load active operations. Please try again.', ToastAndroid.BOTTOM);
              }
            );
          } catch (error) {
            console.error('Error fetching user data:', error.message);
            ToastAndroid.show('Failed to fetch user group. Please try again.', ToastAndroid.BOTTOM);
          }
        } else {
          console.warn('No user is logged in');
          navigation.navigate('Login');
        }
      },
      (error) => {
        console.error('Auth state listener error:', error.message);
        ToastAndroid.show('Authentication error: ' + error.message, ToastAndroid.BOTTOM);
      }
    );

    return () => unsubscribe();
  }, [navigation, organizationName]);

  // Effect to handle navigation params and generate Report ID
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
            calamityArea: `${displayCalamity} (by ${savedActivation.organization})`,
            CalamityAreaId: savedActivation.id,
          }));
        }
      }
    } else {
      const generateReportID = () => {
        const randomNumbers = Math.floor(1000000000 + Math.random() * 9000000000);
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
        ].filter(Boolean).join(', ');
        setLocationName(fullAddress || 'Unknown Location');
        return fullAddress || 'Unknown Location';
      } else {
        setLocationName('Unknown Location');
        return 'Unknown Location';
      }
    } catch (error) {
      console.error('Reverse Geocoding Error:', error);
      setLocationName('Unknown Location');
      ToastAndroid.show('Failed to fetch location name. Using "Unknown Location" instead.', ToastAndroid.BOTTOM);
      return 'Unknown Location';
    }
  };

  // Toggle search bar visibility with animation
  const toggleSearchBar = () => {
    if (searchBarVisible) {
      Animated.timing(searchAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: false,
      }).start(() => setSearchBarVisible(false));
      setSearchQuery('');
      setSuggestions([]);
    } else {
      setSearchBarVisible(true);
      Animated.timing(searchAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: false,
      }).start();
    }
  };

  // Fetch place suggestions using Google Places API
  const fetchSuggestions = async (query) => {
    if (!query) {
      setSuggestions([]);
      return;
    }
    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(query)}&key=AIzaSyAAAu6BeQjIZ7H7beFbAsPWuKuORmh0wrk&fields=formatted_address,geometry`
      );
      const data = await response.json();
      if (data.status === 'OK') {
        setSuggestions(data.predictions);
      } else {
        console.error('Places API error:', data.status);
        setMapError('Failed to fetch place suggestions.');
      }
    } catch (error) {
      console.error('Error fetching suggestions:', error);
      setMapError('Failed to fetch place suggestions.');
    }
  };

  // Handle search input change
  const handleSearchInput = (text) => {
    setSearchQuery(text);
    fetchSuggestions(text);
  };

  // Handle search submission
  const handleSearch = async () => {
    if (!searchQuery) return;
    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(searchQuery)}&key=AIzaSyAAAu6BeQjIZ7H7beFbAsPWuKuORmh0wrk`
      );
      const data = await response.json();
      if (data.status === 'OK' && data.results.length > 0) {
        const place = data.results[0];
        const locationData = {
          latitude: place.geometry.location.lat,
          longitude: place.geometry.location.lng,
          formattedAddress: place.formatted_address || 'Unknown Location',
        };
        handleMapPress(locationData);
        updateMapLocation(locationData);
        setSuggestions([]);
        setSearchQuery('');
        toggleSearchBar();
      } else {
        setMapError('No results found for the search query.');
      }
    } catch (error) {
      console.error('Search error:', error);
      setMapError('Failed to search location.');
    }
  };

  // Handle suggestion selection
  const handleSuggestionSelect = async (item) => {
    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/place/details/json?place_id=${item.place_id}&key=AIzaSyBDtlY28p-MvLHRtxnjiibSAadSETvM3VU&fields=formatted_address,geometry`
      );
      const data = await response.json();
      if (data.status === 'OK') {
        const place = data.result;
        const locationData = {
          latitude: place.geometry.location.lat,
          longitude: place.geometry.location.lng,
          formattedAddress: place.formatted_address || 'Unknown Location',
        };
        handleMapPress(locationData);
        updateMapLocation(locationData);
        setSuggestions([]);
        setSearchQuery('');
        toggleSearchBar();
      } else {
        setMapError('Failed to fetch place details.');
      }
    } catch (error) {
      console.error('Suggestion select error:', error);
      setMapError('Failed to fetch place details.');
    }
  };

  // Update map location in WebView
  const updateMapLocation = (locationData) => {
    const script = `
      if (window.map) {
        const newLocation = { lat: ${locationData.latitude}, lng: ${locationData.longitude} };
        window.clearNonActivationMarkers();
        const marker = new google.maps.Marker({
          position: newLocation,
          map: window.map,
          title: "${locationData.formattedAddress || 'Pinned Location'}",
        });
        window.nonActivationMarkers.push(marker);
        window.map.setCenter(newLocation);
        window.map.setZoom(16);
        window.singleInfoWindow.setContent("${locationData.formattedAddress || 'Unknown Location'}");
        window.singleInfoWindow.open(window.map, marker);
      } else {
        console.error("Map not initialized");
      }
      true;
    `;
    webViewRef.current?.injectJavaScript(script);
  };

  // Return to user location
  const returnToUserLocation = () => {
    if (location?.latitude && location?.longitude) {
      const locationData = {
        latitude: location.latitude,
        longitude: location.longitude,
        formattedAddress: locationName || 'Your Location',
      };
      handleMapPress(locationData);
      updateMapLocation(locationData);
    } else {
      setMapError('User location unavailable.');
    }
  };

  const toggleMapType = (type) => {
    setMapType(type);
    const script = `
      if (window.map) {
        window.map.setMapTypeId("${type}");
      } else {
        console.error("Map not initialized");
      }
      true;
    `;
    webViewRef.current?.injectJavaScript(script);
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
        calamityArea: '',
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
          calamityArea: `${displayCalamity} (by ${selectedActivation.organization})`,
          CalamityAreaId: selectedActivation.id,
        }));
        setLocationName(reportData.AreaOfOperation);
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
      ToastAndroid.show('Please select a location on the map or search for an address before confirming.', ToastAndroid.BOTTOM);
      return;
    }
    setShowMapModal(false);
  };

  const handleOpenMap = async () => {
    if (permissionStatus !== 'granted') {
      await handleRequestPermission();
    } else if (location?.latitude && location?.longitude) {
      setShowMapModal(true);
    } else {
      setMapError('Location unavailable. Please try again.');
      await handleRequestPermission();
    }
  };

  const handleRetryPermission = async () => {
    await handleRequestPermission();
    setShowPermissionModal(false);
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
      reportID: reportData.reportID || `REPORTS-${Math.floor(1000000000 + Math.random() * 9000000000)}`,
      locationName,
      coordinates: selectedLocation ? `${selectedLocation.latitude},${selectedLocation.longitude}` : null,
    };

    navigation.navigate('ReportSummary', { reportData: serializedReportData, userUid, organizationName });
  };

  const renderLabel = (label, isRequired) => (
    <Text style={GlobalStyles.formTitle}>
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
          <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
          <style>
            html, body {
              height: 100%;
              width: 100%;
              margin: 0;
              padding: 0;
              overflow: hidden;
            }
            #map {
              height: 100%;
              width: 100%;
              position: absolute;
              top: 0;
              left: 0;
            }
            #error-message {
              position: absolute;
              top: 10px;
              left: 10px;
              right: 10px;
              background: #ff4444;
              color: white;
              padding: 10px;
              border-radius: 4px;
              text-align: center;
              z-index: 10;
              display: none;
            }
          </style>
        </head>
        <body>
          <div id="error-message"></div>
          <div id="map"></div>
          <script>
            function showError(message) {
              const errorDiv = document.getElementById("error-message");
              errorDiv.style.display = "block";
              errorDiv.innerText = message;
              window.ReactNativeWebView.postMessage(JSON.stringify({ error: message }));
            }

            let map;
            let activationMarkers = [];
            let nonActivationMarkers = [];
            let geocoder;
            let singleInfoWindow;

            function initMap() {
              try {
                const userLocation = { lat: ${location.latitude}, lng: ${location.longitude} };
                map = new google.maps.Map(document.getElementById("map"), {
                  center: userLocation,
                  zoom: 16,
                  mapTypeId: "${mapType}",
                  mapTypeControl: false,
                  streetViewControl: false,
                  zoomControl: false,
                  fullscreenControl: false,
                  keyboardShortcuts: false,
                  disableDefaultUI: true
                });

                geocoder = new google.maps.Geocoder();
                singleInfoWindow = new google.maps.InfoWindow();

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

                window.ReactNativeWebView.postMessage(JSON.stringify({ status: "Map initialized" }));
              } catch (error) {
                showError("Map initialization failed: " + error.message);
              }
            }

            function clearNonActivationMarkers() {
              nonActivationMarkers.forEach((marker) => marker.setMap(null));
              nonActivationMarkers = [];
            }

            window.clearNonActivationMarkers = clearNonActivationMarkers;

            // Load Google Maps API asynchronously
            const script = document.createElement("script");
            script.src = "https://maps.googleapis.com/maps/api/js?key=AIzaSyAAAu6BeQjIZ7H7beFbAsPWuKuORmh0wrk&libraries=places&callback=initMap";
            script.async = true;
            script.onerror = () => showError("Failed to load Google Maps API");
            document.head.appendChild(script);
          </script>
        </body>
        </html>
      `
    : `
        <!DOCTYPE html>
        <html>
        <body>
          <div style="display: flex; justify-content: center; align-items: center; height: 100%; width: 100%; text-align: center;">
            <p style="color: #ff4444; font-size: 18px;">Unable to load map: Location permission denied or location unavailable</p>
          </div>
        </body>
        </html>
      `;

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
          <Text style={[GlobalStyles.headerTitle, { color: Theme.colors.primary }]}>Reports Submission</Text>
        </View>
      </LinearGradient>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1, marginTop: 80 }}
        keyboardVerticalOffset={0}
      >
        <ScrollView
          contentContainerStyle={[styles.scrollViewContent]}
          scrollEnabled={true}
          keyboardShouldPersistTaps="handled"
        >
          <View style={GlobalStyles.form}>
            <View style={GlobalStyles.section}>
              <Text style={GlobalStyles.sectionTitle}>Basic Information</Text>
              {renderLabel('Report ID', true)}
              <TextInput
                style={[GlobalStyles.input, { backgroundColor: '#f0f0f0' }]}
                value={reportData.reportID}
                editable={false}
                selectTextOnFocus={false}
              />
              {renderLabel('Area of Operation', true)}
              <TextInput
                style={[GlobalStyles.input, errors.AreaOfOperation && styles.requiredInput]}
                placeholder="e.g. Purok 2, Brgy. Maligaya, Rosario"
                value={locationName || reportData.AreaOfOperation}
                onChangeText={(text) => {
                  setLocationName(text);
                  handleChange('AreaOfOperation', text);
                }}
                editable={true}
              />
              <TouchableOpacity
                style={styles.openMap}
                onPress={handleOpenMap}
              >
                <MaterialIcons name="pin-drop" size={28} style={{ color: 'white' }} />
                <Text style={styles.openMapText}> Pin Location</Text>
              </TouchableOpacity>
              {errors.AreaOfOperation && <Text style={[styles.errorText, { marginTop: 2 }]}>{errors.AreaOfOperation}</Text>}
              {renderLabel('Date of Report', true)}
              <View style={[GlobalStyles.input, errors.DateOfReport && styles.requiredInput, { flexDirection: 'row', alignItems: 'center' }]}>
                <Text style={{ flex: 1, color: reportData.DateOfReport ? '#000' : '#999' }}>
                  {reportData.DateOfReport || 'dd-mm-yyyy'}
                </Text>
              </View>
              {errors.DateOfReport && <Text style={[styles.errorText, { marginTop: 2 }]}>{errors.DateOfReport}</Text>}
            </View>

            <View style={GlobalStyles.section}>
              <Text style={GlobalStyles.sectionTitle}>Relief Operations</Text>
              {renderLabel('Select Calamity', true)}
              <View style={[GlobalStyles.input, errors.calamityArea && styles.requiredInput, styles.pickerContainer, { height: 45, paddingVertical: 0, alignContent: 'center', justifyContent: 'center', paddingHorizontal: 0 }]}>
                <Picker
                  selectedValue={reportData.CalamityAreaId}
                  onValueChange={(value) => handleCalamityChange(value)}
                  style={{
                    fontFamily: 'Poppins_Regular',
                    fontSize: 14,
                    height: 68,
                    width: '100%',
                    textAlign: 'center',
                    color: reportData.CalamityAreaId ? '#000' : '#999'
                  }}
                  dropdownIconColor="#00BCD4"
                >
                  <Picker.Item label="Select an Active Operation" value=""
                    style={{ fontFamily: 'Poppins_Regular', textAlign: 'center', fontSize: 14 }} />
                  {activeActivations.map((activation) => {
                    let displayCalamity = activation.calamityType;
                    if (activation.calamityType === 'Typhoon' && activation.typhoonName) {
                      displayCalamity += ` (${activation.typhoonName})`;
                    }
                    const organizationName = activation.organization || 'Unknown Organization';
                    return (
                      <Picker.Item
                        style={{ fontFamily: 'Poppins_Regular', textAlign: 'center', fontSize: 14 }}
                        key={activation.id}
                        label={`${displayCalamity} (by ${organizationName})`}
                        value={activation.id}
                      />
                    );
                  })}
                </Picker>
              </View>
              {renderLabel('Completion Time of Intervention', true)}
              <TouchableOpacity
                style={[GlobalStyles.input, errors.completionTimeOfIntervention && styles.requiredInput, { flexDirection: 'row', alignItems: 'center' }]}
                onPress={() => setShowTimePicker((prev) => ({ ...prev, completionTimeOfIntervention: true }))}
              >
                <Text style={{ flex: 1, color: reportData.completionTimeOfIntervention ? '#000' : '#999' }}>
                  {reportData.completionTimeOfIntervention || '--:-- --'}
                </Text>
                <Ionicons name="time" size={24} style={{ color: "#00BCD4" }} />
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
              {errors.completionTimeOfIntervention && <Text style={[styles.errorText, { marginTop: 2 }]}>{errors.completionTimeOfIntervention}</Text>}
              {renderLabel('Starting Date of Operation', true)}
              <TouchableOpacity
                style={[GlobalStyles.input, errors.StartDate && styles.requiredInput, { flexDirection: 'row', alignItems: 'center' }]}
                onPress={() => setShowDatePicker((prev) => ({ ...prev, StartDate: true }))}
              >
                <Text style={{ flex: 1, color: reportData.StartDate ? '#000' : '#999' }}>
                  {reportData.StartDate || 'dd/mm/yyyy'}
                </Text>
                <Ionicons name="calendar" size={24} style={{ color: "#00BCD4" }} />
              </TouchableOpacity>
              {showDatePicker.StartDate && (
                <DateTimePicker
                  value={tempDate.StartDate}
                  mode="date"
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  onChange={(event, date) => handleDateChange('StartDate', event, date)}
                />
              )}
              {errors.StartDate && <Text style={[styles.errorText, { marginTop: 2 }]}>{errors.StartDate}</Text>}
              {renderLabel('Ending Date of Operation', true)}
              <TouchableOpacity
                style={[GlobalStyles.input, errors.EndDate && styles.requiredInput, { flexDirection: 'row', alignItems: 'center' }]}
                onPress={() => setShowDatePicker((prev) => ({ ...prev, EndDate: true }))}
              >
                <Text style={{ flex: 1, color: reportData.EndDate ? '#000' : '#999' }}>
                  {reportData.EndDate || 'dd/mm/yyyy'}
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
              {errors.EndDate && <Text style={[styles.errorText, { marginTop: 2 }]}>{errors.EndDate}</Text>}
              {renderLabel('No. of Individuals or Families', true)}
              <TextInput
                style={[GlobalStyles.input, errors.NoOfIndividualsOrFamilies && styles.requiredInput]}
                placeholder="No. of Individuals or Families"
                onChangeText={(val) => handleChange('NoOfIndividualsOrFamilies', val)}
                value={reportData.NoOfIndividualsOrFamilies}
                keyboardType="numeric"
              />
              {errors.NoOfIndividualsOrFamilies && <Text style={[styles.errorText, { marginTop: 2 }]}>{errors.NoOfIndividualsOrFamilies}</Text>}
              {renderLabel('No. of Relief Packs', true)}
              <TextInput
                style={[GlobalStyles.input, errors.NoOfFoodPacks && styles.requiredInput]}
                placeholder="No. of Food Packs"
                onChangeText={(val) => handleChange('NoOfFoodPacks', val)}
                value={reportData.NoOfFoodPacks}
                keyboardType="numeric"
              />
              {errors.NoOfFoodPacks && <Text style={[styles.errorText, { marginTop: 2 }]}>{errors.NoOfFoodPacks}</Text>}
              {renderLabel('No. of Hot Meals/Ready-to-eat Food', true)}
              <TextInput
                style={[GlobalStyles.input, errors.hotMeals && styles.requiredInput]}
                placeholder="No. of Hot Meals"
                onChangeText={(val) => handleChange('hotMeals', val)}
                value={reportData.hotMeals}
                keyboardType="numeric"
              />
              {errors.hotMeals && <Text style={[styles.errorText, { marginTop: 2 }]}>{errors.hotMeals}</Text>}
              {renderLabel('Liters of Water', true)}
              <TextInput
                style={[GlobalStyles.input, errors.LitersOfWater && styles.requiredInput]}
                placeholder="Liters of Water"
                onChangeText={(val) => handleChange('LitersOfWater', val)}
                value={reportData.LitersOfWater}
                keyboardType="numeric"
              />
              {errors.LitersOfWater && <Text style={[styles.errorText, { marginTop: 2 }]}>{errors.LitersOfWater}</Text>}
              {renderLabel('No. of Volunteers Mobilized', true)}
              <TextInput
                style={[GlobalStyles.input, errors.NoOfVolunteersMobilized && styles.requiredInput]}
                placeholder="No. of Volunteers Mobilized"
                onChangeText={(val) => handleChange('NoOfVolunteersMobilized', val)}
                value={reportData.NoOfVolunteersMobilized}
                keyboardType="numeric"
              />
              {errors.NoOfVolunteersMobilized && <Text style={[styles.errorText, { marginTop: 2 }]}>{errors.NoOfVolunteersMobilized}</Text>}
              {renderLabel('No. of Organizations Activated', true)}
              <TextInput
                style={[GlobalStyles.input, errors.NoOfOrganizationsActivated && styles.requiredInput]}
                placeholder="No. of Organizations Activated"
                onChangeText={(val) => handleChange('NoOfOrganizationsActivated', val)}
                value={reportData.NoOfOrganizationsActivated}
                keyboardType="numeric"
              />
              {errors.NoOfOrganizationsActivated && <Text style={[styles.errorText, { marginTop: 2 }]}>{errors.NoOfOrganizationsActivated}</Text>}
              {renderLabel('Total Value of In-Kind Donations', true)}
              <TextInput
                style={[GlobalStyles.input, errors.TotalValueOfInKindDonations && styles.requiredInput]}
                placeholder="Total Value of In-Kind Donations"
                onChangeText={(val) => handleChange('TotalValueOfInKindDonations', val)}
                value={reportData.TotalValueOfInKindDonations}
                keyboardType="numeric"
              />
              {errors.TotalValueOfInKindDonations && <Text style={[styles.errorText, { marginTop: 2 }]}>{errors.TotalValueOfInKindDonations}</Text>}
              {renderLabel('Total Monetary Donations', true)}
              <TextInput
                style={[GlobalStyles.input, errors.TotalMonetaryDonations && styles.requiredInput]}
                placeholder="Total Monetary Donations"
                onChangeText={(val) => handleChange('TotalMonetaryDonations', val)}
                value={reportData.TotalMonetaryDonations}
                keyboardType="numeric"
              />
              {errors.TotalMonetaryDonations && <Text style={[styles.errorText, { marginTop: 2 }]}>{errors.TotalMonetaryDonations}</Text>}
            </View>

            <View style={GlobalStyles.section}>
              <Text style={GlobalStyles.sectionTitle}>Additional Updates</Text>
              {renderLabel('Notes/Additional Information (Optional)', false)}
              <TextInput
                style={[GlobalStyles.input, errors.NotesAdditionalInformation && styles.requiredInput, { textAlignVertical: 'top', height: 100 }]}
                placeholder="Enter Notes/Additional Information"
                onChangeText={(val) => handleChange('NotesAdditionalInformation', val)}
                value={reportData.NotesAdditionalInformation}
                multiline
                numberOfLines={4}
              />
              {errors.NotesAdditionalInformation && <Text style={[styles.errorText, { marginTop: 2 }]}>{errors.NotesAdditionalInformation}</Text>}
            </View>

            <TouchableOpacity style={[GlobalStyles.button, { marginHorizontal: 10 }]} onPress={handleSubmit}>
              <Text style={GlobalStyles.buttonText}>Proceed</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Map Modal */}
      <Modal
        visible={showMapModal}
        animationType="slide"
        onRequestClose={() => setShowMapModal(false)}
      >
        <View style={{
          flex: 1,
          width: '100%',
          height: '100%',
          margin: 0,
          padding: 0,
          backgroundColor: '#fff',
        }}>
          {mapError ? (
            <View style={{
              flex: 1,
              justifyContent: 'center',
              alignItems: 'center',
              backgroundColor: '#fff',
            }}>
              <Text style={{
                color: '#ff4444',
                fontSize: 18,
                textAlign: 'center',
                marginBottom: 20,
              }}>{mapError}</Text>
              <TouchableOpacity
                style={{
                  backgroundColor: '#FF4444',
                  paddingVertical: 10,
                  paddingHorizontal: 20,
                  borderRadius: 5,
                }}
                onPress={() => {
                  setMapError(null);
                  setShowMapModal(false);
                }}
              >
                <Text style={{
                  color: '#fff',
                  fontSize: 16,
                  fontWeight: 'bold',
                }}>Close</Text>
              </TouchableOpacity>
            </View>
          ) : mapHtml ? (
            <>
              <WebView
                ref={webViewRef}
                style={{
                  flex: 1,
                  width: '100%',
                  height: '100%',
                }}
                source={{ html: mapHtml }}
                originWhitelist={['*']}
                javaScriptEnabled={true}
                domStorageEnabled={true}
                onMessage={(event) => {
                  try {
                    const data = JSON.parse(event.nativeEvent.data);
                    if (data.error) {
                      setMapError(data.error);
                    } else if (data.latitude && data.longitude) {
                      handleMapPress(data);
                    } else if (data.status) {
                      console.log(data.status);
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
                      : 'Failed to load map. Please try again.'
                  );
                }}
              />
              <View style={styles.overlayContainer}>
                <View style={styles.searchWrapper}>
                  <Animated.View
                    style={[
                      styles.searchContainer,
                      {
                        borderRadius: searchBarVisible ? 30 : '100%',
                        width: searchBarVisible ? '100%' : 45,
                        height: searchBarVisible ? '100%' : 45,
                        paddingLeft: searchBarVisible ? 0 : 1,
                      },
                    ]}
                  >
                    <TouchableOpacity
                      onPress={() => {
                        if (searchBarVisible) {
                          handleSearch();
                        } else {
                          toggleSearchBar();
                        }
                      }}
                    >
                      <Feather
                        name="search"
                        size={20}
                        style={[
                          styles.searchIcon,
                          {
                            color: Theme.colors.primary,
                            paddingLeft: searchBarVisible ? 15 : 8,
                            paddingRight: searchBarVisible ? 5 : 0,
                          },
                        ]}
                      />
                    </TouchableOpacity>
                    <Animated.View
                      style={{
                        flex: searchBarVisible ? 1 : 0,
                        opacity: searchAnim,
                        transform: [
                          {
                            translateX: searchAnim.interpolate({
                              inputRange: [0, 1],
                              outputRange: [20, 0],
                            }),
                          },
                        ],
                      }}
                    >
                      {searchBarVisible && (
                        <TextInput
                          placeholder="Search for an address"
                          style={{ flex: 1, fontFamily: 'Poppins_Regular' }}
                          placeholderTextColor="black"
                          value={searchQuery}
                          onChangeText={handleSearchInput}
                          onSubmitEditing={() => handleSearch()}
                          returnKeyType="search"
                          autoFocus={true}
                        />
                      )}
                    </Animated.View>
                  </Animated.View>
                  {searchBarVisible && suggestions.length > 0 && (
                    <FlatList
                      data={suggestions}
                      keyExtractor={(item) => item.place_id}
                      style={styles.suggestionsContainer}
                      renderItem={({ item }) => (
                        <TouchableOpacity
                          style={styles.suggestionItem}
                          onPress={() => handleSuggestionSelect(item)}
                        >
                          <Text style={styles.suggestionText}>{item.description}</Text>
                        </TouchableOpacity>
                      )}
                      keyboardShouldPersistTaps="handled"
                    />
                  )}
                  <TouchableOpacity style={styles.returnButton} onPress={returnToUserLocation}>
                    <MaterialIcons name="my-location" size={24} color={Theme.colors.white} />
                  </TouchableOpacity>
                </View>
              </View>
              <View style={styles.mapTypeButtonsContainer}>
                <TouchableOpacity
                  style={[styles.mapTypeButton, mapType === 'roadmap' && styles.mapTypeButtonActive]}
                  onPress={() => toggleMapType('roadmap')}
                >
                  <MaterialIcons
                    name="map"
                    size={24}
                    color={mapType === 'roadmap' ? Theme.colors.primary : '#FFFFFF'}
                  />
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.mapTypeButton, mapType === 'hybrid' && styles.mapTypeButtonActive]}
                  onPress={() => toggleMapType('hybrid')}
                >
                  <MaterialIcons
                    name="satellite"
                    size={24}
                    color={mapType === 'hybrid' ? Theme.colors.primary : '#FFFFFF'}
                  />
                </TouchableOpacity>
              </View>
              <View style={styles.modalButtonContainer}>
                <TouchableOpacity
                  style={styles.modalButton}
                  onPress={handleMapConfirm}
                >
                  <Text style={styles.modalButtonText}>Confirm Location</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.modalButtonCancel}
                  onPress={() => setShowMapModal(false)}
                >
                  <Text style={[styles.modalButtonText, { color: Theme.colors.primary }]}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </>
          ) : (
            <View style={{
              flex: 1,
              justifyContent: 'center',
              alignItems: 'center',
              backgroundColor: '#fff',
            }}>
              <Text style={{
                color: '#ff4444',
                fontSize: 18,
                textAlign: 'center',
                marginBottom: 20,
              }}>Waiting for location permission...</Text>
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
        <View style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: 'rgba(0,0,0,0.5)',
        }}>
          <View style={{
            backgroundColor: '#fff',
            padding: 20,
            borderRadius: 10,
            alignItems: 'center',
            width: '80%',
          }}>
            <Ionicons name="location" size={60} color="#00BCD4" />
            <Text style={{
              fontSize: 20,
              fontWeight: 'bold',
              marginVertical: 10,
            }}>Location Access Required</Text>
            <Text style={{
              fontSize: 16,
              textAlign: 'center',
              marginBottom: 20,
            }}>
              Please allow location access to pin a location on the map.
            </Text>
            <TouchableOpacity
              style={{
                backgroundColor: '#00BCD4',
                paddingVertical: 10,
                paddingHorizontal: 20,
                borderRadius: 5,
                marginBottom: 10,
              }}
              onPress={handleRetryPermission}
            >
              <Text style={{
                color: '#fff',
                fontSize: 16,
                fontWeight: 'bold',
              }}>Allow Location</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={{
                backgroundColor: '#FF4444',
                paddingVertical: 10,
                paddingHorizontal: 20,
                borderRadius: 5,
              }}
              onPress={() => setShowPermissionModal(false)}
            >
              <Text style={{
                color: '#fff',
                fontSize: 16,
                fontWeight: 'bold',
              }}>No Thanks</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

export default ReportSubmissionScreen;