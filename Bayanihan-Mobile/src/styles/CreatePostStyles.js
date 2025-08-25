import { StyleSheet, Platform, StatusBar, Dimensions } from 'react-native';
import Theme from '../constants/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

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
  submitButton: {
    position: 'absolute',
    top: 10,
    right: 5,
    backgroundColor: Theme.colors.primary,
    paddingHorizontal: spacing.large,
    paddingVertical: 5,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitButtonDisabled: {
    backgroundColor: Theme.colors.lightGray,
  },
  submitButtonText: {
    color: Theme.colors.white,
    fontSize: 14,
    fontFamily: 'Poppins_Medium',
  },
  formContainer: {
    flex: 1,
    marginTop: 30,
    paddingBottom: spacing.medium,
  },
  categoryPicker: {
    flex: 1,
    margin: spacing.small,
    marginLeft: 160,
    borderWidth: borderWidth.thin,
    borderColor: Theme.colors.primary,
    borderRadius: borderRadius.medium,
    backgroundColor: '#fff',
    justifyContent: 'center',
    height: 40,
  },
  picker: {
    textAlign: 'center',
    fontFamily: 'Poppins_Regular',
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
    paddingHorizontal: 20,
  },
  input: {
    
    fontFamily: 'Poppins_Regular',
    fontSize: 14,
    color: Theme.colors.black,
    marginHorizontal: 20,
    marginBottom: spacing.medium,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  inputLink: {
    borderWidth: borderWidth.thin,
    borderColor: Theme.colors.lightBlack,
    padding: spacing.medium,
    marginBottom: spacing.medium,
    backgroundColor: 'transparent',
    fontFamily: 'Poppins_Regular',
    fontSize: 14,
    marginHorizontal: 20,
    borderRadius: borderRadius.large,
  },
  imageUpload: {
    borderWidth: borderWidth.thin,
    borderColor: Theme.colors.primary,
    borderRadius: borderRadius.large,
    padding: spacing.medium,
    marginBottom: spacing.medium,
    backgroundColor: '#ffffff9d',
    justifyContent: 'center',
    alignItems: 'center',
    height: 50,
    marginHorizontal: spacing.medium,
  },
  imageUploadText: {
    fontFamily: 'Poppins_Regular',
    fontSize: 14,
    color: Theme.colors.black,
  },
  videoPreview: {
    width: '100%',
    height: 200,
    marginTop: spacing.small,
    borderRadius: borderRadius.medium,
    alignSelf: 'center',
  },
  mediaPreviewContainer: {
    flexDirection: 'column',
    justifyContent: 'flex-start', // Align content to top
    alignItems: 'center', // Center horizontally
    marginTop: spacing.small,
  },
  mediaPreview: {
    position: 'relative',
    marginVertical: spacing.xsmall,
    width: SCREEN_WIDTH, // Full screen width, no padding
    height: undefined, // Let height be set by thumbnailPreview
    alignItems: 'center', // Center horizontally
    justifyContent: 'flex-start', // Align image to top vertically
  },
  thumbnailPreview: {
    width: SCREEN_WIDTH, // Full screen width, no padding
    height: 600, // Fixed height close to 600 pixels
    borderRadius: borderRadius.medium,
  },
  removeButton: {
    position: 'absolute',
    top: spacing.xsmall,
    right: spacing.xsmall,
    backgroundColor: Theme.colors.red,
    borderRadius: borderRadius.medium,
    padding: spacing.xsmall,
  },
  navbar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: 'transparent',
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  navButton: {
    padding: spacing.medium,
    borderRadius: borderRadius.medium,
  },
  navButtonActive: {
     borderBottomWidth: 2,
    borderBottomColor: Theme.colors.accent,
  },
  progressContainer: {
    padding: 10,
    backgroundColor: Theme.colors.white,
    alignItems: 'center',
  },
  progressBarBackground: {
    width: '90%',
    height: 10,
    backgroundColor: Theme.colors.lightGray,
    borderRadius: 5,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: Theme.colors.primary,
    borderRadius: 5,
  },
  progressText: {
    marginTop: 5,
    fontFamily: 'Poppins_Regular',
    fontSize: 14,
    color: Theme.colors.black,
  },
});