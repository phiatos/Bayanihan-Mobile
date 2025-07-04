import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, Image, TextInput, TouchableOpacity, Alert, Platform, SafeAreaView, KeyboardAvoidingView } from 'react-native';
import { onAuthStateChanged } from 'firebase/auth';
import { ref, onValue, query, orderByChild } from 'firebase/database';
import { Video } from 'expo-av';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { auth, database } from '../configuration/firebaseConfig'; 
import GlobalStyles from '../styles/GlobalStyles';
import RDANAStyles from '../styles/RDANAStyles';
import { Ionicons } from '@expo/vector-icons';


const CommunityBoard = ({ navigation }) => {
  const [posts, setPosts] = useState([]);
  const [sortOrder, setSortOrder] = useState('newest');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState({ contactPerson: 'Anonymous', organization: '' });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        try {
          const userRef = ref(database, `users/${currentUser.uid}`);
          const userSnapshot = await new Promise((resolve, reject) => {
            onValue(userRef, resolve, reject, { onlyOnce: true });
          });
          const userDataFromDb = userSnapshot.val();
          if (userDataFromDb?.password_needs_reset) {
            Alert.alert('Password Change Required', 'Please change your password.', [
              { text: 'OK', onPress: () => navigation.navigate('Profile') }
            ]);
            return;
          }
          const data = await fetchUserData(currentUser.uid);
          setUserData(data);
          resetInactivityTimer(navigation);
        } catch (error) {
          console.error(`[${new Date().toISOString()}] Error fetching user data:`, error);
          Alert.alert('Error', 'Failed to load user data.');
        }
      } else {
        Alert.alert('Authentication Required', 'Please log in to view posts.', [
          { text: 'OK', onPress: () => navigation.navigate('Login') }
        ]);
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) return;
    const postsRef = query(ref(database, 'posts'), orderByChild('timestamp'));
    const unsubscribe = onValue(postsRef, (snapshot) => {
      const postsData = snapshot.val();
      if (postsData) {
        let postArray = Object.entries(postsData).map(([id, post]) => ({ id, ...post }));
        if (categoryFilter !== 'all') {
          postArray = postArray.filter(post => post.category === categoryFilter);
        }
        postArray.sort((a, b) => sortOrder === 'newest' ? b.timestamp - a.timestamp : a.timestamp - b.timestamp);
        setPosts(postArray);
      } else {
        setPosts([]);
      }
    }, (error) => {
      console.error(`[${new Date().toISOString()}] Error loading posts:`, error);
      Alert.alert('Error', 'Failed to load posts.');
    });
    return () => unsubscribe();
  }, [sortOrder, categoryFilter, user]);

  const toggleSort = () => {
    setSortOrder(sortOrder === 'newest' ? 'oldest' : 'newest');
  };

  const renderPost = ({ item }) => (
    <View style={styles.postContainer}>
      <View style={styles.postHeader}>
        <View>
          <Text style={styles.postUser}>{item.userName}</Text>
          <Text style={styles.postMeta}>
            {item.organization || ''} • {new Date(item.timestamp).toLocaleString()} • {item.category}
          </Text>
          {item.isShared && <Text style={styles.sharedInfo}>Shared from {item.originalUserName}'s post</Text>}
          {item.isShared && item.shareCaption && <Text style={styles.shareCaption}>{item.shareCaption}</Text>}
        </View>
      </View>
      {item.title && <Text style={styles.postTitle}>{item.title}</Text>}
      <Text style={styles.postContent}>{item.content}</Text>
      {item.mediaUrl && item.mediaType === 'image' && (
        <Image source={{ uri: item.mediaUrl }} style={styles.postMedia} />
      )}
      {item.mediaUrl && item.mediaType === 'video' && (
        <Video
          source={{ uri: item.mediaUrl }}
          style={styles.postMedia}
          useNativeControls
          resizeMode="contain"
        />
      )}
    </View>
  );

  return (
    <View style={RDANAStyles.container}>
      <View style={GlobalStyles.headerContainer}>
        <TouchableOpacity
          onPress={() => navigation.openDrawer()}
          style={GlobalStyles.headerMenuIcon}
        >
          <Ionicons name="menu" size={32} color="white" />
        </TouchableOpacity>
        <Text style={GlobalStyles.headerTitle}>Community Board</Text>
      </View>

      <SafeAreaView style={{ flex: 1 }} edges={['left', 'right', 'bottom']}>
        <KeyboardAvoidingView
          style={{ flex: 1, paddingTop: 20, paddingHorizontal: 20 }}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 20}
        >
      <View style={styles.filterContainer}>
        <TouchableOpacity style={styles.sortButton} onPress={toggleSort}>
          <Text>{sortOrder === 'newest' ? 'Sort: Newest' : 'Sort: Oldest'}</Text>
        </TouchableOpacity>
        <TextInput
          style={styles.filterInput}
          placeholder="Filter by category"
          value={categoryFilter}
          onChangeText={setCategoryFilter}
        />
      </View>
      <FlatList
        data={posts}
        renderItem={renderPost}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={<Text>No posts available.</Text>}
      />
    </KeyboardAvoidingView>
    </SafeAreaView>
    </View>
  );
};

const fetchUserData = async (uid) => {
  try {
    const cache = await AsyncStorage.getItem(`userData:${uid}`);
    if (cache) {
      console.log(`[${new Date().toISOString()}] Using cached user data for user: ${uid}`);
      return JSON.parse(cache);
    }
    const userRef = ref(database, `users/${uid}`);
    const snapshot = await new Promise((resolve, reject) => {
      onValue(userRef, resolve, reject, { onlyOnce: true });
    });
    const userData = snapshot.val() || {};
    const data = {
      contactPerson: userData.contactPerson || userData.displayName || 'Anonymous',
      organization: userData.organization || ''
    };
    await AsyncStorage.setItem(`userData:${uid}`, JSON.stringify(data));
    console.log(`[${new Date().toISOString()}] User data fetched:`, data);
    return data;
  } catch (error) {
    console.error(`[${new Date().toISOString()}] Error fetching user data:`, error);
    return { contactPerson: 'Anonymous', organization: '' };
  }
};

const resetInactivityTimer = (navigation) => {
  let timeout;
  const INACTIVITY_TIME = 1800000; // 30 minutes
  const checkInactivity = () => {
    Alert.alert(
      'Are you still there?',
      'You\'ve been inactive for a while. Do you want to continue?',
      [
        {
          text: 'Stay Logged In',
          onPress: () => resetInactivityTimer(navigation)
        },
        {
          text: 'Log Out',
          onPress: async () => {
            try {
              await auth.signOut();
              navigation.navigate('Login');
            } catch (error) {
              console.error(`[${new Date().toISOString()}] Error signing out:`, error);
            }
          }
        }
      ],
      { cancelable: false }
    );
  };
  if (Platform.OS !== 'web') {
    clearTimeout(timeout);
    timeout = setTimeout(checkInactivity, INACTIVITY_TIME);
  }
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 10,
    backgroundColor: '#f5f5f5',
  },
  filterContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  sortButton: {
    padding: 10,
    backgroundColor: '#ddd',
    borderRadius: 5,
  },
  filterInput: {
    flex: 1,
    marginLeft: 10,
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 10,
    borderRadius: 5,
  },
  postContainer: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 5,
    marginVertical: 5,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  postHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  postUser: {
    fontWeight: 'bold',
    color: '#121212',
  },
  postMeta: {
    color: '#14AEBB',
    fontSize: 12,
  },
  sharedInfo: {
    fontSize: 12,
    color: '#666',
  },
  shareCaption: {
    fontStyle: 'italic',
    color: '#666',
    marginTop: 5,
  },
  postTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  postContent: {
    marginBottom: 10,
  },
  postMedia: {
    width: '100%',
    height: 200,
    borderRadius: 5,
    marginBottom: 10,
  },
});

export default CommunityBoard;