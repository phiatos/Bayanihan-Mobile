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
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    marginBottom: spacing.medium,
    marginHorizontal: spacing.medium,
    backgroundColor: '#fff',
  },
  picker: {
    height: 50,
  },
  pickerItem: {
    fontFamily: 'Poppins_Regular',
    fontSize: 14,
    color: Theme.colors.black,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    padding: spacing.medium,
    marginBottom: spacing.medium,
    backgroundColor: '#fff',
    fontFamily: 'Poppins_Regular',
    fontSize: 14,
  },
  contentInput: {
    textAlignVertical: 'top',
  },
  mediaUpload: {
    borderWidth: 1,
    borderColor: '#AAA',
    borderRadius: 10,
    padding: spacing.medium,
    marginBottom: spacing.medium,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    height: 50,
    marginHorizontal: spacing.medium,
  },
});