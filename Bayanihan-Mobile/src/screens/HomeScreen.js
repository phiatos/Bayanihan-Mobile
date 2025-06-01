import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import * as Font from 'expo-font';
import * as Location from 'expo-location';
import React, { useContext, useEffect, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  Dimensions,
  FlatList,
  ImageBackground,
  Modal,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Feather from 'react-native-vector-icons/Feather';
import WebView from 'react-native-webview';
import Theme from '../constants/theme';
import { AuthContext } from '../context/AuthContext';
import GlobalStyles from '../styles/GlobalStyles';

const { height, width } = Dimensions.get('window');

const HomeScreen = ({ navigation }) => {
  const [fontsLoaded, setFontsLoaded] = useState(false);
  const [location, setLocation] = useState(null);
  const [permissionStatus, setPermissionStatus] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [searchBarVisible, setSearchBarVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [activations, setActivations] = useState([]);
  const [mapType, setMapType] = useState('hybrid');
  const slideAnim = useRef(new Animated.Value(height)).current;
  const searchAnim = useRef(new Animated.Value(0)).current;
  const { user } = useContext(AuthContext);
  const webViewRef = useRef(null);
  const searchTimeout = useRef(null);

  useEffect(() => {
    (async () => {
      try {
        await Font.loadAsync({
          'Poppins-MediumItalic': require('../../assets/fonts/Poppins/Poppins-MediumItalic.ttf'),
          'Poppins-Bold': require('../../assets/fonts/Poppins/Poppins-Bold.ttf'),
          'Poppins-Medium': require('../../assets/fonts/Poppins/Poppins-Medium.ttf'),
          'Poppins-SemiBold': require('../../assets/fonts/Poppins/Poppins-SemiBold.ttf'),
        });
        setFontsLoaded(true);
        setModalVisible(true);
      } catch (error) {
        console.error('Font loading error:', error);
        Alert.alert('Error', 'Failed to load fonts. Please restart the app.');
      }
    })();
  }, []);

  useEffect(() => {
    if (modalVisible) {
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: height,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
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
        )}&components=country:PH&key=AIzaSyBDtlY28p-MvLHRtxnjiibSAadSETvM3VU`
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
      Alert.alert('Error', 'Failed to fetch suggestions. Please check your internet connection.');
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
          Alert.alert('Low Accuracy', 'Your location accuracy is low. The pin may not be precise.');
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
      Alert.alert('Error', 'Failed to request location permission. Please try again.');
    }
  };

  const handleRetryPermission = async () => {
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
        setModalVisible(false);
      } else {
        setPermissionStatus('denied');
        setModalVisible(false);
      }
    } catch (error) {
      console.error('Permission retry error:', error);
      Alert.alert('Error', 'Failed to retry permission. Please try again.');
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
      Alert.alert('Error', 'Please enter a location to search.');
      return;
    }

    try {
      let location, placeName, formattedAddress;

      if (placeId) {
        const response = await fetch(
          `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&key=AIzaSyBDtlY28p-MvLHRtxnjiibSAadSETvM3VU`
        );
        const data = await response.json();
        if (data.status === 'OK' && data.result) {
          location = data.result.geometry.location;
          placeName = data.result.name;
          formattedAddress = data.result.formatted_address;
        } else {
          Alert.alert('Error', 'No results found for the selected location.');
          console.warn('Place Details API failed:', data.status);
          return;
        }
      } else {
        const response = await fetch(
          `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(
            query
          )}&components=country:PH&key=AIzaSyBDtlY28p-MvLHRtxnjiibSAadSETvM3VU`
        );
        const data = await response.json();
        if (data.status === 'OK' && data.results && data.results.length > 0) {
          const place = data.results[0];
          location = place.geometry.location;
          placeName = place.name;
          formattedAddress = place.formatted_address;
        } else {
          Alert.alert('Error', 'No results found for the search query.');
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
      Alert.alert('Error', 'Failed to search for the location. Please check your internet connection and try again.');
    }
  };

  const handleSuggestionSelect = (suggestion) => {
    setSearchQuery(suggestion.description);
    handleSearch(suggestion.place_id);
  };

  const returnToUserLocation = async () => {
    if (permissionStatus !== 'granted') {
      Alert.alert('Error', 'Please enable location access to return to your current location.');
      return;
    }

    try {
      let loc = await Location.getCurrentPositionAsync({});
      if (loc.coords.accuracy > 50) {
        Alert.alert('Low Accuracy', 'Your location accuracy is low. The pin may not be precise.');
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
      Alert.alert('Error', 'Failed to return to your location. Please try again.');
    }
  };

  if (!fontsLoaded) {
    return null;
  }

  const mapHtml = permissionStatus === 'granted' && location?.latitude && location?.longitude
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
        <script src="https://www.gstatic.com/firebasejs/9.22.0/firebase-auth-compat.js"></script>
        <script src="https://www.gstatic.com/firebasejs/9.22.0/firebase-database-compat.js"></script>
        <script src="https://maps.googleapis.com/maps/api/js?key=AIzaSyBDtlY28p-MvLHRtxnjiibSAadSETvM3VU&libraries=places"></script>
      </head>
      <body>
        <div id="map"></div>
        <script>
          const firebaseConfig = {
            apiKey: "AIzaSyDJxMv8GCaMvQT2QBW3CdzA3dV5X_T2KqQ",
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
                streetViewControl: true,
                zoomControl: false,
                fullscreenControl: false,
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
                console.error("Error fetching activations for map:", error);
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
                }
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

  return (
    <View style={styles.container}>
      <View style={GlobalStyles.headerContainer}>
        <TouchableOpacity onPress={() => navigation.openDrawer()} style={GlobalStyles.headerMenuIcon}>
          <Ionicons name="menu" size={32} color="white" />
        </TouchableOpacity>
        <View style={styles.userInfoContainer}>
          <Text style={styles.userName}>{user?.contactPerson}</Text>
          <ImageBackground
            source={{ uri: 'https://via.placeholder.com/35' }}
            style={{ width: 35, height: 35 }}
            imageStyle={{ borderRadius: 25 }}
          />
        </View>
      </View>

      <SafeAreaView style={{ flex: 1, backgroundColor: '#FFF9F0' }}>
        {permissionStatus === 'granted' && location && mapHtml ? (
          <View style={styles.fullScreenContainer}>
            <WebView
              ref={webViewRef}
              style={styles.map}
              source={{ html: mapHtml }}
              originWhitelist={['*']}
              onError={(syntheticEvent) => {
                const { nativeEvent } = syntheticEvent;
                console.error('WebView error:', nativeEvent);
                Alert.alert('Map Error', 'Failed to load the map. Please check your API key and internet connection.');
              }}
              onMessage={(event) => {
                console.log('WebView message:', event.nativeEvent.data);
              }}
            />
            <View style={styles.overlayContainer}>
              <View style={styles.searchWrapper}>
                <Animated.View
                  style={[
                    styles.searchContainer,
                    {
                      width: searchBarVisible ? '100%' : 40,
                      borderRadius: searchAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [20, 20],
                      }),
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
                          color: 'black',
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
                        style={{ flex: 1, fontFamily: 'Poppins-Medium' }}
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
              <TouchableOpacity style={styles.returnButton} onPress={returnToUserLocation}>
                <MaterialIcons name="my-location" size={24} color="white" />
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <ScrollView contentContainerStyle={{ padding: 0 }}>
            <View style={{ paddingHorizontal: 20, paddingTop: 30 }}>
              <View style={styles.searchContainer}>
                <Feather name="search" size={20} style={{ marginHorizontal: 10 }} />
                <TextInput
                  placeholder="Search"
                  style={{ flex: 1, fontFamily: 'Poppins-Medium' }}
                  placeholderTextColor="black"
                />
              </View>
              {permissionStatus === 'denied' && (
                <View style={styles.permissionDeniedContainer}>
                  <MaterialIcons name="location-off" size={48} style={{ color: '#EE5757', marginBottom: 10 }} />
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
          </ScrollView>
        )}

        <Modal
          animationType="none"
          transparent={true}
          visible={modalVisible}
          onRequestClose={closeModal}
        >
          <SafeAreaView style={{ flex: 1, margin: 0 }}>
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
          </SafeAreaView>
        </Modal>
      </SafeAreaView>
    </View>
  );
};

const spacing = {
  xsmall: 5,
  small: 10,
  medium: 15,
  large: 20,
  xlarge: 30,
};

const borderRadius = {
  small: 4,
  medium: 8,
  large: 10,
  xlarge: 20,
};

const borderWidth = {
  thin: 1,
  medium: 2,
  thick: 3,
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.colors.lightBg,
  },
  fullScreenContainer: {
    flex: 1,
    position: 'relative',
  },
  map: {
    flex: 1,
    width: width,
    height: height,
  },
  overlayContainer: {
    position: 'absolute',
    top: 10,
    left: 20,
    right: 20,
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
    userInfoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    position: 'absolute',
    top: 60,
    right: -30,
    textAlign:'right'
    },
  userName: {
    fontSize: 11,
    fontFamily: 'Poppins-Medium',
    marginRight: 10,
    marginTop: 10,
    color: 'white',
  },
  searchWrapper: {
    position: 'relative',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderColor: 'transparent',
    elevation: 10,
    backgroundColor: 'rgb(252, 252, 252)',
    borderWidth: 1,
    marginBottom: 20,
    borderRadius: 20,
  },
  searchIcon: {
    padding: 10,
  },
  suggestionsContainer: {
    position: 'absolute',
    top: 50,
    left: 0,
    right: 0,
    backgroundColor: 'white',
    borderRadius: 10,
    elevation: 5,
    maxHeight: 200,
    zIndex: 1000,
  },
  suggestionItem: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  suggestionText: {
    fontFamily: 'Poppins-Medium',
    fontSize: 14,
    color: 'black',
  },
  mapTypeButtonsContainer: {
    position: 'absolute',
    top: 570,
    right: 50,
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 2000,
  },
  mapTypeButton: {
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginHorizontal: 5,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  mapTypeButtonActive: {
    backgroundColor: '#FFFFFF',
    borderColor: Theme.colors.primary,
  },
  mapTypeButtonText: {
    fontFamily: 'Poppins-Medium',
    fontSize: 14,
    color: '#FFFFFF',
    marginLeft: 6,
  },
  mapTypeButtonTextActive: {
    color: Theme.colors.primary,
  },
  returnButton: {
    position: 'absolute',
    bottom: 20,
    right: 10,
    backgroundColor: Theme.colors.primary,
    padding: 10,
    borderRadius: 50,
    elevation: 10,
    zIndex: 1000,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    alignItems: 'center',
    width: '100%',
    elevation: 20,
  },
  permissionDeniedHeader: {
    fontFamily: 'Poppins-Bold',
    fontSize: 20,
    color: Theme.colors.primary,
    textAlign: 'center',
    marginBottom: 10,
  },
  permissionDeniedText: {
    fontFamily: 'Poppins',
    color: '#333333',
    textAlign: 'center',
    marginBottom: 20,
  },
  permissionButtons: {
    flexDirection: 'column',
    width: '100%',
  },
  permissionDeniedContainer: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    alignItems: 'center',
    elevation: 5,
    marginTop: 20,
  },
  permissionDeniedContainerHeader: {
    fontFamily: 'Poppins-Bold',
    fontSize: 18,
    color: Theme.colors.primary,
    textAlign: 'center',
    marginBottom: 10,
  },
  permissionDeniedContainerText: {
    fontFamily: 'Poppins-Medium',
    fontSize: 14,
    color: '#333333',
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    paddingVertical: 10,
    paddingHorizontal: 30,
    borderRadius: 40,
    borderWidth: 1,
    borderColor: 'white',
    backgroundColor: Theme.colors.primary,
    width: '100%',
    marginBottom: 10,
  },
  retryButtonText: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 14,
    color: '#FFFFFF',
    textAlign: 'center',
  },
  closeButton: {
    paddingVertical: 10,
    paddingHorizontal: 30,
    borderRadius: 40,
    borderWidth: 1,
    borderColor: Theme.colors.primary,
    backgroundColor: 'transparent',
  },
  closeButtonText: {
    fontFamily: 'Poppins-Medium',
    fontSize: 14,
    color: Theme.colors.primary,
    textAlign: 'center',
  },
});

export default HomeScreen;