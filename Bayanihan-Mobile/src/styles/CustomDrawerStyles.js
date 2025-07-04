import { StyleSheet } from 'react-native';
import Theme from '../constants/theme';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.colors.primary,
    width: '100%',
  },
  drawerScroll: {
    backgroundColor: Theme.colors.primary,
  },
  userHeader: {
    padding: 20,
    paddingTop: 80,
    marginLeft: -15,
    marginRight: -15,
    marginTop: -70,
    backgroundColor: Theme.colors.primary,
    flexDirection: 'column',
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
  header: {
    marginLeft: 90,
    marginRight: -15,
    marginTop: -65,
  },
  profileImage: {
    height: 80,
    width: 80,
    borderRadius: 40,
    marginBottom: 10,
  },
  userRole: {
    color: Theme.colors.white,
    fontFamily: 'Poppins_Regular',
    marginRight: 5,
    fontSize: 12,
  },
    userName: {
    color: Theme.colors.white,
    fontSize: 15,
    fontFamily: 'Poppins_Bold',
    marginBottom: 5,
  },
  drawerListContainer: {
    flex: 1,
    backgroundColor: Theme.colors.primary,
    paddingTop: 10,
    color: Theme.colors.white,
    fontFamily:'Poppins_Regular',
    
  },
  footer: {
    padding: 20,
    color: Theme.colors.white

  },
  footerButton: {
    paddingVertical: 15,
  },
  footerButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',

  },
  footerButtonText: {
    fontSize: 13,
    fontFamily: 'Poppins_Regular',
    marginLeft: 5,
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
