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
  container: {
    flex: 1,
    backgroundColor: Theme.colors.lightBg,
  },

  scrollViewContent: {
    paddingVertical: spacing.small, 
  },

  section: {
    marginVertical: spacing.small,
    marginHorizontal: spacing.medium,
    borderWidth: borderWidth.thick,
    borderColor: Theme.colors.primary,
    borderRadius: borderRadius.medium,
    padding: spacing.small,
    backgroundColor: Theme.colors.lightBg,
    shadowColor: Theme.colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },

  sectionTitle: {
    fontSize: 18,
    marginBottom: spacing.small,
    color: Theme.colors.primary,
    textAlign: 'center',
    fontFamily: 'Poppins_SemiBold',
  },

  form: {
    marginHorizontal: 10,
  },

  formTitle: {
    fontSize: 13,
    color: Theme.colors.primary,
    marginBottom: 5,
    fontFamily: 'Poppins_Bold',
  },

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
  errorText: {
    color: 'red',
    fontSize: 12,
    marginLeft: 10,
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
  table:{
    borderWidth: 1,
    borderColor: Theme.colors.primary,
    marginVertical: 20
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: Theme.colors.primary,
  },
  tableHeader: {
    textAlign: 'left',
    paddingLeft: 10,
    fontFamily: 'Poppins_SemiBold',
    paddingVertical: 15,
    color: Theme.colors.white,
    backgroundColor: '#00b3c3c2',
    
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
  button: {
    backgroundColor: '#00BCD4',
    padding: 13,
    borderRadius: 10,
    marginTop: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    marginBottom: 30,
    marginHorizontal: 10,
  },
  buttonText: {
    color: 'white',
    textAlign: 'center',
    fontSize: 15,
    fontFamily: 'Poppins_Bold',
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
  
});