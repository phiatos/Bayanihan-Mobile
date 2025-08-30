import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { database } from '../configuration/firebaseConfig';
import { ref, push, serverTimestamp } from 'firebase/database';
import { checkAuthState } from '../utils/sessionUtils';

export const useLogSubmission = () => {
  const { user: currentUser } = useContext(AuthContext);

  const logSubmission = async (collection, data, submissionId = null) => {
    try {
      const uid = await checkAuthState();
      if (!uid) {
        console.error(`[${new Date().toISOString()}] Cannot log submission: No Firebase authenticated user`);
        return;
      }
      if (!database || !currentUser) {
        console.error(`[${new Date().toISOString()}] Cannot log submission: Database or user not initialized`, {
          database: !!database,
          user: currentUser,
        });
        return;
      }
      if (uid !== currentUser.id) {
        console.warn(`[${new Date().toISOString()}] UID mismatch: Firebase Auth UID (${uid}) does not match AuthContext UID (${currentUser.id})`);
      }

      const submissionData = {
        collection,
        data,
        timestamp: serverTimestamp(),
      };
      if (submissionId) {
        submissionData.submissionId = submissionId;
      }
      await push(ref(database, `submission_history/${currentUser.id}`), submissionData);
      console.log(`[${new Date().toISOString()}] Submission logged to ${collection} ${submissionId ? `with submissionId: ${submissionId}` : ''}`);
    } catch (error) {
      console.error(`[${new Date().toISOString()}] Error logging submission:`, error);
    }
  };

  return logSubmission;
};