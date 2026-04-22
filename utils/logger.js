import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../constants';

export const logErrorToFirestore = async (error, context = {}) => {
  try {
    await addDoc(collection(db, 'errors'), {
      error: error.message || error,
      context,
      timestamp: serverTimestamp(),
    });
  } catch (e) {
    console.error('Failed to log to Firestore:', e);
  }
};
