import React from 'react';
import { Modal, View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import GlobalStyles from '../styles/GlobalStyles';

const OperationCustomModal = ({ visible, title, message, onConfirm, onCancel, confirmText = 'OK', showCancel = false }) => {
  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={visible}
      onRequestClose={onCancel || onConfirm}
    >
      <View style={GlobalStyles.modalOverlay}>
        <View style={GlobalStyles.modalView}>
          <Text style={GlobalStyles.modalTitle}>{title}</Text>
          <View style={GlobalStyles.modalContent}>
            {typeof message === 'string' ? (
              <>
                <Ionicons
                  name={title.includes('Success') || title.includes('Saved') ? 'checkmark-circle' : 'warning'}
                  size={60}
                  color={title.includes('Success') || title.includes('Saved') ? '#00BCD4' : '#FF0000'}
                  style={GlobalStyles.modalIcon}
                />
                <Text style={GlobalStyles.modalMessage}>{message}</Text>
              </>
            ) : (
              message
            )}
          </View>
          <View style={GlobalStyles.modalButtonContainer}>
            {showCancel && (
              <TouchableOpacity
                style={[GlobalStyles.modalButton, { backgroundColor: '#FF4444' }]}
                onPress={onCancel}
              >
                <Text style={GlobalStyles.modalButtonText}>Cancel</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={[GlobalStyles.modalButton, { backgroundColor: '#00BCD4' }]}
              onPress={onConfirm}
            >
              <Text style={GlobalStyles.modalButtonText}>{confirmText}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default OperationCustomModal;