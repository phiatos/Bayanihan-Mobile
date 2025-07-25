import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, Button, Modal, ScrollView, StyleSheet, TouchableOpacity, Alert, SafeAreaView, StatusBar, KeyboardAvoidingView, Platform } from 'react-native';
import { db } from '../configuration/firebaseConfig';
import { ref, onValue } from 'firebase/database';
import { getAuth } from 'firebase/auth';
import { LinearGradient } from 'expo-linear-gradient';
import GlobalStyles from '../styles/GlobalStyles';
import { Ionicons } from '@expo/vector-icons';
import Theme from '../constants/theme';
import { useNavigation } from '@react-navigation/native';

const SubmissionHistoryScreen = () => {
  const navigation = useNavigation();
  const [history, setHistory] = useState([]);
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const auth = getAuth();
  const user = auth.currentUser;

  useEffect(() => {
    if (user) {
      fetchSubmissions();
    } else {
      Alert.alert('Error', 'Please log in to view your submission history');
    }
    // Cleanup listeners on unmount
    return () => {
      // Detach listeners (handled automatically by onValue cleanup in Firebase SDK)
    };
  }, [user]);

  const fetchSubmissions = () => {
    try {
      const userId = user.uid;
      const allSubmissions = [];

      // Helper function to fetch from a Realtime Database path
      const fetchFromPath = (path, useUserFilter = true) => {
        const dbRef = ref(db, path);
        onValue(dbRef, (snapshot) => {
          const data = snapshot.val();
          if (!data) return;

          const submissions = Object.entries(data).map(([id, value]) => ({
            id,
            collection: path,
            data: value,
            timestamp: value.timestamp || value.createdAt || new Date().toISOString(),
          }));

          // Filter by userId if required
          const filteredSubmissions = useUserFilter
            ? submissions.filter((submission) => submission.data.userId === userId)
            : submissions;

          // Update history state
          setHistory((prev) => {
            const otherSubmissions = prev.filter((item) => item.collection !== path);
            const updatedSubmissions = [...otherSubmissions, ...filteredSubmissions];
            return updatedSubmissions.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
          });
        }, (error) => {
          Alert.alert('Error', `Failed to fetch data from ${path}: ${error.message}`);
          console.error(error);
        });
      };

      // Define paths and whether to filter by userId
      const paths = [
        { path: 'callfordonation', useUserFilter: true },
        { path: 'posts', useUserFilter: true },
        { path: 'rdana', useUserFilter: true },
        { path: 'requestRelief/requests', useUserFilter: true },
        { path: 'reports/submitted', useUserFilter: true },
      ];

      // Attach listeners to all paths
      paths.forEach(({ path, useUserFilter }) => fetchFromPath(path, useUserFilter));
    } catch (error) {
      Alert.alert('Error', `Failed to fetch submission history: ${error.message}`);
      console.error(error);
    }
  };

  const renderSubmission = ({ item }) => (
    <View style={styles.submissionItem}>
      <Text style={styles.submissionText}>
        {item.collection} - {new Date(item.timestamp).toLocaleDateString()}
      </Text>
      <TouchableOpacity
        style={styles.viewButton}
        onPress={() => {
          setSelectedSubmission(item);
          setModalVisible(true);
        }}
      >
        <Text style={styles.viewButtonText}>View Details</Text>
      </TouchableOpacity>
    </View>
  );

  const renderSubmissionDetails = () => {
    if (!selectedSubmission) return null;
    const { data } = selectedSubmission;

    const details = Object.entries(data).map(([key, value]) => (
      <View key={key} style={styles.detailRow}>
        <Text style={styles.detailKey}>{key}:</Text>
        <Text style={styles.detailValue}>
          {typeof value === 'object' ? JSON.stringify(value) : value}
        </Text>
      </View>
    ));

    return (
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{selectedSubmission.collection}</Text>
            <Text style={styles.modalSubtitle}>
              Submitted on: {new Date(selectedSubmission.timestamp).toLocaleString()}
            </Text>
            <ScrollView style={styles.detailContainer}>{details}</ScrollView>
            <Button title="Close" onPress={() => setModalVisible(false)} />
          </View>
        </View>
      </Modal>
    );
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
          <Text style={[GlobalStyles.headerTitle, { color: Theme.colors.primary }]}>Transactions History</Text>
        </View>
      </LinearGradient>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1, marginTop: 80 }}
        keyboardVerticalOffset={0}
      >
        <ScrollView
          contentContainerStyle={[styles.scrollViewContent]}
          scrollEnabled={true}
          keyboardShouldPersistTaps="handled"
        >
          <View style={GlobalStyles.form}>
            <FlatList
              data={history}
              renderItem={renderSubmission}
              keyExtractor={item => `${item.collection}-${item.id}`}
              ListEmptyComponent={<Text>No submissions found</Text>}
            />
            {renderSubmissionDetails()}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  submissionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  submissionText: {
    fontSize: 16,
  },
  viewButton: {
    backgroundColor: '#007AFF',
    padding: 8,
    borderRadius: 5,
  },
  viewButtonText: {
    color: '#fff',
    fontSize: 14,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 10,
    width: '90%',
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  modalSubtitle: {
    fontSize: 16,
    marginBottom: 10,
    color: '#666',
  },
  detailContainer: {
    marginBottom: 20,
  },
  detailRow: {
    flexDirection: 'row',
    marginBottom: 5,
  },
  detailKey: {
    fontWeight: 'bold',
    width: 120,
  },
  detailValue: {
    flex: 1,
  },
});

export default SubmissionHistoryScreen;