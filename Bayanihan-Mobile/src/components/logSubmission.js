import { database, auth } from '../configuration/firebaseConfig';
import { ref, push, serverTimestamp } from 'firebase/database';

export const logSubmission = async (collection, data, submissionId = null) => {
  const user = auth.currentUser;
  if (!database || !user) {
    console.error(`[${new Date().toISOString()}] Cannot log submission: Database or user not initialized`);
    return;
  }
  try {
    const submissionData = {
      collection,
      data,
      timestamp: serverTimestamp(),
    };
    if (submissionId) {
      submissionData.submissionId = submissionId;
    }
    await push(ref(database, `submission_history/${user.uid}`), submissionData);
    console.log(`[${new Date().toISOString()}] Submission logged to ${collection} ${submissionId ? `with submissionId: ${submissionId}` : ''}`);
  } catch (error) {
    console.error(`[${new Date().toISOString()}] Error logging submission:`, error);
  }
};