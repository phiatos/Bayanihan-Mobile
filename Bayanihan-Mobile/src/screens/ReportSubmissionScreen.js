import { Ionicons, Feather, MaterialIcons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useNavigation, useRoute } from '@react-navigation/native';
import { ref as databaseRef, get, onValue, query, orderByChild, equalTo } from 'firebase/database';
import React, { useEffect, useRef, useState } from 'react';
import { Platform, SafeAreaView, ScrollView, Text, TextInput, TouchableOpacity, View, Dimensions, KeyboardAvoidingView, Modal, StatusBar, ToastAndroid, Animated } from 'react-native';
import * as Location from 'expo-location';
import { WebView } from 'react-native-webview';
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
import { Dropdown } from 'react-native-element-dropdown';

const { height, width } = Dimensions.get('window');

const mapStyles = `
  body { margin: 0; }
  #map { height: 100vh; width: 100%; }
  .overlay-container { position: absolute; top: 10px; left: 10px; right: 10px; z-index: 1000; }
  .search-wrapper { position: relative; }
  .search-container { 
    display: flex; 
    align-items: center; 
    background: #FFF9F0; 
    box-shadow: 0 2px 4px rgba(0,0,0,0.2); 
    transition: all 0.3s ease; 
    overflow: hidden;
    border: solid 1px #14AEBB;
  }
  .search-container.closed { 
    width: 45px; 
    height: 45px; 
    border-radius: 100%; 
    padding-left: 1px; 
  }
  .search-container.open { 
    width: 100%; 
    height: 45px; 
    border-radius: 30px; 
    padding-left: 0; 
  }
  .search-icon {
    display: block;       
    text-align: center;    
    padding: 15px 12px;
    font-size: 25px;
    cursor: pointer;
    margin-top: 5px;
    color: #14aebb;
  }
  .search-input-container { 
    flex: 1; 
    transition: opacity 0.3s ease, transform 0.3s ease; 
    background: transparent;
  }
  .search-input-container.hidden { 
    opacity: 0; 
    transform: translateX(20px); 
  }
  .search-input-container.visible { 
    opacity: 1; 
    transform: translateX(0); 
  }
  .search-input { 
    flex: 1; 
    padding: 8px; 
    font-size: 14px; 
    border: none; 
    outline: none; 
    background: transparent;
    font-family: 'Poppins', sans-serif; 
    color: #000; 
  }
  .search-input::placeholder { 
    color: #777; 
  }
  .suggestions-container { 
    position: absolute; 
    top: 50px; 
    left: 0; 
    right: 0; 
    background: white; 
    border: 1px solid #FFF9F0; 
    max-height: 200px; 
    overflow-y: auto; 
    z-index: 1000; 
    box-shadow: 0 2px 4px rgba(0,0,0,0.2); 
  }
  .suggestion-item { 
    padding: 10px; 
    border-bottom: 1px solid #FFF9F0; 
    cursor: pointer; 
  }
  .suggestion-item:hover { 
    background: #FFF9F0; 
  }
  .return-button { 
    position: absolute; 
    top: 0; 
    right: 0; 
    background: #14aebb; 
    padding: 12px;
    border: none;
    border-radius: 25px; 
    box-shadow: 0 2px 4px rgba(0,0,0,0.2); 
    z-index: 1000; 
    color: white;
    font-size: 23px;
    display: flex;              
    align-items: center;  
    justify-content: center;  
    cursor: pointer;       
  }
  .map-type-buttons-container { 
    position: absolute; 
    top: 70px; 
    left: 10px; 
    z-index: 999; 
    display: flex;           
    flex-direction: column;    
    gap: 8px;  
  }
  .map-type-button { 
    display: flex;              
    align-items: center;       
    justify-content: center;   
    width: 50px;            
    height: 50px;              
    background: rgba(0, 0, 0, 0.5); 
    border-radius: 50%; 
    box-shadow: 0 2px 4px rgba(0,0,0,0.2); 
    border: rgba(255, 255, 255, 0.2) solid 1px;
  }
  .map-type-button.active { 
    background: #FFF9F0;
    border: 1px solid #14aebb;
  }
  .map-type-icon { 
    font-size: 22px; 
    line-height: 1;          
    display: flex;            
    align-items: center;       
    justify-content: center;   
    color: #FFF9F0; 
  }
  .map-type-icon.active { 
    color: #14aebb; 
  }
  .modal-button-container { 
    position: absolute; 
    bottom: 10px; 
    left: 10px; 
    right: 10px; 
    display: flex; 
    flex-direction: row;
    justify-content: center; 
    align-items: center;
    z-index: 1000; 
    padding: 10px; 
  }
  .modal-button, .modal-button-cancel { 
    padding: 10px 15px; 
    border-radius: 5px; 
    text-align: center; 
    font-family: 'Poppins', sans-serif; 
    font-size: 14px; 
  }
  .modal-button { 
    background: #14aebb; 
    color: white; 
    margin-right: 5px; 
    border-radius: 15px;
    border: solid transparent 1px;
  }
  .modal-button-cancel { 
    background: #FFF9F0; 
    color: #14aebb; 
    border: 1px solid #14aebb; 
    margin-left: 5px; 
    border-radius: 15px;
    font-family: 'Poppins', Helvetica;
    box-shadow: 0px 4px 6px rgba(0, 0, 0, 0.2);  
  }
`;

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
  const [isLoading, setIsLoading] = useState(true);
  const [loadingError, setLoadingError] = useState(null);
  const [permissionStatus, setPermissionStatus] = useState(null);
  const [showMapModal, setShowMapModal] = useState(false);
  const [location, setLocation] = useState(null);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [locationName, setLocationName] = useState('');
  const [activeActivations, setActiveActivations] = useState([]);
  const [mapType, setMapType] = useState('roadmap');

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

  const leafletHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
      <link href='https://cdn.boxicons.com/fonts/basic/boxicons.min.css' rel='stylesheet'>
      <link rel="preconnect" href="https://fonts.googleapis.com">
      <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
      <link href="https://fonts.googleapis.com/css2?family=Poppins:ital,wght@0,100;0,200;0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,100;1,200;1,300;1,400;1,500;1,600;1,700;1,800;1,900&display=swap" rel="stylesheet">
      <script type="module" src="https://unpkg.com/ionicons@7.1.0/dist/ionicons/ionicons.esm.js"></script>
      <script nomodule src="https://unpkg.com/ionicons@7.1.0/dist/ionicons/ionicons.js"></script>
      <link href="https://fonts.googleapis.com/icon?family=Material+Icons" rel="stylesheet">
      <style>
        ${mapStyles}
      </style>
    </head>
    <body>
      <div class="overlay-container">
        <div class="search-wrapper">
          <div id="searchContainer" class="search-container closed">
            <span id="searchIcon" class="search-icon"><i class='bxr bx-search'></i></span>
            <div id="searchInputContainer" class="search-input-container hidden">
              <input id="searchInput" class="search-input" type="text" placeholder="Search for a location" />
            </div>
          </div>
          <div id="suggestions" class="suggestions-container"></div>
          <button id="returnButton" class="return-button"><ion-icon name="locate-outline"></ion-icon></button>
        </div>
      </div>
      <div class="map-type-buttons-container">
        <button id="roadmapBtn" class="map-type-button active"><span class="map-type-icon active"><ion-icon name="map-outline"></ion-icon></span></button>
        <button id="hybridBtn" class="map-type-button"><span class="map-type-icon"><i class='bxr bx-layers-minus-alt' style="font-size:30px;"></i></span></button>
      </div>
      <div id="map"></div>
      <div class="modal-button-container">
        <button id="confirmBtn" class="modal-button">Confirm Location</button>
        <button id="cancelBtn" class="modal-button-cancel">Cancel</button>
      </div>
      <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
      <script>
        let map = null;
        let currentLayer = null;
        let hybridLayer = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
          attribution: '&copy; Esri & OpenStreetMap',
          maxZoom: 18,
        });
        let marker = null;
        let currentLocation = { lat: ${selectedLocation?.latitude || location?.latitude || 14.5995}, lon: ${selectedLocation?.longitude || location?.longitude || 120.9842}, address: '${locationName || reportData.AreaOfOperation || ''}' };
        let mapType = '${mapType}';
        let searchBarVisible = false;

        function initializeMap() {
          try {
            map = L.map('map', { zoomControl: false }).setView([currentLocation.lat, currentLocation.lon], 16);
            currentLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
              attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
              maxZoom: 18,
            }).addTo(map);
            if (mapType === 'hybrid') {
              map.removeLayer(currentLayer);
              currentLayer = hybridLayer.addTo(map);
            }
            marker = L.marker([currentLocation.lat, currentLocation.lon], { draggable: true }).addTo(map);
            if (currentLocation.address) {
              document.getElementById('searchInput').value = currentLocation.address;
            }

            marker.on('dragend', async function (e) {
              currentLocation.lat = marker.getLatLng().lat;
              currentLocation.lon = marker.getLatLng().lng;
              try {
                const response = await fetch(
                  'https://nominatim.openstreetmap.org/reverse?format=json&lat=' + currentLocation.lat + '&lon=' + currentLocation.lon, {
                  headers: { 'User-Agent': 'BayanihanApp/1.0 (your.email@example.com)' }
                });
                const data = await response.json();
                currentLocation.address = data.display_name || '';
                document.getElementById('searchInput').value = currentLocation.address;
              } catch (error) {
                console.error('Reverse geocoding error:', error);
              }
            });

            map.on('click', async function (e) {
              marker.setLatLng(e.latlng);
              currentLocation.lat = e.latlng.lat;
              currentLocation.lon = e.latlng.lng;
              try {
                const response = await fetch(
                  'https://nominatim.openstreetmap.org/reverse?format=json&lat=' + e.latlng.lat + '&lon=' + e.latlng.lng, {
                  headers: { 'User-Agent': 'BayanihanApp/1.0 (your.email@example.com)' }
                });
                const data = await response.json();
                currentLocation.address = data.display_name || '';
                document.getElementById('searchInput').value = currentLocation.address;
              } catch (error) {
                console.error('Reverse geocoding error:', error);
              }
            });

            document.getElementById('searchIcon').addEventListener('click', function () {
              if (searchBarVisible) {
                searchBarVisible = false;
                document.getElementById('searchContainer').classList.remove('open');
                document.getElementById('searchContainer').classList.add('closed');
                document.getElementById('searchInputContainer').classList.remove('visible');
                document.getElementById('searchInputContainer').classList.add('hidden');
                document.getElementById('suggestions').style.display = 'none';
                document.getElementById('searchInput').value = '';
              } else {
                searchBarVisible = true;
                document.getElementById('searchContainer').classList.remove('closed');
                document.getElementById('searchContainer').classList.add('open');
                document.getElementById('searchInputContainer').classList.remove('hidden');
                document.getElementById('searchInputContainer').classList.add('visible');
                document.getElementById('searchInput').focus();
              }
            });

            document.getElementById('searchInput').addEventListener('input', async function (e) {
              const query = e.target.value;
              if (query.length < 3) {
                document.getElementById('suggestions').style.display = 'none';
                return;
              }
              try {
                const response = await fetch(
                  'https://nominatim.openstreetmap.org/search?format=json&q=' + encodeURIComponent(query) + '&countrycodes=PH&limit=5', {
                  headers: { 'User-Agent': 'BayanihanApp/1.0 (your.email@example.com)' }
                });
                const results = await response.json();
                const suggestionsDiv = document.getElementById('suggestions');
                suggestionsDiv.innerHTML = '';
                results.forEach(result => {
                  const div = document.createElement('div');
                  div.className = 'suggestion-item';
                  div.textContent = result.display_name;
                  div.dataset.placeId = result.place_id;
                  div.onclick = function () {
                    map.setView([result.lat, result.lon], 16);
                    marker.setLatLng([result.lat, result.lon]);
                    currentLocation = { lat: result.lat, lon: result.lon, address: result.display_name };
                    document.getElementById('searchInput').value = result.display_name;
                    suggestionsDiv.style.display = 'none';
                  };
                  suggestionsDiv.appendChild(div);
                });
                suggestionsDiv.style.display = results.length > 0 ? 'block' : 'none';
              } catch (error) {
                console.error('Search error:', error);
              }
            });

            document.getElementById('returnButton').addEventListener('click', function () {
              window.ReactNativeWebView.postMessage(JSON.stringify({ action: 'requestUserLocation' }));
            });

            document.getElementById('roadmapBtn').addEventListener('click', function () {
              if (mapType !== 'roadmap') {
                map.removeLayer(hybridLayer);
                currentLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                  attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
                  maxZoom: 18,
                }).addTo(map);
                mapType = 'roadmap';
                document.getElementById('roadmapBtn').classList.add('active');
                document.getElementById('hybridBtn').classList.remove('active');
                document.getElementById('roadmapBtn').querySelector('.map-type-icon').classList.add('active');
                document.getElementById('hybridBtn').querySelector('.map-type-icon').classList.remove('active');
              }
            });

            document.getElementById('hybridBtn').addEventListener('click', function () {
              if (mapType !== 'hybrid') {
                map.removeLayer(currentLayer);
                currentLayer = hybridLayer.addTo(map);
                mapType = 'hybrid';
                document.getElementById('hybridBtn').classList.add('active');
                document.getElementById('roadmapBtn').classList.remove('active');
                document.getElementById('hybridBtn').querySelector('.map-type-icon').classList.add('active');
                document.getElementById('roadmapBtn').querySelector('.map-type-icon').classList.remove('active');
              }
            });

            document.getElementById('confirmBtn').addEventListener('click', function () {
              window.ReactNativeWebView.postMessage(JSON.stringify({
                action: 'confirm',
                latitude: currentLocation.lat,
                longitude: currentLocation.lon,
                formattedAddress: currentLocation.address
              }));
            });

            document.getElementById('cancelBtn').addEventListener('click', function () {
              window.ReactNativeWebView.postMessage(JSON.stringify({ action: 'cancel' }));
            });
          } catch (error) {
            console.error('Map initialization error:', error);
            window.ReactNativeWebView.postMessage(JSON.stringify({
              action: 'showError',
              message: 'Failed to initialize map.'
            }));
          }
        }

        window.addEventListener('message', function(event) {
          try {
            const data = JSON.parse(event.data);
            if (data.action === 'setInitialLocation') {
              currentLocation.lat = parseFloat(data.latitude) || 14.5995;
              currentLocation.lon = parseFloat(data.longitude) || 120.9842;
              currentLocation.address = data.formattedAddress || '';
              if (map) {
                map.setView([currentLocation.lat, currentLocation.lon], 16);
                if (marker) {
                  marker.setLatLng([currentLocation.lat, currentLocation.lon]);
                } else {
                  marker = L.marker([currentLocation.lat, currentLocation.lon], { draggable: true }).addTo(map);
                }
                document.getElementById('searchInput').value = currentLocation.address;
              }
            } else if (data.action === 'updateLocation') {
              currentLocation.lat = parseFloat(data.latitude);
              currentLocation.lon = parseFloat(data.longitude);
              currentLocation.address = data.formattedAddress || '';
              if (map) {
                map.setView([currentLocation.lat, currentLocation.lon], 16);
                if (marker) {
                  marker.setLatLng([currentLocation.lat, currentLocation.lon]);
                } else {
                  marker = L.marker([currentLocation.lat, currentLocation.lon], { draggable: true }).addTo(map);
                }
                document.getElementById('searchInput').value = currentLocation.address;
                marker.bindPopup(currentLocation.address || \`Lat: \${currentLocation.lat}, Lng: \${currentLocation.lon}\`).openPopup();
              }
            } else if (data.action === 'locationError') {
              window.ReactNativeWebView.postMessage(JSON.stringify({
                action: 'showError',
                message: data.message
              }));
            }
          } catch (error) {
            console.error('Message parsing error:', error);
          }
        });

        document.addEventListener('DOMContentLoaded', initializeMap);
      </script>
    </body>
    </html>
  `;

  useEffect(() => {
    const checkPermissionStatus = async () => {
      try {
        const hasShownModal = await AsyncStorage.getItem('hasShownLocationModal');
        const { status } = await Location.getForegroundPermissionsAsync();
        setPermissionStatus(status);
        if (status === 'granted') {
          let loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
          if (loc.coords.accuracy > 50) {
            setModalConfig({
              title: 'Low Location Accuracy',
              message: 'Your location accuracy is low. The pin may not be precise.',
              onConfirm: () => setModalVisible(false),
              confirmText: 'OK',
              showCancel: false,
            });
            setModalVisible(true);
          }
          const { latitude, longitude } = loc.coords;
          try {
            const response = await fetch(
              `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`, {
              headers: { 'User-Agent': 'BayanihanApp/1.0 (your.email@example.com)' }
            });
            const data = await response.json();
            const formattedAddress = data.display_name || 'Unknown Location';
            setLocation({ latitude, longitude, formattedAddress });
            setLocationName(formattedAddress);
            if (!reportData.AreaOfOperation) {
              setReportData((prev) => ({
                ...prev,
                AreaOfOperation: formattedAddress,
              }));
              setSelectedLocation({ latitude, longitude });
            }
          } catch (error) {
            console.error('Reverse geocoding error:', error);
            setModalConfig({
              title: 'Location Error',
              message: 'Failed to retrieve address. Please pin the location manually.',
              onConfirm: () => setModalVisible(false),
              confirmText: 'OK',
              showCancel: false,
            });
            setModalVisible(true);
          }
        } else if (hasShownModal !== 'true') {
          setModalConfig({
            title: 'Location Permission Required',
            message: 'Please enable location access to set your current location.',
            onConfirm: async () => {
              try {
                const { status } = await Location.requestForegroundPermissionsAsync();
                setPermissionStatus(status);
                if (status === 'granted') {
                  let loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
                  if (loc.coords.accuracy > 50) {
                    setModalConfig({
                      title: 'Low Location Accuracy',
                      message: 'Your location accuracy is low. The pin may not be precise.',
                      onConfirm: () => setModalVisible(false),
                      confirmText: 'OK',
                      showCancel: false,
                    });
                    setModalVisible(true);
                  }
                  const { latitude, longitude } = loc.coords;
                  const response = await fetch(
                    `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`, {
                    headers: { 'User-Agent': 'BayanihanApp/1.0 (your.email@example.com)' }
                  });
                  const data = await response.json();
                  const formattedAddress = data.display_name || 'Unknown Location';
                  setLocation({ latitude, longitude, formattedAddress });
                  setLocationName(formattedAddress);
                  if (!reportData.AreaOfOperation) {
                    setReportData((prev) => ({
                      ...prev,
                      AreaOfOperation: formattedAddress,
                    }));
                    setSelectedLocation({ latitude, longitude });
                  }
                  await AsyncStorage.setItem('hasShownLocationModal', 'true');
                } else {
                  setPermissionStatus('denied');
                  setModalConfig({
                    title: 'Location Permission Denied',
                    message: 'Location access is required to set the default location. Please enable it in your device settings.',
                    onConfirm: () => setModalVisible(false),
                    confirmText: 'OK',
                    showCancel: false,
                  });
                  setModalVisible(true);
                }
              } catch (error) {
                console.error('Permission retry error:', error);
                setModalConfig({
                  title: 'Location Error',
                  message: 'Failed to retry permission. Please enable location access in your device settings.',
                  onConfirm: () => setModalVisible(false),
                  confirmText: 'OK',
                  showCancel: false,
                });
                setModalVisible(true);
              }
            },
            confirmText: 'Allow Location Access',
            showCancel: true,
            onCancel: () => {
              setModalVisible(false);
              AsyncStorage.setItem('hasShownLocationModal', 'true');
            },
          });
          setModalVisible(true);
        }
      } catch (error) {
        console.error('Permission check error:', error);
        setPermissionStatus('denied');
        setModalConfig({
          title: 'Location Error',
          message: 'Failed to check location permission. Please enable it in your device settings.',
          onConfirm: () => setModalVisible(false),
          confirmText: 'OK',
          showCancel: false,
        });
        setModalVisible(true);
      }
    };
    checkPermissionStatus();

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
    setIsLoading(false);
    clearTimeout(timeoutId);

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
      let date;
      if (dateStr.includes('-')) {
        const parts = dateStr.split('-');
        if (parts.length === 3) {
          if (parts[0].length === 4) {
            date = new Date(`${parts[0]}-${parts[1]}-${parts[2]}`);
          } else {
            date = new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
          }
          if (!isNaN(date)) return formatDate(date);
        }
      }
      return dateStr;
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

  useEffect(() => {
    if (showMapModal && (location || selectedLocation)) {
      webViewRef.current?.injectJavaScript(`
        window.postMessage(JSON.stringify({
          action: 'setInitialLocation',
          latitude: ${selectedLocation?.latitude || location?.latitude || 14.5995},
          longitude: ${selectedLocation?.longitude || location?.longitude || 120.9842},
          formattedAddress: "${(selectedLocation?.formattedAddress || location?.formattedAddress || locationName || '').replace(/"/g, '\\"')}"
        }));
      `);
    }
  }, [showMapModal, location, selectedLocation, locationName]);

  const reverseGeocode = async (latitude, longitude) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`, {
        headers: { 'User-Agent': 'BayanihanApp/1.0 (your.email@example.com)' }
      });
      const data = await response.json();
      const formattedAddress = data.display_name || 'Unknown Location';
      setLocationName(formattedAddress);
      return formattedAddress;
    } catch (error) {
      console.error('Reverse Geocoding Error:', error);
      setLocationName('Unknown Location');
      ToastAndroid.show('Failed to fetch location name. Using "Unknown Location" instead.', ToastAndroid.BOTTOM);
      return 'Unknown Location';
    }
  };

  const handleRequestPermission = async () => {
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

    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      setPermissionStatus(status);
      if (status === 'granted') {
        let loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
        if (loc.coords.accuracy > 50) {
          setModalConfig({
            title: 'Low Location Accuracy',
            message: 'Your location accuracy is low. The pin may not be precise.',
            onConfirm: () => setModalVisible(false),
            confirmText: 'OK',
            showCancel: false,
          });
          setModalVisible(true);
        }
        const { latitude, longitude } = loc.coords;
        const formattedAddress = await reverseGeocode(latitude, longitude);
        setLocation({ latitude, longitude, formattedAddress });
        setSelectedLocation({ latitude, longitude });
        setLocationName(formattedAddress);
        setShowMapModal(true);
      } else {
        setPermissionStatus('denied');
        setModalConfig({
          title: 'Location Permission Denied',
          message: 'Location access is required to pin a location. Please enable it in your device settings.',
          onConfirm: () => setModalVisible(false),
          confirmText: 'OK',
          showCancel: false,
        });
        setModalVisible(true);
      }
    } catch (error) {
      console.error('Permission error:', error);
      setModalConfig({
        title: 'Location Error',
        message: 'Failed to request location permission. Please try again.',
        onConfirm: () => setModalVisible(false),
        confirmText: 'OK',
        showCancel: false,
      });
      setModalVisible(true);
    }
  };

  const toggleSearchBar = () => {
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

    if (searchBarVisible) {
      Animated.timing(searchAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: false,
      }).start(() => {
        setSearchBarVisible(false);
        setSearchQuery('');
      });
    } else {
      setSearchBarVisible(true);
      Animated.timing(searchAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: false,
      }).start();
    }
  };

  const handleMapPress = async (data) => {
    const { latitude, longitude, formattedAddress } = data;
    if (isNaN(latitude) || isNaN(longitude)) {
      setModalConfig({
        title: 'Invalid Location',
        message: 'Invalid coordinates selected.',
        onConfirm: () => setModalVisible(false),
        confirmText: 'OK',
        showCancel: false,
      });
      setModalVisible(true);
      return;
    }
    setSelectedLocation({ latitude, longitude });
    const address = formattedAddress || (await reverseGeocode(latitude, longitude));
    setLocationName(address);
    handleChange('AreaOfOperation', address);
  };

  const handleMapConfirm = () => {
    if (!reportData.AreaOfOperation || reportData.AreaOfOperation === 'Unknown Location') {
      ToastAndroid.show('Please select a valid location on the map or search for an address.', ToastAndroid.BOTTOM);
      return;
    }
    setShowMapModal(false);
  };

  const handleWebViewMessage = async (event) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.action === 'confirm') {
        setReportData((prev) => ({
          ...prev,
          AreaOfOperation: data.formattedAddress || 'Unknown Location',
        }));
        setSelectedLocation({
          latitude: parseFloat(data.latitude),
          longitude: parseFloat(data.longitude),
        });
        setLocationName(data.formattedAddress || 'Unknown Location');
        setShowMapModal(false);
      } else if (data.action === 'cancel') {
        setShowMapModal(false);
      } else if (data.action === 'requestUserLocation') {
        if (permissionStatus !== 'granted') {
          webViewRef.current?.injectJavaScript(`
            window.postMessage(JSON.stringify({
              action: 'showError',
              message: 'Location permission denied. Please enable location access in your device settings.'
            }));
          `);
          setModalConfig({
            title: 'Location Permission Denied',
            message: 'Please enable location access to return to your current location.',
            onConfirm: async () => {
              try {
                const { status } = await Location.requestForegroundPermissionsAsync();
                setPermissionStatus(status);
                if (status === 'granted') {
                  let loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
                  if (loc.coords.accuracy > 50) {
                    setModalConfig({
                      title: 'Low Location Accuracy',
                      message: 'Your location accuracy is low. The pin may not be precise.',
                      onConfirm: () => setModalVisible(false),
                      confirmText: 'OK',
                      showCancel: false,
                    });
                    setModalVisible(true);
                  }
                  const { latitude, longitude } = loc.coords;
                  const response = await fetch(
                    `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`, {
                    headers: { 'User-Agent': 'BayanihanApp/1.0 (your.email@example.com)' }
                  });
                  const data = await response.json();
                  const formattedAddress = data.display_name || 'Unknown Location';
                  setLocation({ latitude, longitude, formattedAddress });
                  setLocationName(formattedAddress);
                  webViewRef.current?.injectJavaScript(`
                    window.postMessage(JSON.stringify({
                      action: 'updateLocation',
                      latitude: ${latitude},
                      longitude: ${longitude},
                      formattedAddress: "${formattedAddress.replace(/"/g, '\\"')}"
                    }));
                  `);
                } else {
                  setPermissionStatus('denied');
                  setModalConfig({
                    title: 'Location Permission Denied',
                    message: 'Location access is required to set the default location. Please enable it in your device settings.',
                    onConfirm: () => setModalVisible(false),
                    confirmText: 'OK',
                    showCancel: false,
                  });
                  setModalVisible(true);
                }
              } catch (error) {
                console.error('Permission retry error:', error);
                webViewRef.current?.injectJavaScript(`
                  window.postMessage(JSON.stringify({
                    action: 'showError',
                    message: 'Failed to retry permission. Please enable location access in your device settings.'
                  }));
                `);
              }
            },
            confirmText: 'Allow Location Access',
            showCancel: true,
            onCancel: () => setModalVisible(false),
          });
          setModalVisible(true);
          return;
        }
        try {
          let loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
          if (loc.coords.accuracy > 50) {
            setModalConfig({
              title: 'Low Location Accuracy',
              message: 'Your location accuracy is low. The pin may not be precise.',
              onConfirm: () => setModalVisible(false),
              confirmText: 'OK',
              showCancel: false,
            });
            setModalVisible(true);
          }
          const { latitude, longitude } = loc.coords;
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`, {
            headers: { 'User-Agent': 'BayanihanApp/1.0 (your.email@example.com)' }
          });
          const data = await response.json();
          const formattedAddress = data.display_name || 'Unknown Location';
          setLocation({ latitude, longitude, formattedAddress });
          setLocationName(formattedAddress);
          webViewRef.current?.injectJavaScript(`
            window.postMessage(JSON.stringify({
              action: 'updateLocation',
              latitude: ${latitude},
              longitude: ${longitude},
              formattedAddress: "${formattedAddress.replace(/"/g, '\\"')}"
            }));
          `);
        } catch (error) {
          console.error('Location fetch error:', error);
          webViewRef.current?.injectJavaScript(`
            window.postMessage(JSON.stringify({
              action: 'showError',
              message: 'Failed to fetch location. Please try again.'
            }));
          `);
        }
      } else if (data.action === 'showError') {
        setModalConfig({
          title: 'Location Error',
          message: data.message,
          onConfirm: () => setModalVisible(false),
          confirmText: 'OK',
          showCancel: false,
        });
        setModalVisible(true);
      }
    } catch (error) {
      console.error('WebView message error:', error);
      setModalConfig({
        title: 'Map Error',
        message: 'Failed to process map data. Please try again.',
        onConfirm: () => setModalVisible(false),
        confirmText: 'OK',
        showCancel: false,
      });
      setModalVisible(true);
    }
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

  const capitalizeFirstLetter = (string) => {
    if (!string) return string;
    return string.charAt(0).toUpperCase() + string.slice(1);
  };

  const handleCalamityChange = (value) => {
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

  const handleOpenMap = async () => {
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

    if (permissionStatus !== 'granted') {
      await handleRequestPermission();
    } else if (location?.latitude && location?.longitude) {
      setShowMapModal(true);
    } else {
      await handleRequestPermission();
    }
  };

  const handleSubmit = () => {
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
              <View style={{ gap: 10 }}>
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
                  style={[GlobalStyles.supplementaryButton, GlobalStyles.openMap]}
                  onPress={handleOpenMap}
                >
                  <MaterialIcons name="pin-drop" size={28} color={Theme.colors.accentBlue} />
                  <Text style={GlobalStyles.supplementaryButtonText}>Pin Location</Text>
                </TouchableOpacity>
              </View>
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
              <View style={[GlobalStyles.input, GlobalStyles.pickerContainer, errors.calamityArea && GlobalStyles.inputError]}>
                <Dropdown
                style={{ padding: 10, width: '100%' }}
                placeholderStyle={GlobalStyles.placeholderStyle}
                selectedTextStyle={GlobalStyles.selectedTextStyle}
                itemTextStyle={GlobalStyles.itemTextStyle}
                data={[
                  { label: 'Select an Active Operation', value: null }, // placeholder option
                  ...activeActivations.map((activation) => ({
                    label: `${activation.calamityType} - ${activation.calamityName} (by ${activation.organization})`,
                    value: `${activation.calamityType} - ${activation.calamityName} (by ${activation.organization})`,
                  }))
                ]}
                labelField="label"
                valueField="value"
                placeholder="Select an Active Operation"
                value={reportData.calamityArea || null} // <-- must match the null placeholder
                onChange={(item) => handleCalamityChange(item.value)}
                disable={!canSubmit}
              />

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
        <SafeAreaView style={{ flex: 1 }}>
          <View style={{ flex: 1 }}>
            <View style={styles.mapModalHeader}>
              <Text style={styles.mapModalHeaderText}>Pin Area of Operation</Text>
              <TouchableOpacity
                style={{ padding: 10, justifyContent: 'flex-end' }}
                onPress={() => setShowMapModal(false)}
              >
                <Ionicons name="close" size={24} color={Theme.colors.black} />
              </TouchableOpacity>
            </View>
            <WebView
              ref={webViewRef}
              source={{ html: leafletHtml }}
              style={{ flex: 1 }}
              onMessage={handleWebViewMessage}
              onError={(syntheticEvent) => {
                console.error('WebView error:', syntheticEvent.nativeEvent);
                setModalConfig({
                  title: 'Map Error',
                  message: 'Failed to load the map. Please check your internet connection.',
                  onConfirm: () => setModalVisible(false),
                  confirmText: 'OK',
                  showCancel: false,
                });
                setModalVisible(true);
              }}
            />
          </View>
        </SafeAreaView>
      </Modal>

      <OperationCustomModal
        visible={modalVisible}
        title={modalConfig.title}
        message={modalConfig.message}
        onConfirm={modalConfig.onConfirm}
        onCancel={modalConfig.onCancel}
        confirmText={modalConfig.confirmText}
        showCancel={modalConfig.showCancel}
      />
    </SafeAreaView>
  );
};

export default ReportSubmissionScreen;