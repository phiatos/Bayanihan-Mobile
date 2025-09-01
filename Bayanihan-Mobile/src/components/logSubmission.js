import { ref, push, set } from 'firebase/database';
import { database } from '../configuration/firebaseConfig';

export const logActivity = async (userId, message, submissionId, organizationName) => {
  if (!userId || !message || !submissionId || !organizationName) {
    console.error(`[${new Date().toISOString()}] logActivity: Missing required parameters`, { userId, message, submissionId, organizationName });
    throw new Error('Missing required parameters for logActivity');
  }

  if (!database) {
    console.error(`[${new Date().toISOString()}] logActivity: Database not initialized`);
    throw new Error('Database not initialized');
  }

  try {
    const activityRef = ref(database, 'activityLogs');
    const newActivityRef = push(activityRef);
    const activityData = {
      userId,
      message,
      submissionId,
      organization: organizationName,
      timestamp: new Date().toISOString(),
    };
    await set(newActivityRef, activityData);
    console.log(`[${new Date().toISOString()}] Activity logged:`, activityData);
  } catch (error) {
    console.error(`[${new Date().toISOString()}] Error logging activity:`, error.message, error.code || 'N/A');
    throw error;
  }
};

export const logSubmission = async (collection, data, submissionId, organizationName) => {
  if (!collection || !data || !submissionId || !organizationName) {
    console.error(`[${new Date().toISOString()}] logSubmission: Missing required parameters`, { collection, data, submissionId, organizationName });
    throw new Error('Missing required parameters for logSubmission');
  }

  if (!database) {
    console.error(`[${new Date().toISOString()}] logSubmission: Database not initialized`);
    throw new Error('Database not initialized');
  }

  try {
    const submissionRef = ref(database, `submissions/${collection}`);
    const newSubmissionRef = push(submissionRef);
    const submissionData = {
      ...data,
      submissionId,
      organization: organizationName,
      timestamp: new Date().toISOString(),
    };
    await set(newSubmissionRef, submissionData);
    console.log(`[${new Date().toISOString()}] Submission logged for ${collection}:`, submissionData);
  } catch (error) {
    console.error(`[${new Date().toISOString()}] Error logging submission for ${collection}:`, error.message, error.code || 'N/A');
    throw error;
  }
};