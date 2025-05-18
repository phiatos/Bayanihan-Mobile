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

// Calculate header top padding for iOS and Android
const STATUS_BAR_HEIGHT = Platform.OS === 'ios' ? 20 : StatusBar.currentHeight;
const HEADER_HEIGHT = 92; // The base height of your header content area

export default StyleSheet.create({
  // Global Header Styles
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Theme.colors.primary,
    height: HEADER_HEIGHT + STATUS_BAR_HEIGHT, // Total height including status bar
    paddingHorizontal: spacing.small,
    paddingTop: STATUS_BAR_HEIGHT, // Padding for content below the status bar
    borderBottomLeftRadius: borderRadius.xlarge,
    borderBottomRightRadius: borderRadius.xlarge,
    position: 'relative', // For absolute positioning of internal elements like menu icon
    elevation: 10, // Android shadow
    shadowColor: Theme.colors.black, // iOS shadow
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
  headerMenuIcon: {
    position: 'absolute',
    left: spacing.small,
    // Calculate top to center the icon vertically relative to the content area of the header
    top: STATUS_BAR_HEIGHT + (HEADER_HEIGHT - 32) / 2, // 32 is icon size
    zIndex: 1,
  },
  headerTitle: {
    color: Theme.colors.white,
    fontSize: 20,
    fontFamily: 'Poppins_SemiBold', // Ensure this font is loaded globally or in each screen
    textAlign: 'center',
    flex: 1, // Allows text to take up available space and center
  },

  // You can add other global styles here, e.g., for common buttons, input fields, etc.
  // Example:
  // screenBackground: {
  //   flex: 1,
  //   backgroundColor: Theme.colors.lightBg,
  // },
});