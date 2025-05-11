import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSidebar } from '../Sidebar/SidebarContext';
import Icon from 'react-native-vector-icons/MaterialIcons';


const ReportSummary = ({ route }) => {
    const { toggleSidebar } = useSidebar();
  const { reportData } = route.params;
  const navigation = useNavigation();

  const formatLabel = (key) => {
    return key.replace(/([A-Z])/g, ' $1').toLowerCase();
  };

  const formatDate = (date) => {
    if (!date || !(date instanceof Date) || isNaN(date)) return 'N/A';
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const formatTime = (date) => {
    if (!date || !(date instanceof Date) || isNaN(date)) return 'N/A';
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  };

  const handleSubmit = () => {
    // Show success prompt and navigate to Dashboard
    Alert.alert(
      'Success',
      'Report submitted successfully!',
      [
        {
          text: 'OK',
          onPress: () => navigation.navigate('Profile'),
        },
      ],
      { cancelable: false }
    );
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <TouchableOpacity style={styles.menu} onPress={toggleSidebar}>
              <Icon name="menu" size={24} color="#FFFFFF" />
            </TouchableOpacity>
      <Text style={styles.header}>Reports Submission</Text>
      <Text style={styles.subheader}>[Organization Name]</Text>

      <View style={styles.formContainer}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Basic Information</Text>
          {['reportID', 'submittedBy'].map((field) => (
            <View key={field} style={styles.fieldContainer}>
              <Text style={styles.label}>{formatLabel(field)}</Text>
              <Text style={styles.value}>{reportData[field] || 'N/A'}</Text>
            </View>
          ))}
          <View style={styles.fieldContainer}>
            <Text style={styles.label}>Time of Intervention</Text>
            <Text style={styles.value}>{formatTime(reportData.timeOfIntervention)}</Text>
          </View>
          <View style={styles.fieldContainer}>
            <Text style={styles.label}>Date of Report</Text>
            <Text style={styles.value}>{formatDate(reportData.dateOfReport)}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Relief Operations</Text>
          {['operationDate', 'families', 'foodPacks', 'hotMeals', 'water', 'volunteers', 'amountRaised', 'inKindValue'].map((field) => (
            <View key={field} style={styles.fieldContainer}>
              <Text style={styles.label}>{formatLabel(field)}</Text>
              <Text style={styles.value}>
                {field === 'operationDate' ? formatDate(reportData[field]) : reportData[field] || 'N/A'}
              </Text>
            </View>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Additional Updates</Text>
          {['urgentNeeds', 'remarks'].map((field) => (
            <View key={field} style={styles.fieldContainer}>
              <Text style={styles.label}>{formatLabel(field)}</Text>
              <Text style={styles.value}>{reportData[field] || 'N/A'}</Text>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.navigate('ReportSubmission')}
        >
          <Text style={styles.backButtonText}>Back</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
          <Text style={styles.submitButtonText}>Submit</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    paddingBottom: 60,

  },
  header: {
   fontSize: 20,
    backgroundColor: '#4059A5',
    color: 'white',
    textAlign: 'center',
    paddingHorizontal: 10,
    width: '100%',
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    height: 90,
    paddingTop: 50,
    alignContent:'center',
    fontFamily: 'Poppins_Regular', 
  },
   menu: {
    position: 'absolute',
    top: 10,
    left: 10,
    zIndex: 100,
    padding: 40,
    color: 'white',
   },
  subheader: {
    fontSize: 16,
    color: '#3D52A0',
    textAlign: 'center',
    marginVertical: 10,
    fontFamily: 'Poppins_Regular', 
  },
  formContainer: {
    marginVertical: 10,
    marginHorizontal: 15,
    borderWidth: 3,
    backgroundColor: '#FFF9F0',
    borderColor: '#4059A5',
    borderRadius: 10,
    padding: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  section: {
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 20,
    color: '#14AEBB',
    marginBottom: 10,
    fontFamily: 'Poppins_Regular', 
  },
  fieldContainer: {
    marginBottom: 5,
  },
  label: {
    fontSize: 16,
    color: '#4059A5',
    textTransform: 'capitalize',
    fontFamily: 'Poppins_SemiBold'
  },
  value: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
    fontFamily: 'Poppins_Regular'
  },
  buttonContainer: {
    flexDirection: 'column',
    justifyContent: 'space-between',
    marginHorizontal: 35,
    marginBottom: 20,
  },
  backButton: {
    flex: 1,
    borderWidth: 2,
    borderColor: '#4059A5',
    borderRadius: 5,
    padding: 10,
    marginVertical: 10,
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  backButtonText: {
    color: '#4059A5',
    fontSize: 16,
    fontFamily: 'Poppins_Regular'
  },
  submitButton: {
    flex: 1,
    backgroundColor: '#14AEBB',
    borderRadius: 5,
    padding: 10,
    alignItems: 'center',
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: 'Poppins_Regular'

  },
});

export default ReportSummary;