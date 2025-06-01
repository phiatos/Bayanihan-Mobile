import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Dimensions,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import GlobalStyles from '../styles/GlobalStyles';
import ReliefRequestStyles from '../styles/ReliefRequestStyles';

const ReliefRequestScreen = ({ navigation, route }) => {
  const [errors, setErrors] = useState({});
  const [reportData, setReportData] = useState({
    contactPerson: '',
    contactNumber: '',
    email: '',
    address: '',
    city: '',
    donationCategory: '',
    itemName: '',
    quantity: '',
    notes: '',
  });
  const [items, setItems] = useState([]);
  const [isCategoryDropdownVisible, setIsCategoryDropdownVisible] = useState(false);
  const [filteredCategories, setFilteredCategories] = useState(categories);
  const [isItemDropdownVisible, setIsItemDropdownVisible] = useState(false);
  const [filteredItems, setFilteredItems] = useState([]);
  const categoryInputRef = useRef(null);
  const itemInputRef = useRef(null);
  const flatListRef = useRef(null);

  useEffect(() => {
    if (route.params?.reportData) {
      setReportData(route.params.reportData);
    }
    if (route.params?.addedItems) {
      setItems(route.params.addedItems);
    }
    if (route.params?.reportData?.donationCategory) {
      setFilteredItems(itemSuggestions[route.params.reportData.donationCategory] || []);
    }
    setFilteredCategories(categories);
  }, [route.params]);

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
      if (value.trim() === '') {
        setFilteredCategories(categories);
        setIsCategoryDropdownVisible(true);
      } else {
        const filtered = categories.filter((category) =>
          category.toLowerCase().includes(value.toLowerCase())
        );
        setFilteredCategories(filtered);
        setIsCategoryDropdownVisible(true);
      }
      setReportData((prevData) => ({ ...prevData, itemName: '' }));
      setFilteredItems(itemSuggestions[value] || []);
    }

    if (field === 'itemName' && reportData.donationCategory) {
      const suggestions = itemSuggestions[reportData.donationCategory] || [];
      if (value.trim() === '') {
        setFilteredItems(suggestions);
        setIsItemDropdownVisible(true);
      } else {
        const filtered = suggestions.filter((item) =>
          item.toLowerCase().includes(value.toLowerCase())
        );
        setFilteredItems(filtered);
        setIsItemDropdownVisible(true);
      }
    }
  };

  const handleCategorySelect = (category) => {
    setReportData((prevData) => ({ ...prevData, donationCategory: category, itemName: '' }));
    setIsCategoryDropdownVisible(false);
    setErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors.donationCategory;
      return newErrors;
    });
    setFilteredItems(itemSuggestions[category] || []);
    categoryInputRef.current?.blur();
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
  };

  const handleCategoryFocus = () => {
    setIsCategoryDropdownVisible(true);
    setFilteredCategories(categories);
    scrollToInput('donationCategory');
  };

  const handleItemFocus = () => {
    if (reportData.donationCategory) {
      setIsItemDropdownVisible(true);
      setFilteredItems(itemSuggestions[reportData.donationCategory] || []);
    }
    scrollToInput('itemName');
  };

  const handleBlur = (setDropdownVisible) => {
    setTimeout(() => setDropdownVisible(false), 200);
  };

  // Updated scrollToInput to use scrollToIndex
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
      Alert.alert('Incomplete Fields', 'Please fill out all required item fields before adding.');
      return;
    }

    const newItem = {
      donationCategory: reportData.donationCategory,
      itemName: reportData.itemName,
      quantity: reportData.quantity,
      notes: reportData.notes || '',
    };
    setItems([...items, newItem]);
    Alert.alert(
      'Item Saved',
      `Saved:\nCategory: ${newItem.donationCategory}\nItem: ${newItem.itemName}\nQty: ${newItem.quantity}\nNotes: ${newItem.notes || 'None'}`
    );

    setReportData((prev) => ({
      ...prev,
      itemName: '',
      quantity: '',
      notes: '',
    }));
    setIsItemDropdownVisible(false);
    setErrors({});
  };

  const handleDeleteItem = (index) => {
    setItems(items.filter((_, i) => i !== index));
    Alert.alert('Item Deleted', 'The item has been removed from the list.');
  };

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
      Alert.alert('Incomplete Data', `Please fill in required contact fields:\n${Object.values(newErrors).join('\n')}`);
      return;
    }

    if (items.length === 0) {
      Alert.alert('No Items Added', 'Please add at least one item to the request.');
      return;
    }

    navigation.navigate('ReliefSummary', { reportData, addedItems: items });
  };

  const renderLabel = (label, isRequired) => (
    <Text style={ReliefRequestStyles.formTitle}>
      {label}
      {isRequired && <Text style={{ color: 'red' }}> *</Text>}
    </Text>
  );

  const windowHeight = Dimensions.get('window').height;
  const maxDropdownHeight = windowHeight * 0.3;

  const formSections = [
    {
      id: 'contact',
      render: () => (
        <View style={ReliefRequestStyles.section}>
          <Text style={ReliefRequestStyles.sectionTitle}>Contact Information</Text>

          {renderLabel('Contact Person', true)}
          <View>
            <TextInput
              style={[ReliefRequestStyles.input, errors.contactPerson && ReliefRequestStyles.requiredInput]}
              placeholder="Enter Name of the Contact Person"
              onChangeText={(val) => handleChange('contactPerson', val)}
              value={reportData.contactPerson}
              onFocus={() => scrollToInput('contactPerson')}
            />
          </View>
          {errors.contactPerson && (
            <Text style={ReliefRequestStyles.errorText}>{errors.contactPerson}</Text>
          )}

          {renderLabel('Contact Number', true)}
          <View>
            <TextInput
              style={[ReliefRequestStyles.input, errors.contactNumber && ReliefRequestStyles.requiredInput]}
              placeholder="Enter Mobile Number"
              onChangeText={(val) => handleChange('contactNumber', val)}
              value={reportData.contactNumber}
              keyboardType="numeric"
              onFocus={() => scrollToInput('contactNumber')}
            />
          </View>
          {errors.contactNumber && (
            <Text style={ReliefRequestStyles.errorText}>{errors.contactNumber}</Text>
          )}

          {renderLabel('Email', true)}
          <View>
            <TextInput
              style={[ReliefRequestStyles.input, errors.email && ReliefRequestStyles.requiredInput]}
              placeholder="Enter Email"
              onChangeText={(val) => handleChange('email', val)}
              value={reportData.email}
              keyboardType="email-address"
              onFocus={() => scrollToInput('email')}
            />
          </View>
          {errors.email && <Text style={ReliefRequestStyles.errorText}>{errors.email}</Text>}

          {renderLabel('Exact Drop-off Address', true)}
          <View>
            <TextInput
              style={[ReliefRequestStyles.input, errors.address && ReliefRequestStyles.requiredInput]}
              placeholder="Enter Drop-Off Address"
              onChangeText={(val) => handleChange('address', val)}
              value={reportData.address}
              onFocus={() => scrollToInput('address')}
            />
          </View>
          {errors.address && <Text style={ReliefRequestStyles.errorText}>{errors.address}</Text>}

          {renderLabel('City', true)}
          <View>
            <TextInput
              style={[ReliefRequestStyles.input, errors.city && ReliefRequestStyles.requiredInput]}
              placeholder="Enter City"
              onChangeText={(val) => handleChange('city', val)}
              value={reportData.city}
              onFocus={() => scrollToInput('city')}
            />
          </View>
          {errors.city && <Text style={ReliefRequestStyles.errorText}>{errors.city}</Text>}

          {renderLabel('Donation Category', true)}
          <View style={{ position: 'relative', zIndex: 2000 }}>
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
              <View style={[ReliefRequestStyles.dropdownContainer, { maxHeight: maxDropdownHeight, zIndex: 2000 }]}>
                <FlatList
                  data={filteredCategories}
                  keyExtractor={(item) => item}
                  nestedScrollEnabled
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
      ),
    },
    {
      id: 'items',
      render: () => (
        <View style={[ReliefRequestStyles.section, { zIndex: 1000 }]}>
          <Text style={ReliefRequestStyles.sectionTitle}>Requested Items</Text>

          {renderLabel('Item Name', true)}
          <View style={{ position: 'relative', zIndex: 1500 }}>
            <TextInput
              ref={itemInputRef}
              style={[ReliefRequestStyles.input, errors.itemName && ReliefRequestStyles.requiredInput]}
              placeholder="Enter or Select Item Name"
              onChangeText={(val) => handleChange('itemName', val)}
              value={reportData.itemName}
              onFocus={handleItemFocus}
              onBlur={() => handleBlur(setIsItemDropdownVisible)}
              editable={!!reportData.donationCategory}
            />
            {!reportData.donationCategory && (reportData.itemName || errors.itemName) && (
              <Text style={ReliefRequestStyles.errorText}>Please select a Donation Category first.</Text>
            )}
            {isItemDropdownVisible && filteredItems.length > 0 && (
              <View style={[ReliefRequestStyles.dropdownContainer, { maxHeight: maxDropdownHeight, zIndex: 1500 }]}>
                <FlatList
                  data={filteredItems}
                  keyExtractor={(item) => item}
                  nestedScrollEnabled
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
          <View>
            <TextInput
              style={[ReliefRequestStyles.input, errors.quantity && ReliefRequestStyles.requiredInput]}
              placeholder="Enter Quantity"
              onChangeText={(val) => handleChange('quantity', val)}
              value={reportData.quantity}
              keyboardType="numeric"
              onFocus={() => scrollToInput('quantity')}
            />
          </View>
          {errors.quantity && <Text style={ReliefRequestStyles.errorText}>{errors.quantity}</Text>}

          {renderLabel('Additional Notes', false)}
          <View>
            <TextInput
              style={[
                ReliefRequestStyles.input,
                ReliefRequestStyles.textArea,
                errors.notes && ReliefRequestStyles.requiredInput,
              ]}
              placeholder="Enter Notes/Concerns (Optional)"
              // multiline
              // numberOfLines={4}
              onChangeText={(val) => handleChange('notes', val)}
              value={reportData.notes}
              onFocus={() => scrollToInput('notes')}
            />
          </View>
          {errors.notes && <Text style={ReliefRequestStyles.errorText}>{errors.notes}</Text>}

          <View style={ReliefRequestStyles.addButtonContainer}>
            <TouchableOpacity style={ReliefRequestStyles.addButton} onPress={addButton}>
              <Text style={ReliefRequestStyles.addbuttonText}>Add Item</Text>
            </TouchableOpacity>
          </View>

          {items.length > 0 && (
            <View style={{ marginTop: 20 }}>
              <Text style={ReliefRequestStyles.addedItems}>Added Items:</Text>
              <View style={ReliefRequestStyles.tableRow}>
                <Text style={[ReliefRequestStyles.tableHeader, { flex: 0.1 }]}>No.</Text>
                <Text style={[ReliefRequestStyles.tableHeader, { flex: 0.25 }]}>Item</Text>
                <Text style={[ReliefRequestStyles.tableHeader, { flex: 0.15 }]}>Qty</Text>
                <Text style={[ReliefRequestStyles.tableHeader, { flex: 0.25 }]}>Notes</Text>
                <Text style={[ReliefRequestStyles.tableHeader, { flex: 0.15 }]}>Actions</Text>
              </View>
              <FlatList
                data={items}
                keyExtractor={(_, index) => index.toString()}
                nestedScrollEnabled
                renderItem={({ item, index }) => (
                  <View style={ReliefRequestStyles.tableRow}>
                    <Text style={[ReliefRequestStyles.tableCell, { flex: 0.1 }]}>{index + 1}</Text>
                    <Text style={[ReliefRequestStyles.tableCell, { flex: 0.25 }]}>{item.itemName}</Text>
                    <Text style={[ReliefRequestStyles.tableCell, { flex: 0.15 }]}>{item.quantity}</Text>
                    <Text style={[ReliefRequestStyles.tableCell, { flex: 0.25 }]}>{item.notes || 'None'}</Text>
                    <View style={[ReliefRequestStyles.tableCell, { flex: 0.15 }]}>
                      <TouchableOpacity onPress={() => handleDeleteItem(index)}>
                        <Ionicons name="trash-outline" size={20} color="#FF0000" />
                      </TouchableOpacity>
                    </View>
                  </View>
                )}
              />
            </View>
          )}
        </View>
      ),
    },
    {
      id: 'submit',
      render: () => (
        <TouchableOpacity style={ReliefRequestStyles.button} onPress={handleSubmit}>
          <Text style={ReliefRequestStyles.buttonText}>Next</Text>
        </TouchableOpacity>
      ),
    },
  ];

  return (
    <View style={ReliefRequestStyles.container}>
      <View style={GlobalStyles.headerContainer}>
        <TouchableOpacity
          onPress={() => navigation.openDrawer()}
          style={GlobalStyles.headerMenuIcon}
        >
          <Ionicons name="menu" size={32} color="white" />
        </TouchableOpacity>
        <Text style={GlobalStyles.headerTitle}>Relief Request</Text>
      </View>

      <SafeAreaView style={{ flex: 1 }} edges={['left', 'right', 'bottom']}>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 80 : 20}
        >
          <FlatList
            ref={flatListRef}
            data={formSections}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => item.render()}
            contentContainerStyle={ReliefRequestStyles.contentContainer}
            keyboardShouldPersistTaps="handled"
            getItemLayout={(data, index) => ({
              length: 400, // Approximate height per section, adjust as needed
              offset: 400 * index,
              index,
            })}
            onScrollToIndexFailed={(info) => {
              // Fallback in case scrollToIndex fails
              flatListRef.current?.scrollToOffset({ offset: info.averageItemLength * info.index, animated: true });
            }}
          />
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
};

export default ReliefRequestScreen;