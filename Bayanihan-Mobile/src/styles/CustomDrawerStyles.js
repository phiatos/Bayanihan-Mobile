import { StyleSheet } from 'react-native';
import Theme from '../constants/theme';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.colors.primary,
    width: '100%',
    overflow: 'hidden',
  },
  drawerScroll: {
    backgroundColor: Theme.colors.primary,
     overflow: 'hidden',
  },
    userHeader: {
      flexDirection: 'row',   
      alignItems: 'center',  
      padding: 10,      
      borderBottomColor: Theme.colors.white,
      borderBottomWidth: 1,
      position: 'relative'    
  },
    profileImage: {
      width: 50,
      height: 50,
      borderRadius: 25,      
      marginRight: 15,   
      backgroundColor: Theme.colors.lightBg,
  },
    header: {
      flexDirection: 'column', 
      justifyContent: 'center',
  },
  organization: {
    fontSize: 14,
    color: Theme.colors.white,
    fontFamily: 'Poppins_Regular',
  },
  organizationContainer: {
    minHeight: 20,
  },
  userName: {
    color: Theme.colors.white,
    fontSize: 15,
    fontFamily: 'Poppins_Bold',
  },
  drawerListContainer: {
    flex: 1,
    backgroundColor: Theme.colors.primary,
    paddingTop: 20,
    color: Theme.colors.white,
    fontFamily:'Poppins_Regular',
    overflow: 'hidden',
  },
  footer: {
    paddingHorizontal: 30,
    paddingBottom: 40,
    color: Theme.colors.white
  },
  footerButton: {
    paddingVertical: 5,
  },
  footerButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  footerButtonText: {
    fontSize: 13,
    fontFamily: 'Poppins_Medium',
    marginLeft: 25,
    color: Theme.colors.white
  },
    modalContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    marginBottom: 10,
  },
  modalMessage: {
    fontSize: 16,
    textAlign: 'center',
    color: '#333',
  },
});

export default styles;
