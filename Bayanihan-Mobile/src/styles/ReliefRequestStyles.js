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
  sectionTitle: {
    fontSize: 18,
    marginBottom: spacing.small,
    color: Theme.colors.primary,
    textAlign: 'center',
    fontFamily: 'Poppins_SemiBold',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
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
  errorText: {
    color: 'red',
    fontSize: 12,
    marginLeft: 10,
    marginBottom: spacing.small,
  },
  pickerContainer: {
    borderWidth: borderWidth.thin, 
    borderColor: '#605D67', 
    borderRadius: borderRadius.large, 
    paddingHorizontal: 0, 
    paddingVertical:0, 
    marginBottom: spacing.small, 
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
    minWidth: '100%',
  },
  summaryTableRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cell: {
    paddingHorizontal: 10,
    justifyContent: 'center',
  },
  summaryTableHeader: {
    fontFamily: 'Poppins_SemiBold',
    fontSize: 12,
    color: Theme.colors.white,
    backgroundColor: Theme.colors.primary,
    paddingVertical: 15,
  },
  summaryTableCell: {
    fontFamily: 'Poppins_Regular',
    fontSize: 12,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: Theme.colors.primary,
    flexShrink: 1,
  },
  icon: {
    padding: 10,
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
    borderWidth: 1,
    borderColor: '#4059A5',
    borderRadius: 5,
    overflow: 'hidden',
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: 'hsla(225, 44.10%, 44.90%, 0.23)',
    borderBottomWidth: 1,
    borderColor: '#4059A5',
    paddingVertical: 8,
    paddingHorizontal: 5,
  },
  tableHeaderCell: {
    flex: 1,
    textAlign: 'center',
    color: Theme.colors.black,
    fontFamily: 'Poppins_SemiBold',
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 10,
    paddingHorizontal: 5,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  tableCell: {
    flex: 1,
    textAlign: 'center',
    fontSize: 14,
    color: Theme.colors.black,
    justifyContent: 'center',
    alignItems: 'center',
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