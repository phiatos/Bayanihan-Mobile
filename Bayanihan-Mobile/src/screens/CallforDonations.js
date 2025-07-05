import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import React, { useRef, useState, useEffect } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import CallForDonationsStyles from '../styles/CallForDonationsStyles';
import GlobalStyles from '../styles/GlobalStyles';
import Theme from '../constants/theme';
import regions from '../json/region.json';

const CallForDonations = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const [formData, setFormData] = useState({
    donationDrive: '',
    contactPerson: '',
    contactNumber: '',
    accountNumber: '',
    accountName: '',
    barangay: '',
    city: '',
    province: '',
    region: '',
    street: '',
    facebookLink: '',
  });
  const [image, setImage] = useState(null);
  const [errors, setErrors] = useState({});
  const [isProvinceDropdownVisible, setIsProvinceDropdownVisible] = useState(false);
  const [filteredProvinces, setFilteredProvinces] = useState([]);
  const provinceInputRef = useRef(null);
  const [isRegionDropdownVisible, setIsRegionDropdownVisible] = useState(false);
  const [filteredRegions, setFilteredRegions] = useState(regions || []);
  const regionInputRef = useRef(null);

  const provinces = [
    'Abra', 'Agusan del Norte', 'Agusan del Sur', 'Aklan', 'Albay', 'Antique',
    'Apayao', 'Aurora', 'Basilan', 'Bataan', 'Batanes', 'Batangas', 'Benguet',
    'Biliran', 'Bohol', 'Bukidnon', 'Bulacan', 'Cagayan', 'Camarines Norte',
    'Camarines Sur', 'Camiguin', 'Capiz', 'Catanduanes', 'Cavite', 'Cebu',
    'Cotabato', 'Davao de Oro', 'Davao del Norte', 'Davao del Sur', 'Davao Occidental',
    'Davao Oriental', 'Dinagat Islands', 'Eastern Samar', 'Guimaras', 'Ifugao',
    'Ilocos Norte', 'Ilocos Sur', 'Iloilo', 'Isabela', 'Kalinga', 'La Union',
    'Laguna', 'Lanao del Norte', 'Lanao del Sur', 'Leyte', 'Maguindanao del Norte',
    'Maguindanao del Sur', 'Marinduque', 'Masbate', 'Metro Manila', 'Misamis Occidental',
    'Misamis Oriental', 'Mountain Province', 'Negros Occidental', 'Negros Oriental',
    'Northern Samar', 'Nueva Ecija', 'Nueva Vizcaya', 'Occidental Mindoro', 'Oriental Mindoro',
    'Palawan', 'Pampanga', 'Pangasinan', 'Quezon', 'Quirino', 'Rizal', 'Romblon',
    'Samar', 'Sarangani', 'Siquijor', 'Sorsogon', 'South Cotabato', 'Southern Leyte',
    'Sultan Kudarat', 'Sulu', 'Surigao del Norte', 'Surigao del Sur', 'Tarlac',
    'Tawi-Tawi', 'Zambales', 'Zamboanga del Norte', 'Zamboanga del Sur', 'Zamboanga Sibugay',
  ];

  const requiredFields = [
    'donationDrive',
    'contactPerson',
    'contactNumber',
    'accountNumber',
    'accountName',
    'barangay',
    'city',
    'province',
    'region',
    'street',
  ];

  useEffect(() => {
    console.log('Received route params:', route.params);
    if (route.params?.formData) {
      setFormData(route.params.formData);
    }
    if (route.params?.image) {
      setImage(route.params.image);
      console.log('Set image from route params:', route.params.image);
    }
  }, [route.params]);

  const handleChange = (field, value) => {
    setFormData({ ...formData, [field]: value });

    if (value.trim() !== '') {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }

    if (field === 'contactNumber' && value && !/^[0-9]{11}$/.test(value)) {
      setErrors((prev) => ({ ...prev, contactNumber: 'Phone number must be 11 digits' }));
    }

    if (field === 'facebookLink' && value && !/^https?:\/\/(www\.)?facebook\.com\/.+$/.test(value)) {
      setErrors((prev) => ({ ...prev, facebookLink: 'Please enter a valid Facebook URL' }));
    } else if (field === 'facebookLink' && value === '') {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors.facebookLink;
        return newErrors;
      });
    }

    if (field === 'region') {
      if (value.trim() === '') {
        setFilteredRegions(regions || []);
        setIsRegionDropdownVisible(false);
      } else {
        const filtered = (regions || []).filter((region) =>
          region.region_name.toLowerCase().includes(value.toLowerCase())
        );
        setFilteredRegions(filtered);
        setIsRegionDropdownVisible(true);
        console.log('Filtered regions:', filtered);
      }
    }

    if (field === 'province') {
      if (value.trim() === '') {
        setFilteredProvinces(provinces);
        setIsProvinceDropdownVisible(false);
      } else {
        const filtered = provinces.filter((province) =>
          province.toLowerCase().includes(value.toLowerCase())
        );
        setFilteredProvinces(filtered);
        setIsProvinceDropdownVisible(true);
      }
    }
  };

  const handleRegionSelect = (region) => {
    setFormData({ ...formData, region });
    setIsRegionDropdownVisible(false);
    setErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors.region;
      return newErrors;
    });
    regionInputRef.current.blur();
    console.log('Selected region:', region);
  };

  const handleRegionFocus = () => {
    setIsRegionDropdownVisible(true);
    setFilteredRegions(regions || []);
    console.log('Region dropdown opened, regions:', regions);
  };

  const handleRBlur = () => {
    setTimeout(() => setIsRegionDropdownVisible(false), 200);
  };

  const handleProvinceSelect = (province) => {
    setFormData({ ...formData, province });
    setIsProvinceDropdownVisible(false);
    setErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors.province;
      return newErrors;
    });
    provinceInputRef.current.blur();
  };

  const handleProvinceFocus = () => {
    setIsProvinceDropdownVisible(true);
    setFilteredProvinces(provinces);
  };

  const handlePBlur = () => {
    setTimeout(() => setIsProvinceDropdownVisible(false), 200);
  };

  const pickImage = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissionResult.granted) {
      Alert.alert('Permission Denied', 'Permission to access gallery is required!');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.5, // Reduced quality to prevent large file sizes
    });

    if (!result.canceled) {
      const uri = result.assets[0].uri;
      console.log('Selected image URI:', uri);
      setImage(uri);
    }
  };

  const handleSubmit = () => {
    const newErrors = {};
    requiredFields.forEach((field) => {
      const value = formData[field];
      if (value.trim() === '') {
        const fieldName = field
          .replace(/([A-Z])/g, ' $1')
          .trim()
          .replace(/^./, (str) => str.toUpperCase());
        newErrors[field] = `${fieldName} is required`;
      }
    });

    if (formData.contactNumber && !/^[0-9]{11}$/.test(formData.contactNumber)) {
      newErrors.contactNumber = 'Phone number must be 11 digits';
    }

    if (formData.facebookLink && !/^https?:\/\/(www\.)?facebook\.com\/.+$/.test(formData.facebookLink)) {
      newErrors.facebookLink = 'Please enter a valid Facebook URL';
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      Alert.alert('Incomplete Data', `Please fill in required fields:\n${Object.values(newErrors).join('\n')}`);
      return;
    }

    console.log('Navigating to CallForDonationsSummary with formData:', formData, 'and image:', image);
    navigation.navigate('CallForDonationsSummary', { formData, image });
  };

  const renderLabel = (label, isRequired) => (
    <Text style={CallForDonationsStyles.formTitle}>
      {label}
      {isRequired && <Text style={{ color: 'red' }}>*</Text>}
    </Text>
  );

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: Theme.colors.lightBg }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
    >
      <View style={CallForDonationsStyles.container}>
        <View style={GlobalStyles.headerContainer}>
          <TouchableOpacity
            onPress={() => navigation.openDrawer()}
            style={GlobalStyles.headerMenuIcon}
          >
            <Ionicons name="menu" size={32} color={Theme.colors.primary}/>
          </TouchableOpacity>
          <Text style={GlobalStyles.headerTitle}>Call for Donations</Text>
        </View>

        <SafeAreaView style={{ flex: 1 }} edges={['left', 'right', 'bottom']}>
          <ScrollView contentContainerStyle={CallForDonationsStyles.scrollViewContent}>
            <View style={CallForDonationsStyles.form}>
              <View style={CallForDonationsStyles.section}>
                <Text style={CallForDonationsStyles.sectionTitle}>Donation Details</Text>

                {renderLabel('Donation Drive', true)}
                <TextInput
                  style={[CallForDonationsStyles.input, errors.donationDrive && CallForDonationsStyles.requiredInput]}
                  placeholder="Enter Donation Drive Name"
                  onChangeText={(val) => handleChange('donationDrive', val)}
                  value={formData.donationDrive}
                />
                {errors.donationDrive && (
                  <Text style={CallForDonationsStyles.errorText}>{errors.donationDrive}</Text>
                )}

                {renderLabel('Contact Person', true)}
                <TextInput
                  style={[CallForDonationsStyles.input, errors.contactPerson && CallForDonationsStyles.requiredInput]}
                  placeholder="Enter Contact Person Name"
                  onChangeText={(val) => handleChange('contactPerson', val)}
                  value={formData.contactPerson}
                />
                {errors.contactPerson && (
                  <Text style={CallForDonationsStyles.errorText}>{errors.contactPerson}</Text>
                )}

                {renderLabel('Contact Number', true)}
                <TextInput
                  style={[CallForDonationsStyles.input, errors.contactNumber && CallForDonationsStyles.requiredInput]}
                  placeholder="Enter Mobile Number"
                  onChangeText={(val) => handleChange('contactNumber', val)}
                  value={formData.contactNumber}
                  keyboardType="numeric"
                />
                {errors.contactNumber && (
                  <Text style={CallForDonationsStyles.errorText}>{errors.contactNumber}</Text>
                )}

                {renderLabel('Account Number', true)}
                <TextInput
                  style={[CallForDonationsStyles.input, errors.accountNumber && CallForDonationsStyles.requiredInput]}
                  placeholder="Enter Bank Account Number"
                  onChangeText={(val) => handleChange('accountNumber', val)}
                  value={formData.accountNumber}
                  keyboardType="numeric"
                />
                {errors.accountNumber && (
                  <Text style={CallForDonationsStyles.errorText}>{errors.accountNumber}</Text>
                )}

                {renderLabel('Account Name', true)}
                <TextInput
                  style={[CallForDonationsStyles.input, errors.accountName && CallForDonationsStyles.requiredInput]}
                  placeholder="Enter Account Name"
                  onChangeText={(val) => handleChange('accountName', val)}
                  value={formData.accountName}
                />
                {errors.accountName && (
                  <Text style={CallForDonationsStyles.errorText}>{errors.accountName}</Text>
                )}

                {renderLabel('Region', true)}
                <View style={{ position: 'relative' }}>
                  <TextInput
                    ref={regionInputRef}
                    style={[CallForDonationsStyles.input, errors.region && CallForDonationsStyles.requiredInput]}
                    placeholder="Enter or Select Region"
                    onChangeText={(val) => handleChange('region', val)}
                    value={formData.region}
                    onFocus={handleRegionFocus}
                    onBlur={handleRBlur}
                  />
                  {isRegionDropdownVisible && filteredRegions.length > 0 && (
                    <View style={CallForDonationsStyles.dropdownContainer}>
                      <ScrollView nestedScrollEnabled={true}>
                        {filteredRegions.map((item) => (
                          <TouchableOpacity
                            key={item.id}
                            style={CallForDonationsStyles.dropdownItem}
                            onPress={() => handleRegionSelect(item.region_name)}
                          >
                            <Text style={CallForDonationsStyles.dropdownItemText}>{item.region_name}</Text>
                          </TouchableOpacity>
                        ))}
                      </ScrollView>
                    </View>
                  )}
                  {isRegionDropdownVisible && filteredRegions.length === 0 && (
                    <Text style={CallForDonationsStyles.errorText}>No regions found</Text>
                  )}
                </View>
                {errors.region && (
                  <Text style={CallForDonationsStyles.errorText}>{errors.region}</Text>
                )}

                {renderLabel('Province', true)}
                <View style={{ position: 'relative' }}>
                  <TextInput
                    ref={provinceInputRef}
                    style={[CallForDonationsStyles.input, errors.province && CallForDonationsStyles.requiredInput]}
                    placeholder="Enter or Select Province"
                    onChangeText={(val) => handleChange('province', val)}
                    value={formData.province}
                    onFocus={handleProvinceFocus}
                    onBlur={handlePBlur}
                  />
                  {isProvinceDropdownVisible && filteredProvinces.length > 0 && (
                    <View style={CallForDonationsStyles.dropdownContainer}>
                      <ScrollView nestedScrollEnabled={true}>
                        {filteredProvinces.map((item) => (
                          <TouchableOpacity
                            key={item}
                            style={CallForDonationsStyles.dropdownItem}
                            onPress={() => handleProvinceSelect(item)}
                          >
                            <Text style={CallForDonationsStyles.dropdownItemText}>{item}</Text>
                          </TouchableOpacity>
                        ))}
                      </ScrollView>
                    </View>
                  )}
                </View>
                {errors.province && (
                  <Text style={CallForDonationsStyles.errorText}>{errors.province}</Text>
                )}

                {renderLabel('City/Municipality', true)}
                <TextInput
                  style={[CallForDonationsStyles.input, errors.city && CallForDonationsStyles.requiredInput]}
                  placeholder="Enter City/Municipality"
                  onChangeText={(val) => handleChange('city', val)}
                  value={formData.city}
                />
                {errors.city && (
                  <Text style={CallForDonationsStyles.errorText}>{errors.city}</Text>
                )}

                {renderLabel('Barangay', true)}
                <TextInput
                  style={[CallForDonationsStyles.input, errors.barangay && CallForDonationsStyles.requiredInput]}
                  placeholder="Enter Barangay"
                  onChangeText={(val) => handleChange('barangay', val)}
                  value={formData.barangay}
                />
                {errors.barangay && (
                  <Text style={CallForDonationsStyles.errorText}>{errors.barangay}</Text>
                )}

                {renderLabel('Blk/Lot/Unit #', true)}
                <TextInput
                  style={[CallForDonationsStyles.input, errors.street && CallForDonationsStyles.requiredInput]}
                  placeholder="Enter Full street"
                  onChangeText={(val) => handleChange('street', val)}
                  value={formData.street}
                />
                {errors.street && (
                  <Text style={CallForDonationsStyles.errorText}>{errors.street}</Text>
                )}

                {renderLabel('Facebook Link', false)}
                <TextInput
                  style={[CallForDonationsStyles.input, errors.facebookLink && CallForDonationsStyles.requiredInput]}
                  placeholder="Enter Facebook URL (optional)"
                  onChangeText={(val) => handleChange('facebookLink', val)}
                  value={formData.facebookLink}
                  keyboardType="url"
                />
                {errors.facebookLink && (
                  <Text style={CallForDonationsStyles.errorText}>{errors.facebookLink}</Text>
                )}

                {renderLabel('Upload Donation Image', false)}
                <TouchableOpacity
                  style={[CallForDonationsStyles.imageUpload, image && { borderColor: '#00BCD4' }]}
                  onPress={pickImage}
                >
                  <Text style={{ color: image ? '#333' : '#AAA' }}>
                    {image ? 'Image Selected' : 'Tap to Upload Image'}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity style={CallForDonationsStyles.button} onPress={handleSubmit}>
                  <Text style={CallForDonationsStyles.buttonText}>Add Call for Donation</Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </SafeAreaView>
      </View>
    </KeyboardAvoidingView>
  );
};

export default CallForDonations;