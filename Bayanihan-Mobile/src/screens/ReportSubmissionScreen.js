import { Ionicons, Feather, MaterialIcons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Picker } from '@react-native-picker/picker';
import { useNavigation, useRoute } from '@react-navigation/native';
import { ref as databaseRef, get, onValue, query, orderByChild, equalTo } from 'firebase/database';
import React, { useEffect, useRef, useState } from 'react';
import { Platform, SafeAreaView, ScrollView, Text, TextInput, TouchableOpacity, View, Dimensions, KeyboardAvoidingView, Modal, StatusBar, ToastAndroid, FlatList, Animated } from 'react-native';
import * as Location from 'expo-location';
import WebView from 'react-native-webview';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { database } from '../configuration/firebaseConfig';
import { useAuth } from '../context/AuthContext'; 
import GlobalStyles from '../styles/GlobalStyles';
import styles from '../styles/ReportSubmissionStyles';
import { LinearGradient } from 'expo-linear-gradient';
import Theme from '../constants/theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import OperationCustomModal from '../components/OperationCustomModal';
import useOperationCheck from '../components/useOperationCheck';

const { height, width } = Dimensions.get('window');

const ReportSubmissionScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const webViewRef = useRef(null);
  const insets = useSafeAreaInsets();
  const searchAnim = useRef(new Animated.Value(0)).current;
  const { user } = useAuth(); 
  const { canSubmit, organizationName, modalVisible, setModalVisible, modalConfig, setModalConfig } = useOperationCheck();
  const [searchBarVisible, setSearchBarVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadingError, setLoadingError] = useState(null);
  const formatDate = (date) => {
    if (!date) return '';
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const displayDate = (date) => {
    if (!date) return '';
    const d = new Date(date);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const formatTime = (date) => {
    if (!date) return '';
    let hours = date.getHours();
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const ampm = hours >= 12 ? 'pm' : 'am';
    hours = hours % 12;
    hours = hours || 12;
    return `${hours.toString().padStart(2, '0')}:${minutes} ${ampm}`;
  };

  const currentDate = new Date();

  const [reportData, setReportData] = useState({
    reportID: '',
    AreaOfOperation: '',
    DateOfReport: formatDate(currentDate),
    calamityArea: '',
    CalamityType: '',
    CalamityName: '',
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
    'CalamityType',
    'CalamityName',
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

  useEffect(() => {
    setIsLoading(true);
    const timeoutId = setTimeout(() => {
      setLoadingError('Operation timed out while fetching user data.');
      setIsLoading(false);
      setModalConfig({
        title: 'Loading Error',
        message: 'Failed to load user data due to timeout. Please try again.',
        onConfirm: () => {
          setModalVisible(false);
          navigation.navigate('Volunteer Dashboard');
        },
        confirmText: 'OK',
      });
      setModalVisible(true);
    }, 10000);

    if (!user) {
      console.warn('No user is logged in');
      setLoadingError('No authenticated user found');
      setModalConfig({
        title: 'Error',
        message: 'Please log in to submit reports',
        onConfirm: () => {
          setModalVisible(false);
          navigation.navigate('Login');
        },
        confirmText: 'OK',
      });
      setModalVisible(true);
      setTimeout(() => {
        setModalVisible(false);
        navigation.navigate('Login');
      }, 3000);
      clearTimeout(timeoutId);
      setIsLoading(false);
      return;
    }

    setUserUid(user.id);
    console.log('Logged-in user ID:', user.id);
    setIsLoading(false);
    clearTimeout(timeoutId);

    const fetchActivations = () => {
      if (isLoading) return () => {};

      const activationsRef = databaseRef(database, 'activations');
      const activeQuery = query(activationsRef, orderByChild('status'), equalTo('active'));
      const unsubscribe = onValue(
        activeQuery,
        (snapshot) => {
          const activeActivations = [];
          snapshot.forEach((childSnapshot) => {
            const activation = { id: childSnapshot.key, ...childSnapshot.val() };
            if (user.role === 'AB ADMIN') {
              activeActivations.push(activation);
            } else if (organizationName && activation.organization === organizationName) {
              activeActivations.push(activation);
            }
          });
          setActiveActivations(activeActivations);
          console.log('Active activations fetched:', activeActivations);
        },
        (error) => {
          console.error('Error listening for active activations:', error);
          ToastAndroid.show('Failed to load active operations.', ToastAndroid.BOTTOM);
        }
      );
      return unsubscribe;
    };

    const unsubscribe = fetchActivations();

    return () => {
      unsubscribe();
      console.log(`[${new Date().toISOString()}] Cleaned up Firebase listener`);
    };
  }, [user, organizationName, isLoading]);

  useEffect(() => {
    if (!route.params?.reportData) {
      const generateReportID = () => {
        const randomNumbers = Math.floor(1000000000 + Math.random() * 9000000000);
        return `REPORTS-${randomNumbers}`;
      };
      setReportData((prev) => ({ ...prev, reportID: generateReportID() }));
      return;
    }

    const parseDate = (dateStr) => {
      if (!dateStr) return '';
      // Handle YYYY-MM-DD or DD-MM-YYYY formats
      let date;
      if (dateStr.includes('-')) {
        const parts = dateStr.split('-');
        if (parts.length === 3) {
          if (parts[0].length === 4) {
            // YYYY-MM-DD
            date = new Date(`${parts[0]}-${parts[1]}-${parts[2]}`);
          } else {
            // DD-MM-YYYY
            date = new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
          }
          if (!isNaN(date)) return formatDate(date);
        }
      }
      return dateStr; // Fallback to original if parsing fails
    };

    setReportData({
      ...route.params.reportData,
      DateOfReport: parseDate(route.params.reportData.DateOfReport),
      StartDate: parseDate(route.params.reportData.StartDate),
      EndDate: parseDate(route.params.reportData.EndDate),
    });
    if (route.params.reportData.StartDate) {
      const startDate = new Date(parseDate(route.params.reportData.StartDate));
      if (!isNaN(startDate)) {
        setTempDate(prev => ({ ...prev, StartDate: startDate }));
      }
    }
    if (route.params.reportData.EndDate) {
      const endDate = new Date(parseDate(route.params.reportData.EndDate));
      if (!isNaN(endDate)) {
        setTempDate(prev => ({ ...prev, EndDate: endDate }));
      }
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
    if (route.params?.reportData?.calamityArea) {
      const savedActivation = activeActivations.find(
        (activation) => {
          const displayCalamity = `${activation.calamityType} - ${activation.calamityName} (by ${activation.organization})`;
          return displayCalamity === route.params.reportData.calamityArea;
        }
      );
      if (savedActivation) {
        setReportData(prev => ({
          ...prev,
          calamityArea: route.params.reportData.calamityArea,
          CalamityType: savedActivation.calamityType,
          CalamityName: savedActivation.calamityName,
        }));
      }
    }
  }, [route.params, activeActivations]);

  const handleRequestPermission = async () => {
    if (!canSubmit) {
      setModalConfig({
        title: 'Permission Error',
        message: 'You do not have permission to submit reports.',
        onConfirm: () => {
          setModalVisible(false);
        },
        confirmText: 'OK',
      });
      setModalVisible(true);
      return;
    }

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

  const toggleSearchBar = () => {
    if (!canSubmit) {
      setModalConfig({
        title: 'Permission Error',
        message: 'You do not have permission to submit reports.',
        onConfirm: () => {
          setModalVisible(false);
        },
        confirmText: 'OK',
      });
      setModalVisible(true);
      return;
    }

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

  const handleSearchInput = (text) => {
    setSearchQuery(text);
    fetchSuggestions(text);
  };

  const handleSearch = async () => {
    if (!canSubmit) {
      setModalConfig({
        title: 'Permission Error',
        message: 'You do not have permission to submit reports.',
        onConfirm: () => {
          setModalVisible(false);
        },
        confirmText: 'OK',
      });
      setModalVisible(true);
      return;
    }

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

  const handleSuggestionSelect = async (item) => {
    if (!canSubmit) {
      setModalConfig({
        title: 'Permission Error',
        message: 'You do not have permission to submit reports.',
        onConfirm: () => {
          setModalVisible(false);
        },
        confirmText: 'OK',
      });
      setModalVisible(true);
      return;
    }

    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/place/details/json?place_id=${item.place_id}&key=AIzaSyAAAu6BeQjIZ7H7beFbAsPWuKuORmh0wrk&fields=formatted_address,geometry`
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

  const returnToUserLocation = () => {
    if (!canSubmit) {
      setModalConfig({
        title: 'Permission Error',
        message: 'You do not have permission to submit reports.',
        onConfirm: () => {
          setModalVisible(false);
        },
        confirmText: 'OK',
      });
      setModalVisible(true);
      return;
    }

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
    if (!canSubmit) {
      setModalConfig({
        title: 'Permission Error',
        message: 'You do not have permission to submit reports.',
        onConfirm: () => {
          setModalVisible(false);
        },
        confirmText: 'OK',
      });
      setModalVisible(true);
      return;
    }

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
      const formattedDate = formatDate(selectedDate); // Store as YYYY-MM-DD
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
    if (!canSubmit) {
      setModalConfig({
        title: 'Permission Error',
        message: 'You do not have permission to submit reports.',
        onConfirm: () => {
          setModalVisible(false);
        },
        confirmText: 'OK',
      });
      setModalVisible(true);
      return;
    }

    if (value === '') {
      setReportData((prev) => ({
        ...prev,
        calamityArea: '',
        CalamityType: '',
        CalamityName: '',
      }));
    } else {
      const selectedActivation = activeActivations.find((activation) => {
        const displayCalamity = `${activation.calamityType} - ${activation.calamityName} (by ${activation.organization})`;
        return displayCalamity === value;
      });
      if (selectedActivation) {
        setReportData((prev) => ({
          ...prev,
          calamityArea: value,
          CalamityType: selectedActivation.calamityType,
          CalamityName: selectedActivation.calamityName,
        }));
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
    if (!canSubmit) {
      setModalConfig({
        title: 'Permission Error',
        message: 'You do not have permission to submit reports.',
        onConfirm: () => {
          setModalVisible(false);
        },
        confirmText: 'OK',
      });
      setModalVisible(true);
      return;
    }

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
      setModalConfig({
        title: 'Incomplete Data',
        message: `Please fill out the following:\n${Object.values(newErrors).join('\n')}`,
        onConfirm: () => setModalVisible(false),
        confirmText: 'OK',
      });
      setModalVisible(true);
      return;
    }

    const serializedReportData = {
      ...reportData,
      reportID: reportData.reportID || `REPORTS-${Math.floor(1000000000 + Math.random() * 9000000000)}`,
      locationName,
      coordinates: selectedLocation ? `${selectedLocation.latitude},${selectedLocation.longitude}` : null,
      userUid: user.id, 
      organization: organizationName || 'Admin',
    };

    navigation.navigate('ReportSummary', { reportData: serializedReportData, userUid: user.id, organizationName });
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
              borderRadius: 4px;
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
                const userLocation = { lat: ${location?.latitude || 0}, lng: ${location?.longitude || 0} };
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

  if (isLoading) {
    return (
      <SafeAreaView style={GlobalStyles.container}>
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
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Text style={{ fontSize: 18, color: Theme.colors.primary }}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (loadingError) {
    return (
      <SafeAreaView style={GlobalStyles.container}>
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
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Text style={{ fontSize: 18, color: '#ff4444', textAlign: 'center', marginBottom: 20 }}>
            {loadingError}
          </Text>
          <TouchableOpacity
            style={{
              backgroundColor: '#00BCD4',
              paddingVertical: 10,
              paddingHorizontal: 20,
              borderRadius: 5,
            }}
            onPress={() => {
              setLoadingError(null);
              setIsLoading(true);
              navigation.navigate('ReportSubmission');
            }}
          >
            <Text style={{ color: '#fff', fontSize: 16, fontWeight: 'bold' }}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

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
                style={[GlobalStyles.input, errors.AreaOfOperation && GlobalStyles.inputError]}
                placeholder="e.g. Purok 2, Brgy. Maligaya, Rosario"
                placeholderTextColor={Theme.colors.placeholderColor}
                value={locationName || reportData.AreaOfOperation}
                onChangeText={(text) => {
                  setLocationName(text);
                  handleChange('AreaOfOperation', text);
                }}
                editable={canSubmit}
              />
              <TouchableOpacity
                style={[styles.openMap]}
                onPress={handleOpenMap}
              >
                <MaterialIcons name="pin-drop" size={28} style={{ color: 'white' }} />
                <Text style={styles.openMapText}> Pin Location</Text>
              </TouchableOpacity>
              {errors.AreaOfOperation && <Text style={[GlobalStyles.errorText, { marginTop: 2 }]}>{errors.AreaOfOperation}</Text>}
              {renderLabel('Date of Report', true)}
              <View style={[GlobalStyles.input, errors.DateOfReport && GlobalStyles.inputError, { flexDirection: 'row', alignItems: 'center' }]}>
                <Text style={{ flex: 1, color: reportData.DateOfReport ? Theme.colors.black : Theme.colors.placeholderColor, fontFamily: 'Poppins_Regular' }}>
                  {reportData.DateOfReport ? displayDate(new Date(reportData.DateOfReport)) : 'dd/mm/yyyy'}
                </Text>
              </View>
              {errors.DateOfReport && <Text style={[GlobalStyles.errorText, { marginTop: 2 }]}>{errors.DateOfReport}</Text>}
            </View>

            <View style={GlobalStyles.section}>
              <Text style={GlobalStyles.sectionTitle}>Relief Operations</Text>
              {renderLabel('Select Calamity', true)}
              <View style={[GlobalStyles.input, errors.calamityArea && GlobalStyles.inputError, styles.pickerContainer, { height: 45, paddingVertical: 0, alignContent: 'center', justifyContent: 'center', paddingHorizontal: 0 }]}>
                <Picker
                  selectedValue={reportData.calamityArea}
                  onValueChange={(value) => handleCalamityChange(value)}
                  style={{
                    fontFamily: 'Poppins_Regular',
                    fontSize: 14,
                    height: 68,
                    width: '100%',
                    textAlign: 'center',
                    color: reportData.calamityArea ? Theme.colors.black : Theme.colors.placeholderColor
                  }}
                  itemStyle={{
                    fontFamily: 'Poppins_Regular',
                    fontSize: 14,
                    color: Theme.colors.black,
                  }}
                  dropdownIconColor="#00BCD4"
                  enabled={canSubmit}
                >
                  <Picker.Item label="Select an Active Operation" value="" />
                  {activeActivations.map((activation) => {
                    const calamityDisplay = `${activation.calamityType} - ${activation.calamityName} (by ${activation.organization})`;
                    return (
                      <Picker.Item
                        key={activation.id}
                        label={calamityDisplay}
                        value={calamityDisplay}
                      />
                    );
                  })}
                </Picker>
              </View>
              {errors.calamityArea && <Text style={[GlobalStyles.errorText, { marginTop: 2 }]}>{errors.calamityArea}</Text>}
              {renderLabel('Completion Time of Intervention', true)}
              <TouchableOpacity
                style={[GlobalStyles.input, errors.completionTimeOfIntervention && GlobalStyles.inputError, { flexDirection: 'row', alignItems: 'center' }]}
                onPress={() => canSubmit && setShowTimePicker((prev) => ({ ...prev, completionTimeOfIntervention: true }))}
              >
                <Text style={{ flex: 1, color: reportData.completionTimeOfIntervention ? Theme.colors.black : Theme.colors.placeholderColor, fontFamily: 'Poppins_Regular' }}>
                  {reportData.completionTimeOfIntervention || '--:-- --'}
                </Text>
                <Ionicons name="time" size={24} style={{ color: "#00BCD4" }} />
              </TouchableOpacity>
              {showTimePicker.completionTimeOfIntervention && canSubmit && (
                <DateTimePicker
                  value={tempDate.completionTimeOfIntervention}
                  mode="time"
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  is24Hour={false}
                  textColor={Theme.colors.black}
                  onChange={(event, time) => handleTimeChange('completionTimeOfIntervention', event, time)}
                />
              )}
              {errors.completionTimeOfIntervention && <Text style={[GlobalStyles.errorText, { marginTop: 2 }]}>{errors.completionTimeOfIntervention}</Text>}
              {renderLabel('Starting Date of Operation', true)}
              <TouchableOpacity
                style={[GlobalStyles.input, errors.StartDate && GlobalStyles.inputError, { flexDirection: 'row', alignItems: 'center' }]}
                onPress={() => canSubmit && setShowDatePicker((prev) => ({ ...prev, StartDate: true }))}
              >
                <Text style={{ flex: 1, color: reportData.StartDate ? Theme.colors.black : Theme.colors.placeholderColor, fontFamily: 'Poppins_Regular' }}>
                  {reportData.StartDate ? displayDate(new Date(reportData.StartDate)) : 'dd/mm/yyyy'}
                </Text>
                <Ionicons name="calendar" size={24} style={{ color: "#00BCD4" }} />
              </TouchableOpacity>
              {showDatePicker.StartDate && canSubmit && (
                <DateTimePicker
                  value={tempDate.StartDate}
                  mode="date"
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  textColor={Theme.colors.black}
                  onChange={(event, date) => handleDateChange('StartDate', event, date)}
                />
              )}
              {errors.StartDate && <Text style={[GlobalStyles.errorText, { marginTop: 2 }]}>{errors.StartDate}</Text>}
              {renderLabel('Ending Date of Operation', true)}
              <TouchableOpacity
                style={[GlobalStyles.input, errors.EndDate && GlobalStyles.inputError, { flexDirection: 'row', alignItems: 'center' }]}
                onPress={() => canSubmit && setShowDatePicker((prev) => ({ ...prev, EndDate: true }))}
              >
                <Text style={{ flex: 1, color: reportData.EndDate ? Theme.colors.black : Theme.colors.placeholderColor, fontFamily: 'Poppins_Regular' }}>
                  {reportData.EndDate ? displayDate(new Date(reportData.EndDate)) : 'dd/mm/yyyy'}
                </Text>
                <Ionicons name="calendar" size={24} color="#00BCD4" />
              </TouchableOpacity>
              {showDatePicker.EndDate && canSubmit && (
                <DateTimePicker
                  value={tempDate.EndDate}
                  mode="date"
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  textColor={Theme.colors.black}
                  onChange={(event, val) => handleDateChange('EndDate', event, val)}
                />
              )}
              {errors.EndDate && <Text style={[GlobalStyles.errorText, { marginTop: 2 }]}>{errors.EndDate}</Text>}
              {renderLabel('No. of Individuals or Families', true)}
              <TextInput
                style={[GlobalStyles.input, errors.NoOfIndividualsOrFamilies && GlobalStyles.inputError]}
                placeholder="No. of Individuals or Families"
                placeholderTextColor={Theme.colors.placeholderColor}
                onChangeText={(val) => handleChange('NoOfIndividualsOrFamilies', val)}
                value={reportData.NoOfIndividualsOrFamilies}
                keyboardType="numeric"
                editable={canSubmit}
              />
              {errors.NoOfIndividualsOrFamilies && <Text style={[GlobalStyles.errorText, { marginTop: 2 }]}>{errors.NoOfIndividualsOrFamilies}</Text>}
              {renderLabel('No. of Relief Packs', true)}
              <TextInput
                style={[GlobalStyles.input, errors.NoOfFoodPacks && GlobalStyles.inputError]}
                placeholder="No. of Food Packs"
                placeholderTextColor={Theme.colors.placeholderColor}
                onChangeText={(val) => handleChange('NoOfFoodPacks', val)}
                value={reportData.NoOfFoodPacks}
                keyboardType="numeric"
                editable={canSubmit}
              />
              {errors.NoOfFoodPacks && <Text style={[GlobalStyles.errorText, { marginTop: 2 }]}>{errors.NoOfFoodPacks}</Text>}
              {renderLabel('No. of Hot Meals/Ready-to-eat Food', true)}
              <TextInput
                style={[GlobalStyles.input, errors.hotMeals && GlobalStyles.inputError]}
                placeholder="No. of Hot Meals"
                placeholderTextColor={Theme.colors.placeholderColor}
                onChangeText={(val) => handleChange('hotMeals', val)}
                value={reportData.hotMeals}
                keyboardType="numeric"
                editable={canSubmit}
              />
              {errors.hotMeals && <Text style={[GlobalStyles.errorText, { marginTop: 2 }]}>{errors.hotMeals}</Text>}
              {renderLabel('Liters of Water', true)}
              <TextInput
                style={[GlobalStyles.input, errors.LitersOfWater && GlobalStyles.inputError]}
                placeholder="Liters of Water"
                placeholderTextColor={Theme.colors.placeholderColor}
                onChangeText={(val) => handleChange('LitersOfWater', val)}
                value={reportData.LitersOfWater}
                keyboardType="numeric"
                editable={canSubmit}
              />
              {errors.LitersOfWater && <Text style={[GlobalStyles.errorText, { marginTop: 2 }]}>{errors.LitersOfWater}</Text>}
              {renderLabel('No. of Volunteers Mobilized', true)}
              <TextInput
                style={[GlobalStyles.input, errors.NoOfVolunteersMobilized && GlobalStyles.inputError]}
                placeholder="No. of Volunteers Mobilized"
                placeholderTextColor={Theme.colors.placeholderColor}
                onChangeText={(val) => handleChange('NoOfVolunteersMobilized', val)}
                value={reportData.NoOfVolunteersMobilized}
                keyboardType="numeric"
                editable={canSubmit}
              />
              {errors.NoOfVolunteersMobilized && <Text style={[GlobalStyles.errorText, { marginTop: 2 }]}>{errors.NoOfVolunteersMobilized}</Text>}
              {renderLabel('No. of Organizations Activated', true)}
              <TextInput
                style={[GlobalStyles.input, errors.NoOfOrganizationsActivated && GlobalStyles.inputError]}
                placeholder="No. of Organizations Activated"
                placeholderTextColor={Theme.colors.placeholderColor}
                onChangeText={(val) => handleChange('NoOfOrganizationsActivated', val)}
                value={reportData.NoOfOrganizationsActivated}
                keyboardType="numeric"
                editable={canSubmit}
              />
              {errors.NoOfOrganizationsActivated && <Text style={[GlobalStyles.errorText, { marginTop: 2 }]}>{errors.NoOfOrganizationsActivated}</Text>}
              {renderLabel('Total Value of In-Kind Donations', true)}
              <TextInput
                style={[GlobalStyles.input, errors.TotalValueOfInKindDonations && GlobalStyles.inputError]}
                placeholder="Total Value of In-Kind Donations"
                placeholderTextColor={Theme.colors.placeholderColor}
                onChangeText={(val) => handleChange('TotalValueOfInKindDonations', val)}
                value={reportData.TotalValueOfInKindDonations}
                keyboardType="numeric"
                editable={canSubmit}
              />
              {errors.TotalValueOfInKindDonations && <Text style={[GlobalStyles.errorText, { marginTop: 2 }]}>{errors.TotalValueOfInKindDonations}</Text>}
              {renderLabel('Total Monetary Donations', true)}
              <TextInput
                style={[GlobalStyles.input, errors.TotalMonetaryDonations && GlobalStyles.inputError]}
                placeholder="Total Monetary Donations"
                placeholderTextColor={Theme.colors.placeholderColor}
                onChangeText={(val) => handleChange('TotalMonetaryDonations', val)}
                value={reportData.TotalMonetaryDonations}
                keyboardType="numeric"
                editable={canSubmit}
              />
              {errors.TotalMonetaryDonations && <Text style={[GlobalStyles.errorText, { marginTop: 2 }]}>{errors.TotalMonetaryDonations}</Text>}
            </View>

            <View style={GlobalStyles.section}>
              <Text style={GlobalStyles.sectionTitle}>Additional Updates</Text>
              {renderLabel('Notes/Additional Information (Optional)', false)}
              <TextInput
                style={[GlobalStyles.input, errors.NotesAdditionalInformation && GlobalStyles.inputError, { textAlignVertical: 'top', height: 100 }]}
                placeholder="Enter Notes/Additional Information"
                placeholderTextColor={Theme.colors.placeholderColor}
                onChangeText={(val) => handleChange('NotesAdditionalInformation', val)}
                value={reportData.NotesAdditionalInformation}
                multiline
                numberOfLines={4}
                editable={canSubmit}
              />
              {errors.NotesAdditionalInformation && <Text style={[GlobalStyles.errorText, { marginTop: 2 }]}>{errors.NotesAdditionalInformation}</Text>}
            </View>

            <TouchableOpacity
              style={[GlobalStyles.button, { marginHorizontal: 10 }, !canSubmit && { opacity: 0.6 }]}
              onPress={handleSubmit}
              disabled={!canSubmit}
            >
              <Text style={GlobalStyles.buttonText}>Proceed</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

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
          backgroundColor: Theme.colors.lightBg,
        }}>
          {mapError ? (
            <View style={{
              flex: 1,
              justifyContent: 'center',
              alignItems: 'center',
              backgroundColor: Theme.colors.lightBg,
            }}>
              <Text style={{
                color: Theme.colors.red,
                fontSize: 18,
                textAlign: 'center',
                marginBottom: 20,
                fontFamily: 'Poppins_Medium'
              }}>{mapError}</Text>
              <TouchableOpacity
                style={{
                  backgroundColor: Theme.colors.red,
                  paddingVertical: 10,
                  paddingHorizontal: 20,
                  borderRadius: 15,
                }}
                onPress={() => {
                  setMapError(null);
                  setShowMapModal(false);
                }}
              >
                <Text style={{
                  color: '#fff',
                  fontSize: 16,
                  fontFamily: 'Poppins_Regular'
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
                          placeholderTextColor={Theme.colors.placeholderColor}
                          style={{ flex: 1, fontFamily: 'Poppins_Regular' }}
                          value={searchQuery}
                          onChangeText={handleSearchInput}
                          onSubmitEditing={() => handleSearch()}
                          returnKeyType="search"
                          autoFocus={true}
                          editable={canSubmit}
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
                          disabled={!canSubmit}
                        >
                          <Text style={styles.suggestionText}>{item.description}</Text>
                        </TouchableOpacity>
                      )}
                      keyboardShouldPersistTaps="handled"
                    />
                  )}
                  <TouchableOpacity style={styles.returnButton} onPress={returnToUserLocation} disabled={!canSubmit}>
                    <MaterialIcons name="my-location" size={24} color={Theme.colors.white} />
                  </TouchableOpacity>
                </View>
              </View>
              <View style={styles.mapTypeButtonsContainer}>
                <TouchableOpacity
                  style={[styles.mapTypeButton, mapType === 'roadmap' && styles.mapTypeButtonActive]}
                  onPress={() => toggleMapType('roadmap')}
                  disabled={!canSubmit}
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
                  disabled={!canSubmit}
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
                  disabled={!canSubmit}
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
              backgroundColor: Theme.colors.lightBg,
            }}>
              <Text style={{
                color: Theme.colors.primary,
                fontSize: 18,
                textAlign: 'center',
                marginBottom: 20,
                fontFamily: 'Poppins_Medium'
              }}>Waiting for location permission...</Text>
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
        <View style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: 'rgba(0,0,0,0.5)',
        }}>
          <View style={{
            backgroundColor: Theme.colors.lightBg,
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
          </View>
        </View>
      </Modal>

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

export default ReportSubmissionScreen;