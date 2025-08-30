import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { database } from '../configuration/firebaseConfig';
import { ref, push, serverTimestamp } from 'firebase/database';
import { checkAuthState } from '../utils/sessionUtils';

export const useLogActivity = () => {
  const { user: currentUser } = useContext(AuthContext);

  const logActivity = async (message, submissionId = null) => {
    try {
      const uid = await checkAuthState();
      if (!uid) {
        console.error(`[${new Date().toISOString()}] Cannot log activity: No Firebase authenticated user`);
        return;
      }
      if (!database || !currentUser) {
        console.error(`[${new Date().toISOString()}] Cannot log activity: Database or user not initialized`, {
          database: !!database,
          user: currentUser,
        });
        return;
      }
      if (uid !== currentUser.id) {
        console.warn(`[${new Date().toISOString()}] UID mismatch: Firebase Auth UID (${uid}) does not match AuthContext UID (${currentUser.id})`);
      }

      const activityData = {
        message,
        timestamp: serverTimestamp(),
      };
      if (submissionId) {
        activityData.submissionId = submissionId;
      }
      await push(ref(database, `activity_log/${currentUser.id}`), activityData);
      console.log(`[${new Date().toISOString()}] Activity logged: ${message} ${submissionId ? `with submissionId: ${submissionId}` : ''}`);
    } catch (error) {
      console.error(`[${new Date().toISOString()}] Error logging activity:`, error);
    }
  };

  return logActivity;
};