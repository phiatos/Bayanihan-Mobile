import React, { useState, useRef } from 'react';
import { View, Text, TextInput, ScrollView, TouchableOpacity, Alert, FlatList, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import ReliefRequestStyles from '../styles/ReliefRequestStyles';

const ReliefRequestScreen = () => {
  const navigation = useNavigation();
  const [errors, setErrors] = useState({});
  const [reportData, setReportData] = useState({
    contactPerson: '',
    contactNumber: '',
    email: '',
    barangay: '',
    city: '',
    donationCategory: '',
    itemName: '',
    quantity: '',
    notes: '',
  });

  // States for dropdown
  const [isDropdownVisible, setIsDropdownVisible] = useState(false);
  const [filteredCategories, setFilteredCategories] = useState([]);
  const textInputRef = useRef(null);

  const requiredFields = [
    'contactPerson',
    'contactNumber',
    'email',
    'barangay',
    'city',
    'donationCategory',
    'itemName',
    'quantity',
    'notes',
  ];

  // Predetermined categories
  const categories = ['Food', 'Clothing', 'Medicine', 'Shelter', 'Water'];

  // Helper function to capitalize the first letter
  const capitalizeFirstLetter = (string) => {
    if (!string) return string;
    return string.charAt(0).toUpperCase() + string.slice(1);
  };

  // Handle TextInput changes and filter categories
  const handleChange = (field, value) => {
    setReportData({ ...reportData, [field]: value });

    // Clear error if the field has a valid value
    if (value.trim() !== '') {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }

    // Validate specific fields in real-time with capitalized messages
    if (field === 'contactNumber' && value && !/^[0-9]{11}$/.test(value)) {
      setErrors((prev) => ({ ...prev, contactNumber: 'Phone number must be 11 digits' }));
    } else if (field === 'email' && value && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(value)) {
      setErrors((prev) => ({ ...prev, email: 'Email is not valid' }));
    }

    // Filter categories for donationCategory
    if (field === 'donationCategory') {
      if (value.trim() === '') {
        setFilteredCategories(categories);
        setIsDropdownVisible(false);
      } else {
        const filtered = categories.filter((category) =>
          category.toLowerCase().includes(value.toLowerCase())
        );
        setFilteredCategories(filtered);
        setIsDropdownVisible(true);
      }
    }
  };

  // Handle selecting a category from the dropdown
  const handleCategorySelect = (category) => {
    setReportData({ ...reportData, donationCategory: category });
    setIsDropdownVisible(false);
    setErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors.donationCategory;
      return newErrors;
    });
    textInputRef.current.blur(); // Close keyboard
  };

  // Handle TextInput focus
  const handleFocus = () => {
    setIsDropdownVisible(true);
    setFilteredCategories(categories);
  };

  // Handle TextInput blur
  const handleBlur = () => {
    // Delay hiding dropdown to allow category selection
    setTimeout(() => setIsDropdownVisible(false), 200);
  };

  // Update handleSubmit
  const handleSubmit = () => {
    const newErrors = {};

    // Check for missing required fields with capitalized messages
    requiredFields.forEach((field) => {
      if (['donationCategory', 'itemName', 'quantity', 'notes'].includes(field)) {
        return; // Skip item-related fields for this validation
      }
      const value = reportData[field];
      if (value === null || (typeof value === 'string' && value.trim() === '')) {
        const fieldName = field.replace(/([A-Z])/g, ' $1').trim();
        newErrors[field] = `${capitalizeFirstLetter(fieldName)} is required`;
      }
    });

    // Validate contact number
    if (reportData.contactNumber && !/^[0-9]{11}$/.test(reportData.contactNumber)) {
      newErrors.contactNumber = 'Phone number must be 11 digits';
    }

    // Validate email
    if (reportData.email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(reportData.email)) {
      newErrors.email = 'Email is not valid';
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      Alert.alert(
        'Form Error',
        `Please fix the following errors:\n${Object.values(newErrors).join('\n')}`
      );
      return;
    }

    navigation.navigate('ReliefSummary', { reportData, addedItems: items });
  };

  // Render label function
  const renderLabel = (label, isRequired) => (
    <Text style={ReliefRequestStyles.formTitle}>
      {label}
      {isRequired}
    </Text>
  );

  // Add item function
  const [items, setItems] = useState([]);
  const addButton = () => {
    const { donationCategory, itemName, quantity, notes } = reportData;
    if (!donationCategory || !itemName || !quantity || !notes) {
      const newErrors = {};
      if (!donationCategory) newErrors.donationCategory = 'Donation category is required';
      if (!itemName) newErrors.itemName = 'Item name is required';
      if (!quantity) newErrors.quantity = 'Quantity is required';
      if (!notes) newErrors.notes = 'Additional notes is required';
      setErrors(newErrors);
      Alert.alert('Missing Fields', 'Please fill out all item fields before adding.');
      return;
    }
    const newItem = { donationCategory, itemName, quantity, notes };
    setItems([...items, newItem]);
    Alert.alert('Item Saved', `Saved:\nCategory: ${donationCategory}\nItem: ${itemName}\nQty: ${quantity}\nNotes: ${notes}`);
    setReportData((prev) => ({
      ...prev,
      donationCategory: '',
      itemName: '',
      quantity: '',
      notes: '',
    }));
    setIsDropdownVisible(false);
  };

  // Styles for dropdown
  const localStyles = StyleSheet.create({
    dropdownContainer: {
      position: 'absolute',
      top: 50, // Adjust based on TextInput height
      left: 0,
      right: 0,
      backgroundColor: '#fff',
      borderWidth: 1,
      borderColor: '#ccc',
      borderRadius: 5,
      maxHeight: 150,
      zIndex: 1000,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 5,
    },
    dropdownItem: {
      padding: 10,
      borderBottomWidth: 1,
      borderBottomColor: '#eee',
    },
    dropdownItemText: {
      fontSize: 16,
      color: '#333',
    },
  });


  return (
    <ScrollView style={ReliefRequestStyles.container}>
      <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
        <Text style={ReliefRequestStyles.header}>Relief Request</Text>
        <Text style={ReliefRequestStyles.subheader}>[Organization Name]</Text>

        <View style={ReliefRequestStyles.form}>
          <View style={ReliefRequestStyles.section}>
            <Text style={ReliefRequestStyles.sectionTitle}>Contact Information</Text>

            {renderLabel('Contact Person', true)}
            <TextInput
              style={[ReliefRequestStyles.input, errors.contactPerson && ReliefRequestStyles.requiredInput]}
              placeholder="Enter Name of the Contact Person"
              onChangeText={(val) => handleChange('contactPerson', val)}
              value={reportData.contactPerson}
            />
            {errors.contactPerson && (
              <Text style={ReliefRequestStyles.errorText}>{errors.contactPerson}</Text>
            )}

            {renderLabel('Contact Number', true)}
            <TextInput
              style={[ReliefRequestStyles.input, errors.contactNumber && ReliefRequestStyles.requiredInput]}
              placeholder="Enter Mobile Number"
              onChangeText={(val) => handleChange('contactNumber', val)}
              value={reportData.contactNumber}
              keyboardType="numeric"
            />
            {errors.contactNumber && (
              <Text style={ReliefRequestStyles.errorText}>{errors.contactNumber}</Text>
            )}

            {renderLabel('Email', true)}
            <TextInput
              style={[ReliefRequestStyles.input, errors.email && ReliefRequestStyles.requiredInput]}
              placeholder="Enter Email"
              onChangeText={(val) => handleChange('email', val)}
              value={reportData.email}
              keyboardType="email-address"
            />
            {errors.email && <Text style={ReliefRequestStyles.errorText}>{errors.email}</Text>}

            {renderLabel('Exact Drop-off Address', true)}
            <TextInput
              style={[ReliefRequestStyles.input, errors.barangay && ReliefRequestStyles.requiredInput]}
              placeholder="Enter Barangay"
              onChangeText={(val) => handleChange('barangay', val)}
              value={reportData.barangay}
            />
            {errors.barangay && <Text style={ReliefRequestStyles.errorText}>{errors.barangay}</Text>}

            {renderLabel('City', true)}
            <TextInput
              style={[ReliefRequestStyles.input, errors.city && ReliefRequestStyles.requiredInput]}
              placeholder="Enter City"
              onChangeText={(val) => handleChange('city', val)}
              value={reportData.city}
            />
            {errors.city && <Text style={ReliefRequestStyles.errorText}>{errors.city}</Text>}
          </View>

          <View style={ReliefRequestStyles.section}>
            <Text style={ReliefRequestStyles.sectionTitle}>Requested Items</Text>

            <View style={ReliefRequestStyles.addButtonContainer}>
              <TouchableOpacity style={ReliefRequestStyles.addButton} onPress={addButton}>
                <Text style={ReliefRequestStyles.addbuttonText}>Add Item</Text>
              </TouchableOpacity>
            </View>

            {renderLabel('Donation Category', true)}
            <View style={{ position: 'relative' }}>
              <TextInput
                ref={textInputRef}
                style={[ReliefRequestStyles.input, errors.donationCategory && ReliefRequestStyles.requiredInput]}
                placeholder="Enter or Select Donation Category"
                onChangeText={(val) => handleChange('donationCategory', val)}
                value={reportData.donationCategory}
                onFocus={handleFocus}
                onBlur={handleBlur}
              />
              {isDropdownVisible && filteredCategories.length > 0 && (
                <View style={localStyles.dropdownContainer}>
                  <FlatList
                    data={filteredCategories}
                    keyExtractor={(item) => item}
                    renderItem={({ item }) => (
                      <TouchableOpacity
                        style={localStyles.dropdownItem}
                        onPress={() => handleCategorySelect(item)}
                      >
                        <Text style={localStyles.dropdownItemText}>{item}</Text>
                      </TouchableOpacity>
                    )}
                  />
                </View>
              )}
            </View>
            {errors.donationCategory && (
              <Text style={ReliefRequestStyles.errorText}>{errors.donationCategory}</Text>
            )}

            {renderLabel('Item Name', true)}
            <TextInput
              style={[ReliefRequestStyles.input, errors.itemName && ReliefRequestStyles.requiredInput]}
              placeholder="Enter Item Name"
              onChangeText={(val) => handleChange('itemName', val)}
              value={reportData.itemName}
            />
            {errors.itemName && <Text style={ReliefRequestStyles.errorText}>{errors.itemName}</Text>}

            {renderLabel('Quantity', true)}
            <TextInput
              style={[ReliefRequestStyles.input, errors.quantity && ReliefRequestStyles.requiredInput]}
              placeholder="Enter Quantity"
              onChangeText={(val) => handleChange('quantity', val)}
              value={reportData.quantity}
              keyboardType="numeric"
            />
            {errors.quantity && <Text style={ReliefRequestStyles.errorText}>{errors.quantity}</Text>}

            {renderLabel('Additional Notes', true)}
            <TextInput
              style={[ReliefRequestStyles.input, errors.notes && ReliefRequestStyles.requiredInput]}
              placeholder="Enter Additional Notes/ Concerns"
              multiline
              numberOfLines={4}
              onChangeText={(val) => handleChange('notes', val)}
              value={reportData.notes}
            />
            {errors.notes && <Text style={ReliefRequestStyles.errorText}>{errors.notes}</Text>}

            {items.length > 0 && (
              <View style={{ marginTop: 20 }}>
                <Text style={ReliefRequestStyles.addedItems}>Added Items:</Text>
                <View style={ReliefRequestStyles.tableRow}>
                  <Text style={[ReliefRequestStyles.tableHeader, { flex: 0.1 }]}>No.</Text>
                  <Text style={[ReliefRequestStyles.tableHeader, { flex: 0.3 }]}>Category</Text>
                  <Text style={[ReliefRequestStyles.tableHeader, { flex: 0.3 }]}>Item</Text>
                  <Text style={[ReliefRequestStyles.tableHeader, { flex: 0.4 }]}>Quantity</Text>
                </View>
                {items.map((item, index) => (
                  <View key={index} style={ReliefRequestStyles.tableRow}>
                    <Text style={[ReliefRequestStyles.tableCell, { flex: 0.1 }]}>{index + 1}</Text>
                    <Text style={[ReliefRequestStyles.tableCell, { flex: 0.3 }]}>{item.donationCategory}</Text>
                    <Text style={[ReliefRequestStyles.tableCell, { flex: 0.3 }]}>{item.itemName}</Text>
                    <Text style={[ReliefRequestStyles.tableCell, { flex: 0.4 }]}>{item.quantity}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>

          <TouchableOpacity style={ReliefRequestStyles.button} onPress={handleSubmit}>
            <Text style={ReliefRequestStyles.buttonText}>Next</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
    
  )
}

export default ReliefRequestScreen
