import React, { useState } from 'react';
import { View, Text, TextInput, ScrollView, TouchableOpacity, Platform, Alert } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import Icon from 'react-native-vector-icons/MaterialIcons';
import styles from '../../styles/ReportSubmissionStyles';
import { useNavigation } from '@react-navigation/native';
import { useSidebar } from '../Sidebar/SidebarContext';


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

  const [showDatePicker, setShowDatePicker] = useState({ field: '', visible: false });
  const [errors, setErrors] = useState([]);

  const requiredFields = [
    'reportID',
    'location',
    'timeOfIntervention',
    'submittedBy',
    'dateOfReport',
    'operationDate',
    'families',
    'foodPacks',
    'hotMeals',
    'water',
    'volunteers',
    'amountRaised',
    'inKindValue',
    'urgentNeeds',
    'remarks',
  ];

  const onChangeDate = (event, selectedDate) => {
    setShowDatePicker({ field: '', visible: false });
    if (selectedDate) {
      const field = showDatePicker.field;
      setReportData((prev) => ({
        ...prev,
        [field]: selectedDate,
      }));
      setErrors((prev) => prev.filter((err) => err !== field));
    }
  };

  const handleChange = (field, value) => {
    setReportData({ ...reportData, [field]: value });
    if (value.trim() !== '') {
      setErrors((prev) => prev.filter((err) => err !== field));
    }
  };

  const handleSubmit = () => {
    const missingFields = requiredFields.filter((field) => {
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

    navigation.navigate('ReportSummary', { reportData });
  };

  const renderLabel = (label, isRequired) => (
    <Text style={styles.formTitle}>
      {label}
      {isRequired}
    </Text>
  );

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <TouchableOpacity style={styles.menu} onPress={toggleSidebar}>
        <Icon name="menu" size={24} color="#FFFFFF" />
      </TouchableOpacity>
      <Text style={styles.header}>Reports Submission</Text>
      <Text style={styles.subheader}>[Organization Name]</Text>

      <View style={styles.form}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Basic Information</Text>

          {renderLabel('Report ID', true)}
          <TextInput
            style={[styles.input, errors.includes('reportID') && styles.requiredInput]}
            placeholder="Report ID"
            onChangeText={(val) => handleChange('reportID', val)}
            value={reportData.reportID}
          />
          {renderLabel('Location of Operation', true)}
          <TextInput
            style={[styles.input, errors.includes('location') && styles.requiredInput]}
            placeholder="Enter Location of Operation"
            onChangeText={(val) => handleChange('location', val)}
            value={reportData.location}
          />
          {renderLabel('Time of Intervention', true)}
          <TextInput
            style={[styles.input, errors.includes('timeOfIntervention') && styles.requiredInput]}
            placeholder="Enter Time of Intervention"
            onChangeText={(val) => handleChange('timeOfIntervention', val)}
            value={reportData.timeOfIntervention}
          />
          {renderLabel('Submitted by', true)}
          <TextInput
            style={[styles.input, errors.includes('submittedBy') && styles.requiredInput]}
            placeholder="Enter Name"
            onChangeText={(val) => handleChange('submittedBy', val)}
            value={reportData.submittedBy}
          />
          {renderLabel('Date of Report', true)}
          <TouchableOpacity onPress={() => setShowDatePicker({ field: 'dateOfReport', visible: true })}>
            <View style={[styles.inputContainer, errors.includes('dateOfReport') && styles.requiredInput]}>
              <TextInput
                style={[styles.input, styles.dateInput]}
                placeholder="mm/dd/yyyy"
                value={reportData.dateOfReport ? reportData.dateOfReport.toLocaleDateString('en-GB') : ''}
                editable={false}
              />
              <Icon name="calendar-today" size={16} color="#666" style={styles.icon} />
            </View>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Relief Operations</Text>
          {renderLabel('Operation Date', true)}
          <TouchableOpacity onPress={() => setShowDatePicker({ field: 'operationDate', visible: true })}>
            <View style={[styles.inputContainer, errors.includes('operationDate') && styles.requiredInput]}>
              <TextInput
                style={[styles.input, styles.dateInput]}
                placeholder="mm/dd/yyyy"
                value={reportData.operationDate ? reportData.operationDate.toLocaleDateString('en-GB') : ''}
                editable={false}
              />
              <Icon name="calendar-today" size={16} color="#666" style={styles.icon} />
            </View>
          </TouchableOpacity>
          {renderLabel('Number of Families', true)}
          <TextInput
            style={[styles.input, errors.includes('families') && styles.requiredInput]}
            placeholder="Enter No. of Families"
            onChangeText={(val) => handleChange('families', val)}
            value={reportData.families}
          />
          {renderLabel('No. of Food Packs', true)}
          <TextInput
            style={[styles.input, errors.includes('foodPacks') && styles.requiredInput]}
            placeholder="Enter No. of Food Packs"
            onChangeText={(val) => handleChange('foodPacks', val)}
            value={reportData.foodPacks}
          />
          {renderLabel('No. of Hot Meals', true)}
          <TextInput
            style={[styles.input, errors.includes('hotMeals') && styles.requiredInput]}
            placeholder="Enter No. of Hot Meals"
            onChangeText={(val) => handleChange('hotMeals', val)}
            value={reportData.hotMeals}
          />
          {renderLabel('Liters of Water', true)}
          <TextInput
            style={[styles.input, errors.includes('water') && styles.requiredInput]}
            placeholder="Liters of Water"
            onChangeText={(val) => handleChange('water', val)}
            value={reportData.water}
          />
          {renderLabel('No. of Volunteers Mobilized', true)}
          <TextInput
            style={[styles.input, errors.includes('volunteers') && styles.requiredInput]}
            placeholder="Enter No. of Volunteers Mobilized"
            onChangeText={(val) => handleChange('volunteers', val)}
            value={reportData.volunteers}
          />
          {renderLabel('Total Amount Raised', true)}
          <TextInput
            style={[styles.input, errors.includes('amountRaised') && styles.requiredInput]}
            placeholder="Enter Amount Raised"
            onChangeText={(val) => handleChange('amountRaised', val)}
            value={reportData.amountRaised}
          />
          {renderLabel('Total Value of In-Kind Donations', true)}
          <TextInput
            style={[styles.input, errors.includes('inKindValue') && styles.requiredInput]}
            placeholder="Enter Value of In-Kind Donations"
            onChangeText={(val) => handleChange('inKindValue', val)}
            value={reportData.inKindValue}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Additional Updates</Text>
          {renderLabel('Urgent Needs', true)}
          <TextInput
            style={[styles.input, errors.includes('urgentNeeds') && styles.requiredInput]}
            placeholder="Enter Urgent Needs"
            onChangeText={(val) => handleChange('urgentNeeds', val)}
            value={reportData.urgentNeeds}
          />
          {renderLabel('Remarks', true)}
          <TextInput
            style={[styles.input, styles.textArea, errors.includes('remarks') && styles.requiredInput]}
            placeholder="Remarks"
            multiline
            numberOfLines={4}
            onChangeText={(val) => handleChange('remarks', val)}
            value={reportData.remarks}
          />
        </View>

        <TouchableOpacity style={styles.button} onPress={handleSubmit}>
          <Text style={styles.buttonText}>Submit</Text>
        </TouchableOpacity>

        {showDatePicker.visible && (
          <DateTimePicker
            value={reportData[showDatePicker.field] || new Date()}
            mode="date"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={onChangeDate}
          />
        )}
      </View>
    </ScrollView>
  );
};

export default ReportSubmission;