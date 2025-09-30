import { Ionicons, MaterialIcons, Feather } from '@expo/vector-icons';
import React, { useRef, useState, useEffect } from 'react';
import {
  Dimensions,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Animated,
  ScrollView,
  StatusBar,
  Modal,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { Dropdown } from 'react-native-element-dropdown';
import { useNavigation, useRoute } from '@react-navigation/native';
import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';
import GlobalStyles from '../styles/GlobalStyles';
import styles from '../styles/ReliefRequestStyles';
import Theme from '../constants/theme';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import OperationCustomModal from '../components/OperationCustomModal';
import useOperationCheck from '../components/useOperationCheck';
import { useAuth } from '../context/AuthContext';

const { height } = Dimensions.get('window');

const CustomToast = ({ visible, title, message, onDismiss }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    let timer;
    if (visible) {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();

      timer = setTimeout(() => {
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }).start(() => onDismiss());
      }, 3000);
    }
    return () => {
      if (timer) clearTimeout(timer);
      Animated.timing(fadeAnim).stop();
    };
  }, [visible, fadeAnim, onDismiss]);

  if (!visible) return null;

  return (
    <Animated.View style={[styles.toastContainer, { opacity: fadeAnim }]}>
      <Ionicons name="checkmark-circle" size={40} color="#00BCD4" style={styles.toastIcon} />
      <View style={styles.toastContent}>
        <Text style={styles.toastTitle}>{title}</Text>
        <Text style={styles.toastMessage}>{message}</Text>
      </View>
    </Animated.View>
  );
};

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

const ReliefRequestScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { user } = useAuth();
  const { canSubmit, organizationName, modalVisible, setModalVisible, modalConfig, setModalConfig } = useOperationCheck();
  const [errors, setErrors] = useState({});
  const [reportData, setReportData] = useState({
    contactPerson: route.params?.reportData?.contactPerson || user?.contactPerson || '',
    contactNumber: route.params?.reportData?.contactNumber || user?.contactNumber || '',
    email: route.params?.reportData?.email || user?.email || '',
    address: {
      formattedAddress: route.params?.reportData?.address?.formattedAddress || '',
      latitude: route.params?.reportData?.address?.latitude || null,
      longitude: route.params?.reportData?.address?.longitude || null,
    },
    category: route.params?.reportData?.category || '',
    itemName: '',
    quantity: '',
    notes: '',
  });
  const [items, setItems] = useState(route.params?.addedItems || []);
  const [isItemDropdownVisible, setIsItemDropdownVisible] = useState(false);
  const [filteredItems, setFilteredItems] = useState([]);
  const [toastVisible, setToastVisible] = useState(false);
  const [toastConfig, setToastConfig] = useState({ title: '', message: '' });
  const [mapModalVisible, setMapModalVisible] = useState(false);
  const [urgent, setUrgent] = useState(route.params?.urgent || false);
  const [permissionStatus, setPermissionStatus] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const itemInputRef = useRef(null);
  const webViewRef = useRef(null);
  const flatListRef = useRef(null);
  const insets = useSafeAreaInsets();
  const [isDropdownFocused, setIsDropdownFocused] = useState(false);
  const arrowRotation = useRef(new Animated.Value(0)).current;

  const categories = [
    { label: 'Relief Packs', value: 'Relief Packs' },
    { label: 'Hot Meals', value: 'Hot Meals' },
    { label: 'Hygiene Kits', value: 'Hygiene Kits' },
    { label: 'Drinking Water', value: 'Drinking Water' },
    { label: 'Rice Packs', value: 'Rice Packs' },
    { label: 'Other Essentials', value: 'Other Essentials' },
  ];
  const ITEM_HEIGHT = 50;
  const activeIndex = categories.findIndex(item => item.value === reportData.category);

  useEffect(() => {
    Animated.timing(arrowRotation, {
      toValue: isDropdownFocused ? 1 : 0,
      duration: 200,
      useNativeDriver: true,
    }).start();
  }, [isDropdownFocused, arrowRotation]);

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
            <button id="returnButton" class="return-button">
              <span class="material-icons" style="font-size:28px; color:#fff;">my_location</span>
            </button>            </div>
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
        let currentLocation = { lat: ${reportData.address.latitude || 14.5995}, lon: ${reportData.address.longitude || 120.9842}, address: '${reportData.address.formattedAddress || ''}' };
        let mapType = 'roadmap';
        let searchBarVisible = false;

        function initializeMap() {
          try {
            map = L.map('map', { zoomControl: false }).setView([currentLocation.lat, currentLocation.lon], 16);
            currentLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
              attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
              maxZoom: 18,
            }).addTo(map);
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
            const formattedAddress = data.display_name || '';
            setUserLocation({ latitude, longitude, formattedAddress });
            if (!route.params?.reportData?.address?.formattedAddress) {
              setReportData((prev) => ({
                ...prev,
                address: {
                  formattedAddress,
                  latitude,
                  longitude,
                },
              }));
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
            message: 'Please enable location access to set your current location as the default drop-off address.',
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
                  const formattedAddress = data.display_name || '';
                  setUserLocation({ latitude, longitude, formattedAddress });
                  if (!route.params?.reportData?.address?.formattedAddress) {
                    setReportData((prev) => ({
                      ...prev,
                      address: {
                        formattedAddress,
                        latitude,
                        longitude,
                      },
                    }));
                  }
                  await AsyncStorage.setItem('hasShownLocationModal', 'true');
                } else {
                  setPermissionStatus('denied');
                  setModalConfig({
                    title: 'Location Permission Denied',
                    message: 'Location access is required to set the default drop-off address. Please enable it in your device settings.',
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
  }, [route.params]);

  useEffect(() => {
    if (route.params?.reportData) {
      setReportData((prev) => ({
        ...prev,
        contactPerson: route.params.reportData.contactPerson || user?.contactPerson || prev.contactPerson,
        contactNumber: route.params.reportData.contactNumber || user?.contactNumber || prev.contactNumber,
        email: route.params.reportData.email || user?.email || prev.email,
        address: {
          formattedAddress: route.params.reportData.address?.formattedAddress || prev.address.formattedAddress,
          latitude: route.params.reportData.address?.latitude || prev.address.latitude,
          longitude: route.params.reportData.address?.longitude || prev.address.longitude,
        },
        category: route.params.reportData.category || prev.category,
      }));
    }
    if (route.params?.addedItems) {
      setItems(route.params.addedItems);
    }
    if (route.params?.reportData?.category) {
      setFilteredItems(itemSuggestions[route.params.reportData.category] || []);
    }
  }, [route.params, user]);

  useEffect(() => {
    if (mapModalVisible && (userLocation || reportData.address.latitude)) {
      webViewRef.current?.injectJavaScript(`
        window.postMessage(JSON.stringify({
          action: 'setInitialLocation',
          latitude: ${reportData.address.latitude || userLocation?.latitude || 14.5995},
          longitude: ${reportData.address.longitude || userLocation?.longitude || 120.9842},
          formattedAddress: "${reportData.address.formattedAddress || userLocation?.formattedAddress || ''}"
        }));
      `);
    }
  }, [mapModalVisible, userLocation, reportData.address]);

  const requiredFields = ['contactPerson', 'contactNumber', 'email', 'address.formattedAddress', 'category'];
  const itemInputRequiredFields = ['category', 'itemName', 'quantity'];

  const itemSuggestions = {
    'Relief Packs': ['Rice', 'Canned Goods', 'Noodles', 'Biscuits', 'Dried Fruits'],
    'Hot Meals': ['Rice', 'Canned Goods', 'Vegetables', 'Meat', 'Spices'],
    'Hygiene Kits': ['Soap', 'Toothpaste', 'Toothbrush', 'Shampoo', 'Sanitary Pads'],
    'Medical Supplies': ['Bandages', 'Antiseptics', 'Painkillers', 'Antibiotics', 'Vitamins'],
    Clothing: ['Shirts', 'Pants', 'Jackets', 'Socks', 'Underwear'],
    Shelter: ['Tents', 'Blankets', 'Sleeping Bags', 'Tarps', 'Pillows'],
  };

  const capitalizeFirstLetter = (string) => {
    if (!string) return string;
    return string.replace(/\b\w/g, (char) => char.toUpperCase());
  };

  const handleChange = (field, value) => {
    if (field.includes('address.')) {
      const addressField = field.split('.')[1];
      setReportData((prev) => ({
        ...prev,
        address: { ...prev.address, [addressField]: value },
      }));
    } else {
      setReportData((prev) => ({ ...prev, [field]: value }));
    }

    if (value.trim() !== '') {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }

    if (field === 'category') {
      setReportData((prev) => ({ ...prev, itemName: '' }));
      setFilteredItems(itemSuggestions[value] || []);
      setIsItemDropdownVisible(false);
    }

    if (field === 'itemName' && reportData.category) {
      const suggestions = itemSuggestions[reportData.category] || [];
      if (value.trim() === '') {
        setFilteredItems(suggestions);
        setIsItemDropdownVisible(false);
      } else {
        const filtered = suggestions.filter((item) => item.toLowerCase().includes(value.toLowerCase()));
        setFilteredItems(filtered);
        setIsItemDropdownVisible(true);
      }
    }
  };

  const handleItemSelect = (item) => {
    setReportData((prev) => ({ ...prev, itemName: item }));
    setIsItemDropdownVisible(false);
    setErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors.itemName;
      return newErrors;
    });
    itemInputRef.current?.blur();
    setTimeout(() => itemInputRef.current?.focus(), 0);
  };

  const handleItemFocus = () => {
    if (reportData.category) {
      setIsItemDropdownVisible(true);
      setFilteredItems(itemSuggestions[reportData.category] || []);
    }
  };

  const handleBlur = () => {
    setTimeout(() => setIsItemDropdownVisible(false), 200);
  };

  const handleWebViewMessage = async (event) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.action === 'confirm') {
        setReportData((prev) => ({
          ...prev,
          address: {
            formattedAddress: data.formattedAddress || '',
            latitude: parseFloat(data.latitude) || null,
            longitude: parseFloat(data.longitude) || null,
          },
        }));
        setMapModalVisible(false);
      } else if (data.action === 'cancel') {
        setMapModalVisible(false);
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
            message: 'Please enable location access in your device settings to return to your current location.',
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
                  const formattedAddress = data.display_name || '';
                  setUserLocation({ latitude, longitude, formattedAddress });
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
                    message: 'Location access is required to set the default drop-off address. Please enable it in your device settings.',
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
          const formattedAddress = data.display_name || '';
          setUserLocation({ latitude, longitude, formattedAddress });
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
    }
  };

  const addButton = () => {
    if (!canSubmit) {
      setModalConfig({
        title: 'Permission Error',
        message: 'You do not have permission to submit requests.',
        onConfirm: () => setModalVisible(false),
        confirmText: 'OK',
        showCancel: false,
      });
      setModalVisible(true);
      return;
    }

    const newErrors = {};
    itemInputRequiredFields.forEach((field) => {
      const value = reportData[field];
      if (value === null || (typeof value === 'string' && value.trim() === '')) {
        const fieldName = field.replace(/([A-Z])/g, ' $1').trim();
        newErrors[field] = `${capitalizeFirstLetter(fieldName)} is required`;
      }
    });

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setModalConfig({
        title: 'Incomplete Fields',
        message: 'Please fill out all required item fields before adding.',
        onConfirm: () => setModalVisible(false),
        confirmText: 'OK',
        showCancel: false,
      });
      setModalVisible(true);
      return;
    }

    const newItem = {
      name: reportData.itemName,
      quantity: Number(reportData.quantity),
      notes: reportData.notes || 'N/A',
    };
    setItems([...items, newItem]);
    setModalConfig({
      title: 'Item Saved',
      message: `Saved:\nItem: ${newItem.name}\nQuantity: ${newItem.quantity}\nNotes: ${newItem.notes}`,
      onConfirm: () => setModalVisible(false),
      confirmText: 'OK',
      showCancel: false,
    });
    setModalVisible(true);

    setReportData((prev) => ({
      ...prev,
      itemName: '',
      quantity: '',
      notes: '',
    }));
    setIsItemDropdownVisible(false);
    setErrors((prev) => {
      const newErrors = { ...prev };
      itemInputRequiredFields.forEach((field) => delete newErrors[field]);
      return newErrors;
    });
  };

  const handleDeleteItem = (index) => {
    setModalConfig({
      title: 'Confirm Deletion',
      message: 'Are you sure you want to delete this item?',
      onConfirm: () => {
        setItems(items.filter((_, i) => i !== index));
        setModalVisible(false);
        setToastConfig({
          title: 'Item Deleted',
          message: 'The item has been removed from the list.',
        });
        setToastVisible(true);
      },
      onCancel: () => setModalVisible(false),
      confirmText: 'Delete',
      showCancel: true,
    });
    setModalVisible(true);
  };

  const handleSubmit = () => {
    if (!canSubmit) {
      setModalConfig({
        title: 'Permission Error',
        message: 'You do not have permission to submit requests.',
        onConfirm: () => setModalVisible(false),
        confirmText: 'OK',
        showCancel: false,
      });
      setModalVisible(true);
      return;
    }

    const newErrors = {};
    let allRequiredBlank = true;

    requiredFields.forEach((field) => {
      const value = field.includes('address.') ? reportData.address[field.split('.')[1]] : reportData[field];
      if (value === null || (typeof value === 'string' && value.trim() === '')) {
        const fieldName = field.replace(/([A-Z])/g, ' $1').trim();
        newErrors[field] = `${capitalizeFirstLetter(fieldName)} is required`;
      } else {
        allRequiredBlank = false;
      }
    });

    if (reportData.contactNumber && !/^[0-9]{11}$/.test(reportData.contactNumber)) {
      newErrors.contactNumber = 'Contact number must be exactly 11 digits';
    }

    if (reportData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(reportData.email)) {
      newErrors.email = 'Email is not valid';
    }

    if (allRequiredBlank) {
      setErrors(newErrors);
      setModalConfig({
        title: 'Incomplete Data',
        message: 'Please fill in required contact fields.',
        onConfirm: () => setModalVisible(false),
        confirmText: 'OK',
        showCancel: false,
      });
      setModalVisible(true);
      return;
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setModalConfig({
        title: 'Incomplete Data',
        message: `Please fill in required contact fields:\n${Object.values(newErrors).join('\n')}`,
        onConfirm: () => setModalVisible(false),
        confirmText: 'OK',
        showCancel: false,
      });
      setModalVisible(true);
      return;
    }

    if (items.length === 0) {
      setModalConfig({
        title: 'No Items Added',
        message: 'Please add at least one item to the request.',
        onConfirm: () => setModalVisible(false),
        confirmText: 'OK',
        showCancel: false,
      });
      setModalVisible(true);
      return;
    }
    navigation.navigate('ReliefSummary', { reportData, addedItems: items, organizationName, urgent });
  };

  const renderLabel = (label, isRequired) => (
    <Text style={GlobalStyles.formTitle}>
      {label}
      {isRequired && <Text style={{ color: 'red' }}> *</Text>}
    </Text>
  );

 const handleUrgentToggle = () => {
    setUrgent(!urgent);
  };

  const maxDropdownHeight = height * 0.3;

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
          <Text style={[GlobalStyles.headerTitle, { color: Theme.colors.primary }]}>Relief Request</Text>
        </View>
      </LinearGradient>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'position'} 
        style={{ flex: 1 }}
        keyboardVerticalOffset={0}
      >
        <ScrollView
          contentContainerStyle={[GlobalStyles.scrollViewContent]}
          scrollEnabled={true}
          keyboardShouldPersistTaps="handled"
        >
          <View style={GlobalStyles.form}>
            <View style={GlobalStyles.section}>
              <Text style={GlobalStyles.sectionTitle}>Contact Information</Text>
              {renderLabel('Contact Person', true)}
              <View>
                <TextInput
                  style={[GlobalStyles.input, errors.contactPerson && GlobalStyles.inputError]}
                  placeholder="Enter Name"
                  placeholderTextColor={Theme.colors.placeholderColor}
                  onChangeText={(val) => handleChange('contactPerson', val)}
                  value={reportData.contactPerson}
                  editable={false}
                />
              </View>
              {errors.contactPerson && <Text style={GlobalStyles.errorText}>{errors.contactPerson}</Text>}

              {renderLabel('Contact Number', true)}
              <View>
                <TextInput
                  style={[GlobalStyles.input, errors.contactNumber && GlobalStyles.inputError]}
                  placeholder="Enter Mobile Number"
                  placeholderTextColor={Theme.colors.placeholderColor}
                  onChangeText={(val) => handleChange('contactNumber', val)}
                  value={reportData.contactNumber}
                  keyboardType="numeric"
                  editable={false}
                />
              </View>
              {errors.contactNumber && <Text style={GlobalStyles.errorText}>{errors.contactNumber}</Text>}

              {renderLabel('Email', true)}
              <View>
                <TextInput
                  style={[GlobalStyles.input, errors.email && GlobalStyles.inputError]}
                  placeholder="Enter Email"
                  placeholderTextColor={Theme.colors.placeholderColor}
                  onChangeText={(val) => handleChange('email', val)}
                  value={reportData.email}
                  keyboardType="email-address"
                  editable={false}
                />
              </View>
              {errors.email && <Text style={GlobalStyles.errorText}>{errors.email}</Text>}

              {renderLabel('Drop-off Address', true)}
              <View style={{ flexDirection: 'column', gap: 10, margin: 0, width: '100%' }}>
                <TextInput
                  style={[
                    GlobalStyles.input,
                    { width: '100%' },
                    errors['address.formattedAddress'] && GlobalStyles.inputError,
                  ]}
                  placeholder="Enter Drop-Off Address"
                  placeholderTextColor={Theme.colors.placeholderColor}
                  onChangeText={(val) => handleChange('address.formattedAddress', val)}
                  value={reportData.address.formattedAddress}
                />
                <TouchableOpacity
                  style={[GlobalStyles.supplementaryButton, GlobalStyles.openMap]}
                  onPress={() => setMapModalVisible(true)}
                >
                  <MaterialIcons name="pin-drop" size={24} color={Theme.colors.accentBlue} />
                  <Text style={GlobalStyles.supplementaryButtonText}>Pin Location</Text>
                </TouchableOpacity>
              </View>
              {errors['address.formattedAddress'] && (
                <Text style={GlobalStyles.errorText}>{errors['address.formattedAddress']}</Text>
              )}
              {renderLabel('Request Category', true)}
              <View style={[GlobalStyles.input, GlobalStyles.pickerContainer, errors.category && GlobalStyles.inputError]}>
                <Dropdown
                  style={{ padding: 10, width: '100%', fontFamily: 'Poppins_Regular' }}
                  placeholder="Select a category"
                  placeholderStyle={GlobalStyles.placeholderStyle}
                  selectedTextStyle={GlobalStyles.selectedTextStyle}
                  itemTextStyle={GlobalStyles.itemTextStyle}
                  itemContainerStyle={GlobalStyles.itemContainerStyle}
                  containerStyle={GlobalStyles.containerStyle}
                  data={categories}
                  labelField="label"
                  valueField="value"
                  value={reportData.category}
                  onChange={(item) => handleChange('category', item.value)}
                  disable={!canSubmit}
                  renderRightIcon={() => (
                    <Animated.View
                      style={{
                        transform: [{
                          rotate: arrowRotation.interpolate({
                            inputRange: [0, 1],
                            outputRange: ['0deg', '180deg'],
                          }),
                        }],
                      }}
                    >
                      <Ionicons
                        name="chevron-down"
                        size={18}
                        color={Theme.colors.placeholder || '#999999'}
                      />
                    </Animated.View>
                  )}
                  autoScroll={false}
                  flatListProps={{
                    keyExtractor: (item) => item.value.toString(),
                    ref: flatListRef,
                    getItemLayout: (_, index) => ({
                      length: ITEM_HEIGHT,
                      offset: ITEM_HEIGHT * index,
                      index,
                    }),
                  }}
                  renderItem={(item) => (
                    <Text style={GlobalStyles.itemTextStyle}>
                      {item.label}
                    </Text>
                  )}
                  onFocus={() => {
                    setIsDropdownFocused(true);
                    if (reportData.category && activeIndex >= 0) {
                      setTimeout(() => {
                        flatListRef.current?.scrollToIndex({ index: activeIndex, animated: true });
                      }, 100);
                    }
                  }}
                  onBlur={() => {
                    setIsDropdownFocused(false);
                  }}
                />
              </View>
              {errors.category && <Text style={GlobalStyles.errorText}>{errors.category}</Text>}
              <TouchableOpacity
                style={[GlobalStyles.checkboxContainer, urgent && GlobalStyles.checkboxChecked]}
                onPress={handleUrgentToggle}
              >
                <Ionicons
                  name={urgent ? 'checkbox' : 'square-outline'}
                  size={20}
                  color={urgent ? Theme.colors.accent : Theme.colors.black}
                />
                <Text style={[GlobalStyles.checkboxLabel, { fontFamily: 'Poppins_SemiBold', fontSize: 12 }]}>Mark as an Urgent Request</Text>
              </TouchableOpacity>
            </View>
<View style={[GlobalStyles.section, { zIndex: 1000 }]}>
              <Text style={GlobalStyles.sectionTitle}>Requested Items</Text>

              {renderLabel('Item Name', true)}
              <View style={{ position: 'relative', zIndex: 1500 }}>
                <TextInput
                  ref={itemInputRef}
                  placeholder="Select or Type Item"
                  placeholderTextColor={Theme.colors.placeholderColor}
                  value={reportData.itemName}
                  onChangeText={(val) => handleChange('itemName', val)}
                  onFocus={handleItemFocus}
                  onBlur={handleBlur}
                  editable={!!reportData.category && canSubmit}
                  style={[GlobalStyles.input, errors.itemName && GlobalStyles.inputError]}
                />
                {!reportData.category && (reportData.itemName || errors.itemName) && (
                  <Text style={GlobalStyles.errorText}>Please select a Request Category first.</Text>
                )}
                {isItemDropdownVisible && filteredItems.length > 0 && (
                  <View style={[styles.dropdownContainer, { maxHeight: maxDropdownHeight, zIndex: 1500 }]}>
                    {filteredItems.map((item, index) => (
                      <TouchableOpacity
                        key={index}
                        style={styles.dropdownItem}
                        onPress={() => handleItemSelect(item)}
                      >
                        <Text style={styles.dropdownItemText}>{item}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>
              {errors.itemName && <Text style={GlobalStyles.errorText}>{errors.itemName}</Text>}

              {renderLabel('Quantity', true)}
              <View>
                <TextInput
                  style={[GlobalStyles.input, errors.quantity && GlobalStyles.inputError]}
                  placeholder="Enter Quantity"
                  placeholderTextColor={Theme.colors.placeholderColor}
                  onChangeText={(val) => handleChange('quantity', val)}
                  value={reportData.quantity}
                  keyboardType="numeric"
                  editable={!!reportData.category && canSubmit}
                />
                {!reportData.category && (reportData.quantity || errors.quantity) && (
                  <Text style={GlobalStyles.errorText}>Please select a Request Category first.</Text>
                )}
              </View>
              {errors.quantity && <Text style={GlobalStyles.errorText}>{errors.quantity}</Text>}

              {renderLabel('Additional Notes', false)}
              <View>
                <TextInput
                  style={[GlobalStyles.input, styles.textArea, errors.notes && GlobalStyles.inputError]}
                  placeholder="Enter Notes"
                  placeholderTextColor={Theme.colors.placeholderColor}
                  onChangeText={(val) => handleChange('notes', val)}
                  value={reportData.notes}
                  editable={!!reportData.category && canSubmit}
                />
                {!reportData.category && reportData.notes && (
                  <Text style={GlobalStyles.errorText}>Please select a Request Category first.</Text>
                )}
              </View>
              {errors.notes && <Text style={GlobalStyles.errorText}>{errors.notes}</Text>}

              <View style={GlobalStyles.supplementaryButtonContainer}>
                <TouchableOpacity
                  style={[GlobalStyles.supplementaryButton, !canSubmit && { opacity: 0.6 }]}
                  onPress={addButton}
                  disabled={!canSubmit}
                >
                  <Text style={GlobalStyles.supplementaryButtonText}>Add Item</Text>
                </TouchableOpacity>
              </View>

              {items.length > 0 && (
                <View>
                  <Text style={styles.addedItems}>Added Items:</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={true}>
                    <View style={[styles.table]}>
                      <View style={styles.tableRow}>
                        <View style={[styles.tableHeader, { minWidth: 100, borderTopLeftRadius: 10 }]}>
                          <Text style={styles.tableHeaderText}>No.</Text>
                        </View>
                        <View style={[styles.tableHeader, { minWidth: 100 }]}>
                          <Text style={styles.tableHeaderText}>Item</Text>
                        </View>
                        <View style={[styles.tableHeader, { minWidth: 100 }]}>
                          <Text style={styles.tableHeaderText}>Quantity</Text>
                        </View>
                        <View style={[styles.tableHeader, { minWidth: 150, flex: 1 }]}>
                          <Text style={styles.tableHeaderText}>Notes</Text>
                        </View>
                        <View style={[styles.tableHeader, { minWidth: 100, borderTopRightRadius: 10 }]}>
                          <Text style={styles.tableHeaderText}>Actions</Text>
                        </View>
                      </View>
                      <FlatList
                        data={items}
                        keyExtractor={(_, index) => index.toString()}
                        renderItem={({ item, index }) => (
                          <View style={styles.tableRow}>
                            <View style={[styles.cell, { minWidth: 100 }]}>
                              <Text style={styles.tableCell}>{index + 1}</Text>
                            </View>
                            <View style={[styles.cell, { minWidth: 100 }]}>
                              <Text style={styles.tableCell}>{item.name}</Text>
                            </View>
                            <View style={[styles.cell, { minWidth: 100 }]}>
                              <Text style={styles.tableCell}>{item.quantity}</Text>
                            </View>
                            <View style={[styles.cell, { minWidth: 150, flex: 1 }]}>
                              <Text style={styles.tableCell} numberOfLines={100} ellipsizeMode="tail">
                                {item.notes || 'N/A'}
                              </Text>
                            </View>
                            <View style={[styles.cell, { minWidth: 100, alignContent: 'center' }]}>
                              <TouchableOpacity onPress={() => handleDeleteItem(index)} disabled={!canSubmit}>
                                <Ionicons name="trash-outline" size={20} color={canSubmit ? '#FF0000' : '#888'} />
                              </TouchableOpacity>
                            </View>
                          </View>
                        )}
                      />
                    </View>
                  </ScrollView>
                </View>
              )}
            </View>    
             <View style={{ marginHorizontal: 15 }}>
             <TouchableOpacity
                style={[GlobalStyles.button, !canSubmit && { opacity: 0.6 }]}
                onPress={handleSubmit}
                disabled={!canSubmit}
               >
                <Text style={GlobalStyles.buttonText}>Proceed</Text>
                </TouchableOpacity>
                </View>      
            </View>
        </ScrollView>
      </KeyboardAvoidingView>
<Modal
        visible={mapModalVisible}
        animationType="slide"
        onRequestClose={() => setMapModalVisible(false)}
      >
        <SafeAreaView style={{ flex: 1 }}>
          <View style={{ flex: 1 }}>
            <View style={GlobalStyles.mapModalHeader}>
              <Text style={GlobalStyles.mapModalHeaderText}>Pin Drop-Off Address</Text>
              <TouchableOpacity
                style={{ padding: 10, justifyContent: 'flex-end' }}
                onPress={() => setMapModalVisible(false)}
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

      <CustomToast
        visible={toastVisible}
        title={toastConfig.title}
        message={toastConfig.message}
        onDismiss={() => setToastVisible(false)}
      />    </SafeAreaView>
  );
};

export default ReliefRequestScreen;