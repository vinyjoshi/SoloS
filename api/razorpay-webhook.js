
const crypto = require('crypto');
const { buffer } = require('micro');
const { getFirestore, doc, setDoc, serverTimestamp } = require('firebase-admin/firestore');
const { initializeApp, cert } = require('firebase-admin/app');

const { normalizePlan, SubscriptionType } = require('../src/lib/subscription');

// --- CONFIGURATION ---

// IMPORTANT: Replace with your actual webhook secret from environment variables
const WEBHOOK_SECRET = process.env.RAZORPAY_WEBHOOK_SECRET;

// Firebase Admin SDK configuration
// IMPORTANT: Ensure you have the service account credentials in your environment
const serviceAccount = JSON.parse(process.env.FIREBASE_ADMIN_SDK_CONFIG);

// Initialize Firebase Admin SDK
if (!admin.apps.length) {
    initializeApp({
        credential: cert(serviceAccount),
    });
}

const db = getFirestore();
const appId = 'solos-web'; // Or retrieve dynamically if needed

// --- WEBHOOK HANDLER ---

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  // 1. Verify the webhook signature
  const receivedSignature = req.headers['x-razorpay-signature'];
  const requestBody = await buffer(req);

  try {
    validateWebhookSignature(requestBody, receivedSignature, WEBHOOK_SECRET);
  } catch (error) {
    console.error('Webhook signature validation failed:', error.message);
    return res.status(400).json({ error: 'Invalid signature' });
  }

  // 2. Process the event payload
  const event = JSON.parse(requestBody.toString());
  const { event: eventName, payload } = event;

  if (eventName !== 'payment.captured') {
    return res.status(200).json({ message: 'Event received, but not a payment capture event.' });
  }

  const { payment } = payload;
  const { order_id: orderId, id: paymentId, notes } = payment;
  const { plan: planName, userId } = notes;

  if (!userId || !planName) {
    console.error('Missing userId or planName in payment notes', { orderId, paymentId });
    return res.status(400).json({ error: 'Missing required data in payment notes.' });
  }

  const normalizedPlan = normalizePlan(planName);
  if (!normalizedPlan) {
    console.error('Invalid plan name in payment notes:', planName);
    return res.status(400).json({ error: 'Invalid plan name.' });
  }

  // 3. Update the user's subscription in Firestore
  try {
    await updateUserSubscription(userId, normalizedPlan, paymentId, orderId);
    console.log(`Successfully updated subscription for user ${userId} to ${normalizedPlan}`);
    res.status(200).json({ success: true, message: 'Subscription updated successfully.' });
  } catch (error) {
    console.error('Failed to update user subscription:', error);
    res.status(500).json({ error: 'An internal error occurred while updating the subscription.' });
  }
};

// --- HELPER FUNCTIONS ---

/**
 * Validates the Razorpay webhook signature.
 * @param {Buffer} body The raw request body.
 * @param {string} signature The received signature from the 'x-razorpay-signature' header.
 * @param {string} secret The webhook secret.
 */
function validateWebhookSignature(body, signature, secret) {
  const hmac = crypto.createHmac('sha256', secret);
  hmac.update(body);
  const expectedSignature = hmac.digest('hex');

  if (expectedSignature !== signature) {
    throw new Error('Webhook signature does not match.');
  }
}

/**
 * Updates the user's subscription details in Firestore.
 * @param {string} userId The ID of the user to update.
 * @param {SubscriptionType} plan The normalized subscription plan.
 * @param {string} paymentId The Razorpay payment ID.
 * @param {string} orderId The Razorpay order ID.
 */
async function updateUserSubscription(userId, plan, paymentId, orderId) {
  const userRef = doc(db, 'artifacts', appId, 'users', userId, 'settings', 'profile');

  const expiresAt = calculateExpirationDate(plan);

  const subscriptionData = {
    tier: plan,
    plan: plan,
    paymentId: paymentId,
    orderId: orderId,
    source: 'razorpay',
    lastPayment: serverTimestamp(),
    purchasedAt: serverTimestamp(),
    expiresAt: expiresAt,
    status: 'active',
  };

  await setDoc(userRef, subscriptionData, { merge: true });
}

/**
 * Calculates the expiration date for a subscription plan.
 * @param {SubscriptionType} plan The normalized subscription plan.
 * @returns {Date}
 */
function calculateExpirationDate(plan) {
  const now = new Date();
  let expiresAt = new Date(now);

  switch (plan) {
    case SubscriptionType.PRO: // Monthly plan
      expiresAt.setMonth(now.getMonth() + 1);
      break;
    case SubscriptionType.LIFETIME:
      expiresAt.setFullYear(now.getFullYear() + 100); // Effectively lifetime
      break;
    default:
      expiresAt.setMonth(now.getMonth() + 1); // Default to 1 month for any other pro-level plan
      break;
  }
  return expiresAt;
}
