import { StyleSheet, Dimensions, Platform, StatusBar } from 'react-native';
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

const STATUS_BAR_HEIGHT = Platform.OS === 'ios' ? 20 : StatusBar.currentHeight;
const HEADER_HEIGHT = 50; 

export const styles = StyleSheet.create({
  headerContainer:{
    position: 'absolute',
    top: STATUS_BAR_HEIGHT,
    left:0,
    right: 0,
    height: HEADER_HEIGHT ,
    width: '93%',
    marginHorizontal: '3.5%', 
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    display:'flex',
    zIndex: 1000,
    backgroundColor: 'rgba(0, 0, 0, 0.38)',
    borderRadius: 15,
    overflow: 'hidden',
  },
  formCard:{
    width: '100%',
    height: '100%',
    borderColor: 'rgba(255, 255, 255, 0.3)',
    borderWidth: 1,
    borderRadius: 15,
    display:'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flex: 1,
  },
  headerUserContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerMenuIcon:{
    paddingLeft: 10,
  },
  userName:{
    color: Theme.colors.white, 
    fontSize: 14, 
    fontFamily: 'Poppins_Medium',
    right: -30,
},
  fullScreenContainer: {
    flex: 1,
    position: 'relative',
  },
  map: {
    flex: 1,
    width: width,
    height: '100%',
    zIndex: 1,
  },
  overlayContainer: {
    position: 'absolute',
    top: STATUS_BAR_HEIGHT + HEADER_HEIGHT + 10,
    left: 0,
    right: 0,
    zIndex: 900,
  },
  userInfoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    position: 'absolute',
    top: 60,
    right: -30,
    textAlign: 'right',
  },
  searchWrapper: {
    paddingHorizontal: 20,
    marginTop: 10,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderColor: Theme.colors.primary,
    elevation: 10,
    backgroundColor: Theme.colors.white,
    borderWidth: 1,
    borderRadius: 25,
    paddingHorizontal: 2,
    paddingVertical: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
//   searchIcon: {
//     padding: 10,
//   },
  suggestionsContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    backgroundColor: Theme.colors.white,
    borderRadius: 10,
    marginTop: 50,
    elevation: 5,
    maxHeight: 200,
    zIndex: 1000,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    overflow: 'hidden'
  },
  suggestionItem: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  suggestionText: {
    fontSize: 14,
    color: Theme.colors.black,
  },
  returnButton: {
    position: 'absolute',
    bottom: 0,
    right: 20,
    backgroundColor: Theme.colors.primary,
    padding: 10,
    borderRadius: 25,
    elevation: 10,
    zIndex: 1000,
    borderWidth: 1,
    borderColor: Theme.colors.primary,
    hadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  mapTypeButtonsContainer: {
    position: 'absolute',
    top: 650,
    marginHorizontal: '15%', 
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent:'center',
    gap: 10,
    zIndex: 950,
  },
  mapTypeButton: {
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginHorizontal: 5,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  mapTypeButtonActive: {
    backgroundColor: '#FFFFFF',
    borderColor: Theme.colors.primary,
  },
  mapTypeButtonText: {
    fontSize: 14,
    color: Theme.colors.white,
    marginLeft: 6,
  },
  mapTypeButtonTextActive: {
    color: Theme.colors.primary,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    alignItems: 'center',
    width: '100%',
    elevation: 20,
  },
  permissionDeniedHeader: {
    fontSize: 22,
    color: Theme.colors.black,
    textAlign: 'center',
    marginVertical: 10,
    fontFamily: 'Poppins_Bold'
  },
  permissionDeniedText: {
    color: Theme.colors.lightBlack,
    textAlign: 'center',
    marginBottom: 20,
  },
  permissionButtons: {
    flexDirection: 'column',
    width: '100%',
  },
  permissionDeniedContainer: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    alignItems: 'center',
    elevation: 5,
    marginTop: 20,
  },
  permissionDeniedContainerHeader: {
    fontSize: 18,
    color: Theme.colors.primary,
    textAlign: 'center',
    marginBottom: 10,
  },
  permissionDeniedContainerText: {
    fontSize: 14,
    color: '#333333',
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    paddingVertical: 10,
    paddingHorizontal: 30,
    borderRadius: 40,
    borderWidth: 1,
    borderColor: 'white',
    backgroundColor: Theme.colors.primary,
    width: '100%',
    marginBottom: 10,
  },
  retryButtonText: {
    fontSize: 14,
    color: '#FFFFFF',
    textAlign: 'center',
  },
  closeButton: {
    paddingVertical: 10,
    paddingHorizontal: 30,
    borderRadius: 40,
    borderWidth: 1,
    borderColor: Theme.colors.primary,
    backgroundColor: 'transparent',
  },
  closeButtonText: {
    fontSize: 14,
    color: Theme.colors.primary,
    textAlign: 'center',
  },
});