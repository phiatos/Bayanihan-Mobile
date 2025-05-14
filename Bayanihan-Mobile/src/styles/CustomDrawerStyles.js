import { StyleSheet } from 'react-native';
import Theme from '../contants/theme';

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  drawerScroll: {
    backgroundColor: Theme.colors.white,
  },
  userHeader: {
    padding: 20,
    paddingTop: 80,
    marginLeft: -15,
    marginRight: -15,
    marginTop: -70,
    backgroundColor: Theme.colors.primary,
  },
  header: {
    padding: 20,
    paddingTop: 60,
    marginLeft: -15,
    marginRight: -15,
    marginTop: -50,
  },
  profileImage: {
    height: 80,
    width: 80,
    borderRadius: 40,
    marginBottom: 10,
  },
  userName: {
    color: Theme.colors.white,
    fontSize: 18,
    fontFamily: 'Roboto-Medium',
    marginBottom: 5,
  },
  userRoleContainer: {
    flexDirection: 'row',
  },
  userRole: {
    color: Theme.colors.white,
    fontFamily: 'Roboto-Regular',
    marginRight: 5,
  },
  drawerListContainer: {
    flex: 1,
    backgroundColor: Theme.colors.white,
    paddingTop: 10,
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#ccc', 
  },
  footerButton: {
    paddingVertical: 15,
  },
  footerButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  footerButtonText: {
    fontSize: 15,
    fontFamily: 'Roboto-Medium',
    marginLeft: 5,
  },
});

export default styles;
