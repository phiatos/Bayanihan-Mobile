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
const HEADER_HEIGHT = 80; 

const DashboardStyles = StyleSheet.create({
  gradientContainer:{
    flex: 1,
  },
 container: {
      flex: 1,
 },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingLeft: 10,
    flex: 1,
  },
  scrollViewContent: {
    paddingHorizontal: 20,
    marginTop: 30,
    overflow: 'hidden',
    backgroundColor: 'transparent',
  },
  sectionTitle: {
    textAlign: 'left',
    paddingLeft: 20,
    marginTop: 20,
    fontSize: 18,
    fontFamily: 'Poppins_SemiBold',
    color: Theme.colors.blue,
    position:'relative'
  },
  noSectionTitle:{
    height: spacing.large
  },
    formCard:{
    display:'flex',
    justifyContent: 'center',
    overflow: 'hidden',
    marginVertical: 10,
    marginHorizontal: 16,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: Theme.colors.primary,
    elevation: 13,
    shadowColor: Theme.colors.black, // iOS shadow
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
    metricGradientCard:{
    borderRadius: 15,
    paddingVertical: 10,
    backgroundColor: 'rgba(31, 31, 31, 0.16)',
  },
    metricCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 10,
    marginHorizontal: 16,
    borderRadius: 12,
  },
    innerShadowCommon: {
      position: 'absolute',
      zIndex: 2,
      borderRadius: 15,
    },
    topShadow: {
      top: 0,
      left: 0,
      right: 0,
      height: 15,
    },
    bottomShadow: {
      bottom: 0,
      left: 0,
      right: 0,
      height: 15,
    },
    leftShadow: {
      top: 0,
      bottom: 0,
      left: 0,
      width: 15,
    },
    rightShadow: {
      top: 0,
      bottom: 0,
      right: 0,
      width: 15,
    },
  iconContainer: {
    backgroundColor: '#e8f0fe',
    padding: 10,
    borderRadius: 50,
    width: 50,
    elevation: 8,
    shadowColor: Theme.colors.black, // iOS shadow
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
  metricInfo: {
    flex: 1,
    marginHorizontal: 15,
  },
  metricLabel: {
    fontSize: 15,
    color: Theme.colors.primary,
    fontFamily: 'Poppins_SemiBold',
    color: Theme.colors.white

  },
  metricValue: {
    fontSize: 20,
    color: Theme.colors.lightBlue,
    marginTop: 4,
    fontFamily: 'Poppins_Regular' 
  },
});

export default DashboardStyles;