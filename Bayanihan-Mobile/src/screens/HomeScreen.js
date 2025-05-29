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

const { height, width } = Dimensions.get('window');

const HomeScreen = ({ navigation }) => {
  const [fontsLoaded, setFontsLoaded] = useState(false);
  const [location, setLocation] = useState(null);
  const [permissionStatus, setPermissionStatus] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [searchBarVisible, setSearchBarVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const slideAnim = useRef(new Animated.Value(height)).current;
  const searchAnim = useRef(new Animated.Value(0)).current;
  const { user } = useContext(AuthContext);
  const webViewRef = useRef(null);
  const searchTimeout = useRef(null);

  useEffect(() => {
    (async () => {
      await Font.loadAsync({
        'Poppins-MediumItalic': require('../../assets/fonts/Poppins/Poppins-MediumItalic.ttf'),
        'Poppins-Bold': require('../../assets/fonts/Poppins/Poppins-Bold.ttf'),
        'Poppins-Medium': require('../../assets/fonts/Poppins/Poppins-Medium.ttf'),
        'Poppins-SemiBold': require('../../assets/fonts/Poppins/Poppins-SemiBold.ttf'),
      });
      setFontsLoaded(true);
      setModalVisible(true);
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

  // Fetch autocomplete suggestions restricted to the Philippines
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
      setSuggestions([]);
      Alert.alert('Error', 'Failed to fetch suggestions. Please check your internet connection.');
    }
  };

  // Debounce search input
  const handleSearchInput = (text) => {
    setSearchQuery(text);
    if (searchTimeout.current) {
      clearTimeout(searchTimeout.current);
    }
    searchTimeout.current = setTimeout(() => {
      fetchSuggestions(text);
    }, 300);
  };

  // Handle permission request
  const handleRequestPermission = async () => {
    let { status } = await Location.requestForegroundPermissionsAsync();
    setPermissionStatus(status);
    if (status === 'granted') {
      let loc = await Location.getCurrentPositionAsync({});
      if (loc.coords.accuracy > 50) {
        Alert.alert('Low Accuracy', 'Your location accuracy is low. The pin might not be exact.');
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
  };

  // Handle retry for denied permissions
  const handleRetryPermission = async () => {
    let { status } = await Location.requestForegroundPermissionsAsync();
    setPermissionStatus(status);
    if (status === 'granted') {
      let loc = await Location.getCurrentPositionAsync({});
      if (loc.coords.accuracy > 50) {
        Alert.alert('Low Accuracy', 'Your location accuracy is low. The pin might not be exact.');
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

  // Handle search using Google Places API
  const handleSearch = async (placeId = null, query = searchQuery) => {
    if (!query.trim() && !placeId) {
      Alert.alert('Search Error', 'Please enter a location to search.');
      return;
    }

    try {
      let location, placeName, formattedAddress;

      if (placeId) {
        // Use Place Details API for suggestion selections
        const response = await fetch(
          `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&key=AIzaSyBDtlY28p-MvLHRtxnjiibSAadSETvM3VU`
        );
        const data = await response.json();
        if (data.status === 'OK' && data.result) {
          location = data.result.geometry.location;
          placeName = data.result.name;
          formattedAddress = data.result.formatted_address;
        } else {
          Alert.alert('Search Error', 'No results found for the selected location.');
          console.warn('Place Details API failed:', data.status);
          return;
        }
      } else {
        // Use Text Search API for manual input
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
          Alert.alert('Search Error', 'No results found for the search query.');
          console.warn('Text Search API failed:', data.status);
          return;
        }
      }

      // Inject JavaScript to update the map
      const script = `
        if (window.map) {
          const location = { lat: ${location.lat}, lng: ${location.lng} };
          map.setCenter(location);
          map.setZoom(16);
          if (window.clearMarkers) clearMarkers();
          const marker = new google.maps.Marker({
            position: location,
            map: map,
            title: "${placeName.replace(/"/g, '\\"')}",
          });
          markers.push(marker);
          const infowindow = new google.maps.InfoWindow({
            content: \`<strong>${placeName.replace(/"/g, '\\"')}</strong><br>${formattedAddress.replace(/"/g, '\\"')}\`,
          });
          marker.addListener("click", () => {
            infowindow.open(map, marker);
          });
          infowindow.open(map, marker);
        } else {
          console.error("Map not initialized");
        }
      `;
      webViewRef.current?.injectJavaScript(script);
      setSuggestions([]);
    } catch (error) {
      console.error('Search Error:', error);
      Alert.alert(
        'Search Error',
        'Failed to search for the location. Please check your internet connection and try again.'
      );
    }
  };

  // Handle suggestion selection
  const handleSuggestionSelect = (suggestion) => {
    setSearchQuery(suggestion.description);
    handleSearch(suggestion.place_id);
  };

  // Return to user's current location
  const returnToUserLocation = async () => {
    if (permissionStatus !== 'granted') {
      Alert.alert('Location Permission Denied', 'Please enable location access to return to your current location.');
      return;
    }

    try {
      let loc = await Location.getCurrentPositionAsync({});
      if (loc.coords.accuracy > 50) {
        Alert.alert('Low Accuracy', 'Your location accuracy is low. The pin might not be exact.');
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
          if (window.clearMarkers) clearMarkers();
          const userMarker = new google.maps.Marker({
            position: userLocation,
            map: map,
            title: "Your Location",
            icon: {
              url: "http://maps.google.com/mapfiles/ms/icons/blue-dot.png",
            },
          });
          markers.push(userMarker);
          geocoder.geocode({ location: userLocation }, (results, status) => {
            let infoContent;
            if (status === "OK" && results[0]) {
              infoContent = results[0].formatted_address;
            } else {
              infoContent = \`Lat: ${loc.coords.latitude}, Lng: ${loc.coords.longitude}\`;
            }
            const userInfowindow = new google.maps.InfoWindow({
              content: infoContent,
            });
            userMarker.addListener("click", () => {
              userInfowindow.open(map, userMarker);
            });
            userInfowindow.open(map, userMarker);
          });
        } else {
          console.error("Map not initialized");
        }
      `;
      webViewRef.current?.injectJavaScript(script);
    } catch (error) {
      console.error('Error returning to user location:', error);
      Alert.alert('Error', 'Failed to return to your location. Please try again.');
    }
  };

  if (!fontsLoaded) {
    return null;
  }

  const mapHtml = permissionStatus === 'granted' && location
    ? `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          #map { height: 100%; width: 100%; }
          html, body { height: 100%; margin: 0; padding: 0; }
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
            const userLocation = { lat: ${location.latitude}, lng: ${location.longitude} };
            map = new google.maps.Map(document.getElementById("map"), {
              center: userLocation,
              zoom: 16,
              mapTypeId: "roadmap",
            });

            geocoder = new google.maps.Geocoder();

            const userMarker = new google.maps.Marker({
              position: userLocation,
              map: map,
              title: "Your Location",
              icon: {
                url: "http://maps.google.com/mapfiles/ms/icons/blue-dot.png",
              },
            });
            markers.push(userMarker);

            geocoder.geocode({ location: userLocation }, (results, status) => {
              let infoContent;
              if (status === "OK" && results[0]) {
                infoContent = results[0].formatted_address;
              } else {
                infoContent = \`Lat: ${location.latitude}, Lng: ${location.longitude}\`;
              }

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
                let infoContent;
                if (status === "OK" && results[0]) {
                  infoContent = results[0].formatted_address;
                } else {
                  infoContent = \`Lat: \${event.latLng.lat()}, Lng: \${event.latLng.lng()}\`;
                }
                const infowindow = new google.maps.InfoWindow({
                  content: infoContent,
                });
                marker.addListener("click", () => {
                  infowindow.open(map, marker);
                });
                infowindow.open(map, marker);
              });

              map.setCenter(event.latLng);
              map.setZoom(16);
            });
          }

          function clearMarkers() {
            markers.forEach(marker => marker.setMap(null));
            markers = [];
          }

          window.initMap = initMap;
        </script>
        <script src="https://maps.googleapis.com/maps/api/js?key=AIzaSyBDtlY28p-MvLHRtxnjiibSAadSETvM3VU&callback=initMap" async defer></script>
      </body>
      </html>
    `
    : null;

  return (
    

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
          />
          <View style={styles.overlayContainer}>
            <View style={styles.headerContainer}>
              <TouchableOpacity onPress={() => navigation.openDrawer()}>
                <Ionicons
                  name="menu"
                  size={32}
                  style={{
                    color: 'black',
                    backgroundColor: 'white',
                    padding: 5,
                    borderRadius: 30,
                  }}
                />
              </TouchableOpacity>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Text style={styles.userName}>{user?.contactPerson}</Text>
                <ImageBackground
                  source={require('../../assets/images/user.jpg')}
                  style={{ width: 35, height: 35 }}
                  imageStyle={{ borderRadius: 25 }}
                />
              </View>
            </View>
            <View style={styles.searchWrapper}>
              <Animated.View
                style={[
                  styles.searchContainer,
                  {
                    width: searchBarVisible ? '100%' : 40,
                    borderRadius: searchAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [30, 20],
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
            <TouchableOpacity style={styles.returnButton} onPress={returnToUserLocation}>
              <MaterialIcons name="my-location" size={24} color="white" />
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ padding: 0 }}>
          <View style={{ paddingHorizontal: 20, paddingTop: 30 }}>
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 20,
              }}
            >
              <TouchableOpacity onPress={() => navigation.openDrawer()}>
                <Ionicons name="menu" size={32} style={{ color: Theme.colors.primary }} />
              </TouchableOpacity>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Text
                  style={{
                    fontSize: 11,
                    fontFamily: 'Poppins-Medium',
                    marginRight: 10,
                    marginTop: 10,
                  }}
                >
                  {user?.contactPerson}
                </Text>
                <ImageBackground
                  source={require('../../assets/images/user.jpg')}
                  style={{ width: 35, height: 35 }}
                  imageStyle={{ borderRadius: 25 }}
                />
              </View>
            </View>
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
  );
};

const styles = StyleSheet.create({
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
    top: 30,
    left: 20,
    right: 20,
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  userName: {
    fontSize: 11,
    fontFamily: 'Poppins-Medium',
    marginRight: 10,
    marginTop: 10,
    color: 'black',
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
  returnButton: {
    position: 'absolute',
    bottom: 20,
    right: 0,
    backgroundColor: Theme.colors.primary,
    padding: 10,
    borderRadius: 30,
    elevation: 5,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: Theme.colors.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    alignItems: 'center',
    width: width,
    elevation: 10,
  },
  permissionDeniedHeader: {
    fontFamily: 'Poppins-Bold',
    fontSize: 20,
    color: Theme.colors.primary,
    textAlign: 'center',
    marginBottom: 10,
  },
  permissionDeniedText: {
    fontFamily: 'Poppins-Medium',
    fontSize: 14,
    color: 'black',
    textAlign: 'center',
    marginBottom: 20,
    paddingHorizontal: 20,
  },
  permissionButtons: {
    flexDirection: 'column',
    width: '100%',
    paddingHorizontal: 20,
  },
  permissionDeniedContainer: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    alignItems: 'center',
    elevation: 5,
    marginTop: 10,
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
    color: 'black',
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    paddingVertical: 10,
    paddingHorizontal: 30,
    borderRadius: 40,
    borderWidth: 1,
    borderColor: 'white',
    width: '100%',
    backgroundColor: Theme.colors.primary,
    marginBottom: 10,
  },
  retryButtonText: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 14,
    color: '#FFF',
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