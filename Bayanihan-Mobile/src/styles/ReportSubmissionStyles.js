import { StyleSheet } from 'react-native';
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

export default StyleSheet.create({
 container: {
    backgroundColor: '#FFFFFF',
  },
 header: {
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'center', 
  backgroundColor: Theme.colors.primary,
  paddingHorizontal: 10,
  width: '100%',
  borderBottomLeftRadius: 20,
  borderBottomRightRadius: 20,
  height: 92,
  paddingTop: 40,
  position: 'relative', 
  elevation: 10
},

menuIcon: {
  position: 'absolute',
  left: 30,
  top: 50, 
},
headerText: {
  color: 'white',
  fontSize: 20,
  fontFamily: 'Poppins-Regular',
  textAlign: 'center',
},

  subheader: {
    fontSize: 16,
    color: '#14AEBB',
    textAlign: 'center',
    marginVertical: 10,
    fontFamily: 'Poppins_Regular', 
  },
  section: {
    marginVertical: 10,
    marginHorizontal: 15,
    borderWidth: 3,
    borderColor: '#14AEBB',
    borderRadius: 8,
    padding: 10,
    backgroundColor: '#FFF9F0',
  },

  form: {
    marginBottom: 30
  },

  formTitle: {
    fontSize: 13,
    color: '#14AEBB',
    marginBottom: 5,
    fontFamily: 'Poppins_Bold',
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

  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },

   requiredInput: {            
    borderColor: '#D32F2F',  
    fontWeight: '400'         
  },

    errorText: {
    color: 'red',
    fontSize: 12,
    marginLeft: 10,
},

  button: {
    backgroundColor: '#00BCD4',
    padding: 15,
    borderRadius: 10,
    marginTop: 10,
    marginHorizontal: 10,

  },
  buttonText: {
    color: 'white',
    textAlign: 'center',  
    fontSize: 15,          
    fontFamily: 'Poppins_Bold' 
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#AAA', 
    borderRadius: 10, 
    backgroundColor: '#fff',
    marginBottom: 10,            
  },
  dateInput: {
    flex: 1,
    borderWidth: 0,
    paddingHorizontal:10,
    fontSize: 16,
    backgroundColor: 'white',
    fontSize: 14,
    fontFamily: 'Poppins_Regular',
  },
  icon: {
    padding: 10, 
  },
  
});