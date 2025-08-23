import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import React, { useRef, useState, useEffect } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  Text,
  TextInput,
  ToastAndroid,
  TouchableOpacity,
  View,
  Modal,
} from 'react-native';
import { auth, database } from '../configuration/firebaseConfig';
import { ref as databaseRef, get, query, orderByChild, equalTo } from 'firebase/database';
import AsyncStorage from '@react-native-async-storage/async-storage';
import styles from '../styles/CallForDonationsStyles';
import GlobalStyles from '../styles/GlobalStyles';
import Theme from '../constants/theme';
import regions from '../data/region.json';
import provinces from '../data/province.json';
import cities from '../data/city.json';
import barangays from '../data/barangay.json';
import { LinearGradient } from 'expo-linear-gradient';

const CustomModal = ({ visible, title, message, onConfirm, confirmText }) => {
  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={visible}
      onRequestClose={onConfirm}
    >
      <View style={GlobalStyles.modalOverlay}>
        <View style={GlobalStyles.modalView}>
          <Text style={GlobalStyles.modalTitle}>{title}</Text>
          <View style={GlobalStyles.modalContent}>
            <Ionicons
              name={title.includes('Success') || title.includes('Saved') ? 'checkmark-circle' : 'warning'}
              size={60}
              color={title.includes('Success') || title.includes('Saved') ? '#00BCD4' : '#FF0000'}
              style={GlobalStyles.modalIcon}
            />
            <Text style={GlobalStyles.modalMessage}>{message}</Text>
          </View>
          <TouchableOpacity
            style={GlobalStyles.modalButton}
            onPress={onConfirm}
          >
            <Text style={GlobalStyles.modalButtonText}>{confirmText}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

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
  const [isRegionDropdownVisible, setIsRegionDropdownVisible] = useState(false);
  const [filteredRegions, setFilteredRegions] = useState(regions || []);
  const regionInputRef = useRef(null);
  const [isProvinceDropdownVisible, setIsProvinceDropdownVisible] = useState(false);
  const [filteredProvinces, setFilteredProvinces] = useState([]);
  const provinceInputRef = useRef(null);
  const [isCityDropdownVisible, setIsCityDropdownVisible] = useState(false);
  const [filteredCities, setFilteredCities] = useState([]);
  const cityInputRef = useRef(null);
  const [isBarangayDropdownVisible, setIsBarangayDropdownVisible] = useState(false);
  const [filteredBarangays, setFilteredBarangays] = useState([]);
  const barangayInputRef = useRef(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalConfig, setModalConfig] = useState({
    title: '',
    message: '',
    onConfirm: () => {},
    confirmText: 'OK',
  });
  const [canSubmit, setCanSubmit] = useState(false);
  const [organizationName, setOrganizationName] = useState('');

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

  // Active operation check
  useEffect(() => {
    const checkActiveOperations = async () => {
      try {
        // Reset canSubmit to false to ensure fresh check
        setCanSubmit(false);
        setModalVisible(false); // Reset modal visibility

        // Load organization name from AsyncStorage
        const storedOrg = await AsyncStorage.getItem('organizationName');
        if (storedOrg) {
          setOrganizationName(storedOrg);
          console.log('Organization name loaded from storage:', storedOrg);
        }

        // Check authentication state
        const user = auth.currentUser;
        if (!user) {
          console.warn('No user is logged in');
          setModalConfig({
            title: 'Authentication Error',
            message: 'User not authenticated. Please log in.',
            onConfirm: () => {
              setModalVisible(false);
              navigation.navigate('Login');
            },
            confirmText: 'OK',
          });
          setModalVisible(true);
          setTimeout(() => {
            setModalVisible(false);
            navigation.navigate('Login');
          }, 3000);
          return;
        }

        console.log('Logged-in user UID:', user.uid);
        const userRef = databaseRef(database, `users/${user.uid}`);
        const userSnapshot = await get(userRef);
        const userData = userSnapshot.val();

        if (!userData) {
          console.error('User data not found for UID:', user.uid);
          setModalConfig({
            title: 'Profile Error',
            message: 'Your user profile is incomplete. Please contact support.',
            onConfirm: () => {
              setModalVisible(false);
            navigation.navigate('Volunteer Dashboard');
            },
            confirmText: 'OK',
          });
          setModalVisible(true);
          setTimeout(() => {
            setModalVisible(false);
            navigation.navigate('Volunteer Dashboard');
          }, 3000);
          return;
        }

        // Check for password reset requirement
        if (userData.password_needs_reset) {
          setModalConfig({
            title: 'Password Reset Required',
            message: 'For security reasons, please change your password.',
            onConfirm: () => {
              setModalVisible(false);
              navigation.navigate('Profile');
            },
            confirmText: 'OK',
          });
          setModalVisible(true);
          setTimeout(() => {
            setModalVisible(false);
            navigation.navigate('Profile');
          }, 3000);
          return;
        }

        const userRole = userData.role;
        const orgName = userData.organization || '[Unknown Organization]';
        setOrganizationName(orgName);
        await AsyncStorage.setItem('organizationName', orgName);
        console.log('User Role:', userRole, 'Organization:', orgName);

        // Role-based submission eligibility
        if (userRole === 'AB ADMIN') {
          console.log('AB ADMIN role detected. Submission allowed.');
          setCanSubmit(true);
        } else if (userRole === 'ABVN') {
          console.log('ABVN role detected. Checking organization activations.');
          if (orgName === '[Unknown Organization]') {
            console.warn('ABVN user has no organization assigned.');
            setModalConfig({
              title: 'Organization Error',
              message: 'Your account is not associated with an organization.',
              onConfirm: () => {
                setModalVisible(false);
                navigation.navigate('Volunteer Dashboard');
              },
              confirmText: 'OK',
            });
            setModalVisible(true);
            setTimeout(() => {
              setModalVisible(false);
              navigation.navigate('Volunteer Dashboard');
            }, 3000);
            return;
          }

          const activationsRef = query(
            databaseRef(database, 'activations'),
            orderByChild('organization'),
            equalTo(orgName)
          );
          const activationsSnapshot = await get(activationsRef);
          let hasActiveActivations = false;
          activationsSnapshot.forEach((childSnapshot) => {
            if (childSnapshot.val().status === 'active') {
              hasActiveActivations = true;
              return true; // Exit loop
            }
          });

          if (hasActiveActivations) {
            console.log(`Organization "${orgName}" has active operations. Submission allowed.`);
            setCanSubmit(true);
          } else {
            console.warn(`Organization "${orgName}" has no active operations. Submission disabled.`);
            setModalConfig({
              title: 'No Active Operations',
              message: 'Your organization has no active operations. You cannot submit donation drives at this time.',
              onConfirm: () => {
                setModalVisible(false);
                navigation.navigate('Volunteer Dashboard');
              },
              confirmText: 'OK',
            });
            setModalVisible(true);
            setTimeout(() => {
              setModalVisible(false);
            navigation.navigate('Volunteer Dashboard');
            }, 3000);
          }
        } else {
          console.warn(`Unsupported role: ${userRole}. Submission disabled.`);
          setModalConfig({
            title: 'Permission Error',
            message: 'Your role does not permit donation drive submission.',
            onConfirm: () => {
              setModalVisible(false);
            navigation.navigate('Volunteer Dashboard');
            },
            confirmText: 'OK',
          });
          setModalVisible(true);
          setTimeout(() => {
            setModalVisible(false);
            navigation.navigate('Volunteer Dashboard');
          }, 3000);
        }
      } catch (error) {
        console.error(`[${new Date().toISOString()}] Error in checkActiveOperations:`, error.message);
        setModalConfig({
          title: 'Error',
          message: 'Failed to verify permissions: ' + error.message,
          onConfirm: () => {
            setModalVisible(false);
            navigation.navigate('Volunteer Dashboard');
          },
          confirmText: 'OK',
        });
        setModalVisible(true);
        setTimeout(() => {
          setModalVisible(false);
            navigation.navigate('Volunteer Dashboard');
        }, 3000);
      }
    };

    // Run check on screen focus
    const unsubscribeFocus = navigation.addListener('focus', () => {
      console.log('CallForDonations screen focused, checking active operations...');
      checkActiveOperations();
    });

    // Initial check on mount
    checkActiveOperations();

    return () => unsubscribeFocus();
  }, [navigation]);

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
    } else if (field === 'contactNumber' && value === '') {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors.contactNumber;
        return newErrors;
      });
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
        setFilteredProvinces([]);
        setFilteredCities([]);
        setFilteredBarangays([]);
        setFormData((prev) => ({ ...prev, province: '', city: '', barangay: '' }));
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
        setFilteredProvinces(provinces || []);
        setIsProvinceDropdownVisible(false);
        setFilteredCities([]);
        setFilteredBarangays([]);
        setFormData((prev) => ({ ...prev, city: '', barangay: '' }));
      } else {
        const selectedRegion = regions.find((r) => r.region_name === formData.region);
        const regionCode = selectedRegion ? selectedRegion.region_code : '';
        const filtered = (provinces || []).filter(
          (province) =>
            province.province_name.toLowerCase().includes(value.toLowerCase()) &&
            province.region_code === regionCode
        );
        setFilteredProvinces(filtered);
        setIsProvinceDropdownVisible(true);
      }
    }

    if (field === 'city') {
      if (value.trim() === '') {
        setFilteredCities(cities || []);
        setIsCityDropdownVisible(false);
        setFilteredBarangays([]);
        setFormData((prev) => ({ ...prev, barangay: '' }));
      } else {
        const selectedProvince = provinces.find((p) => p.province_name === formData.province);
        const provinceCode = selectedProvince ? selectedProvince.province_code : '';
        const filtered = (cities || []).filter(
          (city) =>
            city.city_name.toLowerCase().includes(value.toLowerCase()) &&
            city.province_code === provinceCode
        );
        setFilteredCities(filtered);
        setIsCityDropdownVisible(true);
      }
    }

    if (field === 'barangay') {
      if (value.trim() === '') {
        setFilteredBarangays(barangays || []);
        setIsBarangayDropdownVisible(false);
      } else {
        const selectedCity = cities.find((c) => c.city_name === formData.city);
        const cityCode = selectedCity ? selectedCity.city_code : '';
        const filtered = (barangays || []).filter(
          (barangay) =>
            barangay.brgy_name.toLowerCase().includes(value.toLowerCase()) &&
            barangay.city_code === cityCode
        );
        setFilteredBarangays(filtered);
        setIsBarangayDropdownVisible(true);
      }
    }
  };

  const handleRegionSelect = (region) => {
    setFormData({ ...formData, region, province: '', city: '', barangay: '' });
    setErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors.region;
      return newErrors;
    });
    setIsRegionDropdownVisible(false);
    setFilteredProvinces([]);
    setFilteredCities([]);
    setFilteredBarangays([]);
    if (regionInputRef.current) {
      setTimeout(() => {
        regionInputRef.current.focus();
      }, 0);
    }
    console.log('Selected region:', region);
  };

  const handleRegionFocus = () => {
    setIsRegionDropdownVisible(true);
    setFilteredRegions(regions || []);
    console.log('Region dropdown opened, regions:', regions);
  };

  const handleRBlur = () => {
    setTimeout(() => {
      if (!regionInputRef.current?.isFocused()) {
        setIsRegionDropdownVisible(false);
      }
    }, 300);
  };

  const handleProvinceSelect = (province) => {
    setFormData({ ...formData, province, city: '', barangay: '' });
    setErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors.province;
      return newErrors;
    });
    setIsProvinceDropdownVisible(false);
    setFilteredCities([]);
    setFilteredBarangays([]);
    if (provinceInputRef.current) {
      setTimeout(() => {
        provinceInputRef.current.focus();
      }, 0);
    }
  };

  const handleProvinceFocus = () => {
    const selectedRegion = regions.find((r) => r.region_name === formData.region);
    const regionCode = selectedRegion ? selectedRegion.region_code : '';
    const filtered = regionCode
      ? provinces.filter((province) => province.region_code === regionCode)
      : provinces;
    setFilteredProvinces(filtered);
    setIsProvinceDropdownVisible(true);
  };

  const handlePBlur = () => {
    setTimeout(() => {
      if (!provinceInputRef.current?.isFocused()) {
        setIsProvinceDropdownVisible(false);
      }
    }, 300);
  };

  const handleCitySelect = (city) => {
    setFormData({ ...formData, city, barangay: '' });
    setErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors.city;
      return newErrors;
    });
    setIsCityDropdownVisible(false);
    setFilteredBarangays([]);
    if (cityInputRef.current) {
      setTimeout(() => {
        cityInputRef.current.focus();
      }, 0);
    }
  };

  const handleCityFocus = () => {
    const selectedProvince = provinces.find((p) => p.province_name === formData.province);
    const provinceCode = selectedProvince ? selectedProvince.province_code : '';
    const filtered = provinceCode
      ? cities.filter((city) => city.province_code === provinceCode)
      : cities;
    setFilteredCities(filtered);
    setIsCityDropdownVisible(true);
  };

  const handleCBlur = () => {
    setTimeout(() => {
      if (!cityInputRef.current?.isFocused()) {
        setIsCityDropdownVisible(false);
      }
    }, 300);
  };

  const handleBarangaySelect = (barangay) => {
    setFormData({ ...formData, barangay });
    setErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors.barangay;
      return newErrors;
    });
    setIsBarangayDropdownVisible(false);
    if (barangayInputRef.current) {
      setTimeout(() => {
        barangayInputRef.current.focus();
      }, 0);
    }
  };

  const handleBarangayFocus = () => {
    const selectedCity = cities.find((c) => c.city_name === formData.city);
    const cityCode = selectedCity ? selectedCity.city_code : '';
    const filtered = cityCode
      ? barangays.filter((barangay) => barangay.city_code === cityCode)
      : barangays;
    setFilteredBarangays(filtered);
    setIsBarangayDropdownVisible(true);
  };

  const handleBBlur = () => {
    setTimeout(() => {
      if (!barangayInputRef.current?.isFocused()) {
        setIsBarangayDropdownVisible(false);
      }
    }, 300);
  };

  const pickImage = async () => {
    if (!canSubmit) {
      setModalConfig({
        title: 'Permission Error',
        message: 'You do not have permission to submit donation drives.',
        onConfirm: () => {
          setModalVisible(false);
            navigation.navigate('Volunteer Dashboard');
        },
        confirmText: 'OK',
      });
      setModalVisible(true);
      setTimeout(() => {
        setModalVisible(false);
            navigation.navigate('Volunteer Dashboard');
      }, 3000);
      return;
    }

    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissionResult.granted) {
      ToastAndroid.show('Permission to access gallery is required!', ToastAndroid.BOTTOM);
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.5,
    });

    if (!result.canceled) {
      const uri = result.assets[0].uri;
      console.log('Selected image URI:', uri);
      setImage(uri);
    }
  };

  const handleSubmit = () => {
    if (!canSubmit) {
      setModalConfig({
        title: 'Permission Error',
        message: 'You do not have permission to submit donation drives.',
        onConfirm: () => {
          setModalVisible(false);
            navigation.navigate('Volunteer Dashboard');
        },
        confirmText: 'OK',
      });
      setModalVisible(true);
      setTimeout(() => {
        setModalVisible(false);
            navigation.navigate('Volunteer Dashboard');
      }, 3000);
      return;
    }

    const newErrors = {};
    let allRequiredBlank = true;

    requiredFields.forEach((field) => {
      const value = formData[field];
      if (value.trim() === '') {
        const fieldName = field
          .replace(/([A-Z])/g, ' $1')
          .trim()
          .replace(/^./, (str) => str.toUpperCase());
        newErrors[field] = `${fieldName} is required`;
      } else {
        allRequiredBlank = false;
      }
    });

    if (formData.contactNumber && !/^[0-9]{11}$/.test(formData.contactNumber)) {
      newErrors.contactNumber = 'Phone number must be 11 digits';
    }

    if (formData.facebookLink && !/^https?:\/\/(www\.)?facebook\.com\/.+$/.test(formData.facebookLink)) {
      newErrors.facebookLink = 'Please enter a valid Facebook URL';
    }

    setErrors(newErrors);

    if (allRequiredBlank) {
      setModalConfig({
        title: 'Incomplete Data',
        message: 'Please input required fields.',
        onConfirm: () => setModalVisible(false),
        confirmText: 'OK',
      });
      setModalVisible(true);
      return;
    }

    if (Object.keys(newErrors).length > 0) {
      setModalConfig({
        title: 'Incomplete Data',
        message: 'Please fill in all required fields.',
        onConfirm: () => setModalVisible(false),
        confirmText: 'OK',
      });
      setModalVisible(true);
      return;
    }

    console.log('Navigating to CallForDonationsSummary with formData:', formData, 'and image:', image);
    navigation.navigate('CallForDonationsSummary', { formData, image });
  };

  const renderLabel = (label, isRequired) => (
    <Text style={GlobalStyles.formTitle}>
      {label}
      {isRequired && <Text style={{ color: 'red' }}>*</Text>}
    </Text>
  );

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
          <Text style={[GlobalStyles.headerTitle, { color: Theme.colors.primary }]}>Call for Donations</Text>
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
        >
          <View style={GlobalStyles.form}>
            <View style={GlobalStyles.section}>
              <Text style={GlobalStyles.sectionTitle}>Donation Details</Text>

              {renderLabel('Donation Drive', true)}
              <TextInput
                style={[GlobalStyles.input, errors.donationDrive && GlobalStyles.inputError]}
                placeholder="Donation Drive"
                placeholderTextColor={Theme.colors.placeholderColor}
                onChangeText={(val) => handleChange('donationDrive', val)}
                value={formData.donationDrive}
                autoComplete="off"
                editable={canSubmit}
              />
              {errors.donationDrive && (
                <Text style={GlobalStyles.errorText}>{errors.donationDrive}</Text>
              )}

              {renderLabel('Contact Person', true)}
              <TextInput
                style={[GlobalStyles.input, errors.contactPerson && GlobalStyles.inputError]}
                placeholder="Contact Name"
                placeholderTextColor={Theme.colors.placeholderColor}
                onChangeText={(val) => handleChange('contactPerson', val)}
                value={formData.contactPerson}
                autoComplete="name"
                textContentType="name"
                editable={canSubmit}
              />
              {errors.contactPerson && (
                <Text style={GlobalStyles.errorText}>{errors.contactPerson}</Text>
              )}

              {renderLabel('Contact Number', true)}
              <TextInput
                style={[GlobalStyles.input, errors.contactNumber && GlobalStyles.inputError]}
                placeholder="Contact Number"
                placeholderTextColor={Theme.colors.placeholderColor}
                onChangeText={(val) => handleChange('contactNumber', val)}
                value={formData.contactNumber}
                keyboardType="numeric"
                autoComplete="tel"
                textContentType="telephoneNumber"
                editable={canSubmit}
              />
              {errors.contactNumber && (
                <Text style={GlobalStyles.errorText}>{errors.contactNumber}</Text>
              )}

              {renderLabel('Account Number', true)}
              <TextInput
                style={[GlobalStyles.input, errors.accountNumber && GlobalStyles.inputError]}
                placeholder="Account Number"
                placeholderTextColor={Theme.colors.placeholderColor}
                onChangeText={(val) => handleChange('accountNumber', val)}
                value={formData.accountNumber}
                keyboardType="numeric"
                autoComplete="off"
                editable={canSubmit}
              />
              {errors.accountNumber && (
                <Text style={GlobalStyles.errorText}>{errors.accountNumber}</Text>
              )}

              {renderLabel('Account Name', true)}
              <TextInput
                style={[GlobalStyles.input, errors.accountName && GlobalStyles.inputError]}
                placeholder="Account Name"
                placeholderTextColor={Theme.colors.placeholderColor}
                onChangeText={(val) => handleChange('accountName', val)}
                value={formData.accountName}
                autoComplete="name"
                textContentType="name"
                editable={canSubmit}
              />
              {errors.accountName && (
                <Text style={GlobalStyles.errorText}>{errors.accountName}</Text>
              )}

              {renderLabel('Region', true)}
              <View style={{ position: 'relative' }}>
                <TextInput
                  ref={regionInputRef}
                  style={[GlobalStyles.input, errors.region && GlobalStyles.inputError]}
                  placeholder="Enter or Choose Region"
                  placeholderTextColor={Theme.colors.placeholderColor}
                  onChangeText={(val) => handleChange('region', val)}
                  value={formData.region}
                  onFocus={handleRegionFocus}
                  onBlur={handleRBlur}
                  blurOnSubmit={false}
                  autoComplete="address-level1"
                  textContentType="addressState"
                  editable={canSubmit}
                />
                {isRegionDropdownVisible && filteredRegions.length > 0 && (
                  <View style={styles.dropdownContainer}>
                    <ScrollView nestedScrollEnabled={true} keyboardShouldPersistTaps="always">
                      {filteredRegions.map((item) => (
                        <TouchableOpacity
                          key={item.id}
                          style={styles.dropdownItem}
                          onPress={() => handleRegionSelect(item.region_name)}
                        >
                          <Text style={styles.dropdownItemText}>{item.region_name}</Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>
                )}
                {isRegionDropdownVisible && filteredRegions.length === 0 && (
                  <Text style={GlobalStyles.errorText}>No regions found</Text>
                )}
              </View>
              {errors.region && (
                <Text style={GlobalStyles.errorText}>{errors.region}</Text>
              )}

              {renderLabel('Province', true)}
              <View style={{ position: 'relative' }}>
                <TextInput
                  ref={provinceInputRef}
                  style={[GlobalStyles.input, errors.province && GlobalStyles.inputError]}
                  placeholder="Enter or Select Province"
                  placeholderTextColor={Theme.colors.placeholderColor}
                  onChangeText={(val) => handleChange('province', val)}
                  value={formData.province}
                  onFocus={handleProvinceFocus}
                  onBlur={handlePBlur}
                  blurOnSubmit={false}
                  autoComplete="address-level1"
                  textContentType="addressState"
                  editable={canSubmit}
                />
                {isProvinceDropdownVisible && filteredProvinces.length > 0 && (
                  <View style={styles.dropdownContainer}>
                    <ScrollView nestedScrollEnabled={true} keyboardShouldPersistTaps="always">
                      {filteredProvinces.map((item) => (
                        <TouchableOpacity
                          key={item.province_code}
                          style={styles.dropdownItem}
                          onPress={() => handleProvinceSelect(item.province_name)}
                        >
                          <Text style={styles.dropdownItemText}>{item.province_name}</Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>
                )}
                {isProvinceDropdownVisible && filteredProvinces.length === 0 && (
                  <Text style={GlobalStyles.errorText}>No provinces found</Text>
                )}
              </View>
              {errors.province && (
                <Text style={GlobalStyles.errorText}>{errors.province}</Text>
              )}

              {renderLabel('City/Municipality', true)}
              <View style={{ position: 'relative' }}>
                <TextInput
                  ref={cityInputRef}
                  style={[GlobalStyles.input, errors.city && GlobalStyles.inputError]}
                  placeholder="Enter or Select City/Municipality"
                  placeholderTextColor={Theme.colors.placeholderColor}
                  onChangeText={(val) => handleChange('city', val)}
                  value={formData.city}
                  onFocus={handleCityFocus}
                  onBlur={handleCBlur}
                  blurOnSubmit={false}
                  autoComplete="address-level2"
                  textContentType="addressCity"
                  editable={canSubmit}
                />
                {isCityDropdownVisible && filteredCities.length > 0 && (
                  <View style={styles.dropdownContainer}>
                    <ScrollView nestedScrollEnabled={true} keyboardShouldPersistTaps="always">
                      {filteredCities.map((item) => (
                        <TouchableOpacity
                          key={item.city_code}
                          style={styles.dropdownItem}
                          onPress={() => handleCitySelect(item.city_name)}
                        >
                          <Text style={styles.dropdownItemText}>{item.city_name}</Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>
                )}
                {isCityDropdownVisible && filteredCities.length === 0 && (
                  <Text style={GlobalStyles.errorText}>No cities found</Text>
                )}
              </View>
              {errors.city && (
                <Text style={GlobalStyles.errorText}>{errors.city}</Text>
              )}

              {renderLabel('Barangay', true)}
              <View style={{ position: 'relative' }}>
                <TextInput
                  ref={barangayInputRef}
                  style={[GlobalStyles.input, errors.barangay && GlobalStyles.inputError]}
                  placeholder="Enter or Select Barangay"
                  placeholderTextColor={Theme.colors.placeholderColor}
                  onChangeText={(val) => handleChange('barangay', val)}
                  value={formData.barangay}
                  onFocus={handleBarangayFocus}
                  onBlur={handleBBlur}
                  blurOnSubmit={false}
                  autoComplete="address-level3"
                  editable={canSubmit}
                />
                {isBarangayDropdownVisible && filteredBarangays.length > 0 && (
                  <View style={styles.dropdownContainer}>
                    <ScrollView nestedScrollEnabled={true} keyboardShouldPersistTaps="always">
                      {filteredBarangays.map((item) => (
                        <TouchableOpacity
                          key={item.brgy_code}
                          style={styles.dropdownItem}
                          onPress={() => handleBarangaySelect(item.brgy_name)}
                        >
                          <Text style={styles.dropdownItemText}>{item.brgy_name}</Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>
                )}
                {isBarangayDropdownVisible && filteredBarangays.length === 0 && (
                  <Text style={GlobalStyles.errorText}>No barangays found</Text>
                )}
              </View>
              {errors.barangay && (
                <Text style={GlobalStyles.errorText}>{errors.barangay}</Text>
              )}

              {renderLabel('Blk/Lot/Unit #', true)}
              <TextInput
                style={[GlobalStyles.input, errors.street && GlobalStyles.inputError]}
                placeholder="(e.g. 1234 Singkamas St.)"
                placeholderTextColor={Theme.colors.placeholderColor}
                onChangeText={(val) => handleChange('street', val)}
                value={formData.street}
                autoComplete="street-address"
                textContentType="streetAddressLine1"
                editable={canSubmit}
              />
              {errors.street && (
                <Text style={GlobalStyles.errorText}>{errors.street}</Text>
              )}

              {renderLabel('Facebook Link', false)}
              <TextInput
                style={[GlobalStyles.input, errors.facebookLink && GlobalStyles.inputError]}
                placeholder="Facebook Link"
                placeholderTextColor={Theme.colors.placeholderColor}
                onChangeText={(val) => handleChange('facebookLink', val)}
                value={formData.facebookLink}
                keyboardType="url"
                autoComplete="url"
                textContentType="URL"
                editable={canSubmit}
              />
              {errors.facebookLink && (
                <Text style={GlobalStyles.errorText}>{errors.facebookLink}</Text>
              )}

              {renderLabel('Upload Donation Image', false)}
              <TouchableOpacity
                style={[GlobalStyles.imageUpload, { borderColor: image ? Theme.colors.primary : '#605D67' }]}
                onPress={pickImage}
                disabled={!canSubmit}
              >
                <Text style={[GlobalStyles.imageUploadText, { color: image ? Theme.colors.black : Theme.colors.primary }]}>
                  {image ? 'Image Selected' : 'Tap to Upload Image'}
                </Text>
              </TouchableOpacity>
            </View>
            <View style={{ marginHorizontal: 15, marginBottom: 10 }}>
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

      <CustomModal
        visible={modalVisible}
        title={modalConfig.title}
        message={modalConfig.message}
        onConfirm={modalConfig.onConfirm}
        confirmText={modalConfig.confirmText}
      />
    </SafeAreaView>
  );
};

export default CallForDonations;