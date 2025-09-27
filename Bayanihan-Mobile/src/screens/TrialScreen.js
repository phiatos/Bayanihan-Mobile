import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import React, { useContext, useEffect, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  FlatList,
  ImageBackground,
  SafeAreaView,
  Text,
  TextInput,
  ToastAndroid,
  TouchableOpacity,
  View,
  StatusBar,
  Keyboard,
  Platform,
  Modal
} from 'react-native';
import Feather from 'react-native-vector-icons/Feather';
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

const { height, width } = Dimensions.get('window');

const HomeScreen = ({ navigation }) => {
  const [location, setLocation] = useState(null);
  const [permissionStatus, setPermissionStatus] = useState(null);
  const [searchBarVisible, setSearchBarVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [mapType, setMapType] = useState('osm'); // 'osm' or 'satellite'
  const [isKeyboardVisible, setKeyboardVisible] = useState(false);
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

  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener('keyboardDidShow', () => {
      setKeyboardVisible(true);
    });
    const keyboardDidHideListener = Keyboard.addListener('keyboardDidHide', () => {
      setKeyboardVisible(false);
    });

    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, []);

  useEffect(() => {
    const checkPermissionStatus = async () => {
      try {
        const hasShownModal = await AsyncStorage.getItem('hasShownLocationModal');
        const { status } = await Location.getForegroundPermissionsAsync();
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
        } else if (hasShownModal === 'true' && status !== 'granted') {
          setPermissionStatus('denied');
          navigation.navigate('Dashboard');
          ToastAndroid.show('Location access is required to view the map.', ToastAndroid.BOTTOM);
        }
      } catch (error) {
        console.error('Permission check error:', error);
        setPermissionStatus('denied');
        navigation.navigate('Dashboard');
        ToastAndroid.show('Failed to check location permission. Please enable it in Dashboard.', ToastAndroid.BOTTOM);
      }
    };
    checkPermissionStatus();
  }, [navigation]);

  useEffect(() => {
    Animated.timing(searchAnim, {
      toValue: searchBarVisible ? 1 : 0,
      duration: 200,
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
        const tileLayer = "${type}" === "osm" ? 
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

  const fetchSuggestions = async (query) => {
    if (!query.trim()) {
      setSuggestions([]);
      return;
    }

    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          query
        )}&countrycodes=PH&limit=5`,
        {
          headers: {
            'User-Agent': 'BayanihanApp/1.0 (your.email@example.com)',
          },
        }
      );
      const data = await response.json();
      if (data && Array.isArray(data)) {
        setSuggestions(data);
      } else {
        setSuggestions([]);
        console.warn('Nominatim API returned no results');
      }
    } catch (error) {
      console.error('Autocomplete Error:', error);
      ToastAndroid.show('Failed to fetch suggestions. Please check your internet connection.', ToastAndroid.SHORT);
    }
  };

  const handleSearchInput = (text) => {
    setSearchQuery(text);
    if (searchTimeout.current) {
      clearTimeout(searchTimeout.current);
    }
    searchTimeout.current = setTimeout(() => {
      fetchSuggestions(text);
    }, 300);
  };

  const handleRetryPermission = async () => {
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
        await AsyncStorage.setItem('hasShownLocationModal', 'true');
      } else {
        setPermissionStatus('denied');
        navigation.navigate('Dashboard');
        ToastAndroid.show('Location access is required to view the map.', ToastAndroid.BOTTOM);
      }
    } catch (error) {
      console.error('Permission retry error:', error);
      ToastAndroid.show('Failed to retry permission. Please try again in Dashboard.', ToastAndroid.BOTTOM);
      navigation.navigate('Dashboard');
    }
  };

  const toggleSearchBar = () => {
    setSearchBarVisible(!searchBarVisible);
    if (searchBarVisible) {
      setSearchQuery('');
      setSuggestions([]);
    }
  };

  const handleSearch = async (placeId = null, query = searchQuery) => {
    if (!query.trim() && !placeId) {
      ToastAndroid.show('Please enter a location to search.', ToastAndroid.SHORT);
      return;
    }

    try {
      let location, placeName, formattedAddress;

      if (placeId) {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/details?place_id=${placeId}&format=json&countrycodes=PH`,
          {
            headers: {
              'User-Agent': 'BayanihanApp/1.0 (your.email@example.com)',
            },
          }
        );
        const data = await response.json();
        if (data && data.geometry) {
          location = { lat: parseFloat(data.lat), lng: parseFloat(data.lon) };
          placeName = data.display_name || data.name;
          formattedAddress = data.display_name;
        } else {
          ToastAndroid.show('No results found for the selected location.', ToastAndroid.BOTTOM);
          console.warn('Nominatim Details API failed');
          return;
        }
      } else {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
            query
          )}&countrycodes=PH&limit=1`,
          {
            headers: {
              'User-Agent': 'BayanihanApp/1.0 (your.email@example.com)',
            },
          }
        );
        const data = await response.json();
        if (data && data.length > 0) {
          const place = data[0];
          location = { lat: parseFloat(place.lat), lng: parseFloat(place.lon) };
          placeName = place.display_name;
          formattedAddress = place.display_name;
        } else {
          ToastAndroid.show('No results found for the search query.', ToastAndroid.BOTTOM);
          console.warn('Nominatim Search API failed');
          return;
        }
      }

      const script = `
        if (window.map) {
          const location = L.latLng(${location.lat}, ${location.lng});
          map.setView(location, 16);
          if (window.clearNonActivationMarkers) {
            clearNonActivationMarkers();
          }
          const marker = L.marker(location, {
            title: "${placeName.replace(/"/g, '\\"')}",
          }).addTo(map);
          nonActivationMarkers.push(marker);
          marker.bindPopup(\`<strong>${placeName.replace(/"/g, '\\"')}</strong><br>${formattedAddress.replace(/"/g, '\\"')}\`).openPopup();
        } else {
          console.error("Map not initialized");
        }
      `;
      webViewRef.current?.injectJavaScript(script);
      setSuggestions([]);
    } catch (error) {
      console.error('Search error:', error);
      ToastAndroid.show('Failed to search for the location. Please check your internet connection and try again.', ToastAndroid.BOTTOM);
    }
  };

  const handleSuggestionSelect = (suggestion) => {
    setSearchQuery(suggestion.display_name);
    handleSearch(suggestion.place_id);
  };

  const returnToUserLocation = async () => {
    if (permissionStatus !== 'granted') {
      ToastAndroid.show('Please enable location access in Dashboard to return to your current location.', ToastAndroid.BOTTOM);
      navigation.navigate('Dashboard');
      return;
    }

    try {
      let loc = await Location.getCurrentPositionAsync({});
      if (loc.coords.accuracy > 50) {
        ToastAndroid.show('Your location accuracy is low. The pin may not be precise.', ToastAndroid.BOTTOM);
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
      ToastAndroid.show('Failed to return to your location. Please try again.', ToastAndroid.BOTTOM);
    }
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
        <link rel="preconnect" href="https://fonts.googleapis.com">
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
        <link href="https://fonts.googleapis.com/css2?family=Poppins:ital,wght@0,100;0,200;0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,100;1,200;1,300;1,400;1,500;1,600;1,700;1,800;1,900&display=swap" rel="stylesheet">
      
        <style>
          #map { height: 100%; width: 100%; }
          html, body { height: 100%; margin: 0; padding: 0; }
          .leaflet-control { display: none !important; }
          .bayanihan-infowindow {
            font-family: 'Arial', sans-serif;
            color: #333;
            padding: 15px;
            background: #FFFFFF;
            border-radius: 10px;
            box-shadow: 0 4px 8px rgba(0,0,0,0.2);
            max-width: 300px;
            border-top: 5px solid #FF69B4;
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
          }
          @keyframes slideIn {
            0% { transform: translateY(10px); opacity: 0; }
            100% { transform: translateY(0); opacity: 1; }
          }
        </style>
        <script src="https://www.gstatic.com/firebasejs/9.22.0/firebase-app-compat.js"></script>
        <script src="https://www.gstatic.com/firebasejs/9.22.0/firebase-database-compat.js"></script>
        <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
      </head>
      <body>
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

          let map;
          let activationMarkers = [];
          let nonActivationMarkers = [];
          let singlePopup;

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

              const tileLayer = "${mapType}" === "osm" ?
                L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                  attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                }) :
                L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
                  attribution: '&copy; <a href="https://www.esri.com/">Esri</a>'
                });
              tileLayer.addTo(map);

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

              const activationsRef = database.ref("activations/currentActivations").orderByChild("status").equalTo("active");
              activationsRef.on("value", (snapshot) => {
                activationMarkers.forEach(marker => marker.remove());
                activationMarkers = [];

                const activations = snapshot.val();
                if (!activations) {
                  console.log("No active activations found in Firebase.");
                  return;
                }

                console.log("Active activations:", activations);

                Object.entries(activations).forEach(([key, activation]) => {
                  if (!activation.latitude || !activation.longitude) {
                    console.warn(\`Activation \${key} is missing latitude or longitude:\`, activation);
                    return;
                  }

                  const position = L.latLng(parseFloat(activation.latitude), parseFloat(activation.longitude));
                  console.log(\`Creating marker for \${activation.organization} at position:\`, position);

                  const logoPath = "https://firebasestorage.googleapis.com/v0/b/bayanihan-5ce7e.appspot.com/o/AB_logo.png?alt=media";
                  console.log("Attempting to load logo for Popup from:", logoPath);

                  const marker = L.marker(position, {
                    title: activation.organization,
                    icon: L.icon({
                      iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x-red.png",
                      iconSize: [25, 41],
                      iconAnchor: [12, 41],
                      popupAnchor: [1, -34],
                      shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
                      shadowSize: [41, 41],
                    }),
                  }).addTo(map);

                  activationMarkers.push(marker);
                  console.log(\`Marker created for \${activation.organization}\`);

                  const img = new Image();
                  img.src = logoPath;
                  img.onload = () => {
                    console.log("Logo loaded successfully for Popup:", logoPath);
                    createPopup(marker, activation, logoPath);
                  };
                  img.onerror = () => {
                    console.error("Failed to load logo for Popup:", logoPath);
                    createPopup(marker, activation, null);
                  };
                });
              }, (error) => {
                console.error("Firebase error:", error);
              });

              map.on('click', (e) => {
                clearNonActivationMarkers();
                const marker = L.marker(e.latlng, {
                  title: "Pinned Location",
                }).addTo(map);
                nonActivationMarkers.push(marker);

                fetch('https://nominatim.openstreetmap.org/reverse?format=json&lat=' + e.latlng.lat + '&lon=' + e.latlng.lng, {
                  headers: {
                    'User-Agent': 'BayanihanApp/1.0 (your.email@example.com)',
                  },
                })
                  .then(response => response.json())
                  .then(data => {
                    const infoContent = data.display_name || \`Lat: \${e.latlng.lat}, Lng: \${e.latlng.lng}\`;
                    marker.bindPopup(infoContent).openPopup();
                  })
                  .catch(error => {
                    console.error("Reverse geocoding error:", error);
                    marker.bindPopup(\`Lat: \${e.latlng.lat}, Lng: \${e.latlng.lng}\`).openPopup();
                  });

                map.setView(e.latlng, 16);
              });
            } catch (error) {
              console.error("Map initialization error:", error);
            }
          }

          function createPopup(marker, activation, logoUrl) {
            const content = \`
              <div class="bayanihan-infowindow">
                <h3 style="color: black; font-family: 'Poppins', sans-serif;">
                  \${logoUrl ? 
                    \`<img src="\${logoUrl}" alt="Bayanihan Logo" style="width: 24px; height: 24px;" />\` : 
                    \`<span style="font-size: 24px;">🌟</span>\`
                  }
                  \${activation.organization}
                </h3>
                <p>
                  <strong style="color: black; font-weight: bold; font-family: 'Poppins', sans-serif">Area:</strong>
                  <span style="font-family: 'Poppins', sans-serif;">\${activation.areaOfOperation}</span>
                </p>
                <p>
                  <strong style="color: black; font-weight: bold; font-family: 'Poppins', sans-serif">Calamity:</strong>
                  <span style="font-family: 'Poppins', sans-serif;">\${activation.calamityType}\${activation.typhoonName ? \` (\${activation.typhoonName})\` : ''}</span>
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
              console.log(\`Popup opened for \${activation.organization}\`);
            });
          }

          function clearNonActivationMarkers() {
            nonActivationMarkers.forEach(marker => marker.remove());
            nonActivationMarkers = [];
          }

          window.initMap = initMap;
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
               率先
                const { nativeEvent } = syntheticEvent;
                console.error('WebView error:', nativeEvent);
                ToastAndroid.show('Failed to load the map. Please check your internet connection.', ToastAndroid.BOTTOM);
              }}
              onMessage={(event) => {
                console.log('WebView message:', event.nativeEvent.data);
              }}
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
                    onPress={toggleSearchBar}
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
                        placeholder="Search"
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
                        <Text style={styles.suggestionText}>{item.display_name}</Text>
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
            <View style={[styles.mapTypeButtonsContainer, { paddingBottom: insets.bottom }]}>
              <TouchableOpacity
                style={[styles.mapTypeButton, mapType === 'osm' && styles.mapTypeButtonActive]}
                onPress={() => toggleMapType('osm')}
              >
                <MaterialIcons
                  name="map"
                  size={24}
                  color={mapType === 'osm' ? Theme.colors.primary : '#FFFFFF'}
                />
                <Text
                  style={[
                    styles.mapTypeButtonText,
                    mapType === 'osm' && styles.mapTypeButtonTextActive,
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
