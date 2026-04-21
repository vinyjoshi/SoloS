import admin from 'firebase-admin';
import * as dotenv from 'dotenv';
import crypto from 'crypto';

dotenv.config();

// Initialize Firebase Admin if not already initialized
if (!admin.apps.length) {
  const serviceAccount = require('./serviceAccountKey.json');
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}
const db = admin.firestore();

export default async function handler(req, res) {
