import React, { useEffect, useState, useRef, useContext } from 'react';
import * as Font from 'expo-font';
import {
  View,
  Text,
  SafeAreaView,
  ScrollView,
  ImageBackground,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Modal,
  Animated,
} from 'react-native';
import Feather from 'react-native-vector-icons/Feather';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import * as Location from 'expo-location';
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
  const slideAnim = useRef(new Animated.Value(height)).current;
  const searchAnim = useRef(new Animated.Value(0)).current;
  const { user } = useContext(AuthContext);
  

  useEffect(() => {
    (async () => {
      // Load fonts
      await Font.loadAsync({
        'Poppins-MediumItalic': require('../../assets/fonts/Poppins/Poppins-MediumItalic.ttf'),
        'Poppins-Bold': require('../../assets/fonts/Poppins/Poppins-Bold.ttf'),
        'Poppins-Medium': require('../../assets/fonts/Poppins/Poppins-Medium.ttf'),
        'Poppins-SemiBold': require('../../assets/fonts/Poppins/Poppins-SemiBold.ttf'),
      });
      setFontsLoaded(true);
      // Show modal for initial permission request
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
      useNativeDriver: false, // Required for borderRadius animation
    }).start();
  }, [searchBarVisible]);

  // Handle permission request
  const handleRequestPermission = async () => {
    let { status } = await Location.requestForegroundPermissionsAsync();
    setPermissionStatus(status);
    if (status === 'granted') {
      let loc = await Location.getCurrentPositionAsync({});
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
  };

  if (!fontsLoaded) {
    return null;
  }

  // MapTiler HTML content for WebView
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
        <script src="https://cdn.maptiler.com/maplibre-gl-js/v2.4.0/maplibre-gl.js"></script>
        <link href="https://cdn.maptiler.com/maplibre-gl-js/v2.4.0/maplibre-gl.css" rel="stylesheet" />
      </head>
      <body>
        <div id="map"></div>
        <script>
          const map = new maplibregl.Map({
            container: 'map',
            style: 'https://api.maptiler.com/maps/basic-v2/style.json?key=T996zT1VqZPFQ74E7dQZ',
            center: [${location.longitude}, ${location.latitude}],
            zoom: 10
          });
          new maplibregl.Marker()
            .setLngLat([${location.longitude}, ${location.latitude}])
            .setPopup(new maplibregl.Popup().setHTML('<h3>You are here</h3>'))
            .addTo(map);
        </script>
      </body>
      </html>
    `
    : null;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#FFF9F0' }}>
      {permissionStatus === 'granted' && location && mapHtml ? (
        <View style={styles.fullScreenContainer}>
          <WebView
            style={styles.map}
            source={{ html: mapHtml }}
            originWhitelist={['*']}
          />
          {/* Overlay header and search bar */}
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
              <TouchableOpacity onPress={toggleSearchBar}>
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
                  />
                )}
              </Animated.View>
            </Animated.View>
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

      {/* Permission Modal */}
      <Modal
        animationType="none"
        transparent={true}
        visible={modalVisible}
        onRequestClose={closeModal}
      >
        <SafeAreaView style={{ flex: 1, margin: 0}}>
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
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderColor: 'transparent',
    elevation: 10,
    backgroundColor: 'rgb(252, 252, 252)',
    borderWidth: 1,
    marginBottom: 20,
    borderRadius: 20
  },
  searchIcon: {
    padding: 10,
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