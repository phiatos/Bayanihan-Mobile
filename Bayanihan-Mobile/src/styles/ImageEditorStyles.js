import { StyleSheet } from 'react-native';
import Theme from '../constants/theme';

export default StyleSheet.create({
  editorContainer: {
    flex: 1,
    padding: 20,
    alignItems: 'center',
  },
  imagePreview: {
    width: '100%',
    height: 300,
    marginBottom: 20,
    borderRadius: 8,
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Theme.colors.black,
    marginVertical: 10,
  },
  sliderLabel: {
    fontSize: 14,
    color: Theme.colors.black,
    marginTop: 10,
  },
  slider: {
    width: '100%',
    height: 40,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 20,
  },
  cropButton: {
    backgroundColor: Theme.colors.primary,
    padding: 15,
    borderRadius: 8,
    flex: 1,
    marginRight: 10,
    alignItems: 'center',
  },
  skipButton: {
    backgroundColor: Theme.colors.accentBlue,
    padding: 15,
    borderRadius: 8,
    flex: 1,
    marginLeft: 10,
    alignItems: 'center',
  },
  buttonText: {
    color: Theme.colors.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
});