import crypto from 'crypto';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') { res.status(200).end(); return; }
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ error: 'Missing payment verification fields' });
    }

    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    if (!keySecret) {
      console.error('RAZORPAY_KEY_SECRET not configured');
      return res.status(500).json({ error: 'Payment verification not configured' });
    }

    // Verify signature
    const body = razorpay_order_id + '|' + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac('sha256', keySecret)
      .update(body)
      .digest('hex');

    if (expectedSignature !== razorpay_signature) {
      console.error('Signature mismatch');
      return res.status(400).json({ error: 'Invalid payment signature' });
    }

    console.log(`✅ Payment verified: ${razorpay_payment_id}`);
    return res.status(200).json({
      success: true,
      paymentId: razorpay_payment_id,
      orderId: razorpay_order_id,
    });

  } catch (error) {
    console.error('Verification error:', error);
    return res.status(500).json({ error: 'Payment verification failed' });
  }
}