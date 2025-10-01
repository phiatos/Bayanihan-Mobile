import { Dimensions, Platform, StatusBar, StyleSheet } from 'react-native';
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

const STATUS_BAR_HEIGHT = Platform.OS === 'ios' ? 20 : StatusBar.currentHeight;
const HEADER_HEIGHT = 60; 

export default StyleSheet.create({
  section:{
    borderWidth: 1,
    borderColor: Theme.colors.accentBlue,
    borderStyle: 'dashed',
    paddingHorizontal: 10,
    paddingBottom: 10,
    borderRadius: 10  
  },
  sectionTitle: {
    fontSize: 18,
    marginBottom: spacing.small,
    color: Theme.colors.primary,
    textAlign: 'center',
    fontFamily: 'Poppins_SemiBold',
  },
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
    marginBottom: 10,
  },
  //Progress Steps
    progressContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 10,
      paddingHorizontal: 15,
      marginTop: 100,
      marginBottom: 10,
      backgroundColor: 'transparent',
    },
    progressCircles: {
      width: 30,
      height: 30,
      borderRadius: 125,
      justifyContent: 'center',
      alignItems: 'center',
    },
    progressNumbers: {
      fontFamily: 'Poppins_Regular',
      fontSize: 12,
    },
    progressLines:{
      flex: 1, 
      height: 2,
      // marginHorizontal: 5,
    },
    progressStepsText: {
      fontFamily: 'Poppins_Regular',
      fontSize: 10,
      color: Theme.colors.accent,
      position: 'absolute',
      top: 30,
      width: 50,
      left: -10,
      textAlign: 'center',
    },

  //Table
  table: {
    marginVertical: 20,
    borderTopLeftRadius: 10,
    overflow: 'hidden',
    
  },
  tableRow: {
    flexDirection: 'row',
  },
  tableHeader: {
    textAlign: 'left',
    paddingLeft: 10,
    fontFamily: 'Poppins_SemiBold',
    paddingVertical: 15,
    color: Theme.colors.white,
    backgroundColor: Theme.colors.primary,
    fontSize: 12
  },
  tableCell: {
    textAlign: 'left',
    paddingLeft: 10,
    fontFamily: 'Poppins_Regular',
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: Theme.colors.primary,
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
  
  pickerRequiredInput: {
    borderColor: Theme.colors.red, 
  },


  // RDANA Summary
   sectionSubtitle: {
    fontSize: 16,
    marginBottom: 10,
    color: '#00BCD4',
    fontFamily: 'Poppins_SemiBold',
  },
  fieldContainer: {
    marginBottom: 10,
  },
  label: {
    fontSize: 14,
    color: '#00BCD4',
    fontFamily: 'Poppins_SemiBold',
  },
  value: {
    fontSize: 14,
    color: '#000000',
    marginTop: 2,
    fontFamily: 'Poppins_Regular',
  },
  summaryTable: {
    borderWidth: 1,
    borderColor: Theme.colors.primary,
    borderRadius: 5,
    overflow: 'hidden',
  },
  summaryTableHeader: {
    flexDirection: 'row',
    backgroundColor: Theme.colors.primary,
    borderBottomWidth: 1,
    borderColor: Theme.colors.primary,
    paddingVertical: 8,
    paddingHorizontal: 5,
  },
  summaryTableHeaderCell: {
    textAlign: 'center',
    color: Theme.colors.white,
    fontFamily: 'Poppins_SemiBold',
    fontSize: 12,
    paddingHorizontal: 5,
  },
  summaryTableRow: {
    flexDirection: 'row',
    paddingHorizontal: 5,
  },
  summaryTableCell: {
    textAlign: 'center',
    fontSize: 12,
    color: '#000000',
    fontFamily: 'Poppins_Regular',
    paddingHorizontal: 5,
    paddingVertical: 6,
  },

  // Modal
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
  modalOverlay: {
  flex: 1,
  justifyContent: 'center',
  alignItems: 'center',
  backgroundColor: 'rgba(0, 0, 0, 0.5)',
},
modalView: {
  backgroundColor: '#FFF9F0',
  borderRadius: 10,
  padding: 20,
  alignItems: 'center',
  elevation: 5,
  width: '80%',
},
modalText: {
  fontSize: 16,
  color: '#444',
  marginBottom: 20,
  textAlign: 'center',
  fontFamily: 'Poppins_Regular',
},
modalButton: {
  backgroundColor: '#14AFBC',
  paddingVertical: 10,
  paddingHorizontal: 20,
  borderRadius: 10,
},
modalButtonText: {
  color: '#fff',
  fontSize: 16,
  fontFamily: 'Poppins_SemiBold',
},
});