import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, Alert, SafeAreaView, StatusBar, Image, Dimensions } from 'react-native';
import { database, auth } from '../configuration/firebaseConfig';
import { ref, onValue } from 'firebase/database';
import { LinearGradient } from 'expo-linear-gradient';
import GlobalStyles from '../styles/GlobalStyles';
import { Ionicons } from '@expo/vector-icons';
import Theme from '../constants/theme';
import { useNavigation, useRoute } from '@react-navigation/native';
import styles from '../styles/TransactionStyles';


const TransactionDetailsScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { item } = route.params;
  const [submissionData, setSubmissionData] = useState({});
  const [imageDimensions, setImageDimensions] = useState({});
  const screenWidth = Dimensions.get('window').width;
  const maxImageWidth = screenWidth * 0.9;
  const maxImageHeight = 400;

  useEffect(() => {
    if (!database) {
      Alert.alert('Error', 'Firebase Realtime Database not initialized. Please check your configuration.');
      console.error(`[${new Date().toISOString()}] Firebase Realtime Database not initialized`);
      return;
    }
    if (!auth.currentUser) {
      Alert.alert('Error', 'Please log in to view transaction details');
      console.error(`[${new Date().toISOString()}] No authenticated user`);
      return;
    }
    fetchSubmissionData();
  }, []);

  const fetchSubmissionData = () => {
    try {
      const userId = auth.currentUser.uid;
      const submissionRef = ref(database, `submission_history/${userId}`);
      onValue(submissionRef, (snapshot) => {
        const data = snapshot.val();
        const submissions = data
          ? Object.entries(data).reduce((acc, [id, submission]) => {
              acc[submission.submissionId || id] = {
                id,
                collection: submission.collection,
                data: submission.data,
                timestamp: submission.timestamp,
                submissionId: submission.submissionId || null,
              };
              return acc;
            }, {})
          : {};
        setSubmissionData(submissions);
      }, { onlyOnce: true }, (error) => {
        Alert.alert('Error', `Failed to fetch submission history: ${error.message}`);
        console.error(`[${new Date().toISOString()}] Error fetching submission history:`, error);
      });
    } catch (error) {
      Alert.alert('Error', `Failed to fetch submission data: ${error.message}`);
      console.error(`[${new Date().toISOString()}] Error in fetchSubmissionData:`, error);
    }
  };

  const fieldLabels = {
    'callfordonation.donationId': 'Donation ID',
    'callfordonation.donationDrive': 'Donation Drive',
    'callfordonation.contact.person': 'Contact Person',
    'callfordonation.contact.number': 'Contact Number',
    'callfordonation.account.name': 'Account Name',
    'callfordonation.account.number': 'Account Number',
    'callfordonation.address.region': 'Region',
    'callfordonation.address.province': 'Province',
    'callfordonation.address.city': 'City',
    'callfordonation.address.barangay': 'Barangay',
    'callfordonation.address.street': 'Street',
    'callfordonation.address.fullAddress': 'Full Address',
    'callfordonation.facebookLink': 'Facebook Link',
    'callfordonation.status': 'Status',
    'callfordonation.userUid': 'User ID',
    'callfordonation.timestamp': 'Submission Time',
    'posts.title': 'Post Title',
    'posts.content': 'Content',
    'posts.category': 'Category',
    'posts.userName': 'User Name',
    'posts.organization': 'Organization',
    'posts.mediaType': 'Media Type',
    'posts.mediaUrls': 'Media URLs',
    'posts.mediaUrl': 'Media URL',
    'posts.thumbnailUrl': 'Thumbnail URL',
    'posts.userId': 'User ID',
    'posts.timestamp': 'Submission Time',
    'rdana/submitted.rdanaId': 'RDANA ID',
    'rdana/submitted.rdanaGroup': 'Organization',
    'rdana/submitted.siteLocation': 'Site Location',
    'rdana/submitted.disasterType': 'Disaster Type',
    'rdana/submitted.effects.affectedPopulation': 'Affected Population',
    'rdana/submitted.effects.estQty': 'Estimated Quantity',
    'rdana/submitted.effects.familiesServed': 'Families Served',
    'rdana/submitted.needs.priority': 'Priority Needs',
    'rdana/submitted.needsChecklist': 'Needs Checklist',
    'rdana/submitted.profile.Site_Location_Address_Barangay': 'Barangay',
    'rdana/submitted.profile.Site_Location_Address_City_Municipality': 'City/Municipality',
    'rdana/submitted.profile.Site_Location_Address_Province': 'Province',
    'rdana/submitted.profile.Time_of_Information_Gathered': 'Time of Information Gathered',
    'rdana/submitted.profile.Time_of_Occurrence': 'Time of Occurrence',
    'rdana/submitted.profile.Type_of_Disaster': 'Disaster Type',
    'rdana/submitted.profile.Date_of_Information_Gathered': 'Date of Information Gathered',
    'rdana/submitted.profile.Date_of_Occurrence': 'Date of Occurrence',
    'rdana/submitted.profile.Local_Authorities_Persons_Contacted_for_Information': 'Local Authorities Contacted',
    'rdana/submitted.profile.Name_of_the_Organizations_Involved': 'Organizations Involved',
    'rdana/submitted.profile.Locations_and_Areas_Affected_Barangay': 'Affected Barangay',
    'rdana/submitted.profile.Locations_and_Areas_Affected_City_Municipality': 'Affected City/Municipality',
    'rdana/submitted.profile.Locations_and_Areas_Affected_Province': 'Affected Province',
    'rdana/submitted.modality.Locations_and_Areas_Affected': 'Areas Affected',
    'rdana/submitted.modality.Type_of_Disaster': 'Disaster Type',
    'rdana/submitted.modality.Date_and_Time_of_Occurrence': 'Date and Time of Occurrence',
    'rdana/submitted.summary': 'Summary',
    'rdana/submitted.affectedCommunities': 'Affected Communities',
    'rdana/submitted.structureStatus': 'Structure Status',
    'rdana/submitted.otherNeeds': 'Other Needs',
    'rdana/submitted.responseGroup': 'Response Group',
    'rdana/submitted.reliefDeployed': 'Relief Deployed',
    'rdana/submitted.familiesServed': 'Families Served',
    'rdana/submitted.userUid': 'User ID',
    'rdana/submitted.status': 'Status',
    'rdana/submitted.timestamp': 'Submission Time',
    'requestRelief/requests.contactPerson': 'Contact Person',
    'requestRelief/requests.contactNumber': 'Contact Number',
    'requestRelief/requests.email': 'Email',
    'requestRelief/requests.address': 'Address',
    'requestRelief/requests.city': 'City',
    'requestRelief/requests.category': 'Category',
    'requestRelief/requests.volunteerOrganization': 'Volunteer Organization',
    'requestRelief/requests.userUid': 'User ID',
    'requestRelief/requests.items': 'Items',
    'requestRelief/requests.timestamp': 'Submission Time',
    'reports/submitted.reportID': 'Report ID',
    'reports/submitted.AreaOfOperation': 'Area of Operation',
    'reports/submitted.DateOfReport': 'Date of Report',
    'reports/submitted.calamityArea': 'Calamity Area',
    'reports/submitted.TimeOfIntervention': 'Time of Intervention',
    'reports/submitted.StartDate': 'Start Date',
    'reports/submitted.EndDate': 'End Date',
    'reports/submitted.NoOfIndividualsOrFamilies': 'Individuals/Families Served',
    'reports/submitted.NoOfFoodPacks': 'Food Packs',
    'reports/submitted.NoOfHotMeals': 'Hot Meals',
    'reports/submitted.LitersOfWater': 'Liters of Water',
    'reports/submitted.NoOfVolunteersMobilized': 'Volunteers Mobilized',
    'reports/submitted.NoOfOrganizationsActivated': 'Organizations Activated',
    'reports/submitted.TotalValueOfInKindDonations': 'In-Kind Donations Value',
    'reports/submitted.TotalMonetaryDonations': 'Monetary Donations',
    'reports/submitted.NotesAdditionalInformation': 'Additional Notes',
    'reports/submitted.status': 'Status',
    'reports/submitted.userUid': 'User ID',
    'reports/submitted.organization': 'Organization',
    'reports/submitted.timestamp': 'Submission Time',
    'profile.action': 'Action',
    'profile.newPasswordLength': 'Password Length',
  };

  const flattenObject = (obj, prefix = '', maxDepth = 2) => {
    const result = [];
    const images = [];
    const flatten = (obj, prefix, depth) => {
      Object.entries(obj).forEach(([key, value]) => {
        const newKey = prefix ? `${prefix}.${key}` : key;
        if (depth >= maxDepth || typeof value !== 'object' || value === null) {
          if (key === 'image' && typeof value === 'string' && value.startsWith('data:image')) {
            images.push({ key: newKey, value, type: 'image' });
          } else {
            result.push({ key: newKey, value: Array.isArray(value) ? `${value.length} item(s)` : value || 'N/A', type: 'text' });
          }
        } else if (Array.isArray(value)) {
          result.push({ key: newKey, value: `${value.length} item(s)`, type: 'text' });
        } else {
          flatten(value, newKey, depth + 1);
        }
      });
    };
    flatten(obj, prefix, 0);
    return { details: result, images };
  };

  const findSubmissionData = useMemo(() => {
    return (item) => {
      if (!item.submissionId) {
        const activityTime = item.timestamp;
        return Object.values(submissionData).find((submission) => {
          const submissionTime = submission.timestamp;
          return Math.abs(submissionTime - activityTime) < 1000;
        });
      }
      return submissionData[item.submissionId];
    };
  }, [submissionData]);

  const details = useMemo(() => {
    const submission = findSubmissionData(item);
    if (!submission) {
      return [{ key: 'Action', value: item.message, type: 'text' }];
    }
    const { details, images } = flattenObject(submission.data, submission.collection);
    const detailItems = [
      { key: 'Action', value: item.message, type: 'text' },
      ...details.map(({ key, value, type }) => ({
        key: fieldLabels[key] || key.split('.').pop(),
        value,
        type,
      })),
      ...images.map(({ key, value, type }) => ({
        key: fieldLabels[key] || 'Image',
        value,
        type,
      })),
    ];
    images.forEach(({ key, value }) => {
      Image.getSize(
        value,
        (width, height) => {
          const aspectRatio = width / height;
          let scaledWidth = width;
          let scaledHeight = height;
          if (width > maxImageWidth) {
            scaledWidth = maxImageWidth;
            scaledHeight = maxImageWidth / aspectRatio;
          }
          if (scaledHeight > maxImageHeight) {
            scaledHeight = maxImageHeight;
            scaledWidth = maxImageHeight * aspectRatio;
          }
          setImageDimensions((prev) => ({
            ...prev,
            [key]: { width: scaledWidth, height: scaledHeight },
          }));
        },
        (error) => {
          console.error(`[${new Date().toISOString()}] Error getting image size for ${key}:`, error);
          setImageDimensions((prev) => ({
            ...prev,
            [key]: { width: 200, height: 200 },
          }));
        }
      );
    });
    return detailItems;
  }, [item, submissionData]);

  const RenderDetailItem = React.memo(({ item }) => {
    if (item.type === 'image') {
      const dimensions = imageDimensions[item.key] || { width: 200, height: 200 };
      return (
        <View style={styles.imageContainer}>
          <Text style={styles.detailKey}>{item.key}:</Text>
          <Image
            source={{ uri: item.value }}
            style={[styles.image, { width: dimensions.width, height: dimensions.height }]}
            resizeMode="contain"
            onError={(error) => console.error(`[${new Date().toISOString()}] Image load error:`, error)}
          />
        </View>
      );
    }
    return (
      <View style={styles.detailRow}>
        <Text style={styles.detailKey}>{item.key}:</Text>
        <Text style={styles.detailValue}>{item.value}</Text>
      </View>
    );
  });

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
          <TouchableOpacity onPress={() => navigation.goBack()} style={GlobalStyles.headerMenuIcon}>
            <Ionicons name="arrow-back" size={32} color={Theme.colors.primary} />
          </TouchableOpacity>
          <Text style={[GlobalStyles.headerTitle, { color: Theme.colors.primary }]}>Transaction Details</Text>
        </View>
      </LinearGradient>
        
     
        <View  style={styles.contentContainer}>
        <Text style={styles.subtitle}>
          Date: {new Date(item.timestamp).toLocaleString()}
        </Text>
        <FlatList
          data={details}
          renderItem={({ item }) => <RenderDetailItem item={item} />}
          keyExtractor={item => `${item.key}-${item.type}`}
          style={styles.detailContainer}
          ListEmptyComponent={<Text>No details available</Text>}
        />
      </View>
    </SafeAreaView>
  );
};

export default TransactionDetailsScreen;