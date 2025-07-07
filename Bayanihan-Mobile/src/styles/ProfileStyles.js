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
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingLeft: 10,
    flex: 1,
  },
  scrollViewContent: {
    marginTop: 20,
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },

  sectionTitle: {
    fontSize: 18,
    marginBottom: spacing.small,
    color: Theme.colors.primary,
    textAlign: 'center',
    fontFamily: 'Poppins_SemiBold',
  },

  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.small,
  },

  label: {
    width: '40%',
    color: Theme.colors.primary,
    fontFamily: 'Poppins_Bold',
    fontSize: 13,
    marginRight: spacing.xsmall,
  },

  outputContainer: {
    flex: 1,
    alignItems: 'flex-start',
    flexDirection: 'row',
  },

  output: {
    marginRight: spacing.xsmall,
    marginBottom: spacing.xsmall,
    textAlign: 'left',
    color: Theme.colors.black,
    fontFamily: 'Poppins_Regular',
    fontSize: 13,
    width: '100%',
  },


  submission: {
    marginHorizontal: spacing.large,
    marginBottom: spacing.xlarge,
  },

  button: {
    backgroundColor: Theme.colors.primary,
    padding: spacing.medium,
    borderRadius: borderRadius.large,
    marginTop: spacing.small,
    shadowColor: Theme.colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },

  buttonText: {
    color: Theme.colors.white,
    textAlign: 'center',
    fontFamily: 'Poppins_SemiBold',
    fontSize: 16,
  },

  strengthContainer: {
    marginTop: spacing.small,
    marginBottom: spacing.medium,
  },

  strengthText: {
    fontSize: 14,
    color: Theme.colors.primary,
    marginBottom: spacing.xsmall,
    fontFamily: 'Poppins_SemiBold',
  },

  strengthBarContainer: {
    height: 6,
    backgroundColor: '#E0E0E0',
    borderRadius: borderRadius.small,
    overflow: 'hidden',
    marginBottom: spacing.small,
  },

  strengthBar: {
    height: '100%',
    borderRadius: borderRadius.small,
  },

  checkText: {
    fontSize: 12,
    color: Theme.colors.black,
    marginBottom: spacing.xsmall,
    fontFamily: 'Poppins_Regular',
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  modalContainer: {
    width: '90%',
    backgroundColor: Theme.colors.white,
    borderRadius: borderRadius.large,
    padding: spacing.medium,
    maxHeight: '80%',
  },

  modalTitle: {
    fontSize: 20,
    color: Theme.colors.primary,
    textAlign: 'center',
    marginBottom: spacing.medium,
    fontFamily: 'Poppins_Bold',
  },

  modalContent: {
    maxHeight: '60%',
    marginBottom: spacing.medium,
  },

  modalText: {
    fontSize: 14,
    color: Theme.colors.black,
    fontFamily: 'Poppins_Regular',
  },

  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.medium,
  },

  checkbox: {
    marginRight: spacing.xsmall,
  },

  checkboxLabel: {
    fontSize: 14,
    color: Theme.colors.black,
    fontFamily: 'Poppins_Regular',
  },

  modalButton: {
    backgroundColor: Theme.colors.primary,
    padding: spacing.medium,
    borderRadius: borderRadius.large,
    alignItems: 'center',
  },

  modalButtonText: {
    color: Theme.colors.white,
    fontSize: 16,
    fontFamily: 'Poppins_SemiBold',
  },
  passwordInputField: {
    borderWidth: borderWidth.thin,
    borderColor: '#605D67',
    borderRadius: borderRadius.large,
    marginBottom: spacing.small,
    fontFamily: 'Poppins_Regular',
    color: Theme.colors.black,
  },
  input: {
    flex: 1,
    height: 50,
    color: '#000',
    fontSize: 14,
    paddingHorizontal: 15,
    fontFamily: 'Poppins_Regular'
  },

  passwordEyeIcon: {
    padding: 10, 
    position: 'absolute', 
    right: 5,
  },
});