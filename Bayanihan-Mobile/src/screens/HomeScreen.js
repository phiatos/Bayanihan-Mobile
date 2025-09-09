import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import React, { useContext, useEffect, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  FlatList,
  ImageBackground,
  Modal,
  SafeAreaView,
  Text,
  TextInput,
  ToastAndroid,
  TouchableOpacity,
  View,
  StatusBar,
  Keyboard,
  Platform,
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
  const [modalVisible, setModalVisible] = useState(false);
  const [hasShownModal, setHasShownModal] = useState(false);
  const [searchBarVisible, setSearchBarVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [activations, setActivations] = useState([]);
  const [mapType, setMapType] = useState('hybrid');
  const [isKeyboardVisible, setKeyboardVisible] = useState(false);
  const slideAnim = useRef(new Animated.Value(height)).current;
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
    if (!hasShownModal && !permissionStatus) {
      setModalVisible(true);
      setHasShownModal(true);
    }
  }, [hasShownModal, permissionStatus]);

  useEffect(() => {
    Animated.timing(slideAnim, {
      toValue: modalVisible ? 0 : height,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [modalVisible]);

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
        map.setMapTypeId("${type}");
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
        `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(
          query
        )}&components=country:PH&key=AIzaSyAAAu6BeQjIZ7H7beFbAsPWuKuORmh0wrk`
      );
      const data = await response.json();
      if (data.status === 'OK' && data.predictions) {
        setSuggestions(data.predictions);
      } else {
        setSuggestions([]);
        console.warn('Autocomplete API returned no results:', data.status);
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
        setModalVisible(false);
      } else {
        setPermissionStatus('denied');
        setModalVisible(false);
      }
    } catch (error) {
      console.error('Permission error:', error);
      ToastAndroid.show('Failed to request location permission. Please try again.', ToastAndroid.SHORT);
    }
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
        setModalVisible(false);
      } else {
        setPermissionStatus('denied');
        setModalVisible(false);
      }
    } catch (error) {
      console.error('Permission retry error:', error);
      ToastAndroid.show('Failed to retry permission. Please try again.', ToastAndroid.BOTTOM);
    }
  };

  const closeModal = () => {
    setPermissionStatus('denied');
    setModalVisible(false);
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
          `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&key=AIzaSyAAAu6BeQjIZ7H7beFbAsPWuKuORmh0wrk`
        );
        const data = await response.json();
        if (data.status === 'OK' && data.result) {
          location = data.result.geometry.location;
          placeName = data.result.name;
          formattedAddress = data.result.formatted_address;
        } else {
          ToastAndroid.show('No results found for the selected location.', ToastAndroid.BOTTOM);
          console.warn('Place Details API failed:', data.status);
          return;
        }
      } else {
        const response = await fetch(
          `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(
            query
          )}&components=country:PH&key=AIzaSyAAAu6BeQjIZ7H7beFbAsPWuKuORmh0wrk`
        );
        const data = await response.json();
        if (data.status === 'OK' && data.results && data.results.length > 0) {
          const place = data.results[0];
          location = place.geometry.location;
          placeName = place.name;
          formattedAddress = place.formatted_address;
        } else {
          ToastAndroid.show('No results found for the search query.', ToastAndroid.BOTTOM);
          console.warn('Text Search API failed:', data.status);
          return;
        }
      }

      const script = `
        if (window.map) {
          const location = { lat: ${location.lat}, lng: ${location.lng} };
          map.setCenter(location);
          map.setZoom(16);
          if (window.clearNonActivationMarkers) {
            clearNonActivationMarkers();
          }
          const marker = new google.maps.Marker({
            position: location,
            map: map,
            title: "${placeName.replace(/"/g, '\\"')}",
          });
          nonActivationMarkers.push(marker);
          const infoWindow = new google.maps.InfoWindow({
            content: \`<strong>${placeName.replace(/"/g, '\\"')}</strong><br>${formattedAddress.replace(/"/g, '\\"')}\`,
          });
          marker.addListener("click", () => {
            infoWindow.open(map, marker);
          });
          infoWindow.open(map, marker);
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
    setSearchQuery(suggestion.description);
    handleSearch(suggestion.place_id);
  };

  const returnToUserLocation = async () => {
    if (permissionStatus !== 'granted') {
      ToastAndroid.show('Please enable location access to return to your current location.', ToastAndroid.BOTTOM);
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
          const userLocation = { lat: ${loc.coords.latitude}, lng: ${loc.coords.longitude} };
          map.setCenter(userLocation);
          map.setZoom(16);
          if (window.clearNonActivationMarkers) {
            clearNonActivationMarkers();
          }
          const userMarker = new google.maps.Marker({
            position: userLocation,
            map: map,
            title: "Your Location",
            icon: {
              url: "http://maps.google.com/mapfiles/ms/icons/blue-dot.png",
            },
          });
          nonActivationMarkers.push(userMarker);
          if (window.geocoder) {
            geocoder.geocode({ location: userLocation }, (results, status) => {
              let infoContent = status === "OK" && results[0] ? results[0].formatted_address : \`Lat: ${loc.coords.latitude}, Lng: ${loc.coords.longitude}\`;
              const userInfoWindow = new google.maps.InfoWindow({
                content: infoContent,
              });
              userMarker.addListener("click", () => {
                userInfoWindow.open(map, userMarker);
              });
              userInfoWindow.open(map, userMarker);
            });
          } else {
            console.error("Geocoder not initialized");
          }
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
        <style>
          #map { height: 100%; width: 100%; }
          html, body { height: 100%; margin: 0; padding: 0; }
          .gm-fullscreen-control { display: none !important; }
        </style>
        <script src="https://www.gstatic.com/firebasejs/9.22.0/firebase-app-compat.js"></script>
        <script src="https://www.gstatic.com/firebasejs/9.22.0/firebase-database-compat.js"></script>
        <script src="https://maps.googleapis.com/maps/api/js?key=AIzaSyAAAu6BeQjIZ7H7beFbAsPWuKuORmh0wrk&libraries=places"></script>
      </head>
      <body>
        <div id="map"></div>
        <script>
          const firebaseConfig = {
            apiKey: "AIzaSyAAAu6BeQjIZ7H7beFbAsPWuKuORmh0wrk",
            authDomain: "bayanihan-5ce7e.firebaseapp.com",
            databaseURL: "https://bayanihan-5ce7e-default-rtdb.asia-southeast1.firebasedatabase.app",
            projectId: "bayanihan-5ce7e",
            storageBucket: "bayanihan-5ce7e.appspot.com",
            messagingSenderId: "593123849917",
            appId: "1:593123849917:web:eb85a63a536eeff78ce9d4",
            measurementId: "G-ZTQ9VXXVV0",
          };

          firebase.initializeApp(firebaseConfig);
          const database = firebase.database();

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
                let infoContent = status === "OK" && results[0] ? results[0].formatted_address : \`Lat: ${location.latitude}, Lng: ${location.longitude}\`;
                const userInfoWindow = new google.maps.InfoWindow({
                  content: infoContent,
                });
                userMarker.addListener("click", () => {
                  userInfoWindow.open(map, userMarker);
                });
                userInfoWindow.open(map, userMarker);
              });

              const activationsRef = database.ref("activations").orderByChild("status").equalTo("active");
              activationsRef.on("value", (snapshot) => {
                activationMarkers.forEach(marker => marker.setMap(null));
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

                  const position = { lat: parseFloat(activation.latitude), lng: parseFloat(activation.longitude) };
                  console.log(\`Creating marker for \${activation.organization} at position:\`, position);

                  const logoPath = "https://firebasestorage.googleapis.com/v0/b/bayanihan-5ce7e.appspot.com/o/AB_logo.png?alt=media";
                  console.log("Attempting to load logo for InfoWindow from:", logoPath);

                  const marker = new google.maps.Marker({
                    position: position,
                    map: map,
                    title: activation.organization,
                    icon: {
                      url: "https://maps.google.com/mapfiles/ms/icons/red-dot.png",
                    },
                  });

                  activationMarkers.push(marker);
                  console.log(\`Marker created for \${activation.organization}\`);

                  const img = new Image();
                  img.src = logoPath;
                  img.onload = () => {
                    console.log("Logo loaded successfully for InfoWindow:", logoPath);
                    createInfoWindow(marker, activation, logoPath);
                  };
                  img.onerror = () => {
                    console.error("Failed to load logo for InfoWindow:", logoPath);
                    createInfoWindow(marker, activation, null);
                  };
                });
              }, (error) => {
                  return;
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
                  let infoContent = status === "OK" && results[0] ? results[0].formatted_address : \`Lat: \${event.latLng.lat()}, Lng: \${event.latLng.lng()}\`;
                  const infoWindow = new google.maps.InfoWindow({
                    content: infoContent,
                  });
                  marker.addListener("click", () => {
                    infoWindow.open(map, marker);
                  });
                  infoWindow.open(map, marker);
                });

                map.setCenter(event.latLng);
                map.setZoom(16);
              });
            } catch (error) {
              console.error("Map initialization error:", error);
            }
          }

          function createInfoWindow(marker, activation, logoUrl) {
            const content = \`
              <div class="bayanihan-infowindow" style="
                font-family: 'Arial', sans-serif;
                color: #333;
                padding: 15px;
                background: #FFFFFF;
                border-radius: 10px;
                box-shadow: 0 4px 8px rgba(0,0,0,0.2);
                max-width: 300px;
                border-top: 5px solid #FF69B4;
                animation: slideIn 0.3s ease-out;
              ">
                <h3 style="
                  margin: 0 0 10px;
                  color: #007BFF;
                  font-size: 18px;
                  display: flex;
                  align-items: center;
                  gap: 8px;
                ">
                  \${logoUrl ? 
                    \`<img src="\${logoUrl}" alt="Bayanihan Logo" style="width: 24px; height: 24px;" />\` : 
                    \`<span style="font-size: 24px;">🌟</span>\`
                  }
                  \${activation.organization}
                </h3>
                <p style="margin: 5px 0;">
                  <strong style="color: #007BFF;">📍 Location:</strong>
                  <span style="color: #333;">\${activation.areaOfOperation}</span>
                </p>
                <p style="margin: 5px 0;">
                  <strong style="color: #007BFF;">🌍 Calamity:</strong>
                  <span style="color: #333;">\${activation.calamityType}\${activation.typhoonName ? \` (\${activation.typhoonName})\` : ''}</span>
                </p>
                <p style="margin: 5px 0;">
                  <strong style="color: #007BFF;">✅ Status:</strong>
                  <span style="color: #388E3C; font-weight: bold;">Active</span>
                </p>
              </div>
              <style>
                @keyframes slideIn {
                  0% { transform: translateY(10px); opacity: 0; }
                  100% { transform: translateY(0); opacity: 1; }
                </style>
            \`;

            marker.addListener("mousedown", () => {
              if (isInfoWindowClicked) {
                console.log(\`Press ignored for \${activation.organization} because an InfoWindow is already long-pressed open\`);
                return;
              }

              if (currentInfoWindowMarker && currentInfoWindowMarker !== marker) {
                singleInfoWindow.close();
              }

              singleInfoWindow.setContent(content);
              singleInfoWindow.open(map, marker);
              currentInfoWindowMarker = marker;
              console.log(\`InfoWindow opened on press for \${activation.organization}\`);
            });

            marker.addListener("mouseup", () => {
              if (isInfoWindowClicked) {
                console.log(\`Press out ignored for \${activation.organization} because InfoWindow is long-pressed open\`);
                return;
              }

              if (currentInfoWindowMarker === marker) {
                singleInfoWindow.close();
                currentInfoWindowMarker = null;
                console.log(\`InfoWindow closed on press out for \${activation.organization}\`);
              }
            });

            marker.addListener("click", () => {
              if (currentInfoWindowMarker && currentInfoWindowMarker !== marker) {
                singleInfoWindow.close();
              }

              singleInfoWindow.setContent(content);
              singleInfoWindow.open(map, marker);
              currentInfoWindowMarker = marker;
              isInfoWindowClicked = true;
              console.log(\`InfoWindow opened on long press for \${activation.organization}\`);
            });

            singleInfoWindow.addListener("closeclick", () => {
              isInfoWindowClicked = false;
              currentInfoWindowMarker = null;
              console.log(\`InfoWindow closed manually for \${activation.organization}\`);
            });
          }

          function clearNonActivationMarkers() {
            nonActivationMarkers.forEach(marker => marker.setMap(null));
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
        // Try to load cached user from AsyncStorage
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
            // Optionally navigate to login screen after a delay
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
          // Use cached user data as fallback
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
          // Use cached user data as fallback
          setContactPerson(currentUser.contactPerson || null);
          setFirstName(currentUser.firstName || null);
          setLastName(currentUser.lastName || null);
          setErrorModal({
            visible: true,
            message: `Failed to fetch user data: ${error.message}. Using cached data.`,
          });
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
                const { nativeEvent } = syntheticEvent;
                console.error('WebView error:', nativeEvent);
                ToastAndroid.show('Failed to load the map. Please check your API key and internet connection.', ToastAndroid.BOTTOM);
              }}
              onMessage={(event) => {
                console.log('WebView message:', event.nativeEvent.data);
              }}
            />
            {/* Header */}
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
            {/* Other Overlays */}
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
                style={[styles.mapTypeButton, mapType === 'hybrid' && styles.mapTypeButtonActive]}
                onPress={() => toggleMapType('hybrid')}
              >
                <MaterialIcons
                  name="satellite"
                  size={24}
                  color={mapType === 'hybrid' ? Theme.colors.primary : '#FFFFFF'}
                />
                <Text
                  style={[
                    styles.mapTypeButtonText,
                    mapType === 'hybrid' && styles.mapTypeButtonTextActive,
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
                    Please enable location access to view the map and experience our services.
                  </Text>
                  <TouchableOpacity style={styles.retryButton} onPress={handleRetryPermission}>
                    <Text style={styles.retryButtonText}>Enable Location</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </SafeAreaView>
        )}
        <Modal
          animationType="none"
          transparent={true}
          visible={modalVisible}
          onRequestClose={closeModal}
        >
          <View style={styles.modalOverlay}>
            <Animated.View
              style={[
                styles.modalContainer,
                {
                  transform: [{ translateY: slideAnim }],
                },
              ]}
            >
              <MaterialIcons name="location-pin" size={84} style={{ color: '#EE5757' }} />
              <Text style={styles.permissionDeniedHeader}>Where Are You?</Text>
              <Text style={styles.permissionDeniedText}>
                Let Bayanihan access your location to show position on the map.
              </Text>
              <View style={styles.permissionButtons}>
                <TouchableOpacity style={styles.retryButton} onPress={handleRequestPermission}>
                  <Text style={styles.retryButtonText}>Allow Location Access</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.closeButton} onPress={closeModal}>
                  <Text style={styles.closeButtonText}>Not Now</Text>
                </TouchableOpacity>
              </View>
            </Animated.View>
          </View>
        </Modal>
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