import { StyleSheet, Platform, StatusBar, Dimensions } from 'react-native';
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

// Calculate header top padding for iOS and Android
const STATUS_BAR_HEIGHT = Platform.OS === 'ios' ? 20 : StatusBar.currentHeight;
const HEADER_HEIGHT = 60; 

export default StyleSheet.create({
  container:{
    flex: 1,
    backgroundColor: Theme.colors.lightBg,
  },  
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
    backgroundColor: Theme.colors.primary,
    height: HEADER_HEIGHT + STATUS_BAR_HEIGHT,
    paddingHorizontal: spacing.small,
    paddingTop: STATUS_BAR_HEIGHT, 
    borderBottomLeftRadius: borderRadius.xlarge,
    borderBottomRightRadius: borderRadius.xlarge,
    position: 'relative',
  },
  newheaderContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      height: HEADER_HEIGHT,
      paddingHorizontal: spacing.small,
      shadowColor: Theme.colors.black,
      shadowOffset: { width: 0, height: 5 },
      shadowOpacity: 0.3,
      shadowRadius: 5,
  },
  headerMenuIcon: {
    position: 'absolute',
    left: spacing.small,
    zIndex: 1,
    color: Theme.colors.primary
  },
  headerTitle: {
    color:  Theme.colors.accent,
    fontSize: 20,
    fontFamily: 'Poppins_SemiBold', 
    textAlign: 'center',
    flex: 1, 
  },
  scrollViewContent: {
    flexGrow: 1,
    // paddingTop: HEADER_HEIGHT,
    minHeight: Dimensions.get('window').height - (STATUS_BAR_HEIGHT),
  },
  form: {
    marginHorizontal: 10,
    marginTop: 20,
    marginBottom: 40
  },
  formTitle: {
    fontSize: 13,
    color: Theme.colors.primary,
    marginBottom: 5,
    fontFamily: 'Poppins_Bold',
  },
  section:{
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
  label: {
    fontSize: 14,
    color: '#00BCD4',
    fontFamily: 'Poppins_SemiBold',
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
   imageUpload: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 10,
    marginBottom: 10,
    backgroundColor: '#ffffff9d',
    justifyContent: 'center',
    alignItems: 'center',
    fontFamily: 'Poppins_Regular',
    borderColor: Theme.colors.primary,
    height: 50,
  },  
  image: {
    width: 200,
    height: 150,
    borderRadius: 10,
    marginTop: 5,
  },
  imageUploadText:{
    fontFamily: 'Poppins_Regular',
    fontSize: 14,
  },
  supplementaryButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: 10,
  },
  supplementaryButton: {
    paddingVertical: 8,
    paddingHorizontal: 10,
    backgroundColor: Theme.colors.lightBg,
    borderColor: Theme.colors.blue,
    borderWidth: 2,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    marginBottom: 10,
  },
  supplementaryButtonText: {
    color: Theme.colors.accentBlue,
    textAlign: 'center',
    fontSize: 13,
    paddingHorizontal: 10,
    fontFamily: 'Poppins_SemiBold',
  },
  submitButtonContainer:{
    position: 'absolute',
    bottom: 40,
    width: '100%'
  },
  button: {
    backgroundColor: Theme.colors.primary,
    padding: spacing.medium,
    borderRadius: borderRadius.large,
    marginTop: spacing.small,
    shadowColor: Theme.colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  buttonText: {
    color: Theme.colors.white,
    textAlign: 'center',
    fontFamily: 'Poppins_SemiBold',
    fontSize: 16,
  },

  // Summary Pages
  summarySection: {
    marginVertical: 10,
    marginHorizontal: 15,
    borderWidth: 3,
    backgroundColor: '#FFF9F0',
    borderColor: '#4059A5',
    borderRadius: 10,
    padding: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  summarySectionTitle: {
    fontSize: 20,
    color: '#14AEBB',
    marginBottom: 10,
    fontFamily: 'Poppins_SemiBold',
  },
   subheader:{
    color: Theme.colors.blue,
    textAlign: 'left',
    fontFamily: 'Poppins_Bold',
    fontSize: 25,
    paddingLeft: 15
  },
   organizationName: {
    fontSize: 16,
    color: '#3D52A0',
    textAlign: 'left',
    fontFamily: 'Poppins_Regular',
    paddingBottom: 10,
    paddingLeft: 15
  },
  finalButtonContainer:{
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginHorizontal: 10,
    marginTop: 20,
    height: 45,
  },
    backButton: {
    borderWidth: 1.5,
    borderColor: Theme.colors.blue,
    borderRadius: 12,
    justifyContent: 'center',
    paddingHorizontal: 25,
    paddingVertical: 0,
    alignItems: 'center',
    marginRight: 10,
    backgroundColor: 'transparent',
  },
  backButtonText: {
    color: Theme.colors.blue,
    fontSize: 16,
    fontFamily: 'Poppins_Medium',
  },
  submitButton: {
    flex: 1,
    backgroundColor: '#14AEBB',
    borderRadius: 12,
    justifyContent: 'center',
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    paddingTop: 5,
    fontFamily: 'Poppins_SemiBold',
    textAlign: 'center',
  },
});
