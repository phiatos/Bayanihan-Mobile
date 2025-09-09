import { StyleSheet } from 'react-native';
import Theme from '../constants/theme';

const spacing = {
  xsmall: 5,
  small: 10,
  medium: 15,
  large: 20,
  xlarge: 30,
};

const borderRadius = {
  small: 4,
  medium: 8,
  large: 10,
  xlarge: 20,
};

const borderWidth = {
  thin: 1,
  medium: 2,
  thick: 3,
};

export default StyleSheet.create({

  input: {
    borderWidth: borderWidth.thin,
    borderColor: '#605D67',
    borderRadius: borderRadius.large,
    padding: spacing.small,
    marginBottom: spacing.small,
    fontFamily: 'Poppins_Regular',
    fontSize: 14,
    color: Theme.colors.black,
  },

  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  
  requiredInput: {
    borderColor: '#D32F2F',
    fontWeight: '400',
  },

  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#AAA',
    borderRadius: 10,
    backgroundColor: '#fff',
    marginBottom: 10,
  },
  addButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: 10,
  },
  addButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: '#00BCD4',
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    marginBottom: 10,
  },
  addbuttonText: {
    color: 'white',
    textAlign: 'center',
    fontSize: 13,
    paddingHorizontal: 10,
    fontFamily: 'Poppins_SemiBold',
  },
  addedItems: {
    fontFamily: 'Poppins_Medium',
    fontSize: 18,
    color: '#14AEBB',
  },
  icon: {
    padding: 10,
  },
  dropdownContainer: {
    position: 'absolute',
    top: 50,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    maxHeight: 150,
    zIndex: 1000,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  dropdownItem: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  dropdownItemText: {
    fontSize: 16,
    color: '#333',
  },
  mediaPreviewContainer: {
    marginTop: 10,
    alignItems: 'center',
  },
  mediaPreview: {
    position: 'relative',
    marginBottom: 10,
  },
  thumbnailPreview: {
    width: 200, 
    height: 200, 
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
  },
  cropButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: Theme.colors.primary,
    padding: 5,
    borderRadius: 5,
  },
  removeButton: {
    position: 'absolute',
    top: 10,
    right: 50,
    backgroundColor: '#FF0000', // Ensure Theme.colors.error is defined, e.g., '#FF0000'
    padding: 5,
    borderRadius: 5,
  },

  // Summary
  fieldContainer: {
    marginBottom: 10,
  },
  label: {
    fontSize: 14,
    color: Theme.colors.primary,
    textTransform: 'capitalize',
    fontFamily: 'Poppins_SemiBold',
  },
  value: {
    fontSize: 14,
    color: '#000000',
    marginTop: 2,
    fontFamily: 'Poppins_Regular',
  },
  modalContent: {
    alignItems: 'center',
    width: '100%',
    justifyContent: 'center',
  },
  modalIcon: {
    marginBottom: 15,
  },
  modalMessage: {
    fontSize: 14,
    color: '#444',
    lineHeight: 24,
    fontFamily: 'Poppins_Regular',
    textAlign: 'center',
  },
});