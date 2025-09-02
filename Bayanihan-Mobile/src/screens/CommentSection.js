import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, Alert, ToastAndroid, SafeAreaView, KeyboardAvoidingView, Platform, Keyboard } from 'react-native';
import { ref, get, push, remove, set, serverTimestamp, onValue } from 'firebase/database';
import { database } from '../configuration/firebaseConfig';
import { Ionicons } from '@expo/vector-icons';
import Theme from '../constants/theme';
import styles from '../styles/CommentSectionStyles';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Menu, MenuOptions, MenuOption, MenuTrigger, MenuProvider } from 'react-native-popup-menu';
import { LinearGradient } from 'expo-linear-gradient';
import GlobalStyles from '../styles/GlobalStyles';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { v4 as uuidv4 } from 'uuid';
import { logActivity, logSubmission } from '../components/logSubmission';

const CommentSection = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { postId, postData } = route.params || {};
  const { user } = useAuth();
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [replyToCommentId, setReplyToCommentId] = useState(null);
  const [replyToUsername, setReplyToUsername] = useState(null);
  const [userData, setUserData] = useState({ contactPerson: '', organization: '', firstName: '', lastName: '' });
  const commentInputRef = useRef(null);
  const flatListRef = useRef(null);
  const insets = useSafeAreaInsets();
  const HEADER_HEIGHT = 60

  const toSentenceCase = (str) => {
    if (!str) return 'post';
    return str.charAt(0).toUpperCase() + str.slice(1);
  };

  useEffect(() => {
    const fetchUserData = async () => {
      if (!user?.id) {
        console.error(`[${new Date().toISOString()}] No user logged in`);
        ToastAndroid.show('Please log in to view comments.', ToastAndroid.BOTTOM);
        navigation.navigate('Login');
        return;
      }

      try {
        console.log(`[${new Date().toISOString()}] Fetching user data for ID:`, user.id);
        console.log(`[${new Date().toISOString()}] User from useAuth:`, user);
        const cachedData = await AsyncStorage.getItem(`userData:${user.id}`);
        if (cachedData) {
          const data = JSON.parse(cachedData);
          console.log(`[${new Date().toISOString()}] User data from cache:`, data);
          setUserData(data);
          return;
        }

        const isAdmin = user.role === 'AB ADMIN' || user.isAdmin || false;
        if (user.contactPerson || user.firstName || user.lastName || user.organization) {
          const contactPerson = user.contactPerson && user.contactPerson !== 'Anonymous' && user.contactPerson !== 'Admin' 
            ? user.contactPerson 
            : `${user.firstName || ''} ${user.lastName || ''}`.trim() || (isAdmin ? 'Admin' : '');
          const organization = isAdmin ? 'Admin' : (user.organization || '');
          const data = {
            contactPerson,
            organization,
            firstName: user.firstName || '',
            lastName: user.lastName || '',
          };
          if (!user.contactPerson && !user.firstName && !user.lastName) {
            console.warn(`[${new Date().toISOString()}] AuthContext missing contactPerson, firstName, and lastName for user ${user.id}${isAdmin ? ' (Admin user)' : ''}`);
          }
          console.log(`[${new Date().toISOString()}] Using user data from AuthContext:`, data);
          await AsyncStorage.setItem(`userData:${user.id}`, JSON.stringify(data));
          setUserData(data);
          return;
        }

        if (!database) {
          console.error(`[${new Date().toISOString()}] Database not initialized in fetchUserData`);
          ToastAndroid.show('Database configuration error.', ToastAndroid.BOTTOM);
          setUserData({ 
            contactPerson: isAdmin ? 'Admin' : '', 
            organization: isAdmin ? ' ' : '',
            firstName: '',
            lastName: '',
          });
          return;
        }

        const userRef = ref(database, `users/${user.id}`);
        const snapshot = await get(userRef);
        if (snapshot.exists()) {
          const userDataRaw = snapshot.val() || {};
          console.log(`[${new Date().toISOString()}] Raw user data from Firebase:`, userDataRaw);
          const isAdmin = userDataRaw.role === 'AB ADMIN' || userDataRaw.isAdmin || false;
          const contactPerson = userDataRaw.contactPerson && userDataRaw.contactPerson !== 'Anonymous' && userDataRaw.contactPerson !== 'Admin' 
            ? userDataRaw.contactPerson 
            : `${userDataRaw.firstName || ''} ${userDataRaw.lastName || ''}`.trim() || (isAdmin ? 'Admin' : '');
          const organization = isAdmin ? ' ' : (userDataRaw.organization || userDataRaw.organisation || '');
          const data = { 
            contactPerson, 
            organization,
            firstName: userDataRaw.firstName || '',
            lastName: userDataRaw.lastName || '',
          };
          if (!userDataRaw.contactPerson && !userDataRaw.firstName && !userDataRaw.lastName && !userDataRaw.displayName) {
            console.warn(`[${new Date().toISOString()}] Firebase user data missing contactPerson, firstName, lastName, and displayName for ID: ${user.id}${isAdmin ? ' (Admin user)' : ''}`);
          }
          await AsyncStorage.setItem(`userData:${user.id}`, JSON.stringify(data));
          console.log(`[${new Date().toISOString()}] User data cached:`, data);
          setUserData(data);
        } else {
          console.warn(`[${new Date().toISOString()}] No user document found for ID:`, user.id);
          const isAdmin = user.role === 'AB ADMIN' || user.isAdmin || false;
          const contactPerson = user.contactPerson && user.contactPerson !== 'Anonymous' && user.contactPerson !== 'Admin' 
            ? user.contactPerson 
            : `${user.firstName || ''} ${user.lastName || ''}`.trim() || (isAdmin ? 'Admin' : '');
          const organization = isAdmin ? ' ' : (user.organization || '');
          const data = { 
            contactPerson,
            organization,
            firstName: user.firstName || '',
            lastName: user.lastName || '',
          };
          await AsyncStorage.setItem(`userData:${user.id}`, JSON.stringify(data));
          setUserData(data);
        }
      } catch (error) {
        console.error(`[${new Date().toISOString()}] Error fetching user data:`, error.message, error.code || 'N/A');
        ToastAndroid.show('Failed to load user data.', ToastAndroid.BOTTOM);
        const isAdmin = user.role === 'AB ADMIN' || user.isAdmin || false;
        setUserData({ 
          contactPerson: isAdmin ? 'Admin' : '', 
          organization: isAdmin ? '' : '',
          firstName: '',
          lastName: '',
        });
      }
    };

    fetchUserData();
  }, [user, navigation]);

  useEffect(() => {
    if (!database) {
      console.error(`[${new Date().toISOString()}] Database not initialized`);
      ToastAndroid.show('Database configuration error.', ToastAndroid.BOTTOM);
      navigation.goBack();
      return;
    }

    if (!postId) {
      console.error(`[${new Date().toISOString()}] Invalid postId`);
      ToastAndroid.show('Invalid post.', ToastAndroid.BOTTOM);
      navigation.goBack();
      return;
    }

    const commentsRef = ref(database, `posts/${postId}/comments`);
    let unsubscribe;

    if (typeof onValue === 'function') {
      unsubscribe = onValue(commentsRef, (snapshot) => {
        const commentsData = snapshot.val();
        console.log(`[${new Date().toISOString()}] Comments snapshot for post ${postId}:`, commentsData ? Object.keys(commentsData).length + ' comments' : 'no comments');
        if (commentsData) {
          const commentArray = Object.entries(commentsData).map(([id, comment]) => ({ id, ...comment }));
          console.log(`[${new Date().toISOString()}] Raw comment array:`, commentArray);
          const commentTree = buildCommentTree(commentArray);
          console.log(`[${new Date().toISOString()}] Comment tree:`, commentTree);
          setComments(commentTree);
        } else {
          setComments([]);
        }
      }, (error) => {
        console.error(`[${new Date().toISOString()}] Error loading comments for post ${postId}:`, error.message, error.code || 'N/A');
        ToastAndroid.show('Failed to load comments.', ToastAndroid.BOTTOM);
      });
    } else {
      console.error(`[${new Date().toISOString()}] onValue is not a function, falling back to get`);
      const fetchComments = async () => {
        try {
          const snapshot = await get(commentsRef);
          const commentsData = snapshot.val();
          console.log(`[${new Date().toISOString()}] Comments snapshot (via get) for post ${postId}:`, commentsData ? Object.keys(commentsData).length + ' comments' : 'no comments');
          if (commentsData) {
            const commentArray = Object.entries(commentsData).map(([id, comment]) => ({ id, ...comment }));
            const commentTree = buildCommentTree(commentArray);
            setComments(commentTree);
          } else {
            setComments([]);
          }
        } catch (error) {
          console.error(`[${new Date().toISOString()}] Error fetching comments with get for post ${postId}:`, error.message, error.code || 'N/A');
          ToastAndroid.show('Failed to load comments.', ToastAndroid.BOTTOM);
        }
      };
      fetchComments();
    }

    return () => {
      if (unsubscribe && typeof unsubscribe === 'function') {
        unsubscribe();
      }
    };
  }, [postId, navigation]);

  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener('keyboardDidShow', () => {
      if (flatListRef.current && comments.length > 0) {
        flatListRef.current.scrollToEnd({ animated: true });
      }
    });

    return () => {
      keyboardDidShowListener.remove();
    };
  }, [comments]);

  const buildCommentTree = (comments) => {
    console.log(`[${new Date().toISOString()}] Building comment tree with comments:`, comments);
    const tree = [];
    const lookup = {};

    comments.forEach((comment) => {
      lookup[comment.id] = { ...comment, replies: [] };
    });

    comments.forEach((comment, index) => {
      console.log(`[${new Date().toISOString()}] Processing comment ${index + 1}:`, comment);
      if (comment.parentCommentId && lookup[comment.parentCommentId]) {
        let parent = lookup[comment.parentCommentId];
        while (parent.parentCommentId && lookup[parent.parentCommentId]) {
          parent = lookup[parent.parentCommentId];
        }
        parent.replies.push(lookup[comment.id]);
        console.log(`[${new Date().toISOString()}] Added comment ${comment.id} as reply to top-level parent ${parent.id}`);
      } else if (!comment.parentCommentId) {
        tree.push(lookup[comment.id]);
        console.log(`[${new Date().toISOString()}] Added comment ${comment.id} to top-level tree`);
      } else {
        console.log(`[${new Date().toISOString()}] Comment ${comment.id} has invalid parentCommentId ${comment.parentCommentId}, treating as top-level`);
        tree.push(lookup[comment.id]);
      }
    });

    tree.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
    Object.values(lookup).forEach((comment) => {
      if (comment.replies) {
        comment.replies.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
      }
    });

    console.log(`[${new Date().toISOString()}] Final comment tree:`, tree);
    return tree;
  };

  const handleReplyClick = (commentId, username) => {
    setReplyToCommentId(commentId);
    setReplyToUsername(username || '');
    setNewComment(`@${username || ''} `);
    commentInputRef.current?.focus();
    if (flatListRef.current) {
      flatListRef.current.scrollToEnd({ animated: true });
    }
  };

  const handleAddComment = async () => {
    if (!user?.id) {
      console.error(`[${new Date().toISOString()}] No user logged in for adding comment`);
      ToastAndroid.show('Please log in to comment.', ToastAndroid.BOTTOM);
      navigation.navigate('Login');
      return;
    }

    if (!database) {
      console.error(`[${new Date().toISOString()}] Database not initialized in handleAddComment`);
      ToastAndroid.show('Database configuration error.', ToastAndroid.BOTTOM);
      navigation.goBack();
      return;
    }

    const commentText = newComment.trim();
    if (!commentText) {
      console.warn(`[${new Date().toISOString()}] Comment cannot be empty`);
      ToastAndroid.show('Comment cannot be empty.', ToastAndroid.BOTTOM);
      return;
    }
    if (!postId) {
      console.error(`[${new Date().toISOString()}] Invalid postId for adding comment`);
      ToastAndroid.show('Invalid post.', ToastAndroid.BOTTOM);
      return;
    }

    try {
      const commentsRef = ref(database, `posts/${postId}/comments`);
      const newCommentRef = push(commentsRef);
      const submissionId = newCommentRef.key;
      if (!submissionId) {
        throw new Error('Failed to generate submission ID for new comment');
      }

      let content = commentText;
      let taggedUsername = null;
      if (replyToUsername && commentText.startsWith(`@${replyToUsername}`)) {
        taggedUsername = replyToUsername;
        content = commentText.slice(`@${replyToUsername}`.length).trim();
      }
      const isAdmin = user.role === 'AB ADMIN' || user.isAdmin || false;
      const userName = userData.contactPerson && userData.contactPerson !== 'Anonymous' && userData.contactPerson !== 'Admin' 
        ? userData.contactPerson 
        : (userData.firstName || userData.lastName 
            ? `${userData.firstName || ''} ${userData.lastName || ''}`.trim() 
            : (isAdmin ? 'Admin' : ''));
      const organization = isAdmin ? '' : (userData.organization || '');
      if (isAdmin && !userData.contactPerson && !userData.firstName && !userData.lastName) {
        console.warn(`[${new Date().toISOString()}] Admin user ${user.id} has no valid contactPerson, firstName, or lastName; falling back to 'Admin'`);
      }
      const commentData = {
        userId: user.id,
        userName,
        organization,
        content: content || commentText,
        taggedUsername: taggedUsername,
        timestamp: serverTimestamp(),
        parentCommentId: replyToCommentId || null,
      };

      console.log(`[${new Date().toISOString()}] Preparing to log comment:`, {
        collection: 'comments',
        commentData,
        submissionId,
        organization,
      });

      await set(newCommentRef, commentData);
      await logActivity(user.id, `Added a comment to post ${postId}`, submissionId, organization);
      await logSubmission('comments', commentData, submissionId, organization);

      console.log(`[${new Date().toISOString()}] Comment ${submissionId} added to post ${postId}:`, commentData);
      setNewComment('');
      setReplyToCommentId(null);
      setReplyToUsername(null);
      commentInputRef.current?.clear();
      ToastAndroid.show('Comment posted.', ToastAndroid.BOTTOM);
      if (flatListRef.current) {
        setTimeout(() => {
          flatListRef.current.scrollToEnd({ animated: true });
        }, 100);
      }
    } catch (error) {
      console.error(`[${new Date().toISOString()}] Error adding comment to post ${postId}:`, error.message, error.code || 'N/A');
      ToastAndroid.show(`Failed to post comment: ${error.message}`, ToastAndroid.BOTTOM);
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (!user?.id) {
      console.error(`[${new Date().toISOString()}] No user logged in for deleting comment`);
      ToastAndroid.show('Please log in to delete a comment.', ToastAndroid.BOTTOM);
      return;
    }
    if (!database) {
      console.error(`[${new Date().toISOString()}] Database not initialized in handleDeleteComment`);
      ToastAndroid.show('Database configuration error.', ToastAndroid.BOTTOM);
      return;
    }
    if (!commentId || !postId) {
      console.error(`[${new Date().toISOString()}] Invalid commentId or postId:`, { commentId, postId });
      ToastAndroid.show('Invalid comment data.', ToastAndroid.BOTTOM);
      return;
    }

    try {
      const commentRef = ref(database, `posts/${postId}/comments/${commentId}`);
      const snapshot = await get(commentRef);
      const comment = snapshot.val();
      if (!comment || (user.id !== comment.userId && user.id !== postData?.userId)) {
        console.warn(`[${new Date().toISOString()}] Unauthorized attempt to delete comment ${commentId} by user ${user.id}`);
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
                let submissionId;
                try {
                  submissionId = uuidv4();
                } catch (uuidError) {
                  console.error(`[${new Date().toISOString()}] UUID generation error:`, uuidError.message);
                  submissionId = `fallback-${Date.now()}`;
                }

                const subCommentsSnapshot = await get(ref(database, `posts/${postId}/comments`));
                const commentsData = subCommentsSnapshot.val();
                const subComments = commentsData
                  ? Object.keys(commentsData).filter(key => commentsData[key].parentCommentId === commentId)
                  : [];

                const isAdmin = user.role === 'AB ADMIN' || user.isAdmin || false;
                const organization = isAdmin ? ' ' : (userData.organization || '');
                const deletionData = {
                  deletedCommentId: commentId,
                  deletedContent: comment.content,
                  userId: user.id,
                  postId,
                  timestamp: serverTimestamp(),
                };

                console.log(`[${new Date().toISOString()}] Preparing to log comment deletion:`, {
                  collection: 'comments',
                  deletionData,
                  submissionId,
                  organization,
                });

                if (subComments.length > 0) {
                  for (const subCommentId of subComments) {
                    await remove(ref(database, `posts/${postId}/comments/${subCommentId}`));
                    console.log(`[${new Date().toISOString()}] Sub-comment ${subCommentId} deleted`);
                  }
                }

                await remove(commentRef);
                await logActivity(user.id, `Deleted a comment from post ${postId}`, submissionId, organization);
                await logSubmission('comments', deletionData, submissionId, organization);

                console.log(`[${new Date().toISOString()}] Comment ${commentId} deleted from post ${postId}`);
                ToastAndroid.show('Comment deleted.', ToastAndroid.BOTTOM);
              } catch (error) {
                console.error(`[${new Date().toISOString()}] Error deleting comment ${commentId} from post ${postId}:`, error.message, error.code || 'N/A');
                ToastAndroid.show(`Failed to delete comment: ${error.message}`, ToastAndroid.BOTTOM);
              }
            },
          },
        ]
      );
    } catch (error) {
      console.error(`[${new Date().toISOString()}] Error checking comment authorization for ${commentId}:`, error.message, error.code || 'N/A');
      ToastAndroid.show('Failed to verify comment authorization.', ToastAndroid.BOTTOM);
    }
  };

  const renderCommentContent = (content, taggedUsername) => {
    if (taggedUsername) {
      return (
        <Text style={styles.commentContent}>
          <Text style={styles.usernameHighlight}>@{taggedUsername}</Text>
          {content ? ` ${content}` : ''}
        </Text>
      );
    }
    return <Text style={styles.commentContent}>{content}</Text>;
  };

const renderComment = ({ item }) => {
  if (!item) {
    console.error(`[${new Date().toISOString()}] Invalid comment item`);
    return null;
  }

  console.log(`[${new Date().toISOString()}] Rendering comment:`, item);
  const canDelete = user && (item.userId === user.id || postData?.userId === user.id);

  return (
    <View style={styles.commentContainer}>
      <View style={styles.commentHeader}>
        <View>
          <Text style={styles.commentUser}>{item.userName || ''}</Text>
          <View style={{ flexDirection: 'row' }}>
            <Text style={styles.commentMeta}>
              {item.organization ? `${item.organization} ` : ''} 
              {item.organization && ' • '}
            </Text>
            <Text style={styles.commentTime}>
              {item.timestamp
                ? new Date(item.timestamp).toLocaleString([], {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })
                : 'Just now'}
            </Text>
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
                  console.log(`[${new Date().toISOString()}] Delete comment clicked for:`, item.id);
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
      {renderCommentContent(item.content || item.text || 'No content', item.taggedUsername)}
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
            <View
              key={reply.id}
              style={[styles.replyContainer, { marginLeft: 20, borderLeftWidth: 2, borderLeftColor: Theme.colors.primary, paddingLeft: 10 }]}
            >
              <View style={styles.commentHeader}>
                <View>
                  <Text style={styles.commentUser}>{reply.userName || ''}</Text>
                  <View style={{ flexDirection: 'row' }}>
                    <Text style={styles.commentMeta}>
                      {reply.organization ? `${reply.organization} ` : ''} 
                      {reply.organization && ' • '}
                    </Text>
                    <Text style={styles.commentTime}>
                      {reply.timestamp
                        ? new Date(reply.timestamp).toLocaleString([], {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })
                        : 'Just now'}
                    </Text>
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
                          console.log(`[${new Date().toISOString()}] Delete comment clicked for:`, reply.id);
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
              {renderCommentContent(reply.content || reply.text || 'No content', reply.taggedUsername)}
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
      <SafeAreaView style={[GlobalStyles.container, { paddingTop: 0, paddingBottom: 0 }]}>
        <LinearGradient
          colors={['rgba(20, 174, 187, 0.4)', '#FFF9F0']}
          start={{ x: 1, y: 0.5 }}
          end={{ x: 1, y: 1 }}
          style={GlobalStyles.gradientContainer}
        >
          <View style={[GlobalStyles.newheaderContainer, { paddingTop: insets.top }]}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={GlobalStyles.headerMenuIcon}>
              <Ionicons name="arrow-back" size={32} color={Theme.colors.primary} />
            </TouchableOpacity>
            <Text style={[GlobalStyles.headerTitle, { color: Theme.colors.primary }]}>Comments</Text>
          </View>
        </LinearGradient>
        <View style={{ flex: 1, paddingTop: HEADER_HEIGHT + insets.top }}>
          <FlatList
            ref={flatListRef}
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
            contentContainerStyle={[styles.commentList, { paddingBottom: insets.bottom + 60 }]}
          />
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            keyboardVerticalOffset={Platform.OS === 'ios' ? insets.top + HEADER_HEIGHT : insets.bottom + 10}
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              backgroundColor: Theme.colors.lightBg,
            }}
          >
            <View style={[styles.commentInputContainer, {
              paddingBottom: insets.bottom + 10,
            }]}>
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
                    color={newComment.trim() ? Theme.colors.accent : Theme.colors.primary}
                  />
                </TouchableOpacity>
              </View>
            </View>
          </KeyboardAvoidingView>
        </View>
      </SafeAreaView>
    </MenuProvider>
  );
};

export default CommentSection;