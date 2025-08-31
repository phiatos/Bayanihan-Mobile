import { Ionicons } from '@expo/vector-icons';
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
} from 'react-native';
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
      Animated.timing(fadeAnim).stop(); // Stop any ongoing animations
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

const ReliefRequestScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { user } = useAuth(); // Get user from AuthContext
  const { canSubmit, organizationName, modalVisible, setModalVisible, modalConfig, setModalConfig } = useOperationCheck();
  const [errors, setErrors] = useState({});
  const [reportData, setReportData] = useState({
    contactPerson: route.params?.reportData?.contactPerson || '',
    contactNumber: route.params?.reportData?.contactNumber || '',
    email: route.params?.reportData?.email || '',
    address: route.params?.reportData?.address || '',
    city: route.params?.reportData?.city || '',
    donationCategory: route.params?.reportData?.donationCategory || '',
    itemName: route.params?.reportData?.itemName || '',
    quantity: route.params?.reportData?.quantity || '',
    notes: route.params?.reportData?.notes || '',
  });
  const [items, setItems] = useState(route.params?.addedItems || []);
  const [isItemDropdownVisible, setIsItemDropdownVisible] = useState(false);
  const [filteredItems, setFilteredItems] = useState([]);
  const [toastVisible, setToastVisible] = useState(false);
  const [toastConfig, setToastConfig] = useState({
    title: '',
    message: '',
  });
  const itemInputRef = useRef(null);
  const flatListRef = useRef(null);
  const insets = useSafeAreaInsets();

  useEffect(() => {
    if (route.params?.reportData) {
      setReportData((prev) => ({
        ...prev,
        ...route.params.reportData,
        contactPerson: route.params.reportData.contactPerson || user?.contactPerson || prev.contactPerson,
        email: route.params.reportData.email || user?.email || prev.email,
      }));
    }
    if (route.params?.addedItems) {
      setItems(route.params.addedItems);
    }
    if (route.params?.reportData?.donationCategory) {
      setFilteredItems(itemSuggestions[route.params.reportData.donationCategory] || []);
    }
  }, [route.params, user]);

  const contactRequiredFields = [
    'contactPerson',
    'contactNumber',
    'email',
    'address',
    'city',
    'donationCategory',
  ];
  const itemInputRequiredFields = ['donationCategory', 'itemName', 'quantity'];

  const categories = ['Food', 'Clothing', 'Medicine', 'Shelter', 'Water'];
  const itemSuggestions = {
    Food: ['Rice', 'Canned Goods', 'Noodles', 'Biscuits', 'Dried Fruits'],
    Clothing: ['Shirts', 'Pants', 'Jackets', 'Socks', 'Underwear'],
    Medicine: ['Painkillers', 'Antibiotics', 'Bandages', 'Antiseptics', 'Vitamins'],
    Shelter: ['Tents', 'Blankets', 'Sleeping Bags', 'Tarps', 'Pillows'],
    Water: ['Bottled Water', 'Water Filters', 'Water Jugs', 'Purification Tablets'],
  };

  const capitalizeFirstLetter = (string) => {
    if (!string) return string;
    return string.charAt(0).toUpperCase() + string.slice(1);
  };

  const handleChange = (field, value) => {
    setReportData((prevData) => ({ ...prevData, [field]: value }));

    if (value.trim() !== '') {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }

    if (field === 'contactNumber') {
      if (value && !/^[0-9]{11}$/.test(value)) {
        setErrors((prev) => ({ ...prev, contactNumber: 'Phone number must be 11 digits' }));
      } else {
        setErrors((prev) => {
          const newErrors = { ...prev };
          delete newErrors.contactNumber;
          return newErrors;
        });
      }
    } else if (field === 'email') {
      if (value && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(value)) {
        setErrors((prev) => ({ ...prev, email: 'Email is not valid' }));
      } else {
        setErrors((prev) => {
          const newErrors = { ...prev };
          delete newErrors.email;
          return newErrors;
        });
      }
    }

    if (field === 'donationCategory') {
      setReportData((prevData) => ({ ...prevData, itemName: '' }));
      setFilteredItems(itemSuggestions[value] || []);
      setIsItemDropdownVisible(false);
    }

    if (field === 'itemName' && reportData.donationCategory) {
      const suggestions = itemSuggestions[reportData.donationCategory] || [];
      if (value.trim() === '') {
        setFilteredItems(suggestions);
        setIsItemDropdownVisible(false);
      } else {
        const filtered = suggestions.filter((item) =>
          item.toLowerCase().includes(value.toLowerCase())
        );
        setFilteredItems(filtered);
        setIsItemDropdownVisible(true);
      }
    }
  };

  const handleItemSelect = (item) => {
    setReportData((prevData) => ({ ...prevData, itemName: item }));
    setIsItemDropdownVisible(false);
    setErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors.itemName;
      return newErrors;
    });
    itemInputRef.current?.blur();
    setTimeout(() => {
      itemInputRef.current?.focus();
    }, 0);
  };

  const handleItemFocus = () => {
    if (reportData.donationCategory) {
      setIsItemDropdownVisible(true);
      setFilteredItems(itemSuggestions[reportData.donationCategory] || []);
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
      address: 0,
      city: 0,
      donationCategory: 0,
      itemName: 1,
      quantity: 1,
      notes: 1,
    };
    const index = sectionMap[field] || 0;
    if (flatListRef.current) {
      flatListRef.current.scrollToIndex({ index, animated: true });
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
      donationCategory: reportData.donationCategory,
      itemName: reportData.itemName,
      quantity: reportData.quantity,
      notes: reportData.notes || '',
    };
    setItems([...items, newItem]);
    setModalConfig({
      title: 'Item Saved',
      message: `Saved:\nCategory: ${newItem.donationCategory}\nItem: ${newItem.itemName}\nQuantity: ${newItem.quantity}\nNotes: ${newItem.notes || 'None'}`,
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

    contactRequiredFields.forEach((field) => {
      const value = reportData[field];
      if (value === null || (typeof value === 'string' && value.trim() === '')) {
        const fieldName = field.replace(/([A-Z])/g, ' $1').trim();
        newErrors[field] = `${capitalizeFirstLetter(fieldName)} is required`;
      } else {
        allRequiredBlank = false;
      }
    });

    if (reportData.contactNumber && !/^[0-9]{11}$/.test(reportData.contactNumber)) {
      newErrors.contactNumber = 'Phone number must be 11 digits';
    }

    if (reportData.email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(reportData.email)) {
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

    navigation.navigate('ReliefSummary', { reportData, addedItems: items, organizationName }); // Added organizationName
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
        >
          <View style={GlobalStyles.form}>
            <View style={GlobalStyles.section}>
              <Text style={styles.sectionTitle}>Contact Information</Text>

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
              {errors.contactPerson && (
                <Text style={GlobalStyles.errorText}>{errors.contactPerson}</Text>
              )}

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
              {errors.contactNumber && (
                <Text style={GlobalStyles.errorText}>{errors.contactNumber}</Text>
              )}

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

              {renderLabel('Exact Drop-off Address', true)}
              <View>
                <TextInput
                  style={[GlobalStyles.input, errors.address && GlobalStyles.inputError]}
                  placeholder="Enter Drop-Off Address"
                  placeholderTextColor={Theme.colors.placeholderColor}
                  onChangeText={(val) => handleChange('address', val)}
                  value={reportData.address}
                />
              </View>
              {errors.address && <Text style={GlobalStyles.errorText}>{errors.address}</Text>}

              {renderLabel('City', true)}
              <View>
                <TextInput
                  style={[GlobalStyles.input, errors.city && GlobalStyles.inputError]}
                  placeholder="Enter City"
                  placeholderTextColor={Theme.colors.placeholderColor}
                  onChangeText={(val) => handleChange('city', val)}
                  value={reportData.city}
                />
              </View>
              {errors.city && <Text style={GlobalStyles.errorText}>{errors.city}</Text>}

              {renderLabel('Donation Category', true)}
              <View style={[GlobalStyles.input, styles.pickerContainer, errors.donationCategory && GlobalStyles.inputError]}>
                <Dropdown
                  style={{ padding: 10, width: '100%' }}
                  placeholderStyle={{ fontFamily: 'Poppins_Regular', color: '#777', fontSize: 14 }}
                  selectedTextStyle={{ fontFamily: 'Poppins_Regular', fontSize: 14 }}
                  itemTextStyle={{ fontFamily: 'Poppins_Regular', fontSize: 14, color: Theme.colors.black }}
                  data={categories.map((c) => ({ label: c, value: c }))}
                  labelField="label"
                  valueField="value"
                  placeholder="Select Category"
                  value={reportData.donationCategory}
                  onChange={(item) => handleChange('donationCategory', item.value)}
                />
              </View>
              {errors.donationCategory && (
                <Text style={GlobalStyles.errorText}>{errors.donationCategory}</Text>
              )}
            </View>

            <View style={[GlobalStyles.section, { zIndex: 1000 }]}>
              <Text style={styles.sectionTitle}>Requested Items</Text>

              {renderLabel('Item Name', true)}
              <View style={{ position: 'relative', zIndex: 1500 }}>
                <TextInput
                  ref={itemInputRef}
                  placeholder="Select or Type Item"
                  placeholderTextColor={Theme.colors.placeholderColor}
                  value={reportData.itemName}
                  onChangeText={(val) => {
                    handleChange('itemName', val);
                  }}
                  onFocus={handleItemFocus}
                  onBlur={handleBlur}
                  editable={!!reportData.donationCategory && canSubmit}
                  style={[GlobalStyles.input, errors.itemName && GlobalStyles.inputError]}
                />
                {!reportData.donationCategory && (reportData.itemName || errors.itemName) && (
                  <Text style={GlobalStyles.errorText}>Please select a Donation Category first.</Text>
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
                  editable={!!reportData.donationCategory && canSubmit}
                />
                {!reportData.donationCategory && (reportData.quantity || errors.quantity) && (
                  <Text style={GlobalStyles.errorText}>Please select a Donation Category first.</Text>
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
                  editable={!!reportData.donationCategory && canSubmit}
                />
                {!reportData.donationCategory && reportData.notes && (
                  <Text style={GlobalStyles.errorText}>Please select a Donation Category first.</Text>
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
                              <Text style={styles.tableCell}>{item.itemName}</Text>
                            </View>
                            <View style={[styles.cell, { minWidth: 100 }]}>
                              <Text style={styles.tableCell}>{item.quantity}</Text>
                            </View>
                            <View style={[styles.cell, { minWidth: 150, flex: 1 }]}>
                              <Text
                                style={styles.tableCell}
                                numberOfLines={100}
                                ellipsizeMode="tail"
                              >
                                {item.notes || 'None'}
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