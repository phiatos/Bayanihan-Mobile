import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import globalStyles from '../styles/GlobalStyles';
import styles from '../styles/ReportSummaryStyles';
import Theme from '../constants/theme';
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
    const options = { year: 'numeric', day: 'numeric'};
    return date.toLocaleDateString(undefined, options);
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
      <View style={globalStyles.headerContainer}>
        <TouchableOpacity style={styles.menuIcon} onPress={() => navigation.openDrawer()}>
          <Ionicons name="menu" size={28} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerText}>Reports Summary</Text>
      </View>
      <Text style={styles.subheader}>[Organization Name]</Text>

      <View style={styles.formContainer}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Basic Information</Text>
          {['reportID','AreaOfOperation'].map((field) => (
            <View key={field} style={styles.fieldContainer}>
              <Text style={styles.label}>{formatLabel(field)}</Text>
              <Text style={styles.value}>{reportData[field] || 'N/A'}</Text>
            </View>
          ))}
          <View style={styles.fieldContainer}>
            <Text style={styles.label}>Date of Report</Text>
            <Text style={styles.value}>{formatDate(reportData.dateOfReport)}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Relief Operations</Text>
          {['timeOfIntervention', 'startDate', 'endDate', 'families', 'foodPacks', 'hotMeals', 'water', 'volunteers', 'amountRaised', 'inKindValue', 'orgActivated'].map((field) => (
            <View key={field} style={styles.fieldContainer}>
              <Text style={styles.label}>{formatLabel(field)}</Text>
              <Text style={styles.value}>
                {field === 'startDate' || field === 'endDate' ? formatDate(reportData[field])
                : field === 'timeOfIntervention' ? formatTime(reportData[field])
                : reportData[field] || 'N/A'}
              </Text>
            </View>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Additional Updates</Text>
          {['remarks'].map((field) => (
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

export default ReportSummary;