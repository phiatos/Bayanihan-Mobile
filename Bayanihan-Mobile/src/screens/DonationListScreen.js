// DonationListScreen.js
import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  TextInput,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';

const DonationListScreen = () => {
  const navigation = useNavigation();
  const [donationInfoList, setDonationInfoList] = useState([
    {
      no: 1,
      donationDrive: 'yolanda',
      contactName: 'james',
      contactNumber: '09761658549',
      accountNumber: '09761658549',
      accountName: 'james roswell',
      exactDropOffAddress: '1724 tramo, Barangay 2, Guibat, Sorsogon',
      facebookLink: 'Visit The Page',
    },
    {
      no: 2,
      donationDrive: 'kristine',
      contactName: 'kristen',
      contactNumber: '09155867857',
      accountNumber: '09155867857',
      accountName: 'sophia kirsten',
      exactDropOffAddress: '213 emilio st. Barangay 3, Castilla, Sorsogon',
      facebookLink: 'Visit The Page',
    },
    {
      no: 3,
      donationDrive: 'jem',
      contactName: 'jem',
      contactNumber: '000',
      accountNumber: '000',
      accountName: 'jem',
      exactDropOffAddress: '789 del pilar st. Barangay 1, Sorsogon City, Sorsogon',
      facebookLink: 'Visit The Page',
    },
    // ... more data will come here
  ]);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5; // Adjust as needed

  const goBackToSubmission = () => {
    navigation.goBack();
  };

  const handleViewImage = (index) => {
    console.log('View Image pressed for index:', index);
  };

  const handleDeleteDonation = (index) => {
    const updatedList = donationInfoList.filter((_, i) => i !== index);
    setDonationInfoList(updatedList.map((item, i) => ({ ...item, no: i + 1 })));
  };

  const handleSearch = () => {
    console.log('Search term:', searchTerm);
    // Implement your search logic here
  };

  const handleSort = (criteria) => {
    setSortBy(criteria);
    console.log('Sort by:', criteria);
    // Implement your sorting logic here
  };

  const handleExportCSV = () => {
    console.log('Export to CSV pressed');
    // Implement your CSV export logic here
  };

  const goToPreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const goToNextPage = () => {
    const totalPages = Math.ceil(donationInfoList.length / itemsPerPage);
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentDonationInfo = donationInfoList.slice(startIndex, endIndex);

  return (
    <ScrollView style={styles.container}>
      <View style={styles.headerButtons}>
        <TouchableOpacity style={styles.backButton} onPress={goBackToSubmission}>
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.title}>Donation Information</Text>

      <View style={styles.listHeader}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search"
          value={searchTerm}
          onChangeText={setSearchTerm}
        />
        <TouchableOpacity style={styles.searchButton} onPress={handleSearch}>
          <Text>Search</Text>
        </TouchableOpacity>
        <View style={styles.sortContainer}>
          <Text>Sort by</Text>
          <TouchableOpacity style={styles.sortButton} onPress={() => handleSort('donationDrive')}>
            <Text>{sortBy === 'donationDrive' ? 'Donation Drive ▼' : 'Donation Drive'}</Text>
          </TouchableOpacity>
          {/* Add more sort options */}
        </View>
      </View>

      <View style={styles.tableHeader}>
        <Text style={styles.headerCell}>No.</Text>
        <Text style={styles.headerCell}>Donation Drive</Text>
        <Text style={styles.headerCell}>Contact Name</Text>
        <Text style={styles.headerCell}>Contact Number</Text>
        <Text style={styles.headerCell}>Account Number</Text>
        <Text style={styles.headerCell}>Account Name</Text>
        <Text style={styles.headerCell}>Exact Drop Off Address</Text>
        <Text style={styles.headerCell}>Facebook Link</Text>
        <Text style={styles.headerCell}>Action</Text>
      </View>

      {currentDonationInfo.map((item, index) => (
        <View style={styles.tableRow} key={index}>
          <Text style={styles.cell}>{startIndex + index + 1}</Text>
          <Text style={styles.cell}>{item.donationDrive}</Text>
          <Text style={styles.cell}>{item.contactName}</Text>
          <Text style={styles.cell}>{item.contactNumber}</Text>
          <Text style={styles.cell}>{item.accountNumber}</Text>
          <Text style={styles.cell}>{item.accountName}</Text>
          <Text style={styles.cell}>{item.exactDropOffAddress}</Text>
          <TouchableOpacity onPress={() => console.log('Visit Link:', item.facebookLink)}>
            <Text style={[styles.cell, styles.linkText]}>{item.facebookLink}</Text>
          </TouchableOpacity>
          <View style={styles.actionButtons}>
            <TouchableOpacity style={styles.viewButton} onPress={() => handleViewImage(index)}>
              <Text style={styles.buttonText}>View Image</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.deleteButton} onPress={() => handleDeleteDonation(index)}>
              <Text style={styles.buttonText}>Delete</Text>
            </TouchableOpacity>
          </View>
        </View>
      ))}

      <View style={styles.pagination}>
        <Text>Showing {startIndex + 1} to {Math.min(endIndex, donationInfoList.length)} of {donationInfoList.length} entries</Text>
        <View style={styles.paginationButtons}>
          <TouchableOpacity
            style={[styles.pageButton, currentPage === 1 && styles.disabledButton]}
            onPress={goToPreviousPage}
            disabled={currentPage === 1}
          >
            <Text>Prev</Text>
          </TouchableOpacity>
          <Text>{currentPage}</Text>
          <TouchableOpacity
            style={[
              styles.pageButton,
              currentPage === Math.ceil(donationInfoList.length / itemsPerPage) && styles.disabledButton,
            ]}
            onPress={goToNextPage}
            disabled={currentPage === Math.ceil(donationInfoList.length / itemsPerPage)}
          >
            <Text>Next</Text>
          </TouchableOpacity>
        </View>
      </View>

      <TouchableOpacity style={styles.exportButton} onPress={handleExportCSV}>
        <Text style={styles.exportButtonText}>Export In-Kind to CSV</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 16,
    backgroundColor: '#fff',
  },
  headerButtons: {
    alignItems: 'flex-end',
    marginBottom: 10,
  },
  backButton: {
    backgroundColor: '#6c757d', // Gray button
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 5,
  },
  backButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#3f51b5', // Indigo color
    textAlign: 'center',
  },
  listHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  searchInput: {
    flex: 1,
    height: 40,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 4,
    paddingHorizontal: 8,
    marginRight: 8,
  },
  searchButton: {
    backgroundColor: '#03a9f4', // Light blue color
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 4,
    alignItems: 'center',
    marginRight: 8,
  },
  sortContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sortButton: {
    marginLeft: 8,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f0f0f0',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderColor: '#ccc',
  },
  headerCell: {
    flex: 1,
    fontWeight: 'bold',
    paddingHorizontal: 8,
    fontSize: 12,
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderColor: '#eee',
  },
  cell: {
    flex: 1,
    paddingHorizontal: 8,
    fontSize: 12,
  },
  linkText: {
    color: '#2196f3', // Blue link color
  },
  actionButtons: {
    flex: 1.5,
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 8,
  },
  viewButton: {
    backgroundColor: '#2196f3', // Blue view button
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 4,
  },
  deleteButton: {
    backgroundColor: '#f44336', // Red delete button
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 4,
  },
  buttonText: {
    color: '#fff',
    fontSize: 10,
    textAlign: 'center',
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
  },
  paginationButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pageButton: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 4,
    marginLeft: 5,
  },
  disabledButton: {
    backgroundColor: '#eee',
    borderColor: '#ddd',
    color: '#999',
  },
  exportButton: {
    backgroundColor: '#00bcd4', // Cyan color
    paddingVertical: 12,
    borderRadius: 4,
    alignItems: 'center',
    marginTop: 20,
  },
  exportButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default DonationListScreen;