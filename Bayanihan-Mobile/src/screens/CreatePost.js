import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, Platform, KeyboardAvoidingView, ScrollView, Image, SafeAreaView, ToastAndroid } from 'react-native';
import { Picker } from '@react-native-picker/picker';
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
import { logActivity, logSubmission } from '../components/logSubmission';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';

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
    console.log(`[${new Date().toISOString()}] Initializing media state with initialData:`, initialData);
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
      console.log(`[${new Date().toISOString()}] Image media initialized:`, mediaItems);
      return mediaItems;
    } else if (!isShared && initialData?.mediaType === 'video' && initialData?.mediaUrl) {
      const videoMedia = [{
        uri: initialData.mediaUrl,
        name: initialData.mediaUrl.split('/').pop() || 'video.mp4',
        mimeType: 'video/mp4',
        thumbnailUri: initialData.thumbnailUrl || '',
      }];
      console.log(`[${new Date().toISOString()}] Video media initialized:`, videoMedia);
      return videoMedia;
    }
    return [];
  });
  const [link, setLink] = useState(initialData?.mediaUrl && initialData.mediaType === 'link' ? initialData.mediaUrl : '');
  const [postType, setPostType] = useState(initialPostType || initialData?.mediaType || 'text');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const playerRef = useRef(null);

  const player = useVideoPlayer(
    isShared && initialData?.originalMediaType === 'video' && initialData?.originalMediaUrl && initialData.originalMediaUrl.startsWith('https://')
      ? { uri: initialData.originalMediaUrl }
      : (!isShared && media.length > 0 && postType === 'video' && media[0].uri && media[0].uri.startsWith('https://') ? { uri: media[0].uri } : null),
    (player) => {
      playerRef.current = player;
      console.log(`[${new Date().toISOString()}] Video player initialized for:`, isShared ? initialData?.originalMediaUrl : media[0]?.uri);
    }
  );

  const categories = [
    { label: 'Select Category', value: '', disabled: true },
    { label: 'Discussion', value: 'discussion' },
    { label: 'Resource', value: 'resource' },
    { label: 'Events', value: 'events' },
    { label: 'Announcement', value: 'announcement' },
  ];

  useEffect(() => {
    try {
      if (!user) {
        throw new Error('No authenticated user found');
      }
      console.log(`[${new Date().toISOString()}] Logged-in user ID:`, user.id);
    } catch (error) {
      console.error(`[${new Date().toISOString()}] Authentication error:`, error.message);
      setTimeout(() => {
        navigation.navigate('Login');
      }, 1000);
    }
  }, [user, navigation]);

  useEffect(() => {
    console.log(`[${new Date().toISOString()}] Media state updated:`, media);
    return () => {
      media.forEach(async (file) => {
        try {
          const fileInfo = await FileSystem.getInfoAsync(file.uri);
          if (fileInfo.exists && file.uri.startsWith(FileSystem.cacheDirectory)) {
            await FileSystem.deleteAsync(file.uri);
            console.log(`[${new Date().toISOString()}] Cleaned up cached file:`, file.uri);
          }
          if (file.thumbnailUri && file.thumbnailUri.startsWith(FileSystem.cacheDirectory)) {
            await FileSystem.deleteAsync(file.thumbnailUri);
            console.log(`[${new Date().toISOString()}] Cleaned up cached thumbnail:`, file.thumbnailUri);
          }
        } catch (error) {
          console.error(`[${new Date().toISOString()}] Error cleaning up file ${file.uri}:`, error.message);
        }
      });
      if (playerRef.current && typeof playerRef.current.pause === 'function') {
        try {
          playerRef.current.pause();
          console.log(`[${new Date().toISOString()}] Video player paused during cleanup`);
        } catch (error) {
          console.error(`[${new Date().toISOString()}] Error pausing video player:`, error.message);
        }
      }
    };
  }, [media]);

  const requestPermissions = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      console.log(`[${new Date().toISOString()}] Media library permission status:`, status);
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
      console.log(`[${new Date().toISOString()}] Media upload disabled for shared posts`);
      ToastAndroid.show('Media uploads are not allowed for shared posts.', ToastAndroid.SHORT);
      return;
    }
    try {
      console.log(`[${new Date().toISOString()}] Picking media for postType:`, postType);
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
        console.log(`[${new Date().toISOString()}] ImagePicker result:`, result);

        if (!result.canceled && result.assets && result.assets.length > 0) {
          const newMedia = [];
          for (const asset of result.assets) {
            let { uri, fileName: name = 'image.jpg', mimeType = 'image/jpeg', fileSize: size } = asset;

            console.log(`[${new Date().toISOString()}] Selected image URI:`, uri);
            console.log(`[${new Date().toISOString()}] File details:`, { uri, name, mimeType, size });

            const fileInfo = await FileSystem.getInfoAsync(uri);
            console.log(`[${new Date().toISOString()}] Original file info:`, fileInfo);
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
            console.log(`[${new Date().toISOString()}] Manipulated image URI:`, manipResult.uri);
            const manipFileInfo = await FileSystem.getInfoAsync(manipResult.uri);
            console.log(`[${new Date().toISOString()}] Manipulated file info:`, manipFileInfo);
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
          console.log(`[${new Date().toISOString()}] Updated media state:`, newMedia);
        }
      } else if (postType === 'video') {
        const result = await DocumentPicker.getDocumentAsync({
          type: ['video/mp4', 'video/webm'],
          copyToCacheDirectory: true,
          multiple: false,
        });
        console.log(`[${new Date().toISOString()}] DocumentPicker result:`, result);

        if (!result.canceled && result.assets && result.assets.length > 0) {
          const asset = result.assets[0];
          let { uri, name, mimeType, size } = asset;

          console.log(`[${new Date().toISOString()}] Selected video URI:`, uri);
          console.log(`[${new Date().toISOString()}] File details:`, { uri, name, mimeType, size });

          const cacheUri = `${FileSystem.cacheDirectory}${Date.now()}_${name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
          await FileSystem.copyAsync({ from: uri, to: cacheUri });
          uri = cacheUri;

          const fileInfo = await FileSystem.getInfoAsync(uri);
          console.log(`[${new Date().toISOString()}] Cached file info:`, fileInfo);
          if (!fileInfo.exists || !fileInfo.size) {
            console.error(`[${new Date().toISOString()}] File does not exist or is empty at URI:`, uri);
            Alert.alert('Error', `Selected video "${name}" is inaccessible or empty.`);
            return;
          }

          if (size > 20 * 1024 * 1024) {
            Alert.alert('Error', `Video "${name}" exceeds 20MB limit.`);
            return;
          }

          const newMedia = [{ uri, name, mimeType }];
          try {
            const { uri: thumbnailUri } = await VideoThumbnails.getThumbnailAsync(uri, { time: 1000 });
            console.log(`[${new Date().toISOString()}] Thumbnail URI:`, thumbnailUri);
            newMedia[0].thumbnailUri = thumbnailUri;
          } catch (error) {
            console.error(`[${new Date().toISOString()}] Error generating thumbnail for ${name}:`, error.message);
            Alert.alert('Error', `Failed to generate thumbnail for "${name}".`);
          }
          setMedia(newMedia);
          console.log(`[${new Date().toISOString()}] Updated media state:`, newMedia);
        }
      }
    } catch (error) {
      console.error(`[${new Date().toISOString()}] Error picking media:`, error.message);
      Alert.alert('Error', `Failed to pick media: ${error.message}`);
    }
  };

  const deleteFromStorage = async (file, index) => {
    try {
      console.log(`[${new Date().toISOString()}] Attempting to move media to deleted:`, file.uri);
      if (!user?.id) {
        throw new Error('User not authenticated');
      }
      if (!file.uri.startsWith('https://')) {
        console.log(`[${new Date().toISOString()}] Media ${file.name} is not in Firebase Storage, skipping storage deletion`);
        return;
      }

      const originalPath = file.uri.split('/o/')[1].split('?')[0];
      const fileName = file.name || originalPath.split('/').pop();
      const deletedPath = `deleted/${user.id}/${Date.now()}_${fileName}`;
      const originalRef = storageRef(storage, decodeURIComponent(originalPath));
      const deletedRef = storageRef(storage, deletedPath);

      console.log(`[${new Date().toISOString()}] Copying ${originalPath} to ${deletedPath}`);
      const response = await fetch(file.uri);
      const blob = await response.blob();
      await uploadBytesResumable(deletedRef, blob, { contentType: file.mimeType });
      console.log(`[${new Date().toISOString()}] Media ${fileName} copied to ${deletedPath}`);

      try {
        await deleteObject(originalRef);
        console.log(`[${new Date().toISOString()}] Media ${fileName} deleted from ${originalPath}`);
      } catch (error) {
        console.warn(`[${new Date().toISOString()}] Failed to delete original media ${fileName} from ${originalPath}:`, error.message);
      }

      if (postType === 'video' && file.thumbnailUri && file.thumbnailUri.startsWith('https://')) {
        const thumbPath = file.thumbnailUri.split('/o/')[1].split('?')[0];
        const thumbName = file.thumbnailUri.split('/').pop() || 'thumbnail.jpg';
        const deletedThumbPath = `deleted/${user.id}/${Date.now()}_${thumbName}`;
        const thumbRef = storageRef(storage, decodeURIComponent(thumbPath));
        const deletedThumbRef = storageRef(storage, deletedThumbPath);

        console.log(`[${new Date().toISOString()}] Copying thumbnail ${thumbPath} to ${deletedThumbPath}`);
        const thumbResponse = await fetch(file.thumbnailUri);
        const thumbBlob = await thumbResponse.blob();
        await uploadBytesResumable(deletedThumbRef, thumbBlob, { contentType: 'image/jpeg' });
        console.log(`[${new Date().toISOString()}] Thumbnail ${thumbName} copied to ${deletedThumbPath}`);

        try {
          await deleteObject(thumbRef);
          console.log(`[${new Date().toISOString()}] Thumbnail ${thumbName} deleted from ${thumbPath}`);
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
              console.log(`[${new Date().toISOString()}] Media removed, new media state:`, media.filter((_, i) => i !== index));
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
      console.log(`[${new Date().toISOString()}] Starting upload for:`, file.name, 'to:', path);
      console.log(`[${new Date().toISOString()}] Current user ID:`, user?.id || 'No user');

      if (!user?.id) {
        throw new Error('User not authenticated. Please sign in.');
      }

      const { uri, name, mimeType } = file;
      const fileInfo = await FileSystem.getInfoAsync(uri);
      console.log(`[${new Date().toISOString()}] File info:`, fileInfo);
      if (!fileInfo.exists || !fileInfo.size) {
        throw new Error(`File "${name}" does not exist or is empty at URI: ${uri}`);
      }
      if (fileInfo.size > 20 * 1024 * 1024) {
        throw new Error(`File "${name}" exceeds 20MB limit.`);
      }

      const response = await fetch(uri);
      console.log(`[${new Date().toISOString()}] Fetch response:`, response.ok, response.status);
      if (!response.ok) {
        throw new Error(`Failed to fetch file: ${response.statusText}`);
      }
      const blob = await response.blob();
      console.log(`[${new Date().toISOString()}] Blob size:`, blob.size, 'for:', name);
      if (!blob.size) {
        throw new Error(`Blob for "${name}" is empty.`);
      }

      const contentType = mimeType || (path.endsWith('.jpg') || path.endsWith('.jpeg') ? 'image/jpeg' :
                                      path.endsWith('.png') ? 'image/png' :
                                      path.endsWith('.mp4') ? 'video/mp4' :
                                      path.endsWith('.webm') ? 'video/webm' : 'application/octet-stream');
      const metadata = { contentType };
      console.log(`[${new Date().toISOString()}] Content type:`, contentType);

      const storageReference = storageRef(storage, path);
      console.log(`[${new Date().toISOString()}] Storage reference:`, storageReference.toString());
      const uploadTask = uploadBytesResumable(storageReference, blob, metadata);
      return await new Promise((resolve, reject) => {
        uploadTask.on(
          'state_changed',
          (snapshot) => {
            const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            console.log(`[${new Date().toISOString()}] Upload progress for "${name}": ${progress.toFixed(2)}%`);
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
              console.log(`[${new Date().toISOString()}] Upload successful for "${name}". Download URL:`, downloadURL);
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
    console.log(`[${new Date().toISOString()}] handleSubmit called with:`, { postType, title, content, category, mediaLength: media.length, link, isShared, shareCaption, postId });

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
    console.log(`[${new Date().toISOString()}] User data fetched:`, { userName, organization });

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
        console.log(`[${new Date().toISOString()}] Cleared mediaUrls for image post`);
      }
      if (postType === 'video' && media.length === 0) {
        postData.mediaUrl = '';
        postData.thumbnailUrl = '';
        console.log(`[${new Date().toISOString()}] Cleared mediaUrl and thumbnailUrl for video post`);
      }

      console.log(`[${new Date().toISOString()}] Attempting to upload media for postType:`, postType);
      if (postType === 'image' && media.length > 0) {
        postData.mediaUrls = [];
        for (const file of media) {
          if (file.uri.startsWith('https://')) {
            postData.mediaUrls.push(file.uri);
            continue;
          }
          const imagePath = `image_posts/${user.id}/${Date.now()}_${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
          console.log(`[${new Date().toISOString()}] Uploading image to:`, imagePath);
          const downloadURL = await uploadMedia(file, imagePath);
          postData.mediaUrls.push(downloadURL);
        }
      }

      if (postType === 'video' && media.length > 0) {
        const file = media[0];
        if (!file.uri.startsWith('https://')) {
          const mediaPath = `video_posts/${user.id}/${Date.now()}_${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
          console.log(`[${new Date().toISOString()}] Uploading video to:`, mediaPath);
          const downloadURL = await uploadMedia(file, mediaPath);
          postData.mediaUrl = downloadURL;
          if (file.thumbnailUri && !file.thumbnailUri.startsWith('https://')) {
            const thumbnailPath = `video_posts/${user.id}/thumbnails/${Date.now()}_thumbnail.jpg`;
            console.log(`[${new Date().toISOString()}] Uploading thumbnail to:`, thumbnailPath);
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

    // Log parameters before calling logSubmission
    console.log(`[${new Date().toISOString()}] Preparing to log submission:`, {
      collection: 'posts',
      postData,
      submissionId: postId || (postData.isShared ? null : push(ref(database, 'posts')).key),
      organization,
    });

    if (postId) {
      if (!postId) {
        throw new Error('Post ID is undefined for update operation');
      }
      const postRef = ref(database, `posts/${postId}`);
      await update(postRef, postData);
      await logActivity(user.id, 'Updated a post', postId, organization);
      await logSubmission('posts', postData, postId, organization);
      console.log(`[${new Date().toISOString()}] Post ${postId} updated in posts with data:`, postData);
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
      await logSubmission('posts', postData, submissionId, organization);
      console.log(`[${new Date().toISOString()}] Post ${submissionId} created in posts with data:`, postData);
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
      console.log(`[${new Date().toISOString()}] Post type change disabled for shared posts`);
      ToastAndroid.show('Post type cannot be changed for shared posts.', ToastAndroid.SHORT);
      return;
    }
    console.log(`[${new Date().toISOString()}] Changing post type to:`, newPostType);
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
        style={{ flex: 1, marginTop: 70 }}
        keyboardVerticalOffset={Platform.OS === 'ios' ? -50 : -30}
      >
        <ScrollView
          contentContainerStyle={[styles.scrollViewContent, { paddingBottom: insets.bottom + 30 }]}
        >
          <View style={[styles.formContainer, { marginBottom: 50 }]}>
            {isShared ? (
              <>
                <Text style={styles.sharedInfo}>
                  Sharing post from {initialData?.originalUserName || 'Anonymous'} ({initialData?.originalOrganization || 'No organization'})
                </Text>
                <TextInput
                  style={[styles.textArea, { height: Math.max(40, inputHeight), marginLeft: 10, color: Theme.colors.black }]}
                  value={shareCaption}
                  onChangeText={setShareCaption}
                  placeholder="Add a caption for your shared post"
                  placeholderTextColor={Theme.colors.placeholder}
                  multiline
                  maxLength={500}
                  onContentSizeChange={(event) =>
                    setInputHeight(event.nativeEvent.contentSize.height)
                  }
                />
                <View style={[styles.sharedPostContainer, { backgroundColor: Theme.colors.lightGrey, padding: 10, borderRadius: 8 }]}>
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
                    <View style={styles.mediaPreview}>
                      <VideoView
                        player={player}
                        style={styles.videoPreview}
                        contentFit="contain"
                        nativeControls
                        posterSource={initialData.originalThumbnailUrl ? { uri: initialData.originalThumbnailUrl } : undefined}
                        onError={(error) => {
                          console.error(`[${new Date().toISOString()}] Video playback error for shared post:`, error);
                          ToastAndroid.show('Failed to play video.', ToastAndroid.SHORT);
                        }}
                        onLoad={() => console.log(`[${new Date().toISOString()}] Video preview loaded for shared post:`, initialData.originalMediaUrl)}
                      />
                    </View>
                  )}
                  {initialData?.originalMediaType === 'link' && initialData?.originalMediaUrl && (
                    <Text style={[styles.readOnlyText, { color: Theme.colors.accentBlue, textDecorationLine: 'underline' }]}>{initialData.originalMediaUrl}</Text>
                  )}
                </View>
              </>
            ) : (
              <>
                <View style={styles.categoryPicker}>
                  <Picker
                    selectedValue={category}
                    onValueChange={(itemValue) => setCategory(itemValue)}
                    style={styles.picker}
                  >
                    {categories.map((cat) => (
                      <Picker.Item
                        key={cat.value}
                        label={cat.label}
                        value={cat.value}
                        style={styles.pickerItems}
                        enabled={!cat.disabled}
                      />
                    ))}
                  </Picker>
                </View>
                <TextInput
                  style={[styles.input, { fontSize: 20, fontFamily: 'Poppins_SemiBold', color: Theme.colors.black }]}
                  value={title}
                  onChangeText={setTitle}
                  placeholder="Title"
                  placeholderTextColor={Theme.colors.placeholder}
                />
                <TextInput
                  style={[styles.input, styles.textArea, { color: Theme.colors.black }]}
                  value={content}
                  onChangeText={setContent}
                  placeholder="What's on your mind?"
                  placeholderTextColor={Theme.colors.placeholder}
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
                          onLoad={() => console.log(`[${new Date().toISOString()}] Video preview loaded for:`, media[0].uri)}
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
                      placeholderTextColor={Theme.colors.placeholder}
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