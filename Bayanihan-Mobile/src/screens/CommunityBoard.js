import React, { useState, useEffect, useRef } from 'react';
import { View, Text, FlatList, Image, TouchableOpacity, Alert, Platform, SafeAreaView, KeyboardAvoidingView, StatusBar, ToastAndroid } from 'react-native';
import { onAuthStateChanged } from 'firebase/auth';
import { ref, onValue, query, orderByChild, remove } from 'firebase/database';
import { VideoView, useVideoPlayer } from 'expo-video';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { auth, database } from '../configuration/firebaseConfig';
import GlobalStyles from '../styles/GlobalStyles';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Theme from '../constants/theme';
import { AnimatePresence, MotiView } from 'moti';
import { useNavigation } from '@react-navigation/native';
import { Picker } from '@react-native-picker/picker';
import styles from '../styles/CommunityBoardStyles';

// New component to handle video playback
const PostVideo = ({ mediaUrl, thumbnailUrl, postId, videoRefs }) => {
  const player = useVideoPlayer(mediaUrl && mediaUrl.startsWith('https://') ? { uri: mediaUrl } : null, player => {
    if (player && postId) {
      videoRefs.current[postId] = player;
    }
  });

  if (!mediaUrl || !mediaUrl.startsWith('https://')) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Invalid Video URL</Text>
        <Text style={styles.errorSubText}>The video URL is missing or invalid. Please edit the post to fix it.</Text>
        {thumbnailUrl && (
          <Image
            source={{ uri: thumbnailUrl }}
            style={styles.postMedia}
            resizeMode="contain"
            onError={(error) => console.error(`Thumbnail load error for post ${postId}:`, error.nativeEvent)}
          />
        )}
      </View>
    );
  }

  return (
    <VideoView
      player={player}
      style={styles.postMedia}
      contentFit="contain"
      nativeControls
      posterSource={thumbnailUrl ? { uri: thumbnailUrl } : undefined}
      onError={(error) => console.error(`Video playback error for post ${postId}:`, error)}
    />
  );
};

const CommunityBoard = () => {
  const navigation = useNavigation();
  const [posts, setPosts] = useState([]);
  const [sortOrder, setSortOrder] = useState('newest');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState({ contactPerson: 'Anonymous', organization: '' });
  const [expanded, setExpanded] = useState(false);
  const [menuVisible, setMenuVisible] = useState(null);
  const videoRefs = useRef({});

  const categories = [
    { label: 'All', value: 'all' },
    { label: 'Resource', value: 'resource' },
    { label: 'Discussion', value: 'discussion' },
    { label: 'Events', value: 'events' },
    { label: 'Announcement', value: 'announcement' },
  ];

  const toSentenceCase = (str) => {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1);
  };

  useEffect(() => {
    if (!auth) {
      console.error(`Auth is not initialized`);
      ToastAndroid.show('Authentication not initialized. Please restart the app.',ToastAndroid.BOTTOM);
      return;
    }

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
            ToastAndroid.show('Please change your password.',ToastAndroid.BOTTOM);
            navigation.navigate('Profile')
            return;
          }
          const data = await fetchUserData(currentUser.uid);
          setUserData(data);
        } catch (error) {
          console.error(`Error fetching user data:`, error);
          ToastAndroid.show('Failed to load user data.',ToastAndroid.BOTTOM);
        }
      } else {
        ToastAndroid.show('Please log in to view posts.',ToastAndroid.BOTTOM);
        navigation.navigate('Login');
      }
    }, (error) => {
      console.error(`Auth state listener error:`, error);
      ToastAndroid.show('Authentication error. Please restart the app.',ToastAndroid.BOTTOM);
    });

    return () => {
      unsubscribe();
      Object.values(videoRefs.current).forEach(player => {
        if (player) {
          player.pause();
          player.seekTo(0);
        }
      });
    };
  }, [navigation]);

  useEffect(() => {
    if (!user) return;
    const postsRef = query(ref(database, 'posts'), orderByChild('timestamp'));
    const unsubscribe = onValue(postsRef, (snapshot) => {
      const postsData = snapshot.val();
      if (postsData) {
        let postArray = Object.entries(postsData).map(([id, post]) => ({ id, ...post }));
        if (categoryFilter !== 'all') {
          postArray = postArray.filter((post) => post.category === categoryFilter);
        }
        postArray.sort((a, b) => (sortOrder === 'newest' ? b.timestamp - a.timestamp : a.timestamp - b.timestamp));
        setPosts(postArray);
      } else {
        setPosts([]);
      }
    }, (error) => {
      console.error(`Error loading posts:`, error);
      ToastAndroid.show('Failed to load posts.',ToastAndroid.BOTTOM);
    });
    return () => unsubscribe();
  }, [sortOrder, categoryFilter, user]);

  const toggleSort = () => {
    setSortOrder(sortOrder === 'newest' ? 'oldest' : 'newest');
  };

  const fetchUserData = async (uid) => {
    try {
      const cache = await AsyncStorage.getItem(`userData:${uid}`);
      if (cache) {
        return JSON.parse(cache);
      }
      const userRef = ref(database, `users/${uid}`);
      const snapshot = await new Promise((resolve, reject) => {
        onValue(userRef, resolve, reject, { onlyOnce: true });
      });
      const userData = snapshot.val() || {};
      const data = {
        contactPerson: userData.contactPerson || userData.displayName || 'Anonymous',
        organization: userData.organization || '',
      };
      await AsyncStorage.setItem(`userData:${uid}`, JSON.stringify(data));
      return data;
    } catch (error) {
      console.error(`Error fetching user data:`, error);
      return { contactPerson: 'Anonymous', organization: '' };
    }
  };

  const handleDeletePost = (postId) => {
    Alert.alert(
      'Delete Post',
      'Are you sure you want to delete this post?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await remove(ref(database, `posts/${postId}`));
              ToastAndroid.show('Post deleted successfully.',ToastAndroid.BOTTOM);
            } catch (error) {
              console.error(`Error deleting post:`, error);
              ToastAndroid.show('Failed to delete post.',ToastAndroid.BOTTOM);
            }
          },
        },
      ]
    );
  };

  const handleEditPost = (post) => {
    navigation.navigate('CreatePost', { postType: post.mediaType, postId: post.id, initialData: post });
    setMenuVisible(null);
  };

  const isEditable = (post) => {
    const ONE_DAY = 24 * 60 * 60 * 1000;
    const now = Date.now();
    return post.userId === user?.uid && (now - post.timestamp) <= ONE_DAY;
  };

  const renderPost = ({ item }) => {
    if (!item) {
      console.error(`Invalid post item`);
      return null;
    }

    if (item.mediaType === 'video' && (!VideoView || !useVideoPlayer)) {
      console.error(`VideoView or useVideoPlayer is undefined for post: ${item.id}. Ensure expo-video is installed correctly.`);
      return (
        <View style={styles.postContainer}>
          <View style={styles.postHeader}>
            <View>
              <Text style={styles.postUser}>{item.userName || 'Anonymous'}</Text>
              <Text style={styles.postMeta}>
                {item.organization || 'No organization'} • {new Date(item.timestamp).toLocaleString()} • {toSentenceCase(item.category)}
              </Text>
              {item.isShared && <Text style={styles.sharedInfo}>Shared from {item.originalUserName || 'Anonymous'}'s post</Text>}
              {item.isShared && item.shareCaption && <Text style={styles.shareCaption}>{item.shareCaption}</Text>}
            </View>
            {item.userId === user?.uid && (
              <TouchableOpacity onPress={() => setMenuVisible(menuVisible === item.id ? null : item.id)}>
                <Ionicons name="ellipsis-vertical" size={20} color={Theme.colors.black} />
              </TouchableOpacity>
            )}
          </View>
          {menuVisible === item.id && isEditable(item) && (
            <View style={styles.menuContainer}>
              <TouchableOpacity style={styles.menuItem} onPress={() => handleEditPost(item)}>
                <Text style={styles.menuText}>Edit Post</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.menuItem} onPress={() => { setMenuVisible(null); handleDeletePost(item.id); }}>
                <Text style={[styles.menuText, { color: 'red' }]}>Delete Post</Text>
              </TouchableOpacity>
            </View>
          )}
          {item.title && <Text style={styles.postTitle}>{item.title}</Text>}
          {item.content && <Text style={styles.postContent}>{item.content}</Text>}
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>Video Unavailable</Text>
            <Text style={styles.errorSubText}>Please ensure expo-video is installed correctly (run `npx expo install expo-video`) or try viewing on another device.</Text>
            {item.thumbnailUrl && (
              <Image
                source={{ uri: item.thumbnailUrl }}
                style={styles.postMedia}
                resizeMode="contain"
                onError={(error) => console.error(`Thumbnail load error for post ${item.id}:`, error.nativeEvent)}
              />
            )}
          </View>
        </View>
      );
    }

    return (
      <View style={styles.postContainer}>
        <View style={styles.postHeader}>
          <View>
            <Text style={styles.postUser}>{item.userName || 'Anonymous'}</Text>
            <Text style={styles.postMeta}>
              {item.organization || 'No organization'} • {new Date(item.timestamp).toLocaleString()} • {toSentenceCase(item.category)}
            </Text>
            {item.isShared && <Text style={styles.sharedInfo}>Shared from {item.originalUserName || 'Anonymous'}'s post</Text>}
            {item.isShared && item.shareCaption && <Text style={styles.shareCaption}>{item.shareCaption}</Text>}
          </View>
          {item.userId === user?.uid && (
            <TouchableOpacity onPress={() => setMenuVisible(menuVisible === item.id ? null : item.id)}>
              <Ionicons name="ellipsis-vertical" size={20} color={Theme.colors.black} />
            </TouchableOpacity>
          )}
        </View>
        {menuVisible === item.id && isEditable(item) && (
          <View style={styles.menuContainer}>
            <TouchableOpacity style={styles.menuItem} onPress={() => handleEditPost(item)}>
              <Text style={styles.menuText}>Edit Post</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.menuItem} onPress={() => { setMenuVisible(null); handleDeletePost(item.id); }}>
                <Text style={[styles.menuText, { color: 'red' }]}>Delete Post</Text>
              </TouchableOpacity>
            </View>
          )}
          {item.title && <Text style={styles.postTitle}>{item.title}</Text>}
          {item.content && <Text style={styles.postContent}>{item.content}</Text>}
          {item.mediaUrl && item.mediaType === 'image' && (
            <Image
              source={{ uri: item.mediaUrl }}
              style={styles.postMedia}
              resizeMode="contain"
              onError={(error) => console.error(`Image load error for post ${item.id}:`, error.nativeEvent)}
            />
          )}
          {item.mediaUrls && item.mediaType === 'image' && item.mediaUrls.map((url, index) => (
            <Image
              key={index}
              source={{ uri: url }}
              style={styles.postMedia}
              resizeMode="contain"
              onError={(error) => console.error(`Image load error for post ${item.id}, url ${url}:`, error.nativeEvent)}
            />
          ))}
          {item.mediaType === 'video' && (
            <PostVideo
              mediaUrl={item.mediaUrl}
              thumbnailUrl={item.thumbnailUrl}
              postId={item.id}
              videoRefs={videoRefs}
            />
          )}
        </View>
      );
    };

    const actions = [
      { type: 'text', color: Theme.colors.lightBlue, emoji: 'text-outline', border: Theme.colors.accentBlue, action: () => navigation.navigate('CreatePost', { postType: 'text' }) },
      { type: 'image', color: Theme.colors.lightBlue, emoji: 'image-outline', border: Theme.colors.accentBlue, action: () => navigation.navigate('CreatePost', { postType: 'image' }) },
      { type: 'video', color: Theme.colors.lightBlue, emoji: 'videocam-outline', border: Theme.colors.accentBlue, action: () => navigation.navigate('CreatePost', { postType: 'video' }) },
      { type: 'link', color: Theme.colors.lightBlue, emoji: 'link-outline', border: Theme.colors.accentBlue, action: () => navigation.navigate('CreatePost', { postType: 'link' }) },
    ];

    const ActionButton = ({ action, index }) => (
      <MotiView
        transition={{ delay: index * 70, damping: 15, mass: 1 }}
        from={{ opacity: 0, translateY: 0 }}
        animate={{ opacity: 1, translateY: -15 * (index + 1.5) }}
        exit={{ opacity: 0, translateY: 0 }}
        style={{ zIndex: 25 }}
      >
        <TouchableOpacity
          onPress={action.action}
          style={[
            styles.actionButton,
            {
              backgroundColor: action.color,
              borderColor: action.border,
            },
          ]}
        >
          <Ionicons name={action.emoji} size={24} color={Theme.colors.accentBlue} />
        </TouchableOpacity>
      </MotiView>
    );

    return (
      <SafeAreaView style={GlobalStyles.container}>
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
            <Text style={[GlobalStyles.headerTitle, { color: Theme.colors.primary }]}>Community Board</Text>
          </View>
        </LinearGradient>

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1, marginTop: 50, marginBottom: 40 }}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : StatusBar.currentHeight}
        >
          <View style={styles.filterContainer}>
            <TouchableOpacity style={styles.sortButton} onPress={toggleSort}>
              <Text style={styles.filterText}>{sortOrder === 'newest' ? 'Sort: Newest' : 'Sort: Oldest'}</Text>
            </TouchableOpacity>
            <View style={styles.categoryPicker}>
              <Picker
                selectedValue={categoryFilter}
                onValueChange={(itemValue) => setCategoryFilter(itemValue)}
                style={styles.picker}
              >
                {categories.map((category) => (
                  <Picker.Item key={category.value} label={category.label} value={category.value} style={styles.pickerItems} />
                ))}
              </Picker>
            </View>
          </View>
          <FlatList
            data={posts}
            renderItem={renderPost}
            keyExtractor={(item) => item.id}
            ListEmptyComponent={<Text style={styles.emptyText}>No posts available.</Text>}
            contentContainerStyle={styles.flatListContent}
          />
          <View style={styles.floatingButtonContainer}>
            <TouchableOpacity
              onPress={() => setExpanded(!expanded)}
              style={[
                styles.button,
                {
                  backgroundColor: Theme.colors.lightBlue,
                  borderColor: Theme.colors.accentBlue,
                },
              ]}
            >
              <MotiView
                style={{ position: 'absolute' }}
                animate={{ scale: expanded ? 1.5 : 1 }}
                transition={{ duration: 150, type: 'timing' }}
              >
                <Ionicons name={expanded ? 'close' : 'add'} size={24} color={Theme.colors.accentBlue} />
              </MotiView>
            </TouchableOpacity>
            <AnimatePresence>
              {expanded && (
                <View style={styles.actionButtonContainer}>
                  {actions.map((action, index) => (
                    <ActionButton key={index.toString()} action={action} index={index} />
                  ))}
                </View>
              )}
            </AnimatePresence>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
};

export default CommunityBoard;