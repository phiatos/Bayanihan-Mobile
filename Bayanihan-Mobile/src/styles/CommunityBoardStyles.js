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
const HEADER_HEIGHT = 50;

export default StyleSheet.create({
  filterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.medium,
    paddingHorizontal: spacing.medium,
    marginTop: HEADER_HEIGHT,
  },
  filterText: {
    color: Theme.colors.accent,
    fontFamily: 'Poppins_Regular',
    fontSize: 12,
  },
  sortButton: {
    padding: spacing.small,
    backgroundColor: '#ddd',
    borderRadius: borderRadius.medium,
    textAlign: 'center'
  },
  categoryPicker: {
    flex: 1,
    marginLeft: spacing.medium,
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
  postContainer: {
    backgroundColor: '#fff',
    padding: spacing.medium,
    borderRadius: borderRadius.medium,
    marginVertical: spacing.xsmall,
    marginHorizontal: spacing.medium,
    shadowColor: Theme.colors.lightBlack,
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  postHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.medium,
  },
  postUser: {
    fontFamily: 'Poppins_SemiBold',
    color: Theme.colors.black,
  },
  postMeta: {
    fontFamily: 'Poppins_Medium',
    color: Theme.colors.primary,
    fontSize: 11,
  },
  sharedInfo: {
    fontSize: 11,
    fontFamily: 'Poppins_Italic',
    color: Theme.colors.lightBlack,
  },
  shareCaption: {
    fontFamily: 'Poppins_Italic',
    color: Theme.colors.lightBlack,
    marginTop: spacing.xsmall,
  },
  postTitle: {
    fontSize: 18,
    fontFamily: 'Poppins_SemiBold',
    color: Theme.colors.black,
    marginBottom: spacing.xsmall,
  },
  postContent: {
    fontFamily: 'Poppins_Regular',
    color: Theme.colors.black,
    fontSize: 13,
    marginBottom: spacing.medium,
  },
  postMedia: {
    width: '100%',
    height: 200,
    borderRadius: borderRadius.medium,
    marginBottom: spacing.medium,
  },
  menuContainer: {
    backgroundColor: '#fff',
    borderRadius: borderRadius.medium,
    padding: spacing.small,
    marginBottom: spacing.medium,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  menuItem: {
    padding: spacing.small,
  },
  menuText: {
    fontFamily: 'Poppins_Regular',
    fontSize: 14,
    color: Theme.colors.black,
  },
  floatingButtonContainer: {
    position: 'absolute',
    top: 20,
    bottom: 10,
    right: 0,
    zIndex: 10,
  },
  actionButtonContainer: {
    position: 'absolute',
    bottom: 10,
    right: 20,
    alignItems: 'center',
    zIndex: 20,
  },
  button: {
    borderRadius: 100,
    width: 60,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    bottom: 30,
    right: 20,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 5,
    borderWidth: 2,
    zIndex: 30,
  },
  actionButton: {
    borderRadius: 100,
    width: 60,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    marginBottom: 25,
    zIndex: 25,
  },
  emptyText: {
    fontFamily: 'Poppins_Regular',
    color: Theme.colors.black,
    textAlign: 'center',
    marginTop: spacing.large,
  },
});