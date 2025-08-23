import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, Platform, KeyboardAvoidingView, ScrollView, Image, StatusBar, SafeAreaView, ToastAndroid } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import * as ImageManipulator from 'expo-image-manipulator';
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import { ref, push, set, update, onValue, serverTimestamp } from 'firebase/database';
import { auth, database, storage } from '../configuration/firebaseConfig';
import { useNavigation, useRoute } from '@react-navigation/native';
import { VideoView, useVideoPlayer } from 'expo-video';
import * as VideoThumbnails from 'expo-video-thumbnails';
import GlobalStyles from '../styles/GlobalStyles';
import Theme from '../constants/theme';
import { LinearGradient } from 'expo-linear-gradient';
import styles from '../styles/CreatePostStyles';
import { logActivity } from '../components/logActivity';
import { logSubmission } from '../components/logSubmission';
import { Ionicons } from '@expo/vector-icons';

const CreatePost = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { postType: initialPostType, postId, initialData } = route.params || {};
  const [title, setTitle] = useState(initialData?.title || '');
  const [content, setContent] = useState(initialData?.content || '');
  const [category, setCategory] = useState(initialData?.category || ''); // Changed default to empty string for "Select Category"
  const [media, setMedia] = useState([]);
  const [link, setLink] = useState(initialData?.mediaUrl || '');
  const [postType, setPostType] = useState(initialPostType || 'text');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const videoRef = useRef(null);
  const player = useVideoPlayer(media.length > 0 && postType === 'video' ? { uri: media[0].uri } : null, player => {
    videoRef.current = player;
  });

  const categories = [
    { label: 'Select Category', value: '', disabled: true }, // Added default disabled option
    { label: 'Discussion', value: 'discussion' },
    { label: 'Resource', value: 'resource' },
    { label: 'Events', value: 'events' },
    { label: 'Announcement', value: 'announcement' },
  ];

  useEffect(() => {
    if (postType === 'video' || postType === 'image') {
      pickMedia();
    }

    return () => {
      if (videoRef.current && postType === 'video' && media.length > 0) {
        videoRef.current.pause();
        videoRef.current.seekTo(0);
      }
    };
  }, [postType]);

  const requestPermissions = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Please grant permission to access your media library.');
        return false;
      }
      return true;
    } catch (error) {
      console.error('Error requesting permissions:', error);
      Alert.alert('Error', 'Failed to request media library permissions. Please check your app settings.');
      return false;
    }
  };

  const pickMedia = async () => {
    try {
      if (postType === 'image') {
        if (!ImagePicker.MediaTypeOptions?.Images) {
          console.error('ImagePicker.MediaTypeOptions.Images is undefined. Ensure expo-image-picker is installed correctly.');
          Alert.alert(
            'Error',
            'Image picker module is not properly initialized. Please try reinstalling expo-image-picker or check your project configuration (run `npx expo install expo-image-picker` and `npx expo prebuild --clean`).'
          );
          return;
        }

        const hasPermission = await requestPermissions();
        if (!hasPermission) return;

        const result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: false,
          allowsMultipleSelection: false,
          quality: 0.8,
          exif: false,
        });

        if (!result.canceled && result.assets && result.assets.length > 0) {
          const newMedia = [...media];
          for (const asset of result.assets) {
            let { uri, fileName: name = 'image.jpg', mimeType = 'image/jpeg', fileSize: size } = asset;

            const cacheUri = `${FileSystem.cacheDirectory}${Date.now()}_${name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
            await FileSystem.copyAsync({ from: uri, to: cacheUri });
            uri = cacheUri;

            const fileInfo = await FileSystem.getInfoAsync(uri);
            if (!fileInfo.exists || !fileInfo.size) {
              console.error(`File does not exist or is empty at URI: ${uri}`);
              Alert.alert('Error', `Selected image "${name}" is inaccessible or empty.`);
              continue;
            }

            if (size > 20 * 1024 * 1024) {
              console.error(`File size exceeds 20MB: ${size} bytes for ${name}`);
              Alert.alert('Error', `Image "${name}" exceeds 20MB limit.`);
              continue;
            }

            try {
              const manipResult = await ImageManipulator.manipulateAsync(
                uri,
                [],
                { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG, base64: true }
              );
              const tempUri = `${FileSystem.cacheDirectory}${Date.now()}_${name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
              await FileSystem.writeAsStringAsync(tempUri, manipResult.base64, {
                encoding: FileSystem.EncodingType.Base64,
              });
              newMedia.push({
                uri: tempUri,
                name,
                mimeType: 'image/jpeg',
              });
            } catch (error) {
              console.error(`Error compressing image ${name}:`, error);
              Alert.alert('Error', `Failed to compress image "${name}": ${error.message}`);
              continue;
            }
          }
          setMedia(newMedia);
          if (newMedia.length < 10) {
            Alert.alert('Add More?', 'Would you like to add another image?', [
              { text: 'No', style: 'cancel' },
              { text: 'Yes', onPress: pickMedia },
            ]);
          }
        }
      } else if (postType === 'video') {
        const result = await DocumentPicker.getDocumentAsync({
          type: ['video/mp4', 'video/webm'],
          copyToCacheDirectory: true,
          multiple: false,
        });

        if (!result.canceled && result.assets && result.assets.length > 0) {
          const newMedia = [];
          for (const asset of result.assets) {
            let { uri, name, mimeType, size } = asset;

            const cacheUri = `${FileSystem.cacheDirectory}${Date.now()}_${name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
            await FileSystem.copyAsync({ from: uri, to: cacheUri });
            uri = cacheUri;

            const fileInfo = await FileSystem.getInfoAsync(uri);
            if (!fileInfo.exists || !fileInfo.size) {
              console.error(`File does not exist or is empty at URI: ${uri}`);
              Alert.alert('Error', `Selected video "${name}" is inaccessible or empty.`);
              continue;
            }

            if (size > 20 * 1024 * 1024) {
              console.error(`File size exceeds 20MB: ${size} bytes for ${name}`);
              Alert.alert('Error', `Video "${name}" exceeds 20MB limit.`);
              continue;
            }

            newMedia.push({ uri, name, mimeType });
            try {
              const { uri: thumbnailUri } = await VideoThumbnails.getThumbnailAsync(uri, { time: 1000 });
              const thumbnailInfo = await FileSystem.getInfoAsync(thumbnailUri);
              if (!thumbnailInfo.exists || !thumbnailInfo.size) {
                console.error(`Thumbnail does not exist or is empty at URI: ${thumbnailUri}`);
                Alert.alert('Error', `Generated thumbnail for "${name}" is inaccessible or empty.`);
                continue;
              }
              newMedia[newMedia.length - 1].thumbnailUri = thumbnailUri;
            } catch (error) {
              console.error(`Error generating thumbnail for ${name}:`, error);
              Alert.alert('Error', `Failed to generate thumbnail for "${name}": ${error.message}`);
            }
          }
          setMedia(newMedia);
        }
      }
    } catch (error) {
      console.error(`Error picking media:`, error);
      Alert.alert(
        'Error',
        `Failed to pick media: ${error.message}. Please try reinstalling expo-image-picker (run \`npx expo install expo-image-picker\`) and rebuilding the project (\`npx expo prebuild --clean\`).`
      );
    }
  };

  const cropImage = async (index) => {
    try {
      const image = media[index];
      let uri = image.uri;

      if (!ImagePicker.MediaTypeOptions?.Images) {
        console.error('ImagePicker.MediaTypeOptions.Images is undefined. Ensure expo-image-picker is installed correctly.');
        Alert.alert(
          'Error',
          'Image picker module is not properly initialized. Please try reinstalling expo-image-picker or check your project configuration (run `npx expo install expo-image-picker` and `npx expo prebuild --clean`).'
        );
        return;
      }

      const hasPermission = await requestPermissions();
      if (!hasPermission) return;

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        allowsMultipleSelection: false,
        quality: 0.8,
        exif: false,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        uri = result.assets[0].uri;

        const cacheUri = `${FileSystem.cacheDirectory}${Date.now()}_${image.name}`;
        await FileSystem.copyAsync({ from: uri, to: cacheUri });
        uri = cacheUri;

        const fileInfo = await FileSystem.getInfoAsync(uri);
        if (!fileInfo.exists || !fileInfo.size) {
          console.error(`File does not exist or is empty at URI: ${uri}`);
          Alert.alert('Error', `Cropped image "${image.name}" is inaccessible or empty.`);
          return;
        }

        const manipResult = await ImageManipulator.manipulateAsync(
          uri,
          [],
          { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG, base64: true }
        );

        const tempUri = `${FileSystem.cacheDirectory}${Date.now()}_${image.name}`;
        await FileSystem.writeAsStringAsync(tempUri, manipResult.base64, {
          encoding: FileSystem.EncodingType.Base64,
        });

        const newMedia = [...media];
        newMedia[index] = {
          uri: tempUri,
          name: image.name,
          mimeType: 'image/jpeg',
        };
        setMedia(newMedia);
      }
    } catch (error) {
      console.error(`Error cropping image at index ${index}:`, error);
      Alert.alert(
        'Error',
        `Failed to crop image: ${error.message}. Please try reinstalling expo-image-picker (run \`npx expo install expo-image-picker\`) and rebuilding the project (\`npx expo prebuild --clean\`).`
      );
    }
  };

  const removeMedia = (index) => {
    setMedia(media.filter((_, i) => i !== index));
  };

  const uploadMedia = async (file, path, retries = 3) => {
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        let uri = file.uri;

        if (file.uri.startsWith('data:image/')) {
          const base64String = file.uri.split(',')[1];
          uri = `${FileSystem.cacheDirectory}${Date.now()}_${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
          await FileSystem.writeAsStringAsync(uri, base64String, {
            encoding: FileSystem.EncodingType.Base64,
          });
        }

        const fileInfo = await FileSystem.getInfoAsync(uri);
        if (!fileInfo.exists || !fileInfo.size) {
          throw new Error(`File does not exist or is empty at URI: ${uri}`);
        }

        if (!storage) {
          throw new Error('Firebase Storage is not initialized.');
        }

        const response = await fetch(uri);
        const blob = await response.blob();

        if (!blob.size) {
          throw new Error('Blob is empty');
        }

        const storageReference = storageRef(storage, path);
        const metadata = {
          contentType: file.mimeType || (path.endsWith('.jpg') ? 'image/jpeg' : 'video/mp4'),
        };
        const uploadResult = await uploadBytes(storageReference, blob, metadata);
        return await getDownloadURL(storageReference);
      } catch (error) {
        console.error(`Error uploading media to ${path} (attempt ${attempt}):`, error);
        if (attempt === retries) {
          throw new Error(`Upload failed after ${retries} attempts: ${error.code || 'unknown'} - ${error.message}`);
        }
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
  };

  const handleSubmit = async () => {
    // Validation: All fields are blank
    if (!title.trim() && !content.trim() && !category && media.length === 0 && !link.trim()) {
      ToastAndroid.show('Please fill required fields.', ToastAndroid.SHORT);
      return;
    }

    // Validation: Title and content filled, but no category
    if (title.trim() && content.trim() && !category) {
      ToastAndroid.show('Please select a category.', ToastAndroid.SHORT);
      return;
    }

    // Validation: Title and category filled, but no content
    if (title.trim() && category && !content.trim()) {
      ToastAndroid.show('Please add a content or media to post.', ToastAndroid.SHORT);
      return;
    }

    // Validation: Title, category, and content filled, but no media for image/video post
    if ((postType === 'image' || postType === 'video') && title.trim() && category && content.trim() && media.length === 0) {
      ToastAndroid.show('Please add a content or media to post.', ToastAndroid.SHORT);
      return;
    }

    // Validation: Link post with invalid or empty link
    if (postType === 'link' && (!link.trim() || !/^https?:\/\//.test(link))) {
      ToastAndroid.show('Please provide a valid URL starting with http:// or https://.', ToastAndroid.SHORT);
      return;
    }

    if (!auth || !auth.currentUser) {
      console.error(`No authenticated user or auth not initialized`);
      Alert.alert('Error', 'Authentication not initialized or user not logged in. Please sign out and sign in again.');
      return;
    }

    setIsSubmitting(true);

    try {
      const userRef = ref(database, `users/${auth.currentUser.uid}`);
      const userSnapshot = await new Promise((resolve, reject) => {
        onValue(userRef, resolve, reject, { onlyOnce: true });
      });
      const userData = userSnapshot.val() || {};
      const userName = userData.contactPerson || userData.displayName || 'Anonymous';
      const organization = userData.organization || '';

      const postData = {
        title: title.trim(),
        content: content.trim(),
        category,
        userName,
        organization,
        timestamp: serverTimestamp(),
        userId: auth.currentUser.uid,
        mediaType: postType,
      };

      if (postType === 'image' && media.length > 0) {
        postData.mediaUrls = [];
        for (let i = 0; i < media.length; i++) {
          const imagePath = `image_posts/${auth.currentUser.uid}/${Date.now()}_${media[i].name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
          const downloadURL = await uploadMedia(media[i], imagePath);
          postData.mediaUrls.push(downloadURL);
        }
      }

      if (postType === 'video' && media.length > 0) {
        const mediaPath = `video_posts/${auth.currentUser.uid}/${Date.now()}_${media[0].name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
        postData.mediaUrl = await uploadMedia(media[0], mediaPath);
        if (media[0].thumbnailUri) {
          const thumbnailPath = `video_posts/${auth.currentUser.uid}/thumbnails/${Date.now()}_thumbnail.jpg`;
          postData.thumbnailUrl = await uploadMedia({ uri: media[0].thumbnailUri, name: 'thumbnail.jpg', mimeType: 'image/jpeg' }, thumbnailPath);
        }
      }

      if (postType === 'link') {
        postData.mediaUrl = link.trim();
      }

      if (postId) {
        const postRef = ref(database, `posts/${postId}`);
        await update(postRef, postData);
        await logActivity('Updated a post', postId);
        await logSubmission('posts', postData, postId);
        Alert.alert('Success', 'Post updated successfully.');
      } else {
        const postsRef = ref(database, 'posts');
        const newPostRef = push(postsRef);
        const submissionId = newPostRef.key;
        await set(newPostRef, postData);
        await logActivity(`Created a new post in ${category}`, submissionId);
        await logSubmission('posts', postData, submissionId);
        // Validation: All fields filled
        Alert.alert('Success', 'Post created successfully.');
      }

      navigation.goBack();
    } catch (error) {
      console.error(`Error creating/updating post:`, error);
      Alert.alert('Error', `Failed to create/update post: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePostTypeChange = (newPostType) => {
    setPostType(newPostType);
    setMedia([]);
    setLink('');
    if (newPostType === 'video' || newPostType === 'image') {
      pickMedia();
    }
  };

  if (!VideoView || !useVideoPlayer) {
    console.error(`VideoView or useVideoPlayer from expo-video is undefined. Ensure expo-video is installed correctly.`);
    return (
      <SafeAreaView style={GlobalStyles.container}>
        <Text>Error: Video component failed to load. Please check expo-video installation (run `npx expo install expo-video`).</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={GlobalStyles.container}>
      <LinearGradient
        colors={['rgba(20, 174, 187, 0.4)', '#FFF9F0']}
        start={{ x: 1, y: 0.5 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradientContainer}
      >
        <View style={styles.headerContainer}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={GlobalStyles.headerMenuIcon}>
            <Ionicons name="arrow-back" size={32} color={Theme.colors.primary} />
          </TouchableOpacity>
          <Text style={[GlobalStyles.headerTitle, { color: Theme.colors.primary }]}>
            {postId ? 'Edit Post' : 'Create Post'}
          </Text>
          <TouchableOpacity
            style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={isSubmitting}
          >
            <Text style={styles.submitButtonText}>
              {isSubmitting ? 'Submitting...' : postId ? 'Update' : 'Post'}
            </Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
        keyboardVerticalOffset={0}
      >
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          <View style={styles.formContainer}>
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
                    enabled={!cat.disabled} // Disable the "Select Category" option
                  />
                ))}
              </Picker>
            </View>
            <TextInput
              style={[styles.input, { fontSize: 20, fontFamily: 'Poppins_SemiBold' }]}
              value={title}
              onChangeText={setTitle}
              placeholder="Title"
              placeholderTextColor={Theme.colors.placeholder}
            />
            <TextInput
              style={[styles.input, styles.textArea]}
              value={content}
              onChangeText={setContent}
              placeholder="What's on your mind?"
              placeholderTextColor={Theme.colors.placeholder}
              multiline
              numberOfLines={4}
            />

            {(postType === 'image' || postType === 'video') && (
              <View style={styles.mediaContainer}>
                <Text style={styles.label}>{postType === 'video' ? 'Video' : 'Image(s)'}</Text>
                <TouchableOpacity style={[GlobalStyles.imageUpload, {marginHorizontal: 20}]} onPress={pickMedia}>
                  <Text style={GlobalStyles.imageUploadText}>
                    {media.length > 0 ? 'Add More Media' : 'Select Media'}
                  </Text>
                </TouchableOpacity>
                {/* {media.length > 0 && (
                  <Text style={styles.mediaInfo}>
                    Selected: {media.map(m => m.name).join(', ')}
                  </Text>
                )} */}
                {media.length > 0 && postType === 'video' && (
                  <VideoView
                    player={player}
                    style={styles.videoPreview}
                    contentFit="contain"
                    nativeControls
                    onError={(error) => {
                      console.error(`Video playback error:`, error);
                      Alert.alert('Error', 'Failed to play video. Ensure the video format is supported (e.g., MP4).');
                    }}
                  />
                )}
                {media.length > 0 && postType === 'image' && (
                  <View style={styles.mediaPreviewContainer}>
                    {media.map((item, index) => (
                      <View key={index} style={styles.mediaPreview}>
                        <Image
                          source={{ uri: item.uri }}
                          style={styles.thumbnailPreview}
                          resizeMode="contain"
                          onError={(error) => console.error(`Image preview error for ${item.name}:`, error.nativeEvent)}
                        />
                        {/* <TouchableOpacity
                          style={styles.cropButton}
                          onPress={() => cropImage(index)}
                        >
                          <Ionicons name="crop-outline" size={20} color={Theme.colors.white} />
                        </TouchableOpacity> */}
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
                <Text style={styles.label}>Link URL</Text>
                <TextInput
                  style={styles.inputLink}
                  value={link}
                  onChangeText={setLink}
                  placeholder="Enter URL (e.g., https://example.com)"
                  placeholderTextColor={Theme.colors.placeholder}
                  keyboardType="url"
                />
              </View>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <View style={styles.navbar}>
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
            ]}
            onPress={() => handlePostTypeChange(item.type)}
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