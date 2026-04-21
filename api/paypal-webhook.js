import admin from 'firebase-admin';
import * as dotenv from 'dotenv';

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
    
    // VERIFICATION LOGIC HERE:
    // This is a placeholder for the actual PayPal verification call.
    // Replace this with: 
    // const response = await fetch(paypalVerifyUrl, { ... });
    // if (await response.text() !== 'VERIFIED') throw new Error('Not verified');

    // After verification, find the user by custom field or invoice and update Firestore
    const event = req.body;
    // Assuming custom field in PayPal payload maps to a Firestore document ID or user email
    // const userId = event.resource.custom_id; 
    // await db.collection('users').doc(userId).update({ paid: true });

    res.status(200).json({ success: true, message: 'Webhook verified and processed'});
  } catch (err) {
    console.error('paypal-webhook error:', err);
    res.status(500).json({ error: 'Webhook processing failed', details: err.message });
  }
}
