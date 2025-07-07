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
    color: Theme.colors.black,
    position:'relative'
  },
  noSectionTitle:{
    height: spacing.large
  },
  metricGradientCard:{
    display:'flex',
    justifyContent: 'center',
    overflow: 'hidden',
    marginVertical: 10,
    marginHorizontal: 16,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: Theme.colors.primary,
  },
    metricCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 10,
    marginHorizontal: 16,
    borderRadius: 12,
  },
  formCard:{
    borderRadius: 15,
    paddingVertical: 10,
  },
  iconContainer: {
    backgroundColor: '#e8f0fe',
    padding: 10,
    borderRadius: 50,
    width: 50,
  },
  metricInfo: {
    flex: 1,
    marginHorizontal: 15,
  },
  metricLabel: {
    fontSize: 15,
    color: Theme.colors.primary,
    fontFamily: 'Poppins_SemiBold' 
  },
  metricValue: {
    fontSize: 20,
    color: Theme.colors.blue,
    marginTop: 4,
    fontFamily: 'Poppins_Regular' 
  },
});

export default DashboardStyles;