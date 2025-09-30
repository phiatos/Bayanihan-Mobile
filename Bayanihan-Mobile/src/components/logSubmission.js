import { ref, push, set, serverTimestamp } from 'firebase/database';
import { database } from '../configuration/firebaseConfig';

export const logActivity = async (message, submissionId, userId, organizationName) => {
  if (!message || !submissionId || !userId) {
    console.error(`[${new Date().toISOString()}] logActivity: Missing required parameters`, {
      userId,
      message,
      submissionId,
    });
    throw new Error('Missing required parameters for logActivity');
  }

  if (!database) {
    console.error(`[${new Date().toISOString()}] logActivity: Database not initialized`);
    throw new Error('Database not initialized');
  }

  try {
    const activityRef = ref(database, `activity_log/${userId}`);
    const newActivityRef = push(activityRef);
    const activityData = {
      message: `${message} by ${organizationName || 'Admin'}`,
      submissionId,
      userId,
      organization: organizationName || 'Admin',
      timestamp: serverTimestamp(),
    };
    await set(newActivityRef, activityData);
  } catch (error) {
    console.error(`[${new Date().toISOString()}] Error logging activity:`, error.message, error.code || 'N/A');
    throw error;
  }
};

export const logSubmission = async (collection, data, submissionId, organizationName, userId) => {
  if (!collection || !data || !submissionId || !userId) {
    console.error(`[${new Date().toISOString()}] logSubmission: Missing required parameters`, {
      collection,
      data,
      submissionId,
      organization: organizationName,
      userId,
    });
    throw new Error('Missing required parameters for logSubmission');
  }

  if (!database) {
    console.error(`[${new Date().toISOString()}] logSubmission: Database not initialized`);
    throw new Error('Database not initialized');
  }

  try {
    const submissionRef = ref(database, `submission_history/${userId}/${submissionId}`);
    const submissionData = {
      collection,
      data,
      submissionId,
      organization: organizationName || 'Admin',
      userId,
      timestamp: serverTimestamp(),
    };
    await set(submissionRef, submissionData);
  } catch (error) {
    console.error(`[${new Date().toISOString()}] Error logging submission for ${collection}:`, error.message, error.code || 'N/A');
    throw error;
  }
};