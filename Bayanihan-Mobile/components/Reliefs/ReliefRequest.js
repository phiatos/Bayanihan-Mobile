import React, { useState } from 'react';
import { View, Text, TextInput, ScrollView, TouchableOpacity, Platform, Alert, FlatList } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useNavigation } from '@react-navigation/native';
import { useSidebar } from '../Sidebar/SidebarContext';
import ReliefRequestStyles from '../../styles/ReliefRequestStyles';
import { Picker } from '@react-native-picker/picker';


const ReportSubmission = () => {
  const { toggleSidebar } = useSidebar();
  const navigation = useNavigation();
  const [reportData, setReportData] = useState({
    reportID: '',
    location: '',
    timeOfIntervention: '',
    submittedBy: '',
    dateOfReport: null,
    operationDate: null,
    families: '',
    foodPacks: '',
    hotMeals: '',
    water: '',
    volunteers: '',
    amountRaised: '',
    inKindValue: '',
    urgentNeeds: '',
    remarks: '',
  });

  const categories = ['Food', 'Clothing', 'Medicine', 'Shelter', 'Water'];
  const [errors, setErrors] = useState([]);

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

  //Label for the Input
  const renderLabel = (label, isRequired) => (
    <Text style={ReliefRequestStyles.formTitle}>
      {label}
      {isRequired}
    </Text>
  );

  const handleChange = (field, value) => {
    setReportData({ ...reportData, [field]: value });
    if (value.trim() !== '') {
      setErrors((prev) => prev.filter((err) => err !== field));
    }
  };
  
  //Add Item
  const [items, setItems] = useState([]);
  const addButton = ()=>{
const { donationCategory, itemName, quantity, notes } = reportData;

  if (!donationCategory || !itemName || !quantity || !notes) {
    Alert.alert('Missing Fields', 'Please fill out all item fields before adding.');
    return;
  }

  const newItem = { donationCategory, itemName, quantity, notes };
  setItems([...items, newItem]);

  Alert.alert('Item Saved', `Saved:\nCategory: ${donationCategory}\nItem: ${itemName}\nQty: ${quantity}\nNotes: ${notes}`);

        setReportData(prev => ({
        ...prev,
        donationCategory: '',
        itemName: '',
        quantity: '',
        notes: ''
      }));
  };

    //Submit Button
  const handleSubmit = () => {
  
  const missingFields = requiredFields.filter((field) => {
    if (field === 'donationCategory' || field === 'itemName' || field === 'quantity' || field === 'notes') {
      return false;
    }
    const value = reportData[field];
    return value === null || (typeof value === 'string' && value.trim() === '');
  });

  if (missingFields.length > 0) {
    setErrors(missingFields);
    Alert.alert(
      'Missing Required Fields',
      `Please fill in the following required fields: ${missingFields
        .map((field) => field.replace(/([A-Z])/g, ' $1').toLowerCase())
        .join(', ')}`,
    );
    return;
  }

  navigation.navigate('ReliefSummary', { reportData, addedItems: items });
};

  return (
    <ScrollView contentContainerStyle={ReliefRequestStyles.container}>
      <TouchableOpacity style={ReliefRequestStyles.menu} onPress={toggleSidebar}>
        <Icon name="menu" size={24} color="#FFFFFF" />
      </TouchableOpacity>
      <Text styles={[ReliefRequestStyles.headertyle,GlobalStyle.globalDec ]}>Relief Request</Text>
      <Text style={ReliefRequestStyles.subheader}>[Organization Name]</Text>

      <View style={ReliefRequestStyles.form}>
        <View style={ReliefRequestStyles.section}>
          <Text style={[ReliefRequestStyles.sectionTitle,,GlobalStyle.globalDec]}>Contact Information</Text>

          {renderLabel('Contact Person', true)}
          <TextInput
            style={[ReliefRequestStyles.input, errors.includes('contactPerson') && ReliefRequestStyles.requiredInput]}
            placeholder="Enter Name of the Contact Person"
            onChangeText={(val) => handleChange('contactPerson', val)}
            value={reportData.contactPerson}
          />
          {renderLabel('Contact Number', true)}
          <TextInput
            style={[ReliefRequestStyles.input, errors.includes('contactNumber') && ReliefRequestStyles.requiredInput]}
            placeholder="Enter Mobile Number"
            onChangeText={(val) => handleChange('contactNumber', val)}
            value={reportData.contactNumber}
          />
          {renderLabel('Email', true)}
          <TextInput
            style={[ReliefRequestStyles.input, errors.includes('email') && ReliefRequestStyles.requiredInput]}
            placeholder="Enter Email"
            onChangeText={(val) => handleChange('email', val)}
            value={reportData.email}
          />
          {renderLabel('Exact Drop-off Address', true)}
          <TextInput
            style={[ReliefRequestStyles.input, errors.includes('dropoffAddress') && ReliefRequestStyles.requiredInput]}
            placeholder="Enter Barangay"
            onChangeText={(val) => handleChange('barangay', val)}
            value={reportData.barangay}
          />
          {renderLabel('City', true)}
          <TextInput
            style={[ReliefRequestStyles.input, errors.includes('city') && ReliefRequestStyles.requiredInput]}
            placeholder="Enter City"
            onChangeText={(val) => handleChange('city', val)}
            value={reportData.city}
          />
        </View>

        <View style={ReliefRequestStyles.section}>
          <Text style={ReliefRequestStyles.sectionTitle}>Requested Items</Text>
          
         <View style={ReliefRequestStyles.addButtonContainer}>
            <TouchableOpacity style={ReliefRequestStyles.addButton} onPress={addButton}>
              <Text style={ReliefRequestStyles.addbuttonText}>Add Item</Text>
            </TouchableOpacity>
          </View>


           {renderLabel('Donation Category', true)}
          <TextInput
            style={[ReliefRequestStyles.input, errors.includes('donationCategory') && ReliefRequestStyles.requiredInput]}
            placeholder="Enter Item Name"
            onChangeText={(val) => handleChange('donationCategory', val)}
            value={reportData.donationCategory}
          />
          {renderLabel('Item Name ', true)}
          <TextInput
            style={[ReliefRequestStyles.input, errors.includes('itemName') && ReliefRequestStyles.requiredInput]}
            placeholder="Enter Item Name"
            onChangeText={(val) => handleChange('itemName', val)}
            value={reportData.itemName}
          />
          {renderLabel('Quantity', true)}
          <TextInput
            style={[ReliefRequestStyles.input, errors.includes('quantity') && ReliefRequestStyles.requiredInput]}
            placeholder="Enter Quantity"
            onChangeText={(val) => handleChange('quantity', val)}
            value={reportData.quantity}
          />
          {renderLabel('Additional Notes', true)}
          <TextInput
            style={[ReliefRequestStyles.input, errors.includes('notes') && ReliefRequestStyles.requiredInput]}
            placeholder="Enter Additional Notes/ Concerns"
            onChangeText={(val) => handleChange('notes', val)}
            value={reportData.notes}
          />
          {items.length > 0 && (
          <View style={{ marginTop: 20 }}>
            <Text style={{ fontWeight: 'bold' }}>Added Items:</Text>
            {items.map((item, index) => (
              <Text key={index}>
                {index + 1}. {item.donationCategory} - {item.itemName} x{item.quantity}
              </Text>
            ))}
          </View>
        )}
          
        </View>
        <TouchableOpacity style={ReliefRequestStyles.button} onPress={handleSubmit}>
          <Text style={ReliefRequestStyles.buttonText}>Submit</Text>
        </TouchableOpacity>

      </View>
    </ScrollView>
  );
};

export default ReportSubmission;