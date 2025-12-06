// Optional: Payment verification webhook handler
// This verifies payment signatures to prevent fraud

import crypto from 'crypto';

export default async function handler(req, res) {
  // CORS headers
  res.setHeader("Access-Control-Allow-Credentials", true);
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  
  if (req.method === "OPTIONS") {
    res.status(200).end();
    return;
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    // Get the Razorpay signature from headers
    const signature = req.headers['x-razorpay-signature'];
    
    if (!signature) {
      return res.status(400).json({ error: "Missing signature" });
    }

    // Get webhook secret from environment
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
    
    if (!webhookSecret) {
      console.error("RAZORPAY_WEBHOOK_SECRET not configured");
      return res.status(500).json({ error: "Webhook not configured" });
    }

    // Verify signature
    const expectedSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(JSON.stringify(req.body))
      .digest('hex');

    if (signature !== expectedSignature) {
      console.error("Invalid webhook signature");
      return res.status(400).json({ error: "Invalid signature" });
    }

    // Parse webhook event
    const event = req.body.event;
    const payload = req.body.payload.payment.entity;

    console.log(`Webhook received: ${event}`);
    console.log(`Payment ID: ${payload.id}`);
    console.log(`Order ID: ${payload.order_id}`);
    console.log(`Amount: ₹${payload.amount / 100}`);

    // Handle different events
    switch (event) {
      case 'payment.captured':
        // Payment successful - you can update your database here
        console.log(`✅ Payment captured: ${payload.id}`);
        
        // TODO: Update Firestore with payment confirmation
        // This requires Firebase Admin SDK in serverless environment
        
        res.status(200).json({ 
          success: true,
          message: "Payment processed" 
        });
        break;

      case 'payment.failed':
        console.log(`❌ Payment failed: ${payload.id}`);
        console.log(`Error: ${payload.error_description}`);
        
        res.status(200).json({ 
          success: true,
          message: "Payment failure recorded" 
        });
        break;

      default:
        console.log(`Unhandled event: ${event}`);
        res.status(200).json({ 
          success: true,
          message: "Event received" 
        });
    }

  } catch (error) {
    console.error("Webhook processing error:", error);
    res.status(500).json({ 
      error: "Webhook processing failed",
      message: error.message 
    });
  }
}
