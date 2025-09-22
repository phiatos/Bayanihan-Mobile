import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import React, { useEffect, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, SafeAreaView, ScrollView, StatusBar, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../context/AuthContext';
import CustomModal from '../components/CustomModal';
import GlobalStyles from '../styles/GlobalStyles';
import styles from '../styles/RDANAStyles';
import Theme from '../constants/theme';
import { logActivity } from '../components/logSubmission';

const RDANAScreen = () => {
  const navigation = useNavigation();
  const { user } = useAuth();
  const [reportData, setReportData] = useState({
    Site_Location_Address_Province: '',
    Site_Location_Address_City_Municipality: '',
    Site_Location_Address_Barangay: '',
    Date_and_Time_of_Information_Gathered: '',
    Locations_and_Areas_Affected: '',
    Type_of_Disaster: '',
    Date_and_Time_of_Occurrence: '',
    summary: '',
    reliefPacks: 'No',
    hotMeals: 'No',
    hygieneKits: 'No',
    drinkingWater: 'No',
    ricePacks: 'No',
    residentialhousesStatus: '',
    transportationandmobilityStatus: '',
    electricitypowergridStatus: '',
    communicationnetworksinternetStatus: '',
    hospitalsruralhealthunitsStatus: '',
    watersupplysystemStatus: '',
    marketbusinessandcommercialestablishmentsStatus: '',
    othersStatus: '',
    Prepared_By: user?.displayName || '',
  });
  const [affectedMunicipalities, setAffectedMunicipalities] = useState([]);
  const [authoritiesAndOrganizations, setAuthoritiesAndOrganizations] = useState([]);
  const [immediateNeeds, setImmediateNeeds] = useState([]);
  const [initialResponse, setInitialResponse] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const [showInfoDatePicker, setShowInfoDatePicker] = useState(false);
  const [showOccurrenceDatePicker, setShowOccurrenceDatePicker] = useState(false);

  useEffect(() => {
    if (!user) {
      setErrorMessage('User not authenticated. Please log in.');
      setModalVisible(true);
      setTimeout(() => {
        setModalVisible(false);
        navigation.navigate('Login');
      }, 3000);
    }
  }, [user, navigation]);

  const handleInputChange = (key, value) => {
    setReportData(prev => ({ ...prev, [key]: value }));
  };

  // === START OF CHANGES ===
  // Modified to store dates as ISO 8601 strings for compatibility with rdana_verification.js
  const handleDateChange = (key, event, selectedDate) => {
    if (event.type === 'set' && selectedDate) {
      // Store date as ISO 8601 string (e.g., "2025-09-21T20:30:00Z")
      const isoDateString = selectedDate.toISOString();
      setReportData(prev => ({ ...prev, [key]: isoDateString }));
    }
    if (key === 'Date_and_Time_of_Information_Gathered') {
      setShowInfoDatePicker(Platform.OS === 'ios');
    } else if (key === 'Date_and_Time_of_Occurrence') {
      setShowOccurrenceDatePicker(Platform.OS === 'ios');
    }
  };
  // === END OF CHANGES ===

  const addMunicipality = () => {
    setAffectedMunicipalities(prev => [...prev, {
      community: '',
      totalPop: '',
      affected: '',
      deaths: '',
      injured: '',
      missing: '',
      children: '',
      women: '',
      seniors: '',
      pwd: ''
    }]);
  };

  const updateMunicipality = (index, key, value) => {
    setAffectedMunicipalities(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [key]: value };
      return updated;
    });
  };

  const removeMunicipality = (index) => {
    setAffectedMunicipalities(prev => prev.filter((_, i) => i !== index));
  };

  const addAuthority = () => {
    setAuthoritiesAndOrganizations(prev => [...prev, { authority: '', organization: '' }]);
  };

  const updateAuthority = (index, key, value) => {
    setAuthoritiesAndOrganizations(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [key]: value };
      return updated;
    });
  };

  const removeAuthority = (index) => {
    setAuthoritiesAndOrganizations(prev => prev.filter((_, i) => i !== index));
  };

  const addNeed = () => {
    setImmediateNeeds(prev => [...prev, { need: '', qty: '' }]);
  };

  const updateNeed = (index, key, value) => {
    setImmediateNeeds(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [key]: value };
      return updated;
    });
  };

  const removeNeed = (index) => {
    setImmediateNeeds(prev => prev.filter((_, i) => i !== index));
  };

  const addResponse = () => {
    setInitialResponse(prev => [...prev, { group: '', assistance: '', families: '' }]);
  };

  const updateResponse = (index, key, value) => {
    setInitialResponse(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [key]: value };
      return updated;
    });
  };

  const removeResponse = (index) => {
    setInitialResponse(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    try {
      if (!user) throw new Error('User not authenticated');
      if (!reportData.Site_Location_Address_Province?.trim()) throw new Error('Please enter the province');
      if (!reportData.Site_Location_Address_City_Municipality?.trim()) throw new Error('Please enter the city/municipality');
      if (!reportData.Site_Location_Address_Barangay?.trim()) throw new Error('Please enter the barangay');
      if (!reportData.Type_of_Disaster?.trim()) throw new Error('Please select a disaster type');
      if (!reportData.Date_and_Time_of_Information_Gathered?.trim()) throw new Error('Please enter the date and time of information gathered');
      if (affectedMunicipalities.length === 0) throw new Error('Please add at least one affected municipality');

      await logActivity('Started an RDANA report', null, user.id, user?.organization || 'Admin');
      
      navigation.navigate('RDANASummary', {
        reportData,
        affectedMunicipalities,
        authoritiesAndOrganizations,
        immediateNeeds,
        initialResponse,
        organizationName: user?.organization || 'Admin'
      });
    } catch (error) {
      setErrorMessage(error.message);
      setModalVisible(true);
    }
  };

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
          <Text style={[GlobalStyles.headerTitle, { color: Theme.colors.primary }]}>RDANA</Text>
        </View>
      </LinearGradient>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1, marginTop: 80 }}
        keyboardVerticalOffset={0}
      >
        <ScrollView
          contentContainerStyle={styles.scrollViewContent}
          scrollEnabled
          keyboardShouldPersistTaps="handled"
        >
          <View style={GlobalStyles.form}>
            <Text style={GlobalStyles.subheader}>Rapid Disaster Assessment and Needs Analysis</Text>
            <Text style={GlobalStyles.organizationName}>{user?.organization || 'Admin'}</Text>
            
            <View style={GlobalStyles.section}>
              <Text style={GlobalStyles.sectionTitle}>I. Profile of the Disaster</Text>
              {[
                { key: 'Site_Location_Address_Province', label: 'Site Location/ Address (Province)', type: 'text' },
                { key: 'Site_Location_Address_City_Municipality', label: 'Site Location Address (City/Municipality)', type: 'text' },
                { key: 'Site_Location_Address_Barangay', label: 'Site Location Address Barangay', type: 'text' },
              ].map(({ key, label, type }) => (
                <View key={key} style={styles.fieldContainer}>
                  <Text style={styles.label}>{label}</Text>
                  <TextInput
                    style={styles.input}
                    value={reportData[key]}
                    onChangeText={(text) => handleInputChange(key, text)}
                    placeholder={`Enter ${label}`}
                    placeholderTextColor={Theme.colors.placeholder}
                  />
                </View>
              ))}
              
              <View style={styles.fieldContainer}>
                <Text style={styles.label}>Date and Time of Information Gathered</Text>
                <TouchableOpacity
                  style={styles.input}
                  onPress={() => setShowInfoDatePicker(true)}
                >
                  <Text style={reportData.Date_and_Time_of_Information_Gathered ? styles.inputText : styles.placeholderText}>
                    {reportData.Date_and_Time_of_Information_Gathered
                      ? new Date(reportData.Date_and_Time_of_Information_Gathered).toLocaleString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })
                      : 'Select Date and Time'}
                  </Text>
                </TouchableOpacity>
                {showInfoDatePicker && (
                  <DateTimePicker
                    value={reportData.Date_and_Time_of_Information_Gathered
                      ? new Date(reportData.Date_and_Time_of_Information_Gathered)
                      : new Date()}
                    mode="datetime"
                    display={Platform.OS === 'ios' ? 'inline' : 'default'}
                    onChange={(event, date) => handleDateChange('Date_and_Time_of_Information_Gathered', event, date)}
                  />
                )}
              </View>

              <Text style={GlobalStyles.sectionTitle}>Authorities & Organizations</Text>
              {authoritiesAndOrganizations.map((item, index) => (
                <View key={index} style={styles.dynamicFieldContainer}>
                  <TextInput
                    style={[styles.input, styles.dynamicInput]}
                    value={item.authority}
                    onChangeText={(text) => updateAuthority(index, 'authority', text)}
                    placeholder="Enter Authority"
                    placeholderTextColor={Theme.colors.placeholder}
                  />
                  <TextInput
                    style={[styles.input, styles.dynamicInput]}
                    value={item.organization}
                    onChangeText={(text) => updateAuthority(index, 'organization', text)}
                    placeholder="Enter Organization"
                    placeholderTextColor={Theme.colors.placeholder}
                  />
                  <TouchableOpacity
                    style={styles.removeButton}
                    onPress={() => removeAuthority(index)}
                  >
                    <Ionicons name="trash" size={24} color={Theme.colors.red} />
                  </TouchableOpacity>
                </View>
              ))}
              <TouchableOpacity style={styles.addButton} onPress={addAuthority}>
                <Text style={styles.addButtonText}>Add Authority/Organization</Text>
              </TouchableOpacity>
            </View>

            <View style={GlobalStyles.section}>
              <Text style={GlobalStyles.sectionTitle}>II. Modality</Text>
              <View style={styles.fieldContainer}>
                <Text style={styles.label}>Locations and Areas Affected</Text>
                <TextInput
                  style={[styles.input, styles.multiline]}
                  value={reportData.Locations_and_Areas_Affected}
                  onChangeText={(text) => handleInputChange('Locations_and_Areas_Affected', text)}
                  placeholder="Enter Locations and Areas Affected"
                  placeholderTextColor={Theme.colors.placeholder}
                  multiline
                />
              </View>
              
              <View style={styles.fieldContainer}>
                <Text style={styles.label}>Type of Disaster</Text>
                <View style={styles.pickerContainer}>
                  <Picker
                    selectedValue={reportData.Type_of_Disaster}
                    onValueChange={(value) => handleInputChange('Type_of_Disaster', value)}
                    style={styles.picker}
                  >
                    <Picker.Item label="Select Disaster Type" value="" />
                    <Picker.Item label="Earthquake" value="Earthquake" />
                    <Picker.Item label="Typhoon" value="Typhoon" />
                    <Picker.Item label="Flood" value="Flood" />
                    <Picker.Item label="Fire" value="Fire" />
                    <Picker.Item label="Other" value="Other" />
                  </Picker>
                </View>
              </View>

              <View style={styles.fieldContainer}>
                <Text style={styles.label}>Date and Time of Occurrence</Text>
                <TouchableOpacity
                  style={styles.input}
                  onPress={() => setShowOccurrenceDatePicker(true)}
                >
                  <Text style={reportData.Date_and_Time_of_Occurrence ? styles.inputText : styles.placeholderText}>
                    {reportData.Date_and_Time_of_Occurrence
                      ? new Date(reportData.Date_and_Time_of_Occurrence).toLocaleString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })
                      : 'Select Date and Time'}
                  </Text>
                </TouchableOpacity>
                {showOccurrenceDatePicker && (
                  <DateTimePicker
                    value={reportData.Date_and_Time_of_Occurrence
                      ? new Date(reportData.Date_and_Time_of_Occurrence)
                      : new Date()}
                    mode="datetime"
                    display={Platform.OS === 'ios' ? 'inline' : 'default'}
                    onChange={(event, date) => handleDateChange('Date_and_Time_of_Occurrence', event, date)}
                  />
                )}
              </View>

              <View style={styles.fieldContainer}>
                <Text style={styles.label}>Summary</Text>
                <TextInput
                  style={[styles.input, styles.multiline]}
                  value={reportData.summary}
                  onChangeText={(text) => handleInputChange('summary', text)}
                  placeholder="Enter Summary"
                  placeholderTextColor={Theme.colors.placeholder}
                  multiline
                />
              </View>
            </View>

            <View style={GlobalStyles.section}>
              <Text style={GlobalStyles.sectionTitle}>III. Initial Effects</Text>
              <Text style={styles.sectionSubtitle}>Affected Municipalities</Text>
              {affectedMunicipalities.map((item, index) => (
                <View key={index} style={styles.dynamicFieldContainer}>
                  {[
                    { key: 'community', label: 'Municipality/Community', type: 'text' },
                    { key: 'totalPop', label: 'Total Population', type: 'number' },
                    { key: 'affected', label: 'Affected Population', type: 'number' },
                    { key: 'deaths', label: 'Deaths', type: 'number' },
                    { key: 'injured', label: 'Injured', type: 'number' },
                    { key: 'missing', label: 'Missing', type: 'number' },
                    { key: 'children', label: 'Children', type: 'number' },
                    { key: 'women', label: 'Women', type: 'number' },
                    { key: 'seniors', label: 'Senior Citizens', type: 'number' },
                    { key: 'pwd', label: 'PWD', type: 'number' },
                  ].map(({ key, label, type }) => (
                    <View key={key} style={styles.fieldContainer}>
                      <Text style={styles.label}>{label}</Text>
                      <TextInput
                        style={styles.input}
                        value={item[key]}
                        onChangeText={(text) => updateMunicipality(index, key, text)}
                        placeholder={`Enter ${label}`}
                        placeholderTextColor={Theme.colors.placeholder}
                        keyboardType={type === 'number' ? 'numeric' : 'default'}
                      />
                    </View>
                  ))}
                  <TouchableOpacity
                    style={styles.removeButton}
                    onPress={() => removeMunicipality(index)}
                  >
                    <Ionicons name="trash" size={24} color={Theme.colors.red} />
                  </TouchableOpacity>
                </View>
              ))}
              <TouchableOpacity style={styles.addButton} onPress={addMunicipality}>
                <Text style={styles.addButtonText}>Add Municipality</Text>
              </TouchableOpacity>
            </View>

            <View style={GlobalStyles.section}>
              <Text style={GlobalStyles.sectionTitle}>IV. Status of Lifelines, Social Structure, and Critical Facilities</Text>
              {[
                { key: 'residentialhousesStatus', label: 'Residential Houses' },
                { key: 'transportationandmobilityStatus', label: 'Transportation and Mobility' },
                { key: 'electricitypowergridStatus', label: 'Electricity, Power Grid' },
                { key: 'communicationnetworksinternetStatus', label: 'Communication Networks, Internet' },
                { key: 'hospitalsruralhealthunitsStatus', label: 'Hospitals, Rural Health Units' },
                { key: 'watersupplysystemStatus', label: 'Water Supply System' },
                { key: 'marketbusinessandcommercialestablishmentsStatus', label: 'Market, Business, Commercial Establishments' },
                { key: 'othersStatus', label: 'Others' },
              ].map(({ key, label }) => (
                <View key={key} style={styles.fieldContainer}>
                  <Text style={styles.label}>{label}</Text>
                  <TextInput
                    style={[styles.input, styles.multiline]}
                    value={reportData[key]}
                    onChangeText={(text) => handleInputChange(key, text)}
                    placeholder={`Enter ${label} Status`}
                    placeholderTextColor={Theme.colors.placeholder}
                    multiline
                  />
                </View>
              ))}
            </View>

            <View style={GlobalStyles.section}>
              <Text style={GlobalStyles.sectionTitle}>V. Initial Needs Assessment Checklist</Text>
              {[
                { key: 'reliefPacks', label: 'Relief Packs' },
                { key: 'hotMeals', label: 'Hot Meals' },
                { key: 'hygieneKits', label: 'Hygiene Kits' },
                { key: 'drinkingWater', label: 'Drinking Water' },
                { key: 'ricePacks', label: 'Rice Packs' },
              ].map(({ key, label }) => (
                <View key={key} style={styles.fieldContainer}>
                  <Text style={styles.label}>{label}</Text>
                  <View style={styles.pickerContainer}>
                    <Picker
                      selectedValue={reportData[key]}
                      onValueChange={(value) => handleInputChange(key, value)}
                      style={styles.picker}
                    >
                      <Picker.Item label="No" value="No" />
                      <Picker.Item label="Yes" value="Yes" />
                    </Picker>
                  </View>
                </View>
              ))}
              
              <Text style={styles.sectionSubtitle}>Other Immediate Needs</Text>
              {immediateNeeds.map((item, index) => (
                <View key={index} style={styles.dynamicFieldContainer}>
                  <TextInput
                    style={[styles.input, styles.dynamicInput]}
                    value={item.need}
                    onChangeText={(text) => updateNeed(index, 'need', text)}
                    placeholder="Enter Need"
                    placeholderTextColor={Theme.colors.placeholder}
                  />
                  <TextInput
                    style={[styles.input, styles.dynamicInput]}
                    value={item.qty}
                    onChangeText={(text) => updateNeed(index, 'qty', text)}
                    placeholder="Enter Quantity"
                    placeholderTextColor={Theme.colors.placeholder}
                    keyboardType="numeric"
                  />
                  <TouchableOpacity
                    style={styles.removeButton}
                    onPress={() => removeNeed(index)}
                  >
                    <Ionicons name="trash" size={24} color={Theme.colors.red} />
                  </TouchableOpacity>
                </View>
              ))}
              <TouchableOpacity style={styles.addButton} onPress={addNeed}>
                <Text style={styles.addButtonText}>Add Immediate Need</Text>
              </TouchableOpacity>
            </View>

            <View style={GlobalStyles.section}>
              <Text style={GlobalStyles.sectionTitle}>VI. Initial Response Actions</Text>
              {initialResponse.map((item, index) => (
                <View key={index} style={styles.dynamicFieldContainer}>
                  <TextInput
                    style={[styles.input, styles.dynamicInput]}
                    value={item.group}
                    onChangeText={(text) => updateResponse(index, 'group', text)}
                    placeholder="Enter Response Group"
                    placeholderTextColor={Theme.colors.placeholder}
                  />
                  <TextInput
                    style={[styles.input, styles.dynamicInput]}
                    value={item.assistance}
                    onChangeText={(text) => updateResponse(index, 'assistance', text)}
                    placeholder="Enter Assistance Provided"
                    placeholderTextColor={Theme.colors.placeholder}
                  />
                  <TextInput
                    style={[styles.input, styles.dynamicInput]}
                    value={item.families}
                    onChangeText={(text) => updateResponse(index, 'families', text)}
                    placeholder="Enter Number of Families"
                    placeholderTextColor={Theme.colors.placeholder}
                    keyboardType="numeric"
                  />
                  <TouchableOpacity
                    style={styles.removeButton}
                    onPress={() => removeResponse(index)}
                  >
                    <Ionicons name="trash" size={24} color={Theme.colors.red} />
                  </TouchableOpacity>
                </View>
              ))}
              <TouchableOpacity style={styles.addButton} onPress={addResponse}>
                <Text style={styles.addButtonText}>Add Response Action</Text>
              </TouchableOpacity>
            </View>

            <View style={GlobalStyles.finalButtonContainer}>
              <TouchableOpacity style={GlobalStyles.submitButton} onPress={handleSubmit}>
                <Text style={GlobalStyles.submitButtonText}>Next</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <CustomModal
        visible={modalVisible}
        title="Error"
        message={errorMessage}
        onConfirm={() => setModalVisible(false)}
        confirmText="OK"
      />
    </SafeAreaView>
  );
};

export default RDANAScreen;