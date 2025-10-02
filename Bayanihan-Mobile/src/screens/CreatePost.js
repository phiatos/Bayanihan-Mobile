import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, Platform, KeyboardAvoidingView, ScrollView, Image, SafeAreaView, ToastAndroid, StyleSheet, Animated } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import * as ImageManipulator from 'expo-image-manipulator';
import { ref as storageRef, uploadBytesResumable, getDownloadURL, deleteObject } from 'firebase/storage';
import { ref, push, set, update, get, serverTimestamp } from 'firebase/database';
import { database, storage } from '../configuration/firebaseConfig';
import { useNavigation, useRoute } from '@react-navigation/native';
import { VideoView, useVideoPlayer } from 'expo-video';
import * as VideoThumbnails from 'expo-video-thumbnails';
import GlobalStyles from '../styles/GlobalStyles';
import Theme from '../constants/theme';
import { LinearGradient } from 'expo-linear-gradient';
import styles from '../styles/CreatePostStyles';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { v4 as uuidv4 } from 'uuid';
import { Dropdown } from 'react-native-element-dropdown';
import { logActivity, logSubmission } from '../components/logSubmission';

const categories = [
  { label: 'Select Category', value: '', disabled: true },
  { label: 'Discussion', value: 'discussion' },
  { label: 'Resource', value: 'resource' },
  { label: 'Events', value: 'events' },
  { label: 'Announcement', value: 'announcement' },
];

const CreatePost = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { postType: initialPostType, postId, initialData, isShared } = route.params || {};
  const [inputHeight, setInputHeight] = useState(40);
  const [title, setTitle] = useState(initialData?.title || '');
  const [content, setContent] = useState(initialData?.content || '');
  const [category, setCategory] = useState(initialData?.category || '');
  const [shareCaption, setShareCaption] = useState(initialData?.shareCaption || '');
  const [media, setMedia] = useState(() => {
    if (!isShared && initialData?.mediaType === 'image') {
      const mediaItems = [];
      if (initialData?.mediaUrls && initialData.mediaUrls.length > 0) {
        mediaItems.push(...initialData.mediaUrls.map(url => ({
          uri: url,
          name: url.split('/').pop() || 'image.jpg',
          mimeType: 'image/jpeg',
        })));
      } else if (initialData?.mediaUrl) {
        mediaItems.push({
          uri: initialData.mediaUrl,
          name: initialData.mediaUrl.split('/').pop() || 'image.jpg',
          mimeType: 'image/jpeg',
        });
      }
      return mediaItems;
    } else if (!isShared && initialData?.mediaType === 'video' && initialData?.mediaUrl) {
      const videoMedia = [{
        uri: initialData.mediaUrl,
        name: initialData.mediaUrl.split('/').pop() || 'video.mp4',
        mimeType: 'video/mp4',
        thumbnailUri: initialData.thumbnailUrl || '',
      }];
      return videoMedia;
    }
    return [];
  });
  const [link, setLink] = useState(initialData?.mediaUrl && initialData.mediaType === 'link' ? initialData.mediaUrl : '');
  const [postType, setPostType] = useState(initialPostType || initialData?.mediaType || 'text');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const flatListRef = useRef(null);
  const playerRef = useRef(null);
  const [isDropdownFocused, setIsDropdownFocused] = useState(false); 
  const arrowRotation = useRef(new Animated.Value(0)).current; 

  const [videoSource, setVideoSource] = useState(
    isShared && initialData?.originalMediaType === 'video' && initialData?.originalMediaUrl && initialData.originalMediaUrl.startsWith('https://')
      ? { uri: initialData.originalMediaUrl }
      : null
  );

  const player = useVideoPlayer(videoSource, (player) => {
    playerRef.current = player;
  });

  const activeIndex = categories.findIndex(item => item.value === category);

  // Animation for arrow rotation
  useEffect(() => {
    Animated.timing(arrowRotation, {
      toValue: isDropdownFocused ? 1 : 0,
      duration: 200,
      useNativeDriver: true,
    }).start();
  }, [isDropdownFocused, arrowRotation]);

  useEffect(() => {
    if (!isShared && postType === 'video' && media.length > 0 && media[0].uri) {
      setVideoSource({ uri: media[0].uri });
    } else if (media.length === 0 && postType === 'video') {
      setVideoSource(null);
    }
  }, [media, postType, isShared]);

  useEffect(() => {
    try {
      if (!user) {
        throw new Error('No authenticated user found');
      }
    } catch (error) {
      console.error(`[${new Date().toISOString()}] Authentication error:`, error.message);
      setTimeout(() => {
        navigation.navigate('Login');
      }, 1000);
    }
  }, [user, navigation]);

  useEffect(() => {
    return () => {
      media.forEach(async (file) => {
        try {
          const fileInfo = await FileSystem.getInfoAsync(file.uri);
          if (fileInfo.exists && file.uri.startsWith(FileSystem.cacheDirectory)) {
            await FileSystem.deleteAsync(file.uri);
          }
          if (file.thumbnailUri && file.thumbnailUri.startsWith(FileSystem.cacheDirectory)) {
            await FileSystem.deleteAsync(file.thumbnailUri);
          }
        } catch (error) {
          console.error(`[${new Date().toISOString()}] Error cleaning up file ${file.uri}:`, error.message);
        }
      });
      if (playerRef.current && typeof playerRef.current.pause === 'function') {
        try {
          playerRef.current.pause();
        } catch (error) {
          console.error(`[${new Date().toISOString()}] Error pausing video player:`, error.message);
        }
      }
    };
  }, [media]);

  const requestPermissions = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Please grant permission to access your media library.');
        return false;
      }
      return true;
    } catch (error) {
      console.error(`[${new Date().toISOString()}] Error requesting permissions:`, error.message);
      Alert.alert('Error', 'Failed to request media library permissions.');
      return false;
    }
  };

  const pickMedia = async () => {
    if (isShared) {
      ToastAndroid.show('Media uploads are not allowed for shared posts.', ToastAndroid.SHORT);
      return;
    }
    try {
      if (postType === 'image') {
        const hasPermission = await requestPermissions();
        if (!hasPermission) return;

        const result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: false,
          allowsMultipleSelection: true,
          quality: 0.8,
          exif: false,
        });

        if (!result.canceled && result.assets && result.assets.length > 0) {
          const newMedia = [];
          for (const asset of result.assets) {
            let { uri, fileName: name = 'image.jpg', mimeType = 'image/jpeg', fileSize: size } = asset;

            const fileInfo = await FileSystem.getInfoAsync(uri);
            if (!fileInfo.exists || !fileInfo.size) {
              console.error(`[${new Date().toISOString()}] Original file does not exist or is empty at URI:`, uri);
              Alert.alert('Error', `Selected image "${name}" is inaccessible or empty.`);
              continue;
            }

            if (size > 20 * 1024 * 1024) {
              Alert.alert('Error', `Image "${name}" exceeds 20MB limit.`);
              continue;
            }

            const manipResult = await ImageManipulator.manipulateAsync(
              uri,
              [],
              { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG }
            );
            const manipFileInfo = await FileSystem.getInfoAsync(manipResult.uri);
            if (!manipFileInfo.exists || !manipFileInfo.size) {
              console.error(`[${new Date().toISOString()}] Manipulated image is inaccessible or empty at URI:`, manipResult.uri);
              Alert.alert('Error', `Failed to process image "${name}". Please try another image.`);
              continue;
            }

            newMedia.push({
              uri: manipResult.uri,
              name,
              mimeType: 'image/jpeg',
            });
          }
          setMedia(newMedia);
        }
      } else if (postType === 'video') {
        const result = await DocumentPicker.getDocumentAsync({
          type: ['video/mp4', 'video/webm'],
          copyToCacheDirectory: true,
          multiple: false,
        });

        if (!result.canceled && result.assets && result.assets.length > 0) {
          const asset = result.assets[0];
          let { uri, name, mimeType, size } = asset;

          const cacheUri = `${FileSystem.cacheDirectory}${Date.now()}_${name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
          await FileSystem.copyAsync({ from: uri, to: cacheUri });
          uri = cacheUri;

          const fileInfo = await FileSystem.getInfoAsync(uri);
          if (!fileInfo.exists || !fileInfo.size) {
            console.error(`[${new Date().toISOString()}] File does not exist or is empty at URI:`, uri);
            Alert.alert('Error', `Selected video "${name}" is inaccessible or empty.`);
            return;
          }

          if (size > 20 * 1024 * 1024) {
            Alert.alert('Error', `Video "${name}" exceeds 20MB limit.`);
            return;
          }

          const newMedia = [{ uri, name, mimeType, thumbnailUri: '' }];
          try {
            const { uri: thumbnailUri } = await VideoThumbnails.getThumbnailAsync(uri, {
              time: 1000,
              quality: 0.8,
              compress: 0.8,
            });
            const thumbInfo = await FileSystem.getInfoAsync(thumbnailUri);
            if (!thumbInfo.exists || !thumbInfo.size) {
              console.error(`[${new Date().toISOString()}] Thumbnail is inaccessible or empty at URI:`, thumbnailUri);
              Alert.alert('Warning', `Failed to generate thumbnail for "${name}". Proceeding without thumbnail.`);
            } else {
              newMedia[0].thumbnailUri = thumbnailUri;
            }
          } catch (error) {
            console.error(`[${new Date().toISOString()}] Error generating thumbnail for ${name}:`, error.message);
            Alert.alert('Warning', `Failed to generate thumbnail for "${name}". Proceeding without thumbnail.`);
          }
          setMedia(newMedia);
        }
      }
    } catch (error) {
      console.error(`[${new Date().toISOString()}] Error picking media:`, error.message);
      Alert.alert('Error', `Failed to pick media: ${error.message}`);
    }
  };

  const deleteFromStorage = async (file, index) => {
    try {
      if (!user?.id) {
        throw new Error('User not authenticated');
      }
      if (!file.uri.startsWith('https://')) {
        return;
      }

      const originalPath = file.uri.split('/o/')[1].split('?')[0];
      const fileName = file.name || originalPath.split('/').pop();
      const deletedPath = `deleted/${user.id}/${Date.now()}_${fileName}`;
      const originalRef = storageRef(storage, decodeURIComponent(originalPath));
      const deletedRef = storageRef(storage, deletedPath);

      const response = await fetch(file.uri);
      const blob = await response.blob();
      await uploadBytesResumable(deletedRef, blob, { contentType: file.mimeType });

      try {
        await deleteObject(originalRef);
      } catch (error) {
        console.warn(`[${new Date().toISOString()}] Failed to delete original media ${fileName} from ${originalPath}:`, error.message);
      }

      if (postType === 'video' && file.thumbnailUri && file.thumbnailUri.startsWith('https://')) {
        const thumbPath = file.thumbnailUri.split('/o/')[1].split('?')[0];
        const thumbName = file.thumbnailUri.split('/').pop() || 'thumbnail.jpg';
        const deletedThumbPath = `deleted/${user.id}/${Date.now()}_${thumbName}`;
        const thumbRef = storageRef(storage, decodeURIComponent(thumbPath));
        const deletedThumbRef = storageRef(storage, deletedThumbPath);

        const thumbResponse = await fetch(file.thumbnailUri);
        const thumbBlob = await thumbResponse.blob();
        await uploadBytesResumable(deletedThumbRef, thumbBlob, { contentType: 'image/jpeg' });

        try {
          await deleteObject(thumbRef);
        } catch (error) {
          console.warn(`[${new Date().toISOString()}] Failed to delete original thumbnail ${thumbName} from ${thumbPath}:`, error.message);
        }
      }
    } catch (error) {
      console.error(`[${new Date().toISOString()}] Error moving media ${file.name} to deleted:`, error.message);
      throw error;
    }
  };

  const removeMedia = (index) => {
    const file = media[index];
    Alert.alert(
      'Remove Media',
      `Are you sure you want to remove the ${postType === 'video' ? 'video' : 'image'}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              if (file.uri.startsWith('https://')) {
                await deleteFromStorage(file, index);
              }
              setMedia(media.filter((_, i) => i !== index));
              ToastAndroid.show('Media removed successfully.', ToastAndroid.SHORT);
            } catch (error) {
              console.error(`[${new Date().toISOString()}] Error removing media:`, error.message);
              ToastAndroid.show(`Failed to remove media: ${error.message}`, ToastAndroid.LONG);
            }
          },
        },
      ]
    );
  };

  const uploadMedia = async (file, path) => {
    try {
      if (!user?.id) {
        throw new Error('User not authenticated. Please sign in.');
      }

      const { uri, name, mimeType } = file;
      const fileInfo = await FileSystem.getInfoAsync(uri);
      if (!fileInfo.exists || !fileInfo.size) {
        throw new Error(`File "${name}" does not exist or is empty at URI: ${uri}`);
      }
      if (fileInfo.size > 20 * 1024 * 1024) {
        throw new Error(`File "${name}" exceeds 20MB limit.`);
      }

      const response = await fetch(uri);
      if (!response.ok) {
        throw new Error(`Failed to fetch file: ${response.statusText}`);
      }
      const blob = await response.blob();
      if (!blob.size) {
        throw new Error(`Blob for "${name}" is empty.`);
      }

      const contentType = mimeType || (path.endsWith('.jpg') || path.endsWith('.jpeg') ? 'image/jpeg' :
                                      path.endsWith('.png') ? 'image/png' :
                                      path.endsWith('.mp4') ? 'video/mp4' :
                                      path.endsWith('.webm') ? 'video/webm' : 'application/octet-stream');
      const metadata = { contentType };

      const storageReference = storageRef(storage, path);
      const uploadTask = uploadBytesResumable(storageReference, blob, metadata);
      return await new Promise((resolve, reject) => {
        uploadTask.on(
          'state_changed',
          (snapshot) => {
            const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            setUploadProgress(progress);
          },
          (error) => {
            console.error(`[${new Date().toISOString()}] Upload failed for "${name}":`, error.message, error.code || 'N/A');
            switch (error.code) {
              case 'storage/unauthorized':
                reject(new Error('Unauthorized to upload to this path. Check Firebase Storage rules.'));
                break;
              case 'storage/quota-exceeded':
                reject(new Error('Storage quota exceeded. Contact support or reduce file size.'));
                break;
              case 'storage/canceled':
                reject(new Error('Upload was canceled.'));
                break;
              case 'storage/unknown':
                reject(new Error('Unknown error occurred during upload. Check network or Firebase configuration.'));
                break;
              case 'storage/invalid-bucket-name':
                reject(new Error('Invalid bucket name. Verify the bucket exists in Google Cloud Console.'));
                break;
              default:
                reject(error);
            }
          },
          async () => {
            try {
              const downloadURL = await getDownloadURL(storageReference);
              resolve(downloadURL);
            } catch (error) {
              console.error(`[${new Date().toISOString()}] Error getting download URL:`, error.message);
              reject(new Error(`Failed to get download URL: ${error.message}`));
            }
          }
        );
      });
    } catch (error) {
      console.error(`[${new Date().toISOString()}] Error uploading media "${file.name}" to ${path}:`, error.message);
      throw error;
    }
  };

  const handleSubmit = async () => {
    if (isSubmitting) {
      console.warn(`[${new Date().toISOString()}] Submission already in progress`);
      return;
    }

    try {
      if (!user?.id) {
        throw new Error('No authenticated user found');
      }

      if (!isShared) {
        if (!title.trim()) {
          throw new Error('Please provide a title');
        }
        if (!category) {
          throw new Error('Please select a category');
        }
        if ((postType === 'image' || postType === 'video') && media.length === 0 && !initialData?.mediaUrls && !initialData?.mediaUrl) {
          throw new Error(`Please select ${postType === 'image' ? 'image(s)' : 'a video'}`);
        }
        if (postType === 'link' && (!link.trim() || !/^https?:\/\//.test(link))) {
          throw new Error('Please provide a valid URL starting with http:// or https://');
        }
      } else if (!shareCaption.trim()) {
        throw new Error('Please provide a caption for the shared post');
      }

      setIsSubmitting(true);
      setUploadProgress(0);

      const userRef = ref(database, `users/${user.id}`);
      const userSnapshot = await get(userRef);
      if (!userSnapshot.exists()) {
        console.warn(`[${new Date().toISOString()}] User data not found for user ID:`, user.id);
        throw new Error('User data not found. Please ensure your account is properly set up.');
      }
      const userData = userSnapshot.val() || {};
      const userName = userData.contactPerson || 
        (userData.firstName || userData.lastName 
          ? `${userData.firstName || ''} ${userData.lastName || ''}`.trim() 
          : userData.displayName || 'Admin');
      const organization = userData.organization || ' ';

      let postData;
      if (isShared) {
        postData = {
          userId: user.id,
          userName,
          organization,
          timestamp: serverTimestamp(),
          isShared: true,
          shareCaption: shareCaption.trim(),
          title: initialData?.originalTitle || '',
          content: initialData?.originalContent || '',
          category: initialData?.originalCategory || '',
          mediaType: initialData?.originalMediaType || 'text',
          mediaUrls: initialData?.originalMediaUrls && initialData.originalMediaUrls.length > 0 ? initialData.originalMediaUrls : [],
          mediaUrl: initialData?.originalMediaUrl || '',
          thumbnailUrl: initialData?.originalThumbnailUrl || '',
          originalUserId: initialData?.originalUserId || '',
          originalUserName: initialData?.originalUserName || 'Anonymous',
          originalOrganization: initialData?.originalOrganization || '',
          originalTimestamp: initialData?.originalTimestamp || 0,
        };
      } else {
        postData = {
          title: title.trim(),
          content: content.trim(),
          category,
          userName,
          organization,
          timestamp: serverTimestamp(),
          userId: user.id,
          mediaType: postType,
        };

        if (postType === 'image' && media.length === 0) {
          postData.mediaUrls = [];
        }
        if (postType === 'video' && media.length === 0) {
          postData.mediaUrl = '';
          postData.thumbnailUrl = '';
        }

        if (postType === 'image' && media.length > 0) {
          postData.mediaUrls = [];
          for (const file of media) {
            if (file.uri.startsWith('https://')) {
              postData.mediaUrls.push(file.uri);
              continue;
            }
            const imagePath = `image_posts/${user.id}/${Date.now()}_${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
            const downloadURL = await uploadMedia(file, imagePath);
            postData.mediaUrls.push(downloadURL);
          }
        }

        if (postType === 'video' && media.length > 0) {
          const file = media[0];
          if (!file.uri.startsWith('https://')) {
            const mediaPath = `video_posts/${user.id}/${Date.now()}_${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
            const downloadURL = await uploadMedia(file, mediaPath);
            postData.mediaUrl = downloadURL;
            if (file.thumbnailUri && !file.thumbnailUri.startsWith('https://')) {
              const thumbnailPath = `video_posts/${user.id}/thumbnails/${Date.now()}_thumbnail.jpg`;
              const thumbnailURL = await uploadMedia(
                { uri: file.thumbnailUri, name: 'thumbnail.jpg', mimeType: 'image/jpeg' },
                thumbnailPath
              );
              postData.thumbnailUrl = thumbnailURL;
            } else if (file.thumbnailUri) {
              postData.thumbnailUrl = file.thumbnailUri;
            }
          } else {
            postData.mediaUrl = file.uri;
            postData.thumbnailUrl = file.thumbnailUri || '';
          }
        }

        if (postType === 'link') {
          postData.mediaUrl = link.trim();
        }
      }

      if (postId) {
        if (!postId) {
          throw new Error('Post ID is undefined for update operation');
        }
        const postRef = ref(database, `posts/${postId}`);
        await update(postRef, postData);
        await logActivity(user.id, 'Updated a post', postId, organization);
        await logSubmission('posts', postData, postId, organization, user.id);
        ToastAndroid.show('Post updated successfully.', ToastAndroid.SHORT);
      } else {
        const postsRef = ref(database, 'posts');
        const newPostRef = push(postsRef);
        const submissionId = newPostRef.key;
        if (!submissionId) {
          throw new Error('Failed to generate submission ID for new post');
        }
        await set(newPostRef, postData);
        await logActivity(user.id, `Created a new post in ${postData.category || 'shared post'}`, submissionId, organization);
        await logSubmission('posts', postData, submissionId, organization, user.id);
        ToastAndroid.show('Post created successfully.', ToastAndroid.SHORT);
      }

      navigation.goBack();
    } catch (error) {
      console.error(`[${new Date().toISOString()}] Error creating/updating post:`, error.message, error.code || 'N/A');
      Alert.alert('Error', `Failed to create/update post: ${error.message}`);
    } finally {
      setIsSubmitting(false);
      setUploadProgress(0);
    }
  };

  const handlePostTypeChange = (newPostType) => {
    if (isShared) {
      ToastAndroid.show('Post type cannot be changed for shared posts.', ToastAndroid.SHORT);
      return;
    }
    setPostType(newPostType);
    setMedia([]);
    setLink('');
  };

  if (!VideoView || !useVideoPlayer) {
    console.error(`[${new Date().toISOString()}] VideoView or useVideoPlayer is undefined`);
    return (
      <SafeAreaView style={GlobalStyles.container}>
        <Text>Error: Video component failed to load.</Text>
      </SafeAreaView>
    );
  }

  const ITEM_HEIGHT = 50; 
  return (
    <SafeAreaView style={[GlobalStyles.container, { paddingBottom: insets.bottom }]}>
      <LinearGradient
        colors={['rgba(20, 174, 187, 0.4)', '#FFF9F0']}
        start={{ x: 1, y: 0.5 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradientContainer}
      >
        <View style={GlobalStyles.newheaderContainer}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={GlobalStyles.headerMenuIcon}>
            <Ionicons name="arrow-back" size={32} color={Theme.colors.primary} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={isSubmitting}
          >
            <Text style={[styles.submitButtonText, isSubmitting && { color: Theme.colors.primary }]}>
              {isSubmitting ? 'Submitting...' : postId ? 'Update' : 'Post'}
            </Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1}}
        keyboardVerticalOffset={Platform.OS === 'ios' ? -50 : -30}
      >
        <ScrollView
          contentContainerStyle={[styles.scrollViewContent, { paddingBottom: insets.bottom + 30 }]}
        >
          <View style={[styles.formContainer, { marginBottom: 50, marginTop: 100 }]}>
            {isShared ? (
              <View style={{ marginLeft: 0 }}>
                <Text style={styles.sharedInfo}>
                  Sharing post from {initialData?.originalUserName || ''}{' '}
                  {initialData?.originalOrganization && user?.role !== 'Admin' ? `(${initialData.originalOrganization})` : ''}
                </Text>
                <TextInput
                  style={{ height: Math.max(40, inputHeight), marginLeft: 10, color: Theme.colors.black, fontFamily: 'Poppins_Regular' }}
                  value={shareCaption}
                  onChangeText={setShareCaption}
                  placeholder="Add a caption for your shared post"
                  placeholderTextColor={Platform.select({
                    ios: Theme.colors.placeholder || '#777777ff',
                    android: Theme.colors.placeholder || '#777777ff',
                  })}
                  multiline
                  maxLength={500}
                  onContentSizeChange={(event) =>
                    setInputHeight(event.nativeEvent.contentSize.height)
                  }
                />
                <View style={[styles.sharedPostContainer, { backgroundColor: Theme.colors.lightGrey, paddingTop: 10, borderRadius: 8 }]}>
                  <Text style={[styles.readOnlyLabel, { color: Theme.colors.black }]}>{initialData?.originalTitle || 'No title'}</Text>
                  <Text style={[styles.readOnlyText, { color: Theme.colors.black }]}>{initialData?.originalContent || 'No content'}</Text>
                  {initialData?.originalMediaType === 'image' && (initialData?.originalMediaUrl || (initialData?.originalMediaUrls && initialData.originalMediaUrls.length > 0)) && (
                    <View style={styles.mediaPreviewContainer}>
                      {(initialData.originalMediaUrls || [initialData.originalMediaUrl]).filter(url => url).map((url, index) => (
                        <Image
                          key={index}
                          source={{ uri: url }}
                          style={styles.thumbnailPreview}
                          resizeMode="contain"
                          onError={(error) => {
                            console.error(`[${new Date().toISOString()}] Image load error for shared post, url ${url}:`, error.nativeEvent);
                            ToastAndroid.show('Failed to load image.', ToastAndroid.SHORT);
                          }}
                        />
                      ))}
                    </View>
                  )}
                  {initialData?.originalMediaType === 'video' && initialData?.originalMediaUrl && (
                    <View style={[styles.mediaPreview, { marginLeft: 0 }]}>
                      <VideoView
                        player={player}
                        style={styles.videoPreview}
                        contentFit="contain"
                        nativeControls
                        posterSource={
                          initialData?.originalThumbnailUrl && initialData.originalThumbnailUrl.startsWith('https://')
                            ? { uri: initialData.originalThumbnailUrl }
                            : undefined
                        }
                        onError={(error) => {
                          console.error(`[${new Date().toISOString()}] Video playback error for shared post:`, error);
                          ToastAndroid.show('Failed to play video.', ToastAndroid.SHORT);
                        }}
                      />
                    </View>
                  )}
                  {initialData?.originalMediaType === 'link' && initialData?.originalMediaUrl && (
                    <Text style={[styles.readOnlyText, { color: Theme.colors.accentBlue, textDecorationLine: 'underline' }]}>{initialData.originalMediaUrl}</Text>
                  )}
                </View>
              </View>
            ) : (
              <>
                <View style={styles.container}>
                  <Dropdown
                    style={styles.dropdown}
                    placeholder="Select a category"
                    placeholderStyle={GlobalStyles.placeholderStyle}
                    selectedTextStyle={GlobalStyles.selectedTextStyle}
                    placeholderTextColor={Platform.select({
                    ios: Theme.colors.placeholder || '#777777ff',
                    android: Theme.colors.placeholder || '#777777ff',
                  })}
                    itemTextStyle={GlobalStyles.itemTextStyle}
                    itemContainerStyle={GlobalStyles.itemContainerStyle}
                    containerStyle={GlobalStyles.containerStyle}
                    data={categories}
                    labelField="label"
                    valueField="value"
                    value={category}
                    onChange={(item) => {
                      setCategory(item.value);
                    }}
                    disable={isSubmitting}
                    renderRightIcon={() => (
                      <Animated.View
                        style={{
                          transform: [{
                            rotate: arrowRotation.interpolate({
                              inputRange: [0, 1],
                              outputRange: ['0deg', '180deg'],
                            }),
                          }],
                        }}
                      >
                        <Ionicons
                          name="chevron-down"
                          size={18}
                          color={Theme.colors.placeholder || '#777777ff'}
                        />
                      </Animated.View>
                    )}
                    autoScroll={false}
                    flatListProps={{
                      keyExtractor: (item) => item.value.toString(),
                      ref: flatListRef,
                      getItemLayout: (_, index) => ({
                        length: ITEM_HEIGHT,
                        offset: ITEM_HEIGHT * index,
                        index,
                      }),
                    }}
                    renderItem={(item) => (
                      <Text style={GlobalStyles.itemTextStyle}>
                        {item.label}
                      </Text>
                    )}
                    onFocus={() => {
                      setIsDropdownFocused(true);
                      if (category && activeIndex >= 0) {
                        setTimeout(() => {
                          flatListRef.current?.scrollToIndex({ index: activeIndex, animated: true });
                        }, 100);
                      }
                    }}
                    onBlur={() => {
                      setIsDropdownFocused(false);
                    }}
                  />
                </View>
                <TextInput
                  style={[styles.input, { fontSize: 20, fontFamily: 'Poppins_Bold', color: Theme.colors.black }]}
                  value={title}
                  onChangeText={setTitle}
                  placeholder="Title"
                  placeholderTextColor={Platform.select({
                    ios: Theme.colors.placeholder || '#777777ff',
                    android: Theme.colors.placeholder || '#777777ff',
                  })}
                />
                <TextInput
                  style={[styles.input, styles.textArea, { color: Theme.colors.black }]}
                  value={content}
                  onChangeText={setContent}
                  placeholder="What's on your mind?"
                  placeholderTextColor={Platform.select({
                    ios: Theme.colors.placeholder || '#777777ff',
                    android: Theme.colors.placeholder || '#777777ff',
                  })}
                  multiline
                  numberOfLines={4}
                />
                {(postType === 'image' || postType === 'video') && (
                  <View style={styles.mediaContainer}>
                    {postType === 'image' && media.length === 0 && (
                      <TouchableOpacity style={styles.imageUpload} onPress={pickMedia}>
                        <Text style={styles.imageUploadText}>Select Images</Text>
                      </TouchableOpacity>
                    )}
                    {postType === 'video' && (
                      <TouchableOpacity style={styles.imageUpload} onPress={pickMedia}>
                        <Text style={styles.imageUploadText}>
                          {media.length > 0 ? 'Replace Video' : 'Select Video'}
                        </Text>
                      </TouchableOpacity>
                    )}
                    {media.length > 0 && postType === 'video' && media[0].uri && (
                      <View style={styles.mediaPreview}>
                        <VideoView
                          player={player}
                          style={styles.videoPreview}
                          contentFit="contain"
                          nativeControls
                          posterSource={media[0].thumbnailUri ? { uri: media[0].thumbnailUri } : undefined}
                          onError={(error) => {
                            console.error(`[${new Date().toISOString()}] Video playback error:`, error);
                            Alert.alert('Error', 'Failed to play video.');
                          }}
                        />
                        <TouchableOpacity
                          style={styles.removeButton}
                          onPress={() => removeMedia(0)}
                        >
                          <Ionicons name="trash-outline" size={20} color={Theme.colors.white} />
                        </TouchableOpacity>
                      </View>
                    )}
                    {media.length > 0 && postType === 'image' && (
                      <View style={styles.mediaPreviewContainer}>
                        {media.map((item, index) => (
                          <View key={index} style={styles.mediaPreview}>
                            <Image
                              source={{ uri: item.uri }}
                              style={styles.thumbnailPreview}
                              resizeMode="contain"
                              onError={(error) => {
                                console.error(`[${new Date().toISOString()}] Image preview error for ${item.name}:`, error.nativeEvent);
                                Alert.alert('Error', `Failed to load image: ${item.name}`);
                              }}
                            />
                            <TouchableOpacity
                              style={styles.removeButton}
                              onPress={() => removeMedia(index)}
                            >
                              <Ionicons name="trash-outline" size={20} color={Theme.colors.white} />
                            </TouchableOpacity>
                          </View>
                        ))}
                      </View>
                    )}
                  </View>
                )}
                {postType === 'link' && (
                  <View style={styles.mediaContainer}>
                    <TextInput
                      style={[styles.inputLink, { color: Theme.colors.black }]}
                      value={link}
                      onChangeText={setLink}
                      placeholder="Enter URL (e.g., https://example.com)"
                      placeholderTextColor={Platform.select({
                        ios: Theme.colors.placeholder || '#777777ff',
                        android: Theme.colors.placeholder || '#777777ff',
                      })}
                      keyboardType="url"
                    />
                  </View>
                )}
              </>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {isSubmitting && (
        <View style={[styles.progressContainer, { bottom: insets.bottom + 60 }]}>
          <View style={styles.progressBarBackground}>
            <View
              style={[styles.progressBarFill, { width: `${uploadProgress}%` }]}
            />
          </View>
          <Text style={styles.progressText}>{`${uploadProgress.toFixed(0)}%`}</Text>
        </View>
      )}

      <View style={[styles.navbar, { bottom: insets.bottom, paddingBottom: 10 }]}>
        {[
          { type: 'text', icon: 'text-outline' },
          { type: 'image', icon: 'image-outline' },
          { type: 'video', icon: 'videocam-outline' },
          { type: 'link', icon: 'link-outline' },
        ].map((item, index) => (
          <TouchableOpacity
            key={index}
            style={[
              styles.navButton,
              postType === item.type && styles.navButtonActive,
              isShared && styles.navButtonDisabled,
            ]}
            onPress={() => handlePostTypeChange(item.type)}
            disabled={isShared}
          >
            <Ionicons
              name={item.icon}
              size={postType === item.type ? 30 : 24}
              color={postType === item.type ? Theme.colors.accent : Theme.colors.primary}
            />
          </TouchableOpacity>
        ))}
      </View>
    </SafeAreaView>
  );
};

export default CreatePost;