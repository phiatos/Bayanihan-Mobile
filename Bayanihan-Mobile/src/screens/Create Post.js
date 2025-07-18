import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, Platform, KeyboardAvoidingView, ScrollView, Image, StatusBar, SafeAreaView } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import { ref as dbRef, push, set, update, onValue } from 'firebase/database';
import { auth, database, storage } from '../configuration/firebaseConfig';
import { useNavigation, useRoute } from '@react-navigation/native';
import * as VideoThumbnails from 'expo-video-thumbnails';
import GlobalStyles from '../styles/GlobalStyles';
import Theme from '../constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import styles from '../styles/CreatePostStyles';

const CreatePost = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { postType, postId, initialData } = route.params || {};
  const [title, setTitle] = useState(initialData?.title || '');
  const [content, setContent] = useState(initialData?.content || '');
  const [category, setCategory] = useState(initialData?.category || 'discussion');
  const [media, setMedia] = useState(null);
  const [thumbnail, setThumbnail] = useState(initialData?.thumbnailUrl || null);
  const [link, setLink] = useState(initialData?.mediaUrl || '');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const categories = [
    { label: 'Discussion', value: 'discussion' },
    { label: 'Resource', value: 'resource' },
    { label: 'Events', value: 'events' },
    { label: 'Announcement', value: 'announcement' },
  ];

  useEffect(() => {
    if (postType === 'video' || postType === 'image') {
      pickMedia();
    }
  }, [postType]);

  const pickMedia = async () => {
    try {
      console.log(`[${new Date().toISOString()}] Initiating media picker for ${postType}`);
      const result = await DocumentPicker.getDocumentAsync({
        type: postType === 'video' ? ['video/mp4', 'video/webm'] : ['image/jpeg', 'image/png'],
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        let { uri, name, mimeType, size } = result.assets[0];
        console.log(`[${new Date().toISOString()}] Selected media: ${name}, size: ${size} bytes, uri: ${uri}, mimeType: ${mimeType}`);

        // Copy file to cache directory
        const cacheUri = `${FileSystem.cacheDirectory}${Date.now()}_${name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
        await FileSystem.copyAsync({ from: uri, to: cacheUri });
        uri = cacheUri;

        // Verify file accessibility
        const fileInfo = await FileSystem.getInfoAsync(uri);
        if (!fileInfo.exists || !fileInfo.size) {
          console.error(`[${new Date().toISOString()}] File does not exist or is empty at URI: ${uri}`);
          Alert.alert('Error', 'Selected file is inaccessible or empty.');
          return;
        }

        if (size > 20 * 1024 * 1024) {
          console.error(`[${new Date().toISOString()}] File size exceeds 20MB: ${size} bytes`);
          Alert.alert('Error', 'File size exceeds 20MB limit.');
          return;
        }

        if (postType === 'image') {
          const base64 = await FileSystem.readAsStringAsync(uri, { encoding: FileSystem.EncodingType.Base64 });
          const mimePrefix = mimeType === 'image/jpeg' ? 'data:image/jpeg;base64,' : 'data:image/png;base64,';
          setMedia({ uri: mimePrefix + base64, name, mimeType });
          console.log(`[${new Date().toISOString()}] Image converted to base64`);
        } else {
          setMedia({ uri, name, mimeType });
          console.log(`[${new Date().toISOString()}] Video media set: ${name}`);
        }

        if (postType === 'video') {
          try {
            const { uri: thumbnailUri } = await VideoThumbnails.getThumbnailAsync(uri, { time: 1000 });
            console.log(`[${new Date().toISOString()}] Generated thumbnail: ${thumbnailUri}`);
            const thumbnailInfo = await FileSystem.getInfoAsync(thumbnailUri);
            if (!thumbnailInfo.exists || !thumbnailInfo.size) {
              console.error(`[${new Date().toISOString()}] Thumbnail does not exist or is empty at URI: ${thumbnailUri}`);
              Alert.alert('Error', 'Generated thumbnail is inaccessible or empty.');
              return;
            }
            setThumbnail(thumbnailUri);
          } catch (error) {
            console.error(`[${new Date().toISOString()}] Error generating thumbnail:`, error);
            Alert.alert('Error', `Failed to generate video thumbnail: ${error.message}`);
            return;
          }
        }
      } else {
        console.log(`[${new Date().toISOString()}] Media selection canceled`);
      }
    } catch (error) {
      console.error(`[${new Date().toISOString()}] Error picking media:`, error);
      Alert.alert('Error', `Failed to pick media: ${error.message}`);
    }
  };

  const uploadMedia = async (file, path, retries = 3) => {
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        console.log(`[${new Date().toISOString()}] Uploading media to ${path}, uri: ${file.uri}, mimeType: ${file.mimeType}, attempt: ${attempt}`);
        const fileInfo = await FileSystem.getInfoAsync(file.uri);
        if (!fileInfo.exists || !fileInfo.size) {
          throw new Error(`File does not exist or is empty at URI: ${file.uri}`);
        }

        const response = await fetch(file.uri);
        const blob = await response.blob();
        console.log(`[${new Date().toISOString()}] Blob created, size: ${blob.size} bytes`);

        if (!blob.size) {
          throw new Error('Blob is empty');
        }

        if (!storage) {
          throw new Error('Firebase Storage is not initialized.');
        }

        console.log(`[${new Date().toISOString()}] Storage bucket: ${storage.app.options.storageBucket}`);
        const storageReference = storageRef(storage, path);
        const metadata = {
          contentType: file.mimeType || (path.endsWith('.jpg') ? 'image/jpeg' : 'video/mp4'),
        };
        console.log(`[${new Date().toISOString()}] Uploading to ${path} with metadata:`, metadata);
        const uploadResult = await uploadBytes(storageReference, blob, metadata);
        console.log(`[${new Date().toISOString()}] Upload result:`, uploadResult.metadata);
        const downloadURL = await getDownloadURL(storageReference);
        console.log(`[${new Date().toISOString()}] Media uploaded: ${downloadURL}`);
        return downloadURL;
      } catch (error) {
        console.error(`[${new Date().toISOString()}] Error uploading media to ${path} (attempt ${attempt}):`, error);
        if (attempt === retries) {
          throw new Error(`Upload failed after ${retries} attempts: ${error.code || 'unknown'} - ${error.message}`);
        }
        console.log(`[${new Date().toISOString()}] Retrying upload (${attempt + 1}/${retries})`);
        await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1s before retry
      }
    }
  };

  const handleSubmit = async () => {
    if (!auth || !auth.currentUser) {
      console.error(`[${new Date().toISOString()}] No authenticated user or auth not initialized`);
      Alert.alert('Error', 'Authentication not initialized or user not logged in. Please sign out and sign in again.');
      return;
    }

    try {
      console.log(`[${new Date().toISOString()}] Auth token:`, await auth.currentUser.getIdToken());
    } catch (error) {
      console.error(`[${new Date().toISOString()}] Error fetching auth token:`, error);
      Alert.alert('Error', 'Authentication token error. Please sign out and sign in again.');
      return;
    }

    if (!title.trim() || !content.trim()) {
      console.error(`[${new Date().toISOString()}] Missing title or content`);
      Alert.alert('Error', 'Title and content are required.');
      return;
    }

    if ((postType === 'image' || postType === 'video') && !media) {
      console.error(`[${new Date().toISOString()}] No media selected for ${postType}`);
      Alert.alert('Error', `Please select a${postType === 'video' ? ' video' : 'n image'}.`);
      return;
    }

    if (postType === 'link' && (!link.trim() || !/^https?:\/\//.test(link))) {
      console.error(`[${new Date().toISOString()}] Invalid link: ${link}`);
      Alert.alert('Error', 'Please provide a valid URL starting with http:// or https://.');
      return;
    }

    setIsSubmitting(true);

    try {
      console.log(`[${new Date().toISOString()}] Fetching user data for UID: ${auth.currentUser.uid}`);
      const userRef = dbRef(database, `users/${auth.currentUser.uid}`);
      const userSnapshot = await new Promise((resolve, reject) => {
        onValue(userRef, resolve, reject, { onlyOnce: true });
      });
      const userData = userSnapshot.val() || {};
      const userName = userData.contactPerson || userData.displayName || 'Anonymous';
      const organization = userData.organization || '';
      console.log(`[${new Date().toISOString()}] User data: ${userName}, ${organization}`);

      const postData = {
        title: title.trim(),
        content: content.trim(),
        category,
        userName,
        organization,
        timestamp: Date.now(),
        userId: auth.currentUser.uid,
        mediaType: postType,
      };

      if (postType === 'image' && media) {
        postData.mediaUrl = media.uri; // Store base64 string for images
        console.log(`[${new Date().toISOString()}] Image post ready: ${media.name}`);
      }

      if (postType === 'video' && media) {
        if (!thumbnail) {
          console.error(`[${new Date().toISOString()}] No thumbnail for video`);
          throw new Error('Video thumbnail is required.');
        }
        const mediaPath = `video_posts/${auth.currentUser.uid}/${Date.now()}_${media.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
        const thumbnailPath = `video_posts/${auth.currentUser.uid}/thumbnails/${Date.now()}_thumbnail.jpg`;
        console.log(`[${new Date().toISOString()}] Uploading video to ${mediaPath}`);
        postData.mediaUrl = await uploadMedia(media, mediaPath);
        console.log(`[${new Date().toISOString()}] Uploading thumbnail to ${thumbnailPath}`);
        postData.thumbnailUrl = await uploadMedia({ uri: thumbnail, name: 'thumbnail.jpg', mimeType: 'image/jpeg' }, thumbnailPath);
      }

      if (postType === 'link') {
        postData.mediaUrl = link.trim();
        console.log(`[${new Date().toISOString()}] Link post ready: ${link}`);
      }

      if (postId) {
        const postRef = dbRef(database, `posts/${postId}`);
        await update(postRef, postData);
        console.log(`[${new Date().toISOString()}] Post updated: ${postId}`);
        Alert.alert('Success', 'Post updated successfully.');
      } else {
        const postsRef = dbRef(database, 'posts');
        const newPostRef = push(postsRef);
        await set(newPostRef, postData);
        console.log(`[${new Date().toISOString()}] Post created: ${newPostRef.key}`);
        Alert.alert('Success', 'Post created successfully.');
      }

      navigation.goBack();
    } catch (error) {
      console.error(`[${new Date().toISOString()}] Error creating/updating post:`, error);
      Alert.alert('Error', `Failed to create/update post: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const testUpload = async () => {
    if (!auth || !auth.currentUser) {
      console.error(`[${new Date().toISOString()}] No authenticated user or auth not initialized`);
      Alert.alert('Error', 'Authentication not initialized or user not logged in.');
      return;
    }

    try {
      console.log(`[${new Date().toISOString()}] Testing upload for UID: ${auth.currentUser.uid}`);
      const testUri = `${FileSystem.cacheDirectory}test.txt`;
      await FileSystem.writeAsStringAsync(testUri, 'Test file content');
      const response = await fetch(testUri);
      const blob = await response.blob();
      const storageReference = storageRef(storage, `test/${auth.currentUser.uid}/test_${Date.now()}.txt`);
      const metadata = { contentType: 'text/plain' };
      console.log(`[${new Date().toISOString()}] Uploading test file to ${storageReference.fullPath}`);
      const uploadResult = await uploadBytes(storageReference, blob, metadata);
      const downloadURL = await getDownloadURL(storageReference);
      console.log(`[${new Date().toISOString()}] Test upload successful: ${downloadURL}`);
      Alert.alert('Success', 'Test upload successful!');
    } catch (error) {
      console.error(`[${new Date().toISOString()}] Test upload failed:`, error);
      Alert.alert('Error', `Test upload failed: ${error.message}`);
    }
  };

  return (
    <SafeAreaView style={GlobalStyles.container}>
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
          <Text style={[GlobalStyles.headerTitle, { color: Theme.colors.primary }]}>
            {postId ? 'Edit Post' : 'Create Post'}
          </Text>
        </View>
      </LinearGradient>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : StatusBar.currentHeight}
      >
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          <View style={styles.formContainer}>
            <Text style={styles.label}>Title</Text>
            <TextInput
              style={styles.input}
              value={title}
              onChangeText={setTitle}
              placeholder="Enter post title"
              placeholderTextColor={Theme.colors.placeholder}
            />

            <Text style={styles.label}>Content</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={content}
              onChangeText={setContent}
              placeholder="Enter post content"
              placeholderTextColor={Theme.colors.placeholder}
              multiline
              numberOfLines={4}
            />

            <Text style={styles.label}>Category</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={category}
                onValueChange={(itemValue) => setCategory(itemValue)}
                style={styles.picker}
              >
                {categories.map((cat) => (
                  <Picker.Item key={cat.value} label={cat.label} value={cat.value} style={styles.pickerItems} />
                ))}
              </Picker>
            </View>

            {(postType === 'image' || postType === 'video') && (
              <View style={styles.mediaContainer}>
                <Text style={styles.label}>{postType === 'video' ? 'Video' : 'Image'}</Text>
                <TouchableOpacity style={styles.mediaButton} onPress={pickMedia}>
                  <Text style={styles.mediaButtonText}>
                    {media ? 'Change Media' : 'Select Media'}
                  </Text>
                </TouchableOpacity>
                {media && (
                  <Text style={styles.mediaInfo}>
                    Selected: {media.name}
                  </Text>
                )}
                {thumbnail && postType === 'video' && (
                  <Image
                    source={{ uri: thumbnail }}
                    style={styles.thumbnailPreview}
                    resizeMode="contain"
                  />
                )}
              </View>
            )}

            {postType === 'link' && (
              <View style={styles.mediaContainer}>
                <Text style={styles.label}>Link URL</Text>
                <TextInput
                  style={styles.input}
                  value={link}
                  onChangeText={setLink}
                  placeholder="Enter URL (e.g., https://example.com)"
                  placeholderTextColor={Theme.colors.placeholder}
                  keyboardType="url"
                />
              </View>
            )}

            <TouchableOpacity
              style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
              onPress={handleSubmit}
              disabled={isSubmitting}
            >
              <Text style={styles.submitButtonText}>
                {isSubmitting ? 'Submitting...' : postId ? 'Update Post' : 'Create Post'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.submitButton}
              onPress={testUpload}
            >
              <Text style={styles.submitButtonText}>Test Upload</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default CreatePost;