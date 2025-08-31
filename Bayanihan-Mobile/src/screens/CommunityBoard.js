import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, FlatList, Image, TouchableOpacity, Alert, Platform, SafeAreaView, KeyboardAvoidingView, ToastAndroid, Linking } from 'react-native';
import { onAuthStateChanged } from 'firebase/auth';
import { ref, onValue, query, orderByChild, remove, set, serverTimestamp } from 'firebase/database';
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
import { Menu, MenuOptions, MenuOption, MenuTrigger, MenuProvider } from 'react-native-popup-menu';
import styles from '../styles/CommunityBoardStyles';
import useOperationCheck from '../components/useOperationCheck';

const PostVideo = ({ mediaUrl, thumbnailUrl, postId, videoRefs }) => {
  const [retryCount, setRetryCount] = useState(0);
  const maxRetries = 3;
  const playerRef = useRef(null);

  const player = useVideoPlayer(
    mediaUrl && mediaUrl.startsWith('https://') ? { uri: mediaUrl } : null,
    (player) => {
      playerRef.current = player;
      if (player && postId) {
        videoRefs.current[postId] = player;
      }
    }
  );

  useEffect(() => {
    console.log(`PostVideo initialized for post ${postId}, mediaUrl: ${mediaUrl}, thumbnailUrl: ${thumbnailUrl}`);
    return () => {
      if (playerRef.current) {
        try {
          playerRef.current.pause();
          playerRef.current.seek(0);
          console.log(`Cleaned up video player for post ${postId}`);
        } catch (error) {
          console.error(`Error cleaning up video player for post ${postId}:`, error);
        }
      }
    };
  }, [postId]);

  const handleRetry = () => {
    if (retryCount < maxRetries) {
      setRetryCount(retryCount + 1);
      console.log(`Retrying video load for post ${postId} (attempt ${retryCount + 1}/${maxRetries})`);
      if (playerRef.current) {
        playerRef.current.seek(0);
        playerRef.current.play();
      }
    }
  };

  if (!mediaUrl || !mediaUrl.startsWith('https://')) {
    console.warn(`Invalid or missing mediaUrl for post ${postId}`);
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorSubText}>
          The video URL is missing or invalid.
        </Text>
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
      onError={(error) => {
        console.error(`Video playback error for post ${postId}:`, error);
        ToastAndroid.show(`Failed to play video for post ${postId}.`, ToastAndroid.BOTTOM);
        if (retryCount < maxRetries) {
          handleRetry();
        }
      }}
      onLoad={() => console.log(`Video loaded for post ${postId}`)}
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
      console.error('Auth is not initialized');
      ToastAndroid.show('Authentication not initialized. Please restart the app.', ToastAndroid.BOTTOM);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      console.log('Auth state changed, user:', currentUser ? currentUser.uid : 'null');
      setUser(currentUser);
      if (currentUser) {
        try {
          const userRef = ref(database, `users/${currentUser.uid}`);
          const userSnapshot = await new Promise((resolve, reject) => {
            onValue(userRef, resolve, reject, { onlyOnce: true });
          });
          const userDataFromDb = userSnapshot.val();
          if (userDataFromDb?.password_needs_reset) {
            ToastAndroid.show('Please change your password.', ToastAndroid.BOTTOM);
            navigation.navigate('Profile');
            return;
          }
          const data = await fetchUserData(currentUser.uid);
          setUserData(data);
          console.log('User data loaded:', data);
        } catch (error) {
          console.error('Error fetching user data:', error);
          ToastAndroid.show('Failed to load user data.', ToastAndroid.BOTTOM);
        }
      } else {
        ToastAndroid.show('Please log in to view posts.', ToastAndroid.BOTTOM);
        navigation.navigate('Login');
      }
    }, (error) => {
      console.error('Auth state listener error:', error);
      ToastAndroid.show('Authentication error. Please restart the app.', ToastAndroid.BOTTOM);
    });

    return () => {
      unsubscribe();
      Object.values(videoRefs.current).forEach(player => {
        if (player) {
          try {
            player.pause();
            player.seek(0);
            console.log('Cleaned up video player');
          } catch (error) {
            console.error('Error cleaning up video player:', error);
          }
        }
      });
    };
  }, [navigation]);

  useEffect(() => {
    if (!user) {
      console.log('No user, skipping posts fetch');
      return;
    }
    const postsRef = query(ref(database, 'posts'), orderByChild('timestamp'));
    const unsubscribe = onValue(postsRef, (snapshot) => {
      const postsData = snapshot.val();
      console.log('Posts snapshot received:', postsData ? Object.keys(postsData).length + ' posts' : 'no posts');
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
      console.error('Error loading posts:', error);
      ToastAndroid.show('Failed to load posts: ' + error.message, ToastAndroid.BOTTOM);
    });
    return () => unsubscribe();
  }, [sortOrder, categoryFilter, user]);

  const toggleSort = () => {
    setSortOrder(sortOrder === 'newest' ? 'oldest' : 'newest');
    console.log('Sort order toggled to:', sortOrder === 'newest' ? 'oldest' : 'newest');
  };

  const fetchUserData = async (uid) => {
    try {
      const cache = await AsyncStorage.getItem(`userData:${uid}`);
      if (cache) {
        console.log('User data from cache:', cache);
        return JSON.parse(cache);
      }
      const userRef = ref(database, `users/${uid}`);
      const snapshot = await new Promise((resolve, reject) => {
        onValue(userRef, resolve, reject, { onlyOnce: true });
      });
      const userData = snapshot.val() || {};
      const data = {
        contactPerson: userData.contactPerson || `${userData.firstName || 'Anonymous'} ${userData.lastName || ''}`.trim() || 'Anonymous',
        organization: userData.organization || '',
      };
      await AsyncStorage.setItem(`userData:${uid}`, JSON.stringify(data));
      console.log('User data fetched and cached:', data);
      return data;
    } catch (error) {
      console.error('Error fetching user data:', error);
      return { contactPerson: 'Anonymous', organization: '' };
    }
  };

  const handleDeletePost = (postId, postData) => {
    if (!user || !user.uid) {
      console.error('No authenticated user for delete operation');
      ToastAndroid.show('You must be logged in to delete a post.', ToastAndroid.BOTTOM);
      return;
    }
    if (!postId || !postData) {
      console.error('Invalid postId or postData:', { postId, postData });
      ToastAndroid.show('Invalid post data.', ToastAndroid.BOTTOM);
      return;
    }
    console.log(`Attempting to delete post ${postId} with data:`, postData);
    Alert.alert(
      'Delete Post',
      'Are you sure you want to delete this post? It will be moved to your deleted posts.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const deletedPostRef = ref(database, `posts/deleted/${user.uid}/${postId}`);
              await set(deletedPostRef, { ...postData, deletedAt: serverTimestamp() });
              console.log(`Post ${postId} copied to posts/deleted/${user.uid}/${postId}`);
              await remove(ref(database, `posts/${postId}`));
              console.log(`Post ${postId} removed from posts`);
              ToastAndroid.show('Post moved to deleted posts.', ToastAndroid.BOTTOM);
            } catch (error) {
              console.error(`Error moving post ${postId} to deleted:`, error);
              ToastAndroid.show('Failed to delete post: ' + error.message, ToastAndroid.LONG);
            }
          },
        },
      ]
    );
  };

  const handleEditPost = (post) => {
    if (!post || !post.id || !post.mediaType) {
      console.error('Invalid post data for edit:', post);
      ToastAndroid.show('Invalid post data for editing.', ToastAndroid.BOTTOM);
      return;
    }
    const initialData = {
      title: post.title || '',
      content: post.content || '',
      category: post.category || '',
      mediaUrl: post.mediaUrl || '',
      mediaUrls: post.mediaUrls || [],
      mediaType: post.mediaType || 'text',
      thumbnailUrl: post.thumbnailUrl || '',
      userId: post.userId,
      userName: post.userName || 'Anonymous',
      organization: post.organization || '',
      timestamp: post.timestamp || 0,
    };
    console.log(`Navigating to CreatePost with postId: ${post.id}, postType: ${post.mediaType}, initialData:`, initialData);
    try {
      navigation.navigate('CreatePost', {
        postType: post.mediaType || 'text',
        postId: post.id,
        initialData,
      });
    } catch (error) {
      console.error('Navigation error:', error);
      ToastAndroid.show('Failed to navigate to edit post.', ToastAndroid.BOTTOM);
    }
  };

  const handleSharePost = (post) => {
    if (!user) {
      ToastAndroid.show('Please log in to share a post.', ToastAndroid.BOTTOM);
      navigation.navigate('Login');
      return;
    }
    if (!post || !post.id) {
      console.error('Invalid postData for sharing:', { post });
      ToastAndroid.show('Invalid post data.', ToastAndroid.BOTTOM);
      return;
    }

    const shareData = {
      originalTitle: post.title || '',
      originalContent: post.content || '',
      originalCategory: post.category || '',
      originalMediaUrl: post.mediaUrl || '',
      originalMediaUrls: post.mediaUrls || [],
      originalMediaType: post.mediaType || 'text',
      originalThumbnailUrl: post.thumbnailUrl || '',
      originalUserId: post.userId,
      originalUserName: post.userName || 'Anonymous',
      originalOrganization: post.organization || '',
      originalTimestamp: post.timestamp || 0,
      isShared: true,
    };
    console.log(`Navigating to CreatePost for sharing post ${post.id}:`, shareData);
    navigation.navigate('CreatePost', {
      postType: 'text', // Shared posts are treated as text posts with a caption
      postId: null, // New post, not editing
      initialData: shareData,
      isShared: true,
    });
  };

  const isEditable = (post) => {
    if (!post || !user) {
      return false;
    }
    const ONE_DAY = 24 * 60 * 60 * 1000;
    const now = Date.now();
    const editable = post.userId === user.uid && (now - post.timestamp) <= ONE_DAY;
    if (!editable) {
    }
    return editable;
  };

  const renderPost = useCallback(({ item }) => {
    if (!item) {
      console.error('Invalid post item');
      return null;
    }

    if (item.mediaType === 'video' && (!VideoView || !useVideoPlayer)) {
      console.error(`VideoView or useVideoPlayer is undefined for post: ${item.id}. Ensure expo-video is installed correctly.`);
      return (
        <View style={styles.postContainer}>
          {item.userId === user?.uid && isEditable(item) && (
              <Menu onOpen={() => console.log(`Menu opened for post ${item.id}`)}>
                <MenuTrigger customStyles={{ triggerTouchable: styles.menuTrigger }}>
                  <Ionicons name="ellipsis-vertical" size={20} color={Theme.colors.black} />
                </MenuTrigger>
                <MenuOptions customStyles={{ optionsContainer: styles.menuContainer }}>
                  <MenuOption
                    onSelect={() => {
                      console.log('Edit post clicked for:', item.id);
                      handleEditPost(item);
                    }}
                    text="Edit Post"
                    customStyles={{
                      optionText: styles.menuText,
                    }}
                  />
                  <MenuOption
                    onSelect={() => {
                      console.log('Delete post clicked for:', item.id);
                      handleDeletePost(item.id, item);
                    }}
                    text="Delete Post"
                    customStyles={{
                      optionText: [styles.menuText, { color: 'red' }],
                    }}
                  />
                </MenuOptions>
              </Menu>
            )}
          <View style={styles.postHeader}>
            <View>
              <Text style={styles.postUser}>{item.userName || 'Anonymous'}</Text>
              <Text style={styles.postMeta}>
                {item.organization ? `${item.organization} • ` : ''}{new Date(item.timestamp).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })} • <Text style={{ color: Theme.colors.primary }}>{toSentenceCase(item.category)}</Text>
              </Text>
              {item.isShared && <Text style={styles.sharedInfo}>Shared from {item.originalUserName || 'Anonymous'}'s post</Text>}
              {item.isShared && item.shareCaption && <Text style={styles.shareCaption}>{item.shareCaption}</Text>}
            </View>
            
          </View>
          {item.title && <Text style={styles.postTitle}>{item.title}</Text>}
          {item.content && <Text style={styles.postContent}>{item.content}</Text>}
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>Video Unavailable</Text>
            <Text style={styles.errorSubText}>Error</Text>
            {item.thumbnailUrl && (
              <Image
                source={{ uri: item.thumbnailUrl }}
                style={styles.postMedia}
                resizeMode="contain"
                onError={(error) => console.error(`Thumbnail load error for post ${item.id}:`, error.nativeEvent)}
              />
            )}
          </View>
          <View style={styles.postActions}>
            <TouchableOpacity
              style={styles.postbuttons}
              onPress={() => navigation.navigate('CommentSection', { postId: item.id, postData: item })}
            >
              <Ionicons name="chatbubble-outline" size={20} color={Theme.colors.accentBlue} />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.postbuttons}
              onPress={() => handleSharePost(item)}
            >
              <Ionicons name="share-outline" size={20} color={Theme.colors.accentBlue} />
            </TouchableOpacity>
          </View>
        </View>
      );
    }

    return (
      <View style={styles.postContainer}>
        <View style={[styles.postHeader, {flexDirection: "row", alignItems: "center", justifyContent: "space-between",}]}>
           <View style={{ flex: 1 }}>
        <Text style={styles.postUser}>{item.userName || 'Anonymous'}</Text>
        <Text style={styles.postMeta}>
          {item.organization ? `${item.organization} • ` : ''}{new Date(item.timestamp).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })} • <Text style={{ color: Theme.colors.primary }}>{toSentenceCase(item.category)}</Text>
        </Text>
        {item.isShared && <Text style={styles.sharedInfo}>Shared from {item.originalUserName || 'Anonymous'}'s post</Text>}
        {item.isShared && item.shareCaption && <Text style={styles.shareCaption}>{item.shareCaption}</Text>}
      </View>
          {item.userId === user?.uid && isEditable(item) && (
            <Menu onOpen={() => console.log(`Menu opened for post ${item.id}`)}>
              <MenuTrigger customStyles={{ triggerTouchable: styles.menuTrigger }}>
                <Ionicons name="ellipsis-vertical" size={20} color={Theme.colors.black} />
              </MenuTrigger>
              <MenuOptions customStyles={{ optionsContainer: styles.menuContainer}}>
                <MenuOption
                  onSelect={() => {
                    console.log('Edit post clicked for:', item.id);
                    handleEditPost(item);
                  }}
                  text="Edit Post"
                  customStyles={{
                    optionText: styles.menuText,
                  }}
                />
                <MenuOption
                  onSelect={() => {
                    console.log('Delete post clicked for:', item.id);
                    handleDeletePost(item.id, item);
                  }}
                  text="Delete Post"
                  customStyles={{
                    optionText: [styles.menuText, { color: 'red' }],
                  }}
                />
              </MenuOptions>
            </Menu>
          )}
        </View>
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
        {item.mediaType === 'link' && item.mediaUrl && (
          <TouchableOpacity onPress={() => Linking.openURL(item.mediaUrl).catch(() => ToastAndroid.show('Cannot open link.', ToastAndroid.BOTTOM))}>
            <Text style={styles.linkText}>{item.mediaUrl}</Text>
          </TouchableOpacity>
        )}
        <View style={styles.postActions}>
          <TouchableOpacity
            style={styles.postbuttons}
            onPress={() => navigation.navigate('CommentSection', { postId: item.id, postData: item })}
          >
            <Ionicons name="chatbubble-outline" size={20} color={Theme.colors.accentBlue} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.postbuttons}
            onPress={() => handleSharePost(item)}
          >
            <Ionicons name="share-outline" size={20} color={Theme.colors.accentBlue} />
          </TouchableOpacity>
        </View>
      </View>
    );
  }, [user, navigation]);

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
    <MenuProvider>
      <SafeAreaView style={GlobalStyles.container}>
        <LinearGradient
          colors={['rgba(20, 174, 187, 0.4)', '#FFF9F0']}
          start={{ x: 1, y: 0.5 }}
          end={{ x: 1, y: 1 }}
          style={GlobalStyles.gradientContainer}
        >
          <View style={GlobalStyles.newheaderContainer}>
            <TouchableOpacity onPress={() => navigation.openDrawer()} vérificationstyle={GlobalStyles.headerMenuIcon}>
              <Ionicons name="menu" size={32} color={Theme.colors.primary} />
            </TouchableOpacity>
            <Text style={[GlobalStyles.headerTitle, { color: Theme.colors.primary }]}>Community Board</Text>
          </View>
        </LinearGradient>

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1, marginTop: 50 }}
          keyboardVerticalOffset={0}
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
                  <Picker.Item
                    key={category.value}
                    label={category.label}
                    value={category.value}
                    style={{
                      fontFamily: 'Poppins_Regular',
                      fontSize: 13,
                      color: Theme.colors.black,
                      textAlign: 'center',
                    }}
                  />
                ))}
              </Picker>
            </View>
          </View>
          <FlatList
            data={posts}
            renderItem={renderPost}
            keyExtractor={(item) => item.id}
            ListEmptyComponent={<Text style={styles.emptyText}>No posts available.</Text>}
            contentContainerStyle={GlobalStyles.scrollViewContent}
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
    </MenuProvider>
  );
};

export default CommunityBoard;