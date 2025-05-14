import React, { useEffect, useState } from 'react';
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
  Alert,
} from 'react-native';
import Feather from 'react-native-vector-icons/Feather';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import WebView from 'react-native-webview';
import Theme from '../contants/theme';
import { BlurView } from 'expo-blur';

const HomeScreen = ({ navigation }) => {
  const [fontsLoaded, setFontsLoaded] = useState(false);
  const [location, setLocation] = useState(null);
  const [permissionStatus, setPermissionStatus] = useState(null);

  useEffect(() => {
    (async () => {
      // Load fonts
      await Font.loadAsync({
        'Poppins-MediumItalic': require('../../assets/fonts/Poppins/Poppins-MediumItalic.ttf'),
        'Poppins-Bold': require('../../assets/fonts/Poppins/Poppins-Bold.ttf'),
        'Poppins-Medium': require('../../assets/fonts/Poppins/Poppins-Medium.ttf'),
      });
      setFontsLoaded(true);

      // Show pre-prompt alert
      Alert.alert(
        'Location Access Needed',
        'We need your location to show your position on the map and provide personalized recommendations.',
        [
          {
            text: 'Deny',
            style: 'cancel',
            onPress: () => setPermissionStatus('denied'),
          },
          {
            text: 'Allow',
            style: 'default',
            onPress: async () => {
              let { status } = await Location.requestForegroundPermissionsAsync();
              setPermissionStatus(status);
              if (status === 'granted') {
                let loc = await Location.getCurrentPositionAsync({});
                setLocation({
                  latitude: loc.coords.latitude,
                  longitude: loc.coords.longitude,
                });
              }
            },
          },
        ]
      );
    })();
  }, []);

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
    }
  };

  if (!fontsLoaded) {
    return null; // Or show a loading spinner
  }

  // MapTiler HTML content for WebView
  const mapHtml = `
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
          center: [${
            location ? location.longitude : 120.9842
          }, ${location ? location.latitude : 14.5995}],
          zoom: 10
        });
        ${
          location
            ? `map.addControl(new maplibregl.NavigationControl());
               new maplibregl.Marker()
                 .setLngLat([${location ? location.longitude : 120.9842}, ${
                   location ? location.latitude : 14.5995
                 }])
                 .setPopup(new maplibregl.Popup().setHTML('<h3>You are here</h3>'))
                 .addTo(map);`
            : ''
        }
      </script>
    </body>
    </html>
  `;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#FFF9F0' }}>
      <ScrollView contentContainerStyle={{ padding: 20 }}>
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
              Hello, John Doe
            </Text>
            <ImageBackground
              source={require('../../assets/images/user.jpg')}
              style={{ width: 35, height: 35 }}
              imageStyle={{ borderRadius: 25 }}
            />
          </View>
        </View>

        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            borderColor: 'transparent',
            elevation: 5,
            backgroundColor: 'white',
            borderWidth: 1,
            borderRadius: 8,
            paddingHorizontal: 10,
            borderRadius: 15,
          }}
        >
          <Feather
            name="search"
            size={20}
            color="#c6c6c6"
            style={{ marginRight: 5 }}
          />
          <TextInput
            placeholder="Search"
            style={{ flex: 1, fontFamily: 'Poppins-Medium' }}
          />
        </View>

        {/* Permission Denied UI */}
        {permissionStatus === 'denied' && (
          <View style={styles.permissionDeniedContainer}>
            <Text style={styles.permissionDeniedText}>
              Location access is required to show your position on the map.
            </Text>
            <TouchableOpacity
              style={styles.retryButton}
              onPress={handleRetryPermission}
            >
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Map */}
        <View style={styles.mapContainer}>
          <WebView
            style={styles.map}
            source={{ html: mapHtml }}
            originWhitelist={['*']}
          />
        </View>
       
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({

  mapContainer: {
    marginTop: 20,
    height: 300,
    borderRadius: 8,
    overflow: 'hidden',
    elevation: 5,
    backgroundColor: 'white',
  },
  map: {
    flex: 1,
  },
  permissionDeniedContainer: {
    marginTop: 20,
    padding: 15,
    backgroundColor: '#FFF9F0',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Theme.colors.primary,
    alignItems: 'center',
  },
  permissionDeniedText: {
    fontFamily: 'Poppins-Medium',
    fontSize: 14,
    color: '#333',
    textAlign: 'center',
    marginBottom: 10,
  },
  retryButton: {
    backgroundColor: Theme.colors.primary,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  retryButtonText: {
    fontFamily: 'Poppins-Bold',
    fontSize: 14,
    color: '#FFF',
  },
});

export default HomeScreen;