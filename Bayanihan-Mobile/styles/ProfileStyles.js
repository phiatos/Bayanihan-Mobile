import { StyleSheet } from 'react-native';

export default StyleSheet.create({
    text:{
        fontFamily: 'Poppins_400Regular',
    },
  container: {
    backgroundColor: '#f5f5f5',
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
    fontFamily: 'Poppins_400Regular',

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
    marginHorizontal: 15,
    borderWidth: 3,
    borderColor: '#4059A5',
    borderRadius: 8,
    padding: 10,
    backgroundColor: '#FFF9F0',
    fontFamily: 'Poppins_400Regular',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#4059A5',
    textAlign: 'center',
    fontFamily: 'Poppins_400Regular',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
    fontFamily: 'Poppins_400Regular',
  },
  label: {
    fontWeight: 'bold',
    flexShrink: 0,
    color: '#4059A5',
    paddingRight: 20,
  },
  output: {
    textAlign: 'right',
    color: '#4059A5'
  },
  input: {
    borderWidth: 1,
    borderColor: '#605D67',
    borderRadius: 5,
    padding: 10,
    marginBottom: 10,
  },
  checkboxContainer: {
  flexDirection: 'row',
  alignItems: 'center',
  marginVertical: 10,
},

checkboxBox: {
  width: 20,
  height: 20,
  borderWidth: 1,
  borderColor: '#333',
  marginRight: 10,
  alignItems: 'center',
  justifyContent: 'center',
},

checkmark: {
  fontSize: 14,
  color: '#333',
},

checkboxLabel: {
  fontSize: 14,
  color: '#333',
},
submission:{
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
  },
  buttonText: {
    color: 'white',
    fontWeight: '700',
    textAlign: 'center',            

  },
});