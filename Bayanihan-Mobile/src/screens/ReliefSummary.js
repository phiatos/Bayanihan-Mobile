import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, FlatList } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import Theme from '../constants/theme';
import CustomModal from '../navigation/CustomModal';

const ReliefSummary = ({ route }) => {
  console.log('ReliefSummary params:', route.params);
  const { reportData = {}, addedItems: initialItems = [] } = route.params || {};
  const navigation = useNavigation();
  const [modalVisible, setModalVisible] = useState(false);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [addedItems, setAddedItems] = useState(initialItems);

  const formatLabel = (key) => key.replace(/([A-Z])/g, ' $1').toLowerCase();

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

  const handleDelete = (index) => {
    setItemToDelete(index);
    setDeleteModalVisible(true);
  };

  const confirmDelete = () => {
    setAddedItems((prevItems) => prevItems.filter((_, i) => i !== itemToDelete));
    setDeleteModalVisible(false);
    setItemToDelete(null);
  };

  const cancelDelete = () => {
    setDeleteModalVisible(false);
    setItemToDelete(null);
  };

  const handleBack = () => {
    navigation.navigate('ReliefRequest', { reportData, addedItems });
  };

  const renderItem = ({ item, index }) => (
    <View style={styles.tableRow}>
      <Text style={styles.tableCell}>{item.itemName || 'N/A'}</Text>
      <Text style={styles.tableCell}>{item.quantity || '0'}</Text>
      <Text style={styles.tableCell}>{item.notes || 'None'}</Text>
      <View style={styles.tableCell}>
        <TouchableOpacity onPress={() => handleDelete(index)}>
          <Ionicons name="trash-outline" size={20} color="#FF0000" />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.menuIcon} onPress={() => navigation.openDrawer()}>
          <Ionicons name="menu" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerText}>Relief Summary</Text>
      </View>
      <Text style={styles.subheader}>[Organization Name]</Text>
      <View style={styles.formContainer}>
        <View style={styles.section}> 
          {['contactPerson', 'contactNumber', 'email', 'barangay', 'city', 'donationCategory'].map(
            (field) => (
              <View key={field} style={styles.fieldContainer}>
                <Text style={styles.label}>{formatLabel(field)}:</Text>
                <Text style={styles.value}>{reportData[field] || 'N/A'}</Text>
              </View>
            )
          )}
        </View>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Requested Items</Text>
          {addedItems.length > 0 ? (
            <View style={styles.table}>
              <View style={styles.tableHeader}>
                <Text style={styles.tableHeaderCell}>Item Name</Text>
                <Text style={styles.tableHeaderCell}>Quantity</Text>
                <Text style={styles.tableHeaderCell}>Notes</Text>
                <Text style={styles.tableHeaderCell}>Actions</Text>
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
            <Ionicons name="checkmark-circle" size={60} color={Theme.colors.primary} style={styles.modalIcon} />
            <Text style={styles.modalMessage}>Report submitted successfully!</Text>
          </View>
        }
        onConfirm={handleConfirm}
        onCancel={handleCancel}
        confirmText="Proceed"
        showCancel={false}
      />

      <CustomModal
        visible={deleteModalVisible}
        title="Confirm Deletion"
        message={
          <View style={styles.modalContent}>
            <Ionicons name="warning-outline" size={60} color="#FF0000" style={styles.modalIcon} />
            <Text style={styles.modalMessage}>Are you sure you want to delete this item?</Text>
          </View>
        }
        onConfirm={confirmDelete}
        onCancel={cancelDelete}
        confirmText="Delete"
        cancelText="Cancel"
        showCancel={true}
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
    marginBottom: 20,
  },
  section: {
    marginVertical: 10,
    marginHorizontal: 15,
    borderWidth: 3,
    backgroundColor: '#FFF9F0',
    borderColor: Theme.colors.primary,
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
    color: '#14AEBB',
    fontFamily: 'Poppins_Bold',
  },
  label: {
    fontSize: 14,
    color: Theme.colors.primary,
    textTransform: 'capitalize',
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
    height: 45
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
  table: {
    borderWidth: 1,
    borderColor: '#4059A5',
    borderRadius: 5,
    overflow: 'hidden',
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: 'hsla(225, 44.10%, 44.90%, 0.23)',
    borderBottomWidth: 1,
    borderColor: '#4059A5',
    paddingVertical: 8,
    paddingHorizontal: 5,
  },
  tableHeaderCell: {
    flex: 1,
    textAlign: 'center',
    color: Theme.colors.black,
    fontFamily: 'Poppins_SemiBold',
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
    fontSize: 14,
    color: Theme.colors.black,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    alignItems: 'center',
    width: '100%',
    justifyContent: 'center'
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

export default ReliefSummary;