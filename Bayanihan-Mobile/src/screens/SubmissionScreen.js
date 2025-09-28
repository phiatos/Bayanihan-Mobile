import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Alert,
  SafeAreaView,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
  Image,
  Dimensions,
  ScrollView,
  ToastAndroid,
} from 'react-native';
import { database } from '../configuration/firebaseConfig';
import { ref, onValue, query, limitToLast, orderByChild, startAfter } from 'firebase/database';
import { LinearGradient } from 'expo-linear-gradient';
import GlobalStyles from '../styles/GlobalStyles';
import { Ionicons } from '@expo/vector-icons';
import Theme from '../constants/theme';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import styles from '../styles/SubmissionStyles';
import OperationCustomModal from '../components/OperationCustomModal';

const SubmissionScreen = () => {
  const navigation = useNavigation();
  const { user } = useAuth();
  const [history, setHistory] = useState([]);
  const [submissionData, setSubmissionData] = useState({});
  const [imageDimensions, setImageDimensions] = useState({});
  const [lastTimestamp, setLastTimestamp] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const screenWidth = Dimensions.get('window').width;
  const maxImageWidth = screenWidth * 0.9;
  const maxImageHeight = 400;
  const PAGE_SIZE = 15;

  useEffect(() => {
    if (!database) {
      Alert.alert('Error', 'Firebase Realtime Database not initialized. Please check your configuration.');
      console.error(`[${new Date().toISOString()}] Firebase Realtime Database not initialized`);
      return;
    }
    if (!user) {
      Alert.alert('Error', 'Please log in to view your activity history');
      console.log(`[${new Date().toISOString()}] No user logged in, redirecting to Login`);
      navigation.navigate('Login');
      return;
    }

    const activityUnsubscribe = fetchHistory();
    const submissionUnsubscribe = fetchSubmissionData();

    return () => {
      if (activityUnsubscribe) activityUnsubscribe();
      if (submissionUnsubscribe) submissionUnsubscribe();
      console.log(`[${new Date().toISOString()}] Cleaned up Firebase listeners`);
    };
  }, [user]);

  const fetchHistory = useCallback(() => {
    try {
      const userId = user.id;
      const logsRef = ref(database, `activity_logs/${userId}`);
      const logRef = ref(database, `activity_log/${userId}`);
      const logsQuery = query(logsRef, orderByChild('timestamp'), limitToLast(PAGE_SIZE));
      const logQuery = query(logRef, orderByChild('timestamp'), limitToLast(PAGE_SIZE));

      const unsubscribeLogs = onValue(
        logsQuery,
        (snapshot) => {
          const data = snapshot.val();
          const activities = data
            ? Object.entries(data).map(([id, activity]) => ({
                id,
                message: activity.message || 'No message',
                timestamp: activity.timestamp || 0,
                submissionId: activity.submissionId || null,
                node: 'activity_logs',
              }))
            : [];

          onValue(
            logQuery,
            (snapshot2) => {
              const data2 = snapshot2.val();
              const activities2 = data2
                ? Object.entries(data2).map(([id, activity]) => ({
                    id,
                    message: activity.message || 'No message',
                    timestamp: activity.timestamp || 0,
                    submissionId: activity.submissionId || null,
                    node: 'activity_log',
                  }))
                : [];
              console.log(`[${new Date().toISOString()}] activity_log fetched: ${activities2.length} items`, activities2);

              // Combine and deduplicate
              const combined = [...activities, ...activities2];
              const uniqueActivities = Array.from(
                new Map(
                  combined.map((item) => [`${item.submissionId || item.id}-${item.timestamp}`, item])
                ).values()
              ).sort((a, b) => b.timestamp - a.timestamp);

              setHistory(uniqueActivities);
              setHasMore(uniqueActivities.length >= PAGE_SIZE);
              if (uniqueActivities.length > 0) {
                setLastTimestamp(uniqueActivities[uniqueActivities.length - 1].timestamp);
              }
              console.log(
                `[${new Date().toISOString()}] Combined activity log fetched: ${uniqueActivities.length} items`,
                uniqueActivities
              );
            },
            (error) => {
              return;
            }
          );
        },
        (error) => {
          return;
        }
      );

      return () => {
        unsubscribeLogs();
      };
    } catch (error) {
      
      return () => {};
    }
  }, [user]);

  const fetchMoreHistory = useCallback(() => {
    if (!hasMore || !lastTimestamp) return;
    try {
      const userId = user.id;
      const logsRef = ref(database, `activity_logs/${userId}`);
      const logRef = ref(database, `activity_log/${userId}`);
      const logsQuery = query(logsRef, orderByChild('timestamp'), startAfter(lastTimestamp), limitToLast(PAGE_SIZE));
      const logQuery = query(logRef, orderByChild('timestamp'), startAfter(lastTimestamp), limitToLast(PAGE_SIZE));

      const unsubscribeLogs = onValue(
        logsQuery,
        (snapshot) => {
          const data = snapshot.val();
          const activities = data
            ? Object.entries(data).map(([id, activity]) => ({
                id,
                message: activity.message || 'No message',
                timestamp: activity.timestamp || 0,
                submissionId: activity.submissionId || null,
                node: 'activity_logs',
              }))
            : [];
          console.log(`[${new Date().toISOString()}] More activity_logs fetched: ${activities.length} items`, activities);

          onValue(
            logQuery,
            (snapshot2) => {
              const data2 = snapshot2.val();
              const activities2 = data2
                ? Object.entries(data2).map(([id, activity]) => ({
                    id,
                    message: activity.message || 'No message',
                    timestamp: activity.timestamp || 0,
                    submissionId: activity.submissionId || null,
                    node: 'activity_log',
                  }))
                : [];
              console.log(
                `[${new Date().toISOString()}] More activity_log fetched: ${activities2.length} items`,
                activities2
              );

              // Combine and deduplicate
              const combined = [...activities, ...activities2];
              const uniqueActivities = Array.from(
                new Map(
                  combined.map((item) => [`${item.submissionId || item.id}-${item.timestamp}`, item])
                ).values()
              ).sort((a, b) => b.timestamp - a.timestamp);

              setHistory((prev) => {
                const allActivities = [...prev, ...uniqueActivities];
                return Array.from(
                  new Map(
                    allActivities.map((item) => [`${item.submissionId || item.id}-${item.timestamp}`, item])
                  ).values()
                ).sort((a, b) => b.timestamp - a.timestamp);
              });
              setHasMore(uniqueActivities.length >= PAGE_SIZE);
              if (uniqueActivities.length > 0) {
                setLastTimestamp(uniqueActivities[uniqueActivities.length - 1].timestamp);
              }
              console.log(
                `[${new Date().toISOString()}] Combined more activity log fetched: ${uniqueActivities.length} items`,
                uniqueActivities
              );
            },
            (error) => {
              ToastAndroid.show('Failed to fetch more activity_log.', ToastAndroid.SHORT);
            }
          );
        },
        (error) => {
          ToastAndroid.show('Failed to fetch more activity_logs.', ToastAndroid.SHORT);
        }
      );

      return () => {
        unsubscribeLogs();
      };
    } catch (error) {
      ToastAndroid.show('Failed to fetch more history.', ToastAndroid.SHORT);
    
      return () => {};
    }
  }, [user, lastTimestamp, hasMore]);

  const fetchSubmissionData = useCallback(() => {
    try {
      const userId = user.id;
      const logsRef = ref(database, `activity_logs/${userId}`);
      const logRef = ref(database, `activity_log/${userId}`);

      const unsubscribeLogs = onValue(
        logsRef,
        (snapshot) => {
          const data = snapshot.val();
          const submissions = data
            ? Object.entries(data).reduce((acc, [id, submission]) => {
                acc[submission.submissionId || id] = {
                  id,
                  collection: submission.collection || 'Admin',
                  data: submission.data || {},
                  timestamp: submission.timestamp || 0,
                  submissionId: submission.submissionId || id,
                  node: 'activity_logs',
                };
                return acc;
              }, {})
            : {};
          console.log(
            `[${new Date().toISOString()}] activity_logs submission data fetched: ${Object.keys(submissions).length} items`,
            submissions
          );

          onValue(
            logRef,
            (snapshot2) => {
              const data2 = snapshot2.val();
              const submissions2 = data2
                ? Object.entries(data2).reduce((acc, [id, submission]) => {
                    acc[submission.submissionId || id] = {
                      id,
                      collection: submission.collection || 'Admin',
                      data: submission.data || {},
                      timestamp: submission.timestamp || 0,
                      submissionId: submission.submissionId || id,
                      node: 'activity_log',
                    };
                    return acc;
                  }, {})
                : {};

              // Merge submissions
              setSubmissionData({ ...submissions, ...submissions2 });
              console.log(
                `[${new Date().toISOString()}] Combined submission data fetched: ${
                  Object.keys({ ...submissions, ...submissions2 }).length
                } items`,
                { ...submissions, ...submissions2 }
              );
            },
            (error) => {
             return;
            }
          );
        },
        (error) => {
          return
        }
      );

      return () => {
        unsubscribeLogs();
      };
    } catch (error) {
      return () => {};
    }
  }, [user]);

  const fieldLabels = {
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
    'rdana.disasterType': 'Disaster Type',
    'rdana.siteLocation': 'Site Location',
    'rdana.rdanaId': 'RDANA ID',
    'rdana.rdanaGroup': 'Organization',
    'relief.contactPerson': 'Contact Person',
    'relief.address': 'Address',
    'relief.donationCategory': 'Donation Category',
    'relief.items': 'Items',
  };

  const flattenObject = (obj, prefix = '', maxDepth = 2) => {
    const result = [];
    const images = [];
    const flatten = (obj, prefix, depth) => {
      Object.entries(obj).forEach(([key, value]) => {
        const newKey = prefix ? `${prefix}.${key}` : key;
        if (depth >= maxDepth || typeof value !== 'object' || value === null) {
          if (key === 'mediaUrl' && typeof value === 'string' && value.startsWith('data:image')) {
            images.push({ key: newKey, value, type: 'image' });
          } else {
            result.push({
              key: newKey,
              value: Array.isArray(value) ? `${value.length} item(s)` : value || 'N/A',
              type: 'text',
            });
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

  const findSubmissionData = useCallback(
    (item) => {
      if (!item.submissionId) {
        console.warn(
          `[${new Date().toISOString()}] No submissionId for activity`,
          item
        );
        return null;
      }
      const submission = submissionData[item.submissionId];
      if (!submission) {
        console.warn(
          `[${new Date().toISOString()}] No submission found for submissionId: ${item.submissionId}`,
          { availableSubmissionIds: Object.keys(submissionData) }
        );
      }
      return submission;
    },
    [submissionData]
  );

  const getDetails = useCallback(
    (item) => {
      const submission = findSubmissionData(item);
      if (!submission) {
        return [{ key: 'Action', value: item.message, type: 'text' }];
      }
      const { details, images } = flattenObject(submission.data, submission.collection);
      const detailItems = [
        { key: 'Action', value: item.message, type: 'text' },
        { key: 'Collection', value: submission.collection, type: 'text' },
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
    },
    [submissionData]
  );

  const isModalAction = (message) => {
    return (
      message.includes('created a new post') ||
      message.includes('edited a post') ||
      message.includes('deleted a post') ||
      message.includes('commented on a post')
    );
  };

  const RenderHistoryItem = React.memo(({ item }) => (
    <View style={styles.historyItem}>
      <View style={styles.historyTime}>
        <Text style={styles.historyTimeText}>
          {new Date(item.timestamp).toLocaleDateString()}
        </Text>
      </View>
      <View style={styles.historyMessage}>
        <Text style={styles.historyMessageText}>{item.message}</Text>
      </View>
      <TouchableOpacity
        style={styles.viewButton}
        onPress={() => {
          if (isModalAction(item.message)) {
            navigation.navigate('TransactionDetailsScreen', { item });
          } else {
            navigation.navigate('TransactionDetailsScreen', { item });
          }
        }}
      >
        <Text style={styles.viewButtonText}>View Details</Text>
      </TouchableOpacity>
    </View>
  ));

  const RenderDetailItem = React.memo(({ item }) => {
    if (item.type === 'image') {
      const dimensions = imageDimensions[item.key] || { width: 200, height: 200 };
      return (
        <View style={styles.modalImageContainer}>
          <Text style={styles.modalDetailKey}>{item.key}:</Text>
          <Image
            source={{ uri: item.value }}
            style={[styles.modalImage, { width: dimensions.width, height: dimensions.height }]}
            resizeMode="contain"
            onError={(error) =>
              console.error(`[${new Date().toISOString()}] Image load error:`, error)
            }
          />
        </View>
      );
    }
    return (
      <View style={styles.modalDetailRow}>
        <Text style={styles.modalDetailKey}>{item.key}:</Text>
        <Text style={styles.modalDetailValue}>{item.value}</Text>
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
          <TouchableOpacity
            onPress={() => navigation.openDrawer()}
            style={GlobalStyles.headerMenuIcon}
          >
            <Ionicons name="menu" size={32} color={Theme.colors.primary} />
          </TouchableOpacity>
          <Text style={[GlobalStyles.headerTitle, { color: Theme.colors.primary }]}>
            Transaction History
          </Text>
        </View>
      </LinearGradient>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1, marginTop: 80 }}
        keyboardVerticalOffset={0}
      >
        <ScrollView
          contentContainerStyle={styles.scrollViewContent}
          scrollEnabled={true}
          keyboardShouldPersistTaps="handled"
        >
          <View style={GlobalStyles.form}>
            <FlatList
              data={history}
              renderItem={({ item }) => <RenderHistoryItem item={item} />}
              keyExtractor={(item) => `${item.node}-${item.id}`}
              ListEmptyComponent={<Text style={styles.noActivity}>No activities found</Text>}
              ListFooterComponent={
                hasMore ? (
                  <TouchableOpacity style={GlobalStyles.button} onPress={fetchMoreHistory}>
                    <Text style={GlobalStyles.buttonText}>Load More</Text>
                  </TouchableOpacity>
                ) : null
              }
            />
            <OperationCustomModal
              visible={modalVisible}
              title="Activity Details"
              message={
                selectedItem ? (
                  <FlatList
                    data={getDetails(selectedItem)}
                    renderItem={({ item }) => <RenderDetailItem item={item} />}
                    keyExtractor={(item) => `${item.key}-${item.type}`}
                    style={styles.modalDetailContainer}
                    ListHeaderComponent={
                      <Text style={styles.modalText}>
                        <Text style={{ fontFamily: 'Poppins_SemiBold', color: Theme.colors.accent }}>
                          Date:
                        </Text>{' '}
                        {new Date(selectedItem.timestamp).toLocaleDateString(undefined, {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })}
                        <Text style={{ fontFamily: 'Poppins_SemiBold', color: Theme.colors.accent }}>
                          {'  Time: '}
                        </Text>
                        {new Date(selectedItem.timestamp).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                          hour12: true,
                        })}
                      </Text>
                    }
                    ListEmptyComponent={<Text style={styles.modalText}>No details available</Text>}
                  />
                ) : null
              }
              onConfirm={() => setModalVisible(false)}
              confirmText="Close"
              showCancel={false}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default SubmissionScreen;