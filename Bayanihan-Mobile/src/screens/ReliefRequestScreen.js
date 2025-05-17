import React, { useState, useRef } from 'react';
import { View, Text, TextInput, ScrollView, TouchableOpacity, Alert, FlatList, SafeAreaView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import ReliefRequestStyles from '../styles/ReliefRequestStyles';
import CustomModal from '../navigation/CustomModal'; 

const ReliefRequestScreen = ({ navigation }) => {
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

  // States for dropdowns
  const [isCategoryDropdownVisible, setIsCategoryDropdownVisible] = useState(false);
  const [filteredCategories, setFilteredCategories] = useState([]);
  const [isItemDropdownVisible, setIsItemDropdownVisible] = useState(false);
  const [filteredItems, setFilteredItems] = useState([]);
  const categoryInputRef = useRef(null);
  const itemInputRef = useRef(null);

  // Contact info required fields
  const contactRequiredFields = [
    'contactPerson',
    'contactNumber',
    'email',
    'barangay',
    'city',
    'donationCategory',
  ];

  // Item required fields
  const itemRequiredFields = ['itemName', 'quantity'];

  // Predetermined categories and item suggestions
  const categories = ['Food', 'Clothing', 'Medicine', 'Shelter', 'Water'];
  const itemSuggestions = {
    Food: ['Rice', 'Canned Goods', 'Noodles', 'Biscuits', 'Dried Fruits'],
    Clothing: ['Shirts', 'Pants', 'Jackets', 'Socks', 'Underwear'],
    Medicine: ['Painkillers', 'Antibiotics', 'Bandages', 'Antiseptics', 'Vitamins'],
    Shelter: ['Tents', 'Blankets', 'Sleeping Bags', 'Tarps', 'Pillows'],
    Water: ['Bottled Water', 'Water Filters', 'Water Jugs', 'Purification Tablets'],
  };

  // Helper function to capitalize the first letter
  const capitalizeFirstLetter = (string) => {
    if (!string) return string;
    return string.charAt(0).toUpperCase() + string.slice(1);
  };

  // Check if contact info is valid
  const isContactInfoValid = () => {
    return contactRequiredFields.every((field) => {
      const value = reportData[field];
      if (value === null || (typeof value === 'string' && value.trim() === '')) {
        return false;
      }
      if (field === 'contactNumber' && !/^[0-9]{11}$/.test(value)) {
        return false;
      }
      if (field === 'email' && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(value)) {
        return false;
      }
      return true;
    });
  };

  // Handle TextInput changes
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

    // Validate contactNumber and email
    if (field === 'contactNumber' && value && !/^[0-9]{11}$/.test(value)) {
      setErrors((prev) => ({ ...prev, contactNumber: 'Phone number must be 11 digits' }));
    } else if (field === 'email' && value && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(value)) {
      setErrors((prev) => ({ ...prev, email: 'Email is not valid' }));
    }

    // Filter categories for donationCategory
    if (field === 'donationCategory') {
      if (value.trim() === '') {
        setFilteredCategories(categories);
        setIsCategoryDropdownVisible(false);
      } else {
        const filtered = categories.filter((category) =>
          category.toLowerCase().includes(value.toLowerCase())
        );
        setFilteredCategories(filtered);
        setIsCategoryDropdownVisible(true);
      }
      // Reset itemName and item dropdown when category changes
      setReportData((prev) => ({ ...prev, itemName: '' }));
      setFilteredItems(itemSuggestions[value] || []);
    }

    // Filter items for itemName
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

  // Handle selecting a category
  const handleCategorySelect = (category) => {
    setReportData({ ...reportData, donationCategory: category, itemName: '' });
    setIsCategoryDropdownVisible(false);
    setErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors.donationCategory;
      return newErrors;
    });
    setFilteredItems(itemSuggestions[category] || []);
    categoryInputRef.current.blur();
  };

  // Handle selecting an item
  const handleItemSelect = (item) => {
    setReportData({ ...reportData, itemName: item });
    setIsItemDropdownVisible(false);
    setErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors.itemName;
      return newErrors;
    });
    itemInputRef.current.blur();
  };

  // Handle category input focus
  const handleCategoryFocus = () => {
    setIsCategoryDropdownVisible(true);
    setFilteredCategories(categories);
  };

  // Handle item input focus
  const handleItemFocus = () => {
    if (reportData.donationCategory) {
      setIsItemDropdownVisible(true);
      setFilteredItems(itemSuggestions[reportData.donationCategory] || []);
    }
  };

  // Handle blur for both inputs
  const handleBlur = (setDropdownVisible) => {
    setTimeout(() => setDropdownVisible(false), 200);
  };

  // Handle form submission
  const handleSubmit = () => {
    const newErrors = {};
    contactRequiredFields.forEach((field) => {
      const value = reportData[field];
      if (value === null || (typeof value === 'string' && value.trim() === '')) {
        const fieldName = field.replace(/([A-Z])/g, ' $1').trim();
        newErrors[field] = `${capitalizeFirstLetter(fieldName)} is required`;
      }
    });
    if (reportData.contactNumber && !/^[0-9]{11}$/.test(reportData.contactNumber)) {
      newErrors.contactNumber = 'Phone number must be 11 digits';
    }
    if (reportData.email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(reportData.email)) {
      newErrors.email = 'Email is not valid';
    }
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) {
      Alert.alert('Incomplete Data', `Please fill in required fields:\n${Object.values(newErrors).join('\n')}`);
      return;
    }
    console.log('Navigating to ReliefSummary with:', { reportData, addedItems: items });
    navigation.navigate('ReliefSummary', { reportData, addedItems: items });
  };

  // Add item function
  const [items, setItems] = useState([]);
  const addButton = () => {
    const { donationCategory, itemName, quantity, notes } = reportData;
    if (!donationCategory || !itemName || !quantity) {
      const newErrors = {};
      if (!donationCategory) newErrors.donationCategory = 'Donation category is required';
      if (!itemName) newErrors.itemName = 'Item name is required';
      if (!quantity) newErrors.quantity = 'Quantity is required';
      setErrors(newErrors);
      Alert.alert('Incomplete Fields', 'Please fill out all required item fields before adding.');
      return;
    }
    const newItem = { itemName, quantity, notes: notes || '' };
    setItems([...items, newItem]);
    Alert.alert('Item Saved', `Saved:\nItem: ${itemName}\nQty: ${quantity}\nNotes: ${notes || 'None'}`);
    setReportData((prev) => ({
      ...prev,
      itemName: '',
      quantity: '',
      notes: '',
    }));
    setIsItemDropdownVisible(false);
  };

  // Render label function
  const renderLabel = (label, isRequired) => (
    <Text style={ReliefRequestStyles.formTitle}>
      {label}
      {isRequired}
    </Text>
  );

  // Check contact info validity for enabling item inputs
  const contactInfoValid = isContactInfoValid();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#FFF9F0' }}>
      <ScrollView contentContainerStyle={ReliefRequestStyles.container}>
        <View style={ReliefRequestStyles.header}>
          <TouchableOpacity
            onPress={() => navigation.openDrawer()}
            style={ReliefRequestStyles.menuIcon}
          >
            <Ionicons name="menu" size={32} color="white" />
          </TouchableOpacity>
          <Text style={ReliefRequestStyles.headerText}>Relief Request</Text>
        </View>

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

            {renderLabel('Donation Category', true)}
            <View style={{ position: 'relative' }}>
              <TextInput
                ref={categoryInputRef}
                style={[ReliefRequestStyles.input, errors.donationCategory && ReliefRequestStyles.requiredInput]}
                placeholder="Enter or Select Donation Category"
                onChangeText={(val) => handleChange('donationCategory', val)}
                value={reportData.donationCategory}
                onFocus={handleCategoryFocus}
                onBlur={() => handleBlur(setIsCategoryDropdownVisible)}
              />
              {isCategoryDropdownVisible && filteredCategories.length > 0 && (
                <View style={ReliefRequestStyles.dropdownContainer}>
                  <FlatList
                    data={filteredCategories}
                    keyExtractor={(item) => item}
                    renderItem={({ item }) => (
                      <TouchableOpacity
                        style={ReliefRequestStyles.dropdownItem}
                        onPress={() => handleCategorySelect(item)}
                      >
                        <Text style={ReliefRequestStyles.dropdownItemText}>{item}</Text>
                      </TouchableOpacity>
                    )}
                  />
                </View>
              )}
            </View>
            {errors.donationCategory && (
              <Text style={ReliefRequestStyles.errorText}>{errors.donationCategory}</Text>
            )}
          </View>

          <View style={ReliefRequestStyles.section}>
            <Text style={ReliefRequestStyles.sectionTitle}>Requested Items</Text>

            <View style={ReliefRequestStyles.addButtonContainer}>
              <TouchableOpacity
                style={[
                  ReliefRequestStyles.addButton,
                  !contactInfoValid && { opacity: 0.5 },
                ]}
                onPress={addButton}
                disabled={!contactInfoValid}
              >
                <Text style={ReliefRequestStyles.addbuttonText}>Add Item</Text>
              </TouchableOpacity>
            </View>

            {renderLabel('Item Name', true)}
            <View style={{ position: 'relative' }}>
              <TextInput
                ref={itemInputRef}
                style={[ReliefRequestStyles.input, errors.itemName && ReliefRequestStyles.requiredInput, !contactInfoValid && { opacity: 0.5 }]}
                placeholder="Enter or Select Item Name"
                onChangeText={(val) => handleChange('itemName', val)}
                value={reportData.itemName}
                onFocus={handleItemFocus}
                onBlur={() => handleBlur(setIsItemDropdownVisible)}
                editable={contactInfoValid}
              />
              {isItemDropdownVisible && filteredItems.length > 0 && (
                <View style={ReliefRequestStyles.dropdownContainer}>
                  <FlatList
                    data={filteredItems}
                    keyExtractor={(item) => item}
                    renderItem={({ item }) => (
                      <TouchableOpacity
                        style={ReliefRequestStyles.dropdownItem}
                        onPress={() => handleItemSelect(item)}
                      >
                        <Text style={ReliefRequestStyles.dropdownItemText}>{item}</Text>
                      </TouchableOpacity>
                    )}
                  />
                </View>
              )}
            </View>
            {errors.itemName && <Text style={ReliefRequestStyles.errorText}>{errors.itemName}</Text>}

            {renderLabel('Quantity', true)}
            <TextInput
              style={[ReliefRequestStyles.input, errors.quantity && ReliefRequestStyles.requiredInput, !contactInfoValid && { opacity: 0.5 }]}
              placeholder="Enter Quantity"
              onChangeText={(val) => handleChange('quantity', val)}
              value={reportData.quantity}
              keyboardType="numeric"
              editable={contactInfoValid}
            />
            {errors.quantity && <Text style={ReliefRequestStyles.errorText}>{errors.quantity}</Text>}

            {renderLabel('Additional Notes', false)}
            <TextInput
              style={[ReliefRequestStyles.input, errors.notes && ReliefRequestStyles.requiredInput, !contactInfoValid && { opacity: 0.5 }]}
              placeholder="Enter Notes/Concerns (Optional)"
              multiline
              numberOfLines={4}
              onChangeText={(val) => handleChange('notes', val)}
              value={reportData.notes}
              editable={contactInfoValid}
            />
            {errors.notes && <Text style={ReliefRequestStyles.errorText}>{errors.notes}</Text>}

            {items.length > 0 && (
              <View style={{ marginTop: 20 }}>
                <Text style={ReliefRequestStyles.addedItems}>Added Items:</Text>
                <View style={ReliefRequestStyles.tableRow}>
                  <Text style={[ReliefRequestStyles.tableHeader, { flex: 0.1 }]}>No.</Text>
                  <Text style={[ReliefRequestStyles.tableHeader, { flex: 0.25 }]}>Item</Text>
                  <Text style={[ReliefRequestStyles.tableHeader, { flex: 0.15 }]}>Qty</Text>
                  <Text style={[ReliefRequestStyles.tableHeader, { flex: 0.25 }]}>Notes</Text>
                </View>
                {items.map((item, index) => (
                  <View key={index} style={ReliefRequestStyles.tableRow}>
                    <Text style={[ReliefRequestStyles.tableCell, { flex: 0.1 }]}>{index + 1}</Text>
                    
                    <Text style={[ReliefRequestStyles.tableCell, { flex: 0.25 }]}>{item.itemName}</Text>
                    <Text style={[ReliefRequestStyles.tableCell, { flex: 0.15 }]}>{item.quantity}</Text>
                    <Text style={[ReliefRequestStyles.tableCell, { flex: 0.25 }]}>{item.notes || 'None'}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>

          <TouchableOpacity style={ReliefRequestStyles.button} onPress={handleSubmit}>
            <Text style={ReliefRequestStyles.buttonText}>Next</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default ReliefRequestScreen;