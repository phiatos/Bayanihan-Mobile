import { StyleSheet, Platform, StatusBar } from 'react-native';
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

  // New style for the ScrollView contentContainerStyle
  scrollViewContent: {
    paddingVertical: spacing.small, // Add some vertical padding to the scrollable content
    // We remove the overall container padding as sections have their own horizontal margins
    // and this ScrollView is now the main content wrapper.
  },

  section: {
    marginVertical: spacing.small,
    marginHorizontal: spacing.medium, // Retain horizontal margin for sections
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
    flexWrap: 'wrap',
  },
  output: {
    marginRight: spacing.xsmall,
    marginBottom: spacing.xsmall,
    textAlign: 'left',
    color: Theme.colors.primary,
    fontFamily: 'Poppins_Regular',
    fontSize: 13,
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

  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: spacing.small,
  },
  checkboxBox: {
    width: 24,
    height: 24,
    borderRadius: borderRadius.small,
    borderWidth: borderWidth.thin,
    borderColor: Theme.colors.primary,
    marginRight: spacing.small,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Theme.colors.white,
  },
  checkmark: {
    fontSize: 24,
    color: Theme.colors.white,
    backgroundColor: Theme.colors.primary,
    lineHeight: 24,
  },
  checkboxLabel: {
    flex: 1,
    fontSize: 14,
    color: Theme.colors.black,
    fontFamily: 'Poppins_Regular',
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
    marginBottom: spacing.large,
  },
  buttonText: {
    color: Theme.colors.white,
    textAlign: 'center',
    fontFamily: 'Poppins_SemiBold',
    fontSize: 16,
  },
});