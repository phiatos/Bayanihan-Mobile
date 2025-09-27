import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import React, { useContext, useEffect, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  FlatList,
  SafeAreaView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  StatusBar,
  Platform,
  Modal,
  ToastAndroid,
  ImageBackground
} from 'react-native';
import WebView from 'react-native-webview';
import Theme from '../constants/theme';
import { AuthContext } from '../context/AuthContext';
import GlobalStyles from '../styles/GlobalStyles';
import { styles } from '../styles/HomeScreenStyles';
import { LinearGradient } from 'expo-linear-gradient';
import { KeyboardAvoidingView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getDatabase, ref, get } from 'firebase/database';
import AsyncStorage from '@react-native-async-storage/async-storage';
import BayanihanLogo from '../../assets/images/ab_logo.png';

const { height, width } = Dimensions.get('window');

const HomeScreen = ({ navigation }) => {
  const [location, setLocation] = useState(null);
  const [permissionStatus, setPermissionStatus] = useState(null);
  const [searchBarVisible, setSearchBarVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [mapType, setMapType] = useState('roadmap');
  const [showWeather, setShowWeather] = useState(false);
  const searchAnim = useRef(new Animated.Value(0)).current;
  const { user } = useContext(AuthContext);
  const webViewRef = useRef(null);
  const searchTimeout = useRef(null);
  const insets = useSafeAreaInsets();
  const [contactPerson, setContactPerson] = useState(null);
  const [firstName, setFirstName] = useState(null);
  const [lastName, setLastName] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorModal, setErrorModal] = useState({ visible: false, message: '' });

  const mapStyles = `
    body { margin: 0; }
    #map { height: 100vh; width: 100%; }
    .overlay-container { position: absolute; top: 100px; left: 10px; right: 10px; z-index: 1000; }
    .search-wrapper { position: relative; }
    .search-container { 
      display: flex; 
      align-items: center; 
      background: #FFF9F0; 
      box-shadow: 0 2px 4px rgba(0,0,0,0.2); 
      transition: all 0.3s ease; 
      overflow: hidden;
      border: solid 1px #14aebb;
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
      right: -1px; 
      background: #14aebb; 
      padding: 12px;
      border: none;
      border-radius: 25px; 
      box-shadow: 0 2px 4px rgba(0,0,0,0.2); 
      z-index: 1000; 
      display: flex;              
      align-items: center;  
      justify-content: center;      
    }
    
    .map-type-buttons-container { 
      position: absolute; 
      top: 180px; 
      left: 10px; 
      z-index: 999; 
      display: flex;           
      flex-direction: column;    
      gap: 8px;  
    }
    
    .bayanihan-infowindow {
      font-family: 'Poppins', sans-serif;
      color: #333;
      animation: slideIn 0.3s ease-out;
    }
    .bayanihan-infowindow h3 {
      margin: 0 0 10px;
      color: #007BFF;
      font-size: 18px;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .bayanihan-infowindow p {
      margin: 5px 0;
      font-size: 14px;
    }
    @keyframes slideIn {
      0% { transform: translateY(10px); opacity: 0; }
      100% { transform: translateY(0); opacity: 1; }
    }
    .custom-marker {
      font-size: 24px;
      text-align: center;
    }
  `;

  useEffect(() => {
    const checkPermissionStatus = async () => {
      try {
        const hasShownModal = await AsyncStorage.getItem('hasShownLocationModal');
        const { status } = await Location.getForegroundPermissionsAsync();
        setPermissionStatus(status);
        if (status === 'granted') {
          let loc = await Location.getCurrentPositionAsync({});
          if (loc.coords.accuracy > 50) {
           ToastAndroid.show('Your location accuracy is low. The pin may not be precise.', ToastAndroid.SHORT);
          }
          setLocation({
            latitude: loc.coords.latitude,
            longitude: loc.coords.longitude,
          });
        } else if (hasShownModal === 'true' && status !== 'granted') {
          setPermissionStatus('denied');
          navigation.navigate('Dashboard');
          ToastAndroid.show('Location access is required to view the map.', ToastAndroid.SHORT);
        }
      } catch (error) {
        console.error('Permission check error:', error);
        setPermissionStatus('denied');
        navigation.navigate('Dashboard');
          ToastAndroid.show('Failed to check location permission. Please enable it in Dashboard.', ToastAndroid.SHORT);
      }
    };
    checkPermissionStatus();
  }, [navigation]);

  useEffect(() => {
    Animated.timing(searchAnim, {
      toValue: searchBarVisible ? 1 : 0,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [searchBarVisible]);

  const toggleMapType = (type) => {
    setMapType(type);
    const script = `
      if (window.map) {
        map.eachLayer((layer) => {
          if (layer instanceof L.TileLayer) {
            map.removeLayer(layer);
          }
        });
        const tileLayer = "${type}" === "roadmap" ? 
          L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          }) :
          L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
            attribution: '&copy; <a href="https://www.esri.com/">Esri</a>'
          });
        tileLayer.addTo(map);
      } else {
        console.error("Map not initialized");
      }
    `;
    webViewRef.current?.injectJavaScript(script);
  };


  const toggleSearchBar = () => {
    setSearchBarVisible(!searchBarVisible);
    const script = `
      if (window.map) {
        searchBarVisible = ${!searchBarVisible};
        document.getElementById('searchContainer').classList[${searchBarVisible ? '"remove"' : '"add"'}]('open');
        document.getElementById('searchContainer').classList[${searchBarVisible ? '"add"' : '"remove"'}]('closed');
        document.getElementById('searchInputContainer').classList[${searchBarVisible ? '"remove"' : '"add"'}]('hidden');
        document.getElementById('searchInputContainer').classList[${searchBarVisible ? '"add"' : '"remove"'}]('visible');
        if (${searchBarVisible}) {
          document.getElementById('searchInput').focus();
        } else {
          document.getElementById('searchInput').value = '';
          document.getElementById('suggestions').style.display = 'none';
        }
      }
    `;
    webViewRef.current?.injectJavaScript(script);
    if (!searchBarVisible) {
      setSearchQuery('');
      setSuggestions([]);
    }
  };

  const handleSearchInput = (text) => {
    setSearchQuery(text);
    const script = `
      document.getElementById('searchInput').value = "${text.replace(/"/g, '\\"')}";
      if (window.searchInputHandler) window.searchInputHandler({ target: { value: "${text.replace(/"/g, '\\"')}" } });
    `;
    webViewRef.current?.injectJavaScript(script);
  };

  const handleRetryPermission = async () => {
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      setPermissionStatus(status);
      if (status === 'granted') {
        let loc = await Location.getCurrentPositionAsync({});
        if (loc.coords.accuracy > 50) {
          ToastAndroid.show('Your location accuracy is low. The pin may not be precise.', ToastAndroid.SHORT);

        }
        setLocation({
          latitude: loc.coords.latitude,
          longitude: loc.coords.longitude,
        });
        await AsyncStorage.setItem('hasShownLocationModal', 'true');
        webViewRef.current?.injectJavaScript(`
          window.postMessage(JSON.stringify({
            action: 'updateLocation',
            latitude: ${loc.coords.latitude},
            longitude: ${loc.coords.longitude},
            formattedAddress: "Fetching address..."
          }));
        `);
      } else {
        setPermissionStatus('denied');
        navigation.navigate('Dashboard');
          ToastAndroid.show('Location access is required to view the map.', ToastAndroid.SHORT);

      }
    } catch (error) {
      console.error('Permission retry error:', error);
        ToastAndroid.show('Failed to retry permission. Please try again in Dashboard.', ToastAndroid.SHORT);

      navigation.navigate('Dashboard');
    }
  };

  const returnToUserLocation = async () => {
    if (permissionStatus !== 'granted') {
      return;
    }

    try {
      let loc = await Location.getCurrentPositionAsync({});
      if (loc.coords.accuracy > 50) {
        ToastAndroid.show('Your location accuracy is low. The pin may not be precise.', ToastAndroid.SHORT);

      }
      setLocation({
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
      });

      const script = `
        if (window.map) {
          const userLocation = L.latLng(${loc.coords.latitude}, ${loc.coords.longitude});
          map.setView(userLocation, 16);
          if (window.clearNonActivationMarkers) {
            clearNonActivationMarkers();
          }
          const userMarker = L.marker(userLocation, {
            title: "Your Location",
            icon: L.icon({
              iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
              iconSize: [25, 41],
              iconAnchor: [12, 41],
              popupAnchor: [1, -34],
              shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
              shadowSize: [41, 41],
            }),
          }).addTo(map);
          nonActivationMarkers.push(userMarker);
          fetch('https://nominatim.openstreetmap.org/reverse?format=json&lat=${loc.coords.latitude}&lon=${loc.coords.longitude}', {
            headers: {
              'User-Agent': 'BayanihanApp/1.0 (your.email@example.com)',
            },
          })
            .then(response => response.json())
            .then(data => {
              const infoContent = data.display_name || \`Lat: ${loc.coords.latitude}, Lng: ${loc.coords.longitude}\`;
              userMarker.bindPopup(infoContent).openPopup();
            })
            .catch(error => {
              console.error("Reverse geocoding error:", error);
              userMarker.bindPopup(\`Lat: ${loc.coords.latitude}, Lng: ${loc.coords.longitude}\`).openPopup();
            });
        } else {
          console.error("Map not initialized");
        }
      `;
      webViewRef.current?.injectJavaScript(script);
    } catch (error) {
      console.error('Return to user location error:', error);
      ToastAndroid.show('Failed to return to your location. Please try again.', ToastAndroid.SHORT);

    }
  };

  const toggleWeather = () => {
    setShowWeather(!showWeather);
    const script = `
      if (window.map && window.weatherMarker) {
        window.weatherMarker[${showWeather ? 'remove' : 'addTo'}](map);
        document.getElementById('weatherBtn').classList[${showWeather ? '"remove"' : '"add"'}]('active');
        document.getElementById('weatherBtn').querySelector('.weather-icon').classList[${showWeather ? '"remove"' : '"add"'}]('active');
      }
    `;
    webViewRef.current?.injectJavaScript(script);
  };

  const mapHtml =
    permissionStatus === 'granted' && location?.latitude && location?.longitude
      ? `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
        <link href='https://cdn.boxicons.com/fonts/basic/boxicons.min.css' rel='stylesheet'>
        <link rel="preconnect" href="https://fonts.googleapis.com">
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
        <link href="https://fonts.googleapis.com/css2?family=Poppins:ital,wght@0,100;0,200;0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,100;1,200;1,300;1,400;1,500;1,600;1,700;1,800;1,900&display=swap" rel="stylesheet">
        <script type="module" src="https://unpkg.com/ionicons@7.1.0/dist/ionicons/ionicons.esm.js"></script>
        <link href="https://fonts.googleapis.com/icon?family=Material+Icons" rel="stylesheet">

        <script nomodule src="https://unpkg.com/ionicons@7.1.0/dist/ionicons/ionicons.js"></script>
        <style>
          ${mapStyles}
        </style>
        <script src="https://www.gstatic.com/firebasejs/9.22.0/firebase-app-compat.js"></script>
        <script src="https://www.gstatic.com/firebasejs/9.22.0/firebase-database-compat.js"></script>
        <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
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
            </button>          
            </div>
        </div>
        <div id="map"></div>
        <script>
          const firebaseConfig = {
            apiKey: "AIzaSyBkmXOJvnlBtzkjNyR6wyd9BgGM0BhN0L8",
            authDomain: "bayanihan-new-472410.firebaseapp.com",
            projectId: "bayanihan-new-472410",
            storageBucket: "bayanihan-new-472410.firebasestorage.app",
            messagingSenderId: "995982574131",
            appId: "1:995982574131:web:3d45e358fad330c276d946",
            measurementId: "G-CEVPTQZM9C",
            databaseURL: "https://bayanihan-new-472410-default-rtdb.asia-southeast1.firebasedatabase.app/"
          };

          firebase.initializeApp(firebaseConfig);
          const database = firebase.database();
          const OPEN_WEATHER_API_KEY = 'YOUR_OPEN_WEATHER_API_KEY'; // Replace with your actual OpenWeatherMap API key

          let map, userMarker, weatherMarker, currentLayer;
          let activationMarkers = [];
          let nonActivationMarkers = [];
          let singlePopup;
          let weatherCache = new Map();
          let searchBarVisible = false;

          function initMap() {
            try {
              const userLocation = L.latLng(${location.latitude}, ${location.longitude});
              map = L.map('map', {
                center: userLocation,
                zoom: 16,
                zoomControl: false,
                attributionControl: false,
                doubleClickZoom: false,
                boxZoom: false,
                keyboard: false,
              });

              currentLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
                maxZoom: 18,
              }).addTo(map);

              userMarker = L.marker(userLocation, {
                title: "Your Location",
                icon: L.icon({
                  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
                  iconSize: [25, 41],
                  iconAnchor: [12, 41],
                  popupAnchor: [1, -34],
                  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
                  shadowSize: [41, 41],
                }),
              }).addTo(map);
              nonActivationMarkers.push(userMarker);

              fetch('https://nominatim.openstreetmap.org/reverse?format=json&lat=${location.latitude}&lon=${location.longitude}', {
                headers: {
                  'User-Agent': 'BayanihanApp/1.0 (your.email@example.com)',
                },
              })
                .then(response => response.json())
                .then(data => {
                  const infoContent = data.display_name || \`Lat: ${location.latitude}, Lng: ${location.longitude}\`;
                  userMarker.bindPopup(infoContent).openPopup();
                })
                .catch(error => {
                  console.error("Reverse geocoding error:", error);
                  userMarker.bindPopup(\`Lat: ${location.latitude}, Lng: ${location.longitude}\`).openPopup();
                });

              loadActivations();
              loadWeather(${location.latitude}, ${location.longitude}, true);

              map.on('click', async (e) => {
                clearNonActivationMarkers();
                const marker = L.marker(e.latlng, {
                  title: "Pinned Location",
                }).addTo(map);
                nonActivationMarkers.push(marker);

                try {
                  const response = await fetch('https://nominatim.openstreetmap.org/reverse?format=json&lat=' + e.latlng.lat + '&lon=' + e.latlng.lng, {
                    headers: { 'User-Agent': 'BayanihanApp/1.0 (your.email@example.com)' },
                  });
                  const data = await response.json();
                  const infoContent = data.display_name || \`Lat: \${e.latlng.lat}, Lng: \${e.latlng.lng}\`;
                  marker.bindPopup(infoContent).openPopup();
                  await loadWeather(e.latlng.lat, e.latlng.lng, false);
                } catch (error) {
                  console.error("Reverse geocoding error:", error);
                  marker.bindPopup(\`Lat: \${e.latlng.lat}, Lng: \${e.latlng.lng}\`).openPopup();
                }

                map.setView(e.latlng, 16);
              });

              document.getElementById('searchIcon').addEventListener('click', function () {
                searchBarVisible = !searchBarVisible;
                document.getElementById('searchContainer').classList[searchBarVisible ? 'remove' : 'add']('closed');
                document.getElementById('searchContainer').classList[searchBarVisible ? 'add' : 'remove']('open');
                document.getElementById('searchInputContainer').classList[searchBarVisible ? 'remove' : 'add']('hidden');
                document.getElementById('searchInputContainer').classList[searchBarVisible ? 'add' : 'remove']('visible');
                if (searchBarVisible) {
                  document.getElementById('searchInput').focus();
                } else {
                  document.getElementById('searchInput').value = '';
                  document.getElementById('suggestions').style.display = 'none';
                }
                window.ReactNativeWebView.postMessage(JSON.stringify({ action: 'toggleSearch', visible: searchBarVisible }));
              });

              window.searchInputHandler = async function (e) {
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
                      clearNonActivationMarkers();
                      const marker = L.marker([result.lat, result.lon], {
                        title: result.display_name,
                      }).addTo(map);
                      nonActivationMarkers.push(marker);
                      marker.bindPopup(result.display_name).openPopup();
                      document.getElementById('searchInput').value = result.display_name;
                      suggestionsDiv.style.display = 'none';
                      window.ReactNativeWebView.postMessage(JSON.stringify({
                        action: 'selectSuggestion',
                        latitude: result.lat,
                        longitude: result.lon,
                        formattedAddress: result.display_name
                      }));
                    };
                    suggestionsDiv.appendChild(div);
                  });
                  suggestionsDiv.style.display = results.length > 0 ? 'block' : 'none';
                } catch (error) {
                  console.error('Search error:', error);
                  window.ReactNativeWebView.postMessage(JSON.stringify({
                    action: 'showError',
                    message: 'Failed to fetch suggestions. Please check your internet connection.'
                  }));
                }
              };

              document.getElementById('searchInput').addEventListener('input', window.searchInputHandler);

              document.getElementById('returnButton').addEventListener('click', function () {
                window.ReactNativeWebView.postMessage(JSON.stringify({ action: 'requestUserLocation' }));
              });

              document.getElementById('roadmapBtn').addEventListener('click', function () {
                if (mapType !== 'roadmap') {
                  map.removeLayer(currentLayer);
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
                  currentLayer = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
                    attribution: '&copy; <a href="https://www.esri.com/">Esri</a>',
                    maxZoom: 18,
                  }).addTo(map);
                  mapType = 'hybrid';
                  document.getElementById('hybridBtn').classList.add('active');
                  document.getElementById('roadmapBtn').classList.remove('active');
                  document.getElementById('hybridBtn').querySelector('.map-type-icon').classList.add('active');
                  document.getElementById('roadmapBtn').querySelector('.map-type-icon').classList.remove('active');
                }
              });

              document.getElementById('weatherBtn').addEventListener('click', function () {
                window.ReactNativeWebView.postMessage(JSON.stringify({ action: 'toggleWeather' }));
              });
            } catch (error) {
              console.error("Map initialization error:", error);
              window.ReactNativeWebView?.postMessage(JSON.stringify({ type: 'error', message: 'Map initialization failed: ' + error.message }));
            }
          }

          function loadActivations() {
            try {
              const activationsRef = database.ref("activations/currentActivations").orderByChild("status").equalTo("active");
              activationsRef.on("value", (snapshot) => {
                console.log("Fetching activations...");
                activationMarkers.forEach(marker => {
                  try {
                    marker.remove();
                  } catch (err) {
                    console.warn("Error removing marker:", err.message);
                  }
                });
                activationMarkers = [];

                const activations = snapshot.val();
                if (!activations) {
                  console.log("No active activations found in Firebase.");
                  window.ReactNativeWebView?.postMessage(JSON.stringify({ type: 'info', message: 'No active activations found.' }));
                  return;
                }

                console.log("Active activations:", JSON.stringify(activations));

                Object.entries(activations).forEach(([key, activation]) => {
                  if (!activation.address?.latitude || !activation.address?.longitude) {
                    console.warn(\`Activation \${key} is missing latitude or longitude:\`, JSON.stringify(activation));
                    return;
                  }

                  const lat = parseFloat(activation.address.latitude);
                  const lng = parseFloat(activation.address.longitude);
                  if (isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
                    console.warn(\`Invalid coordinates for activation \${key}: lat=\${lat}, lng=\${lng}\`);
                    return;
                  }

                  const position = L.latLng(lat, lng);
                  console.log(\`Creating marker for \${activation.organization} at position: \${lat}, \${lng}\`);

                  const logoPath = "https://firebasestorage.googleapis.com/v0/b/bayanihan-new-472410.appspot.com/o/AB_logo.png?alt=media";
                  console.log("Attempting to load logo for marker from:", logoPath);

                  const marker = L.marker(position, {
                    title: activation.organization || "Unknown Organization",
                    icon: L.divIcon({
                      html: \`<span><i class="bxr bx-community" style="color: #FA3B99; font-size: 50px;"></i></span>\`,
                      className: 'custom-marker',
                      iconSize: [30, 30],
                      iconAnchor: [15, 30],
                      popupAnchor: [0, -30],
                    }),
                  }).addTo(map);

                  activationMarkers.push(marker);
                  console.log(\`Marker created for \${activation.organization} at (\${lat}, \${lng}), ID: \${key}\`);

                  createPopup(marker, activation, logoPath);
                });

                if (activationMarkers.length === 0) {
                  console.log("No valid activation markers were created.");
                  window.ReactNativeWebView?.postMessage(JSON.stringify({ type: 'info', message: 'No valid activation markers created.' }));
                }
              }, (error) => {
                console.error("Firebase error:", error.message);
                window.ReactNativeWebView?.postMessage(JSON.stringify({ type: 'error', message: 'Failed to load activations: ' + error.message }));
              });
            } catch (error) {
              console.error("Error in loadActivations:", error.message);
              window.ReactNativeWebView?.postMessage(JSON.stringify({ type: 'error', message: 'Activation loading failed: ' + error.message }));
            }
          }

          async function loadWeather(lat, lng, isUserLocation) {
            try {
              const cacheKey = \`\${lat}_\${lng}\`;
              if (weatherCache.has(cacheKey)) {
                console.log("Using cached weather data for:", cacheKey);
                createWeatherPopup(lat, lng, weatherCache.get(cacheKey), isUserLocation);
                return;
              }

              const response = await fetch(\`https://api.openweathermap.org/data/2.5/weather?lat=\${lat}&lon=\${lng}&appid=\${OPEN_WEATHER_API_KEY}&units=metric\`);
              if (!response.ok) {
                throw new Error(\`Weather API error: \${response.status}\`);
              }
              const weatherData = await response.json();
              console.log("Weather data fetched:", JSON.stringify(weatherData));
              weatherCache.set(cacheKey, weatherData);
              createWeatherPopup(lat, lng, weatherData, isUserLocation);
            } catch (error) {
              console.error("Weather fetch error:", error.message);
              window.ReactNativeWebView?.postMessage(JSON.stringify({ type: 'error', message: 'Failed to load weather data: ' + error.message }));
            }
          }

          function createWeatherPopup(lat, lng, weatherData, isUserLocation) {
            if (weatherMarker) {
              weatherMarker.remove();
              weatherMarker = null;
            }

            const condition = weatherData.weather[0].main.toLowerCase();
            const temp = weatherData.main.temp;
            const description = weatherData.weather[0].description;
            const icon = condition.includes("clear") ? "☀️" :
                        condition.includes("rain") || condition.includes("drizzle") || condition.includes("thunderstorm") ? "🌧️" :
                        condition.includes("clouds") ? "☁️" : "🌫️";

            const popupContent = \`
              <div class="bayanihan-infowindow">
                <h3 style="color: black; font-family: 'Poppins', sans-serif;">
                  <span style="font-size: 24px;">\${icon}</span>
                  Weather at \${isUserLocation ? 'Your Location' : 'Selected Location'}
                </h3>
                <p><strong style="color: black; font-weight: bold;">Condition:</strong> \${description}</p>
                <p><strong style="color: black; font-weight: bold;">Temperature:</strong> \${temp}°C</p>
                <p><strong style="color: black; font-weight: bold;">Humidity:</strong> \${weatherData.main.humidity}%</p>
                <p><strong style="color: black; font-weight: bold;">Wind Speed:</strong> \${weatherData.wind.speed} m/s</p>
              </div>
            \`;

            weatherMarker = L.marker([lat, lng], {
              title: "Weather",
              icon: L.divIcon({
                html: \`<span style="font-size: 24px;">\${icon}</span>\`,
                className: 'custom-marker',
                iconSize: [30, 30],
                iconAnchor: [15, 30],
                popupAnchor: [0, -30],
              }),
            });

            weatherMarker.on('click', () => {
              if (singlePopup && singlePopup._source !== weatherMarker) {
                singlePopup.remove();
              }
              singlePopup = L.popup().setContent(popupContent).setLatLng([lat, lng]).openOn(map);
              console.log("Weather popup opened at:", lat, lng);
            });

            if (${showWeather}) {
              weatherMarker.addTo(map);
              console.log("Weather marker added at:", lat, lng);
            }
          }

          function createPopup(marker, activation, logoPath) {
            fetch(logoPath)
              .then(response => {
                if (!response.ok) {
                  console.warn("Logo fetch failed, using fallback emoji:", logoPath);
                  throw new Error("Logo fetch failed");
                }
                return response.url;
              })
              .catch(error => {
                console.warn("Logo fetch error:", error.message);
                return null;
              })
              .then(BayanihanLogo => {
                const content = \`
                  <div class="bayanihan-infowindow">
                    <h3 style="color: black; font-family: 'Poppins', sans-serif;">
                      \${activation.organization || 'Unknown Organization'}
                    </h3>
                    <p>
                      <strong style="color: black; font-weight: bold; font-family: 'Poppins', sans-serif">Area:</strong>
                      <span style="font-family: 'Poppins', sans-serif;">\${activation.areaOfOperation || 'N/A'}</span>
                    </p>
                    <p>
                      <strong style="color: black; font-weight: bold; font-family: 'Poppins', sans-serif">Calamity:</strong>
                      <span style="font-family: 'Poppins', sans-serif;">\${activation.calamityType || 'N/A'}\${activation.typhoonName ? \` (\${activation.typhoonName})\` : ''}</span>
                    </p>
                    <p>
                      <strong style="color: black; font-weight: bold; font-family: 'Poppins', sans-serif">Status:</strong>
                      <span style="color: #388E3C; font-weight: bold; font-family: 'Poppins', sans-serif;">Active</span>
                    </p>
                  </div>
                \`;

                marker.on('click', () => {
                  if (singlePopup && singlePopup._source !== marker) {
                    singlePopup.remove();
                  }
                  singlePopup = L.popup().setContent(content).setLatLng(marker.getLatLng()).openOn(map);
                  console.log(\`Popup opened for \${activation.organization || 'Unknown Organization'}\`);
                });
              });
          }

          function clearNonActivationMarkers() {
            nonActivationMarkers.forEach(marker => {
              try {
                marker.remove();
              } catch (err) {
                console.warn("Error removing non-activation marker:", err.message);
              }
            });
            nonActivationMarkers = [];
          }

          window.addEventListener('message', function(event) {
            try {
              const data = JSON.parse(event.data);
              if (data.action === 'updateLocation') {
                const userLocation = L.latLng(data.latitude, data.longitude);
                map.setView(userLocation, 16);
                if (window.clearNonActivationMarkers) {
                  clearNonActivationMarkers();
                }
                const userMarker = L.marker(userLocation, {
                  title: "Your Location",
                  icon: L.icon({
                    iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
                    iconSize: [25, 41],
                    iconAnchor: [12, 41],
                    popupAnchor: [1, -34],
                    shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
                    shadowSize: [41, 41],
                  }),
                }).addTo(map);
                nonActivationMarkers.push(userMarker);
                userMarker.bindPopup(data.formattedAddress || \`Lat: \${data.latitude}, Lng: \${data.longitude}\`).openPopup();
              } else if (data.action === 'requestUserLocation') {
                window.ReactNativeWebView.postMessage(JSON.stringify({ action: 'requestUserLocation' }));
              } else if (data.action === 'toggleWeather') {
                if (window.weatherMarker) {
                  window.weatherMarker[${showWeather ? 'remove' : 'addTo'}](map);
                }
              } else if (data.action === 'selectSuggestion') {
                setTimeout(() => {
                  loadWeather(data.latitude, data.longitude, false);
                }, 0);
              }
            } catch (error) {
              console.error('Message parsing error:', error);
            }
          });

          window.initMap = initMap;
          window.clearNonActivationMarkers = clearNonActivationMarkers;
          initMap();
        </script>
      </body>
      </html>
    `
      : null;

  const getUserName = () => {
    if (!user) return 'Unknown User';
    if (contactPerson) {
      return contactPerson;
    }
    if (firstName || lastName) {
      return `${firstName || ''} ${lastName || ''}`.trim();
    }
    return 'Unknown User';
  };

  useEffect(() => {
    const fetchUserData = async (retryCount = 0, maxRetries = 2) => {
      setIsLoading(true);
      let currentUser = user;

      if (!currentUser?.id) {
        try {
          const cachedUser = await AsyncStorage.getItem('user_session');
          if (cachedUser) {
            console.log('fetchUserData: No user in AuthContext, using cached user:', JSON.parse(cachedUser).id);
            currentUser = JSON.parse(cachedUser);
          } else {
            console.warn('fetchUserData: No user ID or cached user available');
            setErrorModal({
              visible: true,
              message: 'Please log in to continue.',
            });
            setContactPerson(null);
            setFirstName(null);
            setLastName(null);
            setIsLoading(false);
            setTimeout(() => {
              navigation.navigate('Login');
            }, 3000);
            return;
          }
        } catch (error) {
          console.error('fetchUserData: Error loading cached user:', error.message);
          setErrorModal({
            visible: true,
            message: 'Failed to load user data. Please log in again.',
          });
          setIsLoading(false);
          setTimeout(() => {
            navigation.navigate('Login');
          }, 3000);
          return;
        }
      }

      try {
        const db = getDatabase();
        const userRef = ref(db, `users/${currentUser.id}`);
        const snapshot = await get(userRef);

        if (snapshot.exists()) {
          const userData = snapshot.val();
          setContactPerson(userData.contactPerson || null);
          setFirstName(userData.firstName || null);
          setLastName(userData.lastName || null);
          console.log('fetchUserData: User data fetched:', userData);
        } else {
          console.warn('fetchUserData: No user document found for ID:', currentUser.id);
          setContactPerson(currentUser.contactPerson || null);
          setFirstName(currentUser.firstName || null);
          setLastName(currentUser.lastName || null);
          setErrorModal({
            visible: true,
            message: 'No user profile found in database. Using cached data.',
          });
        }
      } catch (error) {
        console.error('fetchUserData: Error fetching user data:', error.message, error.code);
        if (retryCount < maxRetries && error.code === 'unavailable') {
          console.log(`fetchUserData: Retrying fetch (${retryCount + 1}/${maxRetries})...`);
          setTimeout(() => fetchUserData(retryCount + 1, maxRetries), 1000);
        } else {
          setContactPerson(currentUser.contactPerson || null);
          setFirstName(currentUser.firstName || null);
          setLastName(currentUser.lastName || null);
        }
      } finally {
        setIsLoading(false);
      }
    };

    if (user?.id || !user) {
      fetchUserData();
    } else {
      setIsLoading(false);
    }
  }, [user]);

  const handleWebViewMessage = async (event) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.action === 'toggleSearch') {
        setSearchBarVisible(data.visible);
      } else if (data.action === 'selectSuggestion') {
        setSearchQuery(data.formattedAddress);
        setSuggestions([]);
      } else if (data.action === 'requestUserLocation') {
        await returnToUserLocation();
      } else if (data.action === 'toggleWeather') {
        toggleWeather();
      }
    } catch (error) {
      console.error('WebView message error:', error);
    }
  };

  return (
    <SafeAreaView style={[GlobalStyles.container, { paddingBottom: insets.bottom }]}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      {permissionStatus === 'granted' && location && mapHtml ? (
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={[styles.subContainer]}
          keyboardVerticalOffset={0}
        >
          <View style={{ flex: 1 }}>
            <WebView
              ref={webViewRef}
              style={styles.map}
              source={{ html: mapHtml }}
              originWhitelist={['*']}
              onError={(syntheticEvent) => {
                const { nativeEvent } = syntheticEvent;
                console.error('WebView error:', nativeEvent);
                ToastAndroid.show('Failed to load the map. Please check your internet connection.', ToastAndroid.SHORT);

              }}
              onMessage={handleWebViewMessage}
            />
            <View blurAmount={20} tint="light" style={styles.headerContainer}>
              <LinearGradient
                colors={['rgba(185, 185, 185, 0.12)', 'rgba(77, 77, 77, 0.2)']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.formCard}
              >
                <View style={styles.headerContent}>
                  <TouchableOpacity
                    onPress={() => navigation.openDrawer()}
                    style={styles.headerMenuIcon}
                  >
                    <Ionicons name="menu" size={32} color={Theme.colors.white} />
                  </TouchableOpacity>
                  <View style={styles.headerUserContainer}>
                    <Text style={styles.userName}>{getUserName()}</Text>
                    <ImageBackground
                      source={{ uri: 'https://via.placeholder.com/35' }}
                       style={{ width: 35, height: 35 }}
                       imageStyle={{ borderRadius: 25 }}
                       />
                  </View>
                </View>
              </LinearGradient>
            </View>
            <View style={[styles.mapTypeButtonsContainer, { paddingBottom: insets.bottom }]}>
                          <TouchableOpacity
                            style={[styles.mapTypeButton, mapType === 'roadmap' && styles.mapTypeButtonActive]}
                            onPress={() => toggleMapType('roadmap')}
                          >
                            <MaterialIcons
                              name="map"
                              size={24}
                              color={mapType === 'roadmap' ? Theme.colors.primary : '#FFFFFF'}
                            />
                            <Text
                              style={[
                                styles.mapTypeButtonText,
                                mapType === 'roadmap' && styles.mapTypeButtonTextActive,
                              ]}
                            >
                              Map
                            </Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={[styles.mapTypeButton, mapType === 'satellite' && styles.mapTypeButtonActive]}
                            onPress={() => toggleMapType('satellite')}
                          >
                            <MaterialIcons
                              name="satellite"
                              size={24}
                              color={mapType === 'satellite' ? Theme.colors.primary : '#FFFFFF'}
                            />
                            <Text
                              style={[
                                styles.mapTypeButtonText,
                                mapType === 'satellite' && styles.mapTypeButtonTextActive,
                              ]}
                            >
                              Satellite
                            </Text>
                          </TouchableOpacity>
                        </View>
          </View>
        </KeyboardAvoidingView>
      ) : (
        <SafeAreaView style={[GlobalStyles.container, { paddingBottom: insets.bottom }]}>
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
              <View style={styles.headerUserContainer}>
                <Text style={[styles.userName, { color: Theme.colors.primary, marginLeft: 70 }]}>{getUserName()}</Text>
              </View>
            </View>
          </LinearGradient>
          <View style={{ paddingHorizontal: 20, marginTop: 100 }}>
            {permissionStatus === 'denied' && (
              <View style={styles.permissionDeniedContainer}>
                <MaterialIcons
                  name="location-off"
                  size={48}
                  style={{ color: '#EE5757', marginBottom: 10 }}
                />
                <Text style={styles.permissionDeniedContainerHeader}>Location Access Denied</Text>
                <Text style={styles.permissionDeniedContainerText}>
                  Please enable location access in Dashboard to view the map and experience our services.
                </Text>
                <TouchableOpacity style={styles.retryButton} onPress={handleRetryPermission}>
                  <Text style={styles.retryButtonText}>Allow Location Access</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </SafeAreaView>
      )}
      <Modal
        animationType="none"
        transparent={true}
        visible={errorModal.visible}
        onRequestClose={() => setErrorModal({ visible: false, message: '' })}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <MaterialIcons name="error" size={84} style={{ color: '#EE5757' }} />
            <Text style={styles.permissionDeniedHeader}>Error</Text>
            <Text style={styles.permissionDeniedText}>{errorModal.message}</Text>
            <TouchableOpacity
              style={styles.retryButton}
              onPress={() => {
                setErrorModal({ visible: false, message: '' });
                if (errorModal.message.includes('log in')) {
                  navigation.navigate('Login');
                }
              }}
            >
              <Text style={styles.retryButtonText}>OK</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

export default HomeScreen;