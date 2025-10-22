import { Platform, StatusBar, StyleSheet, Dimensions } from 'react-native';
import Theme from '../constants/theme';
  const { height, width } = Dimensions.get('window');


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

// Calculate header height including status bar
const STATUS_BAR_HEIGHT = Platform.OS === 'ios' ? 0 : StatusBar.currentHeight || 0;
const HEADER_HEIGHT = 60;

export default StyleSheet.create({
  scrollViewContent: {
    flexGrow: 1,
    minHeight: Dimensions.get('window').height - (STATUS_BAR_HEIGHT),
  },
  form: {
    marginTop: 80,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.small,
  },

  // Profile Picture
  profilePictureContainer: {
  alignItems: 'center',
  marginBottom: 20,
},
profilePicture: {
  width: 100,
  height: 100,
  borderRadius: 50,
  marginBottom: 10,
  elevation: 5
},
profilePicturePlaceholder: {
  backgroundColor: '#e0e0e0',
  justifyContent: 'center',
  alignItems: 'center',
},
uploadButton: {
  flexDirection: 'row',
  alignItems: 'center',
  marginTop: -30,
  marginLeft: 70
},

  label: {
    width: '40%',
    color: Theme.colors.primary,
    fontFamily: 'Poppins_Bold',
    fontSize: 13,
    marginRight: spacing.xsmall,
  },
  outputContainer: {
    flex: 1,
    alignItems: 'flex-start',
    flexDirection: 'row',
  },
  output: {
    marginRight: spacing.xsmall,
    marginBottom: spacing.xsmall,
    textAlign: 'left',
    color: Theme.colors.black,
    fontFamily: 'Poppins_Regular',
    fontSize: 13,
    width: '100%',
  },
  submission: {
    marginHorizontal: spacing.large,
  },
  strengthContainer: {
    marginTop: spacing.small,
    marginBottom: spacing.medium,
  },
  strengthText: {
    fontSize: 14,
    color: Theme.colors.primary,
    marginBottom: spacing.xsmall,
    fontFamily: 'Poppins_SemiBold',
  },
  strengthBarContainer: {
    height: 6,
    backgroundColor: '#E0E0E0',
    borderRadius: borderRadius.small,
    overflow: 'hidden',
    marginBottom: spacing.small,
  },
  strengthBar: {
    height: '100%',
    borderRadius: borderRadius.small,
  },
   iconAndTextWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  labelText: {
    marginLeft: 5, 
    fontFamily: 'Poppins_Regular',
    fontSize: 13,

  },
  checkText: {
    color: Theme.colors.black,
    marginBottom: spacing.xsmall,
   
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)', 
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000, 
  },
  modalContainer: {
    width: '90%',
    backgroundColor: Theme.colors.white,
    borderRadius: borderRadius.large,
    padding: spacing.medium,
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 20,
    color: Theme.colors.primary,
    textAlign: 'center',
    marginBottom: spacing.medium,
    fontFamily: 'Poppins_Bold',
  },
  modalContent: {
    maxHeight: '60%',
    marginBottom: spacing.medium,
  },
  modalText: {
    fontSize: 14,
    color: Theme.colors.black,
    fontFamily: 'Poppins_Regular',
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.medium,
  },
  checkbox: {
    marginRight: spacing.xsmall,
  },
  checkboxLabel: {
    fontSize: 14,
    color: Theme.colors.black,
    fontFamily: 'Poppins_Regular',
  },
  modalButton: {
    backgroundColor: Theme.colors.primary,
    padding: spacing.medium,
    borderRadius: borderRadius.large,
    alignItems: 'center',
  },
  modalButtonText: {
    color: Theme.colors.white,
    fontSize: 16,
    fontFamily: 'Poppins_SemiBold',
  },
  passwordInputField: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: borderWidth.thin,
    borderColor: '#605D67',
    borderRadius: borderRadius.large,
    marginBottom: spacing.small,
  },
  input: {
    flex: 1,
    height: 50,
    color: Theme.colors.black,
    fontSize: 14,
    paddingHorizontal: 15,
    paddingRight: 45, 
    fontFamily: 'Poppins_Regular',
  },
  passwordEyeIcon: {
    position: 'absolute',
    right: 5,
    padding: 10,
  },
  message: {
    fontSize: 14,
    color: '#444',
    lineHeight: 24,
    fontFamily: 'Poppins_Regular',
    textAlign: 'center',
  },
  icon: {
    marginBottom: 15,
  },
  sectionTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  organizationText: {
    fontSize: 16,
    fontFamily: 'Poppins_Regular',
    color: Theme.colors.text,
    marginLeft: 8,
  },
  modalHeader: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    alignItems: 'center',
  },
  modalSectionTitle: {
    fontSize: 18,
    fontFamily: 'Poppins_SemiBold',
    marginTop: 10,
    marginBottom: 5,
    color: Theme.colors.black,
},
 modalListItem: {
    fontSize: 14,
    fontFamily: 'Poppins_Regular',
    color: '#442424ff',
    marginLeft: 20,
    marginBottom: 5,
    lineHeight: 20,
 },
modalFooter: {
    padding: 15,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    alignItems: 'center',
  },
});
