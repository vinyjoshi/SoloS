import admin from 'firebase-admin';
import * as dotenv from 'dotenv';
import axios from 'axios';

dotenv.config();

// Initialize Firebase Admin if not already initialized
if (!admin.apps.length) {
  const serviceAccount = require('./serviceAccountKey.json');
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}
const db = admin.firestore();

// ... existing code ...
  // CORS headers
  res.setHeader("Access-Control-Allow-Credentials", true);
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");

  if (req.method === "OPTIONS") {
    res.status(200).end();
    return;
  }

  if (req.method !== "POST") {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    // Log payload for debugging
    console.log('PayPal webhook received:', req.body);

    // TODO: Verify the webhook/IPN with PayPal before trusting it.
    // For IPN: send back the payload with cmd=_notify-validate to
    // https://ipnpb.paypal.com/cgi-bin/webscr (or sandbox url for testing)
    // and check that the response is 'VERIFIED'.

    // For REST Webhooks: validate using the webhook-id, transmission-id, transmission-time,
    // and signature with the PayPal SDK or verification endpoint.
    
// We'll use the raw body for verification
    const rawBody = JSON.stringify(req.body);

    // 1. Validate with PayPal (IPN verification)
    // We send 'cmd=_notify-validate' + original body to PayPal
    const verifyPayload = `cmd=_notify-validate&${rawBody}`;
    
    // Use PayPal's sandbox URL if testing, live URL for production
    const paypalVerifyUrl = process.env.PAYPAL_BASE_URL === 'sandbox' 
      ? 'https://ipnpb.sandbox.paypal.com/cgi-bin/webscr'
      : 'https://ipnpb.paypal.com/cgi-bin/webscr';

    const response = await axios.post(paypalVerifyUrl, verifyPayload);

    if (response.data !== 'VERIFIED') {
      throw new Error('PayPal verification failed: ' + response.data);
    }

    // After verification, find the user by custom field or invoice and update Firestore
    const event = req.body;
    // Assuming custom field in PayPal payload maps to a Firestore document ID
    const userId = event.custom; // PayPal IPN 'custom' field
    
    if (userId) {
      await db.collection('users').doc(userId).update({
        paymentStatus: 'paid',
        paymentDate: admin.firestore.FieldValue.serverTimestamp(),
        lastPaymentId: event.txn_id
      });
      console.log(`✅ PayPal payment verified and Firestore updated for user: ${userId}`);
    }

    res.status(200).json({ success: true, message: 'Webhook verified and processed'});
  } catch (err) {
    console.error('paypal-webhook error:', err);
    try {
      await db.collection('errors').add({
        source: 'paypal-webhook',
        error: err.message,
        timestamp: admin.firestore.FieldValue.serverTimestamp()
      });
    } catch (dbErr) {
      console.error('Failed to log error to Firestore', dbErr);
    }
    res.status(500).json({ error: 'Webhook processing failed', details: err.message });
  }
}
