import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, Alert, ToastAndroid, SafeAreaView, KeyboardAvoidingView, Platform } from 'react-native';
import { ref, onValue, push, remove, set, serverTimestamp } from 'firebase/database';
import { auth, database } from '../configuration/firebaseConfig';
import { Ionicons } from '@expo/vector-icons';
import Theme from '../constants/theme';
import styles from '../styles/CommentSectionStyles';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Menu, MenuOptions, MenuOption, MenuTrigger, MenuProvider } from 'react-native-popup-menu';
import { LinearGradient } from 'expo-linear-gradient';
import GlobalStyles from '../styles/GlobalStyles';
import AsyncStorage from '@react-native-async-storage/async-storage';

const CommentSection = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { postId, postData } = route.params || {};
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [replyToCommentId, setReplyToCommentId] = useState(null);
  const [replyToUsername, setReplyToUsername] = useState(null);
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState({ contactPerson: 'Anonymous', organization: '' });
  const commentInputRef = useRef(null);

  const toSentenceCase = (str) => {
    if (!str) return 'post';
    return str.charAt(0).toUpperCase() + str.slice(1);
  };

  useEffect(() => {
    if (!auth) {
      console.error('CommentSection: Auth is not initialized');
      ToastAndroid.show('Authentication not initialized.', ToastAndroid.BOTTOM);
      return;
    }

    const unsubscribe = auth.onAuthStateChanged(async (currentUser) => {
      console.log('CommentSection: Auth state changed, user:', currentUser ? currentUser.uid : 'null');
      setUser(currentUser);
      if (currentUser) {
        try {
          const data = await fetchUserData(currentUser.uid);
          setUserData(data);
          console.log('CommentSection: User data loaded:', data);
        } catch (error) {
          console.error('CommentSection: Error fetching user data:', error);
          ToastAndroid.show('Failed to load user data.', ToastAndroid.BOTTOM);
        }
      }
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!postId) {
      console.error('CommentSection: Invalid postId');
      ToastAndroid.show('Invalid post.', ToastAndroid.BOTTOM);
      navigation.goBack();
      return;
    }

    const commentsRef = ref(database, `posts/submitted/${postId}/comments`);
    const unsubscribe = onValue(commentsRef, (snapshot) => {
      const commentsData = snapshot.val();
      console.log(`CommentSection: Comments snapshot for post ${postId}:`, commentsData ? Object.keys(commentsData).length + ' comments' : 'no comments');
      if (commentsData) {
        const commentArray = Object.entries(commentsData).map(([id, comment]) => ({ id, ...comment }));
        console.log('CommentSection: Raw comment array:', commentArray);
        const commentTree = buildCommentTree(commentArray);
        console.log('CommentSection: Comment tree:', commentTree);
        setComments(commentTree);
      } else {
        setComments([]);
      }
    }, (error) => {
      console.error(`CommentSection: Error loading comments for post ${postId}:`, error);
      ToastAndroid.show('Failed to load comments.', ToastAndroid.BOTTOM);
    });

    return () => unsubscribe();
  }, [postId, navigation]);

  const fetchUserData = async (uid) => {
    try {
      const cachedData = await AsyncStorage.getItem(`userData:${uid}`);
      if (cachedData) {
        const data = JSON.parse(cachedData);
        console.log('CommentSection: User data from cache:', data);
        return data;
      }

      const userRef = ref(database, `users/${uid}`);
      const snapshot = await new Promise((resolve, reject) => {
        onValue(userRef, resolve, reject, { onlyOnce: true });
      });
      const userData = snapshot.val() || {};
      console.log('CommentSection: Raw user data from Firebase:', userData);
      const data = {
        contactPerson: userData.contactPerson || userData.displayName || 'Anonymous',
        organization: userData.organization || userData.organisation || '',
      };
      await AsyncStorage.setItem(`userData:${uid}`, JSON.stringify(data));
      console.log('CommentSection: User data cached:', data);
      return data;
    } catch (error) {
      console.error('CommentSection: Error fetching user data:', error);
      return { contactPerson: 'Anonymous', organization: '' };
    }
  };

  const buildCommentTree = (comments) => {
    console.log('CommentSection: Building comment tree with comments:', comments);
    const tree = [];
    const lookup = {};

    // Initialize lookup with all comments
    comments.forEach((comment) => {
      lookup[comment.id] = { ...comment, replies: [] };
    });

    // Process each comment
    comments.forEach((comment, index) => {
      console.log(`CommentSection: Processing comment ${index + 1}:`, comment);
      if (comment.parentCommentId && lookup[comment.parentCommentId]) {
        // Find the top-level parent for this comment
        let parent = lookup[comment.parentCommentId];
        while (parent.parentCommentId && lookup[parent.parentCommentId]) {
          parent = lookup[parent.parentCommentId];
        }
        // Add as reply to the top-level parent
        parent.replies.push(lookup[comment.id]);
        console.log(`CommentSection: Added comment ${comment.id} as reply to top-level parent ${parent.id}`);
      } else if (!comment.parentCommentId) {
        tree.push(lookup[comment.id]);
        console.log(`CommentSection: Added comment ${comment.id} to top-level tree`);
      } else {
        console.log(`CommentSection: Comment ${comment.id} has invalid parentCommentId ${comment.parentCommentId}, treating as top-level`);
        tree.push(lookup[comment.id]);
      }
    });

    // Sort top-level comments and replies
    tree.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
    Object.values(lookup).forEach((comment) => {
      if (comment.replies) {
        comment.replies.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
      }
    });

    console.log('CommentSection: Final comment tree:', tree);
    return tree;
  };

  const handleReplyClick = (commentId, username) => {
    setReplyToCommentId(commentId);
    setReplyToUsername(username || 'Anonymous');
    setNewComment(`@${username || 'Anonymous'} `);
    commentInputRef.current?.focus();
  };

  const handleAddComment = async () => {
    if (!user) {
      ToastAndroid.show('Please log in to comment.', ToastAndroid.BOTTOM);
      navigation.navigate('Login');
      return;
    }

    const commentText = newComment.trim();
    if (!commentText) {
      ToastAndroid.show('Comment cannot be empty.', ToastAndroid.BOTTOM);
      return;
    }
    if (!postId) {
      console.error('CommentSection: Invalid postId for adding comment');
      ToastAndroid.show('Invalid post.', ToastAndroid.BOTTOM);
      return;
    }

    try {
      const commentsRef = ref(database, `posts/submitted/${postId}/comments`);
      const newCommentRef = push(commentsRef);
      const commentData = {
        userId: user.uid,
        userName: userData.contactPerson,
        organization: userData.organization,
        content: commentText,
        timestamp: serverTimestamp(),
        parentCommentId: replyToCommentId || null,
      };
      await set(newCommentRef, commentData);
      console.log(`CommentSection: Comment added to post ${postId}:`, commentData);
      setNewComment('');
      setReplyToCommentId(null);
      setReplyToUsername(null);
      commentInputRef.current?.clear();
      ToastAndroid.show('Comment posted.', ToastAndroid.BOTTOM);
    } catch (error) {
      console.error(`CommentSection: Error adding comment to post ${postId}:`, error);
      ToastAndroid.show('Failed to post comment: ' + error.message, ToastAndroid.BOTTOM);
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (!user) {
      ToastAndroid.show('Please log in to delete a comment.', ToastAndroid.BOTTOM);
      return;
    }
    if (!commentId || !postId) {
      console.error('CommentSection: Invalid commentId or postId:', { commentId, postId });
      ToastAndroid.show('Invalid comment data.', ToastAndroid.BOTTOM);
      return;
    }

    try {
      const commentRef = ref(database, `posts/submitted/${postId}/comments/${commentId}`);
      const snapshot = await new Promise((resolve, reject) => {
        onValue(commentRef, resolve, reject, { onlyOnce: true });
      });
      const comment = snapshot.val();
      if (!comment || (user.uid !== comment.userId && user.uid !== postData?.userId)) {
        ToastAndroid.show('You are not authorized to delete this comment.', ToastAndroid.BOTTOM);
        return;
      }

      Alert.alert(
        'Delete Comment',
        'Are you sure you want to delete this comment and its replies?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Delete',
            style: 'destructive',
            onPress: async () => {
              try {
                const subCommentsSnapshot = await new Promise((resolve, reject) => {
                  onValue(
                    ref(database, `posts/submitted/${postId}/comments`),
                    snapshot => {
                      const comments = snapshot.val();
                      if (comments) {
                        const subComments = Object.keys(comments).filter(
                          key => comments[key].parentCommentId === commentId
                        );
                        resolve({ val: () => subComments });
                      } else {
                        resolve({ val: () => ({}) });
                      }
                    },
                    reject,
                    { onlyOnce: true }
                  );
                });
                const subComments = subCommentsSnapshot.val();
                if (subComments && Object.keys(subComments).length > 0) {
                  for (const subCommentId of Object.keys(subComments)) {
                    await remove(ref(database, `posts/submitted/${postId}/comments/${subCommentId}`));
                  }
                }

                await remove(commentRef);
                console.log(`CommentSection: Comment ${commentId} deleted from post ${postId}`);
                ToastAndroid.show('Comment deleted.', ToastAndroid.BOTTOM);
              } catch (error) {
                console.error(`CommentSection: Error deleting comment ${commentId} from post ${postId}:`, error);
                ToastAndroid.show('Failed to delete comment: ' + error.message, ToastAndroid.BOTTOM);
              }
            },
          },
        ]
      );
    } catch (error) {
      console.error(`CommentSection: Error checking comment authorization for ${commentId}:`, error);
      ToastAndroid.show('Failed to verify comment authorization.', ToastAndroid.BOTTOM);
    }
  };

  const renderCommentContent = (content) => {
    const usernameMatch = content.match(/^@([^\s]+)\s*/);
    if (usernameMatch) {
      const username = usernameMatch[0];
      const restOfContent = content.slice(username.length);
      return (
        <Text style={styles.commentContent}>
          <Text style={styles.usernameHighlight}>{username}</Text>
          {restOfContent}
        </Text>
      );
    }
    return <Text style={styles.commentContent}>{content}</Text>;
  };

  const renderComment = ({ item }) => {
    if (!item) {
      console.error('CommentSection: Invalid comment item');
      return null;
    }

    console.log('CommentSection: Rendering comment:', item);
    const canDelete = user && (item.userId === user.uid || postData?.userId === user.uid);

    return (
      <View style={styles.commentContainer}>
        <View style={styles.commentHeader}>
          <View>
            <Text style={styles.commentUser}>{item.userName || 'Anonymous'}</Text>
            <View style={{ flexDirection: 'row' }}>
              <Text style={styles.commentMeta}>
                {item.organization || 'No organization'} • 
              </Text>
              <Text style={styles.commentTime}>{item.timestamp ? new Date(item.timestamp).toLocaleString() : 'Just now'}</Text>
            </View>
          </View>
          {canDelete && (
            <Menu>
              <MenuTrigger customStyles={{ triggerTouchable: styles.menuTrigger }}>
                <Ionicons name="ellipsis-vertical" size={16} color={Theme.colors.black} />
              </MenuTrigger>
              <MenuOptions customStyles={{ optionsContainer: styles.menuContainer }}>
                <MenuOption
                  onSelect={() => {
                    console.log('CommentSection: Delete comment clicked for:', item.id);
                    handleDeleteComment(item.id);
                  }}
                  text="Delete Comment"
                  customStyles={{
                    optionText: [styles.menuText, { color: Theme.colors.red }],
                  }}
                />
              </MenuOptions>
            </Menu>
          )}
        </View>
        {renderCommentContent(item.content || item.text || 'No content')}
        <View style={styles.commentActions}>
          <TouchableOpacity
            style={styles.replyButton}
            onPress={() => handleReplyClick(item.id, item.userName)}
          >
            <Ionicons name="chatbubbles-outline" size={20} color={Theme.colors.blue} />
            <Text style={styles.replyText}>Reply</Text>
          </TouchableOpacity>
        </View>
        {item.replies && item.replies.length > 0 && (
          <View style={styles.repliesWrapper}>
            {item.replies.map((reply) => (
              <View key={reply.id} style={[styles.replyContainer, { marginLeft: 20, borderLeftWidth: 2, borderLeftColor: Theme.colors.primary, paddingLeft: 10 }]}>
                <View style={styles.commentHeader}>
                  <View>
                    <Text style={styles.commentUser}>{reply.userName || 'Anonymous'}</Text>
                    <View style={{ flexDirection: 'row' }}>
                      <Text style={styles.commentMeta}>
                        {reply.organization || 'No organization'} • 
                      </Text>
                      <Text style={styles.commentTime}>{reply.timestamp ? new Date(reply.timestamp).toLocaleString() : 'Just now'}</Text>
                    </View>
                  </View>
                  {canDelete && (
                    <Menu>
                      <MenuTrigger customStyles={{ triggerTouchable: styles.menuTrigger }}>
                        <Ionicons name="ellipsis-vertical" size={16} color={Theme.colors.black} />
                      </MenuTrigger>
                      <MenuOptions customStyles={{ optionsContainer: styles.menuContainer }}>
                        <MenuOption
                          onSelect={() => {
                            console.log('CommentSection: Delete comment clicked for:', reply.id);
                            handleDeleteComment(reply.id);
                          }}
                          text="Delete Comment"
                          customStyles={{
                            optionText: [styles.menuText, { color: Theme.colors.red }],
                          }}
                        />
                      </MenuOptions>
                    </Menu>
                  )}
                </View>
                {renderCommentContent(reply.content || reply.text || 'No content')}
                <View style={styles.commentActions}>
                  <TouchableOpacity
                    style={styles.replyButton}
                    onPress={() => handleReplyClick(reply.id, reply.userName)}
                  >
                    <Ionicons name="chatbubbles-outline" size={20} color={Theme.colors.blue} />
                    <Text style={styles.replyText}>Reply</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        )}
      </View>
    );
  };

  return (
    <MenuProvider>
      <SafeAreaView style={GlobalStyles.container}>
        <LinearGradient
          colors={['rgba(20, 174, 187, 0.4)', '#FFF9F0']}
          start={{ x: 1, y: 0.5 }}
          end={{ x: 1, y: 1 }}
          style={GlobalStyles.gradientContainer}
        >
          <View style={GlobalStyles.newheaderContainer}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={GlobalStyles.headerMenuIcon}>
              <Ionicons name="arrow-back" size={32} color={Theme.colors.primary} />
            </TouchableOpacity>
            <Text style={[GlobalStyles.headerTitle, { color: Theme.colors.primary }]}>Comments</Text>
          </View>
        </LinearGradient>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1, marginTop: 80 }}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 0}
        >
          <FlatList
            data={comments}
            renderItem={renderComment}
            keyExtractor={(item) => item.id.toString()}
            ListEmptyComponent={
              <View style={styles.emptyCommentContainer}>
                <Ionicons name="chatbubble-outline" size={50} color={Theme.colors.primary} />
                <Text style={styles.emptyCommentText}>
                  Be the first to reply in this {toSentenceCase(postData?.category || 'post')}
                </Text>
              </View>
            }
            contentContainerStyle={styles.commentList}
          />
          <View style={styles.commentInputContainer}>
            <View style={styles.inputWrapper}>
              <TextInput
                ref={commentInputRef}
                style={[styles.commentInput, { paddingRight: 40 }]}
                placeholder={replyToUsername ? `Reply to ${replyToUsername}...` : 'Add a comment...'}
                value={newComment}
                onChangeText={setNewComment}
                multiline
                maxLength={500}
              />
              <TouchableOpacity
                style={styles.inputSendButton}
                onPress={handleAddComment}
                disabled={!newComment.trim()}
              >
                <Ionicons
                  name="send"
                  size={20}
                  color={Theme.colors.primary}
                />
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </MenuProvider>
  );
};

export default CommentSection;