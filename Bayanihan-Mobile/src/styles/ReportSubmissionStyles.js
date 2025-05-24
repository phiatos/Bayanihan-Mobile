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
    flex: 1,
    backgroundColor: Theme.colors.lightBg,
  },

  scrollViewContent: {
    paddingVertical: spacing.small, 
  },

  section: {
    marginVertical: spacing.small,
    marginHorizontal: spacing.medium,
    borderWidth: borderWidth.thick,
    borderColor: Theme.colors.primary,
    borderRadius: borderRadius.medium,
    padding: spacing.small,
    backgroundColor: Theme.colors.lightBg,
    shadowColor: Theme.colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,  
  },

  sectionTitle: {
    fontSize: 18,
    marginBottom: spacing.small,
    color: Theme.colors.primary,
    textAlign: 'center',
    fontFamily: 'Poppins_SemiBold',
  },

  form: {
    marginBottom: 30
  },

  formTitle: {
    fontSize: 13,
    color: Theme.colors.primary,
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