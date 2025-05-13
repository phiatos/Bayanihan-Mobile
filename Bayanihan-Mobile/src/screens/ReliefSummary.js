import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert, FlatList } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useSidebar } from '../Sidebar/SidebarContext';


const ReliefSummary = ({ route }) => {
  const { reportData, addedItems } = route.params;
  const navigation = useNavigation();
  const { toggleSidebar } = useSidebar();

  const formatLabel = (key) => key.replace(/([A-Z])/g, ' $1').toLowerCase();

  const formatDate = (date) => {
    if (!date) return 'N/A';
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const handleSubmit = () => {
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

  const renderItem = ({ item }) => (
    <View style={styles.tableRow}>
      <Text style={styles.tableCell}>{item.itemName}</Text>
      <Text style={styles.tableCell}>{item.quantity}</Text>
      <Text style={styles.tableCell}>{item.notes}</Text>
    </View>
  );

  return (
    <ScrollView style={styles.container}>
      <TouchableOpacity style={styles.menu} onPress={toggleSidebar}>
        <Icon name="menu" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      <Text style={styles.header}>Relief Summary</Text>
      <Text style={styles.subheader}>[Organization Name]</Text>

      <View style={styles.formContainer}>

        {/* Requested Items Table */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Requested Items</Text>
          {addedItems && addedItems.length > 0 ? (
            <View style={styles.table}>
              <View style={styles.tableHeader}>
                <Text style={styles.tableHeaderCell}>Item Name</Text>
                <Text style={styles.tableHeaderCell}>Quantity</Text>
                <Text style={styles.tableHeaderCell}>Notes</Text>
              </View>
              <FlatList
                data={addedItems}
                renderItem={renderItem}
                keyExtractor={(item, index) => index.toString()}
              />
            </View>
          ) : (
            <Text style={styles.value}>No items added yet.</Text>
          )}
        </View>

        {/* Contact Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Contact Information</Text>
          {['contactPerson', 'contactNumber', 'email', 'barangay', 'donationCategory'].map((field) => (
            <View key={field} style={styles.fieldContainer}>
              <Text style={styles.label}>{formatLabel(field)}</Text>
              <Text style={styles.value}>{reportData[field]}</Text>
            </View>
          ))}
        
        </View>

      {/* Buttons */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>Back</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
          <Text style={styles.submitButtonText}>Submit</Text>
        </TouchableOpacity>
      </View>
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
    marginBottom: 10,
    color: '#14AEBB',
    fontFamily: 'Poppins_Medium'
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
    fontSize: 16,
    color: '#000000',
    marginTop: 2,
    fontFamily: 'Poppins_Regular'
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
    fontFamily: 'Poppins_Regular'
  },
  submitButton: {
    flex: 1,
    backgroundColor: '#14AEBB',
    borderRadius: 5,
    padding: 10,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    paddingTop: 5,
    fontFamily: 'Poppins_Regular',    
    textAlign: 'center',

  },
  table: {
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#4059A5',
    borderRadius: 5,
    overflow: 'hidden',
  },

  tableHeader: {
    flexDirection: 'row',
    backgroundColor: 'rgba(64, 89, 165, 0.5)',
    paddingVertical: 10,
    paddingHorizontal: 5,
  },
  tableHeaderCell: {
    flex: 1,
    textAlign: 'center',
    color: '#4059A5',
    fontFamily: 'Poppins_Bold'
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 10,
    paddingHorizontal: 5,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  tableCell: {
    flex: 1,
    textAlign: 'center',
    fontSize: 16,
    color: '#4059A5',
  },
});

export default ReliefSummary;
