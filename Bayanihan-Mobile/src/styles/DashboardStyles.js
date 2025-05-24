import { StyleSheet } from 'react-native';
import Theme from '../constants/theme';

const DashboardStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.colors.lightBg,
  },
  scrollViewContent: {
    padding: 20,
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
