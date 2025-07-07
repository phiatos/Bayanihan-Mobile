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
const HEADER_HEIGHT = 80; 

export default StyleSheet.create({
  // Global Header Styles
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Theme.colors.primary,
    height: HEADER_HEIGHT + STATUS_BAR_HEIGHT,
    paddingHorizontal: spacing.small,
    paddingTop: STATUS_BAR_HEIGHT, 
    borderBottomLeftRadius: borderRadius.xlarge,
    borderBottomRightRadius: borderRadius.xlarge,
    position: 'relative', 
    // elevation: 10, // Android shadow
    // shadowColor: Theme.colors.black, // iOS shadow
    // shadowOffset: { width: 0, height: 5 },
    // shadowOpacity: 0.3,
    // shadowRadius: 5,
  },
    newheaderContainer: {
    position: 'absolute',
    top: STATUS_BAR_HEIGHT,
    left: 0,
    right: 0,
    justifyContent: 'center',
    alignItems: 'center',
    display: 'flex',
    zIndex: 1000,
    overflow: 'hidden',
  },
  headerMenuIcon: {
    position: 'absolute',
    left: spacing.small,
    top: STATUS_BAR_HEIGHT + (HEADER_HEIGHT - 32) / 2, // 32 is icon size
    zIndex: 1,
    color: Theme.colors.primary
  },
  headerTitle: {
    color:  Theme.colors.primary,
    fontSize: 20,
    fontFamily: 'Poppins_SemiBold', 
    textAlign: 'center',
    flex: 1, 
  },
  container:{
  flex: 1,
    backgroundColor: Theme.colors.lightBg,
  },
});

// ToastAndroid.show('Failed to load the map. Please check your API key and internet connection.',ToastAndroid.BOTTOM);
