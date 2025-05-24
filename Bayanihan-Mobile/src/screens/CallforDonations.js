import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  Alert,
  SafeAreaView,
  FlatList,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import CallForDonationsStyles from '../styles/CallForDonationsStyles';
import GlobalStyles from '../styles/GlobalStyles';
GlobalStyles

const CallforDonations = () => {
  const navigation = useNavigation();
  const [formData, setFormData] = useState({
    donationDrive: '',
    contactPerson: '',
    contactNumber: '',
    accountNumber: '',
    accountName: '',
    province: '',
    city: '',
    barangay: '',
    address: '',
    facebookLink: '',
  });
  const [donationImage, setDonationImage] = useState(null);
  const [errors, setErrors] = useState({});
  const [isProvinceDropdownVisible, setIsProvinceDropdownVisible] = useState(false);
  const [filteredProvinces, setFilteredProvinces] = useState([]);
  const provinceInputRef = useRef(null);

  // List of Philippine provinces
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
    'Tawi-Tawi', 'Zambales', 'Zamboanga del Norte', 'Zamboanga del Sur', 'Zamboanga Sibugay'
  ];

  // Required fields
  const requiredFields = [
    'donationDrive',
    'contactPerson',
    'contactNumber',
    'accountNumber',
    'accountName',
    'province',
    'city',
    'barangay',
    'address',
  ];

  // Handle TextInput changes
  const handleChange = (field, value) => {
    setFormData({ ...formData, [field]: value });

    // Clear error if field has a valid value
    if (value.trim() !== '') {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }

    // Validate contactNumber
    if (field === 'contactNumber' && value && !/^[0-9]{11}$/.test(value)) {
      setErrors((prev) => ({ ...prev, contactNumber: 'Phone number must be 11 digits' }));
    }

    // Filter provinces
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

  // Handle province selection
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

  // Handle province input focus
  const handleProvinceFocus = () => {
    setIsProvinceDropdownVisible(true);
    setFilteredProvinces(provinces);
  };

  // Handle blur for province dropdown
  const handleBlur = () => {
    setTimeout(() => setIsProvinceDropdownVisible(false), 200);
  };

  // Handle image picking
  const pickImage = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissionResult.granted) {
      Alert.alert('Permission Denied', 'Permission to access gallery is required!');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled) {
      setDonationImage(result.assets[0].uri);
    }
  };

  // Handle form submission
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

    // Navigate to DonationSummary with form data and image
    navigation.navigate('CallforDonationsSummary', { formData, donationImage });
  };

  // Render label
  const renderLabel = (label, isRequired) => (
    <Text style={CallForDonationsStyles.formTitle}>
      {label}
      {isRequired}
    </Text>
  );

  return (
   <View style={CallForDonationsStyles.container}>
   
         {/* Header - Use GlobalStyles for header properties */}
         <View style={GlobalStyles.headerContainer}>
           <TouchableOpacity
             onPress={() => navigation.openDrawer()}
             style={GlobalStyles.headerMenuIcon}
           >
             <Ionicons name="menu" size={32} color="white" />
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

            {renderLabel('Upload Donation Image', false)}
            <TouchableOpacity
              style={[CallForDonationsStyles.imageUpload, donationImage && { borderColor: '#00BCD4' }]}
              onPress={pickImage}
            >
              <Text style={{ color: donationImage ? '#333' : '#AAA' }}>
                {donationImage ? 'Image Selected' : 'Tap to Upload Image'}
              </Text>
            </TouchableOpacity>

            {renderLabel('Province', true)}
            <View style={{ position: 'relative' }}>
              <TextInput
                ref={provinceInputRef}
                style={[CallForDonationsStyles.input, errors.province && CallForDonationsStyles.requiredInput]}
                placeholder="Enter or Select Province"
                onChangeText={(val) => handleChange('province', val)}
                value={formData.province}
                onFocus={handleProvinceFocus}
                onBlur={handleBlur}
              />
              {isProvinceDropdownVisible && filteredProvinces.length > 0 && (
                <View style={CallForDonationsStyles.dropdownContainer}>
                  <FlatList
                    data={filteredProvinces}
                    keyExtractor={(item) => item}
                    renderItem={({ item }) => (
                      <TouchableOpacity
                        style={CallForDonationsStyles.dropdownItem}
                        onPress={() => handleProvinceSelect(item)}
                      >
                        <Text style={CallForDonationsStyles.dropdownItemText}>{item}</Text>
                      </TouchableOpacity>
                    )}
                  />
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

            {renderLabel('Address', true)}
            <TextInput
              style={[CallForDonationsStyles.input, errors.address && CallForDonationsStyles.requiredInput, { height: 100, textAlignVertical: 'top' }]}
              placeholder="Enter Full Address"
              onChangeText={(val) => handleChange('address', val)}
              value={formData.address}
              multiline
              numberOfLines={4}
            />
            {errors.address && (
              <Text style={CallForDonationsStyles.errorText}>{errors.address}</Text>
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

            <TouchableOpacity style={CallForDonationsStyles.button} onPress={handleSubmit}>
              <Text style={CallForDonationsStyles.buttonText}>Add Call for Donation</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
    </View>
  );
};

export default CallforDonations;