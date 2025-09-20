import { Ionicons, MaterialIcons } from '@expo/vector-icons';
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
import GlobalStyles from '../styles/GlobalStyles';
import styles from '../styles/ReliefRequestStyles';
import Theme from '../constants/theme';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import OperationCustomModal from '../components/OperationCustomModal';
import useOperationCheck from '../components/useOperationCheck';
import { useAuth } from '../context/AuthContext';

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

const leafletHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <style>
    body { margin: 0; }
    #map { height: calc(100vh - 60px); width: 100%; }
    #searchContainer { position: absolute; top: 10px; left: 10px; right: 10px; z-index: 1000; display: flex; align-items: center; background: white; padding: 5px; border-radius: 5px; box-shadow: 0 2px 4px rgba(0,0,0,0.2); }
    #searchInput { flex: 1; padding: 8px; font-size: 14px; border: 1px solid #ccc; border-radius: 4px; margin-right: 5px; }
    #suggestions { position: absolute; top: 50px; left: 10px; right: 10px; background: white; border: 1px solid #ccc; max-height: 200px; overflow-y: auto; z-index: 1000; }
    .suggestion-item { padding: 10px; border-bottom: 1px solid #eee; cursor: pointer; }
    .suggestion-item:hover { background: #f0f0f0; }
    #confirmBtn { position: absolute; bottom: 10px; left: 50%; transform: translateX(-50%); padding: 10px 20px; background: #14aebb; color: white; border: none; border-radius: 5px; cursor: pointer; z-index: 1000; }
  </style>
</head>
<body>
  <div id="searchContainer">
    <input id="searchInput" type="text" placeholder="Search for a location" />
  </div>
  <div id="suggestions" style="display: none;"></div>
  <div id="map"></div>
  <button id="confirmBtn">Confirm Location</button>

  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <script>
    let map = L.map('map').setView([14.5995, 120.9842], 13);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 18,
    }).addTo(map);

    let marker = L.marker([14.5995, 120.9842], { draggable: true }).addTo(map);
    let currentLocation = { lat: 14.5995, lon: 120.9842, address: '' };

    marker.on('dragend', async function (e) {
      currentLocation.lat = marker.getLatLng().lat;
      currentLocation.lon = marker.getLatLng().lng;
      try {
        const response = await fetch(
          'https://nominatim.openstreetmap.org/reverse?format=json&lat=' + currentLocation.lat + '&lon=' + currentLocation.lon
        );
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
          'https://nominatim.openstreetmap.org/reverse?format=json&lat=' + e.latlng.lat + '&lon=' + e.latlng.lng
        );
        const data = await response.json();
        currentLocation.address = data.display_name || '';
        document.getElementById('searchInput').value = currentLocation.address;
      } catch (error) {
        console.error('Reverse geocoding error:', error);
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
          'https://nominatim.openstreetmap.org/search?format=json&q=' + encodeURIComponent(query) + '&limit=5'
        );
        const results = await response.json();
        const suggestionsDiv = document.getElementById('suggestions');
        suggestionsDiv.innerHTML = '';
        results.forEach(result => {
          const div = document.createElement('div');
          div.className = 'suggestion-item';
          div.textContent = result.display_name;
          div.onclick = function () {
            map.setView([result.lat, result.lon], 13);
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

    document.getElementById('confirmBtn').addEventListener('click', function () {
      window.ReactNativeWebView.postMessage(JSON.stringify({
        latitude: currentLocation.lat,
        longitude: currentLocation.lon,
        formattedAddress: currentLocation.address
      }));
    });
  </script>
</body>
</html>
`;

const ReliefRequestScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { user } = useAuth();
  const { canSubmit, organizationName, modalVisible, setModalVisible, modalConfig, setModalConfig } = useOperationCheck();
  const [errors, setErrors] = useState({});
  const [reportData, setReportData] = useState({
    contactPerson: route.params?.reportData?.contactPerson || user?.contactPerson || '',
    contactNumber: route.params?.reportData?.contactNumber || user?.mobile || '',
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
  const itemInputRef = useRef(null);
  const flatListRef = useRef(null);
  const insets = useSafeAreaInsets();

  useEffect(() => {
    if (route.params?.reportData) {
      setReportData((prev) => ({
        ...prev,
        contactPerson: route.params.reportData.contactPerson || user?.contactPerson || prev.contactPerson,
        contactNumber: route.params.reportData.contactNumber || user?.mobile || prev.contactNumber,
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

  const requiredFields = ['contactPerson', 'contactNumber', 'email', 'address.formattedAddress', 'category'];
  const itemInputRequiredFields = ['category', 'itemName', 'quantity'];

  const categories = ['Relief Packs', 'Hot Meals', 'Hygiene Kits', 'Drinking Water', 'Rice Packs', 'Other Essentials'];
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

    if (field === 'contactNumber') {
      const cleanedValue = value.replace(/\D/g, '');
      setReportData((prev) => ({ ...prev, contactNumber: cleanedValue }));
      if (cleanedValue && !/^[0-9]{11}$/.test(cleanedValue)) {
        setErrors((prev) => ({ ...prev, contactNumber: 'Contact number must be exactly 11 digits' }));
      } else {
        setErrors((prev) => {
          const newErrors = { ...prev };
          delete newErrors.contactNumber;
          return newErrors;
        });
      }
    } else if (field === 'email') {
      const cleanedValue = value.replace(/\s/g, '');
      setReportData((prev) => ({ ...prev, email: cleanedValue }));
      if (cleanedValue && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanedValue)) {
        setErrors((prev) => ({ ...prev, email: 'Email is not valid' }));
      } else {
        setErrors((prev) => {
          const newErrors = { ...prev };
          delete newErrors.email;
          return newErrors;
        });
      }
    } else if (field === 'contactPerson') {
      const cleanedValue = value.replace(/[^a-zA-Z\s]/g, '');
      setReportData((prev) => ({ ...prev, contactPerson: capitalizeFirstLetter(cleanedValue) }));
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
    scrollToInput('itemName');
  };

  const handleBlur = () => {
    setTimeout(() => setIsItemDropdownVisible(false), 200);
  };

  const scrollToInput = (field) => {
    const sectionMap = {
      contactPerson: 0,
      contactNumber: 0,
      email: 0,
      'address.formattedAddress': 0,
      category: 0,
      itemName: 1,
      quantity: 1,
      notes: 1,
    };
    const index = sectionMap[field] || 0;
    if (flatListRef.current) {
      flatListRef.current.scrollToIndex({ index, animated: true });
    }
  };

  const handleWebViewMessage = (event) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      setReportData((prev) => ({
        ...prev,
        address: {
          formattedAddress: data.formattedAddress || '',
          latitude: parseFloat(data.latitude) || null,
          longitude: parseFloat(data.longitude) || null,
        },
      }));
      setMapModalVisible(false);
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

    navigation.navigate('ReliefSummary', { reportData, addedItems: items, organizationName });
  };

  const renderLabel = (label, isRequired) => (
    <Text style={GlobalStyles.formTitle}>
      {label}
      {isRequired && <Text style={{ color: 'red' }}> *</Text>}
    </Text>
  );

  const windowHeight = Dimensions.get('window').height;
  const maxDropdownHeight = windowHeight * 0.3;

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
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1, marginTop: 80 }}
        keyboardVerticalOffset={0}
      >
        <ScrollView
          contentContainerStyle={[GlobalStyles.scrollViewContent]}
          scrollEnabled={true}
          keyboardShouldPersistTaps="handled"
          ref={flatListRef}
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
                />
              </View>
              {errors.email && <Text style={GlobalStyles.errorText}>{errors.email}</Text>}

              {renderLabel('Drop-off Address', true)}
              <View style={{ flexDirection: 'column', gap: 10, margin: 0, width: '100%' }}>
                <TextInput
                  style={[
                    GlobalStyles.input,
                    { width: '100%' },
                    errors['address.formattedAddress'] && GlobalStyles.inputError
                  ]}
                  placeholder="Enter Drop-Off Address"
                  placeholderTextColor={Theme.colors.placeholderColor}
                  onChangeText={(val) => handleChange('address.formattedAddress', val)}
                  value={reportData.address.formattedAddress}
                />
                <TouchableOpacity
                  style={[
                    GlobalStyles.supplementaryButton, GlobalStyles.openMap
                  ]}
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
              <View style={[GlobalStyles.input, styles.pickerContainer, errors.category && GlobalStyles.inputError]}>
                <Dropdown
                  style={{ padding: 10, width: '100%' }}
                  placeholderStyle={{ fontFamily: 'Poppins_Regular', color: Theme.colors.placeholderColor, fontSize: 14 }}
                  selectedTextStyle={{ fontFamily: 'Poppins_Regular', fontSize: 14 }}
                  itemTextStyle={{ fontFamily: 'Poppins_Regular', fontSize: 14, color: Theme.colors.black }}
                  data={categories.map((c) => ({ label: c, value: c }))}
                  labelField="label"
                  valueField="value"
                  placeholder="Select Category"
                  value={reportData.category}
                  onChange={(item) => handleChange('category', item.value)}
                />
              </View>
              {errors.category && <Text style={GlobalStyles.errorText}>{errors.category}</Text>}
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
                    <FlatList
                      data={filteredItems}
                      keyExtractor={(item) => item}
                      nestedScrollEnabled
                      keyboardShouldPersistTaps="handled"
                      renderItem={({ item }) => (
                        <TouchableOpacity
                          style={styles.dropdownItem}
                          onPress={() => handleItemSelect(item)}
                        >
                          <Text style={styles.dropdownItemText}>{item}</Text>
                        </TouchableOpacity>
                      )}
                    />
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
                        nestedScrollEnabled
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
        <SafeAreaView style={{ flex: 1, }}>
          <View style={{ flex: 1, }}>
            <View style={styles.mapModalHeader}>
              <Text style={styles.mapModalHeaderText}>Pin Drop-Off Address </Text>
               <TouchableOpacity
                style={{ padding: 10, justifyContent: 'flex-end' }}
                onPress={() => setMapModalVisible(false)}
              >
                <Ionicons name="close" size={24} color={Theme.colors.black} />
              </TouchableOpacity>
            </View>
            <WebView
              source={{ html: leafletHtml }}
              style={{ flex: 1 }}
              onMessage={handleWebViewMessage}
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
      />
    </SafeAreaView>
  );
};

export default ReliefRequestScreen;