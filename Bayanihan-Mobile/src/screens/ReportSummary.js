import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import Theme from '../contants/theme';
import CustomModal from '../navigation/CustomModal';


const ReportSummary = ({ route }) => {
  const { reportData } = route.params;
    const [modalVisible, setModalVisible] = useState(false);
  
  const navigation = useNavigation();


  const handleConfirm = () => {
    setModalVisible(false);
    navigation.navigate('Home');
  };

  const handleCancel = () => {
    setModalVisible(false);
  };

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
        setModalVisible(true);
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.menuIcon} onPress={() => navigation.openDrawer()}>
          <Ionicons name="menu" size={28} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerText}>Reports Summary</Text>
      </View>
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
              <Text style={styles.value}>{reportData[field] || 'None'}</Text>
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
        <CustomModal
        visible={modalVisible}
        title="Success!"
        message={
          <View style={styles.modalContent}>
            <Ionicons name="checkmark-circle" size={60} color={Theme.colors.primary} style={styles.modalIcon} />
            <Text style={styles.modalMessage}>Report submitted successfully!</Text>
          </View>
        }
        onConfirm={handleConfirm}
        onCancel={handleCancel}
        confirmText="Proceed"
        showCancel={false}
      />

      
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    flex: 1,
  },
  header: {
     flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'center',
  backgroundColor: Theme.colors.primary,
  paddingHorizontal: 10,
  width: '100%',
  borderBottomLeftRadius: 20,
  borderBottomRightRadius: 20,
  height: 92,
  paddingTop: 40,
  position: 'relative', 
  elevation: 10
  },
  menuIcon: {
 position: 'absolute',
  left: 30,
  top: 50, 
  },
  headerText: {
    color: 'white',
    fontSize: 20,
    fontFamily: 'Poppins_Regular',
    textAlign: 'center',
  },
  subheader: {
    fontSize: 16,
    color: '#3D52A0',
    textAlign: 'center',
    marginVertical: 10,
    fontFamily: 'Poppins_Regular',
  },
  formContainer: {
    marginBottom: 10,
  },
  section: {
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
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 20,
    color: '#14AEBB',
    marginBottom: 10,
    fontFamily: 'Poppins_SemiBold',
  },
  fieldContainer: {
    marginBottom: 5,
  },
  label: {
    fontSize: 16,
    color: Theme.colors.primary,
    textTransform: 'capitalize',
    fontFamily: 'Poppins_Medium',
  },
  value: {
    fontSize: 14,
    color: Theme.colors.black,
    marginTop: 2,
    fontFamily: 'Poppins_Regular',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginHorizontal: 10,
    marginBottom: 40,
    height:45
  },
  backButton: {
     borderWidth: 1.5,
    borderColor: '#4059A5',
    borderRadius: 12,
    justifyContent: 'center',
    paddingHorizontal: 25,
    paddingVertical: 0,
    alignItems: 'center',
    marginRight: 10,
    backgroundColor: '#FFFFFF',
  },
  backButtonText: {
   color: '#4059A5',
    fontSize: 16,
    fontFamily: 'Poppins_Medium',
  },
  submitButton: {
      flex: 1,
    backgroundColor: '#14AEBB',
    borderRadius: 12,
    justifyContent: 'center'
  },
  submitButtonText: {
     color: '#FFFFFF',
    fontSize: 16,
    paddingTop: 5,
    fontFamily: 'Poppins_SemiBold',
    textAlign: 'center',
  },
    modalContent: {
    alignItems: 'center',
    width: '100%',
    justifyContent: 'center',
  },
  modalIcon: {
    marginBottom: 15,
  },
  modalMessage: {
    fontSize: 14,
    color: '#444',
    lineHeight: 24,
    fontFamily: 'Poppins_Regular',
    textAlign: 'center',
  },
});

export default ReportSummary;