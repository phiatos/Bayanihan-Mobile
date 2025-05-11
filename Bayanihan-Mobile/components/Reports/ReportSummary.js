import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';

const ReportSummary = ({ route }) => {
  const { reportData } = route.params;
  const navigation = useNavigation();

  const formatLabel = (key) => key.replace(/([A-Z])/g, ' $1').toLowerCase();

  const formatDate = (date) => {
    if (!date) return 'N/A';
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const handleSubmit = () => {
    // Show success prompt and navigate to Dashboard
    Alert.alert(
      'Success',
      'Report submitted successfully!',
      [
        {
          text: 'OK',
          onPress: () => navigation.navigate('Dashboard'),
        },
      ],
      { cancelable: false }
    );
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.header}>Reports Submission</Text>
      <Text style={styles.subheader}>[Organization Name]</Text>

      <View style={styles.formContainer}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Basic Information</Text>
          {['reportID', 'location', 'timeOfIntervention', 'submittedBy'].map((field) => (
            <View key={field} style={styles.fieldContainer}>
              <Text style={styles.label}>{formatLabel(field)}</Text>
              <Text style={styles.value}>{reportData[field]}</Text>
            </View>
          ))}
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
                {field === 'operationDate' ? formatDate(reportData[field]) : reportData[field]}
              </Text>
            </View>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Additional Updates</Text>
          {['urgentNeeds', 'remarks'].map((field) => (
            <View key={field} style={styles.fieldContainer}>
              <Text style={styles.label}>{formatLabel(field)}</Text>
              <Text style={styles.value}>{reportData[field]}</Text>
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
  },
  header: {
    fontSize: 18,
    backgroundColor: '#4059A5',
    color: 'white',
    textAlign: 'center',
    paddingHorizontal: 10,
    width: '100%',
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    height: 62,
    paddingTop: 20,
    alignContent: 'center',
  },
  subheader: {
    fontSize: 16,
    color: '#3D52A0',
    textAlign: 'center',
    marginVertical: 10,
    fontWeight: '600',
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
    fontWeight: '600',
    marginBottom: 10,
    color: '#14AEBB',
  },
  fieldContainer: {
    marginBottom: 5,
  },
  label: {
    fontSize: 16,
    fontWeight: '700',
    color: '#4059A5',
    textTransform: 'capitalize',
  },
  value: {
    fontSize: 16,
    color: '#666',
    marginTop: 2,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginHorizontal: 15,
    marginBottom: 20,
  },
  backButton: {
    flex: 1,
    borderWidth: 2,
    borderColor: '#4059A5',
    borderRadius: 5,
    padding: 10,
    alignItems: 'center',
    marginRight: 10,
    backgroundColor: '#FFFFFF',
  },
  backButtonText: {
    color: '#4059A5',
    fontSize: 16,
    fontWeight: '600',
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
    fontWeight: '600',
  },
});

export default ReportSummary;