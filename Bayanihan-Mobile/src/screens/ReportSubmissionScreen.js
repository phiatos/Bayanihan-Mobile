import React, { useState, useEffect, useRef } from 'react'; // Import useRef
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  Platform,
  Alert,
  SafeAreaView,
  KeyboardAvoidingView,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import Icon from 'react-native-vector-icons/MaterialIcons';
import styles from '../styles/ReportSubmissionStyles';
import GlobalStyles from '../styles/GlobalStyles';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import ReportSubmissionStyles from '../styles/ReportSubmissionStyles';

const ReportSubmissionScreen = () => {
  const navigation = useNavigation();
  const [reportData, setReportData] = useState({
    reportID: '',
    timeOfIntervention: null,
    AreaOfOperation: '',
    dateOfReport: new Date(),
    startDate: null,
    endDate: null,
    families: '',
    foodPacks: '',
    hotMeals: '',
    water: '',
    volunteers: '',
    amountRaised: '',
    inKindValue: '',
    remarks: '',
    orgActivated: '', // Added field for No. of Organizations Activated
  });

  const [showPicker, setShowPicker] = useState({ field: '', visible: false, mode: 'date' });
  const [errors, setErrors] = useState({});
  const scrollViewRef = useRef(null); // Create a ref for the ScrollView

  const requiredFields = [
    'timeOfIntervention',
    'AreaOfOperation',
    'startDate',
    'endDate',
    'dateOfReport',
    'families',
    'foodPacks',
    'hotMeals',
    'water',
    'volunteers',
    'amountRaised',
    'inKindValue',
    'orgActivated', // Included the new field in required fields
  ];

  useEffect(() => {
    const generateReportID = () => {
      const date = new Date();
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const random = Math.random().toString(36).substr(2, '4').toUpperCase();
      return `RPT-${year}${month}${day}-${random}`;
    };
    setReportData((prev) => ({ ...prev, reportID: generateReportID() }));
  }, []);

  const capitalizeFirstLetter = (string) => {
    if (!string) return string;
    return string.charAt(0).toUpperCase() + string.slice(1);
  };

  const onChangePicker = (event, selectedValue) => {
    setShowPicker({ field: '', visible: false, mode: 'date' });
    if (selectedValue) {
      const field = showPicker.field;
      setReportData((prev) => ({
        ...prev,
        [field]: selectedValue,
      }));
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const handleChange = (field, value) => {
    setReportData({ ...reportData, [field]: value });

    if (value.trim() !== '') {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }

    const numericFields = ['families', 'foodPacks', 'hotMeals', 'water', 'volunteers', 'amountRaised', 'inKindValue', 'orgActivated'];
    if (numericFields.includes(field) && value && !/^\d+$/.test(value)) {
      setErrors((prev) => ({
        ...prev,
        [field]: `${capitalizeFirstLetter(field.replace(/([A-Z])/g, ' $1').trim())} must be a positive number`,
      }));
    }
  };

  const handleSubmit = () => {
    const newErrors = {};

    requiredFields.forEach((field) => {
      const value = reportData[field];
      if (value === null || (typeof value === 'string' && value.trim() === '')) {
        const fieldName = field.replace(/([A-Z])/g, ' $1').trim();
        newErrors[field] = `${capitalizeFirstLetter(fieldName)} is required`;
      }
      const numericFields = ['families', 'foodPacks', 'hotMeals', 'water', 'volunteers', 'amountRaised', 'inKindValue', 'orgActivated'];
      if (numericFields.includes(field) && value && !/^\d+$/.test(value)) {
        const fieldName = field.replace(/([A-Z])/g, ' $1').trim();
        newErrors[field] = `${capitalizeFirstLetter(fieldName)} must be a positive number`;
      }
    });

    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      Alert.alert(
        'Incomplete Data',
        `Please fill out the following:\n${Object.values(newErrors).join('\n')}`,
      );
      return;
    }

    console.log('Navigating to ReportSummary with:', { reportData });
    navigation.navigate('ReportSummary', { reportData });
  };

  const renderLabel = (label, isRequired) => (
    <Text style={styles.formTitle}>
      {label}
      {isRequired}
    </Text>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#FFF9F0' }}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 40 : 0} // Adjust offset if needed
      >
        <ScrollView
          contentContainerStyle={styles.container}
          ref={scrollViewRef} // Attach the ref to the ScrollView
        >
          <View style={GlobalStyles.headerContainer}>
            <TouchableOpacity
              onPress={() => navigation.openDrawer()}
              style={styles.menuIcon}
            >
              <Ionicons name="menu" size={32} color="white" />
            </TouchableOpacity>
            <Text style={styles.headerText}>Reports Submission</Text>
          </View>

          <Text style={styles.subheader}>[Organization Name]</Text>

          <View style={styles.form}>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Basic Information</Text>

              {renderLabel('Report ID', true)}
              <TextInput
                style={[styles.input, { backgroundColor: '#f0f0f0' }]}
                value={reportData.reportID}
                editable={false}
                selectTextOnFocus={false}
              />

              {renderLabel('Area of Operation', true)}
              <TextInput
                style={[styles.input, errors.AreaOfOperation && styles.requiredInput]}
                placeholder="Enter Address"
                onChangeText={(val) => handleChange('AreaOfOperation', val)}
                value={reportData.AreaOfOperation}
              />
              {errors.AreaOfOperation && <Text style={[styles.errorText, { marginTop: 2 }]}>{errors.AreaOfOperation}</Text>}

             {renderLabel('Date of Report', true)}
              <View style={[styles.inputContainer, errors.dateOfReport && styles.requiredInput]}>
                <TextInput
                  style={[styles.input, styles.dateInput, { backgroundColor: '#f0f0f0' }]} // Added background color for visual cue
                  placeholder="mm/dd/yyyy"
                  placeholderTextColor="#999"
                  value={reportData.dateOfReport ? reportData.dateOfReport.toLocaleDateString('en-GB') : ''}
                  editable={false}
                />
                <Icon name="calendar-today" size={16} color="#666" style={styles.icon} />
              </View>
              {errors.dateOfReport && <Text style={[styles.errorText, { marginTop: 2 }]}>{errors.dateOfReport}</Text>}
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Relief Operations</Text>

              {renderLabel('Time of Intervention', true)}
              <TouchableOpacity onPress={() => setShowPicker({ field: 'timeOfIntervention', visible: true, mode: 'time' })}>
                <View style={[styles.inputContainer, errors.timeOfIntervention && styles.requiredInput]}>
                  <TextInput
                    style={[styles.input, styles.dateInput]}
                    placeholder="HH:MM AM/PM"
                    placeholderTextColor="#999"
                    value={
                      reportData.timeOfIntervention
                        ? reportData.timeOfIntervention.toLocaleTimeString('en-US', {
                            hour: '2-digit',
                            minute: '2-digit',
                            hour12: true,
                          })
                        : ''
                    }
                    editable={false}
                  />
                  <Icon name="access-time" size={16} color="#666" style={styles.icon} />
                </View>
              </TouchableOpacity>
              {errors.timeOfIntervention && <Text style={[styles.errorText, { marginTop: 2 }]}>{errors.timeOfIntervention}</Text>}

              {renderLabel('Starting Date of Operation', true)}
              <TouchableOpacity onPress={() => setShowPicker({ field: 'startDate', visible: true, mode: 'date' })}>
                <View style={[styles.inputContainer, errors.startDate && styles.requiredInput]}>
                  <TextInput
                    style={[styles.input, styles.dateInput]}
                    placeholder="mm/dd/yyyy"
                    placeholderTextColor="#999"
                    value={reportData.startDate ? reportData.startDate.toLocaleDateString('en-GB') : ''}
                    editable={false}
                  />
                  <Icon name="calendar-today" size={16} color="#666" style={styles.icon} />
                </View>
              </TouchableOpacity>
              {errors.startDate && <Text style={[styles.errorText, { marginTop: 2 }]}>{errors.startDate}</Text>}

              {renderLabel('Ending Date of Operation', true)}
              <TouchableOpacity onPress={() => setShowPicker({ field: 'endDate', visible: true, mode: 'date' })}>
                <View style={[styles.inputContainer, errors.endDate && styles.requiredInput]}>
                  <TextInput
                    style={[styles.input, styles.dateInput]}
                    placeholder="mm/dd/yyyy"
                    placeholderTextColor="#999"
                    value={reportData.endDate ? reportData.endDate.toLocaleDateString('en-GB') : ''}
                    editable={false}
                  />
                  <Icon name="calendar-today" size={16} color="#666" style={styles.icon} />
                </View>
              </TouchableOpacity>
              {errors.endDate && <Text style={[styles.errorText, { marginTop: 2 }]}>{errors.endDate}</Text>}

              {renderLabel('No. of Individuals or Families', true)}
              <TextInput
                style={[styles.input, errors.families && styles.requiredInput]}
                placeholder="Enter No. of Families"
                onChangeText={(val) => handleChange('families', val)}
                value={reportData.families}
                keyboardType="numeric"
              />
              {errors.families && <Text style={[styles.errorText, { marginTop: 2 }]}>{errors.families}</Text>}

              {renderLabel('No. of Relief Packs', true)}
              <TextInput
                style={[styles.input, errors.foodPacks && styles.requiredInput]}
                placeholder="Enter No. of Food Packs"
                onChangeText={(val) => handleChange('foodPacks', val)}
                value={reportData.foodPacks}
                keyboardType="numeric"
              />
              {errors.foodPacks && <Text style={[styles.errorText, { marginTop: 2 }]}>{errors.foodPacks}</Text>}

              {renderLabel('No. of Hot Meals/Ready-to-eat Foods', true)}
              <TextInput
                style={[styles.input, errors.hotMeals && styles.requiredInput]}
                placeholder="Enter No. of Hot Meals"
                onChangeText={(val) => handleChange('hotMeals', val)}
                value={reportData.hotMeals}
                keyboardType="numeric"
              />
              {errors.hotMeals && <Text style={[styles.errorText, { marginTop: 2 }]}>{errors.hotMeals}</Text>}

              {renderLabel('Liters of Water', true)}
              <TextInput
                style={[styles.input, errors.water && styles.requiredInput]}
                placeholder="Liters of Water"
                onChangeText={(val) => handleChange('water', val)}
                value={reportData.water}
                keyboardType="numeric"
              />
              {errors.water && <Text style={[styles.errorText, { marginTop: 2 }]}>{errors.water}</Text>}

              {renderLabel('No. of Volunteers Mobilized', true)}
              <TextInput
                style={[styles.input, errors.volunteers && styles.requiredInput]}
                placeholder="Enter No. of Volunteers Mobilized"
                onChangeText={(val) => handleChange('volunteers', val)}
                value={reportData.volunteers}
                keyboardType="numeric"
              />
              {errors.volunteers && <Text style={[styles.errorText, { marginTop: 2 }]}>{errors.volunteers}</Text>}

              {renderLabel('No. of Organizations Activated', true)}
              <TextInput
                style={[styles.input, errors.orgActivated && styles.requiredInput]}
                placeholder="Enter No. of Organizations Activated"
                onChangeText={(val) => handleChange('orgActivated', val)}
                value={reportData.orgActivated}
                keyboardType="numeric"
              />
              {errors.orgActivated && <Text style={[styles.errorText, { marginTop: 2 }]}>{errors.orgActivated}</Text>}

              {renderLabel('Total Value of In-Kind Donations', true)}
              <TextInput
                style={[styles.input, errors.inKindValue && styles.requiredInput]}
                placeholder="Enter Value of In-Kind Donations"
                onChangeText={(val) => handleChange('inKindValue', val)}
                value={reportData.inKindValue}
                keyboardType="numeric"
              />
              {errors.inKindValue && <Text style={[styles.errorText, { marginTop: 2 }]}>{errors.inKindValue}</Text>}

              {renderLabel('Total Monetary Donations', true)}
              <TextInput
                style={[styles.input, errors.amountRaised && styles.requiredInput]}
                placeholder="Enter Amount Raised"
                onChangeText={(val) => handleChange('amountRaised', val)}
                value={reportData.amountRaised}
                keyboardType="numeric"
              />
              {errors.amountRaised && <Text style={[styles.errorText, { marginTop: 2 }]}>{errors.amountRaised}</Text>}
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Additional Updates</Text>

              {renderLabel('Remarks', false)}
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Remarks"
                multiline
                numberOfLines={4}
                onChangeText={(val) => handleChange('remarks', val)}
                value={reportData.remarks}
                onFocus={() => {
                  if (Platform.OS === 'android') {
                    setTimeout(() => {
                      scrollViewRef.current?.scrollToEnd({ animated: true });
                    }, 150); // Adjust timeout as needed
                  }
                }}
              />
              {errors.remarks && <Text style={[styles.errorText, { marginTop: 2 }]}>{errors.remarks}</Text>}
            </View>

            <TouchableOpacity style={styles.button} onPress={handleSubmit}>
              <Text style={styles.buttonText}>Submit</Text>
            </TouchableOpacity>

            {showPicker.visible && (
              <DateTimePicker
                value={reportData[showPicker.field] || new Date()}
                mode={showPicker.mode}
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={onChangePicker}
              />
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default ReportSubmissionScreen;