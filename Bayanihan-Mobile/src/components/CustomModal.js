import React from 'react';
import { View, Text, TouchableOpacity, Modal, StyleSheet, Animated, Dimensions, StatusBar } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Theme from '../constants/theme';

const { width, height } = Dimensions.get('window'); // Keep using window for consistent layout inside

const CustomModal = ({ visible, title, message, onConfirm, onCancel, confirmText = 'OK', cancelText = 'Cancel', showCancel = true }) => {
  const [fadeAnim] = React.useState(new Animated.Value(0));
  const [slideAnim] = React.useState(new Animated.Value(height));

  React.useEffect(() => {
    if (visible) {
      StatusBar.setHidden(true, 'fade'); // Hide status bar when modal is visible
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(slideAnim, {
          toValue: 0,
          tension: 80,
          friction: 12,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      StatusBar.setHidden(false, 'fade'); // Show status bar when modal is hidden
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: height,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    }
    return () => {
      // Ensure status bar is shown if component unmounts while modal is visible
      StatusBar.setHidden(false, 'none');
    };
  }, [visible]);

  return (
    <Modal
      transparent={true}
      visible={visible}
      onRequestClose={onCancel}
      animationType="none"
      statusBarTranslucent={true} // Required to draw under status bar
      // Added for Android to appear fullscreen over status bar
      // This works on Android; iOS handles it differently, often requiring StatusBar.setHidden
      hardwareAccelerated // Might help with rendering performance, especially for animations
    >
      <Animated.View
        style={[
          styles.overlay,
          {
            opacity: fadeAnim,
            // To ensure it covers the status bar area even if StatusBar.setHidden isn't perfect
            // This is often not needed if StatusBar.setHidden works, but can be a fallback.
            // However, rely on the Modal's inherent behavior and StatusBar.setHidden first.
          },
        ]}
      >
        <Animated.View
          style={[
            styles.modal,
            {
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <View style={styles.header}>
            <Text style={styles.title}>{title}</Text>
          </View>
          <View style={styles.body}>
            {message}
          </View>
          <View style={styles.footer}>
            {showCancel && (
              <TouchableOpacity style={styles.cancelButton} onPress={onCancel}>
                <Text style={styles.cancelButtonText}>{cancelText}</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity style={styles.confirmButton} onPress={onConfirm}>
              <Text style={styles.confirmButtonText}>{confirmText}</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject, // covers the entire screen
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999, // Optional but helps ensure it's above other content

  },
  modal: {
    backgroundColor: Theme.colors.white,
    borderRadius: 12,
    width: width * 0.85,
    maxWidth: 400,
    padding: 20,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  title: {
    fontSize: 20,
    color: Theme.colors.primary,
    fontFamily: 'Poppins_Bold',
    textAlign: 'center',
    flex: 1,
  },
  closeButton: {
    position: 'absolute',
    right: 0,
  },
  body: {
    marginBottom: 20,
    alignItems: 'center',
    fontSize: 14
  },
  message: {
    fontSize: 14,
    color: '#444',
    lineHeight: 24,
    fontFamily: 'Poppins_Regular',
    textAlign: 'center',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#FF4D4D',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 20,
    marginRight: 10,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontFamily: 'Poppins_Regular',
  },
  confirmButton: {
    flex: 1,
    backgroundColor: Theme.colors.primary,
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  confirmButtonText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontFamily: 'Poppins_Regular',
    textAlign: 'center',
  },
});

export default CustomModal;