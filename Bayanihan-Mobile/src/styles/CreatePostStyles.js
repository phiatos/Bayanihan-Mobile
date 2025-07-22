import { StyleSheet, Platform, StatusBar } from 'react-native';
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

const STATUS_BAR_HEIGHT = Platform.OS === 'ios' ? 20 : StatusBar.currentHeight;
const HEADER_HEIGHT = 60;

export default StyleSheet.create({
  gradientContainer: {
    paddingTop: STATUS_BAR_HEIGHT,
    width: '100%',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1,
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: HEADER_HEIGHT,
    paddingHorizontal: spacing.small,
    elevation: 10,
    shadowColor: Theme.colors.black,
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
  submitButton: {
    position: 'absolute',
    top: 10,
    right: 5,
    backgroundColor: Theme.colors.primary,
    paddingHorizontal: spacing.large,
    paddingVertical: 5,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center'
  },
  submitButtonDisabled: {
    backgroundColor: Theme.colors.lightGray,
  },
  submitButtonText: {
    color: Theme.colors.white,
    fontSize: 14,
    fontFamily: 'Poppins_Medium'
  },
  formContainer: {
    flex: 1,
    paddingTop: HEADER_HEIGHT + STATUS_BAR_HEIGHT,
    paddingBottom: spacing.medium,
  },
  userInfo: {
    marginBottom: spacing.medium,
    paddingHorizontal: spacing.medium,
  },
  userName: {
    fontFamily: 'Poppins_SemiBold',
    fontSize: 16,
    color: Theme.colors.black,
  },
  userOrg: {
    fontFamily: 'Poppins_Regular',
    fontSize: 14,
    color: Theme.colors.primary,
  },
  categoryPicker: {
      flex: 1,
      margin: spacing.medium,
      marginLeft: 160,
      borderWidth: 1,
      borderColor: '#ccc',
      borderRadius: borderRadius.medium,
      backgroundColor: '#fff',
      justifyContent: 'center', 
      height: 40,
  },
    picker: {
      textAlign: 'center'
  },
    pickerItems: {
      fontFamily: 'Poppins_Regular',
      fontSize: 13,
      color: Theme.colors.black,
      textAlign: 'center',
  },
  label: {
    fontSize: 14,
    color: '#00BCD4',
    fontFamily: 'Poppins_SemiBold',
  },
  input: {
    padding: spacing.medium,
    marginBottom: spacing.medium,
    backgroundColor: 'transparent',
    fontFamily: 'Poppins_Regular',
    fontSize: 14,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  mediaUpload: {
    borderWidth: 1,
    borderColor: '#AAA',
    borderRadius: borderRadius.large,
    padding: spacing.medium,
    marginBottom: spacing.medium,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    height: 50,
    marginHorizontal: spacing.medium,
  },
  videoPreview: {
    width: '100%',
    height: 200,
    marginTop: spacing.small,
    borderRadius: borderRadius.medium,
  },
  mediaPreviewContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
    marginTop: spacing.small,
  },
  mediaPreview: {
    position: 'relative',
    margin: spacing.xsmall,
    width: 100,
    height: 100,
  },
  thumbnailPreview: {
    width: 100,
    height: 100,
    borderRadius: borderRadius.medium,
  },
  cropButton: {
    position: 'absolute',
    top: spacing.xsmall,
    right: spacing.xsmall,
    backgroundColor: Theme.colors.primary,
    borderRadius: borderRadius.medium,
    padding: spacing.xsmall,
  },
  removeButton: {
    position: 'absolute',
    top: spacing.xsmall,
    right: 30, 
    backgroundColor: Theme.colors.red,
    borderRadius: borderRadius.medium,
    padding: spacing.xsmall,
  },
  mediaButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.medium,
  },
  mediaButton: {
    backgroundColor: Theme.colors.lightBlue,
    padding: spacing.medium,
    borderRadius: borderRadius.medium,
    alignItems: 'center',
    flex: 1,
    marginHorizontal: spacing.xsmall,
  },
  mediaButtonText: {
    color: Theme.colors.accentBlue,
    fontSize: 16,
    fontWeight: 'bold',
  },
  mediaInfo: {
    fontSize: 14,
    color: Theme.colors.black,
    marginTop: spacing.small,
  },
  navbar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: Theme.colors.primary,
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    
  },
  navButton: {
    padding: spacing.small,
    borderRadius: borderRadius.medium,
  },
  navButtonActive: {
  },
});