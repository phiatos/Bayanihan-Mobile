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
    position: 'absolute',
    width: '80%',
    top: 80,
    left: 90,
    marginRight: -15,
  },
  profileImage: {
    height: 60,
    width: 60,
    borderRadius: 40,
    marginBottom: 10,
  },
  organization: {
    fontSize: 14,
    color: Theme.colors.white,
    marginTop: 4,
    fontFamily: 'Poppins_Regular',
  },
  organizationContainer: {
    minHeight: 20,
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
