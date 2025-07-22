import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Image, Slider, Alert, SafeAreaView } from 'react-native';
import * as ImageManipulator from 'expo-image-manipulator';
import { useNavigation, useRoute } from '@react-navigation/native';
import GlobalStyles from '../styles/GlobalStyles';
import Theme from '../constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import styles from '../styles/ImageEditorStyles';

const ImageEditor = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { assets, onEditComplete } = route.params || {};
  const [currentIndex, setCurrentIndex] = useState(0);
  const [cropParams, setCropParams] = useState([]);
  const [imageDimensions, setImageDimensions] = useState([]);
  const [editedImages, setEditedImages] = useState([]);

  useEffect(() => {
    const loadImages = async () => {
      try {
        const dimensions = await Promise.all(
          assets.map(async (asset) => {
            const { width, height } = await new Promise((resolve, reject) => {
              Image.getSize(asset.uri, (width, height) => resolve({ width, height }), reject);
            });
            return { width, height };
          })
        );
        setImageDimensions(dimensions);
        setCropParams(
          dimensions.map(({ width, height }) => ({
            originX: 0,
            originY: 0,
            width: Math.min(width, height),
            height: Math.min(width, height),
          }))
        );
      } catch (error) {
        console.error(`Error loading image dimensions:`, error);
        Alert.alert('Error', 'Failed to load image dimensions.');
      }
    };
    loadImages();
  }, [assets]);

  const handleCrop = async () => {
    try {
      const currentAsset = assets[currentIndex];
      const params = cropParams[currentIndex];
      const manipResult = await ImageManipulator.manipulateAsync(
        currentAsset.uri,
        [{ crop: params }],
        { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG, base64: true }
      );
      const mimePrefix = 'data:image/jpeg;base64,';
      const editedImage = {
        uri: mimePrefix + manipResult.base64,
        name: currentAsset.name,
        mimeType: 'image/jpeg',
      };
      setEditedImages(prev => {
        const newEdited = [...prev];
        newEdited[currentIndex] = editedImage;
        return newEdited;
      });
      Alert.alert('Success', `Image ${currentAsset.name} cropped successfully.`);
      if (currentIndex < assets.length - 1) {
        setCurrentIndex(currentIndex + 1);
      } else {
        onEditComplete(editedImages.filter(img => img));
        navigation.goBack();
      }
    } catch (error) {
      console.error(`Error cropping image ${assets[currentIndex].name}:`, error);
      Alert.alert('Error', `Failed to crop image: ${error.message}`);
    }
  };

  const handleSkip = () => {
    if (currentIndex < assets.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      onEditComplete(editedImages.filter(img => img));
      navigation.goBack();
    }
  };

  if (!assets || assets.length === 0 || !imageDimensions[currentIndex]) {
    return (
      <SafeAreaView style={GlobalStyles.container}>
        <Text>Loading...</Text>
      </SafeAreaView>
    );
  }

  const currentAsset = assets[currentIndex];
  const { width, height } = imageDimensions[currentIndex];
  const params = cropParams[currentIndex] || { originX: 0, originY: 0, width: Math.min(width, height), height: Math.min(width, height) };

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
            Edit Image {currentIndex + 1}/{assets.length}
          </Text>
        </View>
      </LinearGradient>

      <View style={styles.editorContainer}>
        <Image
          source={{ uri: currentAsset.uri }}
          style={styles.imagePreview}
          resizeMode="contain"
        />
        <Text style={styles.label}>Crop Position and Size</Text>
        <Text style={styles.sliderLabel}>X Position: {Math.round(params.originX)}</Text>
        <Slider
          style={styles.slider}
          minimumValue={0}
          maximumValue={width - params.width}
          value={params.originX}
          onValueChange={(value) => setCropParams(prev => {
            const newParams = [...prev];
            newParams[currentIndex] = { ...newParams[currentIndex], originX: value };
            return newParams;
          })}
          minimumTrackTintColor={Theme.colors.primary}
        />
        <Text style={styles.sliderLabel}>Y Position: {Math.round(params.originY)}</Text>
        <Slider
          style={styles.slider}
          minimumValue={0}
          maximumValue={height - params.height}
          value={params.originY}
          onValueChange={(value) => setCropParams(prev => {
            const newParams = [...prev];
            newParams[currentIndex] = { ...newParams[currentIndex], originY: value };
            return newParams;
          })}
          minimumTrackTintColor={Theme.colors.primary}
        />
        <Text style={styles.sliderLabel}>Crop Size: {Math.round(params.width)}</Text>
        <Slider
          style={styles.slider}
          minimumValue={50}
          maximumValue={Math.min(width, height)}
          value={params.width}
          onValueChange={(value) => setCropParams(prev => {
            const newParams = [...prev];
            newParams[currentIndex] = {
              ...newParams[currentIndex],
              width: value,
              height: value, // Keep square
              originX: Math.min(newParams[currentIndex].originX, width - value),
              originY: Math.min(newParams[currentIndex].originY, height - value),
            };
            return newParams;
          })}
          minimumTrackTintColor={Theme.colors.primary}
        />
        <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.cropButton} onPress={handleCrop}>
            <Text style={styles.buttonText}>Crop Image</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
            <Text style={styles.buttonText}>Skip</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

export default ImageEditor;