import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, Alert, SafeAreaView, StatusBar, KeyboardAvoidingView, Platform, Modal, Animated, ScrollView, Image, Dimensions } from 'react-native';
import { database } from '../configuration/firebaseConfig';
import { ref, onValue, query, limitToLast, orderByChild, startAfter } from 'firebase/database';
import { LinearGradient } from 'expo-linear-gradient';
import GlobalStyles from '../styles/GlobalStyles';
import { Ionicons } from '@expo/vector-icons';
import Theme from '../constants/theme';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext'; // Import useAuth
import useOperationCheck from '../components/useOperationCheck'; // Import useOperationCheck
import styles from '../styles/TransactionStyles';

const TransactionScreen = () => {
  const navigation = useNavigation();
  const { user } = useAuth(); // Use AuthContext
  const { modalVisible: opModalVisible, setModalVisible: setOpModalVisible, modalConfig: opModalConfig } = useOperationCheck(); // Use useOperationCheck
  const [history, setHistory] = useState([]);
  const [submissionData, setSubmissionData] = useState({});
  const [imageDimensions, setImageDimensions] = useState({});
  const [lastTimestamp, setLastTimestamp] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const fadeAnim = useState(new Animated.Value(0))[0];
  const slideAnim = useState(new Animated.Value(100))[0];
  const PAGE_SIZE = 15;
  const screenWidth = Dimensions.get('window').width;
  const maxImageWidth = screenWidth * 0.9;
  const maxImageHeight = 400;

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

    // Fetch history and submission data
    const activityUnsubscribe = fetchHistory();
    const submissionUnsubscribe = fetchSubmissionData();

    return () => {
      // Cleanup listeners
      if (activityUnsubscribe) activityUnsubscribe();
      if (submissionUnsubscribe) submissionUnsubscribe();
      console.log(`[${new Date().toISOString()}] Cleaned up Firebase listeners`);
    };
  }, [user]);

  const fetchHistory = useCallback(() => {
    try {
      const userId = user.id;
      let activityQuery = query(
        ref(database, `activity_log/${userId}`),
        orderByChild('timestamp'),
        limitToLast(PAGE_SIZE)
      );

      const unsubscribe = onValue(
        activityQuery,
        (snapshot) => {
          const data = snapshot.val();
          const activities = data
            ? Object.entries(data)
                .map(([id, activity]) => ({
                  id,
                  message: activity.message,
                  timestamp: activity.timestamp,
                  submissionId: activity.submissionId || null,
                }))
                .sort((a, b) => b.timestamp - a.timestamp)
            : [];

          setHistory(activities);
          setHasMore(activities.length === PAGE_SIZE);
          if (activities.length > 0) {
            setLastTimestamp(activities[activities.length - 1].timestamp);
          }
          console.log(`[${new Date().toISOString()}] Activity log fetched: ${activities.length} items`);
        },
        (error) => {
          Alert.alert('Error', `Failed to fetch activity log: ${error.message}`);
          console.error(`[${new Date().toISOString()}] Error fetching activity log:`, error);
        }
      );

      return unsubscribe;
    } catch (error) {
      Alert.alert('Error', `Failed to fetch history: ${error.message}`);
      console.error(`[${new Date().toISOString()}] Error in fetchHistory:`, error);
      return () => {};
    }
  }, [user]);

  const fetchMoreHistory = useCallback(() => {
    if (!hasMore || !lastTimestamp) return;
    try {
      const userId = user.id;
      const activityQuery = query(
        ref(database, `activity_log/${userId}`),
        orderByChild('timestamp'),
        startAfter(lastTimestamp),
        limitToLast(PAGE_SIZE)
      );

      const unsubscribe = onValue(
        activityQuery,
        (snapshot) => {
          const data = snapshot.val();
          const activities = data
            ? Object.entries(data)
                .map(([id, activity]) => ({
                  id,
                  message: activity.message,
                  timestamp: activity.timestamp,
                  submissionId: activity.submissionId || null,
                }))
                .sort((a, b) => b.timestamp - a.timestamp)
            : [];

          setHistory((prev) => [...prev, ...activities]);
          setHasMore(activities.length === PAGE_SIZE);
          if (activities.length > 0) {
            setLastTimestamp(activities[activities.length - 1].timestamp);
          }
          console.log(`[${new Date().toISOString()}] More activity log fetched: ${activities.length} items`);
        },
        (error) => {
          Alert.alert('Error', `Failed to fetch more activity log: ${error.message}`);
          console.error(`[${new Date().toISOString()}] Error fetching more activity log:`, error);
        }
      );

      return unsubscribe;
    } catch (error) {
      Alert.alert('Error', `Failed to fetch more history: ${error.message}`);
      console.error(`[${new Date().toISOString()}] Error in fetchMoreHistory:`, error);
      return () => {};
    }
  }, [user, lastTimestamp, hasMore]);

  const fetchSubmissionData = useCallback(() => {
    try {
      const userId = user.id;
      const submissionRef = ref(database, `submission_history/${userId}`);
      const unsubscribe = onValue(
        submissionRef,
        (snapshot) => {
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
          console.log(`[${new Date().toISOString()}] Submission history fetched: ${Object.keys(submissions).length} items`);
        },
        (error) => {
          Alert.alert('Error', `Failed to fetch submission history: ${error.message}`);
          console.error(`[${new Date().toISOString()}] Error fetching submission history:`, error);
        }
      );
      return unsubscribe;
    } catch (error) {
      Alert.alert('Error', `Failed to fetch submission data: ${error.message}`);
      console.error(`[${new Date().toISOString()}] Error in fetchSubmissionData:`, error);
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

  const findSubmissionData = useCallback((item) => {
    if (!item.submissionId) {
      const activityTime = item.timestamp;
      return Object.values(submissionData).find((submission) => {
        const submissionTime = submission.timestamp;
        return Math.abs(submissionTime - activityTime) < 1000;
      });
    }
    return submissionData[item.submissionId];
  }, [submissionData]);

  const getDetails = useCallback((item) => {
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
  }, [submissionData]);

  const openModal = (item) => {
    setSelectedItem(item);
    setModalVisible(true);
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const closeModal = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 100,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setModalVisible(false);
      setSelectedItem(null);
    });
  };

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
        <Text style={styles.historyTimeText}>{new Date(item.timestamp).toLocaleDateString()}</Text>
      </View>
      <View style={styles.historyMessage}>
        <Text style={styles.historyMessageText}>{item.message}</Text>
      </View>
      <TouchableOpacity
        style={styles.viewButton}
        onPress={() => {
          if (isModalAction(item.message)) {
            openModal(item);
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
            onError={(error) => console.error(`[${new Date().toISOString()}] Image load error:`, error)}
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

  const CustomModal = ({ visible, item, onClose }) => {
    if (!item) return null;
    const details = getDetails(item);
    return (
      <Modal
        animationType="none"
        transparent
        visible={visible}
        onRequestClose={onClose}
      >
        <View style={styles.modalOverlay}>
          <Animated.View
            style={[
              styles.modalContainer,
              { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
            ]}
          >
            <Text style={styles.modalTitle}>Activity Details</Text>
            <Text style={styles.modalText}>
              <Text style={{fontFamily: 'Poppins_SemiBold', color: Theme.colors.accent}}>Date:</Text> {new Date(item.timestamp).toLocaleDateString(undefined, {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
              })}
              <Text style={{fontFamily: 'Poppins_SemiBold', color: Theme.colors.accent}}>  Time: </Text>{new Date(item.timestamp).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
                hour12: true,
              })}
            </Text>
            <FlatList
              data={details}
              renderItem={({ item }) => <RenderDetailItem item={item} />}
              keyExtractor={item => `${item.key}-${item.type}`}
              style={styles.modalDetailContainer}
              ListEmptyComponent={<Text style={styles.modalText}>No details available</Text>}
            />
            <TouchableOpacity style={[GlobalStyles.backButton, {paddingVertical: 5, borderRadius: 10, marginTop: 15}]} onPress={onClose}>
              <Text style={GlobalStyles.backButtonText}>Close</Text>
            </TouchableOpacity>
          </Animated.View>
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
          <Text style={[GlobalStyles.headerTitle, { color: Theme.colors.primary }]}>Transaction History</Text>
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
              keyExtractor={item => item.id}
              ListEmptyComponent={<Text style={styles.noActivity}>No activities found</Text>}
              ListFooterComponent={
                hasMore ? (
                  <TouchableOpacity style={GlobalStyles.button} onPress={fetchMoreHistory}>
                    <Text style={GlobalStyles.buttonText}>Load More</Text>
                  </TouchableOpacity>
                ) : null
              }
            />
            <CustomModal
              visible={modalVisible}
              item={selectedItem}
              onClose={closeModal}
            />
            {/* OperationCheck Modal */}
            <CustomModal
              visible={opModalVisible}
              title={opModalConfig.title}
              message={opModalConfig.message}
              onConfirm={opModalConfig.onConfirm}
              confirmText={opModalConfig.confirmText}
              showCancel={opModalConfig.showCancel}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default TransactionScreen;