import { database, auth } from '../configuration/firebaseConfig';
import { ref, push, serverTimestamp } from 'firebase/database';

export const logActivity = async (message, submissionId = null) => {
  const user = auth.currentUser;
  if (!database || !user) {
    console.error(`[${new Date().toISOString()}] Cannot log activity: Database or user not initialized`);
    return;
  }
  try {
    const activityData = {
      message,
      timestamp: serverTimestamp(),
    };
    if (submissionId) {
      activityData.submissionId = submissionId;
    }
    await push(ref(database, `activity_log/${user.uid}`), activityData);
    console.log(`[${new Date().toISOString()}] Activity logged: ${message} ${submissionId ? `with submissionId: ${submissionId}` : ''}`);
  } catch (error) {
    console.error(`[${new Date().toISOString()}] Error logging activity:`, error);
  }
};