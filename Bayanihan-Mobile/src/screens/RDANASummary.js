import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, FlatList } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import RDANAStyles from '../styles/RDANAStyles';
import CustomModal from '../navigation/CustomModal';

const RDANASummary = () => {
  const { reportData = {}, affectedMunicipalities = [] } = useRoute().params || {};
  const navigation = useNavigation();
  const [modalVisible, setModalVisible] = useState(false);

  const formatLabel = (key) => {
    return key
      .replace(/([A-Z])/g, ' $1')
      .trim()
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  };

  const handleSubmit = () => {
    setModalVisible(true);
  };

  const handleConfirm = () => {
    setModalVisible(false);
    navigation.navigate('Home');
  };

  const handleCancel = () => {
    setModalVisible(false);
  };

  const handleBack = () => {
    navigation.navigate('RDANAScreen', { reportData, affectedMunicipalities });
  };

  const renderMunicipalityItem = ({ item, index }) => (
    <View style={[styles.tableRow, { minWidth: 1150 }]}>
      <Text style={[styles.tableCell, { minWidth: 50 }]}>{index + 1}</Text>
      <Text style={[styles.tableCell, { minWidth: 200 }]}>{item.affectedMunicipalitiesCommunities || 'N/A'}</Text>
      <Text style={[styles.tableCell, { minWidth: 120 }]}>{item.totalPopulation || 'N/A'}</Text>
      <Text style={[styles.tableCell, { minWidth: 120 }]}>{item.affectedPopulation || 'N/A'}</Text>
      <Text style={[styles.tableCell, { minWidth: 80 }]}>{item.deaths || 'N/A'}</Text>
      <Text style={[styles.tableCell, { minWidth: 80 }]}>{item.injured || 'N/A'}</Text>
      <Text style={[styles.tableCell, { minWidth: 80 }]}>{item.missing || 'N/A'}</Text>
      <Text style={[styles.tableCell, { minWidth: 80 }]}>{item.children || 'N/A'}</Text>
      <Text style={[styles.tableCell, { minWidth: 80 }]}>{item.women || 'N/A'}</Text>
      <Text style={[styles.tableCell, { minWidth: 120 }]}>{item.seniorCitizens || 'N/A'}</Text>
      <Text style={[styles.tableCell, { minWidth: 80 }]}>{item.pwd || 'N/A'}</Text>
    </View>
  );

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.menuIcon} onPress={() => navigation.openDrawer()}>
          <Ionicons name="menu" size={32} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerText}>RDANA Summary</Text>
      </View>
      <Text style={styles.subheader}>[Organization Name]</Text>
      <View style={styles.formContainer}>
        {/* Profile of the Disaster */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Profile of the Disaster</Text>
          {[
            'barangay',
            'cityMunicipality',
            'province',
            'localAuthoritiesPersonsContacted',
            'dateInformationGathered',
            'timeInformationGathered',
            'nameOrganizationsInvolved',
          ].map((field) => (
            <View key={field} style={styles.fieldContainer}>
              <Text style={styles.label}>{formatLabel(field)}:</Text>
              <Text style={styles.value}>{reportData[field] || 'N/A'}</Text>
            </View>
          ))}
        </View>

        {/* Modality */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Modality</Text>
          {[
            'locationsAreasAffectedBarangay',
            'locationsAreasAffectedCityMunicipality',
            'locationsAreasAffectedProvince',
            'typeOfDisaster',
            'dateOfOccurrence',
            'timeOfOccurrence',
            'summaryOfDisasterIncident',
          ].map((field) => (
            <View key={field} style={styles.fieldContainer}>
              <Text style={styles.label}>{formatLabel(field)}:</Text>
              <Text style={styles.value}>{reportData[field] || 'N/A'}</Text>
            </View>
          ))}
        </View>

        {/* Initial Effects */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Initial Effects</Text>
          <Text style={styles.sectionSubtitle}>Affected Municipalities</Text>
          {affectedMunicipalities.length > 0 ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={true}>
              <View style={styles.table}>
                <View style={[styles.tableHeader, { minWidth: 1150 }]}>
                  <Text style={[styles.tableHeaderCell, { minWidth: 200 }]}>Affected Municipalities/Communities</Text>
                  <Text style={[styles.tableHeaderCell, { minWidth: 120 }]}>Total Population</Text>
                  <Text style={[styles.tableHeaderCell, { minWidth: 120 }]}>Affected Population</Text>
                  <Text style={[styles.tableHeaderCell, { minWidth: 80 }]}>Deaths</Text>
                  <Text style={[styles.tableHeaderCell, { minWidth: 80 }]}>Injured</Text>
                  <Text style={[styles.tableHeaderCell, { minWidth: 80 }]}>Missing</Text>
                  <Text style={[styles.tableHeaderCell, { minWidth: 80 }]}>Children</Text>
                  <Text style   ={[styles.tableHeaderCell, { minWidth: 80 }]}>Women</Text>
                  <Text style={[styles.tableHeaderCell, { minWidth: 120 }]}>Senior Citizens</Text>
                  <Text style={[styles.tableHeaderCell, { minWidth: 80 }]}>PWD</Text>
                </View>
                <FlatList
                  data={affectedMunicipalities}
                  renderItem={renderMunicipalityItem}
                  keyExtractor={(item, index) => index.toString()}
                />
              </View>
            </ScrollView>
          ) : (
            <Text style={styles.value}>No municipalities added.</Text>
          )}
        </View>

        {/* Status of Lifelines */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Status of Lifelines, Social Structure, and Critical Facilities</Text>
          {[
            'bridgesStatus',
            'roadsStatus',
            'buildingsStatus',
            'hospitalsStatus',
            'schoolsStatus',
          ].map((field) => (
            <View key={field} style={styles.fieldContainer}>
              <Text style={styles.label}>{formatLabel(field)}:</Text>
              <Text style={styles.value}>{reportData[field] || 'N/A'}</Text>
            </View>
          ))}
        </View>

        {/* Initial Needs Assessment */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Initial Needs Assessment Checklist</Text>
          {[
            'reliefPacks',
            'hotMeals',
            'hygieneKits',
            'drinkingWater',
            'ricePacks',
            'otherImmediateNeeds',
            'estimatedQuantity',
          ].map((field) => (
            <View key={field} style={styles.fieldContainer}>
              <Text style={styles.label}>{formatLabel(field)}:</Text>
              <Text style={styles.value}>{reportData[field] || 'No'}</Text>
            </View>
          ))}
        </View>

        {/* Initial Response Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Initial Response Actions</Text>
          {[
            'responseGroupsInvolved',
            'reliefAssistanceDeployed',
            'numberOfFamiliesServed',
          ].map((field) => (
            <View key={field} style={styles.fieldContainer}>
              <Text style={styles.label}>{formatLabel(field)}:</Text>
              <Text style={styles.value}>{reportData[field] || 'N/A'}</Text>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
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
            <Ionicons name="checkmark-circle" size={60} color="#00BCD4" style={styles.modalIcon} />
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
    backgroundColor: '#FFF9F0',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#00BCD4',
    paddingHorizontal: 10,
    width: '100%',
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    height: 92,
    paddingTop: 40,
    position: 'relative',
    elevation: 10,
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
    marginBottom: 20,
  },
  section: {
    marginVertical: 10,
    marginHorizontal: 15,
    borderWidth: 3,
    backgroundColor: '#FFF9F0',
    borderColor: '#00BCD4',
    borderRadius: 10,
    padding: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 20,
    marginBottom: 10,
    color: '#00BCD4',
    fontFamily: 'Poppins_Bold',
  },
  sectionSubtitle: {
    fontSize: 16,
    marginBottom: 10,
    color: '#00BCD4',
    fontFamily: 'Poppins_SemiBold',
  },
  fieldContainer: {
    marginBottom: 10,
  },
  label: {
    fontSize: 14,
    color: '#00BCD4',
    fontFamily: 'Poppins_SemiBold',
  },
  value: {
    fontSize: 14,
    color: '#000000',
    marginTop: 2,
    fontFamily: 'Poppins_Regular',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginHorizontal: 10,
    marginBottom: 20,
    height: 45,
  },
  backButton: {
    borderWidth: 1.5,
    borderColor: '#4059A5',
    borderRadius: 12,
    justifyContent: 'center',
    paddingHorizontal: 25,
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
    backgroundColor: '#00BCD4',
    borderRadius: 12,
    justifyContent: 'center',
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    paddingTop: 5,
    fontFamily: 'Poppins_SemiBold',
    textAlign: 'center',
  },
  table: {
    borderWidth: 1,
    borderColor: '#4059A5',
    borderRadius: 5,
    overflow: 'hidden',
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: 'rgba(64, 89, 165, 0.23)',
    borderBottomWidth: 1,
    borderColor: '#4059A5',
    paddingVertical: 8,
    paddingHorizontal: 5,
  },
  tableHeaderCell: {
    textAlign: 'center',
    color: '#000000',
    fontFamily: 'Poppins_SemiBold',
    fontSize: 12,
    paddingHorizontal: 5,
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 10,
    paddingHorizontal: 5,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  tableCell: {
    textAlign: 'center',
    fontSize: 12,
    color: '#000000',
    fontFamily: 'Poppins_Regular',
    paddingHorizontal: 5,
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

export default RDANASummary;