import { StyleSheet, Dimensions } from 'react-native';
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

const windowHeight = Dimensions.get('window').height;
const maxDropdownHeight = windowHeight * 0.3;

export default StyleSheet.create({
  requiredInput: {
    borderColor: '#D32F2F',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#AAA',
    borderRadius: 10,
    backgroundColor: '#fff',
  },
  pickerContainer: {
    borderWidth: borderWidth.thin, 
    borderColor: '#605D67', 
    borderRadius: borderRadius.large, 
    paddingHorizontal: 0, 
    paddingVertical:0, 
    height: 48, 
    justifyContent: 'center', 
    alignItems: 'center', 
    textAlign:'center',
  },
  pickerRequiredInput: {
    borderColor: '#D32F2F', 
  },
  addedItems: {
    fontFamily: 'Poppins_Medium',
    fontSize: 18,
    color: '#14AEBB',
    marginBottom: spacing.small,
  },
  summaryTable: {
    marginBottom: 20,
  },
  summaryTableRow: {
    flexDirection: 'row',
  },
  summaryTableHeader: {
    alignItems: 'left',
    paddingVertical: 10,
    backgroundColor: Theme.colors.primary,  
  },
  summaryTableHeaderCell: {
    paddingLeft: 10,
    color: Theme.colors.white,
    fontFamily: 'Poppins_SemiBold',
    fontSize: 12,
  },
  summaryTableCell: {
    paddingHorizontal: 10,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Theme.colors.primary,
    flexShrink: 1,
    flexWrap: 'wrap',
    maxWidth: 100, 
    textAlign: 'left',
    fontFamily: 'Poppins_Regular',
    paddingVertical: 5,
    fontSize: 12,
    
  },
  icon: {
    padding: 10,
  },

  // Map Modal
  mapModalHeader:{
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between', 
    padding: 10,
  },
  mapModalHeaderText:{
    fontSize: 18, 
    fontFamily: 'Poppins_SemiBold', 
    color: Theme.colors.accent 
  },
  overlayContainer: {
      position: 'absolute',
      top: 10,
      left: 0,
      right: 0,
      zIndex: 900,
    },
    searchWrapper: {
      paddingHorizontal: 20,
      marginTop: 10,
    },
    searchContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      borderColor: Theme.colors.primary,
      elevation: 10,
      backgroundColor: Theme.colors.lightBg,
      borderWidth: 1,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
    },
    searchIcon: {
      paddingVertical: 10,
      marginLeft: 2, 
    },
    suggestionsContainer: {
      position: 'absolute',
      left: 0,
      right: 0,
      backgroundColor: Theme.colors.white,
      borderRadius: 10,
      marginTop: 50,
      elevation: 5,
      maxHeight: 200,
      zIndex: 1000,
      marginHorizontal: 10,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      overflow: 'hidden',
    },
    suggestionItem: {
      padding: 10,
      borderBottomWidth: 1,
      borderBottomColor: Theme.colors.lightBlack,
    },
    suggestionText: {
      fontSize: 14,
      color: Theme.colors.black,
      fontFamily: 'Poppins_Regular',
    },
    returnButton: {
      position: 'absolute',
      bottom: 0,
      right: 20,
      backgroundColor: Theme.colors.primary,
      padding: 10,
      borderRadius: 25,
      elevation: 10,
      zIndex: 1000,
      borderWidth: 1,
      borderColor: Theme.colors.primary,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
    },
      mapTypeButtonsContainer: {
      position: 'absolute',
      left: 10,
      top: 60,
      flexDirection: 'column',
      gap: 8,
      padding: 10,
    },
    mapTypeButton: {
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: '100%',
    paddingHorizontal: 10,
    paddingVertical: 9,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  mapTypeButtonActive: {
    backgroundColor: Theme.colors.lightBg,
    borderColor: Theme.colors.primary,
  },
  mapTypeButtonText: {
    fontSize: 14,
    color: Theme.colors.white,
    marginLeft: 6,
    fontFamily: 'Poppins_Regular',
  },
  mapTypeButtonTextActive: {
    color: Theme.colors.primary,
    fontFamily: 'Poppins_Regular',
  },
  modalButtonContainer: {
    position: 'absolute',
    bottom: 10,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 10,
  },

  modalButton: {
    backgroundColor: '#00BCD4',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 15,
    marginRight: 10,
    alignItems:'center'
  },
  modalButtonCancel:{
    backgroundColor: Theme.colors.lightBg,
    borderColor: Theme.colors.primary,
    borderWidth: 1,
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 15,
  },
  modalButtonText: {
    color: 'white',
    fontSize: 14,
    fontFamily:'Poppins_Medium'
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    color: 'red',
    textAlign: 'center',
    marginBottom: 20,
  },
  permissionModalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.7)',
  },
  permissionModalContainer: {
    backgroundColor: 'white',
    padding: 25,
    borderRadius: 15,
    alignItems: 'center',
    width: '80%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },


  dropdownContainer: {
    position: 'absolute',
    top: 40,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderWidth: borderWidth.thin,
    borderColor: '#ccc',
    maxHeight: maxDropdownHeight,
    zIndex: 1000,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  dropdownItem: {
    padding: spacing.small,
    borderBottomWidth: borderWidth.thin,
    borderBottomColor: '#eee',
  },
  dropdownItemText: {
    fontSize: 16,
    color: '#333',
    fontFamily: 'Poppins_Regular',
  },
  secondaryDropdownContainer:{
    width: '100%',
    height: 50,
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ccc',
    paddingHorizontal: 10,
    justifyContent: 'center',
  },
   modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 20,
    width: '80%',
    maxWidth: 400,
    alignItems: 'center',
  },
  modalTitle: {
    fontFamily: 'Poppins_SemiBold',
    fontSize: 20,
    color: '#333',
    marginBottom: 10,
  },
  modalContent: {
    alignItems: 'center',
    marginBottom: 20,
  },
  modalIcon: {
    marginBottom: 10,
  },
  modalMessage: {
    fontFamily: 'Poppins_Regular',
    fontSize: 16,
    color: '#333',
    textAlign: 'center',
  },
  modalButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
  },
  modalButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
    minWidth: 100,
    alignItems: 'center',
  },
  confirmButton: {
    backgroundColor: '#00BCD4',
  },
  cancelButton: {
    backgroundColor: '#FF0000',
  },
  modalButtonText: {
    fontFamily: 'Poppins_Regular',
    fontSize: 16,
    color: '#fff',
  },
  toastContainer: {
    position: 'absolute',
    bottom: 50,
    left: 20,
    right: 20,
    backgroundColor: Theme.colors.lightBg,
    borderRadius: 10,
    padding: 15,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  toastIcon: {
    marginRight: 10,
  },
  toastContent: {
    flex: 1,
  },
  toastTitle: {
    fontFamily: 'Poppins_SemiBold',
    fontSize: 16,
    color: Theme.colors.black,
  },
  toastMessage: {
    fontFamily: 'Poppins_Regular',
    fontSize: 12,
    color: Theme.colors.black,
  },

  // Summary Styles
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
  table: {
    marginVertical: 20,
    
  },
  tableRow: {
    flexDirection: 'row',
  },
  tableHeader: {
    textAlign: 'left',
    // alignItems: 'center',
    paddingVertical: 10,
    backgroundColor: Theme.colors.primary,
  },
  tableHeaderText: {
    fontFamily: 'Poppins_SemiBold',
    color: Theme.colors.white,
    fontSize: 12,
    paddingLeft: 10
  },
  tableCell: {
    textAlign: 'left',
    fontFamily: 'Poppins_Regular',
    paddingVertical: 5,
    fontSize: 12,
  },
  cell: {
    paddingHorizontal: 10,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Theme.colors.primary,
    flexShrink: 1,
    flexWrap: 'wrap',
    maxWidth: 100, 

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