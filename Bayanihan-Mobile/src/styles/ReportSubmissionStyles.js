import { StyleSheet } from 'react-native';
import Theme from '../contants/theme';


export default StyleSheet.create({
 container: {
    backgroundColor: '#FFF9F0',
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
  paddingTop: 50,
  position: 'relative', 
  elevation: 10
},

menuIcon: {
  position: 'absolute',
  left: 10,
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
    color: '#3D52A0',
    textAlign: 'center',
    marginVertical: 10,
    fontFamily: 'Poppins_Regular', 
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
  form: {
    marginBottom: 30
  },
  sectionTitle: {
   fontSize: 20,
    color: '#14AEBB',
    marginBottom: 10,
    fontFamily: 'Poppins_Regular', 
  },
 formTitle: {
    fontSize: 13,
    color: '#4059A5',
    marginBottom: 5,
    fontFamily: 'Poppins_Bold',
  },
  input: {
    borderWidth: 1,
    borderColor: '#AAA',
    borderRadius: 10,
    padding: 10,
    marginBottom: 10,
    backgroundColor: 'white',
    fontSize: 14,
    fontFamily: 'Poppins_Regular', 
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
   requiredInput: {            
   borderColor: '#D32F2F',            
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