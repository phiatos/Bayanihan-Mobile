import { StyleSheet, Platform, StatusBar, Dimensions } from 'react-native';
import Theme from '../constants/theme';

export default StyleSheet.create({

// Transaction Screen
  historyItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    flex:1
  },
  historyTimeText: {
    fontSize: 15,
    fontFamily: 'Poppins_Bold'
  },
  historyMessage:{
    width: '50%'
  },
    historyMessageText: {
    fontSize: 13,
    fontFamily: 'Poppins_Regular'
  },
  viewButton: {
    borderWidth:1,
    borderColor: Theme.colors.accent,
    padding: 8,
    borderRadius: 10,
    elevation: 5,
    backgroundColor: Theme.colors.lightBg
  },
  viewButtonText: {
    color: Theme.colors.accent,
    fontSize: 13,
    fontFamily: 'Poppins_Regular'
  },
  scrollViewContent: {
    flexGrow: 1,
    paddingBottom: 20,
  },
  loadMoreButton: {
    backgroundColor: Theme.colors.primary,
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
    margin: 10,
  },
  loadMoreText: {
    color: Theme.colors.white,
    fontSize: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: Theme.colors.lightBg,
    borderRadius: 10,
    padding: 20,
    width: '80%',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 18,
    marginBottom: 10,
    color: Theme.colors.primary,
    fontFamily: 'Poppins_Bold'
  },
  modalText: {
    fontSize: 14,
    marginBottom: 10,
    fontFamily: 'Poppins_Regular'
  },
  modalButton: {
    backgroundColor: '#007AFF',
    padding: 10,
    borderRadius: 5,
    marginTop: 10,
  },
  modalDetailKey:{
    fontFamily: 'Poppins_Bold',
    fontSize: 16,
    paddingTop: 10,
    color: Theme.colors.black
  },
  modalDetailValue:{
    fontFamily: 'Poppins_Regular',
    
  },
  noActivity:{
    justifyContent: 'center',
    textAlign: 'center',
    alignItems: 'center',
    fontSize: 15,
    fontFamily:'Poppins_Medium'
  },

// Transaction Details
  contentContainer: {
    flex: 1,
    padding: 10,
    marginTop: 100,
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 10,
    color: Theme.colors.accent,
    fontFamily: 'Poppins_Medium'
  },
  detailContainer: {
    flex: 1,
  },
  detailRow: {
    flexDirection: 'row',
    marginBottom: 5,
  },
  detailKey: {
    width: 150,
    fontSize: 14,
    color: Theme.colors.black,
    fontFamily: 'Poppins_Bold'
  },
  detailValue: {
    flex: 1,
    fontSize: 14,
    fontFamily: 'Poppins_Regular',
  },
  imageContainer: {
    marginBottom: 10,
  },
  image: {
    width: '100%',
    height: '80%',
    marginTop: 5,
  },


  
});