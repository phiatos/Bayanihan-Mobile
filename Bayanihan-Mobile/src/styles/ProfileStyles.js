import { StyleSheet } from 'react-native';
import Theme from '../contants/theme';

export default StyleSheet.create({
  container: {
    backgroundColor: '#FFF9F0',
  },
 header: {
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'center', // centers the text
  backgroundColor: Theme.colors.primary,
  paddingHorizontal: 10,
  width: '100%',
  borderBottomLeftRadius: 20,
  borderBottomRightRadius: 20,
  height: 92,
  paddingTop: 50,
  position: 'relative', 
  elevation: 10
},

menuIcon: {
  position: 'absolute',
  left: 10,
  top: 50, // same as paddingTop in header to align vertically
},

headerText: {
  color: 'white',
  fontSize: 20,
  fontFamily: 'Poppins-Regular',
  textAlign: 'center',
},

  section: {
    marginVertical: 10,
    marginHorizontal: 15,
    borderWidth: 3,
    borderColor: '#4059A5',
    borderRadius: 8,
    padding: 10,
    backgroundColor: '#FFF9F0',
    
  },
  sectionTitle: {
    fontSize: 18,
    marginBottom: 10,
    color: '#4059A5',
    textAlign: 'center',
    fontFamily: 'Poppins_SemiBold',
  },
  infoRow: {
    flexDirection: 'row',
    flexWrap: 'wrap', 
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  label: {
    width: 150, 
    color: '#4059A5',
    fontFamily: 'Poppins_Bold',
    fontSize: 13
  },
  outputContainer: {
    flex: 1,
    alignItems: 'flex-start',
  },
  output: {
    flex: 1,
    textAlign: 'left',
    color: '#4059A5',
    fontFamily: 'Poppins_Regular',
    fontSize: 13,
    flexWrap: 'wrap',
  },
  input: {
    borderWidth: 1,
    borderColor: '#605D67',
    borderRadius: 10,
    padding: 10,
    marginBottom: 10,
    fontFamily: 'Poppins_Regular',
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 10,
  },
  checkboxBox: {
    width: 24,
    height: 24,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#14AEBB',
    marginRight: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    // Shadow for iOS
    shadowColor: '#14AEBB',
    shadowOffset: { width: 0, height: 24 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
    // Shadow for Android
    elevation: 5,
  },
  checkmark: {
    fontSize: 24,
    borderRadius: 3,
    color: 'white',
    backgroundColor: '#14AEBB',
  },
  checkboxLabel: {
    fontSize: 14,
    color: '#333',
  },
  submission: {
    marginHorizontal: 20,
  },
  button: {
    backgroundColor: '#00BCD4',
    padding: 15,
    borderRadius: 10,
    marginTop: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    marginBottom: 30,
  },
  buttonText: {
    color: 'white',
    textAlign: 'center',
    fontFamily: 'Poppins_SemiBold',
  },
});