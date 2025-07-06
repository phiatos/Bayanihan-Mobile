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

  headerContainer:{
    position: 'absolute',
    top: STATUS_BAR_HEIGHT,
    left:0,
    right: 0,
    justifyContent: 'center',
    alignItems: 'center',
    display:'flex',
    zIndex: 1000,
    overflow: 'hidden',
    marginBottom: 10,
    // backgroundColor: Theme.colors.primary
  },
  headerContent:{
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingLeft: 10,
    flex: 1,
  },
  scrollViewContent: {
      padding: 20,
      marginTop: 50,
      overflow: 'hidden'
  },
  sectionTitle: {
    textAlign: 'center',
    fontSize: 24,
    marginBottom: 10,
    fontFamily: 'Poppins_SemiBold',
    color: Theme.colors.primary,
  },
  metricCard: {
  flexDirection: 'row',
  alignItems: 'center',
  backgroundColor: '#fff',
  marginVertical: 10,
  marginHorizontal: 16,
  padding: 16,
  borderRadius: 12,
  borderColor: '#0fbaba',  
  borderWidth: 1,
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.1,
  shadowRadius: 6,
  elevation: 3,
},
iconContainer: {
  marginRight: 16,
  backgroundColor: '#e8f0fe',
  padding: 10,
  borderRadius: 50,
},
metricInfo: {
  flex: 1,
},
metricLabel: {
  fontSize: 14,
  color: '#7f8c8d',
},
metricValue: {
  fontSize: 20,
  color: '#2980b9',
  marginTop: 4,
},
});

export default DashboardStyles;
