import { StyleSheet } from 'react-native';

export default StyleSheet.create({
  container: {
    backgroundColor: '#FFF9F0',
    paddingBottom: 60,
  },
  header: {
    fontSize: 18,
    backgroundColor: '#4059A5',
    color: 'white',
    textAlign: 'center',
    paddingHorizontal: 10,
    width: '100%',
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    height: 92,
    paddingTop: 50,
    alignContent:'center',
  },
  menu: {
  position: 'absolute',
  top: 10,
  left: 10,
  zIndex: 100,
  padding: 40,
},
  subheader: {
    fontSize: 16,
    color: '#3D52A0',
    textAlign: 'center',
    marginVertical: 10,
    fontWeight: '600',
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
    fontWeight: '500',
    marginBottom: 10,
  },
  formTitle: {
    fontSize: 16,
    color: '#4059A5',
    marginBottom: 5,
    fontWeight: "bold",
  },
  input: {
    borderWidth: 1,
    borderColor: '#AAA',
    borderRadius: 10,
    padding: 10,
    marginBottom: 10,
    backgroundColor: 'white',
    fontSize: 16,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  requiredAsterisk: {           
    color: '#D32F2F',            
  },
   requiredInput: {            
   borderColor: '#D32F2F',            
  },
  button: {
    backgroundColor: '#00BCD4',
    padding: 15,
    borderRadius: 10,
    marginTop: 10,
  },
  buttonText: {
    color: 'white',
    fontWeight: '700',
    textAlign: 'center',            

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
    paddingVertical: 5, 
    paddingHorizontal:10,
    fontSize: 16, 
  },
  icon: {
    padding: 10, 
  },
  
});