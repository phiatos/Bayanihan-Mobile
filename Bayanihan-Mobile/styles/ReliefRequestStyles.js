import { StyleSheet } from 'react-native';

export default StyleSheet.create({
  container: {
    backgroundColor: '#FFF9F0',
    paddingBottom: 60,
  },
   header: {
    fontSize: 20,
    backgroundColor: '#4059A5',
    color: 'white',
    textAlign: 'center',
    paddingHorizontal: 10,
    width: '100%',
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    height: 90,
    paddingTop: 50,
    alignContent:'center',
    fontFamily: 'Poppins_Regular',  

  },
  menu: {
    position: 'absolute',
    top: 10,
    left: 10,
    zIndex: 100,
    padding: 40,
    color: 'white',
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
  },
  form: {
    marginVertical: 10,
    marginHorizontal: 15,
    borderWidth: 3,
    borderColor: '#4059A5',
    borderRadius: 8,
    padding: 10,
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
    fontWeight: '400'
  },
  button: {
    backgroundColor: '#00BCD4',
    padding: 16,
    borderRadius: 10,
    marginTop: 10,
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

  errorText: {
    color: 'red',
    fontSize: 12,
    marginLeft: 10,
},

  addButtonContainer: {
  flexDirection: 'row',
  justifyContent: 'flex-end',
  paddingHorizontal: 10,
},

addButton: {
  paddingVertical: 10,
  paddingHorizontal: 20,
  backgroundColor: '#00BCD4',
  borderRadius: 10,
},

addbuttonText: {
  color: 'white',
  textAlign: 'center',
  fontSize: 16,
  paddingHorizontal: 10,
  fontFamily: 'Poppins_SemiBold', 
},

addedItems:{
  fontFamily: 'Poppins_Medium',
  fontSize: 18,
  color: '#14AEBB',

},

  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
    paddingVertical: 10,
  },
  tableHeader: {
    textAlign: 'left',
    paddingLeft: 10,    
    fontFamily: 'Poppins_Bold',
    color: '#4059A5', 
  },
  tableCell: {
    textAlign: 'left',
    paddingLeft: 10,
    fontFamily: 'Poppins_Regular'
  },

  icon: {
    padding: 10, 
  },
  
});