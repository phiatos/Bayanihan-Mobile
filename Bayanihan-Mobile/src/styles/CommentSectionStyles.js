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

const STATUS_BAR_HEIGHT = Platform.OS === 'ios' ? 20 : StatusBar.currentHeight;

export default StyleSheet.create({
  commentSection: {
    flex: 1,
    paddingHorizontal: spacing.medium,
  },
  commentInputContainer: {
    
    padding: spacing.medium,
    backgroundColor: Theme.colors.lightBg,
    borderTopWidth: 1,
    borderTopColor: '#b9b9b9',
    zIndex: 1000,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: borderRadius.xlarge,
    borderColor: '#b9b9b9',
    backgroundColor: 'transparent',
    paddingHorizontal: spacing.small,
  },
  commentInput: {
    flex: 1,
    fontFamily: 'Poppins_Regular',
    fontSize: 14,
    color: Theme.colors.black,
    paddingVertical: spacing.small,
    paddingHorizontal: spacing.medium,
    justifyContent: 'center',
  },
  inputSendButton: {
    position: 'absolute',
    right: 10,
    top: '50%',
    transform: [{ translateY: -10 }],
  },
  commentButton: {
    marginLeft: spacing.small,
    padding: spacing.small,
    borderRadius: borderRadius.xlarge,
    backgroundColor: Theme.colors.lightGrey,
  },
  commentButtonActive: {
    backgroundColor: Theme.colors.lightBlue,
  },
  commentContainer: {
    marginBottom: spacing.medium,
    padding: spacing.medium,
    backgroundColor: Theme.colors.white,
    borderRadius: borderRadius.medium,
    marginHorizontal: 10,
    elevation: 5,
    shadowColor: Theme.colors.black,
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
  commentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xsmall,
  },
  commentUser: {
    fontFamily: 'Poppins_SemiBold',
    fontSize: 14,
    color: Theme.colors.accent,
  },
  commentMeta: {
    fontFamily: 'Poppins_Regular',
    fontSize: 12,
    color: Theme.colors.grey,
  },
  commentTime: {
    fontFamily: 'Poppins_Regular',
    fontSize: 12,
    color: Theme.colors.grey,
    marginLeft: spacing.xsmall,
  },
  commentContent: {
    fontFamily: 'Poppins_Regular',
    fontSize: 14,
    color: Theme.colors.black,
    marginTop: spacing.xsmall,
  },
  usernameHighlight: {
    fontFamily: 'Poppins_SemiBold',
    fontSize: 14,
    color: Theme.colors.primary,
  },
  commentList: {
    paddingTop: spacing.large,
    paddingBottom: spacing.large + 60, 
  },
  emptyCommentContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    alignContent: 'center',
    marginTop: spacing.xlarge * 3,
  },
  emptyCommentText: {
    fontFamily: 'Poppins_Regular',
    fontSize: 16,
    color: Theme.colors.primary,
    textAlign: 'center',
    marginTop: spacing.medium,
  },
  commentActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: spacing.xsmall,
  },
  replyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.xsmall,
  },
  replyText: {
    fontFamily: 'Poppins_Regular',
    fontSize: 12,
    color: Theme.colors.blue,
    marginLeft: spacing.xsmall,
  },
  replyContainer: {
    marginTop: spacing.small,
    paddingVertical: spacing.small,
  },
  repliesWrapper: {
    marginTop: spacing.small,
  },
  menuContainer: {
    backgroundColor: Theme.colors.white,
    borderRadius: borderRadius.medium,
    padding: spacing.small,
    minWidth: 150,
    shadowColor: Theme.colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
  },
  menuTrigger: {
    padding: spacing.xsmall,
  },
  menuText: {
    fontFamily: 'Poppins_Regular',
    fontSize: 14,
    color: Theme.colors.black,
    paddingVertical: spacing.xsmall,
    paddingHorizontal: spacing.medium,
  },
});